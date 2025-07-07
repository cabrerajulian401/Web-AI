import OpenAI from "openai";
import type { Article, ExecutiveSummary, TimelineItem, CitedSource, RawFacts, Perspective } from "@shared/schema";
import { pexelsService } from "./pexels-service";
import { RSSService } from "./rss-service";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ResearchReport {
  article: Article;
  executiveSummary: ExecutiveSummary;
  timelineItems: TimelineItem[];
  citedSources: CitedSource[];
  rawFacts: RawFacts[];
  perspectives: Perspective[];
}

export class OpenAIResearchService {
  
  // Search for real news articles from specific sources
  private async searchRealNewsArticles(query: string, sources: string[]): Promise<{ [sourceName: string]: string }> {
    const newsSearchService = require('./news-search-service').newsSearchService;
    const urlMap: { [sourceName: string]: string } = {};
    
    try {
      // Search for real articles related to the query
      const articles = await newsSearchService.searchNews(query, 10);
      
      // Match articles to our cited sources
      sources.forEach(sourceName => {
        const matchedArticle = articles.find((article: any) => 
          article.source.toLowerCase().includes(sourceName.toLowerCase()) ||
          sourceName.toLowerCase().includes(article.source.toLowerCase())
        );
        
        if (matchedArticle && matchedArticle.url) {
          urlMap[sourceName] = matchedArticle.url;
        }
      });
      
      console.log(`Found real article URLs for ${Object.keys(urlMap).length} sources`);
      return urlMap;
    } catch (error) {
      console.error('Error searching for real news articles:', error);
      return {};
    }
  }



  // Extract and collect all cited sources from the report
  async collectCitedSources(reportData: any): Promise<CitedSource[]> {
    try {
      // If OpenAI directly provided citedSources, use those
      if (reportData.citedSources && Array.isArray(reportData.citedSources) && reportData.citedSources.length > 0) {
        const citedSourcesWithImages = await Promise.all(
          reportData.citedSources.map(async (source: any, index: number) => {
            const imageUrl = await pexelsService.searchImageByTopic(source.name, index + 10);
            
            return {
              id: Date.now() + index,
              articleId: Date.now(),
              name: source.name,
              type: source.type,
              description: source.description,
              url: source.url,
              imageUrl: imageUrl
            };
          })
        );
        
        console.log(`Generated ${citedSourcesWithImages.length} cited sources with URLs from OpenAI`);
        return citedSourcesWithImages;
      }
      
      // Fallback: extract sources from other sections
      const sources = new Set<string>();
      const citedSourcesArray: any[] = [];
      
      // Extract sources from raw facts
      if (reportData.rawFacts) {
        reportData.rawFacts.forEach((factGroup: any) => {
          if (factGroup.facts) {
            factGroup.facts.forEach((fact: any) => {
              if (fact.source && !sources.has(fact.source)) {
                sources.add(fact.source);
                citedSourcesArray.push({
                  name: fact.source,
                  type: "Primary Source",
                  description: `Source cited for factual information about ${factGroup.category}`
                });
              }
            });
          }
        });
      }
      
      // Extract sources from perspectives
      if (reportData.perspectives) {
        reportData.perspectives.forEach((perspective: any) => {
          if (perspective.source && !sources.has(perspective.source)) {
            sources.add(perspective.source);
            citedSourcesArray.push({
              name: perspective.source,
              type: "News Analysis",
              description: `Source for perspective: "${perspective.viewpoint}"`
            });
          }
        });
      }
      
      // Extract sources from timeline items (if they have sources)
      if (reportData.timelineItems) {
        reportData.timelineItems.forEach((item: any) => {
          if (item.source && !sources.has(item.source)) {
            sources.add(item.source);
            citedSourcesArray.push({
              name: item.source,
              type: "Timeline Reference",
              description: `Source for timeline event: "${item.title}"`
            });
          }
        });
      }
      
      // Search for real news articles for these sources
      const sourceNames = citedSourcesArray.map(s => s.name);
      const realArticleUrls = await this.searchRealNewsArticles(reportData.query || '', sourceNames);
      
      // Generate unique Pexels images for each source
      const citedSourcesWithImages = await Promise.all(
        citedSourcesArray.map(async (source, index) => {
          // Use source name directly for Pexels search with unique index
          const imageUrl = await pexelsService.searchImageByTopic(source.name, index + 10);
          
          return {
            id: Date.now() + index,
            articleId: Date.now(),
            name: source.name,
            type: source.type,
            description: source.description,
            url: realArticleUrls[source.name] || null,
            imageUrl: imageUrl
          };
        })
      );
      
      console.log(`Generated ${citedSourcesWithImages.length} cited sources with unique images`);
      return citedSourcesWithImages;
    } catch (error) {
      console.error('Error collecting cited sources:', error);
      return [];
    }
  }

  async generateResearchReport(query: string, heroImageUrl?: string): Promise<ResearchReport> {
    try {
      console.log('\n=== GENERATING RESEARCH REPORT ===');
      console.log('Query:', query);
      console.log('Generating comprehensive report with cited sources...');
      
      // Then generate comprehensive research report
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Take on the role of an advanced non-partisan research AI.
Create a research report on the broader news story behind the user's search term.
Use your web search ability to get real info from the internet.

Return JSON in this exact format:
{
  "article": {
    "title": "string",
    "content": "string (detailed article content)",
    "category": "string", 
    "excerpt": "string",
    "heroImageUrl": "string (descriptive placeholder like 'https://via.placeholder.com/800x400/1e40af/white?text=Topic+Image')",
    "publishedAt": "string (ISO date)",
    "readTime": number,
    "sourceCount": number,
    "authorName": "TIMIO Research Team",
    "authorTitle": "AI Research Analyst"
  },
  "executiveSummary": {
    "summary": "string (Short, simple, easy to read, bullet point summary of event in plain English. Don't use complete sentences. Make sure you determine the cause and context of events)"
  },
  "timelineItems": [
    {
      "date": "string (YYYY-MM-DD)",
      "title": "string", 
      "description": "string",
      "sourceLabel": "string (source name)",
      "sourceUrl": "string (direct URL to source documenting this timeline event. Must be a real, working URL)"
    }
  ],
  "rawFacts": [
    {
      "category": "string (organize by source - government documents, public officials, press releases, etc.)",
      "fact": "string (raw facts from primary sources ONLY. Direct quotes, literal concrete propositions from documents, statements from those involved. Include document names and speakers)",
      "source": "string (exact document name or speaker + source)",
      "url": "string (direct URL to the specific source document, article, or page where this fact can be verified. Must be a real, working URL)"
    }
  ],
  "perspectives": [
    {
      "viewpoint": "string (clear headline labeling the perspective group - write as snappy headline outlets could've posted, avoid using 'viewpoint' in titles)",
      "description": "string (1 bullet point summary of view with real quotes and outlet names)",
      "source": "string (publisher name)",
      "quote": "string (actual quote from the source)",
      "url": "string (direct URL to the specific article or source where this quote appears. Must be a real, working URL)"
    }
  ],
  "citedSources": [
    {
      "name": "string (source name like 'CNN', 'Reuters', 'Congressional Budget Office')",
      "type": "string (type like 'News Report', 'Government Analysis', 'Press Release')",
      "description": "string (brief description of what this source provides)",
      "url": "string (direct URL to the specific article or document from this source. Must be a real, working URL)"
    }
  ]
}

Research Guidelines:
1. Executive Summary: Short, simple bullet points in plain English, no complete sentences. Make sure you determine the cause and if they came with/without warning
2. Raw Facts: Primary sources ONLY - government documents, public officials, original press releases. NOT Wikipedia or intermediary reporting. You may go to intermediary sites in your research, but get your data from their sources. No middle man organizations should be cited. If it is about a proposed law or bill, include raw facts directly from the document in question. Cite the name of the exact document or speaker they came from, + source. Organize by source. MUST include real URLs.
3. Timeline: Chronological bullet points of key events with source URLs for verification
4. Different Perspectives: Research articles with opposing/different takes. Consider what different views on this may be, and use search terms that would bring them up. Organize them into distinct, differing, and opposing groups based on their perspective. Begin each viewpoint group with one clear headline labeling, write it as if it were a snappy headline the outlets in the group could've posted. Avoid using the word viewpoint in titles. Include real quotes and outlet names with URLs.
5. Cited Sources: List all major sources referenced throughout the report with direct URLs to specific articles or documents
6. Review conflicting info or misconceptions if any. Prioritize conflicting claims between the different viewpoints you identified. This will be handled in the perspectives section.

CRITICAL: Every fact, quote, perspective, and timeline item MUST include a real, working URL where the information can be verified. Use web search to find authentic sources and their URLs.

If you are unable to browse a source, print "Error browsing source" instead of generating false info.

Use real, current information from authentic sources. Make reports comprehensive and non-partisan.`
          },
          {
            role: "user",
            content: `Generate a comprehensive research report on: ${query}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 4000
      });

      const reportData = JSON.parse(response.choices[0].message.content || "{}");
      
      // Create slug from title
      const slug = this.createSlug(reportData.article.title);
      
      // Get hero image from Pexels based on the main article title
      const heroImageFromPexels = heroImageUrl || await pexelsService.searchImageByTopic(reportData.article.title, 0);
      
      // Format the response to match our schema
      const report: ResearchReport = {
        article: {
          id: Date.now(),
          slug,
          title: reportData.article.title,
          content: reportData.article.content,
          category: reportData.article.category || "Research",
          excerpt: reportData.article.excerpt,
          heroImageUrl: heroImageFromPexels,
          publishedAt: reportData.article.publishedAt || new Date().toISOString(),
          readTime: reportData.article.readTime || 8,
          sourceCount: reportData.article.sourceCount || 12,
          authorName: reportData.article.authorName || "TIMIO Research Team",
          authorTitle: reportData.article.authorTitle || "AI Research Analyst"
        },
        executiveSummary: {
          id: Date.now(),
          articleId: Date.now(),
          summary: reportData.executiveSummary.summary
        },
        timelineItems: reportData.timelineItems.map((item: any, index: number) => ({
          id: Date.now() + index,
          articleId: Date.now(),
          date: item.date,
          title: item.title,
          description: item.description,
          type: "event",
          sourceLabel: item.sourceLabel || "Source",
          sourceUrl: item.sourceUrl || null
        })),
        citedSources: await this.collectCitedSources({ ...reportData, query }),
        rawFacts: this.groupRawFactsByCategory(reportData.rawFacts),
        perspectives: reportData.perspectives.map((perspective: any, index: number) => ({
          id: Date.now() + index,
          articleId: Date.now(),
          viewpoint: perspective.viewpoint,
          description: perspective.description,
          source: perspective.source,
          quote: perspective.quote,
          url: perspective.url || null
        }))
      };

      return report;
    } catch (error) {
      console.error('OpenAI Research Service Error:', error);
      throw new Error('Failed to generate research report');
    }
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
        url: item.url || null
      };
      acc[category].push(factData);
      return acc;
    }, {});

    // Convert to array format expected by schema
    return Object.entries(groupedFacts).map(([category, facts], index) => ({
      id: Date.now() + index,
      articleId: Date.now(),
      category,
      facts: facts as string[]
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

export const openAIResearchService = new OpenAIResearchService();