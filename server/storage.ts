import { 
  users, 
  articles, 
  executiveSummary, 
  timelineItems, 
  relatedArticles, 
  rawFacts, 
  perspectives,
  badges,
  userBadges,
  userStats,
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
  type InsertPerspective,
  type Badge,
  type InsertBadge,
  type UserBadge,
  type InsertUserBadge,
  type UserStats,
  type InsertUserStats
} from "@shared/schema";
import { RSSService } from "./rss-service";
import { BadgeService, type UserBadgeData } from "./badge-service";

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
  storeResearchReport(slug: string, report: ArticleData): Promise<void>;
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
        sourceLabel: "Source 9",
        sourceUrl: null
      },
      {
        id: 2,
        articleId: 1,
        date: new Date("2025-02-12T00:00:00Z"),
        title: "GPT-4.5 Announcement",
        description: "OpenAI CEO Sam Altman announces GPT-4.5 (\"Orion\") as the last model without full chain-of-thought reasoning",
        type: "announcement",
        sourceLabel: "Source 9",
        sourceUrl: null
      },
      {
        id: 3,
        articleId: 1,
        date: new Date("2025-04-07T00:00:00Z"),
        title: "Release Delay",
        description: "OpenAI delays GPT-5 release due to technical issues and high demand. Confirms work on new models o3 and o4-mini",
        type: "announcement",
        sourceLabel: "Source 9",
        sourceUrl: null
      },
      {
        id: 4,
        articleId: 1,
        date: new Date("2025-06-10T00:00:00Z"),
        title: "O3-Pro Release",
        description: "OpenAI releases o3-pro API, its most expensive AI model to date",
        type: "release",
        sourceLabel: "Source 9",
        sourceUrl: null
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

    // Add dummy "One Big Beautiful Bill" report
    const dummyArticle: Article = {
      id: 999,
      title: "Trump Signs 'One Big Beautiful Bill' Into Law on July 4, 2025",
      slug: "one-big-beautiful-bill-trump-2025",
      excerpt: "President Trump signed the 'One Big Beautiful Bill' into law on July 4, 2025, featuring permanent tax cuts, massive cuts to Medicaid and SNAP, and work requirements that could leave 12 million without health insurance by 2034.",
      content: `President Trump signed the "One Big Beautiful Bill" into law on July 4, 2025, marking what supporters call "the start of a new golden age for America" and critics denounce as "a direct and heartless assault on the American people."

The comprehensive legislation makes permanent the largest tax cuts in U.S. history while implementing the most significant reductions to Medicaid, SNAP, and the Affordable Care Act since their creation. The Congressional Budget Office estimates that 12 million Americans could lose health insurance by 2034 due to the changes.

The bill passed on strict party lines, with the Senate approving it 51-50 (with Vice President JD Vance casting the tie-breaking vote) and the House passing it 218-214, with only two House Republicans voting against it.

Key provisions include permanent extension of the 2017 Tax Cuts and Jobs Act, elimination of taxes on tips and overtime, expanded work requirements for Medicaid and SNAP, and approximately $930 billion in cuts to healthcare programs over ten years.`,
      category: "Politics",
      publishedAt: new Date("2025-07-05T00:00:00Z"),
      readTime: 8,
      sourceCount: 24,
      heroImageUrl: "/assets/gettyimages-2223448615_wide-7ca202551a6122dfb03f2969e5d59c36d278e323_1751754477125.jpg",
      authorName: "Political Research Team",
      authorTitle: "TIMIO News Analysis"
    };

    const dummyExecutiveSummary: ExecutiveSummary = {
      id: 999,
      articleId: 999,
      points: [
        "President Trump signed the 'One Big Beautiful Bill' into law on July 4, 2025",
        "Bill includes permanent tax cuts, especially benefiting businesses and high earners",
        "Large reductions to Medicaid, SNAP, and ACA; millions may lose insurance",
        "Massive funding boost for border enforcement, ICE, and defense",
        "Protests and political backlash began immediately after passage"
      ]
    };

    const dummyTimelineItems: TimelineItem[] = [
      {
        id: 999,
        articleId: 999,
        date: new Date("2025-05-22T00:00:00Z"),
        title: "House Initial Passage",
        description: "House passes initial version 215-214",
        type: "legislative",
        sourceLabel: "Congressional Record",
        sourceUrl: "https://www.congress.gov/congressional-record"
      },
      {
        id: 1000,
        articleId: 999,
        date: new Date("2025-06-16T00:00:00Z"),
        title: "Senate Committee Action",
        description: "Senate Finance Committee releases final text and summary",
        type: "legislative",
        sourceLabel: "Senate Finance Committee",
        sourceUrl: "https://www.finance.senate.gov/"
      },
      {
        id: 1001,
        articleId: 999,
        date: new Date("2025-07-01T00:00:00Z"),
        title: "Senate Passage",
        description: "Senate passes revised bill 51-50, VP breaks tie",
        type: "legislative",
        sourceLabel: "Senate Clerk",
        sourceUrl: "https://www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_117_1.htm"
      },
      {
        id: 1002,
        articleId: 999,
        date: new Date("2025-07-02T00:00:00Z"),
        title: "House Final Passage",
        description: "House passes final bill 218-214",
        type: "legislative",
        sourceLabel: "House Clerk",
        sourceUrl: "https://clerk.house.gov/Votes"
      },
      {
        id: 1003,
        articleId: 999,
        date: new Date("2025-07-04T00:00:00Z"),
        title: "Presidential Signature",
        description: "Trump signs the bill into law on Independence Day",
        type: "signing",
        sourceLabel: "White House",
        sourceUrl: "https://www.whitehouse.gov/briefing-room/presidential-actions/"
      },
      {
        id: 1004,
        articleId: 999,
        date: new Date("2025-07-05T00:00:00Z"),
        title: "Protests Begin",
        description: "Protests and rallies against the law begin in major cities",
        type: "protest",
        sourceLabel: "Associated Press",
        sourceUrl: "https://apnews.com/"
      }
    ];

    const dummyRelatedArticles: RelatedArticle[] = [
      {
        id: 999,
        articleId: 999,
        title: "Congressional Budget Office Official Analysis: 12 Million Could Lose Insurance Under New Law",
        excerpt: "Congressional Budget Office projects significant coverage losses due to work requirements and funding cuts.",
        url: "https://www.cbo.gov/cost-estimates",
        source: "Congressional Budget Office",
        imageUrl: "/assets/gettyimages-2223448615_wide-7ca202551a6122dfb03f2969e5d59c36d278e323_1751754477125.jpg"
      },
      {
        id: 1000,
        articleId: 999,
        title: "State Governors Prepare Legal Challenges to Federal Cuts",
        excerpt: "Multiple state attorneys general announce coordinated legal strategy to challenge federal healthcare cuts.",
        url: "https://apnews.com/politics",
        source: "Associated Press",
        imageUrl: "/assets/gettyimages-2223448615_wide-7ca202551a6122dfb03f2969e5d59c36d278e323_1751754477125.jpg"
      },
      {
        id: 1001,
        articleId: 999,
        title: "Business Groups Praise Permanent Tax Relief",
        excerpt: "Industry organizations applaud permanent tax cuts and business deduction expansions in new legislation.",
        url: "https://www.wsj.com/politics",
        source: "Wall Street Journal",
        imageUrl: "/assets/gettyimages-2223448615_wide-7ca202551a6122dfb03f2969e5d59c36d278e323_1751754477125.jpg"
      }
    ];

    const dummyRawFacts: RawFacts[] = [
      {
        id: 999,
        articleId: 999,
        category: "Legislative",
        facts: [
          "Permanent extension of 2017 Tax Cuts and Jobs Act (TCJA) tax brackets and doubled standard deduction",
          "No tax on tips or overtime; increased senior deduction; enhanced child tax credit", 
          "Increased small business expensing threshold and permanent Small Business Deduction",
          "Raised death tax exemption, expanded 199A deduction to 23% for pass-through business income",
          "Imposes work requirements of at least 80 hours/month for Medicaid eligibility"
        ]
      },
      {
        id: 1000,
        articleId: 999,
        category: "Financial Impact",
        facts: [
          "Cuts SNAP funding by nearly $300 billion; Medicaid, ACA, CHIP by about $930 billion",
          "Raises national debt limit by $5 trillion", 
          "Adds $3.3 trillion to the deficit over 10 years (CBO)",
          "Nearly $1.7 trillion in mandatory savings claimed by White House"
        ]
      },
      {
        id: 1001,
        articleId: 999,
        category: "Voting Record",
        facts: [
          "Passed Senate 51-50 (VP JD Vance tie-breaker), House 218-214",
          "Only two House Republicans voted against the bill",
          "Bill passed on strict party lines with massive lobbying campaigns"
        ]
      }
    ];

    const dummyPerspectives: Perspective[] = [
      {
        id: 999,
        articleId: 999,
        viewpoint: "Administration Supporters",
        description: "Praise the legislation as 'historic tax relief' and 'unleashing economic growth while restoring fiscal sanity.' Business groups applaud permanent tax cuts for small businesses and wholesaler-distributors.",
        color: "green"
      },
      {
        id: 1000,
        articleId: 999,
        viewpoint: "State Officials & Critics", 
        description: "Call it a 'heartless assault on the American people' that strips healthcare and food assistance. State governors say they lack resources to fill the massive federal funding hole.",
        color: "red"
      },
      {
        id: 1001,
        articleId: 999,
        viewpoint: "Health Organizations",
        description: "Describe it as 'among the darkest days in U.S. health care history,' warning that people will suffer and die due to cuts funding tax cuts for billionaires.",
        color: "orange"
      },
      {
        id: 1002,
        articleId: 999,
        viewpoint: "Nonpartisan Analysis",
        description: "Penn Wharton Budget Model projects lifetime losses for all future generations, ranging from $5,700 for high-income to $22,000 for low-income households. Public support drops to 21% after hearing about hospital funding cuts.",
        color: "blue"
      }
    ];

    this.articles.set("one-big-beautiful-bill-trump-2025", {
      article: dummyArticle,
      executiveSummary: dummyExecutiveSummary,
      timelineItems: dummyTimelineItems,
      relatedArticles: dummyRelatedArticles,
      rawFacts: dummyRawFacts,
      perspectives: dummyPerspectives
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
    [article2, article3, article4, article5, article6].forEach((article, index) => {
      this.articles.set(article.slug, {
        article,
        executiveSummary: { id: article.id, articleId: article.id, points: ["Article summary coming soon"] },
        timelineItems: [
          {
            id: index * 10 + 1,
            articleId: article.id,
            date: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
            title: "Development Announced",
            description: "Initial announcement and industry reactions",
            type: "",
            sourceLabel: "TechCrunch",
            sourceUrl: null
          },
          {
            id: index * 10 + 2,
            articleId: article.id,
            date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            title: "Technical Details Released",
            description: "More information becomes available",
            type: "",
            sourceLabel: "The Verge",
            sourceUrl: null
          },
          {
            id: index * 10 + 3,
            articleId: article.id,
            date: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
            title: "Market Impact",
            description: "Industry analysts weigh in on implications",
            type: "",
            sourceLabel: "Wall Street Journal",
            sourceUrl: null
          }
        ],
        relatedArticles: [
          {
            id: index * 10 + 1,
            articleId: article.id,
            title: "Background: Previous Developments",
            excerpt: "Context and background information on this developing story",
            url: "https://example.com/background-" + article.slug,
            source: "Tech Insider",
            imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&h=200&fit=crop"
          },
          {
            id: index * 10 + 2,
            articleId: article.id,
            title: "Opinion: What Industry Leaders Think",
            excerpt: "Expert perspectives on the implications and future impact",
            url: "https://example.com/opinion-" + article.slug,
            source: "Industry Weekly",
            imageUrl: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=300&h=200&fit=crop"
          },
          {
            id: index * 10 + 3,
            articleId: article.id,
            title: "Deep Dive: Technical Analysis",
            excerpt: "Detailed technical breakdown and analysis of the development",
            url: "https://example.com/analysis-" + article.slug,
            source: "Technical Review",
            imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=200&fit=crop"
          }
        ],
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
        timelineItems: [
          {
            id: 1,
            articleId: rssArticle.id,
            date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            title: "Initial Report",
            description: "Story first reported by major news outlets",
            type: "",
            sourceLabel: "Reuters",
            sourceUrl: null
          },
          {
            id: 2,
            articleId: rssArticle.id,
            date: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
            title: "Expert Analysis",
            description: "Industry experts provide initial commentary",
            type: "",
            sourceLabel: "Bloomberg",
            sourceUrl: null
          },
          {
            id: 3,
            articleId: rssArticle.id,
            date: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
            title: "Market Response",
            description: "Financial markets react to the development",
            type: "",
            sourceLabel: "CNN",
            sourceUrl: null
          },
          {
            id: 4,
            articleId: rssArticle.id,
            date: new Date(),
            title: "Current Status",
            description: "Latest updates and ongoing developments",
            type: "",
            sourceLabel: "Associated Press",
            sourceUrl: null
          }
        ],
        relatedArticles: [
          {
            id: 1,
            articleId: rssArticle.id,
            title: "Related: Understanding the Background",
            excerpt: "Context and background information on this developing story",
            url: "https://example.com/background",
            source: "Industry Journal",
            imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&h=200&fit=crop"
          },
          {
            id: 2,
            articleId: rssArticle.id,
            title: "Analysis: What This Means for the Industry",
            excerpt: "Expert perspectives on the implications and future impact",
            url: "https://example.com/analysis",
            source: "Tech Weekly",
            imageUrl: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=300&h=200&fit=crop"
          },
          {
            id: 3,
            articleId: rssArticle.id,
            title: "Expert Opinion: Future Implications",
            excerpt: "Detailed analysis of long-term consequences and predictions",
            url: "https://example.com/expert-opinion",
            source: "Expert Views",
            imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=200&fit=crop"
          }
        ],
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

  async storeResearchReport(slug: string, report: ArticleData): Promise<void> {
    this.articles.set(slug, report);
    console.log(`Stored research report: ${slug}`);
  }
}

export const storage = new MemStorage();
