import OpenAI from "openai";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import type { TimelineItem, CitedSource, RawFacts, Perspective, ExecutiveSummary } from "@shared/schema";

// API interface for Article (different from database schema)
interface ArticleAPI {
  id: number;
  slug: string;
  title: string;
  content: string;
  category: string;
  excerpt: string;
  heroImageUrl: string;
  publishedAt: string; // ISO string for API
  readTime: number;
  sourceCount: number;
  authorName: string;
  authorTitle: string;
}
import { pexelsService } from "./pexels-service";
import { webScraperService, type ScrapedContent } from "./web-scraper-service";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ResearchReport {
  article: ArticleAPI;
  executiveSummary: ExecutiveSummary;
  timelineItems: TimelineItem[];
  citedSources: CitedSource[];
  rawFacts: RawFacts[];
  perspectives: Perspective[];
}

export class TavilyResearchAgent {
  private tavilySearch: TavilySearchResults;

  constructor() {
    // Check if Tavily API key is available
    if (!process.env.TAVILY_API_KEY) {
      throw new Error('TAVILY_API_KEY environment variable is required');
    }
    
    console.log('Initializing Tavily search with API key:', process.env.TAVILY_API_KEY.substring(0, 10) + '...');
    
    // Initialize Tavily search tool with minimal configuration
    this.tavilySearch = new TavilySearchResults({
      apiKey: process.env.TAVILY_API_KEY,
      maxResults: 5, // Reduced to avoid rate limits
      searchDepth: "basic"
    });
  }

  async generateResearchReport(query: string, heroImageUrl?: string): Promise<ResearchReport> {
    const startTime = Date.now();
    try {
      console.log('\n=== TAVILY RESEARCH AGENT: GENERATING REPORT ===');
      console.log('Query:', query);

      // Step 1: Perform web search using Tavily with diverse sources
      console.log('Performing web search with Tavily...');
      console.log('API Key (first 10 chars):', process.env.TAVILY_API_KEY?.substring(0, 10) + '...');
      
      let searchResults: any;
      try {
        // Create diverse search queries to get different perspectives
        const baseQuery = query.length > 50 ? query.substring(0, 50) + '...' : query;
        const searchQueries = [
          baseQuery,
          `${baseQuery} news analysis`,
          `${baseQuery} criticism concerns`,
          `${baseQuery} expert opinion`,
          `${baseQuery} government official`
        ];
        
        console.log('Searching with diverse queries for different perspectives...');
        
        // Use the first query as primary, but the system will look for diverse sources
        searchResults = await this.tavilySearch.invoke(baseQuery);
        // Parse if string
        if (typeof searchResults === 'string') {
          try {
            searchResults = JSON.parse(searchResults);
            console.log('Parsed Tavily results as JSON array or object.');
          } catch (parseError) {
            console.error('Failed to parse Tavily results as JSON:', parseError);
            return this.createFallbackReport(query, 'Tavily returned invalid JSON');
          }
        }
        // Log the structure
        console.log('Tavily searchResults type:', typeof searchResults);
        if (Array.isArray(searchResults)) {
          console.log('Tavily searchResults is an array, length:', searchResults.length);
        } else if (searchResults && typeof searchResults === 'object') {
          console.log('Tavily searchResults keys:', Object.keys(searchResults));
          // Try to use a property that is an array
          const arrayProp = Object.keys(searchResults).find(key => Array.isArray(searchResults[key]));
          if (arrayProp) {
            console.log('Using property as array:', arrayProp);
            searchResults = searchResults[arrayProp];
          } else {
            console.error('No array property found in Tavily searchResults.');
            return this.createFallbackReport(query, 'Tavily did not return an array of results');
          }
        }
        console.log(`Found ${searchResults.length} search results`);
        
        if (!Array.isArray(searchResults) || searchResults.length === 0) {
          console.log('No search results found, creating fallback report...');
          return this.createFallbackReport(query, 'No search results found');
        }
      } catch (searchError) {
        console.error('Tavily search error:', searchError);
        console.error('Error details:', searchError instanceof Error ? searchError.message : 'Unknown error');
        console.error('Full error object:', JSON.stringify(searchError, null, 2));
        
        // If Tavily fails, create a fallback report
        console.log('Creating fallback report due to Tavily search failure...');
        return this.createFallbackReport(query, `Tavily search failed: ${searchError instanceof Error ? searchError.message : 'Unknown error'}`);
      }

      // Step 2: Extract and validate URLs from search results, categorize for diversity
      const validResults = (searchResults as any[])
        .filter((result: any) => result.url && this.isValidUrl(result.url));
      
      // Categorize sources for perspective diversity
      const categorizedSources = this.categorizeSourcesForPerspectives(validResults);
      
      const validUrls = validResults.map((result: any) => result.url);
      console.log(`Valid URLs found: ${validUrls.length}`);
      console.log(`Source categories: ${Object.keys(categorizedSources).join(', ')}`);

      // Step 3: Scrape content from the most relevant URLs
      let scrapedContent: ScrapedContent[] = [];
      if (validUrls.length > 0) {
        console.log('Starting web scraping for detailed content...');
        
        // Take the first 5 URLs to scrape (to avoid overwhelming the system)
        const urlsToScrape = validUrls.slice(0, 5);
        const sourceNames = urlsToScrape.map((url, index) => {
          const domain = new URL(url).hostname;
          return `Source ${index + 1} (${domain})`;
        });
        
        scrapedContent = await webScraperService.scrapeMultipleUrls(urlsToScrape, sourceNames);
        console.log(`Successfully scraped ${scrapedContent.length} pages with detailed content`);
      }

      // Step 4: Generate comprehensive research report using OpenAI with structured output
      const systemPrompt = `SYSTEM ROLE: You are a real-time, non-partisan research assistant with access to live web search results and detailed scraped content. You will create a comprehensive research report based on the provided search results, URLs, and detailed content from web scraping.

TASK: Create a detailed research report on: ${query}

AVAILABLE SEARCH RESULTS:
${searchResults.map((result: any, index: number) => 
  `${index + 1}. ${result.title || 'No title'}
   URL: ${result.url || 'No URL'}
   Content: ${result.content || 'No content'}
   Published: ${result.published_date || 'Unknown date'}`
).join('\n\n')}

VALID URLS FOR CITATION:
${validUrls.join('\n')}

DETAILED SCRAPED CONTENT:
${scrapedContent.map((content, index) => `
SOURCE ${index + 1}: ${content.source}
URL: ${content.url}
TITLE: ${content.title}
AUTHOR: ${content.author || 'Unknown'}
PUBLISHED: ${content.publishedDate || 'Unknown'}
CONTENT: ${content.content.substring(0, 1000)}...
QUOTES:
${content.quotes.map(quote => `• "${quote}"`).join('\n')}
`).join('\n\n')}

CRITICAL REQUIREMENTS:
1. You MUST return ONLY valid JSON with the exact structure specified below
2. Use response_format: { type: "json_object" } to ensure proper JSON formatting
3. All URLs must be from the valid URLs list provided
4. Use exact quotes from the scraped content when available
5. Do not invent or fabricate any information
6. If you cannot find real sources for a section, use empty array []

REQUIRED JSON STRUCTURE:
{
  "article": {
    "title": "Clear, factual title based on search results",
    "excerpt": "Brief summary of the research findings",
    "content": "Comprehensive article with all research findings",
    "category": "Research",
    "publishedAt": "${new Date().toISOString()}",
    "readTime": 8,
    "sourceCount": ${validUrls.length}
  },
  "rawFacts": [
    {
      "category": "Primary Sources",
      "fact": "From [Source Name]: [exact quote or fact as found]",
      "source": "Source Name",
      "url": "https://exact-url-from-search.com"
    }
  ],
  "timelineItems": [
    {
      "date": "YYYY-MM-DD",
      "title": "Event title",
      "description": "Event details - bullet point format",
      "source": "Source name",
      "url": "https://real-url-from-search.com"
    }
  ],
  "perspectives": [
    {
      "viewpoint": "Supportive/Positive Viewpoint",
      "description": "Detailed analysis of supportive stance with specific reasoning and context",
      "source": "Source name (must be different from other perspectives)",
      "quote": "Exact quote from the source that supports this viewpoint",
      "url": "https://real-article-url.com",
      "color": "green",
      "reasoning": "Detailed explanation of why this source takes this position",
      "evidence": "Specific evidence or arguments presented by this source"
    },
    {
      "viewpoint": "Critical/Negative Viewpoint", 
      "description": "Detailed analysis of critical stance with specific reasoning and context",
      "source": "Source name (must be different from other perspectives)",
      "quote": "Exact quote from the source that supports this viewpoint",
      "url": "https://real-article-url.com",
      "color": "red",
      "reasoning": "Detailed explanation of why this source takes this position",
      "evidence": "Specific evidence or arguments presented by this source"
    },
    {
      "viewpoint": "Neutral/Analytical Viewpoint",
      "description": "Balanced analysis presenting both sides with objective assessment",
      "source": "Source name (must be different from other perspectives)",
      "quote": "Exact quote from the source that demonstrates balanced analysis",
      "url": "https://real-article-url.com",
      "color": "blue",
      "reasoning": "Detailed explanation of the balanced approach taken",
      "evidence": "Specific evidence or arguments presented by this source"
    }
  ],
  "conflictingClaims": [
    {
      "topic": "Key issue being debated",
      "sourceA": {
        "claim": "First claim from source A",
        "source": "Source A name",
        "url": "https://source-a-url.com"
      },
      "sourceB": {
        "claim": "Opposing claim from source B", 
        "source": "Source B name",
        "url": "https://source-b-url.com"
      }
    }
  ],
  "citedSources": [
    {
      "name": "Source organization name",
      "type": "Primary Source",
      "description": "Description of the source",
      "url": "https://real-url.com"
    }
  ]
}

PERSPECTIVE ANALYSIS REQUIREMENTS:
- Each perspective MUST come from a DIFFERENT source/URL
- Provide DEEP analysis with specific reasoning, not just surface-level opinions
- Include detailed explanations of WHY each source takes their position
- Use specific evidence and arguments from the scraped content
- Ensure perspectives are genuinely different viewpoints, not just slight variations
- Look for sources that represent different stakeholder groups (government, business, media, experts, etc.)
- Include context about the source's background or expertise if available
- Make sure each perspective has substantial content and reasoning

PERSPECTIVE TYPES TO SEEK:
1. SUPPORTIVE/POSITIVE: Sources that generally support or praise the subject/topic
2. CRITICAL/NEGATIVE: Sources that raise concerns, criticisms, or opposition
3. NEUTRAL/ANALYTICAL: Sources that present balanced, objective analysis
4. EXPERT/SPECIALIST: Sources from domain experts or specialists
5. STAKEHOLDER: Sources representing affected parties or stakeholders

FORMATTING RULES:
- Raw facts MUST start with "From [Source]: " format and use EXACT QUOTES from scraped content
- Use only PRIMARY SOURCES: government docs, direct quotes, press releases, official bills
- Use the EXACT QUOTES from the scraped content when available - these are real quotes from the web pages
- No secondhand citations (no Wikipedia, no summaries)
- If quoting legislation, include name of bill and section
- For perspectives, use the exact quotes from scraped content to show different viewpoints
- For conflicting claims, identify opposing viewpoints from the scraped content
- 🚫 NEVER invent article titles, outlets, quotes, or URLs
- If you cannot find real sources for a section, use empty array []
- Use only URLs from the provided search results
- Ensure all URLs in the response are from the valid URLs list
- Use the detailed scraped content to provide accurate quotes and facts
- IMPORTANT: Use the quotes from the DETAILED SCRAPED CONTENT section above
- PERSPECTIVES MUST BE FROM DIFFERENT SOURCES - check that each perspective uses a different URL

REMEMBER: Return ONLY the JSON object, no additional text, explanations, or markdown formatting.`;

      // Use structured output to ensure valid JSON
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
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
        max_tokens: 4000,
        response_format: { type: "json_object" },
        temperature: 0.1 // Lower temperature for more consistent formatting
      });

      // Extract response
      const { message } = response.choices[0];
      console.log('Raw response length:', message.content?.length);

      // Parse JSON response with comprehensive error handling
      let reportData = await this.parseAndValidateJSON(message.content || '{}', query);

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
          points: reportData.article.executiveSummary ? 
            reportData.article.executiveSummary.split(/[•\-\n]/).map((p: string) => p.trim()).filter((p: string) => p.length > 0) : 
            ["No executive summary available."]
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
        citedSources: await Promise.all(
          (reportData.citedSources || []).map(async (source: any, index: number) => ({
            id: Date.now() + index,
            articleId: Date.now(),
            name: source.name,
            type: source.type,
            description: source.description,
            url: source.url,
            imageUrl: await pexelsService.searchImageByTopic(source.name, index + 10)
          }))
        ),
        rawFacts: this.groupRawFactsByCategory(reportData.rawFacts || []),
        perspectives: this.formatPerspectives(reportData.perspectives || [], reportData.conflictingClaims || [])
      };

      const endTime = Date.now();
      console.log(`Tavily research report generated in ${endTime - startTime}ms`);
      
      return report;
    } catch (error) {
      console.error('Tavily Research Agent Error:', error);
      throw new Error('Failed to generate research report');
    }
  }

  // Enhanced JSON parsing with multiple fallback strategies
  private async parseAndValidateJSON(content: string, query: string): Promise<any> {
    console.log('=== JSON PARSING AND VALIDATION ===');
    console.log('Content length:', content.length);
    
    // Strategy 1: Direct parsing (should work with response_format: json_object)
    try {
      const parsed = JSON.parse(content);
      console.log('✓ Direct JSON parsing successful');
      return this.validateReportStructure(parsed, query);
    } catch (error) {
      console.log('✗ Direct parsing failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Strategy 2: Clean and try again
    try {
      const cleaned = this.cleanJsonString(content);
      const parsed = JSON.parse(cleaned);
      console.log('✓ Cleaned JSON parsing successful');
      return this.validateReportStructure(parsed, query);
    } catch (error) {
      console.log('✗ Cleaned parsing failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Strategy 3: Extract JSON from markdown or other formatting
    try {
      const extracted = this.extractJsonFromContent(content);
      const parsed = JSON.parse(extracted);
      console.log('✓ Extracted JSON parsing successful');
      return this.validateReportStructure(parsed, query);
    } catch (error) {
      console.log('✗ Extracted parsing failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Strategy 4: Try to repair common JSON issues
    try {
      const repaired = this.repairCommonJsonIssues(content);
      const parsed = JSON.parse(repaired);
      console.log('✓ Repaired JSON parsing successful');
      return this.validateReportStructure(parsed, query);
    } catch (error) {
      console.log('✗ Repaired parsing failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Strategy 5: Create minimal valid structure
    console.log('⚠️ All parsing strategies failed, creating minimal valid structure');
    return this.createMinimalValidStructure(query);
  }

  // Validate the parsed report structure
  private validateReportStructure(data: any, query: string): any {
    console.log('Validating report structure...');
    
    // Ensure required fields exist
    if (!data.article) {
      data.article = {};
    }
    
    if (!data.article.title) {
      data.article.title = `Research Report: ${query}`;
    }
    
    if (!data.article.content) {
      data.article.content = `Research report on: ${query}`;
    }
    
    if (!data.article.excerpt) {
      data.article.excerpt = `Research findings about ${query}`;
    }
    
    // Ensure arrays exist
    if (!Array.isArray(data.rawFacts)) data.rawFacts = [];
    if (!Array.isArray(data.timelineItems)) data.timelineItems = [];
    if (!Array.isArray(data.perspectives)) data.perspectives = [];
    if (!Array.isArray(data.conflictingClaims)) data.conflictingClaims = [];
    if (!Array.isArray(data.citedSources)) data.citedSources = [];
    
    console.log('✓ Report structure validation complete');
    return data;
  }

  // Clean JSON string
  private cleanJsonString(content: string): string {
    // Remove markdown code blocks
    let cleaned = content.replace(/```json\n?/g, '').replace(/\n?```$/g, '');
    
    // Remove leading/trailing whitespace
    cleaned = cleaned.trim();
    
    // Fix common escape issues
    cleaned = cleaned.replace(/\\"/g, '"');
    cleaned = cleaned.replace(/\\n/g, '\\n');
    cleaned = cleaned.replace(/\\t/g, '\\t');
    
    return cleaned;
  }

  // Extract JSON from content that might have extra formatting
  private extractJsonFromContent(content: string): string {
    // Find JSON object boundaries
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    
    if (start !== -1 && end !== -1 && end > start) {
      return content.substring(start, end + 1);
    }
    
    throw new Error('No JSON object found in content');
  }

  // Repair common JSON issues
  private repairCommonJsonIssues(content: string): string {
    let repaired = content;
    
    // Fix unescaped quotes in strings
    repaired = repaired.replace(/"([^"]*)"([^"]*)"([^"]*)"/g, '"$1\\"$2\\"$3"');
    
    // Fix trailing commas
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix missing quotes around property names
    repaired = repaired.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    // Fix newlines in strings
    repaired = repaired.replace(/\n/g, '\\n');
    repaired = repaired.replace(/\r/g, '\\r');
    repaired = repaired.replace(/\t/g, '\\t');
    
    return repaired;
  }

  // Create minimal valid structure when all parsing fails
  private createMinimalValidStructure(query: string): any {
    console.log('Creating minimal valid structure...');
    
    return {
      article: {
        title: `Research Report: ${query}`,
        excerpt: `Research findings about ${query}`,
        content: `Unable to generate comprehensive research report due to technical issues. Please try again later.`,
        category: "Research",
        publishedAt: new Date().toISOString(),
        readTime: 1,
        sourceCount: 0
      },
      rawFacts: [],
      timelineItems: [],
      perspectives: [],
      conflictingClaims: [],
      citedSources: []
    };
  }

  private formatPerspectives(perspectives: any[], conflictingClaims: any[]): any[] {
    const formattedPerspectives: any[] = [];
    let index = 0;
    const usedSources = new Set<string>();

    // Format regular perspectives with enhanced depth
    perspectives.forEach((perspective: any) => {
      // Skip if we've already used this source to ensure diversity
      if (usedSources.has(perspective.source)) {
        console.log(`Skipping duplicate source: ${perspective.source}`);
        return;
      }
      
      usedSources.add(perspective.source);
      
      formattedPerspectives.push({
        id: Date.now() + index++,
        articleId: Date.now(),
        viewpoint: perspective.viewpoint,
        description: perspective.description,
        source: perspective.source,
        quote: perspective.quote,
        color: perspective.color || 'blue',
        url: perspective.url,
        reasoning: perspective.reasoning || `Analysis from ${perspective.source}`,
        evidence: perspective.evidence || perspective.quote
      });
    });

    // Add conflicting claims as perspectives with conflict data (only if source is unique)
    conflictingClaims.forEach((conflict: any) => {
      // Only add if the source hasn't been used yet
      if (!usedSources.has(conflict.sourceA.source)) {
        usedSources.add(conflict.sourceA.source);
        
        formattedPerspectives.push({
          id: Date.now() + index++,
          articleId: Date.now(),
          viewpoint: conflict.topic,
          description: conflict.sourceA.claim,
          source: conflict.sourceA.source,
          quote: conflict.sourceA.claim,
          color: 'red',
          url: conflict.sourceA.url,
          reasoning: `Contrasting viewpoint on ${conflict.topic}`,
          evidence: conflict.sourceA.claim,
          conflictSource: conflict.sourceB.source,
          conflictQuote: conflict.sourceB.claim
        });
      }
    });

    // Ensure we have at least 2 different perspectives
    if (formattedPerspectives.length < 2) {
      console.log('Warning: Limited perspectives found, adding fallback perspective');
      formattedPerspectives.push({
        id: Date.now() + index++,
        articleId: Date.now(),
        viewpoint: 'Additional Analysis',
        description: 'Further analysis and context about the topic',
        source: 'Research Analysis',
        quote: 'Additional research and analysis provides further context on this topic.',
        color: 'purple',
        url: null,
        reasoning: 'Comprehensive research analysis',
        evidence: 'Based on available research data and analysis'
      });
    }

    console.log(`Formatted ${formattedPerspectives.length} perspectives from ${usedSources.size} unique sources`);
    return formattedPerspectives;
  }

  private groupRawFactsByCategory(rawFactsArray: any[]): any[] {
    // Group raw facts by category
    const groupedFacts = rawFactsArray.reduce((acc: any, item: any) => {
      const category = item.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }

      // Extract source from "From [Source]: " format if present
      let factText = item.fact;
      let source = item.source;

      const fromMatch = factText.match(/^From ([^:]+): (.+)$/);
      if (fromMatch) {
        source = fromMatch[1];
        factText = fromMatch[2];
      }

      // Add the fact with source annotation and URL
      const factData = {
        text: factText,
        source: source,
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

  private categorizeSourcesForPerspectives(searchResults: any[]): any {
    const categories: { [key: string]: any[] } = {
      news: [],
      government: [],
      academic: [],
      business: [],
      criticism: [],
      support: [],
      expert: [],
      other: []
    };

    searchResults.forEach((result: any) => {
      const url = result.url.toLowerCase();
      const title = (result.title || '').toLowerCase();
      const content = (result.content || '').toLowerCase();
      
      // Categorize based on URL and content
      if (url.includes('news') || url.includes('bbc') || url.includes('cnn') || url.includes('reuters') || url.includes('apnews')) {
        categories.news.push(result);
      } else if (url.includes('gov') || url.includes('government') || url.includes('whitehouse') || url.includes('congress')) {
        categories.government.push(result);
      } else if (url.includes('edu') || url.includes('academic') || url.includes('research') || url.includes('journal')) {
        categories.academic.push(result);
      } else if (url.includes('forbes') || url.includes('bloomberg') || url.includes('wsj') || url.includes('business')) {
        categories.business.push(result);
      } else if (content.includes('criticism') || content.includes('concern') || content.includes('opposition') || content.includes('against')) {
        categories.criticism.push(result);
      } else if (content.includes('support') || content.includes('praise') || content.includes('positive') || content.includes('success')) {
        categories.support.push(result);
      } else if (content.includes('expert') || content.includes('specialist') || content.includes('professor') || content.includes('analyst')) {
        categories.expert.push(result);
      } else {
        categories.other.push(result);
      }
    });

    return categories;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
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

  private createFallbackReport(query: string, errorMessage: string): ResearchReport {
    return {
      article: {
        id: Date.now(),
        slug: this.createSlug(`Research Report: ${query}`),
        title: `Research Report: ${query}`,
        content: `Unable to generate comprehensive research report due to technical issues: ${errorMessage}. Please try again later.`,
        category: "Research",
        excerpt: "Research report generation failed due to technical issues.",
        heroImageUrl: "",
        publishedAt: new Date().toISOString(),
        readTime: 1,
        sourceCount: 0,
        authorName: "TIMIO Research Team",
        authorTitle: "AI Research Analyst"
      },
      executiveSummary: {
        id: Date.now(),
        articleId: Date.now(),
        points: ["Research report generation failed due to technical issues."]
      },
      timelineItems: [],
      citedSources: [],
      rawFacts: [],
      perspectives: []
    };
  }
}

export const tavilyResearchAgent = new TavilyResearchAgent(); 