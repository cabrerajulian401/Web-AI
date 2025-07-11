import OpenAI from "openai";
import type { Article, TimelineItem, CitedSource, RawFacts, Perspective, ExecutiveSummary } from "@shared/schema";
import { pexelsService } from "./pexels-service";
import * as cheerio from "cheerio";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ResearchReport {
  article: Article;
  executiveSummary: ExecutiveSummary;
  timelineItems: TimelineItem[];
  citedSources: CitedSource[];
  rawFacts: RawFacts[];
  perspectives: Perspective[];
}

export interface ScrapedContent {
  title: string;
  content: string;
  quotes: string[];
  author?: string;
  date?: string;
  url: string;
}

export class EnhancedWebSearchAgent {
  
  async generateResearchReport(query: string, heroImageUrl?: string): Promise<ResearchReport> {
    try {
      console.log('\n=== ENHANCED WEB SEARCH AGENT: GENERATING REPORT ===');
      console.log('Query:', query);

      // Step 1: Get initial search results
      const searchResults = await this.performWebSearch(query);
      console.log(`Found ${searchResults.length} search results`);

      // Step 2: Scrape content from top results
      const scrapedContents = await this.scrapeTopResults(searchResults.slice(0, 5));
      console.log(`Successfully scraped ${scrapedContents.length} pages`);

      // Step 3: Extract quotes and facts from scraped content
      const extractedData = await this.extractQuotesAndFacts(scrapedContents, query);

      // Step 4: Generate comprehensive report
      const report = await this.generateReportFromData(extractedData, query, heroImageUrl);

      return report;
    } catch (error) {
      console.error("Enhanced Web Search Agent Error:", error);
      throw new Error(`Failed to generate research report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async performWebSearch(query: string): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-search-preview",
        web_search_options: {
          user_location: {
            type: "approximate",
            approximate: {
              country: "US",
              city: "Dallas",
              region: "Texas",
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
          }
        },
        messages: [
          {
            role: "system",
            content: "You are a web search assistant. Search for the query and return ONLY a JSON array of relevant URLs that would contain factual information, quotes, or primary sources. Return format: [\"url1\", \"url2\", \"url3\"]"
          },
          {
            role: "user",
            content: `Search for: ${query}. Return ONLY a JSON array of URLs.`
          }
        ],
        max_tokens: 1000
      });

      const content = response.choices[0].message.content || '[]';
      const urlMatch = content.match(/\[.*\]/);
      if (urlMatch) {
        return JSON.parse(urlMatch[0]);
      }
      return [];
    } catch (error) {
      console.error("Web search failed:", error);
      return [];
    }
  }

  private async scrapeTopResults(urls: string[]): Promise<ScrapedContent[]> {
    const scrapedContents: ScrapedContent[] = [];

    for (const url of urls) {
      try {
        console.log(`Scraping: ${url}`);
        const content = await this.scrapeWebPage(url);
        if (content) {
          scrapedContents.push(content);
        }
      } catch (error) {
        console.error(`Failed to scrape ${url}:`, error);
      }
    }

    return scrapedContents;
  }

  private async scrapeWebPage(url: string): Promise<ScrapedContent | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract title
      const title = $('title').text() || $('h1').first().text() || 'Unknown Title';

      // Extract main content (focus on article content)
      const content = $('article, .article, .content, .post, main, .main').text() || 
                     $('p').slice(0, 20).text() || // Fallback to first 20 paragraphs
                     $('body').text();

      // Extract quotes (text in quotes)
      const quotes: string[] = [];
      $('blockquote, q, .quote, [class*="quote"]').each((_, element) => {
        const quote = $(element).text().trim();
        if (quote.length > 20 && quote.length < 500) {
          quotes.push(quote);
        }
      });

      // Extract author
      const author = $('[class*="author"], .author, [rel="author"]').text() || 
                    $('meta[name="author"]').attr('content') || 
                    undefined;

      // Extract date
      const date = $('time').attr('datetime') || 
                  $('meta[property="article:published_time"]').attr('content') ||
                  $('[class*="date"], .date').text() ||
                  undefined;

      return {
        title: title.substring(0, 200),
        content: content.substring(0, 5000), // Limit content size
        quotes,
        author,
        date,
        url
      };
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      return null;
    }
  }

  private async extractQuotesAndFacts(scrapedContents: ScrapedContent[], query: string): Promise<any> {
    try {
      const contentSummary = scrapedContents.map(content => ({
        url: content.url,
        title: content.title,
        content: content.content.substring(0, 1000),
        quotes: content.quotes,
        author: content.author,
        date: content.date
      }));

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a research analyst. Extract factual information, quotes, and key insights from the provided web content about: ${query}

Return ONLY valid JSON with this structure:
{
  "rawFacts": [
    {
      "category": "Primary Sources",
      "fact": "Exact quote or fact from the source",
      "source": "Source name",
      "url": "https://source-url.com",
      "quote": "Exact quote if available"
    }
  ],
  "timelineItems": [
    {
      "date": "YYYY-MM-DD",
      "title": "Event title",
      "description": "Event details",
      "source": "Source name",
      "url": "https://source-url.com"
    }
  ],
  "perspectiveGroups": [
    {
      "viewpointHeadline": "Viewpoint name",
      "tone": "supportive/critical/neutral",
      "articles": [
        {
          "stance": "Summary of stance",
          "publisher": "Publisher name",
          "quote": "Exact quote from the source",
          "url": "https://source-url.com"
        }
      ]
    }
  ],
  "citedSources": [
    {
      "name": "Source organization",
      "type": "Primary Source",
      "description": "Description of the source",
      "url": "https://source-url.com"
    }
  ]
}`
          },
          {
            role: "user",
            content: `Extract information from these sources:\n\n${JSON.stringify(contentSummary, null, 2)}`
          }
        ],
        max_tokens: 3000
      });

      const content = response.choices[0].message.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {};
    } catch (error) {
      console.error("Error extracting quotes and facts:", error);
      return {};
    }
  }

  private async generateReportFromData(extractedData: any, query: string, heroImageUrl?: string): Promise<ResearchReport> {
    // Create slug from query
    const slug = this.createSlug(`Research Report: ${query}`);

    // Get hero image
    const heroImageFromPexels = heroImageUrl || await pexelsService.searchImageByTopic(query, 0);

    // Generate article content
    const articleContent = await this.generateArticleContent(extractedData, query);

    // Convert executive summary to points array format
    const executiveSummaryPoints = extractedData.executiveSummary
      ? extractedData.executiveSummary.split('\n').filter((point: string) => point.trim().length > 0)
      : ["Comprehensive research report based on multiple sources."];

    // Format the response
    const report: ResearchReport = {
      article: {
        id: Date.now(),
        slug,
        title: `Research Report: ${query}`,
        content: articleContent,
        category: "Research",
        excerpt: `Comprehensive analysis of ${query} based on multiple sources and verified quotes.`,
        heroImageUrl: heroImageFromPexels,
        publishedAt: new Date().toISOString(),
        readTime: 8,
        sourceCount: extractedData.citedSources?.length || 0,
        authorName: "TIMIO Research Team",
        authorTitle: "AI Research Analyst"
      },
      executiveSummary: {
        id: Date.now(),
        articleId: Date.now(),
        points: executiveSummaryPoints
      },
      timelineItems: (extractedData.timelineItems || []).map((item: any, index: number) => ({
        id: Date.now() + index,
        articleId: Date.now(),
        date: item.date,
        title: item.title,
        description: item.description,
        type: "event",
        sourceLabel: item.source || "Source",
        sourceUrl: item.url
      })),
      citedSources: await this.processCitedSources(extractedData.citedSources || []),
      rawFacts: this.groupRawFactsByCategory(extractedData.rawFacts || []),
      perspectives: this.extractPerspectivesFromGroups(extractedData.perspectiveGroups || [])
    };

    return report;
  }

  private async generateArticleContent(extractedData: any, query: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a professional research writer. Create a comprehensive, well-structured article based on the provided research data. Include proper citations and quotes."
          },
          {
            role: "user",
            content: `Create a comprehensive article about: ${query}

Use this research data:
${JSON.stringify(extractedData, null, 2)}

Write a well-structured article with:
- Introduction
- Key findings with quotes
- Timeline of events
- Different perspectives
- Conclusion

Include proper citations in markdown format: [Source Name](url)`
          }
        ],
        max_tokens: 2000
      });

      return response.choices[0].message.content || `Research report on ${query} based on multiple verified sources.`;
    } catch (error) {
      console.error("Error generating article content:", error);
      return `Comprehensive research report on ${query} based on multiple verified sources.`;
    }
  }

  private async processCitedSources(sources: any[]): Promise<CitedSource[]> {
    // Add images to all sources
    const sourcesWithImages = await Promise.all(
      sources.map(async (source, index) => ({
        id: Date.now() + index,
        articleId: Date.now(),
        name: source.name,
        type: source.type,
        description: source.description,
        url: source.url,
        imageUrl: await pexelsService.searchImageByTopic(source.name, index + 10)
      }))
    );
    
    return sourcesWithImages;
  }

  private extractPerspectivesFromGroups(perspectiveGroups: any[]): any[] {
    const perspectives: any[] = [];
    let index = 0;

    perspectiveGroups.forEach(group => {
      const groupColor = group.tone === 'supportive' ? 'green' : 
                        group.tone === 'critical' ? 'red' : 
                        group.tone === 'neutral' ? 'blue' : 'purple';

      group.articles?.forEach((article: any) => {
        perspectives.push({
          id: Date.now() + index++,
          articleId: Date.now(),
          viewpoint: group.viewpointHeadline,
          description: article.stance,
          source: article.publisher,
          quote: article.quote,
          color: groupColor,
          url: article.url
        });
      });
    });

    return perspectives;
  }

  private groupRawFactsByCategory(rawFactsArray: any[]): any[] {
    // Group raw facts by category
    const groupedFacts = rawFactsArray.reduce((acc: any, item: any) => {
      const category = item.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }

      // Add the fact with source annotation and URL
      const factData = {
        text: item.fact,
        source: item.source,
        url: item.url || null,
        quote: item.quote || null
      };
      acc[category].push(factData);
      return acc;
    }, {});

    // Convert to array format expected by schema
    return Object.entries(groupedFacts).map(([category, facts], index) => ({
      id: Date.now() + index,
      articleId: Date.now(),
      category,
      facts: facts
    }));
  }

  private createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }
}

export const enhancedWebSearchAgent = new EnhancedWebSearchAgent(); 