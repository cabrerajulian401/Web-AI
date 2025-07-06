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
                    <div className="flex items-center space-x-3 mb-2">
                      <img 
                        src={timioLogo} 
                        alt="TIMIO News" 
                        className="h-6 w-6 rounded-lg"
                      />
                      <span className="text-lg font-bold text-white">TIMIO News</span>
                    </div>
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
                    <ul className="space-y-3">
                      {executiveSummary.points.map((point, index) => (
                        <li key={index} className="flex items-start">
                          <div className="h-2 w-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{point}</span>
                        </li>
                      ))}
                    </ul>
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
                  <div className="space-y-6">
                    {/* Bill Information Header */}
                    <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        <a 
                          href="https://www.congress.gov/search?q=%7B%22source%22:%22legislation%22%7D" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 transition-colors"
                        >
                          Directly from the bill (H.R.1, 119th Congress)
                        </a>
                      </h4>
                    </div>

                    {/* Tax Provisions */}
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-gray-800">Makes Trump tax cuts permanent 
                          <a href="https://www.congress.gov/bill/119th-congress/house-bill/1/text" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1 text-xs">[Source]</a>
                        </span>
                      </div>
                      <div className="flex items-start">
                        <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-gray-800">Tax reductions for incomes &lt;$500k (5-year limit)
                          <a href="https://www.irs.gov/newsroom/tax-reform" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1 text-xs">[Source]</a>
                        </span>
                      </div>
                      <div className="flex items-start">
                        <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-gray-800">New deductions: tips, overtime, auto loans (expire 2028)
                          <a href="https://www.treasury.gov/resource-center/tax-policy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1 text-xs">[Source]</a>
                        </span>
                      </div>
                      <div className="flex items-start">
                        <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-gray-800">Adds $200 to child tax credit
                          <a href="https://www.irs.gov/credits-deductions/individuals/child-tax-credit" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1 text-xs">[Source]</a>
                        </span>
                      </div>
                      <div className="flex items-start">
                        <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-gray-800">1% remittance tax; increases endowment investment taxes
                          <a href="https://www.treasury.gov/resource-center/tax-policy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1 text-xs">[Source]</a>
                        </span>
                      </div>
                    </div>

                    {/* Environmental & Energy */}
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="h-2 w-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-gray-800">Ends clean energy credits; opens federal land to oil & gas
                          <a href="https://www.energy.gov/policy/policy-initiatives" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1 text-xs">[Source]</a>
                        </span>
                      </div>
                    </div>

                    {/* Social Programs */}
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="h-2 w-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-gray-800">Cuts to Medicaid, Medicare, SNAP; shifts SNAP costs to states
                          <a href="https://www.hhs.gov/about/budget/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1 text-xs">[Source]</a>
                        </span>
                      </div>
                    </div>

                    {/* Security & Defense */}
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="h-2 w-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-gray-800">ICE funding increases tenfold to $100B by 2029
                          <a href="https://www.dhs.gov/sites/default/files/publications/u.s._immigration_and_customs_enforcement.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1 text-xs">[Source]</a>
                        </span>
                      </div>
                      <div className="flex items-start">
                        <div className="h-2 w-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-gray-800">Adds $150B to defense, $150B to border enforcement
                          <a href="https://www.defense.gov/News/Releases/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1 text-xs">[Source]</a>
                        </span>
                      </div>
                    </div>

                    {/* Fiscal Impact */}
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="h-2 w-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-gray-800">Raises debt ceiling by $5T
                          <a href="https://www.treasury.gov/resource-center/data-chart-center/quarterly-refunding/Pages/debt-ceiling.aspx" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1 text-xs">[Source]</a>
                        </span>
                      </div>
                    </div>

                    {/* CBO Analysis Section */}
                    <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500 mt-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        <a href="https://www.cbo.gov/system/files/2025-01/59927-Reconciliation.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                          CBO Analysis:
                        </a>
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-start">
                          <div className="h-2 w-2 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span className="text-gray-800">Adds $2.8T to deficit by 2034
                            <a href="https://www.cbo.gov/publication/59927" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1 text-xs">[Source]</a>
                          </span>
                        </div>
                        <div className="flex items-start">
                          <div className="h-2 w-2 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span className="text-gray-800">10.9M lose insurance, mainly from Medicaid
                            <a href="https://www.cbo.gov/publication/59928" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1 text-xs">[Source]</a>
                          </span>
                        </div>
                        <div className="flex items-start">
                          <div className="h-2 w-2 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span className="text-gray-800">Medicaid & CHIP enrollment drops by 10.5M
                            <a href="https://www.cbo.gov/topics/health-care/medicaid" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1 text-xs">[Source]</a>
                          </span>
                        </div>
                      </div>
                    </div>
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
