import { 
  users, 
  articles, 
  executiveSummary, 
  timelineItems, 
  citedSources, 
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
  type CitedSource,
  type InsertCitedSource,
  type RawFacts,
  type InsertRawFacts,
  type Perspective,
  type InsertPerspective,
  type ResearchReport,
  type ConflictingClaim
} from "@shared/schema";
import { RSSService } from "./rss-service";

interface ArticleData extends ResearchReport {}

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
        sourceUrl: ""
      },
      {
        id: 2,
        articleId: 1,
        date: new Date("2025-02-12T00:00:00Z"),
        title: "GPT-4.5 Announcement",
        description: "OpenAI CEO Sam Altman announces GPT-4.5 (\"Orion\") as the last model without full chain-of-thought reasoning",
        type: "announcement",
        sourceLabel: "Source 9",
        sourceUrl: ""
      },
      {
        id: 3,
        articleId: 1,
        date: new Date("2025-04-07T00:00:00Z"),
        title: "Release Delay",
        description: "OpenAI delays GPT-5 release due to technical issues and high demand. Confirms work on new models o3 and o4-mini",
        type: "announcement",
        sourceLabel: "Source 9",
        sourceUrl: ""
      },
      {
        id: 4,
        articleId: 1,
        date: new Date("2025-06-10T00:00:00Z"),
        title: "O3-Pro Release",
        description: "OpenAI releases o3-pro API, its most expensive AI model to date",
        type: "release",
        sourceLabel: "Source 9",
        sourceUrl: ""
      }
    ];

    const sampleCitedSources: CitedSource[] = [
      {
        id: 1,
        articleId: 1,
        name: "AI News Daily",
        type: "Industry Analysis",
        description: "Experts discuss the anticipated features and timeline for OpenAI's next major release, GPT-5.",
        url: "/article/openai-next-model",
        imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=120"
      },
      {
        id: 2,
        articleId: 1,
        name: "TechCrunch",
        type: "News Analysis",
        description: "Analysis of recent advances in AI reasoning capabilities and their implications.",
        url: "/article/future-ai-reasoning",
        imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=120"
      },
      {
        id: 3,
        articleId: 1,
        name: "The Verge",
        type: "Industry Analysis",
        description: "How GPT-5's advanced reasoning could reshape the AI industry landscape.",
        url: "/article/ai-market-impact",
        imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=120"
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
        color: "green",
        source: "AI News Daily",
        quote: "This is a monumental leap forward.",
        url: "/article/openai-next-model",
        conflictSource: "",
        conflictQuote: ""
      },
      {
        id: 2,
        articleId: 1,
        viewpoint: "AI Safety Researchers",
        description: "Emphasize the need for robust safety measures and ethical considerations",
        color: "yellow",
        source: "TechCrunch",
        quote: "We must proceed with caution.",
        url: "/article/future-ai-reasoning",
        conflictSource: "",
        conflictQuote: ""
      },
      {
        id: 3,
        articleId: 1,
        viewpoint: "Tech Analysts",
        description: "Analyze potential market impact and competitive positioning",
        color: "blue",
        source: "The Verge",
        quote: "The market will never be the same.",
        url: "/article/ai-market-impact",
        conflictSource: "",
        conflictQuote: ""
      }
    ];

    this.articles.set("gpt-5-announcement", {
      article: sampleArticle,
      executiveSummary: sampleExecutiveSummary,
      timelineItems: sampleTimelineItems,
      citedSources: sampleCitedSources,
      rawFacts: sampleRawFacts,
      perspectives: samplePerspectives,
      conflictingClaims: []
    });

    // Add dummy "One Big Beautiful Bill" report
    const dummyArticle: Article = {
      id: 999,
      title: "Trump's 'One Big Beautiful Bill':Everything You Need to Know.",
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
        "Bill includes various tax cuts for both individuals and businesses",
        "Large reductions to Medicaid, SNAP, and ACA; millions may lose insurance",
        "CBO projects the bill will add $1.2 trillion to the national debt"
      ]
    };

    const dummyTimelineItems: TimelineItem[] = [
      {
        id: 1000,
        articleId: 999,
        date: new Date("2025-07-04T00:00:00Z"),
        title: "'One Big Beautiful Bill' Signed into Law",
        description: "The bill is signed amid significant controversy and market uncertainty.",
        type: 'legislation',
        sourceLabel: 'Source 1',
        sourceUrl: ""
      },
      {
        id: 1001,
        articleId: 999,
        date: new Date("2025-07-10T00:00:00Z"),
        title: "CBO Releases Initial Score",
        description: "The CBO projects the bill will add $1.2 trillion to the national debt over 10 years.",
        type: 'report',
        sourceLabel: 'Source 2',
        sourceUrl: ""
      },
      {
        id: 1002,
        articleId: 999,
        date: new Date("2025-08-01T00:00:00Z"),
        title: "Protests Erupt in Major Cities",
        description: "Protests against the bill's cuts to social programs occur nationwide.",
        type: 'protest',
        sourceLabel: 'Source 3',
        sourceUrl: ""
      },
    ];

    const dummyCitedSources: CitedSource[] = [
      {
        id: 1003,
        articleId: 999,
        name: "Congressional Budget Office",
        type: "Government Report",
        description: "Non-partisan analysis of the bill's fiscal impact.",
        url: "",
        imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=120"
      },
      {
        id: 1004,
        articleId: 999,
        name: "The New York Times",
        type: "News Analysis",
        description: "In-depth coverage of the bill's passage and public reaction.",
        url: "",
        imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=120"
      },
      {
        id: 1005,
        articleId: 999,
        name: "Associated Press",
        type: "News Report",
        description: "Reports on nationwide protests against the legislation.",
        url: "",
        imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=120"
      }
    ];

    const dummyRawFacts: RawFacts[] = [
      {
        id: 1000,
        articleId: 999,
        category: "Key Provisions",
        facts: [
          "Permanent extension of 2017 tax cuts",
          "Elimination of taxes on tips and overtime",
          "$930 billion in cuts to healthcare programs"
        ]
      },
      {
        id: 1001,
        articleId: 999,
        category: "CBO Projections",
        facts: [
          "12 million to lose health insurance by 2034",
          "$1.2 trillion added to national debt",
          "0.5% decrease in GDP growth by 2030"
        ]
      }
    ];

    const dummyPerspectives: Perspective[] = [
      {
        id: 1000,
        articleId: 999,
        viewpoint: "Supporters",
        description: "Argue that tax cuts stimulate economic growth and job creation.",
        color: "green",
        source: "",
        quote: "",
        url: "",
        conflictSource: "",
        conflictQuote: ""
      },
      {
        id: 1001,
        articleId: 999,
        viewpoint: "Opponents",
        description: "Warn that the bill will increase inequality and harm vulnerable populations.",
        color: "red",
        source: "",
        quote: "",
        url: "",
        conflictSource: "",
        conflictQuote: ""
      }
    ];

    this.articles.set("one-big-beautiful-bill-trump-2025", {
      article: dummyArticle,
      executiveSummary: dummyExecutiveSummary,
      timelineItems: dummyTimelineItems,
      citedSources: dummyCitedSources,
      rawFacts: dummyRawFacts,
      perspectives: dummyPerspectives,
      conflictingClaims: []
    });

    // Add more dummy reports here...
    this.articles.set("meta-llama-3-multimodal", this.createDummyReport(
      3,
      "Meta's Llama 3 Goes Multimodal, Challenging GPT-4o",
      "meta-llama-3-multimodal",
      "Meta AI has announced that its Llama 3 model now supports multimodal inputs, enabling it to process both text and images. This move positions Llama 3 as a direct competitor to OpenAI's recently released GPT-4o.",
      `<p>Meta AI has announced a significant upgrade to its Llama 3 model, which now supports multimodal inputs, allowing it to understand and process both text and images. This development places Llama 3 in direct competition with OpenAI's GPT-4o, which has been lauded for its advanced multimodal capabilities.</p><p>According to Meta, the new Llama 3 model demonstrates strong performance on a range of multimodal benchmarks, though it currently does not support audio or video inputs. The update is being rolled out to developers and will be integrated into Meta's products, including Ray-Ban Meta smart glasses.</p>`,
      "Technology",
      new Date("2024-05-18T00:00:00Z"),
      ["Llama 3 now supports text and image inputs", "Direct competitor to OpenAI's GPT-4o", "No audio or video support yet"],
      [
        { date: new Date("2024-04-18T00:00:00Z"), title: "Llama 3 (text-only) released", description: "Meta releases the text-only version of Llama 3.", type: 'release', sourceLabel: 'Meta AI', sourceUrl: "" },
        { date: new Date("2024-05-13T00:00:00Z"), title: "OpenAI launches GPT-4o", description: "OpenAI launches its flagship multimodal model, GPT-4o.", type: 'release', sourceLabel: 'OpenAI', sourceUrl: "" },
        { date: new Date("2024-05-18T00:00:00Z"), title: "Llama 3 becomes multimodal", description: "Meta announces multimodal capabilities for Llama 3.", type: 'update', sourceLabel: 'Meta AI', sourceUrl: "" },
      ],
      [
        { name: "The Verge", type: "Tech News", description: "Coverage of Meta's announcement and its competitive implications.", url: "", imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=120" },
        { name: "TechCrunch", type: "Tech News", description: "Analysis of the new Llama 3 capabilities.", url: "", imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=120" },
      ],
      [
        { category: "Capabilities", facts: ["Processes text and images", "Performs well on multimodal benchmarks"] },
      ],
      [
        { viewpoint: "Pro-Meta", description: "Highlights the rapid innovation and competition Meta is bringing to the AI space.", color: "green", source: "", quote: "", url: "", conflictSource: "", conflictQuote: "" },
        { viewpoint: "Pro-OpenAI", description: "Points out that GPT-4o still holds an edge with audio and video support.", color: "blue", source: "", quote: "", url: "", conflictSource: "", conflictQuote: "" },
      ]
    ));

    this.articles.set("google-gemini-ultra-coding", this.createDummyReport(
      4,
      "Google's Gemini 1.5 Pro Masters Advanced Coding Tasks",
      "google-gemini-ultra-coding",
      "Google's latest model, Gemini 1.5 Pro, is demonstrating exceptional performance in complex coding challenges, surpassing previous models in understanding and generating sophisticated code.",
      "<p>Google's Gemini 1.5 Pro is making waves in the developer community with its advanced coding capabilities. The model can translate entire codebases between languages, solve complex algorithmic challenges, and even suggest architectural improvements for existing software.</p><p>It integrates with Project IDX, Google's web-based development environment, to provide real-time coding assistance. This development signals Google's intent to capture a larger share of the AI-powered developer tools market.</p>",
      "Technology",
      new Date("2024-05-15T00:00:00Z"),
      ["Gemini 1.5 Pro excels at complex coding", "Translates entire codebases", "Integrates with Project IDX"],
      [
        { date: new Date("2024-02-15T00:00:00Z"), title: "Gemini 1.5 Pro announced", description: "Google announces Gemini 1.5 Pro with a 1 million token context window.", type: 'announcement', sourceLabel: 'Google AI', sourceUrl: "" },
        { date: new Date("2024-05-14T00:00:00Z"), title: "Google I/O 2024", description: "Google showcases Gemini's advanced coding and agent capabilities at its annual developer conference.", type: 'event', sourceLabel: 'Google', sourceUrl: "" },
      ],
      [
        { name: "VentureBeat", type: "Tech News", description: "Report on Gemini's coding prowess showcased at Google I/O.", url: "", imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=120" },
      ],
      [
        { category: "Features", facts: ["Codebase translation", "Algorithmic problem-solving", "Architectural suggestions"] },
      ],
      [
        { viewpoint: "Developers", description: "Express excitement about the potential productivity gains from using Gemini for coding.", color: "green", source: "", quote: "", url: "", conflictSource: "", conflictQuote: "" },
        { viewpoint: "Competitors", description: "Note that while impressive, real-world performance across diverse coding languages remains to be seen.", color: "yellow", source: "", quote: "", url: "", conflictSource: "", conflictQuote: "" },
      ]
    ));

    this.articles.set("anthropic-claude-safety", this.createDummyReport(
      5,
      "Anthropic Prioritizes Safety in Latest Claude 3.1 Release",
      "anthropic-claude-safety",
      "Anthropic's newest model, Claude 3.1, is being released with a strong emphasis on safety and ethical AI, featuring advanced techniques to prevent misuse and reduce harmful outputs.",
      "<p>Anthropic continues to champion its 'constitutional AI' approach with the release of Claude 3.1. The company has published extensive research on the model's safety guardrails, which include methods for detecting and mitigating bias, preventing the generation of dangerous content, and ensuring the model's outputs align with a predefined set of ethical principles.</p><p>While Claude 3.1 may not top every performance benchmark, Anthropic is betting that its focus on safety will be a key differentiator for enterprise customers concerned with brand reputation and AI ethics.</p>",
      "AI Safety",
      new Date("2024-05-10T00:00:00Z"),
      ["Claude 3.1 released with focus on safety", "Advanced misuse prevention techniques", "Constitutional AI approach"],
      [
        { date: new Date("2024-03-04T00:00:00Z"), title: "Claude 3 Family Released", description: "Anthropic releases the Claude 3 model family (Opus, Sonnet, Haiku).", type: 'release', sourceLabel: 'Anthropic', sourceUrl: "" },
        { date: new Date("2024-05-10T00:00:00Z"), title: "Claude 3.1 Announced", description: "Anthropic announces Claude 3.1 with enhanced safety features.", type: 'announcement', sourceLabel: 'Anthropic', sourceUrl: "" },
      ],
      [
        { name: "Wired", type: "Magazine", description: "An article exploring Anthropic's unique approach to AI safety.", url: "", imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=120" },
      ],
      [
        { category: "Safety Features", facts: ["Bias detection and mitigation", "Dangerous content prevention", "Ethical principle alignment"] },
      ],
      [
        { viewpoint: "Ethicists", description: "Applaud Anthropic's commitment to building safe and responsible AI.", color: "green", source: "", quote: "", url: "", conflictSource: "", conflictQuote: "" },
        { viewpoint: "Performance Enthusiasts", description: "Argue that the focus on safety may come at the cost of raw performance compared to other models.", color: "yellow", source: "", quote: "", url: "", conflictSource: "", conflictQuote: "" },
      ]
    ));

    this.articles.set("microsoft-copilot-enterprise", this.createDummyReport(
      6,
      "Microsoft Expands Copilot for Enterprise with Customization Features",
      "microsoft-copilot-enterprise",
      "Microsoft is doubling down on its enterprise AI strategy with new customization options for Copilot, allowing businesses to create tailored AI assistants using their own data.",
      "<p>At its recent Build conference, Microsoft announced a suite of new tools for its Copilot platform, aimed squarely at enterprise customers. The new 'Copilot Studio' allows businesses to build, test, and publish custom copilots that are grounded in their own internal data, such as documents, emails, and databases.</p><p>This move is seen as a direct challenge to other players in the enterprise AI space, as Microsoft leverages its deep integration with its Azure cloud platform and Office 365 suite to offer a compelling, all-in-one solution.</p>",
      "Enterprise AI",
      new Date("2024-05-21T00:00:00Z"),
      ["New customization options for Copilot", "Copilot Studio allows building assistants on private data", "Leverages Azure and Office 365 integration"],
      [
        { date: new Date("2023-11-01T00:00:00Z"), title: "Microsoft 365 Copilot GA", description: "Copilot becomes generally available for Microsoft 365 enterprise customers.", type: 'release', sourceLabel: 'Microsoft', sourceUrl: "" },
        { date: new Date("2024-05-21T00:00:00Z"), title: "Microsoft Build 2024", description: "Microsoft announces Copilot Studio and deeper enterprise customization.", type: 'event', sourceLabel: 'Microsoft', sourceUrl: "" },
      ],
      [
        { name: "ZDNet", type: "Tech News", description: "Analysis of Microsoft's enterprise AI strategy from the Build conference.", url: "", imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=120" },
      ],
      [
        { category: "New Features", facts: ["Custom copilot creation", "Grounding in internal business data", "Integration with Power Platform"] },
      ],
      [
        { viewpoint: "IT Administrators", description: "Welcome the increased control and customization, which allows for better governance and security.", color: "green", source: "", quote: "", url: "", conflictSource: "", conflictQuote: "" },
        { viewpoint: "Data Privacy Advocates", description: "Raise concerns about the potential for misuse of sensitive company data if not properly managed.", color: "red", source: "", quote: "", url: "", conflictSource: "", conflictQuote: "" },
      ]
    ));

    this.articles.set("ai-hardware-startup-funding", this.createDummyReport(
      7,
      "AI Hardware Startups See Record Funding Amid Chip Shortage",
      "ai-hardware-startup-funding",
      "Venture capitalists are pouring billions into AI hardware startups that promise to deliver more efficient and powerful chips, as the demand for AI computation continues to outstrip supply.",
      "<p>The global shortage of high-end AI chips from industry leader Nvidia has created a massive opportunity for a new wave of hardware startups. Companies like Groq, Cerebras, and SambaNova are attracting significant investment for their novel chip architectures, which are designed to accelerate AI workloads more efficiently than traditional GPUs.</p><p>While Nvidia still dominates the market, the intense demand for computational power means there is ample room for new players. The success of these startups could lead to a more diverse and competitive AI hardware ecosystem.</p>",
      "Hardware",
      new Date("2024-05-20T00:00:00Z"),
      ["Record VC funding for AI hardware startups", "Companies like Groq and Cerebras attract investment", "Aimed at addressing the global AI chip shortage"],
      [
        { date: new Date("2023-01-01T00:00:00Z"), title: "AI Boom Intensifies", description: "The release of ChatGPT triggers a massive surge in demand for AI computation.", type: 'trend', sourceLabel: 'Industry', sourceUrl: "" },
        { date: new Date("2024-01-01T00:00:00Z"), title: "VC Investment Surges", description: "Venture capital funding for AI hardware startups reaches a record $20 billion in 2023.", type: 'report', sourceLabel: 'PitchBook', sourceUrl: "" },
      ],
      [
        { name: "Forbes", type: "Business News", description: "An overview of the investment landscape for AI chip startups.", url: "", imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=120" },
      ],
      [
        { category: "Key Players", facts: ["Groq (LPU)", "Cerebras (Wafer-Scale Engine)", "SambaNova Systems"] },
      ],
      [
        { viewpoint: "Investors", description: "Are bullish on the potential for massive returns, given the insatiable demand for AI compute.", color: "green", source: "", quote: "", url: "", conflictSource: "", conflictQuote: "" },
        { viewpoint: "Skeptics", description: "Warn that manufacturing at scale is incredibly difficult and that unseating an incumbent like Nvidia is a monumental task.", color: "yellow", source: "", quote: "", url: "", conflictSource: "", conflictQuote: "" },
      ]
    ));
  }

  private createDummyReport(
    id: number,
    title: string,
    slug: string,
    excerpt: string,
    content: string,
    category: string,
    publishedAt: Date,
    executiveSummaryPoints: string[],
    timelineItemsData: Omit<TimelineItem, 'id' | 'articleId'>[],
    citedSourcesData: Omit<CitedSource, 'id' | 'articleId'>[],
    rawFactsData: Omit<RawFacts, 'id' | 'articleId'>[],
    perspectivesData: Omit<Perspective, 'id' | 'articleId'>[]
  ): ArticleData {
    const article: Article = {
      id,
      title,
      slug,
      excerpt,
      content,
      category,
      publishedAt,
      readTime: Math.ceil(content.split(' ').length / 200),
      sourceCount: citedSourcesData.length,
      heroImageUrl: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=600",
      authorName: "AI News Team",
      authorTitle: "AI Research Correspondents"
    };

    const executiveSummary: ExecutiveSummary = {
      id,
      articleId: id,
      points: executiveSummaryPoints,
    };

    const timelineItems: TimelineItem[] = timelineItemsData.map((item, index) => ({
      ...item,
      id: id * 100 + index,
      articleId: id,
    }));

    const citedSources: CitedSource[] = citedSourcesData.map((source, index) => ({
      ...source,
      id: id * 100 + index,
      articleId: id,
    }));

    const rawFacts: RawFacts[] = rawFactsData.map((facts, index) => ({
      ...facts,
      id: id * 100 + index,
      articleId: id,
    }));

    const perspectives: Perspective[] = perspectivesData.map((p, index) => ({
      ...p,
      id: id * 100 + index,
      articleId: id,
    }));

    return {
      article,
      executiveSummary,
      timelineItems,
      citedSources,
      rawFacts,
      perspectives,
      conflictingClaims: []
    };
  }

  async getFeed(): Promise<Article[]> {
    const now = Date.now();
    if (now - this.lastFetchTime > this.cacheDuration) {
      this.rssArticles = await this.rssService.getFeed();
      this.lastFetchTime = now;
      console.log(`Fetched ${this.rssArticles.length} articles from RSS feed`);
    }
    return this.rssArticles;
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    let foundUser: User | undefined;
    this.users.forEach((user) => {
      if (user.username === username) {
        foundUser = user;
      }
    });
    return foundUser;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.currentUserId++,
      ...insertUser
    };
    this.users.set(user.id, user);
    return user;
  }

  async getArticleBySlug(slug: string): Promise<ArticleData | undefined> {
    // Check local articles first
    if (this.articles.has(slug)) {
      console.log(`Found static article: ${slug}`);
      return this.articles.get(slug);
    }
    
    // Then check RSS feed
    const rssArticle = this.rssArticles.find(a => a.slug === slug);
    if (rssArticle) {
      console.log(`Found RSS article: ${slug}`);
      // Construct a minimal ArticleData object for RSS feeds
      return {
        article: rssArticle,
        executiveSummary: { id: 0, articleId: rssArticle.id, points: [rssArticle.excerpt] },
        timelineItems: [],
        citedSources: [],
        rawFacts: [],
        perspectives: [],
        conflictingClaims: []
      };
    }

    console.log(`Article not found: ${slug}`);
    return undefined;
  }

  async getAllArticles(): Promise<Article[]> {
    const staticArticles = Array.from(this.articles.values()).map(data => data.article);
    const feedArticles = await this.getFeed();
    
    // Combine and remove duplicates, giving priority to static articles
    const allArticles = new Map<string, Article>();
    staticArticles.forEach(a => allArticles.set(a.slug, a));
    feedArticles.forEach(a => {
      if (!allArticles.has(a.slug)) {
        allArticles.set(a.slug, a);
      }
    });

    return Array.from(allArticles.values());
  }

  async storeResearchReport(slug: string, report: ArticleData): Promise<void> {
    this.articles.set(slug, report);
    console.log(`Report data: {"title":"${report.article.title}","hasExecutiveSummary":${!!report.executiveSummary},"timelineItemsCount":${report.timelineItems.length},"citedSourcesCount":${report.citedSources.length},"conflictingClaimsCount":${report.conflictingClaims?.length || 0}}`);
    console.log(`Stored research report: ${slug}`);
    console.log(`Total articles in storage: ${this.articles.size}`);
    console.log('All stored slugs:', Array.from(this.articles.keys()));
  }
}

export const storage = new MemStorage();
