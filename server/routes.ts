import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tavilyResearchAgent } from "./tavily-research-agent";
import { pexelsService } from "./pexels-service";
// import langChainNewRoutes from "./routes-langchain-new";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all articles for feed
  app.get("/api/feed", async (req, res) => {
    try {
      const articles = await storage.getAllArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get article by slug
  app.get("/api/article/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const articleData = await storage.getArticleBySlug(slug);
      
      if (!articleData) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.json(articleData);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Generate research report (current simple web search agent)
  app.post("/api/research", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query is required" });
      }

      console.log(`Generating research report for: ${query}`);
      
      // Fetch relevant image from Pexels based on the query (index 0 for main article)
      const heroImageUrl = await pexelsService.searchImageByTopic(query, 0);
      console.log(`Fetched hero image from Pexels: ${heroImageUrl}`);
      
      const researchReport = await tavilyResearchAgent.generateResearchReport(query, heroImageUrl);
      
      // Store the generated report in our storage
      await storage.storeResearchReport(researchReport.article.slug, researchReport);
      
      res.json({ slug: researchReport.article.slug });
    } catch (error) {
      console.error("Error generating research report:", error);
      res.status(500).json({ message: "Failed to generate research report" });
    }
  });

  // LangChain New Research Agent routes (commented out to use Tavily instead)
  // app.use("/api/langchain", langChainNewRoutes);

  // Tavily Research Agent test route
  app.post("/api/tavily/research", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query is required" });
      }

      console.log(`Testing Tavily research agent with query: ${query}`);
      
      // Fetch relevant image from Pexels based on the query (index 0 for main article)
      const heroImageUrl = await pexelsService.searchImageByTopic(query, 0);
      console.log(`Fetched hero image from Pexels: ${heroImageUrl}`);
      
      const researchReport = await tavilyResearchAgent.generateResearchReport(query, heroImageUrl);
      
      // Store the generated report in our storage
      await storage.storeResearchReport(researchReport.article.slug, researchReport);
      
      res.json({ 
        slug: researchReport.article.slug,
        message: "Tavily research report generated successfully",
        sourceCount: researchReport.article.sourceCount
      });
    } catch (error) {
      console.error("Error generating Tavily research report:", error);
      res.status(500).json({ message: "Failed to generate Tavily research report", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
