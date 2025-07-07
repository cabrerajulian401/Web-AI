import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Share2, Clock, TrendingUp, Eye, Settings, ChevronDown } from "lucide-react";
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
                  <div className="mt-4 space-y-8">
                    {/* Bill Source */}
                    <div>
                      <h3 className="text-lg font-bold text-black mb-3">
                        <a 
                          href="https://www.congress.gov/search?q=%7B%22source%22:%22legislation%22%7D" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-gray-600 transition-colors"
                        >
                          Directly from the bill (H.R.1, 119th Congress) - Congress.gov, IRS.gov, Treasury.gov, Energy.gov, HHS.gov, DHS.gov, Defense.gov
                        </a>
                      </h3>
                      <div className="w-full h-0.5 bg-black mb-6"></div>
                    </div>

                    {/* Key Provisions */}
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
                          CBO Analysis - CBO.gov
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
                        <div className="p-6 space-y-6 bg-red-50">
                          <p className="text-gray-800 text-lg font-semibold">Bill is historic, pro-growth, fulfills campaign promises, benefits families and businesses.</p>

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
                        <div className="p-6 space-y-6 bg-blue-50">
                          <p className="text-gray-800 text-lg font-semibold">Bill slashes social safety net, benefits rich, harms poor/elderly, increases deficit.</p>

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
                        <div className="p-6 space-y-6 bg-gray-50">
                          <p className="text-gray-800 text-lg font-semibold">Majority of Americans oppose bill overall; support for some tax cuts and Medicaid work requirements.</p>

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
                  <div className="mt-6 space-y-8">
                    <div className="space-y-6">
                      <h4 className="font-bold text-black text-lg">Does the bill cut Medicaid?</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div className="space-y-3">
                          <div className="font-bold text-black underline text-sm">WHITE HOUSE</div>
                          <p className="text-black text-sm">
                            "There will be no cuts to Medicaid...protects and strengthens Medicaid for those who rely on it."
                          </p>
                        </div>
                        <div className="flex items-center justify-center text-gray-400 text-sm font-medium">
                          vs
                        </div>
                        <div className="space-y-3">
                          <div className="font-bold text-black underline text-sm">CBO, GOV. MOORE, HOSPITALS</div>
                          <p className="text-black text-sm">
                            Bill will cut Medicaid, millions will lose coverage
                          </p>
                          <p className="text-gray-500 text-xs italic">[CBO, AHA, Governor Moore]</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="font-bold text-black text-lg">Effect on Deficit</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div className="space-y-3">
                          <div className="font-bold text-black underline text-sm">WHITE HOUSE</div>
                          <p className="text-black text-sm">
                            "Reduces deficits by over $2 trillion by increasing economic growth and cutting waste, fraud, and abuse."
                          </p>
                        </div>
                        <div className="flex items-center justify-center text-gray-400 text-sm font-medium">
                          vs
                        </div>
                        <div className="space-y-3">
                          <div className="font-bold text-black underline text-sm">CBO</div>
                          <p className="text-black text-sm">
                            "Adds $3.4 trillion to federal deficits over the next 10 years."
                          </p>
                          <p className="text-gray-500 text-xs italic">[CBO]</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="font-bold text-black text-lg">Impact on Vulnerable Americans</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div className="space-y-3">
                          <div className="font-bold text-black underline text-sm">WHITE HOUSE</div>
                          <p className="text-black text-sm">
                            "Delivers largest middle-class tax cut...improves the lives of Americans on every rung of the economic ladder."
                          </p>
                        </div>
                        <div className="flex items-center justify-center text-gray-400 text-sm font-medium">
                          vs
                        </div>
                        <div className="space-y-3">
                          <div className="font-bold text-black underline text-sm">HOSPITALS, STATE OFFICIALS</div>
                          <p className="text-black text-sm">
                            "Irreparable harm to healthcare, millions lose coverage, food assistance gutted."
                          </p>
                          <p className="text-gray-500 text-xs italic">[AHA, Governor Moore]</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="font-bold text-black text-lg">Work Requirements and Safety Net</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div className="space-y-3">
                          <div className="font-bold text-black underline text-sm">WHITE HOUSE</div>
                          <p className="text-black text-sm">
                            "Promotes work, responsibility, and restores SNAP to serve the truly needy."
                          </p>
                        </div>
                        <div className="flex items-center justify-center text-gray-400 text-sm font-medium">
                          vs
                        </div>
                        <div className="space-y-3">
                          <div className="font-bold text-black underline text-sm">CRITICS</div>
                          <p className="text-black text-sm">
                            "Millions will lose benefits due to new work requirements."
                          </p>
                          <p className="text-gray-500 text-xs italic">[AHA, Governor Moore]</p>
                        </div>
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
