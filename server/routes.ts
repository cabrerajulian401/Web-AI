import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { openAIResearchService } from "./openai-service";

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

  // Generate research report
  app.post("/api/research", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query is required" });
      }

      console.log(`Generating research report for: ${query}`);
      
      const researchReport = await openAIResearchService.generateResearchReport(query);
      
      // Store the generated report in our storage
      await storage.storeResearchReport(researchReport.article.slug, researchReport);
      
      res.json({ slug: researchReport.article.slug });
    } catch (error) {
      console.error("Error generating research report:", error);
      res.status(500).json({ message: "Failed to generate research report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
