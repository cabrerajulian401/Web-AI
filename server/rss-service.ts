import Parser from 'rss-parser';
import type { Article } from '@shared/schema';

interface RSSItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
}

export class RSSService {
  private parser: Parser;
  private feedUrl: string;

  constructor(feedUrl: string) {
    this.parser = new Parser();
    this.feedUrl = feedUrl;
  }

  async fetchArticles(): Promise<Article[]> {
    try {
      const feed = await this.parser.parseURL(this.feedUrl);
      
      return feed.items.map((item: RSSItem, index: number) => {
        // Extract a clean title
        const title = item.title || 'Untitled Article';
        
        // Create a slug from the title
        const slug = this.createSlug(title);
        
        // Extract excerpt from content or contentSnippet
        const excerpt = this.extractExcerpt(item.contentSnippet || item.content || '');
        
        // Try to extract image URL from content
        const heroImageUrl = this.extractImageUrl(item.content || '') || this.getDefaultImage();
        
        // Parse date
        const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();
        
        // Estimate read time based on content length
        const readTime = this.estimateReadTime(item.contentSnippet || item.content || '');
        
        // Determine category based on content
        const category = this.determineCategory(title, excerpt);

        return {
          id: index + 1,
          title: this.cleanTitle(title),
          slug,
          excerpt,
          content: item.content || item.contentSnippet || '',
          category,
          publishedAt,
          readTime,
          sourceCount: 1, // RSS items typically come from one source
          heroImageUrl,
          authorName: 'Google Alerts',
          authorTitle: 'AI News Aggregator'
        };
      });
    } catch (error) {
      console.error('Error fetching RSS feed:', error);
      return [];
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
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractExcerpt(content: string): string {
    // Strip HTML tags and get first 200 characters
    const stripped = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return stripped.length > 200 ? stripped.substring(0, 200) + '...' : stripped;
  }

  private extractImageUrl(content: string): string | null {
    // Try to extract image URL from HTML content
    const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
    return imgMatch ? imgMatch[1] : null;
  }

  private getDefaultImage(): string {
    // Array of AI-related stock images
    const defaultImages = [
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600',
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600',
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600'
    ];
    
    return defaultImages[Math.floor(Math.random() * defaultImages.length)];
  }

  private estimateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  private determineCategory(title: string, excerpt: string): string {
    const text = (title + ' ' + excerpt).toLowerCase();
    
    if (text.includes('openai') || text.includes('gpt') || text.includes('chatgpt')) {
      return 'OpenAI';
    } else if (text.includes('google') || text.includes('gemini') || text.includes('bard')) {
      return 'Google AI';
    } else if (text.includes('meta') || text.includes('llama') || text.includes('facebook')) {
      return 'Meta AI';
    } else if (text.includes('anthropic') || text.includes('claude')) {
      return 'Anthropic';
    } else if (text.includes('microsoft') || text.includes('copilot') || text.includes('azure')) {
      return 'Microsoft';
    } else if (text.includes('funding') || text.includes('investment') || text.includes('startup')) {
      return 'Funding';
    } else if (text.includes('safety') || text.includes('ethics') || text.includes('regulation')) {
      return 'AI Safety';
    } else if (text.includes('enterprise') || text.includes('business') || text.includes('corporate')) {
      return 'Enterprise';
    } else {
      return 'Technology';
    }
  }
}