import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Share2, Clock, TrendingUp, Eye, Settings, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ExpandableSection } from "@/components/ui/expandable-section";
import { Timeline } from "@/components/ui/timeline";
import { RelatedArticles } from "@/components/ui/related-articles";
import { ThemeController } from "@/components/theme-controller";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import type { Article, ExecutiveSummary, TimelineItem, RelatedArticle, RawFacts, Perspective } from "@shared/schema";
import timioLogo from "@assets/App Icon_1751662407764.png";
import execSummaryIcon from "@assets/hour clear_1751669332914.png";
import conflictIcon from "@assets/image (4)_1751670771904.png";
import pivotIcon from "@assets/Pivot Icon Clear_1751670260305.png";

interface ArticleData {
  article: Article;
  executiveSummary: ExecutiveSummary;
  timelineItems: TimelineItem[];
  relatedArticles: RelatedArticle[];
  rawFacts: RawFacts[];
  perspectives: Perspective[];
}

export default function ArticlePage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showThemeController, setShowThemeController] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const researchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/research", { query });
      return response.json();
    },
    onSuccess: (data) => {
      // Navigate to the generated research report
      setLocation(`/article/${data.slug}`);
      toast({
        title: "Research Report Generated",
        description: "Your comprehensive research report is ready to view.",
      });
    },
    onError: (error) => {
      console.error("Research generation failed:", error);
      toast({
        title: "Research Failed",
        description: "Unable to generate research report. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Extract slug from URL path
  const currentPath = window.location.pathname;
  const slug = currentPath.split('/article/')[1] || 'gpt-5-announcement';

  // Get search query from URL params or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryFromUrl = urlParams.get('q');
    if (queryFromUrl) {
      setSearchQuery(queryFromUrl);
    } else {
      const savedQuery = localStorage.getItem('searchQuery');
      if (savedQuery) {
        setSearchQuery(savedQuery);
      }
    }
  }, []);

  const [useDummyMode, setUseDummyMode] = useState(false);

  // Check dummy mode on component mount and when localStorage changes
  useEffect(() => {
    const checkDummyMode = () => {
      const isDummy = localStorage.getItem('useDummyArticle') === 'true';
      setUseDummyMode(isDummy);
    };
    
    checkDummyMode();
    
    // Listen for localStorage changes
    const handleStorageChange = () => checkDummyMode();
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const { data: articleData, isLoading } = useQuery<ArticleData>({
    queryKey: ["/api/article", slug, useDummyMode],
    queryFn: async () => {
      // If dummy mode is enabled, always return the original dummy article
      if (useDummyMode) {
        return fetch('/api/article/one-big-beautiful-bill-trump-2025').then(res => res.json());
      }
      
      // Otherwise use the actual slug
      return fetch(`/api/article/${slug}`).then(res => res.json());
    },
  });

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: articleData?.article.title,
          text: articleData?.article.excerpt,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "The article link has been copied to your clipboard.",
        });
      }
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Unable to share the article. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBackToFeed = () => {
    setLocation("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (useDummyMode) {
        // If dummy mode is enabled, navigate directly to the dummy article without any API calls
        setLocation('/article/one-big-beautiful-bill-trump-2025');
        return;
      }
      
      // Save search query to localStorage
      localStorage.setItem('searchQuery', searchQuery);
      // Generate research report using OpenAI
      researchMutation.mutate(searchQuery);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen theme-page-bg">
        <header className="theme-header-bg shadow-sm relative">
          <div className="absolute bottom-0 left-0 right-0 h-0.5 theme-divider"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-32">
              <div className="flex items-center space-x-6">
                {/* Logo and Brand */}
                <div className="flex items-center space-x-6">
                  <img 
                    src={timioLogo} 
                    alt="TIMIO News" 
                    className="h-16 w-16 rounded-lg"
                  />
                  <div>
                    <span className="text-5xl font-bold text-brand-dark">TIMIO News</span>
                    <p className="text-xl text-gray-600 mt-2">Truth. Trust. Transparency.</p>
                  </div>
                </div>

                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!articleData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Article Not Found</h1>
              <p className="text-gray-600 mb-4">The article you're looking for doesn't exist.</p>
              <Button onClick={handleBackToFeed} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { article, executiveSummary, timelineItems, relatedArticles, rawFacts, perspectives } = articleData;

  return (
    <div className="min-h-screen theme-page-bg">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Combined Header and Article Hero */}
            <Card className="theme-article-card-bg theme-article-card-border theme-article-card-hover shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden animate-fade-in">
              <CardContent className="p-0">
                {/* Hero Image with Overlay - Increased height to prevent overlap */}
                <div className="relative overflow-hidden">
                  <img 
                    src={article.heroImageUrl}
                    alt={article.title}
                    className="w-full h-64 object-cover"
                  />
                  {/* Semitransparent mask */}
                  <div className="absolute inset-0 bg-black bg-opacity-40"></div>

                  {/* TIMIO Logo and Search Bar - Over Image with better spacing */}
                  <div className="absolute top-4 left-4 right-4 pb-2">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <img 
                          src={timioLogo} 
                          alt="TIMIO News" 
                          className="h-6 w-6 rounded-lg"
                        />
                        <span className="text-lg font-bold text-white">TIMIO News</span>
                      </div>
                      <Button
                        onClick={handleBackToFeed}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20 px-3 py-1"
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back
                      </Button>
                    </div>

                    {/* Search Bar - Smaller and Transparent with constrained width */}
                    <div className="relative max-w-2xl">
                      <form onSubmit={handleSearch} className="relative">
                        <div className="relative flex items-center bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 shadow-lg hover:bg-white/30 transition-all duration-300 focus-within:bg-white/30 focus-within:border-white/50">
                          <Search className="h-4 w-4 text-white ml-3" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Generate a report on any event"
                            className="w-full py-2 px-3 text-white placeholder-white/70 bg-transparent border-none outline-none text-sm font-medium"
                          />
                          <Button
                            type="submit"
                            disabled={researchMutation.isPending}
                            className="bg-blue-600/80 hover:bg-blue-700 text-white px-4 py-1 rounded-md text-sm font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50"
                          >
                            {researchMutation.isPending ? "Researching..." : "Research"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Headline overlay - Increased top padding to prevent overlap */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 pt-20">
                    <p className="text-xl font-bold text-blue-300 mb-3 tracking-wide">RESEARCH REPORT</p>
                    <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                      {article.title}
                    </h1>
                  </div>
                </div>

                {/* Executive Summary - Collapsible */}
                <ExpandableSection
                  title="Executive Summary"
                  icon="users"
                  customIcon={execSummaryIcon}
                  defaultOpen={true}
                  content={
                    <div className="space-y-3">
                      {executiveSummary.points ? 
                        // Handle dummy article format (array of points)
                        executiveSummary.points.map((point, index) => (
                          <div key={index} className="flex items-start">
                            <div className="h-2 w-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-black">{point}</span>
                          </div>
                        ))
                        : 
                        // Handle AI-generated article format (string with bullet points)
                        (executiveSummary.summary ? executiveSummary.summary.split('\n').filter(line => line.trim()).map((point, index) => (
                          <div key={index} className="flex items-start">
                            <div className="h-2 w-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-black">{point.replace(/^-\s*/, '')}</span>
                          </div>
                        )) : [])
                      }
                    </div>
                  }
                />
              </CardContent>
            </Card>

            {/* Expandable Sections */}
            <div className="space-y-6 mt-8">
              <ExpandableSection
                title="Raw Facts"
                icon="database"
                content={
                  <div className="mt-4 space-y-8">
                    {rawFacts && rawFacts.length > 0 ? (
                      <div className="space-y-6">
                        {rawFacts.map((fact, index) => (
                          <div key={index} className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="text-gray-900 leading-relaxed">
                                {fact.fact}
                              </span>
                              {fact.source && (
                                <div className="text-sm text-gray-600 mt-1">
                                  Source: {fact.source}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-lg font-bold text-black mb-3">
                          <a 
                            href="https://www.congress.gov/search?q=%7B%22source%22:%22legislation%22%7D" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-gray-600 transition-colors"
                          >
                            Directly from the Bill: H.R.1 - "One Big Beautiful Bill Act"<br />
                            (Congress.gov)
                          </a>
                        </h3>
                        <div className="w-full h-0.5 bg-black mb-6"></div>
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              Makes Trump tax cuts permanent
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              Tax reductions for incomes &lt;$500k (5-year limit)
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              New deductions: tips, overtime, auto loans (expire 2028)
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              Adds $200 to child tax credit
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              1% remittance tax; increases endowment investment taxes
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              Ends clean energy credits; opens federal land to oil & gas
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              Cuts to Medicaid, Medicare, SNAP; shifts SNAP costs to states
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                      <div className="flex items-start">
                        <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-gray-900 leading-relaxed">
                          ICE funding increases tenfold to $100B by 2029
                        </span>
                      </div>

                      <div className="flex items-start">
                        <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-gray-900 leading-relaxed">
                          Adds $150B to defense, $150B to border enforcement
                        </span>
                      </div>

                      <div className="flex items-start">
                        <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-gray-900 leading-relaxed">
                          Raises debt ceiling by $5T
                        </span>
                      </div>
                    </div>

                    {/* CBO Analysis Section */}
                    <div>
                      <h3 className="text-lg font-bold text-black mb-3">
                        <a href="https://www.cbo.gov/system/files/2025-01/59927-Reconciliation.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors">
                          Congressional Budget Office Analysis<br />
                          (CBO.gov)
                        </a>
                      </h3>
                      <div className="w-full h-0.5 bg-black mb-6"></div>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span className="text-gray-900 leading-relaxed">
                            Adds $2.8T to deficit by 2034
                          </span>
                        </div>

                        <div className="flex items-start">
                          <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span className="text-gray-900 leading-relaxed">
                            10.9M lose insurance, mainly from Medicaid
                          </span>
                        </div>

                        <div className="flex items-start">
                          <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span className="text-gray-900 leading-relaxed">
                            Medicaid & CHIP enrollment drops by 10.5M
                          </span>
                        </div>
                      </div>
                    </div>
                    )}
                  </div>
                }
              />

              <ExpandableSection
                title="Different Perspectives"
                icon="pivot"
                customIcon={pivotIcon}
                content={
                  <div className="mt-4 space-y-4">
                    {/* Pro-Trump Perspective */}
                    <Collapsible defaultOpen={false}>
                      <CollapsibleTrigger className="w-full">
                        <div className="bg-red-600 text-white p-6 rounded-lg hover:bg-red-700 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="text-left">
                              <h3 className="font-bold text-xl mb-2">A Golden Age for America: Trump Delivers on Promises</h3>
                              <p className="text-sm opacity-80">Sources: 3</p>
                            </div>
                            <ChevronDown className="h-6 w-6 ml-4 flex-shrink-0" />
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-6 space-y-6 bg-gray-100">
                          <p className="text-gray-800 text-lg font-semibold">Bill is historic, pro-growth, fulfills campaign promises, benefits families and businesses.</p>
                          <div className="w-full h-0.5 bg-black my-2"></div>

                          <div className="space-y-6">
                            <div>
                              <div className="text-blue-600 text-sm font-semibold mb-2 uppercase">WHITE HOUSE</div>
                              <blockquote className="text-black italic mb-3 pl-4 border-l-4 border-blue-400">
                                "President Trump's One Big, Beautiful Bill delivers on the commonsense agenda that nearly 80 million Americans voted for – the largest middle-class tax cut in history, permanent border security, massive military funding, and restoring fiscal sanity."
                              </blockquote>
                              <div className="border border-blue-600 rounded-md p-2 inline-block">
                                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                  Read the article →
                                </a>
                              </div>
                            </div>

                            <div>
                              <div className="text-blue-600 text-sm font-semibold mb-2 uppercase">AMERICA FIRST POLICY INSTITUTE</div>
                              <blockquote className="text-black italic mb-3 pl-4 border-l-4 border-blue-400">
                                "The One, Big, Beautiful Bill cuts taxes for ALL Americans, secures the border, stands up to the woke mob by empowering parents and protecting women and children, and much more!"
                              </blockquote>
                              <div className="border border-blue-600 rounded-md p-2 inline-block">
                                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                  Read the article →
                                </a>
                              </div>
                            </div>

                            <div>
                              <div className="text-blue-600 text-sm font-semibold mb-2 uppercase">AMAC ACTION</div>
                              <blockquote className="text-black italic mb-3 pl-4 border-l-4 border-blue-400">
                                "...a bold and necessary step toward securing the financial future of both our nation and its seniors...a win for seniors, for taxpayers, and for the future of our country."
                              </blockquote>
                              <div className="border border-blue-600 rounded-md p-2 inline-block">
                                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                  Read the article →
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Democratic Opposition */}
                    <Collapsible defaultOpen={false}>
                      <CollapsibleTrigger className="w-full">
                        <div className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="text-left">
                              <h3 className="font-bold text-xl mb-2">A Gift to the Wealthy, a Blow to the Vulnerable</h3>
                              <p className="text-sm opacity-80">Sources: 3</p>
                            </div>
                            <ChevronDown className="h-6 w-6 ml-4 flex-shrink-0" />
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-6 space-y-6 bg-gray-100">
                          <p className="text-gray-800 text-lg font-semibold">Bill slashes social safety net, benefits rich, harms poor/elderly, increases deficit.</p>
                          <div className="w-full h-0.5 bg-black my-2"></div>

                          <div className="space-y-6">
                            <div>
                              <div className="text-blue-600 text-sm font-semibold mb-2 uppercase">GOVERNOR WES MOORE (MARYLAND)</div>
                              <blockquote className="text-black italic mb-3 pl-4 border-l-4 border-blue-400">
                                "This so-called 'Big Beautiful Bill' marks a direct and heartless assault on the American people...taking health care away from nearly 200,000 Marylanders, and hurting 684,000 Marylanders that rely on food assistance..."
                              </blockquote>
                              <div className="border border-blue-600 rounded-md p-2 inline-block">
                                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                  Read the article →
                                </a>
                              </div>
                            </div>

                            <div>
                              <div className="text-blue-600 text-sm font-semibold mb-2 uppercase">DEMOCRATIC MINORITY LEADER HAKEEM JEFFRIES (VIA AL JAZEERA)</div>
                              <blockquote className="text-black italic mb-3 pl-4 border-l-4 border-blue-400">
                                "...harms everyday Americans while granting billionaires substantial tax benefits."
                              </blockquote>
                              <div className="border border-blue-600 rounded-md p-2 inline-block">
                                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                  Read the article →
                                </a>
                              </div>
                            </div>

                            <div>
                              <div className="text-blue-600 text-sm font-semibold mb-2 uppercase">ELON MUSK (VIA AL JAZEERA)</div>
                              <blockquote className="text-black italic mb-3 pl-4 border-l-4 border-blue-400">
                                "...would inflate spending and exacerbate the nation's already unparalleled debt."
                              </blockquote>
                              <div className="border border-blue-600 rounded-md p-2 inline-block">
                                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                  Read the article →
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Public Opinion */}
                    <Collapsible defaultOpen={false}>
                      <CollapsibleTrigger className="w-full">
                        <div className="bg-gray-600 text-white p-6 rounded-lg hover:bg-gray-700 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="text-left">
                              <h3 className="font-bold text-xl mb-2">Skeptical Public: Most Oppose, But Some Provisions Popular</h3>
                              <p className="text-sm opacity-80">Sources: 3</p>
                            </div>
                            <ChevronDown className="h-6 w-6 ml-4 flex-shrink-0" />
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-6 space-y-6 bg-gray-100">
                          <p className="text-gray-800 text-lg font-semibold">Majority of Americans oppose bill overall; support for some tax cuts and Medicaid work requirements.</p>
                          <div className="w-full h-0.5 bg-black my-2"></div>

                          <div className="space-y-6">
                            <div>
                              <div className="text-blue-600 text-sm font-semibold mb-2 uppercase">PEW RESEARCH CENTER</div>
                              <blockquote className="text-black italic mb-3 pl-4 border-l-4 border-blue-400">
                                "Far more Americans oppose the legislation than favor it. Nearly half (49%) oppose it, while 29% favor it. Another 21% are not sure."
                              </blockquote>
                              <div className="border border-blue-600 rounded-md p-2 inline-block">
                                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                  Read the article →
                                </a>
                              </div>
                            </div>

                            <div>
                              <div className="text-blue-600 text-sm font-semibold mb-2 uppercase">QUINNIPIAC UNIVERSITY POLL (VIA ABC NEWS)</div>
                              <blockquote className="text-black italic mb-3 pl-4 border-l-4 border-blue-400">
                                "Fifty-five percent of voters said that they oppose the bill, while 29% said they support it and 16% were unsure."
                              </blockquote>
                              <div className="border border-blue-600 rounded-md p-2 inline-block">
                                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                  Read the article →
                                </a>
                              </div>
                            </div>

                            <div>
                              <div className="text-blue-600 text-sm font-semibold mb-2 uppercase">AXIOS</div>
                              <blockquote className="text-black italic mb-3 pl-4 border-l-4 border-blue-400">
                                "Americans largely disapprove of the megabill but are more split on some of the specific provisions."
                              </blockquote>
                              <div className="border border-blue-600 rounded-md p-2 inline-block">
                                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                  Read the article →
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                }
              />

              <ExpandableSection
                title="Conflicting Info"
                icon="conflict"
                customIcon={conflictIcon}
                content={
                  <div className="mt-6 space-y-6">
                    <div className="pl-4 pb-4 border-b-2 border-gray-200">
                      <h4 className="font-semibold text-brand-dark mb-3 text-lg">Does the bill cut Medicaid?</h4>
                      <div className="ml-4">
                        <p className="text-gray-700 text-base mb-3">
                          <strong>White House:</strong> "There will be no cuts to Medicaid…protects and strengthens Medicaid for those who rely on it."
                        </p>
                        <p className="text-gray-700 text-base mb-3">
                          <strong>CBO, Governor Moore, hospital groups:</strong> Bill will cut Medicaid, millions will lose coverage
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">[White House] vs [CBO, AHA, Governor Moore]</span>
                      </div>
                    </div>
                    <div className="pl-4 pb-4 border-b-2 border-gray-200">
                      <h4 className="font-semibold text-brand-dark mb-3 text-lg">Effect on Deficit</h4>
                      <div className="ml-4">
                        <p className="text-gray-700 text-base mb-3">
                          <strong>White House:</strong> "Reduces deficits by over $2 trillion by increasing economic growth and cutting waste, fraud, and abuse."
                        </p>
                        <p className="text-gray-700 text-base mb-3">
                          <strong>CBO:</strong> "Adds $3.4 trillion to federal deficits over the next 10 years."
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">[White House] vs [CBO]</span>
                      </div>
                    </div>
                    <div className="pl-4 pb-4 border-b-2 border-gray-200">
                      <h4 className="font-semibold text-brand-dark mb-3 text-lg">Impact on Vulnerable Americans</h4>
                      <div className="ml-4">
                        <p className="text-gray-700 text-base mb-3">
                          <strong>White House:</strong> "Delivers largest middle-class tax cut…improves the lives of Americans on every rung of the economic ladder."
                        </p>
                        <p className="text-gray-700 text-base mb-3">
                          <strong>Hospitals, state officials:</strong> "Irreparable harm to healthcare, millions lose coverage, food assistance gutted."
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">[White House] vs [AHA, Governor Moore]</span>
                      </div>
                    </div>
                    <div className="pl-4">
                      <h4 className="font-semibold text-brand-dark mb-3 text-lg">Work Requirements and Safety Net</h4>
                      <div className="ml-4">
                        <p className="text-gray-700 text-base mb-3">
                          <strong>White House:</strong> "Promotes work, responsibility, and restores SNAP to serve the truly needy."
                        </p>
                        <p className="text-gray-700 text-base mb-3">
                          <strong>Critics:</strong> "Millions will lose benefits due to new work requirements."
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">[White House] vs [AHA, Governor Moore]</span>
                      </div>
                    </div>
                  </div>
                }
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <Timeline items={timelineItems} />
            <div className="border-t-2 border-gray-300 my-6"></div>
            <RelatedArticles articles={relatedArticles} />
            <div className="border-t-2 border-gray-300 my-6"></div>
          </div>
        </div>
      </main>

      {/* Theme Controller */}
      {showThemeController && <ThemeController onClose={() => setShowThemeController(false)} />}
    </div>
  );
}