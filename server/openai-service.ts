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
        console.log(`Raw facts structure:`, JSON.stringify(reportData.rawFacts, null, 2));
        
        reportData.rawFacts.forEach((factGroup: any) => {
          console.log(`Processing fact group: ${factGroup.category}`);
          if (factGroup.facts && Array.isArray(factGroup.facts)) {
            factGroup.facts.forEach((fact: any, index: number) => {
              console.log(`Processing fact ${index}: ${fact.text?.substring(0, 50)}... Source: ${fact.source}`);
              if (fact.source && !sourceMap.has(fact.source)) {
                console.log(`Adding source to map: ${fact.source}`);
                sourceMap.set(fact.source, {
                  name: fact.source,
                  type: "Primary Source",
                  description: `Source cited for factual information`,
                  url: fact.url
                });
              } else if (fact.source) {
                console.log(`Source already exists in map: ${fact.source}`);
              } else {
                console.log(`Fact has no source: ${fact.text?.substring(0, 50)}...`);
              }
            });
          }
        });
      }

      // Also extract sources from raw facts if they're in string format (legacy)
      if (reportData.rawFacts && Array.isArray(reportData.rawFacts)) {
        reportData.rawFacts.forEach((factGroup: any) => {
          if (factGroup.facts && Array.isArray(factGroup.facts)) {
            factGroup.facts.forEach((fact: any) => {
              if (typeof fact === 'string') {
                // Skip string facts as they don't have source info
                return;
              }
              // Handle object facts with source info
              if (fact.source && !sourceMap.has(fact.source)) {
                sourceMap.set(fact.source, {
                  name: fact.source,
                  type: "Primary Source",
                  description: `Source cited for factual information`,
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
          console.log(`Processing perspective: ${perspective.viewpoint} Source: ${perspective.source}`);
          if (perspective.source && !sourceMap.has(perspective.source)) {
            console.log(`Adding perspective source to map: ${perspective.source}`);
            sourceMap.set(perspective.source, {
              name: perspective.source,
              type: "News Analysis",
              description: `Source for perspective: "${perspective.viewpoint}"`,
              url: perspective.url
            });
          } else if (perspective.source) {
            console.log(`Perspective source already exists in map: ${perspective.source}`);
          }
        });
      }
      
      // Extract sources from timeline items
      if (reportData.timelineItems) {
        console.log('Processing timeline items for cited sources...');
        reportData.timelineItems.forEach((item: any) => {
          console.log(`Processing timeline item: ${item.title}`);
          let sourceUrl = item.sourceUrl || item.url || null;
          let sourceName = item.source;
          
          // Check if URL is embedded in description as markdown link
          const urlMatch = item.description?.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (urlMatch) {
            sourceName = sourceName || urlMatch[1];
            sourceUrl = sourceUrl || urlMatch[2];
            console.log(`Extracted timeline source from markdown: ${sourceName} -> ${sourceUrl}`);
          }
          
          if (sourceName && !sourceMap.has(sourceName)) {
            console.log(`Adding timeline source to map: ${sourceName}`);
            sourceMap.set(sourceName, {
              name: sourceName,
              type: "Timeline Reference",
              description: `Source for timeline event: "${item.title}"`,
              url: sourceUrl
            });
          } else if (sourceName) {
            console.log(`Timeline source already exists in map: ${sourceName}`);
          }
        });
      }
      
      // Extract sources from executive summary (if available)
      if (reportData.executiveSummary && reportData.executiveSummary.source) {
        if (!sourceMap.has(reportData.executiveSummary.source)) {
          sourceMap.set(reportData.executiveSummary.source, {
            name: reportData.executiveSummary.source,
            type: "Executive Summary",
            description: "Source for executive summary analysis",
            url: reportData.executiveSummary.url
          });
        }
      }
      
      // Convert map to array and add images
      const citedSourcesArray = Array.from(sourceMap.values());
      console.log(`Source map contains ${citedSourcesArray.length} sources:`, citedSourcesArray.map(s => s.name));
      
      // Remove duplicates and consolidate sources by URL
      const uniqueSourcesMap = new Map<string, any>();
      citedSourcesArray.forEach(source => {
        const key = source.url || source.name;
        if (!uniqueSourcesMap.has(key)) {
          uniqueSourcesMap.set(key, source);
        }
      });
      
      const uniqueSourcesArray = Array.from(uniqueSourcesMap.values());
      console.log(`After deduplication: ${uniqueSourcesArray.length} unique sources`);
      
      // Search for real news articles for these sources
      const sourceNames = uniqueSourcesArray.map(s => s.name);
      const realArticleUrls = await this.searchRealNewsArticles(reportData.query || '', sourceNames);
      console.log('Real article URLs found:', realArticleUrls);
      
      // Generate unique Pexels images for each source
      const citedSourcesWithImages = await Promise.all(
        uniqueSourcesArray.map(async (source, index) => {
          // Use source name directly for Pexels search with unique index
          const imageUrl = await pexelsService.searchImageByTopic(source.name, index + 10);
          
          const finalUrl = source.url || realArticleUrls[source.name] || null;
          console.log(`Source ${source.name}: original URL=${source.url}, real URL=${realArticleUrls[source.name]}, final URL=${finalUrl}`);
          
          return {
            id: Date.now() + index,
            articleId: Date.now(),
            name: source.name,
            type: source.type,
            description: source.description,
            url: finalUrl,
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
            content: `You are a JSON-only research assistant. You must ONLY return valid JSON - no narrative text, no explanations, no markdown.

MANDATORY: Start your response with { and end with }. Nothing else.

Use web search to find real, current information about the topic. Then format findings as this exact JSON structure:

{
  "article": {
    "id": 1,
    "title": "Clear title based on search results",
    "excerpt": "Brief 2-sentence summary",
    "heroImageUrl": "",
    "content": "Full article content with real facts from search",
    "author": "TIMIO Research Team",
    "publishedAt": "2025-01-08T00:00:00Z",
    "readTime": 8,
    "category": "Research",
    "slug": "auto-generated"
  },
  "executiveSummary": {
    "id": 1,
    "articleId": 1,
    "summary": "Single paragraph executive summary"
  },
  "timelineItems": [
    {
      "id": 1,
      "articleId": 1,
      "date": "2025-01-08",
      "title": "Event title",
      "description": "Event details",
      "url": "https://real-url-from-search.com"
    }
  ],
  "rawFacts": [
    {
      "id": 1,
      "articleId": 1,
      "category": "Key Facts",
      "fact": "Specific fact from search results",
      "source": "Source name",
      "url": "https://real-url-from-search.com"
    }
  ],
  "perspectives": [
    {
      "id": 1,
      "articleId": 1,
      "viewpoint": "Perspective title",
      "description": "Brief description of the perspective",
      "source": "Source organization name",
      "quote": "Direct quote from source",
      "color": "blue",
      "url": "https://real-url-from-search.com"
    }
  ]
}

CRITICAL: Return ONLY the JSON object. No text before or after. Use real URLs from your search results.`
          },
          {
            role: "user",
            content: `Research topic: ${query}`
          }
        ],

        max_tokens: 3000
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
      // Look for the first complete JSON object
      const jsonStart = cleanContent.indexOf('{');
      const jsonEnd = cleanContent.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
      }
      
      // Remove any leading/trailing whitespace
      cleanContent = cleanContent.trim();
      
      let reportData;
      try {
        reportData = JSON.parse(cleanContent);
        console.log('Parsed report data successfully');
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Content length:', cleanContent.length);
        console.error('First 500 chars:', cleanContent.substring(0, 500));
        console.error('Last 500 chars:', cleanContent.substring(cleanContent.length - 500));
        
        // Try to fix common JSON issues
        let fixedContent = cleanContent;
        
        // Handle control characters in strings
        if (parseError.message.includes('Bad control character')) {
          console.log('Attempting to fix control characters...');
          fixedContent = this.fixControlCharacters(fixedContent);
          try {
            reportData = JSON.parse(fixedContent);
            console.log('Successfully parsed after control character repair');
          } catch (controlError) {
            console.error('Failed to parse after control character repair:', controlError);
            // Create fallback response
            reportData = {
              article: {
                id: Date.now(),
                title: `Research Report: ${query}`,
                excerpt: "Research generation encountered an error. Please try again.",
                heroImageUrl: "",
                content: "Our research system is currently experiencing technical difficulties. Please try your search again.",
                author: "TIMIO Research Team",
                publishedAt: new Date().toISOString(),
                readTime: 2,
                category: "Research",
                slug: this.createSlug(query)
              },
              executiveSummary: {
                id: Date.now(),
                articleId: Date.now(),
                summary: "Research generation failed due to technical issues. Please try again."
              },
              timelineItems: [],
              rawFacts: [],
              perspectives: []
            };
          }
        }
        // Handle unterminated strings  
        else if (parseError.message.includes('Unterminated string')) {
          console.log('Attempting to fix unterminated string...');
          fixedContent = this.repairUnterminatedStrings(fixedContent);
          try {
            reportData = JSON.parse(fixedContent);
            console.log('Successfully parsed after string repair');
          } catch (stringError) {
            console.error('Failed to parse after string repair:', stringError);
            // Create fallback response
            reportData = {
              article: {
                id: Date.now(),
                title: `Research Report: ${query}`,
                excerpt: "Research generation encountered an error. Please try again.",
                heroImageUrl: "",
                content: "Our research system is currently experiencing technical difficulties. Please try your search again.",
                author: "TIMIO Research Team",
                publishedAt: new Date().toISOString(),
                readTime: 2,
                category: "Research",
                slug: this.createSlug(query)
              },
              executiveSummary: {
                id: Date.now(),
                articleId: Date.now(),
                summary: "Research generation failed due to technical issues. Please try again."
              },
              timelineItems: [],
              rawFacts: [],
              perspectives: []
            };
          }
        }
        // Handle truncated JSON responses
        else if (parseError.message.includes('Expected') && parseError.message.includes('after array element')) {
          console.log('Attempting to fix truncated JSON...');
          
          // Find the position of the error
          const errorPos = parseError.message.match(/position (\d+)/);
          let truncatePos = fixedContent.length;
          
          if (errorPos) {
            truncatePos = Math.min(parseInt(errorPos[1]), fixedContent.length);
          }
          
          // Find the last complete structure before the error
          let workingContent = fixedContent.substring(0, truncatePos);
          
          // Remove any incomplete trailing elements
          const lastCompleteComma = workingContent.lastIndexOf(',');
          const lastCompleteObject = workingContent.lastIndexOf('}');
          const lastCompleteArray = workingContent.lastIndexOf(']');
          
          // If we have a trailing comma after the last complete structure, remove everything after it
          if (lastCompleteComma > Math.max(lastCompleteObject, lastCompleteArray)) {
            workingContent = workingContent.substring(0, lastCompleteComma);
          }
          
          // Ensure proper JSON closure
          let openBraces = (workingContent.match(/\{/g) || []).length - (workingContent.match(/\}/g) || []).length;
          let openBrackets = (workingContent.match(/\[/g) || []).length - (workingContent.match(/\]/g) || []).length;
          
          // Close any unclosed structures
          while (openBrackets > 0) {
            workingContent += ']';
            openBrackets--;
          }
          while (openBraces > 0) {
            workingContent += '}';
            openBraces--;
          }
          
          try {
            reportData = JSON.parse(workingContent);
            console.log('Successfully parsed truncated JSON');
          } catch (secondError) {
            console.error('Failed to parse fixed content:', secondError);
            // Create fallback response
            reportData = {
              article: {
                id: Date.now(),
                title: `Research Report: ${query}`,
                excerpt: "Research generation encountered an error. Please try again.",
                heroImageUrl: "",
                content: "Our research system is currently experiencing technical difficulties. Please try your search again.",
                author: "TIMIO Research Team",
                publishedAt: new Date().toISOString(),
                readTime: 2,
                category: "Research",
                slug: this.createSlug(query)
              },
              executiveSummary: {
                id: Date.now(),
                articleId: Date.now(),
                summary: "Research generation failed due to technical issues. Please try again."
              },
              timelineItems: [],
              rawFacts: [],
              perspectives: []
            };
          }
        } else {
          // If all JSON repair attempts fail, create a fallback response
          console.log('All JSON repair attempts failed - creating fallback response');
          reportData = {
            article: {
              id: Date.now(),
              title: `Research Report: ${query}`,
              excerpt: "Research generation encountered an error. Please try again.",
              heroImageUrl: "",
              content: "Our research system is currently experiencing technical difficulties. Please try your search again.",
              author: "TIMIO Research Team",
              publishedAt: new Date().toISOString(),
              readTime: 2,
              category: "Research",
              slug: this.createSlug(query)
            },
            executiveSummary: {
              id: Date.now(),
              articleId: Date.now(),
              summary: "Research generation failed due to technical issues. Please try again."
            },
            timelineItems: [],
            rawFacts: [],
            perspectives: []
          };
        }
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
        timelineItems: reportData.timelineItems.map((item: any, index: number) => {
          // Extract URL from description if present
          let sourceUrl = item.sourceUrl || item.url || null;
          let cleanDescription = item.description;
          
          // Check if URL is embedded in description as markdown link
          const urlMatch = item.description?.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (urlMatch && !sourceUrl) {
            sourceUrl = urlMatch[2];
            // Clean up the description by removing the markdown link
            cleanDescription = item.description.replace(/\s*\(\[[^\]]+\]\([^)]+\)\)/, '');
          }
          
          return {
            id: Date.now() + index,
            articleId: Date.now(),
            date: item.date,
            title: item.title,
            description: cleanDescription,
            type: "event",
            sourceLabel: item.sourceLabel || "Source",
            sourceUrl: sourceUrl
          };
        }),
        citedSources: await this.collectCitedSources({ ...reportData, query }),
        rawFacts: this.groupRawFactsByCategory(reportData.rawFacts),
        perspectives: reportData.perspectives.map((perspective: any, index: number) => ({
          id: Date.now() + index,
          articleId: Date.now(),
          viewpoint: perspective.viewpoint,
          description: perspective.description || perspective.viewpoint,
          source: perspective.source || "Unknown Source",
          quote: perspective.quote,
          color: perspective.color || "blue",
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
      facts: facts // Keep the full fact objects with source and url info
    }));
  }

  private fixControlCharacters(content: string): string {
    // Remove or escape control characters that break JSON parsing
    return content
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .replace(/\\/g, '\\\\') // Escape backslashes
      .replace(/"/g, '\\"') // Escape quotes within strings
      .replace(/\\"/g, '"') // Fix over-escaped quotes at boundaries
      .replace(/\n/g, '\\n') // Escape newlines
      .replace(/\r/g, '\\r') // Escape carriage returns
      .replace(/\t/g, '\\t'); // Escape tabs
  }

  private repairUnterminatedStrings(content: string): string {
    // Handle unterminated strings by finding the last quote and closing it properly
    let fixed = content;
    
    // Find unterminated strings at the end
    const lastQuoteIndex = fixed.lastIndexOf('"');
    if (lastQuoteIndex !== -1) {
      // Check if the string after the last quote is unterminated
      const afterLastQuote = fixed.substring(lastQuoteIndex + 1);
      
      // If there's content after the last quote without a closing quote, truncate it
      if (afterLastQuote && !afterLastQuote.includes('"')) {
        // Close the string and complete the JSON structure
        fixed = fixed.substring(0, lastQuoteIndex + 1) + '"}]}}';
      }
    }
    
    return fixed;
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