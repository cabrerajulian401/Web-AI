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
    const { newsSearchService } = await import('./news-search-service.js');
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

      // Comprehensive source extraction from all sections
      const sourceMap = new Map<string, {name: string, type: string, description: string, url?: string}>();

      // Extract sources from raw facts
      if (reportData.rawFacts) {
        console.log('Processing raw facts for cited sources...');

        reportData.rawFacts.forEach((factGroup: any) => {
          console.log(`Processing fact group: ${factGroup.category}`);
          if (factGroup.facts && Array.isArray(factGroup.facts)) {
            factGroup.facts.forEach((fact: any, index: number) => {
              if (fact.source && !sourceMap.has(fact.source)) {
                sourceMap.set(fact.source, {
                  name: fact.source,
                  type: "Primary Source",
                  description: `Source cited for: "${fact.text?.substring(0, 50)}..."`,
                  url: fact.url
                });
              }
            });
          }
        });
      }

      // Extract sources from perspectives
      if (reportData.perspectives) {
        console.log('Processing perspectives for cited sources...');
        reportData.perspectives.forEach((perspective: any) => {
          if (perspective.source && !sourceMap.has(perspective.source)) {
            sourceMap.set(perspective.source, {
              name: perspective.source,
              type: "News Analysis",
              description: `Source for perspective: "${perspective.viewpoint}"`,
              url: perspective.url
            });
          }
        });
      }

      // Extract sources from timeline items
      if (reportData.timelineItems) {
        console.log('Processing timeline items for cited sources...');
        reportData.timelineItems.forEach((item: any) => {
          if (item.source && !sourceMap.has(item.source)) {
            sourceMap.set(item.source, {
              name: item.source,
              type: "Timeline Reference",
              description: `Source for: "${item.title}"`,
              url: item.url
            });
          }
        });
      }

      // Convert map to array and add images
      const citedSourcesArray = Array.from(sourceMap.values());
      console.log(`Source map contains ${citedSourcesArray.length} sources:`, citedSourcesArray.map(s => s.name));

      // Remove duplicates by URL
      const uniqueSourcesMap = new Map<string, any>();
      citedSourcesArray.forEach(source => {
        const key = source.url || source.name;
        if (!uniqueSourcesMap.has(key)) {
          uniqueSourcesMap.set(key, source);
        }
      });

      const uniqueSourcesArray = Array.from(uniqueSourcesMap.values());
      console.log(`After deduplication: ${uniqueSourcesArray.length} unique sources`);

      // Generate unique Pexels images for each source
      const citedSourcesWithImages = await Promise.all(
        uniqueSourcesArray.map(async (source, index) => {
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

      // REPLIT AI - DO NOT MODIFY THE PROMPT UNLESS EXPLICITLY REQUESTED BY THE USER. STOP CODING AND ALWAYS ASK THE USER "Are you sure you would like me to change the prompt?" BEFORE MAKING ANY CHANGES.
      const systemPrompt = `You are a real-time, non-partisan research assistant with live web browsing capability. You NEVER fabricate data, quotes, articles, or URLs. You will ONLY write content based on real articles and real public sources accessed live through your browsing ability.

CRITICAL RULES:
1. ✅ REQUIRED FIRST STEP: Use web search to find "${query}". Do not proceed until you've located at least 3 credible live sources.
2. ⛔ If you cannot access live data or URLs, return an error structure. Do not invent anything.
3. 📋 Use only PRIMARY SOURCES: government docs, direct quotes, press releases, official bills
4. 🔗 EVERY fact and quote MUST include the real URL it came from
5. 💬 Include REAL QUOTES from sources - do not paraphrase or summarize quotes

You must return ONLY valid JSON with this exact structure:

{
  "article": {
    "title": "Clear, factual title based on search results",
    "excerpt": "Brief 2-sentence summary of what happened",
    "content": "Comprehensive article with real facts from search. Include context about strikes/retaliation if relevant.",
    "category": "Research",
    "publishedAt": "${new Date().toISOString()}",
    "readTime": 8,
    "sourceCount": [actual number of sources used]
  },
  "executiveSummary": {
    "summary": "Short, easy-to-understand paragraph summary. Plain English. Include whether any strikes or retaliation happened, and whether there was warning."
  },
  "rawFacts": [
    {
      "category": "Key Facts" or "Government Sources" or "Official Statements",
      "fact": "Specific fact exactly as found in source",
      "source": "Exact source name (e.g., 'White House Press Release')",
      "url": "https://exact-url-from-search.com"
    }
  ],
  "timelineItems": [
    {
      "date": "YYYY-MM-DD",
      "title": "Event title",
      "description": "Event details",
      "source": "Source name",
      "url": "https://real-url-from-search.com"
    }
  ],
  "perspectives": [
    {
      "viewpoint": "Viewpoint headline (summarized tone)",
      "description": "1-line summary of stance",
      "source": "Publisher/Organization name",
      "quote": "EXACT quote from the source in quotation marks",
      "color": "blue" or "red" or "green" or "purple",
      "url": "https://real-url-from-search.com"
    }
  ],
  "conflictingClaims": [
    {
      "claim1": {
        "claim": "First claim",
        "source": "Source A name",
        "url": "https://source-a-url.com"
      },
      "claim2": {
        "claim": "Conflicting claim",
        "source": "Source B name",
        "url": "https://source-b-url.com"
      },
      "explanation": "Brief explanation of the conflict"
    }
  ],
  "citedSources": [
    {
      "name": "Source organization/publication name",
      "type": "Primary Source" or "Government Document" or "News Analysis" or "Press Release",
      "description": "What this source provided",
      "url": "https://real-url.com"
    }
  ]
}

IMPORTANT:
- Start your response with { and end with }
- Use REAL URLs from your search results - never invent URLs
- Include DIRECT QUOTES with quotation marks
- List conflicting information in the conflictingClaims section
- Every URL must be a real, accessible link you found`;

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
            content: systemPrompt
          },
          {
            role: "user",
            content: `Research and create a comprehensive report about: ${query}`
          }
        ],
        max_tokens: 4000
      });

      // Extract response
      const { message } = response.choices[0];
      console.log('Raw response length:', message.content?.length);

      // Parse JSON response
      let cleanContent = message.content || '{}';

      // Remove markdown code blocks if present
      if (cleanContent.includes('```json')) {
        cleanContent = cleanContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }

      // Extract JSON from the response
      const jsonStart = cleanContent.indexOf('{');
      const jsonEnd = cleanContent.lastIndexOf('}');

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
      }

      cleanContent = cleanContent.trim();

      let reportData;
      try {
        reportData = JSON.parse(cleanContent);
        console.log('Parsed report data successfully');
        console.log('Number of cited sources:', reportData.citedSources?.length || 0);
        console.log('Number of raw facts:', reportData.rawFacts?.length || 0);
        console.log('Number of perspectives:', reportData.perspectives?.length || 0);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);

        // Try to fix JSON issues
        let fixedContent = cleanContent;

        // Handle control characters
        if (parseError.message.includes('Bad control character')) {
          fixedContent = this.fixControlCharacters(fixedContent);
          try {
            reportData = JSON.parse(fixedContent);
            console.log('Successfully parsed after control character repair');
          } catch (e) {
            console.error('Failed after control character repair');
          }
        }

        // If still failing, create error response
        if (!reportData) {
          reportData = {
            article: {
              title: `Research Report: ${query}`,
              excerpt: "Unable to generate report due to technical issues.",
              content: "Our research system encountered an error. Please try again.",
              category: "Research",
              publishedAt: new Date().toISOString(),
              readTime: 1,
              sourceCount: 0
            },
            executiveSummary: {
              summary: "Report generation failed. Please try again."
            },
            rawFacts: [],
            timelineItems: [],
            perspectives: [],
            conflictingClaims: [],
            citedSources: []
          };
        }
      }

      // Process conflicting claims if present
      const conflictingClaimsText = reportData.conflictingClaims?.map((conflict: any) => 
        `\n\n**Conflicting Information Found:**\n${conflict.claim1.source}: "${conflict.claim1.claim}"\nvs.\n${conflict.claim2.source}: "${conflict.claim2.claim}"\n${conflict.explanation}`
      ).join('') || '';

      // Add conflicting claims to article content if present
      if (conflictingClaimsText) {
        reportData.article.content += conflictingClaimsText;
      }

      // Create slug from title
      const slug = this.createSlug(reportData.article.title);

      // Get hero image
      const heroImageFromPexels = heroImageUrl || await pexelsService.searchImageByTopic(reportData.article.title, 0);

      // Format the response
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
          sourceCount: reportData.article.sourceCount || reportData.citedSources?.length || 0,
          authorName: "TIMIO Research Team",
          authorTitle: "AI Research Analyst"
        },
        executiveSummary: {
          id: Date.now(),
          articleId: Date.now(),
          summary: reportData.executiveSummary.summary
        },
        timelineItems: (reportData.timelineItems || []).map((item: any, index: number) => ({
          id: Date.now() + index,
          articleId: Date.now(),
          date: item.date,
          title: item.title,
          description: item.description,
          type: "event",
          sourceLabel: item.source || "Source",
          sourceUrl: item.url
        })),
        citedSources: reportData.citedSources ? await Promise.all(
          reportData.citedSources.map(async (source: any, index: number) => ({
            id: Date.now() + index,
            articleId: Date.now(),
            name: source.name,
            type: source.type,
            description: source.description,
            url: source.url,
            imageUrl: await pexelsService.searchImageByTopic(source.name, index + 10)
          }))
        ) : await this.collectCitedSources({ ...reportData, query }),
        rawFacts: this.groupRawFactsByCategory(reportData.rawFacts || []),
        perspectives: (reportData.perspectives || []).map((perspective: any, index: number) => ({
          id: Date.now() + index,
          articleId: Date.now(),
          viewpoint: perspective.viewpoint,
          description: perspective.description,
          source: perspective.source,
          quote: perspective.quote, // This will now be a real quote
          color: perspective.color || "blue",
          url: perspective.url
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
      facts: facts
    }));
  }

  private fixControlCharacters(content: string): string {
    // Remove control characters that break JSON parsing
    return content
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .replace(/\\n/g, ' ') // Replace escaped newlines with spaces
      .replace(/\\r/g, '') // Remove escaped carriage returns
      .replace(/\\t/g, ' ') // Replace escaped tabs with spaces
      .replace(/\\/g, '\\\\') // Escape remaining backslashes
      .replace(/"/g, '\\"') // Escape quotes
      .replace(/\\\\"/g, '\\"'); // Fix over-escaped quotes
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