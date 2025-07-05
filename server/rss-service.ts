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
      console.log('Fetching trending events from newsdata.io...');
      
      // Event-related keywords to focus on trending events rather than regular news
      const eventKeywords = [
        'breakthrough', 'announces', 'launches', 'releases', 'unveils', 
        'summit', 'conference', 'event', 'festival', 'championship',
        'protest', 'demonstration', 'rally', 'march', 'strike',
        'merger', 'acquisition', 'IPO', 'funding', 'investment',
        'disaster', 'emergency', 'crisis', 'accident', 'incident'
      ].join(' OR ');
      
      const response = await fetch(
        `${this.baseUrl}/latest?apikey=${this.apiKey}&q=${encodeURIComponent(eventKeywords)}&language=en&size=20&prioritydomain=top`
      );
      
      if (!response.ok) {
        console.log(`NewsData API error: ${response.status} ${response.statusText}`);
        console.log('Falling back to sample trending events data...');
        return this.getSampleEventData();
      }
      
      const data = await response.json() as NewsDataResponse;
      
      if (data.status !== 'success') {
        console.log('NewsData API returned error status, falling back to sample data...');
        return this.getSampleEventData();
      }
      
      console.log(`Fetched ${data.results.length} events from newsdata.io`);
      
      const articles: Article[] = data.results
        .filter(item => !item.duplicate && item.title && item.description) // Filter out duplicates and incomplete articles
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
      
      return articles;
    } catch (error) {
      console.error('Error fetching from newsdata.io:', error);
      console.log('Using sample trending events data...');
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
    // Sample trending events data focused on current news events
    const sampleEvents = [
      {
        title: "Tech Giants Announce Major AI Summit for Industry Standards",
        description: "Leading technology companies including Google, Microsoft, and OpenAI announce a joint summit to establish AI development standards and safety protocols.",
        category: "Technology",
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop"
      },
      {
        title: "Global Climate Conference Reaches Historic Agreement",
        description: "World leaders at COP29 reach a groundbreaking agreement on carbon reduction targets and renewable energy funding initiatives.",
        category: "World",
        image: "https://images.unsplash.com/photo-1569163139394-de4e4f43e4e0?w=800&h=400&fit=crop"
      },
      {
        title: "Major Breakthrough in Quantum Computing Research",
        description: "Scientists at MIT announce a significant advancement in quantum error correction, bringing practical quantum computers closer to reality.",
        category: "Science",
        image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=400&fit=crop"
      },
      {
        title: "Championship Finals Draw Record Global Viewership",
        description: "The World Cup finals break viewership records with over 1.5 billion people tuning in worldwide, making it the most-watched sporting event in history.",
        category: "Sports",
        image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=400&fit=crop"
      },
      {
        title: "International Trade Summit Unveils New Economic Partnership",
        description: "Leaders from 20 nations announce a new trade partnership aimed at strengthening global supply chains and economic cooperation.",
        category: "Business",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop"
      },
      {
        title: "Space Agency Launches Revolutionary Mars Mission",
        description: "NASA and ESA launch joint mission to Mars with advanced rovers designed to search for signs of ancient life and prepare for human exploration.",
        category: "Science",
        image: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800&h=400&fit=crop"
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