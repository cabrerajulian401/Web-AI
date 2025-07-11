import express from 'express';
import { langChainNewResearchAgent } from './langchain-new';
import { storage } from './storage';
import { pexelsService } from './pexels-service';

const router = express.Router();

// Research endpoint using LangChain New Agent
router.post('/research', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required and must be a string' });
    }

    console.log(`\n=== LANGCHAIN NEW RESEARCH REQUEST ===`);
    console.log(`Query: ${query}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);

    // Get hero image for the query
    let heroImageUrl: string | undefined;
    try {
      heroImageUrl = await pexelsService.searchImageByTopic(query, 0);
      console.log(`Hero image found: ${heroImageUrl}`);
    } catch (imageError) {
      console.warn('Failed to get hero image:', imageError);
    }

    // Generate research report using LangChain New Agent
    const startTime = Date.now();
    const report = await langChainNewResearchAgent.generateResearchReport(query, heroImageUrl);
    const endTime = Date.now();

    console.log(`Research report generated in ${endTime - startTime}ms`);
    console.log(`Report title: ${report.article.title}`);
    console.log(`=== ROUTE HANDLER EXECUTIVE SUMMARY CHECK ===`);
    console.log(`Executive summary object:`, report.executiveSummary);
    console.log(`Executive summary points:`, report.executiveSummary.points);
    console.log(`Executive summary points length:`, report.executiveSummary.points.length);
    console.log(`Has non-default executive summary:`, 
      report.executiveSummary.points.length > 0 && 
      !report.executiveSummary.points.includes("No executive summary available.")
    );
    console.log(`Timeline items: ${report.timelineItems.length}`);
    console.log(`Cited sources: ${report.citedSources.length}`);
    console.log(`Raw facts categories: ${report.rawFacts.length}`);
    console.log(`Perspectives: ${report.perspectives.length}`);

    // Store the report
    const slug = report.article.slug;
    await storage.storeResearchReport(slug, report as any); // Type cast to match storage interface
    console.log(`Stored research report with slug: ${slug}`);

    // Verify what was actually stored
    const storedArticle = await storage.getArticleBySlug(slug);
    console.log(`=== STORAGE VERIFICATION ===`);
    console.log(`Stored executive summary:`, storedArticle?.executiveSummary);
    console.log(`Stored executive summary points:`, storedArticle?.executiveSummary?.points);

    // Log storage statistics
    const allArticles = await storage.getAllArticles();
    console.log(`Total articles in storage: ${allArticles.length}`);
    console.log(`All stored slugs: ${JSON.stringify(allArticles.map(a => a.slug))}`);

    res.json({ 
      slug,
      title: report.article.title,
      hasExecutiveSummary: report.executiveSummary.points.length > 0,
      executiveSummaryPreview: report.executiveSummary.points.slice(0, 2), // Show first 2 points for debugging
      timelineItemsCount: report.timelineItems.length,
      citedSourcesCount: report.citedSources.length,
      rawFactsCount: report.rawFacts.length,
      perspectivesCount: report.perspectives.length,
      generationTime: endTime - startTime
    });

  } catch (error) {
    console.error('LangChain New Research Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate research report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get article by slug
router.get('/article/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    console.log(`Looking for article with slug: ${slug}`);

    // Get all articles to debug
    const allArticles = await storage.getAllArticles();
    console.log(`Available articles in storage: ${JSON.stringify(allArticles.map(a => a.slug))}`);

    const article = await storage.getArticleBySlug(slug);
    
    if (!article) {
      console.log(`Article not found: ${slug}`);
      return res.status(404).json({ error: 'Article not found' });
    }

    console.log(`Found static article: ${slug}`);
    res.json({ article });

  } catch (error) {
    console.error('Error retrieving article:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve article',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all articles
router.get('/articles', async (req, res) => {
  try {
    const articles = await storage.getAllArticles();
    res.json({ articles });
  } catch (error) {
    console.error('Error retrieving articles:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve articles',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    agent: 'LangChain New Research Agent',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for agent functionality
router.post('/test', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`Testing LangChain New Agent with query: ${query}`);
    
    // Test the agent with a simple query
    const report = await langChainNewResearchAgent.generateResearchReport(query);
    
    res.json({
      success: true,
      title: report.article.title,
      contentLength: report.article.content.length,
      sourcesCount: report.citedSources.length,
      message: 'Agent test completed successfully'
    });

  } catch (error) {
    console.error('Agent test error:', error);
    res.status(500).json({ 
      error: 'Agent test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 