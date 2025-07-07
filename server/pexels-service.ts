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

  constructor() {
    this.apiKey = process.env.PEXELS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('PEXELS_API_KEY not found in environment variables');
    }
  }

  async searchImageByTopic(query: string): Promise<string> {
    try {
      if (!this.apiKey) {
        console.warn('Pexels API key not available, using placeholder image');
        return this.generatePlaceholderImage(query);
      }

      // Clean and enhance the search query for better results
      const searchQuery = this.enhanceSearchQuery(query);
      
      console.log(`Searching Pexels for: ${searchQuery}`);

      const response = await fetch(`${this.baseUrl}/search?query=${encodeURIComponent(searchQuery)}&per_page=10&orientation=landscape`, {
        headers: {
          'Authorization': this.apiKey,
          'User-Agent': 'TIMIO News Research App'
        }
      });

      if (!response.ok) {
        console.error(`Pexels API error: ${response.status} ${response.statusText}`);
        return this.generatePlaceholderImage(query);
      }

      const data: PexelsResponse = await response.json();
      
      if (!data.photos || data.photos.length === 0) {
        console.warn(`No images found for query: ${searchQuery}`);
        return this.generatePlaceholderImage(query);
      }

      // Select the best image (usually the first one as they're sorted by relevance)
      const selectedPhoto = data.photos[0];
      console.log(`Selected image: ${selectedPhoto.alt} by ${selectedPhoto.photographer}`);
      
      // Return the large size image URL for hero display
      return selectedPhoto.src.large;

    } catch (error) {
      console.error('Error fetching image from Pexels:', error);
      return this.generatePlaceholderImage(query);
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
      'security': 'security government building'
    };

    const lowerQuery = query.toLowerCase();
    
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
    const cleanQuery = query.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '+');
    return `https://via.placeholder.com/800x400/1e40af/white?text=${encodeURIComponent(cleanQuery)}`;
  }
}

export const pexelsService = new PexelsService();