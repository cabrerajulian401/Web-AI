import OpenAI from "openai";
import type { Article, TimelineItem, CitedSource, RawFacts, Perspective, ExecutiveSummary, ResearchReport } from "@shared/schema";
import { pexelsService } from "./pexels-service";
import { RSSService } from "./rss-service";
import { jsonFormatterService } from "./json-formatter-service";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const perplexity = new OpenAI({ apiKey: process.env.PERPLEXITY_API_KEY, baseURL: "https://api.perplexity.ai" });

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
      const articleId = reportData.article?.id || Date.now();
      // If OpenAI directly provided citedSources, use those
      if (reportData.citedSources && Array.isArray(reportData.citedSources) && reportData.citedSources.length > 0) {
        const citedSourcesWithImages = await Promise.all(
          reportData.citedSources.map(async (source: any, index: number) => {
            const imageUrl = await pexelsService.searchImageByTopic(source.name, index + 10);

            return {
              id: Date.now() + index,
              articleId: articleId,
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

      // Extract sources from perspective groups
      if (reportData.perspectiveGroups) {
        console.log('Processing perspective groups for cited sources...');
        reportData.perspectiveGroups.forEach((group: any) => {
          group.articles?.forEach((article: any) => {
            if (article.publisher && !sourceMap.has(article.publisher)) {
              sourceMap.set(article.publisher, {
                name: article.publisher,
                type: "News Analysis",
                description: `${group.viewpointHeadline}: "${article.stance}"`,
                url: article.url
              });
            }
          });
        });
      }
      // Fallback for old perspectives structure
      else if (reportData.perspectives) {
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
            articleId: articleId,
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
      console.log('\n=== GENERATING RESEARCH REPORT (2-step process) ===');
      console.log('Query:', query);

      // Step 1: Perform web search to get unstructured data
      const unstructuredResearch = await this.performWebSearch(query);

      // Handle case where search fails
      if (!unstructuredResearch || unstructuredResearch.length < 50) {
        console.error('Web search returned insufficient data.');
        throw new Error('Failed to gather sufficient information from web search.');
      }

      // Step 2: Structure the data using a second model call
      const reportData = await this.structureResearchData(unstructuredResearch, query);

      const articleId = Date.now();

      // Process conflicting claims if present
      const conflictingClaims = (reportData.conflictingClaims || []).map((claim: any, index: number) => ({
        ...claim,
        id: Date.now() + index,
        articleId: articleId,
      }));

      // Create slug from title
      const slug = this.createSlug(reportData.article.title);

      // Get hero image
      const heroImageFromPexels = heroImageUrl || await pexelsService.searchImageByTopic(reportData.article.title, 0);

      const summaryText = reportData.article.executiveSummary || '';
      const summaryPoints = summaryText
        .split('\n')
        .map((point: string) => point.replace(/^•\s*/, '').trim())
        .filter((point: string) => point.length > 0);

      // Format the response
      const report: ResearchReport = {
        article: {
          id: articleId,
          slug,
          title: reportData.article.title,
          content: reportData.article.content,
          category: reportData.article.category || "Research",
          excerpt: reportData.article.executiveSummary, // Using executiveSummary as excerpt
          heroImageUrl: heroImageFromPexels,
          publishedAt: reportData.article.publishedAt || new Date().toISOString(),
          readTime: reportData.article.readTime || 8,
          sourceCount: reportData.article.sourceCount || reportData.citedSources?.length || 0,
          authorName: "TIMIO Research Team",
          authorTitle: "AI Research Analyst"
        },
        executiveSummary: {
          id: Date.now(),
          articleId: articleId,
          points: summaryPoints.length > 0 ? summaryPoints : ["No executive summary available."]
        },
        timelineItems: (reportData.timelineItems || []).map((item: any, index: number) => ({
          id: Date.now() + index,
          articleId: articleId,
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
            articleId: articleId,
            name: source.name,
            type: source.type,
            description: source.description,
            url: source.url,
            imageUrl: await pexelsService.searchImageByTopic(source.name, index + 10)
          }))
        ) : await this.collectCitedSources({ ...reportData, query }),
        rawFacts: this.groupRawFactsByCategory(reportData.rawFacts || []),
        perspectives: this.extractPerspectivesFromGroups(reportData.perspectiveGroups || reportData.perspectives || []),
        conflictingClaims: conflictingClaims
      };

      if (report.conflictingClaims && report.conflictingClaims.length > 0) {
        const conflictPerspectives = report.conflictingClaims.map((claim, index) => ({
          id: Date.now() + index + 1000,
          articleId: report.article.id,
          viewpoint: `Conflict: ${claim.topic}`,
          description: claim.conflict,
          source: claim.sourceA.url,
          quote: claim.sourceA.claim,
          url: claim.sourceA.url,
          conflictSource: claim.sourceB.url,
          conflictQuote: claim.sourceB.claim,
          color: 'red',
          isConflict: true
        }));
        report.perspectives.push(...conflictPerspectives);
      }

      return report;
    } catch (error: any) {
      console.error('OpenAI Research Service Error:', error);
      return this.createErrorReport(query, error.message);
    }
  }

  private async performWebSearch(query: string): Promise<string> {
    console.log('--- Step 1: Performing web search with Perplexity Sonar Pro ---');
    const searchPrompt = `You are a real-time, non-partisan research assistant with live web browsing capability. You NEVER fabricate data, quotes, articles, or URLs. Today you are researching "${query}" You only can output two types of responses:
1. Content based on real articles, real public sources accessed live through your browsing ability with cited urls.
2. Should there be issues with type 1, you will say "Error accessing web articles" or "No web article found"

Quote guide: Any content you write within "" must never be paraphrased or rewritten, while content you write outside of "" can be paraphrased. They must be shown exactly as originally published. The only permitted edits to a quote are:
    a. Ellipses: to remove extraneous content and make quote more concise
    b. Square brackets: to clarify a word or replace a pronoun with noun for better readability

You strictly follow this format, and provide no extra info outside of it:

Executive Summary:
Short, simple, easy to read, bullet point summary of event in plain English. Don't use complete sentences. 

Raw facts
1. Determine the raw facts on the topic primary sources ONLY
Ex: Direct quote of what exactly was said, literal concrete propositions of a bill or policy from the document in question, statements from those involved, ect.
Direct data or statements from government documents, public officials, or original press releases, NOT wikipedia. You may go to intermediary sites in your research, but get your data from their sources. No middle man organizations should be cited.
If your researching a proposed law or bill, include raw facts directly from the document in question. Cite the name of the exact document or speaker they came from, + source
Places you can find US law text & congress hearings:
https://www.congress.gov/
https://www.govinfo.gov/
Official statements from White House:
https://www.whitehouse.gov/news/
2. Return all the raw facts you find in a bullet point list. Organize the list by source.

Timeline
Bullet point timeline of events if relevant

Different perspectives – summarize how the story is being covered by outlets with different perspectives on the story. Include REAL quotes and the outlet names. How are people and outlets interpreting the raw info from section 2?
a. Research articles with opposing or different takes to this article
-Consider what different views on this may be, and use search terms that would bring them up
b. Organize them into distinct, differing, and opposing groups based on their perspective. Begin each viewpoint group with one clear headline labeling, write it as if it were a snappy headline the outlets in the group could've posted. Avoid using the word viewpoint in titles.
c. Formatting:
Viewpoint Title 1 (No "")
- 1 bullet point summary of view
- Publisher Name
- Short Quote

Conflicting Info
a. Determine if there are conflicts between any of the viewpoints you found
      b. If none return "No conflicts detected"
c. IF you find conflicts:
i. Clearly identify what the conflict or misconception is.
ii. After each conflict list the conflicting sources as follows: [Source(s)] vs [Opposing Sources(s)]
- Link
- [Repeat if multiple articles under this viewpoint]
- [Don't waste words on section titles like "Publisher Name:" or "Quote"]`;

    try {
        const response = await perplexity.chat.completions.create({
            model: 'sonar-pro',
            messages: [
                { role: 'system', content: searchPrompt },
                { role: 'user', content: `Please begin your research on: ${query}` }
            ],
            max_tokens: 4000
        });

        const searchResult = response.choices[0].message.content || '';
        console.log('--- Web search completed. Result length:', searchResult.length, '---');
        return searchResult;

    } catch (error) {
      console.error('Error during web search step:', error);
      throw new Error('Perplexity API call for web search failed.');
    }
  }

  private async structureResearchData(researchData: string, query: string): Promise<any> {
    console.log('--- Step 2: Structuring research data ---');
    const structuringPrompt = `SYSTEM ROLE: You are a data structuring expert. Your sole purpose is to convert unstructured text into a specific JSON format. You do not add new information or fabricate data. You only use the information provided to you.

    TASK: Convert the following research text into the JSON structure provided below.
    - Extract all entities like facts, sources, timeline events, and perspectives from the text.
    - If information for a specific field is not present in the text, use an empty array [] or an appropriate empty value.
    - NEVER invent data.
    - The "executiveSummary" should be a series of bullet points, each on a new line, like "• Point 1\\n• Point 2".

    You must return ONLY valid JSON with this exact structure:

    {
      "article": {
        "title": "Clear, factual title based on the research text",
        "executiveSummary": "• Short summary of what happened in bullet points, derived from the text\\\\n• Each bullet point on a separate line",
        "content": "Comprehensive article synthesized from the research text",
        "category": "Research",
        "publishedAt": "\${new Date().toISOString()}",
        "readTime": 8,
        "sourceCount": [actual number of unique sources found in the text]
      },
      "rawFacts": [
        {
          "category": "Primary Sources",
          "fact": "From [Source Name]: [exact quote or fact as found in the text]",
          "source": "Source Name from text",
          "url": "https://exact-url-from-text.com"
        }
      ],
      "timelineItems": [
        {
          "date": "YYYY-MM-DD",
          "title": "Event title from text",
          "description": "Event details from text - bullet point format",
          "source": "Source name from text",
          "url": "https://real-url-from-text.com"
        }
      ],
      "perspectiveGroups": [
        {
          "viewpointHeadline": "Viewpoint from text",
          "tone": "supportive | critical | neutral",
          "articles": [
            {
              "stance": "1-line summary of stance from text",
              "publisher": "Publisher name from text",
              "quote": "Short exact quote from text",
              "url": "https://real-article-url-from-text.com"
            }
          ]
        }
      ],
      "conflictingClaims": [
        {
          "topic": "Topic of conflict from text",
          "conflict": "[Source A URL] claims X vs [Source B URL] claims Y",
          "sourceA": {
            "claim": "Claim from source A",
            "url": "https://source-a-url.com"
          },
          "sourceB": {
            "claim": "Claim from source B",
            "url": "https://source-b-url.com"
          }
        }
      ],
      "citedSources": [
        {
          "name": "Source organization name from text",
          "type": "Primary Source",
          "description": "Description of the source based on context",
          "url": "https://real-url-from-text.com"
        }
      ]
    }
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: structuringPrompt },
          { role: "user", content: `Here is the research text for the query "${query}":\n\n---START OF TEXT---\n\n${researchData}\n\n---END OF TEXT---\n\nPlease structure this text into the required JSON format.` }
        ],
        max_tokens: 4000
      });

      const structuredContent = response.choices[0].message.content || '{}';
      console.log('--- Full structured response from model ---', structuredContent);
      console.log('--- Structuring completed. ---');
      return JSON.parse(structuredContent);

    } catch (error) {
      console.error('Error during data structuring step:', error);
      throw new Error('OpenAI API call for data structuring failed.');
    }
  }

  private createErrorReport(query: string, errorMessage: string = "Failed to generate research report"): ResearchReport {
    return {
      article: {
        id: Date.now(),
        slug: this.createSlug(query),
        title: `Research Report Failed: ${query}`,
        content: `ERROR: ${errorMessage}`,
        category: "Error",
        excerpt: "An error occurred while generating the report.",
        heroImageUrl: '',
        publishedAt: new Date(),
        readTime: 1,
        sourceCount: 0,
        authorName: "System",
        authorTitle: "Error Handler"
      },
      executiveSummary: {
        id: Date.now(),
        articleId: Date.now(),
        points: ["Could not generate an executive summary due to an error."]
      },
      timelineItems: [],
      citedSources: [],
      rawFacts: [],
      perspectives: [],
      conflictingClaims: []
    };
  }

  private extractPerspectivesFromGroups(perspectiveGroups: any[]): any[] {
    const perspectives: any[] = [];
    let index = 0;

    // Handle new perspectiveGroups structure
    if (perspectiveGroups.length > 0 && perspectiveGroups[0].viewpointHeadline) {
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
    } 
    // Fallback for old perspectives structure
    else if (perspectiveGroups.length > 0 && perspectiveGroups[0].viewpoint) {
      return perspectiveGroups.map((perspective: any, i: number) => ({
        id: Date.now() + i,
        articleId: Date.now(),
        viewpoint: perspective.viewpoint,
        description: perspective.description,
        source: perspective.source,
        quote: perspective.quote,
        color: perspective.color || "blue",
        url: perspective.url
      }));
    }

    return perspectives;
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

  private createSlug(title: string): string {
    if (!title) {
      return `report-${Date.now()}`;
    }
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }
}

export const openAIResearchService = new OpenAIResearchService();