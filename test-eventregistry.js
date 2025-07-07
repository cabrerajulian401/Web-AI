// Test EventRegistry API directly
import fetch from 'node-fetch';

async function testEventRegistryAPI() {
  console.log("=== Testing EventRegistry API ===\n");
  
  const apiKey = '337d177a-8018-4937-8ebf-53c96cef4906';
  
  try {
    const url = `https://eventregistry.org/api/v1/article/getArticles`;
    const body = {
      action: 'getArticles',
      keyword: 'politics',
      articlesPage: 1,
      articlesCount: 5,
      articlesSortBy: 'date',
      sourceLocationUri: 'http://en.wikipedia.org/wiki/United_States',
      lang: 'eng',
      apiKey: apiKey
    };

    console.log("Making request to EventRegistry...");
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    console.log("Response status:", response.status);
    
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    console.log("Response structure:", Object.keys(data));
    
    if (data.articles?.results) {
      console.log(`Found ${data.articles.results.length} articles:`);
      
      data.articles.results.forEach((article, index) => {
        console.log(`\nArticle ${index + 1}:`);
        console.log(`  Title: ${article.title}`);
        console.log(`  Source: ${article.source?.title || 'Unknown'}`);
        console.log(`  URL: ${article.url}`);
        console.log(`  Date: ${article.dateTime}`);
        console.log(`  URL valid: ${article.url?.startsWith('http') ? 'YES' : 'NO'}`);
      });
      
      // Test a few URLs to verify they're real
      console.log("\n=== URL Verification ===");
      const urlsToTest = data.articles.results.slice(0, 2).map(a => a.url);
      
      for (const url of urlsToTest) {
        try {
          const response = await fetch(url, { method: 'HEAD' });
          console.log(`✓ ${url} - Status: ${response.status}`);
        } catch (error) {
          console.log(`✗ ${url} - Error: ${error.message}`);
        }
      }
    } else {
      console.log("No articles found in response");
      console.log("Response:", JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
}

testEventRegistryAPI();