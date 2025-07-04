import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Share2, Clock, TrendingUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpandableSection } from "@/components/ui/expandable-section";
import { Timeline } from "@/components/ui/timeline";
import { RelatedArticles } from "@/components/ui/related-articles";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Article, ExecutiveSummary, TimelineItem, RelatedArticle, RawFacts, Perspective } from "@shared/schema";
import timioLogo from "@assets/App Icon_1751662407764.png";

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
        <header className="bg-white border-b border-light sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-6">
                {/* Logo and Brand */}
                <div className="flex items-center space-x-3">
                  <img 
                    src={timioLogo} 
                    alt="TIMIO News" 
                    className="h-8 w-8 rounded-lg"
                  />
                  <span className="text-xl font-bold text-brand-dark">TIMIO News</span>
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
      <header className="bg-white border-b border-light sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-6">
              {/* Logo and Brand */}
              <div className="flex items-center space-x-3">
                <img 
                  src={timioLogo} 
                  alt="TIMIO News" 
                  className="h-8 w-8 rounded-lg"
                />
                <span className="text-xl font-bold text-brand-dark">TIMIO News</span>
              </div>
              
              {/* Navigation */}
              <nav className="flex items-center space-x-4">
                <button 
                  onClick={handleBackToFeed}
                  className="flex items-center text-muted hover:text-brand-blue transition-colors duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Feed
                </button>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {article.category}
                </Badge>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button onClick={handleShare} className="bg-brand-blue hover:bg-blue-600">
                <Share2 className="h-4 w-4 mr-2" />
                Share
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
                <div className="mb-8">
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
                <div className="bg-blue-50 border-l-4 border-brand-blue p-6 rounded-r-lg mb-8">
                  <h2 className="text-xl font-semibold text-brand-dark mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-brand-blue" />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rawFacts.map((fact, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-brand-dark mb-2">{fact.category}</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {fact.facts.map((item, itemIndex) => (
                            <li key={itemIndex}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                }
              />

              <ExpandableSection
                title="Different Perspectives"
                icon="users"
                content={
                  <div className="space-y-4">
                    {perspectives.map((perspective, index) => (
                      <div key={index} className={`border-l-4 border-${perspective.color}-500 pl-4`}>
                        <h4 className="font-semibold text-brand-dark mb-1">{perspective.viewpoint}</h4>
                        <p className="text-gray-600 text-sm">{perspective.description}</p>
                      </div>
                    ))}
                  </div>
                }
              />

              <ExpandableSection
                title="Conflicting Info"
                icon="users"
                content={
                  <div className="space-y-4">
                    <div className="border-l-4 border-red-500 pl-4">
                      <h4 className="font-semibold text-brand-dark mb-1">Source Discrepancy</h4>
                      <p className="text-gray-600 text-sm">Some sources report different timeline details regarding the initial announcement</p>
                    </div>
                    <div className="border-l-4 border-orange-500 pl-4">
                      <h4 className="font-semibold text-brand-dark mb-1">Data Variance</h4>
                      <p className="text-gray-600 text-sm">Financial figures vary between sources, with some reporting preliminary estimates</p>
                    </div>
                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h4 className="font-semibold text-brand-dark mb-1">Unverified Claims</h4>
                      <p className="text-gray-600 text-sm">Several claims are still awaiting official confirmation from primary sources</p>
                    </div>
                  </div>
                }
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <Timeline items={timelineItems} />
            <RelatedArticles articles={relatedArticles} />
          </div>
        </div>
      </main>
    </div>
  );
}
