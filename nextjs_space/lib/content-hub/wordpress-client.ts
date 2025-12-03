/**
 * WordPress REST API Client for Content Hub
 * Handles all WordPress integration: connection testing, content publishing, media uploads
 */

export interface WordPressCredentials {
  siteUrl: string;
  username: string;
  applicationPassword: string;
}

export interface WordPressPost {
  id: number;
  link: string;
  title: { rendered: string };
  status: string;
  date: string;
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
}

export interface WordPressMedia {
  id: number;
  source_url: string;
  mime_type: string;
}

export class WordPressClient {
  private credentials: WordPressCredentials;
  private baseUrl: string;
  private authHeader: string;

  constructor(credentials: WordPressCredentials) {
    this.credentials = credentials;
    // Ensure URL ends with /wp-json/wp/v2
    const url = credentials.siteUrl.replace(/\/$/, '');
    this.baseUrl = url.includes('/wp-json') ? url : `${url}/wp-json/wp/v2`;
    
    // Create Basic Auth header
    const auth = Buffer.from(
      `${credentials.username}:${credentials.applicationPassword}`
    ).toString('base64');
    this.authHeader = `Basic ${auth}`;
  }

  /**
   * Test connection to WordPress site
   */
  async testConnection(): Promise<{ success: boolean; message: string; siteInfo?: any }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Authorization': this.authHeader,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        message: 'Connection successful',
        siteInfo: {
          name: data.name,
          description: data.description,
          url: data.url,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Connection failed',
      };
    }
  }

  /**
   * Upload media file to WordPress
   */
  async uploadMedia(
    imageUrl: string,
    filename?: string
  ): Promise<WordPressMedia> {
    try {
      // Download image first
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const blob = new Blob([imageBuffer], { 
        type: imageResponse.headers.get('content-type') || 'image/jpeg' 
      });

      const formData = new FormData();
      formData.append('file', blob, filename || 'image.jpg');

      const response = await fetch(`${this.baseUrl}/media`, {
        method: 'POST',
        headers: {
          'Authorization': this.authHeader,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload media: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`Media upload failed: ${error.message}`);
    }
  }

  /**
   * Get or create category by name
   */
  async getOrCreateCategory(name: string): Promise<number> {
    try {
      // First, try to find existing category
      const searchResponse = await fetch(
        `${this.baseUrl}/categories?search=${encodeURIComponent(name)}`,
        {
          headers: {
            'Authorization': this.authHeader,
          },
        }
      );

      if (searchResponse.ok) {
        const categories: WordPressCategory[] = await searchResponse.json();
        const exactMatch = categories.find(
          cat => cat.name.toLowerCase() === name.toLowerCase()
        );
        if (exactMatch) {
          return exactMatch.id;
        }
      }

      // Create new category
      const createResponse = await fetch(`${this.baseUrl}/categories`, {
        method: 'POST',
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        }),
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create category: ${createResponse.statusText}`);
      }

      const category: WordPressCategory = await createResponse.json();
      return category.id;
    } catch (error: any) {
      throw new Error(`Category operation failed: ${error.message}`);
    }
  }

  /**
   * Create or update a WordPress post
   */
  async createPost(options: {
    title: string;
    content: string;
    excerpt?: string;
    status?: 'publish' | 'draft' | 'future';
    featured_media?: number;
    categories?: number[];
    tags?: string[] | number[];
    meta?: Record<string, any>;
    date?: string;
  }): Promise<WordPressPost> {
    try {
      const postData: any = {
        title: options.title,
        content: options.content,
        excerpt: options.excerpt || '',
        status: options.status || 'draft',
      };

      if (options.featured_media) {
        postData.featured_media = options.featured_media;
      }

      if (options.categories && options.categories.length > 0) {
        postData.categories = options.categories;
      }

      if (options.tags && options.tags.length > 0) {
        // Convert tag names to IDs if needed
        if (typeof options.tags[0] === 'string') {
          postData.tags = await this.getOrCreateTags(options.tags as string[]);
        } else {
          postData.tags = options.tags;
        }
      }

      if (options.meta) {
        postData.meta = options.meta;
      }

      if (options.date) {
        postData.date = options.date;
      }

      const response = await fetch(`${this.baseUrl}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create post: ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`Post creation failed: ${error.message}`);
    }
  }

  /**
   * Get or create tags by names
   */
  private async getOrCreateTags(tagNames: string[]): Promise<number[]> {
    const tagIds: number[] = [];

    for (const name of tagNames) {
      try {
        // Search for existing tag
        const searchResponse = await fetch(
          `${this.baseUrl}/tags?search=${encodeURIComponent(name)}`,
          {
            headers: {
              'Authorization': this.authHeader,
            },
          }
        );

        if (searchResponse.ok) {
          const tags: any[] = await searchResponse.json();
          const exactMatch = tags.find(
            tag => tag.name.toLowerCase() === name.toLowerCase()
          );
          if (exactMatch) {
            tagIds.push(exactMatch.id);
            continue;
          }
        }

        // Create new tag
        const createResponse = await fetch(`${this.baseUrl}/tags`, {
          method: 'POST',
          headers: {
            'Authorization': this.authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          }),
        });

        if (createResponse.ok) {
          const tag = await createResponse.json();
          tagIds.push(tag.id);
        }
      } catch (error) {
        console.error(`Failed to process tag "${name}":`, error);
      }
    }

    return tagIds;
  }

  /**
   * Get existing posts from WordPress
   */
  async getPosts(params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<{ posts: WordPressPost[]; totalPages: number; total: number }> {
    try {
      const queryParams = new URLSearchParams({
        page: String(params?.page || 1),
        per_page: String(params?.per_page || 10),
        ...(params?.search ? { search: params.search } : {}),
      });

      const response = await fetch(`${this.baseUrl}/posts?${queryParams}`, {
        headers: {
          'Authorization': this.authHeader,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`);
      }

      const posts = await response.json();
      const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
      const total = parseInt(response.headers.get('X-WP-Total') || '0');

      return { posts, totalPages, total };
    } catch (error: any) {
      throw new Error(`Failed to get posts: ${error.message}`);
    }
  }

  /**
   * Get WordPress sitemap (pages list)
   */
  async getPages(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/pages?per_page=100`, {
        headers: {
          'Authorization': this.authHeader,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch pages: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`Failed to get pages: ${error.message}`);
    }
  }
}
