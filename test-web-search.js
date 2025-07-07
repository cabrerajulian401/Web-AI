import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testWebSearch() {
  try {
    console.log("Testing OpenAI web search capabilities...");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a web search assistant with access to real-time web search. Your task is to find actual, recent news articles related to the given topic.

IMPORTANT: You must use your web search capabilities to find real articles with actual URLs from legitimate news sources. Do not generate fake or placeholder articles.

Return JSON in this exact format:
{
  "articles": [
    {
      "title": "string (exact article title as it appears on the actual website)",
      "excerpt": "string (brief 1-2 sentence description/summary of what the article covers)",
      "url": "string (actual, working URL to the real article)",
      "source": "string (actual publication name)",
      "publishedAt": "string (ISO date when available from the article)"
    }
  ]
}

Search Guidelines:
- MUST use web search to find 3-5 real, recent news articles from legitimate sources
- Include diverse perspectives from different reputable news outlets
- Focus on articles published within the last 30 days when possible
- Verify all URLs are actual working links to real articles
- Sources should include major news outlets like Reuters, AP, BBC, CNN, NPR, etc.
- Do not generate fictional articles or placeholder content`
        },
        {
          role: "user",
          content: `Use web search to find recent real news articles related to: Trump tariffs 2025`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 2000
    });

    const result = JSON.parse(response.choices[0].message.content || '{"articles": []}');
    
    console.log('\n=== TEST RESULTS ===');
    console.log('Articles found:', result.articles?.length || 0);
    
    if (result.articles && result.articles.length > 0) {
      result.articles.forEach((article, index) => {
        console.log(`\nArticle ${index + 1}:`);
        console.log('  Title:', article.title);
        console.log('  Source:', article.source);
        console.log('  URL:', article.url);
        console.log('  URL appears real:', article.url?.includes('.com') || article.url?.includes('.org') || article.url?.includes('.net') ? 'YES' : 'NO');
        console.log('  Domain:', article.url ? new URL(article.url).hostname : 'N/A');
      });
    } else {
      console.log('No articles returned');
    }
    console.log('\n=== END RESULTS ===');
    
  } catch (error) {
    console.error('Error testing web search:', error);
  }
}

testWebSearch();