import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all articles for feed with pagination and search
  app.get("/api/feed", async (req, res) => {
    try {
      const search = req.query.search as string || '';
      const page = parseInt(req.query.page as string) || 1;
      const limit = 20; // Articles per page
      
      const articles = await storage.getAllArticles(search, page, limit);
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

  const httpServer = createServer(app);
  return httpServer;
}
