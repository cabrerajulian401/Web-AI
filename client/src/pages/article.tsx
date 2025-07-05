import { useState } from 'react';
import { Link, useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { ExpandableSection } from '@/components/ui/expandable-section';
import { Timeline } from '@/components/ui/timeline';
import { RelatedArticles } from '@/components/ui/related-articles';
import { ThemeController } from '@/components/theme-controller';
import { cn } from '@/lib/utils';
import type { Article, ExecutiveSummary, TimelineItem, RelatedArticle, RawFacts, Perspective } from '@shared/schema';

interface ArticleData {
  article: Article;
  executiveSummary: ExecutiveSummary;
  timelineItems: TimelineItem[];
  relatedArticles: RelatedArticle[];
  rawFacts: RawFacts[];
  perspectives: Perspective[];
}

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [activistExpanded, setActivistExpanded] = useState(false);
  const [governmentExpanded, setGovernmentExpanded] = useState(false);
  const [industryExpanded, setIndustryExpanded] = useState(false);
  const [showThemeController, setShowThemeController] = useState(false);

  const { data: articleData, isLoading } = useQuery<ArticleData>({
    queryKey: ['/api/article', slug],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen theme-page-bg">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200 mb-8"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-96 bg-gray-200 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
                <div className="h-32 bg-gray-200 rounded-lg"></div>
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="lg:col-span-4 space-y-6">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!articleData) {
    return (
      <div className="min-h-screen theme-page-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article not found</h1>
          <Link href="/feed">
            <Button>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Feed
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { article, executiveSummary, timelineItems, relatedArticles } = articleData;

  // Icon imports
  const hourglassIcon = '/attached_assets/hour clear_1751669332914.png';
  const pivotIcon = '/attached_assets/Pivot Icon Clear_1751670260305.png';
  const conflictIcon = '/attached_assets/conflictwhite_1751670658509.png';

  return (
    <div className="min-h-screen theme-page-bg">
      <header className="theme-header-bg relative">
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/feed">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Feed
                </Button>
              </Link>
              <h1 className="text-2xl font-bold theme-header-text">TIMIO News</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="theme-tagline-text text-sm font-medium">Truth. Trust. Transparency.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowThemeController(!showThemeController)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Article Hero */}
            <Card className="theme-article-card-bg theme-article-card-border theme-article-card-hover shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden animate-fade-in">
              <CardContent className="p-8">
                {/* Article Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800 font-medium">
                      News
                    </Badge>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{article.readTime} min read</span>
                      <span>•</span>
                      <span>{article.sourceCount} sources</span>
                    </div>
                  </div>
                  <h1 className="text-4xl font-bold theme-headline-text mb-4 leading-tight">
                    {article.title}
                  </h1>
                  <p className="text-xl theme-body-text leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                {/* Article Image */}
                <div className="mb-8">
                  <img
                    src={article.heroImageUrl}
                    alt={article.title}
                    className="w-full h-64 object-cover rounded-lg shadow-lg"
                  />
                </div>

                {/* Executive Summary */}
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mr-4">
                      <img src={hourglassIcon} alt="Executive Summary" className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold theme-research-card-header-text">Executive Summary</h2>
                  </div>
                  <ul className="text-lg theme-body-text space-y-3">
                    {executiveSummary.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 font-bold text-xl mr-3 mt-1">•</span>
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Expandable Sections */}
            <div className="space-y-6 mt-8">
              {/* Raw Facts Section */}
              <div className="border-t-2 border-black pt-6">
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
                          <span className="leading-relaxed">Current troop deployment stands at 11,000 across Eastern Europe 
                            <a href="#" className="ml-2 text-blue-600 hover:underline font-medium">[CNN]</a>
                          </span>
                        </li>
                        <li className="flex items-start">
                          <input type="checkbox" checked readOnly className="mt-1.5 mr-4 flex-shrink-0 w-5 h-5 accent-blue-600" />
                          <span className="leading-relaxed">NATO Article 5 threshold requires unanimous member approval 
                            <a href="#" className="ml-2 text-blue-600 hover:underline font-medium">[Associated Press]</a>
                          </span>
                        </li>
                        <li className="flex items-start">
                          <input type="checkbox" checked readOnly className="mt-1.5 mr-4 flex-shrink-0 w-5 h-5 accent-blue-600" />
                          <span className="leading-relaxed">Emergency session called after diplomatic reports emerged 
                            <a href="#" className="ml-2 text-blue-600 hover:underline font-medium">[Washington Post]</a>
                          </span>
                        </li>
                        <li className="flex items-start">
                          <input type="checkbox" checked readOnly className="mt-1.5 mr-4 flex-shrink-0 w-5 h-5 accent-blue-600" />
                          <span className="leading-relaxed">Joint Chiefs of Staff briefing scheduled for tomorrow 
                            <a href="#" className="ml-2 text-blue-600 hover:underline font-medium">[Bloomberg]</a>
                          </span>
                        </li>
                        <li className="flex items-start">
                          <input type="checkbox" checked readOnly className="mt-1.5 mr-4 flex-shrink-0 w-5 h-5 accent-blue-600" />
                          <span className="leading-relaxed">Congressional oversight committee activated under emergency protocols 
                            <a href="#" className="ml-2 text-blue-600 hover:underline font-medium">[NBC News]</a>
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
              </div>

              {/* Different Perspectives Section */}
              <div className="border-t-2 border-black pt-6">
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
                          <div className="p-6 bg-gray-50">
                            <p className="text-gray-700 mb-4">
                              Environmental activists argue the UN's current climate regulations are inadequate. They point to recent extreme weather events and scientific reports showing accelerating global warming.
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">Environmental Groups</span>
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">Climate Scientists</span>
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">Policy Advocates</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Government Perspective */}
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <button 
                          onClick={() => setGovernmentExpanded(!governmentExpanded)}
                          className="w-full p-4 bg-green-600 bg-opacity-75 hover:bg-opacity-85 transition-colors duration-200 text-left"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-lg text-white">Government Officials Emphasize Economic Balance</h4>
                            {governmentExpanded ? <ChevronUp className="h-5 w-5 text-white" /> : <ChevronDown className="h-5 w-5 text-white" />}
                          </div>
                          <p className="text-green-200 text-sm mt-2">Sources: 2</p>
                        </button>
                        {governmentExpanded && (
                          <div className="p-6 bg-gray-50">
                            <p className="text-gray-700 mb-4">
                              Government representatives stress the need to balance environmental protection with economic growth. They highlight ongoing initiatives and warn against policies that could harm competitiveness.
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Economic Policy</span>
                              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Trade Impact</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Industry Perspective */}
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <button 
                          onClick={() => setIndustryExpanded(!industryExpanded)}
                          className="w-full p-4 bg-purple-600 bg-opacity-75 hover:bg-opacity-85 transition-colors duration-200 text-left"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-lg text-white">Industry Leaders Propose Innovation-Based Solutions</h4>
                            {industryExpanded ? <ChevronUp className="h-5 w-5 text-white" /> : <ChevronDown className="h-5 w-5 text-white" />}
                          </div>
                          <p className="text-purple-200 text-sm mt-2">Sources: 4</p>
                        </button>
                        {industryExpanded && (
                          <div className="p-6 bg-gray-50">
                            <p className="text-gray-700 mb-4">
                              Business leaders advocate for technology-driven solutions over regulatory restrictions. They emphasize the role of innovation in achieving environmental goals while maintaining economic viability.
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">Technology Innovation</span>
                              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">Market Solutions</span>
                              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">R&D Investment</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  }
                />
              </div>

              {/* Conflicting Info Section */}
              <div className="border-t-2 border-black pt-6">
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
                        <p className="text-gray-600 text-sm mb-2">The Pentagon briefing mentioned "strategic realignment," but Congressional sources describe it as "force reduction measures."</p>
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