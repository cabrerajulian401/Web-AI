import Parser from 'rss-parser';
import type { Article } from '@shared/schema';

interface RSSItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
  mediaThumbnail?: any;
  mediaContent?: any;
  enclosure?: any;
}

export class RSSService {
  private parser: Parser;
  private feedUrl: string;

  constructor(feedUrl: string) {
    this.parser = new Parser({
      customFields: {
        item: [
          ['media:thumbnail', 'mediaThumbnail'],
          ['media:content', 'mediaContent'],
          ['enclosure', 'enclosure']
        ]
      }
    });
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
        
        // Try to get image from RSS content first, then from title, then URL domain, then default
        let heroImageUrl = this.extractImageUrl(item.content || '', item);
        
        // Try to get image based on the source mentioned in the title (prioritized for Google Alerts)
        if (!heroImageUrl) {
          heroImageUrl = this.getImageFromTitle(title);
        }
        
        if (!heroImageUrl && item.link) {
          heroImageUrl = this.getImageBasedOnSource(item.link);
        }
        
        if (!heroImageUrl) {
          heroImageUrl = this.getDefaultImage();
        }
        
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

  private extractImageUrl(content: string, item?: RSSItem): string | null {
    // First check custom fields from RSS parser
    if (item) {
      // Check media:thumbnail
      if (item.mediaThumbnail && typeof item.mediaThumbnail === 'object') {
        const thumbnailUrl = item.mediaThumbnail.$ ? item.mediaThumbnail.$.url : item.mediaThumbnail;
        if (typeof thumbnailUrl === 'string' && this.isValidImageUrl(thumbnailUrl)) {
          return thumbnailUrl;
        }
      }
      
      // Check media:content
      if (item.mediaContent && typeof item.mediaContent === 'object') {
        const contentUrl = item.mediaContent.$ ? item.mediaContent.$.url : item.mediaContent;
        if (typeof contentUrl === 'string' && this.isValidImageUrl(contentUrl)) {
          return contentUrl;
        }
      }
      
      // Check enclosure for images
      if (item.enclosure && typeof item.enclosure === 'object') {
        const enclosureUrl = item.enclosure.$ ? item.enclosure.$.url : item.enclosure.url;
        if (typeof enclosureUrl === 'string' && this.isValidImageUrl(enclosureUrl)) {
          return enclosureUrl;
        }
      }
    }
    
    if (!content) return null;
    
    // Multiple patterns to match different image formats in RSS feeds
    const patterns = [
      // Standard img tag
      /<img[^>]+src="([^"]+)"/i,
      /<img[^>]+src='([^']+)'/i,
      // Media enclosures or thumbnails
      /<media:thumbnail[^>]+url="([^"]+)"/i,
      /<media:content[^>]+url="([^"]+)"/i,
      // Google News specific patterns
      /<img[^>]+src="([^"]*googleusercontent[^"]+)"/i,
      // Any image URL in the content
      /https?:\/\/[^\s<>"']+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s<>"']*)?/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        // Clean up the URL
        let imageUrl = match[1].trim();
        
        // Skip very small images (likely icons or tracking pixels)
        if (imageUrl.includes('1x1') || imageUrl.includes('pixel')) {
          continue;
        }
        
        // Ensure it's a valid image URL
        if (this.isValidImageUrl(imageUrl)) {
          return imageUrl;
        }
      }
    }
    
    return null;
  }

  private isValidImageUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const path = parsedUrl.pathname.toLowerCase();
      
      // Check if URL ends with valid image extension or has image-related parameters
      return validExtensions.some(ext => path.includes(ext)) || 
             url.includes('image') || 
             url.includes('photo') ||
             url.includes('thumbnail');
    } catch {
      return false;
    }
  }



  private getImageFromTitle(title: string): string | null {
    const titleLower = title.toLowerCase();
    
    // Check for news sources mentioned in the title (usually at the end after a dash)
    if (titleLower.includes('cnn') || titleLower.includes('cnn.com')) {
      return 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=800&h=400&fit=crop';
    }
    if (titleLower.includes('bbc') || titleLower.includes('bbc.com')) {
      return 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=800&h=400&fit=crop';
    }
    if (titleLower.includes('reuters') || titleLower.includes('reuters.com')) {
      return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop';
    }
    if (titleLower.includes('nbc news') || titleLower.includes('nbcnews')) {
      return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop';
    }
    if (titleLower.includes('techcrunch') || titleLower.includes('tech crunch')) {
      return 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop';
    }
    if (titleLower.includes('verge') || titleLower.includes('theverge')) {
      return 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop';
    }
    if (titleLower.includes('wired') || titleLower.includes('wired.com')) {
      return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop';
    }
    if (titleLower.includes('arstechnica') || titleLower.includes('ars technica')) {
      return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop';
    }
    if (titleLower.includes('venturebeat') || titleLower.includes('venture beat')) {
      return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop';
    }
    if (titleLower.includes('tvline') || titleLower.includes('tv line')) {
      return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop';
    }
    if (titleLower.includes('us news') || titleLower.includes('usnews')) {
      return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop';
    }
    
    return null;
  }

  private getImageBasedOnSource(url: string): string | null {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      
      // Map common news sources to different themed images
      const sourceImages: { [key: string]: string } = {
        'cnn.com': 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=800&h=400&fit=crop',
        'bbc.com': 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=800&h=400&fit=crop',
        'reuters.com': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop',
        'nbcnews.com': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop',
        'techcrunch.com': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop',
        'theverge.com': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop',
        'wired.com': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
        'arstechnica.com': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
        'venturebeat.com': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
        'openai.com': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
        'anthropic.com': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
        'google.com': 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=800&h=400&fit=crop',
        'microsoft.com': 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=800&h=400&fit=crop',
        'meta.com': 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=800&h=400&fit=crop',
        'facebook.com': 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=800&h=400&fit=crop'
      };
      
      // Check if we have a specific image for this domain
      for (const [sourceDomain, imageUrl] of Object.entries(sourceImages)) {
        if (domain.includes(sourceDomain)) {
          return imageUrl;
        }
      }
      
      // For articles about specific AI topics, use contextual images
      return null;
    } catch {
      return null;
    }
  }

  private getDefaultImage(): string {
    // Use the provided placeholder image
    return '/assets/placeholder_1751663094502.jpg';
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