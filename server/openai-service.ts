import OpenAI from "openai";
import type { Article, ExecutiveSummary, TimelineItem, RelatedArticle, RawFacts, Perspective } from "@shared/schema";

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
  async generateResearchReport(query: string): Promise<ResearchReport> {
    try {
      // Generate comprehensive research report
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional research analyst. Generate a comprehensive research report based on the user's query. 
            
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
                "summary": "string (5-7 bullet points with key findings)"
              },
              "timelineItems": [
                {
                  "date": "string (YYYY-MM-DD)",
                  "title": "string",
                  "description": "string"
                }
              ],
              "relatedArticles": [
                {
                  "title": "string",
                  "url": "string (real URL)",
                  "source": "string",
                  "publishedAt": "string (ISO date)"
                }
              ],
              "rawFacts": [
                {
                  "category": "string",
                  "fact": "string",
                  "source": "string"
                }
              ],
              "perspectives": [
                {
                  "viewpoint": "string",
                  "description": "string",
                  "source": "string",
                  "quote": "string"
                }
              ]
            }
            
            Guidelines:
            - Use current, factual information
            - Include 5-8 timeline items in chronological order
            - Add 4-6 related articles with real URLs
            - Create 8-12 raw facts across 3-4 categories
            - Include 3-4 different perspectives
            - Make content authoritative and well-researched
            - Use proper dates and realistic details`
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
      
      // Format the response to match our schema
      const report: ResearchReport = {
        article: {
          id: Date.now(),
          slug,
          title: reportData.article.title,
          content: reportData.article.content,
          category: reportData.article.category || "Research",
          excerpt: reportData.article.excerpt,
          heroImageUrl: reportData.article.heroImageUrl || "https://via.placeholder.com/800x400/1e40af/white?text=Research+Report",
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
        relatedArticles: reportData.relatedArticles.map((article: any, index: number) => ({
          id: Date.now() + index,
          articleId: Date.now(),
          title: article.title,
          url: article.url,
          source: article.source,
          publishedAt: article.publishedAt
        })),
        rawFacts: reportData.rawFacts.map((fact: any, index: number) => ({
          id: Date.now() + index,
          articleId: Date.now(),
          category: fact.category,
          fact: fact.fact,
          source: fact.source
        })),
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