import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Share2, Clock, TrendingUp, Eye, Settings, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ExpandableSection } from "@/components/ui/expandable-section";
import { Timeline } from "@/components/ui/timeline";
import { CitedSources } from "@/components/ui/cited-sources";
import { ThemeController } from "@/components/theme-controller";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import type { Article, ExecutiveSummary, TimelineItem, CitedSource, RawFacts, Perspective } from "@shared/schema";
import { TextFormatter } from "@/utils/text-formatter";
import { ErrorBoundary, LoadingState, EmptyState, ErrorMessage } from "@/components/ui/error-boundary";
import timioLogo from "@assets/App Icon_1751662407764.png";
import execSummaryIcon from "@assets/hour clear_1751669332914.png";
import conflictIcon from "@assets/image (4)_1751670771904.png";
import pivotIcon from "@assets/Pivot Icon Clear_1751670260305.png";

interface ArticleData {
  article: Article;
  executiveSummary: ExecutiveSummary;
  timelineItems: TimelineItem[];
  citedSources: CitedSource[];
  rawFacts: RawFacts[];
  perspectives: Perspective[];
}

export default function ArticlePage() {
  const { toast } = useToast();
  const { currentTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [showThemeController, setShowThemeController] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Helper function to find URL for a source name
  const findSourceUrl = (sourceName: string, citedSources: CitedSource[]): string | null => {
    const source = citedSources.find(s => 
      s.name.toLowerCase().includes(sourceName.toLowerCase()) ||
      sourceName.toLowerCase().includes(s.name.toLowerCase())
    );
    return source?.url || null;
  };

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
  const [dummyModeLoading, setDummyModeLoading] = useState(false);

  // Check dummy mode on component mount and when localStorage changes
  useEffect(() => {
    const checkDummyMode = () => {
      const isDummy = localStorage.getItem('useDummyArticle') === 'true';
      
      // If switching to dummy mode, show loading for a brief moment
      if (isDummy && !useDummyMode) {
        setDummyModeLoading(true);
        setTimeout(() => {
          setDummyModeLoading(false);
          setUseDummyMode(isDummy);
        }, 800); // 800ms loading animation
      } else {
        setUseDummyMode(isDummy);
      }
    };
    
    checkDummyMode();
    
    // Listen for localStorage changes
    const handleStorageChange = () => checkDummyMode();
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const { data: articleData, error, isLoading } = useQuery({
    queryKey: [`/api/article/${slug}`],
    queryFn: async () => {
      // If dummy mode is enabled, always return the original dummy article
      if (useDummyMode) {
        return fetch('/api/article/one-big-beautiful-bill-trump-2025').then(res => res.json());
      }
      
      // Otherwise use the actual slug
      return fetch(`/api/article/${slug}`).then(res => res.json());
    },
    enabled: !!slug,
  });

  // Debug logging for conflicting claims
  useEffect(() => {
    if (articleData) {
      console.log('=== FRONTEND DEBUGGING ===');
      console.log('Article data received:', articleData);
      console.log('Perspectives:', articleData.perspectives);
      
      const perspectivesWithConflicts = articleData.perspectives?.filter(
        (p: any) => p.conflictSource && p.conflictQuote
      );
      console.log('Perspectives with conflicts:', perspectivesWithConflicts);
      console.log('Number of perspectives with conflicts:', perspectivesWithConflicts?.length || 0);
      
      perspectivesWithConflicts?.forEach((p: any, index: number) => {
        console.log(`Conflict ${index + 1}:`, {
          source: p.source,
          quote: p.quote,
          conflictSource: p.conflictSource,
          conflictQuote: p.conflictQuote,
          viewpoint: p.viewpoint
        });
      });
    }
  }, [articleData]);

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
      // Save search query to localStorage for persistence (for both dummy and real modes)
      localStorage.setItem('searchQuery', searchQuery);
      
      if (useDummyMode) {
        // If dummy mode is enabled, navigate directly to the dummy article without any API calls
        setLocation('/article/one-big-beautiful-bill-trump-2025');
        return;
      }
      
      // Navigate to loading page which will handle the research
      setLocation('/research-loading');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  // Show dummy mode loading overlay (keeping search bar visible)
  if (dummyModeLoading) {
    return (
      <div className="min-h-screen theme-page-bg">
        {/* Keep the header with search bar */}
        <header className="theme-header-bg shadow-sm relative">
          <div className="flex items-center justify-between h-20 sm:h-24 md:h-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <img 
                src={timioLogo} 
                alt="TIMIO News" 
                className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 object-contain" 
              />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold theme-text-primary">
                TIMIO News
              </h1>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowThemeController(!showThemeController)}
                className="p-2"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Search Bar - Same as feed page */}
          <div className="border-t theme-header-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="flex flex-col items-center space-y-4 sm:space-y-6">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold theme-research-prompt-text text-center px-4">
                  Generate a report on any event
                </h2>
                <div className="relative w-full max-w-2xl px-4 sm:px-0">
                  {/* Enhanced background with gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl sm:rounded-2xl blur-sm opacity-20"></div>
                  <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-3xl transform hover:-translate-y-1">
                    <Search className="absolute left-3 sm:left-6 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-7 sm:w-7 text-blue-500" />
                    <Input
                      type="text"
                      placeholder="Enter a story to research..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full pl-10 sm:pl-16 pr-20 sm:pr-32 py-3 sm:py-6 text-base sm:text-xl bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-gray-400 touch-manipulation"
                      disabled
                    />
                    <div className="absolute right-1 sm:right-4 top-1/2 transform -translate-y-1/2">
                      <Button 
                        onClick={handleSearch}
                        disabled
                        className="bg-blue-600 hover:bg-blue-700 px-2 sm:px-6 py-1.5 sm:py-2 text-white font-semibold rounded-lg shadow-md text-xs sm:text-base disabled:opacity-50 touch-manipulation min-h-[36px] sm:min-h-[40px]"
                      >
                        <span className="hidden sm:inline">Research</span>
                        <span className="sm:hidden">Go</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Loading overlay for content area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <h3 className="text-lg font-medium text-gray-900">Loading article...</h3>
              <p className="text-sm text-gray-600">Switching to dummy content</p>
            </div>
          </div>
        </main>

        {/* Theme Controller */}
        {showThemeController && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            <ThemeController onClose={() => setShowThemeController(false)} />
          </div>
        )}
      </div>
    );
  }

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

  if (!articleData || !articleData.article) {
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

  const { article, executiveSummary, timelineItems, citedSources, rawFacts, perspectives } = articleData;

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
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <Button
                          onClick={() => setShowThemeController(!showThemeController)}
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20 p-1 sm:p-2 min-h-[32px] sm:min-h-[36px] touch-manipulation"
                        >
                          <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          onClick={handleBackToFeed}
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20 px-2 sm:px-3 py-1 sm:py-2 min-h-[32px] sm:min-h-[36px] touch-manipulation"
                        >
                          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">Back</span>
                        </Button>
                      </div>
                    </div>

                    {/* Search Bar - Mobile-friendly with responsive design */}
                    <div className="relative max-w-full sm:max-w-2xl">
                      <form onSubmit={handleSearch} className="relative">
                        <div className="relative flex items-center bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 shadow-lg hover:bg-white/30 transition-all duration-300 focus-within:bg-white/30 focus-within:border-white/50">
                          <Search className="h-3 w-3 sm:h-4 sm:w-4 text-white ml-2 sm:ml-3" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Generate a report on any event"
                            className="w-full py-2 px-2 sm:px-3 text-white placeholder-white/70 bg-transparent border-none outline-none text-xs sm:text-sm font-medium touch-manipulation"
                          />
                          <Button
                            type="submit"
                            disabled={researchMutation.isPending}
                            className="bg-blue-600/80 hover:bg-blue-700 active:bg-blue-800 text-white px-2 sm:px-4 py-1 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50 touch-manipulation min-h-[32px] sm:min-h-[36px]"
                          >
                            {researchMutation.isPending ? (
                              <span className="hidden sm:inline">Researching...</span>
                            ) : (
                              <span className="hidden sm:inline">Research</span>
                            )}
                            {researchMutation.isPending ? (
                              <span className="sm:hidden">...</span>
                            ) : (
                              <span className="sm:hidden">Go</span>
                            )}
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
                      {executiveSummary && executiveSummary.points ? 
                        // Handle dummy article format (array of points)
                        executiveSummary.points.map((point: string, index: number) => (
                          <div key={index} className="flex items-start">
                            <div className="h-2 w-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-black leading-relaxed">{TextFormatter.cleanText(point)}</span>
                          </div>
                        ))
                        : 
                        // Handle AI-generated article format (string with bullet points)
                        (executiveSummary && executiveSummary.summary ? TextFormatter.formatExecutiveSummary(executiveSummary.summary).map((point: string, index: number) => (
                          <div key={index} className="flex items-start">
                            <div className="h-2 w-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-black leading-relaxed">{point}</span>
                          </div>
                        )) : [])
                      }
                      {(!executiveSummary || (!executiveSummary.points && !executiveSummary.summary)) && (
                        <div className="text-gray-600 italic">
                          No executive summary available for this report.
                        </div>
                      )}
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
                    {/* Check if dummy mode is enabled */}
                    {useDummyMode ? (
                      // Show dummy data for the "Big Beautiful Bill"
                      <>
                        {/* Use the actual rawFacts data from storage */}
                        {rawFacts && rawFacts.length > 0 ? (
                          rawFacts.map((factGroup: any, groupIndex: number) => (
                            <div key={groupIndex} className="mb-8">
                              <h3 className="text-lg font-bold text-black mb-3">
                                {factGroup.category}
                              </h3>
                              <div className="w-full h-0.5 bg-black mb-6"></div>
                              <div className="space-y-3">
                                {factGroup.facts.map((fact: any, index: number) => (
                                  <div key={index} className="flex items-start">
                                    <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                                    <span className="text-gray-900 leading-relaxed">
                                      {fact}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-600 italic">
                            No raw facts available for this report.
                          </div>
                        )}
                      </>
                    ) : (
                      // Show OpenAI-generated raw facts
                      <>
                        {rawFacts && rawFacts.length > 0 ? (
                          // Display facts by category with proper formatting
                          TextFormatter.formatRawFacts(rawFacts).map((factGroup: any, groupIndex: number) => (
                            <div key={groupIndex}>
                              <h3 className="text-lg font-bold text-black mb-3">
                                {TextFormatter.cleanText(factGroup.category)}
                              </h3>
                              <div className="w-full h-0.5 bg-black mb-6"></div>
                              <div className="space-y-3">
                                {factGroup.facts.map((fact: any, index: number) => (
                                  <div key={index} className="flex items-start">
                                    <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                                    <div className="text-gray-900 leading-relaxed">
                                      <div className="space-y-2">
                                        <span>{fact.text}</span>
                                        {fact.source && (
                                          <div className="text-sm text-gray-600">
                                            Source: {fact.source}
                                            {fact.url && TextFormatter.isValidUrl(fact.url) && (
                                              <a 
                                                href={fact.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="ml-2 text-blue-600 hover:text-blue-800 underline"
                                              >
                                                View Source
                                              </a>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-600 italic">
                            No raw facts available for this report.
                          </div>
                        )}
                      </>
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
                    {perspectives && perspectives.length > 0 ? (
                      // Show OpenAI-generated perspectives with proper formatting
                      TextFormatter.formatPerspectives(perspectives).map((perspective: any, index: number) => {
                        // Use different colors for different viewpoints
                        const colors = [
                          'bg-red-600 hover:bg-red-700',
                          'bg-blue-600 hover:bg-blue-700', 
                          'bg-gray-600 hover:bg-gray-700',
                          'bg-green-600 hover:bg-green-700',
                          'bg-purple-600 hover:bg-purple-700'
                        ];
                        const colorClass = colors[index % colors.length];
                        
                        return (
                          <Collapsible key={index} defaultOpen={false}>
                            <CollapsibleTrigger className="w-full">
                              <div className={`${colorClass} text-white p-6 rounded-lg transition-colors`}>
                                <div className="flex items-center justify-between">
                                  <div className="text-left">
                                    <h3 className="font-bold text-xl mb-2 leading-tight">{perspective.viewpoint}</h3>
                                    <p className="text-sm opacity-80">Source: {perspective.source}</p>
                                  </div>
                                  <ChevronDown className="h-6 w-6 ml-4 flex-shrink-0" />
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="p-6 space-y-6 bg-gray-100">
                                <p className="text-gray-800 text-lg font-semibold leading-relaxed">{perspective.description}</p>
                                <div className="w-full h-0.5 bg-black my-2"></div>
                                
                                {perspective.quote && (
                                  <div>
                                    <div className="text-blue-600 text-sm font-semibold mb-2 uppercase">{perspective.source}</div>
                                    <blockquote className="text-black italic mb-3 pl-4 border-l-4 border-blue-400 leading-relaxed">
                                      "{perspective.quote}"
                                    </blockquote>
                                    {perspective.url && TextFormatter.isValidUrl(perspective.url) && (
                                      <div className="border border-blue-600 rounded-md p-2 inline-block">
                                        <a 
                                          href={perspective.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                          Read the article →
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })
                    ) : (
                      // Only show dummy data if dummy mode is enabled
                      useDummyMode ? (
                        <>
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
                                  {findSourceUrl("White House", citedSources) && (
                                    <div className="border border-blue-600 rounded-md p-2 inline-block">
                                      <a 
                                        href={findSourceUrl("White House", citedSources)!} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                      >
                                        Read the article →
                                      </a>
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <div className="text-blue-600 text-sm font-semibold mb-2 uppercase">AMERICA FIRST POLICY INSTITUTE</div>
                                  <blockquote className="text-black italic mb-3 pl-4 border-l-4 border-blue-400">
                                    "The One, Big, Beautiful Bill cuts taxes for ALL Americans, secures the border, stands up to the woke mob by empowering parents and protecting women and children, and much more!"
                                  </blockquote>
                                  {findSourceUrl("America First Policy Institute", citedSources) && (
                                    <div className="border border-blue-600 rounded-md p-2 inline-block">
                                      <a 
                                        href={findSourceUrl("America First Policy Institute", citedSources)!} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                      >
                                        Read the article →
                                      </a>
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <div className="text-blue-600 text-sm font-semibold mb-2 uppercase">AMAC ACTION</div>
                                  <blockquote className="text-black italic mb-3 pl-4 border-l-4 border-blue-400">
                                    "...a bold and necessary step toward securing the financial future of both our nation and its seniors...a win for seniors, for taxpayers, and for the future of our country."
                                  </blockquote>
                                  {findSourceUrl("AMAC Action", citedSources) && (
                                    <div className="border border-blue-600 rounded-md p-2 inline-block">
                                      <a 
                                        href={findSourceUrl("AMAC Action", citedSources)!} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                      >
                                        Read the article →
                                      </a>
                                    </div>
                                  )}
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
                                  {findSourceUrl("Governor", citedSources) && (
                                    <div className="border border-blue-600 rounded-md p-2 inline-block">
                                      <a 
                                        href={findSourceUrl("Governor", citedSources)!} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                      >
                                        Read the article →
                                      </a>
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <div className="text-blue-600 text-sm font-semibold mb-2 uppercase">DEMOCRATIC MINORITY LEADER HAKEEM JEFFRIES (VIA AL JAZEERA)</div>
                                  <blockquote className="text-black italic mb-3 pl-4 border-l-4 border-blue-400">
                                    "...harms everyday Americans while granting billionaires substantial tax benefits."
                                  </blockquote>
                                  {findSourceUrl("Al Jazeera", citedSources) && (
                                    <div className="border border-blue-600 rounded-md p-2 inline-block">
                                      <a 
                                        href={findSourceUrl("Al Jazeera", citedSources)!} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                      >
                                        Read the article →
                                      </a>
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <div className="text-blue-600 text-sm font-semibold mb-2 uppercase">ELON MUSK (VIA AL JAZEERA)</div>
                                  <blockquote className="text-black italic mb-3 pl-4 border-l-4 border-blue-400">
                                    "...would inflate spending and exacerbate the nation's already unparalleled debt."
                                  </blockquote>
                                  {findSourceUrl("Al Jazeera", citedSources) && (
                                    <div className="border border-blue-600 rounded-md p-2 inline-block">
                                      <a 
                                        href={findSourceUrl("Al Jazeera", citedSources)!} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                      >
                                        Read the article →
                                      </a>
                                    </div>
                                  )}
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
                                  {findSourceUrl("Pew Research", citedSources) && (
                                    <div className="border border-blue-600 rounded-md p-2 inline-block">
                                      <a 
                                        href={findSourceUrl("Pew Research", citedSources)!} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                      >
                                        Read the article →
                                      </a>
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <div className="text-blue-600 text-sm font-semibold mb-2 uppercase">QUINNIPIAC UNIVERSITY POLL (VIA ABC NEWS)</div>
                                  <blockquote className="text-black italic mb-3 pl-4 border-l-4 border-blue-400">
                                    "Fifty-five percent of voters said that they oppose the bill, while 29% said they support it and 16% were unsure."
                                  </blockquote>
                                  {findSourceUrl("ABC News", citedSources) && (
                                    <div className="border border-blue-600 rounded-md p-2 inline-block">
                                      <a 
                                        href={findSourceUrl("ABC News", citedSources)!} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                      >
                                        Read the article →
                                      </a>
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <div className="text-blue-600 text-sm font-semibold mb-2 uppercase">AXIOS</div>
                                  <blockquote className="text-black italic mb-3 pl-4 border-l-4 border-blue-400">
                                    "Americans largely disapprove of the megabill but are more split on some of the specific provisions."
                                  </blockquote>
                                  {findSourceUrl("Axios", citedSources) && (
                                    <div className="border border-blue-600 rounded-md p-2 inline-block">
                                      <a 
                                        href={findSourceUrl("Axios", citedSources)!} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                      >
                                        Read the article →
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                        </>
                      ) : (
                        // Show message when no perspectives are available and dummy mode is off
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-lg">No perspectives available for this article.</p>
                          <p className="text-sm mt-2">Enable dummy mode in settings to see example content.</p>
                        </div>
                      )
                    )}
                  </div>
                }
              />

              <ExpandableSection
                title="Conflicting Info"
                icon="conflict"
                customIcon={conflictIcon}
                content={
                  <div className="mt-6 space-y-6">
                    {/* Check if we have conflicting information to display */}
                    {perspectives && perspectives.length > 0 ? (
                      // Create conflicting info from perspectives with conflictSource and conflictQuote
                      <div className="space-y-8">
                        {perspectives.filter((p: any) => p.conflictSource && p.conflictQuote).map((perspective: any, index: number) => (
                          <div key={index} className="border-b border-gray-200 pb-8">
                            <h3 className="font-semibold text-black mb-6 text-xl">{perspective.viewpoint}</h3>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                              {/* Position A */}
                              <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">A</div>
                                  <span className="font-semibold text-black text-sm uppercase tracking-wide">{perspective.source}</span>
                                </div>
                                <div className="border-l-4 border-gray-400 pl-4">
                                  <blockquote className="text-gray-800 italic text-base leading-relaxed">
                                    "{perspective.quote}"
                                  </blockquote>
                                </div>
                              </div>
                              
                              {/* VS Separator */}
                              <div className="flex items-center justify-center lg:justify-start">
                                <span className="text-gray-400 text-2xl font-bold">VS</span>
                              </div>
                              
                              {/* Position B */}
                              <div className="space-y-4 lg:col-start-2 lg:row-start-1">
                                <div className="flex items-center space-x-3">
                                  <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">B</div>
                                  <a href={perspective.conflictUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    <span className="font-semibold text-black text-sm uppercase tracking-wide">{perspective.conflictSource}</span>
                                  </a>
                                </div>
                                <p className="text-gray-600 italic mt-2">
                                  "{perspective.conflictQuote}"
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Only show dummy data if dummy mode is enabled
                      useDummyMode ? (
                        <div className="space-y-8">
                          <div className="border-b border-gray-200 pb-8">
                            <h3 className="font-semibold text-black mb-6 text-xl">Who Benefits Most from the Bill?</h3>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                              {/* Position A */}
                              <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">A</div>
                                  <span className="font-semibold text-black text-sm uppercase tracking-wide">WHITE HOUSE/TREASURY</span>
                                </div>
                                <div className="text-gray-700 text-base">
                                  → Bill "most benefits workers and families making less than $50,000 per year"
                                </div>
                                <div className="border-l-4 border-gray-400 pl-4">
                                  <blockquote className="text-gray-800 italic text-base leading-relaxed">
                                    "According to the Joint Committee on Taxation, the tax bill will most benefit workers and families making less than $50,000 per year"
                                  </blockquote>
                                </div>
                              </div>
                              
                              {/* VS Separator */}
                              <div className="flex items-center justify-center lg:justify-start">
                                <span className="text-gray-400 text-2xl font-bold">VS</span>
                              </div>
                              
                              {/* Position B */}
                              <div className="space-y-4 lg:col-start-2 lg:row-start-1">
                                <div className="flex items-center space-x-3">
                                  <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">B</div>
                                  <span className="font-semibold text-black text-sm uppercase tracking-wide">CBO, PEW, KFF, DEMOCRATIC LEADERS</span>
                                </div>
                                <div className="text-gray-700 text-base">
                                  → Bill "would help high-income people" and "hurt lower-income people"
                                </div>
                                <div className="border-l-4 border-gray-400 pl-4">
                                  <blockquote className="text-gray-800 italic text-base leading-relaxed">
                                    "A 55% majority says the bill would help high-income people... 59% say it would hurt lower-income people"
                                  </blockquote>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border-b border-gray-200 pb-8">
                            <h3 className="font-semibold text-black mb-6 text-xl">Impact on Healthcare and Medicaid</h3>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                              {/* Position A */}
                              <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">A</div>
                                  <span className="font-semibold text-black text-sm uppercase tracking-wide">WHITE HOUSE</span>
                                </div>
                                <div className="text-gray-700 text-base">
                                  → "Strengthening Medicaid by eliminating waste, fraud, and abuse"
                                </div>
                                <div className="border-l-4 border-gray-400 pl-4">
                                  <blockquote className="text-gray-800 italic text-base leading-relaxed">
                                    "Strengthening Medicaid by eliminating waste, fraud, and abuse and blocking illegal immigrants from receiving Medicaid"
                                  </blockquote>
                                </div>
                              </div>
                              
                              {/* VS Separator */}
                              <div className="flex items-center justify-center lg:justify-start">
                                <span className="text-gray-400 text-2xl font-bold">VS</span>
                              </div>
                              
                              {/* Position B */}
                              <div className="space-y-4 lg:col-start-2 lg:row-start-1">
                                <div className="flex items-center space-x-3">
                                  <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">B</div>
                                  <span className="font-semibold text-black text-sm uppercase tracking-wide">CBO/KFF</span>
                                </div>
                                <div className="text-gray-700 text-base">
                                  → Bill cuts Medicaid by $800 billion, increases uninsured by 10.9 million
                                </div>
                                <div className="border-l-4 border-gray-400 pl-4">
                                  <blockquote className="text-gray-800 italic text-base leading-relaxed">
                                    "reduce federal spending on Medicaid by almost $800 billion... increase the number of adults without health insurance by more than 10 million"
                                  </blockquote>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="pb-8">
                            <h3 className="font-semibold text-black mb-6 text-xl">Fiscal Responsibility vs. Deficit Increase</h3>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                              {/* Position A */}
                              <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">A</div>
                                  <span className="font-semibold text-black text-sm uppercase tracking-wide">WHITE HOUSE</span>
                                </div>
                                <div className="text-gray-700 text-base">
                                  → "Restoring fiscal sanity by cutting $1.5 trillion in spending"
                                </div>
                                <div className="border-l-4 border-gray-400 pl-4">
                                  <blockquote className="text-gray-800 italic text-base leading-relaxed">
                                    "Restoring fiscal sanity by cutting $1.5 trillion in spending"
                                  </blockquote>
                                </div>
                              </div>
                              
                              {/* VS Separator */}
                              <div className="flex items-center justify-center lg:justify-start">
                                <span className="text-gray-400 text-2xl font-bold">VS</span>
                              </div>
                              
                              {/* Position B */}
                              <div className="space-y-4 lg:col-start-2 lg:row-start-1">
                                <div className="flex items-center space-x-3">
                                  <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">B</div>
                                  <span className="font-semibold text-black text-sm uppercase tracking-wide">CBO, AL JAZEERA, PBS</span>
                                </div>
                                <div className="text-gray-700 text-base">
                                  → Bill increases deficit by $2.8–$3.4 trillion over 10 years
                                </div>
                                <div className="border-l-4 border-gray-400 pl-4">
                                  <blockquote className="text-gray-800 italic text-base leading-relaxed">
                                    "increase federal deficits over the next 10 years by nearly $3.3 trillion"
                                  </blockquote>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-8 pt-6 border-t border-gray-300">
                            <div className="text-center">
                              <span className="text-sm font-semibold text-gray-700">Summary of Sides:</span>
                              <div className="mt-2">
                                <span className="text-sm text-gray-600">
                                  [White House, Treasury] vs [CBO, Pew, KFF, House Democratic Leader, Al Jazeera, PBS]
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Show message when no conflicting info is available and dummy mode is off
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-lg">No conflicting information available for this article.</p>
                          <p className="text-sm mt-2">Enable dummy mode in settings to see example content.</p>
                        </div>
                      )
                    )}
                  </div>
                }
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <Timeline items={TextFormatter.formatTimelineItems(timelineItems)} />
            <div className="border-t-2 border-gray-300 my-6"></div>
            <CitedSources sources={TextFormatter.formatCitedSources(citedSources)} />
            <div className="border-t-2 border-gray-300 my-6"></div>
          </div>
        </div>
      </main>

      {/* Theme Controller */}
      {showThemeController && <ThemeController onClose={() => setShowThemeController(false)} />}
    </div>
  );
}