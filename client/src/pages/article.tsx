import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Share2, Clock, TrendingUp, Eye, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
                  <div className="space-y-8">
                    {/* Bill Source */}
                    <div className="border-b border-gray-200 pb-3">
                      <h3 className="text-lg font-bold text-black mb-1">
                        <a 
                          href="https://www.congress.gov/search?q=%7B%22source%22:%22legislation%22%7D" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-gray-600 transition-colors"
                        >
                          Directly from the bill (H.R.1, 119th Congress)
                        </a>
                      </h3>
                    </div>

                    {/* Key Provisions */}
                    <div className="space-y-4">
                      <div className="text-gray-900 leading-relaxed">
                        <strong>Makes Trump tax cuts permanent</strong> <a href="https://www.congress.gov/bill/119th-congress/house-bill/1/text" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">[Source]</a>
                      </div>
                      
                      <div className="text-gray-900 leading-relaxed">
                        <strong>Tax reductions for incomes &lt;$500k (5-year limit)</strong> <a href="https://www.irs.gov/newsroom/tax-reform" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">[Source]</a>
                      </div>
                      
                      <div className="text-gray-900 leading-relaxed">
                        <strong>New deductions: tips, overtime, auto loans (expire 2028)</strong> <a href="https://www.treasury.gov/resource-center/tax-policy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">[Source]</a>
                      </div>
                      
                      <div className="text-gray-900 leading-relaxed">
                        <strong>Adds $200 to child tax credit</strong> <a href="https://www.irs.gov/credits-deductions/individuals/child-tax-credit" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">[Source]</a>
                      </div>
                      
                      <div className="text-gray-900 leading-relaxed">
                        <strong>1% remittance tax; increases endowment investment taxes</strong> <a href="https://www.treasury.gov/resource-center/tax-policy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">[Source]</a>
                      </div>
                      
                      <div className="text-gray-900 leading-relaxed">
                        <strong>Ends clean energy credits; opens federal land to oil & gas</strong> <a href="https://www.energy.gov/policy/policy-initiatives" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">[Source]</a>
                      </div>
                      
                      <div className="text-gray-900 leading-relaxed">
                        <strong>Cuts to Medicaid, Medicare, SNAP; shifts SNAP costs to states</strong> <a href="https://www.hhs.gov/about/budget/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">[Source]</a>
                      </div>
                      
                      <div className="text-gray-900 leading-relaxed">
                        <strong>ICE funding increases tenfold to $100B by 2029</strong> <a href="https://www.dhs.gov/sites/default/files/publications/u.s._immigration_and_customs_enforcement.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">[Source]</a>
                      </div>
                      
                      <div className="text-gray-900 leading-relaxed">
                        <strong>Adds $150B to defense, $150B to border enforcement</strong> <a href="https://www.defense.gov/News/Releases/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">[Source]</a>
                      </div>
                      
                      <div className="text-gray-900 leading-relaxed">
                        <strong>Raises debt ceiling by $5T</strong> <a href="https://www.treasury.gov/resource-center/data-chart-center/quarterly-refunding/Pages/debt-ceiling.aspx" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">[Source]</a>
                      </div>
                    </div>

                    {/* CBO Analysis Section */}
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-bold text-black mb-4">
                        <a href="https://www.cbo.gov/system/files/2025-01/59927-Reconciliation.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors">
                          CBO Analysis:
                        </a>
                      </h3>
                      <div className="space-y-4">
                        <div className="text-gray-900 leading-relaxed">
                          <strong>Adds $2.8T to deficit by 2034</strong> <a href="https://www.cbo.gov/publication/59927" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">[Source]</a>
                        </div>
                        
                        <div className="text-gray-900 leading-relaxed">
                          <strong>10.9M lose insurance, mainly from Medicaid</strong> <a href="https://www.cbo.gov/publication/59928" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">[Source]</a>
                        </div>
                        
                        <div className="text-gray-900 leading-relaxed">
                          <strong>Medicaid & CHIP enrollment drops by 10.5M</strong> <a href="https://www.cbo.gov/topics/health-care/medicaid" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">[Source]</a>
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
                  <div className="mt-6">
                    <Accordion type="multiple" className="w-full space-y-4">
                      <AccordionItem value="republican" className="border border-blue-200 rounded-lg">
                        <AccordionTrigger className="hover:no-underline px-6 py-4 bg-blue-50 hover:bg-blue-100 rounded-t-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">R</span>
                            </div>
                            <span className="font-semibold text-blue-900">Republican Leadership</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 py-4 bg-white">
                          <blockquote className="border-l-4 border-blue-600 pl-4 italic text-gray-700 mb-4">
                            "The One Big Beautiful Bill delivers on every promise we made to the American people. This comprehensive legislation cuts taxes for working families, secures our border, and puts America first in trade. It's the largest tax cut in American history while reducing the deficit through smart spending reforms."
                          </blockquote>
                          <div className="text-sm text-blue-700">
                            <strong>Source:</strong> <a href="https://www.speaker.gov/newsroom" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">House Speaker's Office Press Release</a>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="democratic" className="border border-red-200 rounded-lg">
                        <AccordionTrigger className="hover:no-underline px-6 py-4 bg-red-50 hover:bg-red-100 rounded-t-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">D</span>
                            </div>
                            <span className="font-semibold text-red-900">Democratic Minority</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 py-4 bg-white">
                          <blockquote className="border-l-4 border-red-600 pl-4 italic text-gray-700 mb-4">
                            "This bill is a disaster for working families and a gift to billionaires. While promising tax relief, it cuts Medicare and Medicaid, threatens healthcare for millions, and adds trillions to the deficit. The CBO analysis shows this will hurt the very people Republicans claim to help."
                          </blockquote>
                          <div className="text-sm text-red-700">
                            <strong>Source:</strong> <a href="https://www.democraticleader.house.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-900">House Democratic Leadership Statement</a>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="business" className="border border-green-200 rounded-lg">
                        <AccordionTrigger className="hover:no-underline px-6 py-4 bg-green-50 hover:bg-green-100 rounded-t-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">B</span>
                            </div>
                            <span className="font-semibold text-green-900">Business Groups</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 py-4 bg-white">
                          <blockquote className="border-l-4 border-green-600 pl-4 italic text-gray-700 mb-4">
                            "The business community strongly supports this legislation. The permanent tax cuts and deregulation measures will unleash economic growth, create jobs, and restore American competitiveness. The manufacturing incentives alone will bring production back to the United States."
                          </blockquote>
                          <div className="text-sm text-green-700">
                            <strong>Source:</strong> <a href="https://www.uschamber.com/policy/taxes" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-900">U.S. Chamber of Commerce Policy Statement</a>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="analysts" className="border border-purple-200 rounded-lg">
                        <AccordionTrigger className="hover:no-underline px-6 py-4 bg-purple-50 hover:bg-purple-100 rounded-t-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">A</span>
                            </div>
                            <span className="font-semibold text-purple-900">Independent Analysts</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 py-4 bg-white">
                          <blockquote className="border-l-4 border-purple-600 pl-4 italic text-gray-700 mb-4">
                            "This bill presents significant trade-offs. While tax cuts may stimulate short-term growth, the long-term fiscal impact is concerning. The healthcare provisions could reduce coverage, but the infrastructure investments show promise. The net effect depends heavily on implementation and economic conditions."
                          </blockquote>
                          <div className="text-sm text-purple-700">
                            <strong>Source:</strong> <a href="https://www.brookings.edu/research/" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-900">Brookings Institution Analysis</a>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
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
