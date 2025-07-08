// Test Pexels API with improved search terms
const fetch = require('node-fetch');

const testSearches = [
  'flooding disaster water',
  'books library research',
  'news media journalism',
  'community volunteers helping'
];

async function testPexelsSearch() {
  const apiKey = process.env.PEXELS_API_KEY;
  
  if (!apiKey) {
    console.log('PEXELS_API_KEY not available');
    return;
  }
  
  console.log('Testing Pexels search with improved terms...\n');
  
  for (const query of testSearches) {
    try {
      const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`, {
        headers: {
          'Authorization': apiKey,
          'User-Agent': 'TIMIO News Research App'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Query: "${query}"`);
        console.log(`Found ${data.photos.length} images:`);
        data.photos.forEach((photo, index) => {
          console.log(`  ${index + 1}. ${photo.alt}`);
        });
        console.log();
      } else {
        console.log(`Error for "${query}": ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`Error for "${query}": ${error.message}`);
    }
  }
}

testPexelsSearch();