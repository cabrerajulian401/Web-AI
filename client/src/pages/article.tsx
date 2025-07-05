import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Share2, Clock, TrendingUp, Eye, ChevronDown, ChevronUp, Settings } from "lucide-react";
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
  
  // State for collapsible perspectives
  const [activistExpanded, setActivistExpanded] = useState(false);
  const [moderateExpanded, setModerateExpanded] = useState(false);
  const [criticsExpanded, setCriticsExpanded] = useState(false);
  
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
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b-2 border-black shadow-sm">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-black shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              {/* Logo, Brand and Back Button */}
              <div className="flex flex-col space-y-2">
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
                <button 
                  onClick={handleBackToFeed}
                  className="flex items-center text-gray-600 hover:text-brand-blue transition-colors duration-200 font-medium text-sm"
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Article Hero */}
            <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden animate-fade-in">
              <CardContent className="p-8">
                {/* Article Header */}
                <div className="mb-6">
                  <h1 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4 leading-tight">
                    {article.title}
                  </h1>
                  
                  {/* Article Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted mb-6">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Published {new Date(article.publishedAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      {article.sourceCount} sources analyzed
                    </span>
                    <span className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {article.readTime} min read
                    </span>
                  </div>
                </div>

                {/* Hero Image */}
                <div className="mb-4">
                  <img 
                    src={article.heroImageUrl}
                    alt={article.title}
                    className="w-full h-80 object-cover rounded-lg shadow-lg"
                  />
                </div>

                {/* Article Content */}
                <div className="prose prose-lg max-w-none mb-8">
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    OpenAI has officially announced GPT-5. The new model demonstrates remarkable improvements in logical reasoning, problem-solving, and chain-of-thought that could revolutionize how AI systems approach problem-solving .
                  </p>
                </div>

                {/* Executive Summary */}
                <div className="bg-blue-50 border-l-4 border-brand-blue p-6 rounded-r-lg mb-4">
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
                    <ul className="text-lg text-gray-800 space-y-5">
                      <li className="flex items-start">
                        <input type="checkbox" checked readOnly className="mt-1.5 mr-4 flex-shrink-0 w-5 h-5 accent-blue-600" />
                        <span className="leading-relaxed">Defense Secretary nomination pending Senate confirmation 
                          <a href="#" className="ml-2 text-blue-600 hover:underline font-medium">[Reuters]</a>
                        </span>
                      </li>
                      <li className="flex items-start">
                        <input type="checkbox" checked readOnly className="mt-1.5 mr-4 flex-shrink-0 w-5 h-5 accent-blue-600" />
                        <span className="leading-relaxed">Previous military aid packages totaled $113 billion since 2022 
                          <a href="#" className="ml-2 text-blue-600 hover:underline font-medium">[Department of Defense]</a>
                        </span>
                      </li>
                      <li className="flex items-start">
                        <input type="checkbox" checked readOnly className="mt-1.5 mr-4 flex-shrink-0 w-5 h-5 accent-blue-600" />
                        <span className="leading-relaxed">Decision announced during first week of January 2025 
                          <a href="#" className="ml-2 text-blue-600 hover:underline font-medium">[White House Press Office]</a>
                        </span>
                      </li>
                      <li className="flex items-start">
                        <input type="checkbox" checked readOnly className="mt-1.5 mr-4 flex-shrink-0 w-5 h-5 accent-blue-600" />
                        <span className="leading-relaxed">Joint Chiefs of Staff provided military assessment to Secretary 
                          <a href="#" className="ml-2 text-blue-600 hover:underline font-medium">[Pentagon Briefing]</a>
                        </span>
                      </li>
                      <li className="flex items-start">
                        <input type="checkbox" checked readOnly className="mt-1.5 mr-4 flex-shrink-0 w-5 h-5 accent-blue-600" />
                        <span className="leading-relaxed">Pentagon initially recommended continued support before reversal 
                          <a href="#" className="ml-2 text-blue-600 hover:underline font-medium">[CNN]</a>
                        </span>
                      </li>
                      <li className="flex items-start">
                        <input type="checkbox" checked readOnly className="mt-1.5 mr-4 flex-shrink-0 w-5 h-5 accent-blue-600" />
                        <span className="leading-relaxed">Aid package included $200M in defensive weapons and equipment 
                          <a href="#" className="ml-2 text-blue-600 hover:underline font-medium">[Associated Press]</a>
                        </span>
                      </li>
                      <li className="flex items-start">
                        <input type="checkbox" checked readOnly className="mt-1.5 mr-4 flex-shrink-0 w-5 h-5 accent-blue-600" />
                        <span className="leading-relaxed">Bipartisan concerns raised in House Armed Services Committee hearing 
                          <a href="#" className="ml-2 text-blue-600 hover:underline font-medium">[C-SPAN]</a>
                        </span>
                      </li>
                      <li className="flex items-start">
                        <input type="checkbox" checked readOnly className="mt-1.5 mr-4 flex-shrink-0 w-5 h-5 accent-blue-600" />
                        <span className="leading-relaxed">NATO allies expressed concern in emergency session call 
                          <a href="#" className="ml-2 text-blue-600 hover:underline font-medium">[NATO Press Release]</a>
                        </span>
                      </li>
                      <li className="flex items-start">
                        <input type="checkbox" checked readOnly className="mt-1.5 mr-4 flex-shrink-0 w-5 h-5 accent-blue-600" />
                        <span className="leading-relaxed">European Union coordinating response with member states 
                          <a href="#" className="ml-2 text-blue-600 hover:underline font-medium">[EU Council Statement]</a>
                        </span>
                      </li>
                      <li className="flex items-start">
                        <input type="checkbox" checked readOnly className="mt-1.5 mr-4 flex-shrink-0 w-5 h-5 accent-blue-600" />
                        <span className="leading-relaxed">UN Security Council briefing scheduled for next week 
                          <a href="#" className="ml-2 text-blue-600 hover:underline font-medium">[UN News]</a>
                        </span>
                      </li>
                    </ul>
                  </div>
                }
              />

              <ExpandableSection
                title="Different Perspectives"
                icon="pivot"
                customIcon={pivotIcon}
                content={
                  <div className="space-y-4 mt-6">
                    {/* Activists Perspective */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <button 
                        onClick={() => setActivistExpanded(!activistExpanded)}
                        className="w-full p-4 bg-blue-600 bg-opacity-75 hover:bg-opacity-85 transition-colors duration-200 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-lg text-white">Activists Call for Stronger UN Environmental Rules</h4>
                          {activistExpanded ? <ChevronUp className="h-5 w-5 text-white" /> : <ChevronDown className="h-5 w-5 text-white" />}
                        </div>
                        <p className="text-blue-200 text-sm mt-2">Sources: 3</p>
                      </button>
                      
                      {activistExpanded && (
                        <div className="p-4 bg-gray-50">
                          <p className="mb-4 border-l-4 border-blue-500 pl-4 text-brand-dark">
                            The climate crisis requires urgent, coordinated action from the UN to limit emissions before its too late.
                          </p>
                          
                          <div className="space-y-4">
                            <div className="pb-4 border-b-2 border-gray-200">
                              <p className="text-blue-600 text-sm font-medium mb-2">UN ENVIRONMENT PROGRAMME (UNEP)</p>
                              <p className="italic text-gray-700 mb-2">
                                "The world is on track for a temperature rise of 2.5°C to 2.9°C...We need to act now...or the impacts will be catastrophic."
                              </p>
                              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors">
                                Read the article
                              </button>
                            </div>
                            
                            <div>
                              <p className="text-blue-600 text-sm font-medium mb-2">INTERGOVERNMENTAL PANEL ON CLIMATE CHANGE (IPCC)</p>
                              <p className="italic text-gray-700 mb-2">
                                "Limiting warming to 1.5°C will require rapid, far-reaching and unprecedented changes in all aspects of society. The next few years are probably the most important in our history."
                              </p>
                              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors">
                                Read the article
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Moderate Perspective */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <button 
                        onClick={() => setModerateExpanded(!moderateExpanded)}
                        className="w-full p-4 bg-orange-600 bg-opacity-75 hover:bg-opacity-85 transition-colors duration-200 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-lg text-white">UN Intervention Necessary, But it Must Be Realistic</h4>
                          {moderateExpanded ? <ChevronUp className="h-5 w-5 text-white" /> : <ChevronDown className="h-5 w-5 text-white" />}
                        </div>
                        <p className="text-orange-200 text-sm mt-2">Sources: 2</p>
                      </button>
                      
                      {moderateExpanded && (
                        <div className="p-4 bg-gray-50">
                          <p className="mb-4 border-l-4 border-orange-500 pl-4 text-brand-dark">
                            The UN should regulate climate change, but current approaches are flawed; reforms should focus on fairer rules, more effective monitoring, and multi-dimensional commitments.
                          </p>
                          
                          <div className="space-y-4">
                            <div>
                              <p className="text-orange-600 text-sm font-medium mb-2">YALE ENVIRONMENT 360</p>
                              <p className="italic text-gray-700 mb-2">
                                "Some analysts say the U.N. methodology on offsets is a wrecking ball that will destroy hopes of achieving genuine net zero... It is 'essentially writing a blank cheque for forested countries intent on continuing to burn fossil fuels.'"
                              </p>
                              <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded text-sm transition-colors">
                                Read the article
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Critics Perspective */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <button 
                        onClick={() => setCriticsExpanded(!criticsExpanded)}
                        className="w-full p-4 bg-red-600 bg-opacity-75 hover:bg-opacity-85 transition-colors duration-200 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-lg text-white">Critics Say UN Should Avoid Action on Fossil Fuels</h4>
                          {criticsExpanded ? <ChevronUp className="h-5 w-5 text-white" /> : <ChevronDown className="h-5 w-5 text-white" />}
                        </div>
                        <p className="text-red-200 text-sm mt-2">Sources: 1</p>
                      </button>
                      
                      {criticsExpanded && (
                        <div className="p-4 bg-gray-50">
                          <p className="mb-4 border-l-4 border-red-500 pl-4 text-brand-dark">
                            The UN shouldn't intervene in fossil fuel use; intervention would harm quality of life, economic growth, and energy access, especially in developing nations.
                          </p>
                          
                          <div className="space-y-4">
                            <div>
                              <p className="text-red-600 text-sm font-medium mb-2">FORBES</p>
                              <p className="italic text-gray-700 mb-2">
                                "The UN's proposed restrictions on fossil fuels would deprive billions of affordable energy, which is essential to lifting people out of poverty"
                              </p>
                              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors">
                                Read the article
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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
                      <h4 className="font-semibold text-brand-dark mb-1">Timeline Discrepancy</h4>
                      <p className="text-gray-600 text-sm mb-2">NBC News reports the decision was made "immediately after taking office," while Reuters suggests it occurred "during the first week of transition."</p>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Sources:</span> NBC News vs Reuters, January 2025
                      </div>
                    </div>
                    <div className="border-l-4 border-orange-500 pl-4 pb-4 border-b-2 border-gray-200">
                      <h4 className="font-semibold text-brand-dark mb-1">Military Assessment Details</h4>
                      <p className="text-gray-600 text-sm mb-2">Pentagon sources claim the assessment "strongly recommended continuation," while administration officials describe it as "mixed with reservations."</p>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Sources:</span> Defense Department vs White House officials
                      </div>
                    </div>
                    <div className="border-l-4 border-yellow-500 pl-4 pb-4 border-b-2 border-gray-200">
                      <h4 className="font-semibold text-brand-dark mb-1">Congressional Notification</h4>
                      <p className="text-gray-600 text-sm mb-2">Some reports indicate Congress was briefed "in advance," while others suggest notification came "after the decision was finalized."</p>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Sources:</span> House Armed Services vs Senate Foreign Relations
                      </div>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-semibold text-brand-dark mb-1">International Response</h4>
                      <p className="text-gray-600 text-sm mb-2">European allies report being "consulted beforehand," while NATO sources suggest they were "informed after the fact."</p>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Sources:</span> EU diplomatic sources vs NATO headquarters
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
      {showThemeController && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative">
            <ThemeController />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowThemeController(false)}
              className="absolute -top-2 -right-2 rounded-full p-2 bg-white shadow-lg"
            >
              ×
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
