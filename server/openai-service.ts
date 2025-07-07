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
        model: "gpt-4o-search-preview",
        web_search_options: {
          user_location: {
            type: "approximate",
            approximate: {
              country: "US", // adjust as needed
              city: "YourCity",
              region: "YourState",
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
          }
        },
        messages: [
          {
            role: "system",
            content: `
      You are a real-time, non-partisan research assistant with live web browsing capability using URL citations.

      🚫 If you cannot access live data or URLs, STOP and respond: "ERROR: Live browsing failed. No report generated."

      ✅ FIRST STEP: Immediately run a web search for the topic via your tool. Only proceed if you retrieve at least 3 credible sources with real URLs (captured via annotations).

      ---

      Please return **ONLY** valid JSON in this exact schema (no extra text, no markdown formatting):
      {
        "article": {
          "id": number,
          "title": "string",
          "excerpt": "string",
          "heroImageUrl": "string",
          "content": "string",
          "author": "string",
          "publishedAt": "string",
          "readTime": number,
          "category": "string",
          "slug": "string"
        },
        "executiveSummary": {
          "id": number,
          "articleId": number,
          "keyPoints": ["string"],
          "impact": "string",
          "stakeholders": ["string"]
        },
        "timelineItems": [
          {
            "id": number,
            "articleId": number,
            "date": "string",
            "title": "string",
            "description": "string",
            "url": "string"
          }
        ],
        "rawFacts": [
          {
            "id": number,
            "articleId": number,
            "category": "string",
            "fact": "string",
            "source": "string",
            "url": "string"
          }
        ],
        "perspectives": [
          {
            "id": number,
            "articleId": number,
            "viewpoint": "string",
            "author": "string",
            "organization": "string",
            "stance": "string",
            "quote": "string",
            "url": "string"
          }
        ],
        "citedSources": [
          {
            "id": number,
            "articleId": number,
            "title": "string",
            "url": "string",
            "source": "string",
            "publishedAt": "string",
            "description": "string"
          }
        ]
      }

      💡 IMPORTANT:
      - All quotes/facts/time entries must link to real URLs via **inline URL citations**.
      - Rely **only** on real-time live sources.
      - Use at least 3 distinct outlets or docs with URL citations in the content.
      - If browsing fails, output **only** the error and stop.
      `
          },
          {
            role: "user",
            content: `Generate a comprehensive research report on: ${query}`
          }
        ],

        max_tokens: 2000
      });

      // Extract response
      const { message } = response.choices[0];
      console.log('Raw response:', message.content);
      
      // Optional: inspect annotations directly
      console.log('Annotations:', response.choices[0].message.annotations);

      // Parse JSON response - clean up any markdown formatting
      let cleanContent = message.content || '{}';
      
      // Remove markdown code blocks if present
      if (cleanContent.includes('```json')) {
        cleanContent = cleanContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }
      
      // Extract JSON from the response if it contains extra text
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      // Remove any leading/trailing whitespace
      cleanContent = cleanContent.trim();
      
      let reportData;
      try {
        reportData = JSON.parse(cleanContent);
        console.log('Parsed report data successfully');
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Content that failed to parse:', cleanContent);
        throw new Error(`Failed to parse OpenAI response as JSON: ${parseError.message}`);
      }
      
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