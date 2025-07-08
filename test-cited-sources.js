// Test cited sources extraction logic
const sampleRawFacts = [
  {
    id: 1,
    articleId: 1,
    category: "Key Facts",
    facts: [
      {
        text: "The Guadalupe River rose approximately 26 feet in 45 minutes during the flooding.",
        source: "Wikipedia",
        url: "https://en.wikipedia.org/wiki/July_2025_Central_Texas_floods"
      },
      {
        text: "At least 87 fatalities were reported in Kerr County, including 30 children.",
        source: "Wikipedia", 
        url: "https://en.wikipedia.org/wiki/July_2025_Central_Texas_floods"
      },
      {
        text: "Camp Mystic reported 27 campers and counselors dead due to the flooding.",
        source: "Wikipedia",
        url: "https://en.wikipedia.org/wiki/Camp_Mystic"
      }
    ]
  }
];

const samplePerspectives = [
  {
    id: 1,
    viewpoint: "Emergency Response Critique",
    source: "Reuters",
    url: "https://www.reuters.com/sustainability/climate-energy/texas-floods-death-toll-creeps-up-search-rescue-continues-2025-07-08/"
  },
  {
    id: 2,
    viewpoint: "Community Resilience",
    source: "Serve Source",
    url: "https://www.servesource.org/disasters/texas-flooding-guadalupe-river"
  }
];

// Simulate source extraction
const sourceMap = new Map();

console.log('Processing raw facts for cited sources...');
sampleRawFacts.forEach((factGroup) => {
  console.log(`Processing fact group: ${factGroup.category}`);
  if (factGroup.facts) {
    factGroup.facts.forEach((fact) => {
      console.log(`Processing fact: ${fact.text?.substring(0, 50)}... Source: ${fact.source}`);
      if (fact.source && !sourceMap.has(fact.source)) {
        console.log(`Adding source to map: ${fact.source}`);
        sourceMap.set(fact.source, {
          name: fact.source,
          type: "Primary Source",
          description: `Source cited for factual information about ${factGroup.category}`,
          url: fact.url
        });
      } else if (fact.source) {
        console.log(`Source already exists in map: ${fact.source}`);
      }
    });
  }
});

console.log('\nProcessing perspectives for cited sources...');
samplePerspectives.forEach((perspective) => {
  console.log(`Processing perspective: ${perspective.viewpoint} Source: ${perspective.source}`);
  if (perspective.source && !sourceMap.has(perspective.source)) {
    console.log(`Adding source to map: ${perspective.source}`);
    sourceMap.set(perspective.source, {
      name: perspective.source,
      type: "News Analysis",
      description: `Source for perspective: "${perspective.viewpoint}"`,
      url: perspective.url
    });
  } else if (perspective.source) {
    console.log(`Source already exists in map: ${perspective.source}`);
  }
});

console.log('\nFinal source map:');
Array.from(sourceMap.entries()).forEach(([name, data]) => {
  console.log(`- ${name}: ${data.type} (${data.url})`);
});

console.log(`\nTotal sources found: ${sourceMap.size}`);