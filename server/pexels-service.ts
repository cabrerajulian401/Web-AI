import fetch from 'node-fetch';

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

interface PexelsResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

export class PexelsService {
  private apiKey: string;
  private baseUrl: string = 'https://api.pexels.com/v1';
  private imageCache: Map<string, string> = new Map();

  constructor() {
    this.apiKey = process.env.PEXELS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('PEXELS_API_KEY not found in environment variables');
    }
  }

  async searchImageByTopic(query: string, imageIndex: number = 0): Promise<string> {
    try {
      // Create cache key with query and index for unique image assignment
      const cacheKey = `${query}_${imageIndex}`;
      
      // Check cache first
      if (this.imageCache.has(cacheKey)) {
        console.log(`Using cached image for: ${cacheKey}`);
        return this.imageCache.get(cacheKey)!;
      }

      if (!this.apiKey) {
        console.warn('Pexels API key not available, using placeholder image');
        const placeholderUrl = this.generatePlaceholderImage(query);
        this.imageCache.set(cacheKey, placeholderUrl);
        return placeholderUrl;
      }

      // Clean and enhance the search query for better results
      const searchQuery = this.enhanceSearchQuery(query);
      
      console.log(`Searching Pexels for: ${searchQuery} (index: ${imageIndex})`);

      const response = await fetch(`${this.baseUrl}/search?query=${encodeURIComponent(searchQuery)}&per_page=20&orientation=landscape`, {
        headers: {
          'Authorization': this.apiKey,
          'User-Agent': 'TIMIO News Research App'
        }
      });

      if (!response.ok) {
        console.error(`Pexels API error: ${response.status} ${response.statusText}`);
        const placeholderUrl = this.generatePlaceholderImage(query);
        this.imageCache.set(cacheKey, placeholderUrl);
        return placeholderUrl;
      }

      const data: PexelsResponse = await response.json();
      
      if (!data.photos || data.photos.length === 0) {
        console.warn(`No images found for query: ${searchQuery}`);
        const placeholderUrl = this.generatePlaceholderImage(query);
        this.imageCache.set(cacheKey, placeholderUrl);
        return placeholderUrl;
      }

      // Select image based on index to ensure different images for different articles
      const selectedPhoto = data.photos[imageIndex % data.photos.length];
      console.log(`Selected image ${imageIndex}: ${selectedPhoto.alt} by ${selectedPhoto.photographer}`);
      
      // Cache the result
      const imageUrl = selectedPhoto.src.large;
      this.imageCache.set(cacheKey, imageUrl);
      
      return imageUrl;

    } catch (error) {
      console.error('Error fetching image from Pexels:', error);
      const placeholderUrl = this.generatePlaceholderImage(query);
      this.imageCache.set(cacheKey, placeholderUrl);
      return placeholderUrl;
    }
  }

  private enhanceSearchQuery(query: string): string {
    // Map research topics to better search terms for political/news imagery
    const topicMappings: { [key: string]: string } = {
      'supreme court': 'supreme court building justice',
      'border control': 'border fence immigration',
      'immigration': 'immigration border policy',
      'inflation': 'economy money finance',
      'healthcare': 'hospital medical healthcare',
      'congress': 'capitol building congress',
      'senate': 'senate chamber government',
      'house': 'house representatives capitol',
      'election': 'voting ballot election',
      'economy': 'business finance economy',
      'trade': 'shipping containers trade',
      'tariffs': 'trade commerce economics',
      'tax': 'money taxes finance',
      'budget': 'government budget finance',
      'defense': 'military defense pentagon',
      'security': 'security government building',
      'flooding': 'flooding disaster water',
      'floods': 'flooding disaster water',
      'climate': 'climate change environment',
      'weather': 'storm weather disaster',
      'disaster': 'disaster emergency response',
      'texas': 'texas state government',
      'california': 'california state government',
      'technology': 'technology innovation computer',
      'artificial intelligence': 'technology computer ai',
      'ai': 'technology computer artificial intelligence',
      'reuters': 'news media journalism',
      'associated press': 'news media journalism', 
      'cnn': 'news media journalism',
      'fox news': 'news media journalism',
      'bbc': 'news media journalism',
      'npr': 'news media journalism',
      'wikipedia': 'books library research',
      'wall street journal': 'business finance newspaper',
      'new york times': 'newspaper journalism media',
      'washington post': 'newspaper politics journalism',
      'serve source': 'community volunteers helping',
      'ap news': 'news media journalism',
      'usa today': 'newspaper journalism media'
    };

    const lowerQuery = (query || '').toLowerCase();
    
    // Check for exact matches first
    for (const [key, value] of Object.entries(topicMappings)) {
      if (lowerQuery.includes(key)) {
        return value;
      }
    }

    // If no specific mapping, add generic political/government terms
    if (this.isPoliticalTopic(lowerQuery)) {
      return `${query} government politics`;
    }

    return query;
  }

  private isPoliticalTopic(query: string): boolean {
    const politicalKeywords = [
      'trump', 'biden', 'president', 'white house', 'administration',
      'republican', 'democrat', 'party', 'campaign', 'vote', 'legislation',
      'bill', 'law', 'policy', 'regulation', 'federal', 'state', 'government'
    ];

    return politicalKeywords.some(keyword => query.includes(keyword));
  }

  private generatePlaceholderImage(query: string): string {
    // Generate a descriptive placeholder as fallback
    const safeQuery = query || 'news';
    const cleanQuery = safeQuery.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '+');
    return `https://via.placeholder.com/800x400/1e40af/white?text=${encodeURIComponent(cleanQuery)}`;
  }
}

export const pexelsService = new PexelsService();