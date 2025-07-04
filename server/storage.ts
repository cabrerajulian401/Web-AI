import { 
  users, 
  articles, 
  executiveSummary, 
  timelineItems, 
  relatedArticles, 
  rawFacts, 
  perspectives,
  type User, 
  type InsertUser,
  type Article,
  type InsertArticle,
  type ExecutiveSummary,
  type InsertExecutiveSummary,
  type TimelineItem,
  type InsertTimelineItem,
  type RelatedArticle,
  type InsertRelatedArticle,
  type RawFacts,
  type InsertRawFacts,
  type Perspective,
  type InsertPerspective
} from "@shared/schema";
import { RSSService } from "./rss-service";

interface ArticleData {
  article: Article;
  executiveSummary: ExecutiveSummary;
  timelineItems: TimelineItem[];
  relatedArticles: RelatedArticle[];
  rawFacts: RawFacts[];
  perspectives: Perspective[];
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getArticleBySlug(slug: string): Promise<ArticleData | undefined>;
  getAllArticles(): Promise<Article[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private articles: Map<string, ArticleData>;
  private currentUserId: number;
  private rssService: RSSService;
  private lastFetchTime: number = 0;
  private cacheDuration: number = 5 * 60 * 1000; // 5 minutes cache
  private rssArticles: Article[] = [];

  constructor() {
    this.users = new Map();
    this.articles = new Map();
    this.currentUserId = 1;
    this.rssService = new RSSService('https://www.google.com/alerts/feeds/18329999330306112380/624266987313125830');
    this.initializeData();
  }

  private initializeData() {
    // Initialize with the sample article data
    const sampleArticle: Article = {
      id: 1,
      title: "OpenAI Announces GPT-5 with Revolutionary Reasoning Capabilities",
      slug: "gpt-5-announcement",
      excerpt: "OpenAI has officially announced the development of GPT-5, marking a significant leap forward in artificial intelligence capabilities with unprecedented reasoning abilities.",
      content: `<p class="text-lg text-gray-700 leading-relaxed mb-6">OpenAI has officially announced the development of GPT-5, marking a significant leap forward in artificial intelligence capabilities. The new model demonstrates unprecedented reasoning abilities that could revolutionize how AI systems approach complex problem-solving tasks.</p>

<p class="text-gray-700 leading-relaxed mb-6">According to OpenAI's latest research, GPT-5 shows remarkable improvements in logical reasoning, mathematical problem-solving, and chain-of-thought processing. The model's enhanced capabilities represent a fundamental shift in how AI systems can understand and manipulate abstract concepts.</p>

<p class="text-gray-700 leading-relaxed mb-6">The announcement comes at a time when the AI industry is experiencing rapid growth and increasing competition. GPT-5's advanced reasoning capabilities are expected to set new standards for AI performance across various domains, from scientific research to creative applications.</p>`,
      category: "Technology",
      publishedAt: new Date("2024-12-20T10:00:00Z"),
      readTime: 5,
      sourceCount: 12,
      heroImageUrl: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=600",
      authorName: "Tech News Team",
      authorTitle: "AI Research Correspondents"
    };

    const sampleExecutiveSummary: ExecutiveSummary = {
      id: 1,
      articleId: 1,
      points: [
        "OpenAI announces GPT-5 with enhanced reasoning capabilities",
        "GPT-5 shows 40% improvement in logical reasoning tasks",
        "Enhanced mathematical problem-solving capabilities",
        "Expected commercial release in Q2 2024"
      ]
    };

    const sampleTimelineItems: TimelineItem[] = [
      {
        id: 1,
        articleId: 1,
        date: new Date("2024-12-20T00:00:00Z"),
        title: "GPT-5 Announcement",
        description: "OpenAI announces o3 model with advanced reasoning capabilities",
        type: "announcement",
        sourceLabel: "Source 9"
      },
      {
        id: 2,
        articleId: 1,
        date: new Date("2025-02-12T00:00:00Z"),
        title: "GPT-4.5 Announcement",
        description: "OpenAI CEO Sam Altman announces GPT-4.5 (\"Orion\") as the last model without full chain-of-thought reasoning",
        type: "announcement",
        sourceLabel: "Source 9"
      },
      {
        id: 3,
        articleId: 1,
        date: new Date("2025-04-07T00:00:00Z"),
        title: "Release Delay",
        description: "OpenAI delays GPT-5 release due to technical issues and high demand. Confirms work on new models o3 and o4-mini",
        type: "announcement",
        sourceLabel: "Source 9"
      },
      {
        id: 4,
        articleId: 1,
        date: new Date("2025-06-10T00:00:00Z"),
        title: "O3-Pro Release",
        description: "OpenAI releases o3-pro API, its most expensive AI model to date",
        type: "release",
        sourceLabel: "Source 9"
      }
    ];

    const sampleRelatedArticles: RelatedArticle[] = [
      {
        id: 1,
        articleId: 1,
        title: "OpenAI's Next Model: What to Expect",
        excerpt: "Experts discuss the anticipated features and timeline for OpenAI's next major release, GPT-5.",
        source: "AI News Daily",
        imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=120",
        url: "/article/openai-next-model"
      },
      {
        id: 2,
        articleId: 1,
        title: "The Future of AI Reasoning",
        excerpt: "Analysis of recent advances in AI reasoning capabilities and their implications.",
        source: "TechCrunch",
        imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=120",
        url: "/article/future-ai-reasoning"
      },
      {
        id: 3,
        articleId: 1,
        title: "AI Market Impact Analysis",
        excerpt: "How GPT-5's advanced reasoning could reshape the AI industry landscape.",
        source: "The Verge",
        imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=120",
        url: "/article/ai-market-impact"
      }
    ];

    const sampleRawFacts: RawFacts[] = [
      {
        id: 1,
        articleId: 1,
        category: "Performance Metrics",
        facts: [
          "40% improvement in reasoning tasks",
          "25% better mathematical accuracy",
          "30% enhanced logical consistency"
        ]
      },
      {
        id: 2,
        articleId: 1,
        category: "Technical Specifications",
        facts: [
          "Advanced transformer architecture",
          "Multi-modal reasoning capabilities",
          "Enhanced safety measures"
        ]
      }
    ];

    const samplePerspectives: Perspective[] = [
      {
        id: 1,
        articleId: 1,
        viewpoint: "Industry Experts",
        description: "Praise the advancement in AI reasoning capabilities and potential applications",
        color: "green"
      },
      {
        id: 2,
        articleId: 1,
        viewpoint: "AI Safety Researchers",
        description: "Emphasize the need for robust safety measures and ethical considerations",
        color: "yellow"
      },
      {
        id: 3,
        articleId: 1,
        viewpoint: "Tech Analysts",
        description: "Analyze potential market impact and competitive positioning",
        color: "blue"
      }
    ];

    this.articles.set("gpt-5-announcement", {
      article: sampleArticle,
      executiveSummary: sampleExecutiveSummary,
      timelineItems: sampleTimelineItems,
      relatedArticles: sampleRelatedArticles,
      rawFacts: sampleRawFacts,
      perspectives: samplePerspectives
    });

    // Add more sample articles for the feed
    const article2: Article = {
      id: 2,
      title: "Meta's LLaMA 3 Achieves Breakthrough in Multimodal AI",
      slug: "meta-llama-3-multimodal",
      excerpt: "Meta's latest LLaMA 3 model demonstrates significant improvements in understanding and generating content across text, images, and audio modalities.",
      content: `<p>Meta's LLaMA 3 represents a major advancement in multimodal AI capabilities, offering unprecedented performance across various content types.</p>`,
      category: "Technology",
      publishedAt: new Date("2024-12-18T14:30:00Z"),
      readTime: 7,
      sourceCount: 15,
      heroImageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=600",
      authorName: "AI Research Team",
      authorTitle: "Meta AI Correspondents"
    };

    const article3: Article = {
      id: 3,
      title: "Google's Gemini Ultra Sets New Benchmarks in Code Generation",
      slug: "google-gemini-ultra-coding",
      excerpt: "Google's Gemini Ultra model achieves state-of-the-art performance on coding benchmarks, surpassing previous models in complex programming tasks.",
      content: `<p>Google's Gemini Ultra has established new standards for AI-assisted code generation with remarkable accuracy and efficiency.</p>`,
      category: "Technology",
      publishedAt: new Date("2024-12-17T09:15:00Z"),
      readTime: 6,
      sourceCount: 8,
      heroImageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=600",
      authorName: "Tech Analysis Team",
      authorTitle: "Google AI Reporters"
    };

    const article4: Article = {
      id: 4,
      title: "Anthropic's Claude 3.5 Introduces Advanced Safety Features",
      slug: "anthropic-claude-safety",
      excerpt: "Anthropic unveils Claude 3.5 with enhanced safety mechanisms and improved alignment capabilities for enterprise applications.",
      content: `<p>Anthropic's Claude 3.5 focuses on responsible AI development with robust safety features and alignment improvements.</p>`,
      category: "AI Safety",
      publishedAt: new Date("2024-12-16T11:45:00Z"),
      readTime: 4,
      sourceCount: 6,
      heroImageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=600",
      authorName: "Safety Research Team",
      authorTitle: "AI Ethics Correspondents"
    };

    const article5: Article = {
      id: 5,
      title: "Microsoft Copilot Integration Transforms Enterprise Workflows",
      slug: "microsoft-copilot-enterprise",
      excerpt: "Microsoft's Copilot AI integration across Office 365 and Azure services is revolutionizing how enterprises approach productivity and automation.",
      content: `<p>Microsoft Copilot's enterprise integration is transforming business workflows with intelligent automation and productivity enhancements.</p>`,
      category: "Enterprise",
      publishedAt: new Date("2024-12-15T16:20:00Z"),
      readTime: 5,
      sourceCount: 10,
      heroImageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=600",
      authorName: "Enterprise AI Team",
      authorTitle: "Microsoft Correspondents"
    };

    const article6: Article = {
      id: 6,
      title: "Startup Raises $50M for Revolutionary AI Hardware Architecture",
      slug: "ai-hardware-startup-funding",
      excerpt: "A Silicon Valley startup secures major funding to develop next-generation AI chips designed specifically for transformer architectures.",
      content: `<p>The startup's innovative approach to AI hardware promises significant improvements in performance and energy efficiency for large language models.</p>`,
      category: "Funding",
      publishedAt: new Date("2024-12-14T13:10:00Z"),
      readTime: 3,
      sourceCount: 5,
      heroImageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=600",
      authorName: "Venture Capital Team",
      authorTitle: "Startup Correspondents"
    };

    // Add placeholder data for other articles (we'll only implement the main article fully)
    [article2, article3, article4, article5, article6].forEach(article => {
      this.articles.set(article.slug, {
        article,
        executiveSummary: { id: article.id, articleId: article.id, points: ["Article summary coming soon"] },
        timelineItems: [],
        relatedArticles: [],
        rawFacts: [],
        perspectives: []
      });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getArticleBySlug(slug: string): Promise<ArticleData | undefined> {
    // First check if it's one of our detailed static articles
    const staticArticle = this.articles.get(slug);
    if (staticArticle) {
      return staticArticle;
    }

    // If not found in static articles, check RSS articles
    await this.getAllArticles(); // This will refresh RSS if needed
    const rssArticle = this.rssArticles.find(article => article.slug === slug);
    
    if (rssArticle) {
      // Create minimal article data structure for RSS articles
      return {
        article: rssArticle,
        executiveSummary: {
          id: rssArticle.id,
          articleId: rssArticle.id,
          points: [
            "This article is sourced from Google Alerts RSS feed",
            "Full analysis and summary available at the original source",
            "Visit the source link for complete details"
          ]
        },
        timelineItems: [],
        relatedArticles: [],
        rawFacts: [],
        perspectives: []
      };
    }

    return undefined;
  }

  async getAllArticles(): Promise<Article[]> {
    // Check if we need to refresh the RSS feed
    const now = Date.now();
    if (now - this.lastFetchTime > this.cacheDuration || this.rssArticles.length === 0) {
      try {
        console.log('Fetching fresh RSS data...');
        this.rssArticles = await this.rssService.fetchArticles();
        this.lastFetchTime = now;
        console.log(`Fetched ${this.rssArticles.length} articles from RSS feed`);
      } catch (error) {
        console.error('Failed to fetch RSS articles:', error);
        // If RSS fails, return the static articles as fallback
        return Array.from(this.articles.values()).map(articleData => articleData.article);
      }
    }
    
    return this.rssArticles;
  }
}

export const storage = new MemStorage();
