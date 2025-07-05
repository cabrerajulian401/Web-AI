import type { Article } from '@shared/schema';
import fetch from 'node-fetch';

interface NewsDataArticle {
  article_id: string;
  title: string;
  link: string;
  keywords?: string[];
  creator?: string[];
  description?: string;
  content?: string;
  pubDate: string;
  image_url?: string;
  video_url?: string;
  source_id: string;
  source_name?: string;
  source_url?: string;
  source_icon?: string;
  language: string;
  country: string[];
  category: string[];
  ai_tag?: string[];
  sentiment?: string;
  duplicate: boolean;
}

interface NewsDataResponse {
  status: string;
  totalResults: number;
  results: NewsDataArticle[];
  nextPage?: string;
}

export class RSSService {
  private apiKey: string;
  private baseUrl: string;

  constructor(feedUrl?: string) {
    this.apiKey = process.env.NEWSDATA_API_KEY || '';
    this.baseUrl = 'https://newsdata.io/api/1';
    
    if (!this.apiKey) {
      throw new Error('NEWSDATA_API_KEY environment variable is required');
    }
  }

  async fetchArticles(): Promise<Article[]> {
    try {
      console.log('Fetching recent trending US political news from newsdata.io...');
      
      // Simple political keyword for current events
      const politicalKeywords = 'politics';
      
      // Add more specific parameters for better political news diversity
      const apiUrl = `${this.baseUrl}/latest?apikey=${this.apiKey}&country=us&category=politics&language=en`;
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`NewsData API error: ${response.status} ${response.statusText}`);
        console.log('API Error Response:', errorText);
        console.log('Falling back to sample political news data...');
        return this.getSampleEventData();
      }
      
      const data = await response.json() as NewsDataResponse;
      
      if (data.status !== 'success') {
        console.log('NewsData API returned error status, falling back to sample political news data...');
        return this.getSampleEventData();
      }
      
      console.log(`Fetched ${data.results.length} events from newsdata.io`);
      
      // Log the first few article titles to see what we're getting
      console.log('First few articles from API:');
      data.results.slice(0, 3).forEach((item, index) => {
        console.log(`${index + 1}. ${item.title} - Category: ${item.category}`);
      });
      
      // Filter for unique titles and complete articles
      const seenTitles = new Set<string>();
      const filteredResults = data.results.filter(item => {
        const hasRequiredData = item.title && item.description;
        const isUnique = !seenTitles.has(item.title);
        
        if (hasRequiredData && isUnique) {
          seenTitles.add(item.title);
          return true;
        }
        return false;
      });
      console.log(`After filtering: ${filteredResults.length} articles remaining`);
      
      const articles: Article[] = filteredResults
        .map((item, index) => {
          const slug = this.createSlug(item.title);
          const imageUrl = item.image_url || this.getDefaultImage();
          
          return {
            id: index + 1,
            title: this.cleanTitle(item.title),
            slug,
            excerpt: item.description || this.extractExcerpt(item.content || ''),
            content: item.content || item.description || '',
            category: this.mapCategory(item.category),
            publishedAt: new Date(item.pubDate),
            readTime: this.estimateReadTime(item.content || item.description || ''),
            sourceCount: Math.floor(Math.random() * 15) + 5, // Random number between 5-20
            heroImageUrl: imageUrl,
            authorName: item.creator?.[0] || null,
            authorTitle: item.source_name || null,
          };
        })
        .slice(0, 20); // Limit to 20 articles
      
      console.log(`Returning ${articles.length} articles to storage`);
      if (articles.length > 0) {
        console.log(`First article: ${articles[0].title}`);
      }
      
      return articles;
    } catch (error) {
      console.error('Error fetching from newsdata.io:', error);
      console.log('Using sample political news data...');
      return this.getSampleEventData();
    }
  }

  private createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50);
  }

  private cleanTitle(title: string): string {
    // Remove common RSS feed prefixes and clean up title
    return title
      .replace(/^Google Alert - /, '')
      .replace(/<[^>]*>/g, '') // Remove HTML tags like <b>, </b>
      .replace(/&[^;]+;/g, (match) => {
        // Decode common HTML entities
        const entities: { [key: string]: string } = {
          '&amp;': '&',
          '&lt;': '<',
          '&gt;': '>',
          '&quot;': '"',
          '&#39;': "'",
          '&nbsp;': ' '
        };
        return entities[match] || match;
      })
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractExcerpt(content: string): string {
    // Strip HTML tags and get first 200 characters
    const stripped = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return stripped.length > 200 ? stripped.substring(0, 200) + '...' : stripped;
  }

  private mapCategory(categories: string[]): string {
    // Map newsdata.io categories to our simplified categories
    if (!categories || categories.length === 0) return 'News';
    
    const category = categories[0].toLowerCase();
    const categoryMap: { [key: string]: string } = {
      'technology': 'Technology',
      'business': 'Business',
      'politics': 'Politics',
      'sports': 'Sports',
      'entertainment': 'Entertainment',
      'health': 'Health',
      'science': 'Science',
      'world': 'World',
      'top': 'Breaking',
      'lifestyle': 'Lifestyle'
    };
    
    return categoryMap[category] || 'News';
  }

  private getDefaultImage(): string {
    // Use the provided placeholder image
    return '/placeholder_1751663094502.jpg';
  }

  private estimateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  private getSampleEventData(): Article[] {
    // Sample recent trending US political events and news data
    const sampleEvents = [
      {
        title: "Breaking: House Speaker Johnson Faces Challenge from GOP Hardliners",
        description: "Republican conservatives threaten Speaker Johnson's leadership over spending bill negotiations, creating uncertainty in House proceedings.",
        category: "Breaking Politics",
        image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=400&fit=crop"
      },
      {
        title: "Trump Legal Team Files Emergency Supreme Court Appeal",
        description: "Former President's lawyers petition Supreme Court for emergency stay of lower court ruling in federal election interference case.",
        category: "Legal/Political",
        image: "https://images.unsplash.com/photo-1589578527966-fdac0f44566c?w=800&h=400&fit=crop"
      },
      {
        title: "Biden Poll Numbers Drop Amid Economic Concerns",
        description: "New polling shows President Biden's approval rating declining as voters express concern over inflation and economic uncertainty.",
        category: "Campaign 2024",
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=400&fit=crop"
      },
      {
        title: "DeSantis Campaign Shakeup: Key Staff Departures Announced",
        description: "Florida Governor's presidential campaign announces major staff changes amid fundraising challenges and polling struggles.",
        category: "Campaign 2024",
        image: "https://images.unsplash.com/photo-1596368743298-413cca6f4d61?w=800&h=400&fit=crop"
      },
      {
        title: "Senate Confirms Controversial FTC Nominee in Party-Line Vote",
        description: "Democrats push through Biden's nominee for Federal Trade Commission despite Republican objections over antitrust positions.",
        category: "Senate Confirmations",
        image: "https://images.unsplash.com/photo-1569163139394-de4e4f43e4e0?w=800&h=400&fit=crop"
      },
      {
        title: "Hunter Biden Investigation: New Subpoenas Issued by House Committee",
        description: "House Oversight Committee escalates probe with fresh subpoenas targeting business associates and financial records.",
        category: "Congressional Investigation",
        image: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&h=400&fit=crop"
      }
    ];

    return sampleEvents.map((event, index) => ({
      id: index + 1,
      title: event.title,
      slug: this.createSlug(event.title),
      excerpt: event.description,
      content: event.description,
      category: event.category,
      publishedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random time within last 24 hours
      readTime: Math.floor(Math.random() * 5) + 3, // 3-7 minutes
      sourceCount: Math.floor(Math.random() * 15) + 5, // 5-20 sources
      heroImageUrl: event.image,
      authorName: "News Desk",
      authorTitle: "TIMIO News",
    }));
  }
}