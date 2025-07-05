import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Share2, Clock, TrendingUp, Eye, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpandableSection } from "@/components/ui/expandable-section";
import { Timeline } from "@/components/ui/timeline";
import { RelatedArticles } from "@/components/ui/related-articles";
import { ThemeController } from "@/components/theme-controller";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState } from "react";
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
  
  // Extract slug from URL path
  const currentPath = window.location.pathname;
  const slug = currentPath.split('/article/')[1] || 'gpt-5-announcement';
  
  const { data: articleData, isLoading } = useQuery<ArticleData>({
    queryKey: ["/api/article", slug],
    queryFn: () => fetch(`/api/article/${slug}`).then(res => res.json()),
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
                {/* Header Section */}
                <div className="theme-header-bg p-6 border-b theme-divider">
                  <div className="flex items-center justify-between">
                    {/* Logo, Brand and Back Button */}
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={timioLogo} 
                          alt="TIMIO News" 
                          className="h-8 w-8 rounded-lg"
                        />
                        <div>
                          <span className="text-xl font-bold theme-header-text">TIMIO News</span>
                        </div>
                      </div>
                      <button 
                        onClick={handleBackToFeed}
                        className="flex items-center theme-muted-text hover:text-brand-blue transition-colors duration-200 font-medium text-sm"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <Button onClick={handleShare} className="bg-brand-blue hover:bg-blue-600">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowThemeController(!showThemeController)}
                        className="flex items-center gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Theme
                      </Button>
                    </div>
                  </div>
                </div>
                {/* Hero Image with Overlay */}
                <div className="relative overflow-hidden">
                  <img 
                    src={article.heroImageUrl}
                    alt={article.title}
                    className="w-full h-56 object-cover"
                  />
                  {/* Semitransparent mask */}
                  <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                  
                  {/* Headline overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-xl font-bold text-blue-300 mb-3 tracking-wide">RESEARCH REPORT</p>
                    <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                      {article.title}
                    </h1>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="bg-blue-50 border-l-4 border-brand-blue p-6 rounded-r-lg">
                  <h2 className="text-xl font-semibold text-brand-dark mb-4 flex items-center">
                    <div className="h-10 w-10 bg-black rounded-full flex items-center justify-center mr-3">
                      <img 
                        src={execSummaryIcon} 
                        alt="Executive Summary" 
                        className="h-7 w-7 object-contain"
                      />
                    </div>
                    Executive Summary
                  </h2>
                  <ul className="space-y-3">
                    {executiveSummary.points.map((point, index) => (
                      <li key={index} className="flex items-start">
                        <div className="h-2 w-2 bg-brand-blue rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Expandable Sections */}
            <div className="space-y-6 mt-8">
              <ExpandableSection
                title="Raw Facts"
                icon="database"
                content={
                  <div className="mt-6">
                    {rawFacts.map((factGroup, groupIndex) => (
                      <div key={groupIndex} className="mb-8">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
                          {factGroup.category}
                        </h4>
                        <ul className="text-base text-gray-800 space-y-3">
                          {factGroup.facts.map((fact, factIndex) => (
                            <li key={factIndex} className="flex items-start">
                              <input type="checkbox" checked readOnly className="mt-1.5 mr-4 flex-shrink-0 w-4 h-4 accent-blue-600" />
                              <span className="leading-relaxed">{fact}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                }
              />

              <ExpandableSection
                title="Different Perspectives"
                icon="pivot"
                customIcon={pivotIcon}
                content={
                  <div className="space-y-4 mt-6">
                    {perspectives.map((perspective, index) => {
                      const colorClasses = {
                        green: "bg-green-600 bg-opacity-75 hover:bg-opacity-85 text-green-200 border-green-500",
                        red: "bg-red-600 bg-opacity-75 hover:bg-opacity-85 text-red-200 border-red-500",
                        blue: "bg-blue-600 bg-opacity-75 hover:bg-opacity-85 text-blue-200 border-blue-500",
                        orange: "bg-orange-600 bg-opacity-75 hover:bg-opacity-85 text-orange-200 border-orange-500",
                        yellow: "bg-yellow-600 bg-opacity-75 hover:bg-opacity-85 text-yellow-200 border-yellow-500",
                        purple: "bg-purple-600 bg-opacity-75 hover:bg-opacity-85 text-purple-200 border-purple-500"
                      };
                      
                      const colors = colorClasses[perspective.color as keyof typeof colorClasses] || colorClasses.blue;
                      const [bgColor, textColor, borderColor] = colors.split(' ');
                      
                      return (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                          <div className={`p-4 ${bgColor} transition-colors duration-200`}>
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-lg text-white">{perspective.viewpoint}</h4>
                            </div>
                          </div>
                          <div className="p-4 bg-gray-50">
                            <p className={`border-l-4 ${borderColor} pl-4 text-brand-dark`}>
                              {perspective.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                }
              />

              <ExpandableSection
                title="Conflicting Info"
                icon="conflict"
                customIcon={conflictIcon}
                content={
                  <div className="mt-6 space-y-6">
                    <div className="border-l-4 border-red-500 pl-4 pb-4 border-b-2 border-gray-200">
                      <h4 className="font-semibold text-brand-dark mb-1">CBO Deficit Impact</h4>
                      <p className="text-gray-600 text-sm mb-2">White House claims "nearly $1.7 trillion in mandatory savings," while CBO estimates the bill "adds $3.3 trillion to the deficit over 10 years."</p>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Sources:</span> White House vs Congressional Budget Office
                      </div>
                    </div>
                    <div className="border-l-4 border-orange-500 pl-4 pb-4 border-b-2 border-gray-200">
                      <h4 className="font-semibold text-brand-dark mb-1">Health Insurance Coverage</h4>
                      <p className="text-gray-600 text-sm mb-2">Administration officials claim "healthcare access will be improved through work requirements," while CBO projects "12 million Americans could lose health insurance by 2034."</p>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Sources:</span> Department of Health vs CBO Analysis
                      </div>
                    </div>
                    <div className="border-l-4 border-yellow-500 pl-4 pb-4 border-b-2 border-gray-200">
                      <h4 className="font-semibold text-brand-dark mb-1">Economic Growth Projections</h4>
                      <p className="text-gray-600 text-sm mb-2">Business groups predict "historic economic growth from tax cuts," while Penn Wharton Budget Model shows "lifetime losses for all future generations."</p>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Sources:</span> Chamber of Commerce vs Penn Wharton Budget Model
                      </div>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-semibold text-brand-dark mb-1">Public Support</h4>
                      <p className="text-gray-600 text-sm mb-2">Republican pollsters report "strong support for tax relief," while independent polling shows "support drops to 21% after hearing about hospital funding cuts."</p>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Sources:</span> GOP Internal Polling vs Independent Survey Research
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
