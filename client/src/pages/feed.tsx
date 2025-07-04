import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, TrendingUp, Eye, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import timioLogo from "@assets/App Icon_1751662407764.png";
import chromeIcon from "@assets/Google_Chrome_Web_Store_icon_2015 (2)_1751671046716.png";

interface FeedArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readTime: number;
  sourceCount: number;
  heroImageUrl: string;
  authorName?: string;
  authorTitle?: string;
}

export default function FeedPage() {
  const { data: articles, isLoading } = useQuery<FeedArticle[]>({
    queryKey: ['/api/feed'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-light sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12" />
                <div>
                  <Skeleton className="h-8 w-40" />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-20" />
              </div>
            </div>
          </div>
        </header>

        {/* Loading Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            <div className="flex-1 max-w-4xl">
              <div className="mb-8">
                <Skeleton className="h-10 w-64 mb-2" />
                <Skeleton className="h-6 w-96" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, index) => (
                  <Card key={index} className="shadow-card overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-4" />
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-24 space-y-4">
                <Skeleton className="w-full h-64 rounded-lg" />
                <Skeleton className="w-full h-12 rounded-lg" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-light sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <img 
                src={timioLogo} 
                alt="TIMIO Logo" 
                className="w-12 h-12"
              />
              <div>
                <h1 className="text-2xl font-bold text-brand-dark">TIMIO News</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-brand-blue text-white">
                Live
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left side - Articles */}
          <div className="flex-1 max-w-4xl">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-brand-dark mb-2">
                Today's Stories
              </h1>
              <p className="text-lg text-black">
                AI Driven Research on popular stories
              </p>
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {articles?.map((article) => (
                <Link key={article.id} href={`/article/${article.slug}`}>
                  <Card className="shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer group overflow-hidden h-full">
                    {/* Article Image */}
                    <div className="relative overflow-hidden">
                      <img 
                        src={article.heroImageUrl}
                        alt={article.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {article.category}
                        </Badge>
                      </div>
                    </div>

                    {/* Article Content */}
                    <CardContent className="p-6 flex flex-col flex-grow">
                      <h3 className="text-xl font-semibold text-brand-dark mb-3 line-clamp-2 group-hover:text-brand-blue transition-colors duration-200">
                        {article.title}
                      </h3>
                      <p className="text-black mb-4 line-clamp-3 flex-grow">
                        {article.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-muted mt-auto">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {new Date(article.publishedAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            {article.sourceCount} sources
                          </span>
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {article.readTime} min
                          </span>
                        </div>
                        
                        <ArrowRight className="h-4 w-4 text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Empty State */}
            {articles && articles.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <TrendingUp className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-600">Check back later for the latest AI news and updates.</p>
              </div>
            )}
          </div>

          {/* Right sidebar - As seen on */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              <img 
                src="/asseen-on.png" 
                alt="As seen on PBS and Automateed" 
                className="w-full h-auto rounded-lg shadow-lg"
              />
              <a 
                href="https://timio.news" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full bg-black hover:bg-gray-800 text-white font-semibold py-4 px-8 rounded-lg text-left transition-colors duration-200 text-2xl"
              >
                Learn more about TIMIO News
              </a>
              
              <a 
                href="https://chromewebstore.google.com/detail/timio-chrome-early-access/mkldmejplmgbjobhddcbilhfpcoholjh" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center w-full bg-white hover:bg-gray-50 text-black border-2 border-black font-semibold py-3 px-6 rounded-lg text-left transition-colors duration-200 text-lg"
              >
                <img 
                  src={chromeIcon} 
                  alt="Chrome Web Store" 
                  className="w-6 h-6 mr-3"
                />
                Try the TIMIO Chrome Extension
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}