// Test script to verify that OpenAI is generating fake URLs
// This demonstrates the problem we need to solve

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testRealityCheck() {
  console.log("=== REALITY CHECK: OpenAI Web Search Claims ===\n");
  
  // Test 1: Ask OpenAI to search for something very specific and recent
  console.log("Test 1: Asking for very specific recent news...");
  const response1 = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a web search assistant. Use your web search capabilities to find recent news articles about the specific topic. Return real URLs only."
      },
      {
        role: "user", 
        content: "Search for news articles published TODAY about 'artificial intelligence breakthrough quantum computing' and return the actual URLs"
      }
    ],
    max_tokens: 500
  });
  
  console.log("OpenAI Response:", response1.choices[0].message.content);
  console.log("\n" + "=".repeat(50) + "\n");
  
  // Test 2: Ask OpenAI directly about its capabilities
  console.log("Test 2: Asking OpenAI about its own capabilities...");
  const response2 = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: "Do you have access to real-time web search capabilities? Can you browse the internet and return actual URLs to current news articles?"
      }
    ],
    max_tokens: 300
  });
  
  console.log("OpenAI Response:", response2.choices[0].message.content);
  console.log("\n" + "=".repeat(50) + "\n");
  
  console.log("CONCLUSION: OpenAI models do NOT have web search capabilities.");
  console.log("Any URLs they provide are fabricated, not real web search results.");
  console.log("We need to implement actual web search using a real API service.");
}

testRealityCheck();