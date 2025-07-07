// Test the real news search service
import { newsSearchService } from "./server/news-search-service.js";

async function testRealNewsSearch() {
  console.log("=== Testing Real News Search Service ===\n");
  
  try {
    const results = await newsSearchService.searchNews("Biden tariffs policy", 5);
    
    console.log(`Found ${results.length} articles:`);
    
    if (results.length > 0) {
      results.forEach((article, index) => {
        console.log(`\nArticle ${index + 1}:`);
        console.log(`  Title: ${article.title}`);
        console.log(`  Excerpt: ${article.excerpt}`);
        console.log(`  Source: ${article.source}`);
        console.log(`  URL: ${article.url}`);
        console.log(`  Published: ${article.publishedAt}`);
        console.log(`  URL format valid: ${article.url?.startsWith('http') ? 'YES' : 'NO'}`);
      });
      
      // Test a few URLs to verify they're real
      console.log("\n=== URL Verification ===");
      const urlsToTest = results.slice(0, 3).map(a => a.url);
      
      for (const url of urlsToTest) {
        try {
          const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
          console.log(`✓ ${url} - Status: ${response.status}`);
        } catch (error) {
          console.log(`✗ ${url} - Error: ${error.message}`);
        }
      }
    } else {
      console.log("No articles found - this may indicate API key issues");
    }
    
  } catch (error) {
    console.error("Error testing news search:", error);
  }
}

testRealNewsSearch();