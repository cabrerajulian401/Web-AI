import OpenAI from "openai";
import type { Article, ExecutiveSummary, TimelineItem, RelatedArticle, RawFacts, Perspective } from "@shared/schema";
import { pexelsService } from "./pexels-service";
import { RSSService } from "./rss-service";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ResearchReport {
  article: Article;
  executiveSummary: ExecutiveSummary;
  timelineItems: TimelineItem[];
  relatedArticles: RelatedArticle[];
  rawFacts: RawFacts[];
  perspectives: Perspective[];
}

export class OpenAIResearchService {
  
  // Real news search using RSS feeds
  async searchRealNews(query: string, limit: number = 6): Promise<any[]> {
    try {
      // Use RSS service to get real news articles
      const rssService = new RSSService();
      const articles = await rssService.fetchArticles();
      
      // Filter articles based on query relevance and limit results
      const relevantArticles = articles
        .filter(article => {
          const searchTerm = query.toLowerCase();
          const title = article.title.toLowerCase();
          const excerpt = article.excerpt.toLowerCase();
          return title.includes(searchTerm) || excerpt.includes(searchTerm);
        })
        .slice(0, limit);
      
      // If no relevant articles found, return recent articles
      if (relevantArticles.length === 0) {
        console.log('No relevant articles found for query, returning recent articles');
        return articles.slice(0, limit).map((article: any) => ({
          title: article.title,
          excerpt: article.excerpt,
          url: `https://example.com/article/${article.slug}`, // RSS articles don't have external URLs
          source: article.category || 'Political News',
          publishedAt: article.publishedAt
        }));
      }
      
      return relevantArticles.map((article: any) => ({
        title: article.title,
        excerpt: article.excerpt,
        url: `https://example.com/article/${article.slug}`, // RSS articles don't have external URLs
        source: article.category || 'Political News',
        publishedAt: article.publishedAt
      }));
    } catch (error) {
      console.error('Error searching RSS feeds:', error);
      return [];
    }
  }

  async generateResearchReport(query: string, heroImageUrl?: string): Promise<ResearchReport> {
    try {
      // First, search for related news articles using RSS feeds
      console.log('\n=== RSS FEED SEARCH ===');
      console.log('Query:', query);
      console.log('Using RSS feeds for authentic news...');
      
      const searchResults = await this.searchRealNews(query, 6);
      console.log('Articles found:', searchResults.length);
      
      if (searchResults.length > 0) {
        searchResults.forEach((article, index) => {
          console.log(`\nArticle ${index + 1}:`);
          console.log('  Title:', article.title);
          console.log('  Source:', article.source);
          console.log('  URL:', article.url);
          console.log('  Published:', article.publishedAt);
          console.log('  URL valid format:', article.url?.startsWith('http') ? 'YES' : 'NO');
        });
      } else {
        console.log('No articles returned from RSS feed search');
      }
      console.log('=== END RSS FEED SEARCH ===\n');
      
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
      "description": "string"
    }
  ],
  "rawFacts": [
    {
      "category": "string (organize by source - government documents, public officials, press releases, etc.)",
      "fact": "string (raw facts from primary sources ONLY. Direct quotes, literal concrete propositions from documents, statements from those involved. Include document names and speakers)",
      "source": "string (exact document name or speaker + source)"
    }
  ],
  "perspectives": [
    {
      "viewpoint": "string (clear headline labeling the perspective group - write as snappy headline outlets could've posted, avoid using 'viewpoint' in titles)",
      "description": "string (1 bullet point summary of view with real quotes and outlet names)",
      "source": "string (publisher name)",
      "quote": "string (actual quote from the source)"
    }
  ]
}

Research Guidelines:
1. Executive Summary: Short, simple bullet points in plain English, no complete sentences
2. Raw Facts: Primary sources ONLY - government documents, public officials, original press releases. NOT Wikipedia or intermediary reporting. Organize by source.
3. Timeline: Chronological bullet points of key events
4. Different Perspectives: Research articles with opposing/different takes. Organize into distinct viewpoint groups with snappy headlines. Include real quotes and outlet names.
5. Conflicting Info: Identify conflicts between viewpoints with sources vs opposing sources format.

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
          description: item.description
        })),
        relatedArticles: await Promise.all(searchResults.map(async (article: any, index: number) => {
          // Fetch image from Pexels based on article title with unique index
          // Use index + 1 to ensure different images from the main hero image (index 0)
          const imageUrl = await pexelsService.searchImageByTopic(article.title, index + 1);
          
          return {
            id: Date.now() + index,
            articleId: Date.now(),
            title: article.title, // Use the exact title from web search results (black text)
            excerpt: article.excerpt, // Use the description from web search results (gray text)
            url: article.url,
            source: article.source,
            imageUrl: imageUrl
          };
        })),
        rawFacts: this.groupRawFactsByCategory(reportData.rawFacts),
        perspectives: reportData.perspectives.map((perspective: any, index: number) => ({
          id: Date.now() + index,
          articleId: Date.now(),
          viewpoint: perspective.viewpoint,
          description: perspective.description,
          source: perspective.source,
          quote: perspective.quote
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
      // Add the fact with source annotation
      const factWithSource = item.source ? `${item.fact} (${item.source})` : item.fact;
      acc[category].push(factWithSource);
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