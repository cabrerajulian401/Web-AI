import { Newspaper } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { RelatedArticle } from "@shared/schema";

interface RelatedArticlesProps {
  articles: RelatedArticle[];
}

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  return (
    <Card className="shadow-card p-6">
      <h3 className="text-xl font-semibold text-brand-dark mb-6 pb-3 border-b-2 border-black flex items-center">
        <Newspaper className="h-5 w-5 mr-2 text-brand-blue" />
        Related Articles
      </h3>
      <div className="space-y-4">
        {articles.map((article) => (
          <a 
            key={article.id} 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group cursor-pointer block hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200"
          >
            <div className="flex space-x-4">
              <img 
                src={article.imageUrl}
                alt={article.title}
                className="w-28 h-20 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">{article.source}</p>
                <h4 className="font-semibold text-brand-dark text-sm line-clamp-2 group-hover:text-brand-blue transition-colors duration-200">
                  {article.title}
                </h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{article.excerpt}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </Card>
  );
}
