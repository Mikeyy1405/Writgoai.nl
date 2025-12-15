/**
 * Getlate.Dev API Client
 * Documentation: https://getlate.dev/docs
 * 
 * Unified social media posting API for 11+ platforms
 * Supports: Twitter/X, Instagram, Facebook, LinkedIn, TikTok, YouTube, Pinterest, Reddit, Bluesky, Threads, Google Business
 */

export interface GetlatePostData {
  platforms: string[]; // ['twitter', 'linkedin', 'instagram', 'facebook']
  accountId?: string; // Optional: specific account ID
  profileId?: string; // Optional: profile ID (container for accounts)
  content: string; // Post text content
  mediaUrls?: string[]; // Array of media URLs (images/videos)
  scheduledFor?: string; // ISO 8601 timestamp, omit for immediate posting
  firstComment?: string; // First comment (YouTube, Instagram, Facebook, LinkedIn)
}

export interface GetlatePostResponse {
  id: string;
  status: 'scheduled' | 'published' | 'failed';
  scheduledFor?: string;
  publishedAt?: string;
  platforms: string[];
  error?: string;
}

export interface GetlateAccount {
  id: string;
  platform: string;
  username: string;
  profileId: string;
}

export interface GetlateProfile {
  id: string;
  name: string;
  accounts: GetlateAccount[];
}

export class GetlateClient {
  private apiKey: string;
  private baseUrl: string = 'https://getlate.dev/api/v1';
  
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Getlate.Dev API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Test connection to Getlate.Dev API
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.makeRequest('GET', '/profiles');
      return { success: response.ok };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all profiles (containers for accounts)
   */
  async getProfiles(): Promise<GetlateProfile[]> {
    const response = await this.makeRequest('GET', '/profiles');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch profiles: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.profiles || [];
  }

  /**
   * Get all connected social accounts
   */
  async getAccounts(profileId?: string): Promise<GetlateAccount[]> {
    const endpoint = profileId ? `/profiles/${profileId}/accounts` : '/accounts';
    const response = await this.makeRequest('GET', endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch accounts: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.accounts || [];
  }

  /**
   * Create a new post (schedule or publish immediately)
   * 
   * @param data Post data including platforms, content, and optional schedule
   * @returns Post response with ID and status
   */
  async createPost(data: GetlatePostData): Promise<GetlatePostResponse> {
    // Validate required fields
    if (!data.content || data.content.trim() === '') {
      throw new Error('Post content is required');
    }

    if (!data.platforms || data.platforms.length === 0) {
      throw new Error('At least one platform must be specified');
    }

    // Build request body
    const body: any = {
      platforms: data.platforms,
      content: data.content,
    };

    if (data.accountId) {
      body.accountId = data.accountId;
    }

    if (data.profileId) {
      body.profileId = data.profileId;
    }

    if (data.mediaUrls && data.mediaUrls.length > 0) {
      body.mediaUrls = data.mediaUrls;
    }

    if (data.scheduledFor) {
      // Validate ISO 8601 format
      const date = new Date(data.scheduledFor);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid scheduledFor date format. Use ISO 8601.');
      }
      body.scheduledFor = data.scheduledFor;
    }

    if (data.firstComment) {
      body.firstComment = data.firstComment;
    }

    // Make API request
    const response = await this.makeRequest('POST', '/posts', body);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to create post: ${response.statusText}. ${errorData.error || ''}`
      );
    }

    const result = await response.json();
    
    return {
      id: result.id,
      status: result.status || 'scheduled',
      scheduledFor: result.scheduledFor,
      publishedAt: result.publishedAt,
      platforms: result.platforms || data.platforms,
      error: result.error,
    };
  }

  /**
   * Get a specific post by ID
   */
  async getPost(postId: string): Promise<any> {
    const response = await this.makeRequest('GET', `/posts/${postId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch post: ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Get all posts (with optional filters)
   */
  async getPosts(filters?: {
    status?: 'scheduled' | 'published' | 'failed';
    platform?: string;
    limit?: number;
  }): Promise<any[]> {
    let endpoint = '/posts';
    const params = new URLSearchParams();

    if (filters?.status) {
      params.append('status', filters.status);
    }

    if (filters?.platform) {
      params.append('platform', filters.platform);
    }

    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    const response = await this.makeRequest('GET', endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.posts || [];
  }

  /**
   * Update a scheduled post
   */
  async updatePost(postId: string, data: Partial<GetlatePostData>): Promise<GetlatePostResponse> {
    const response = await this.makeRequest('PATCH', `/posts/${postId}`, data);
    
    if (!response.ok) {
      throw new Error(`Failed to update post: ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Delete a scheduled post
   */
  async deletePost(postId: string): Promise<void> {
    const response = await this.makeRequest('DELETE', `/posts/${postId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to delete post: ${response.statusText}`);
    }
  }

  /**
   * Get analytics for a published post (requires Analytics add-on)
   */
  async getAnalytics(postId: string): Promise<any> {
    const response = await this.makeRequest('GET', `/analytics/${postId}`);
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Analytics add-on required');
      }
      throw new Error(`Failed to fetch analytics: ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Make an authenticated request to Getlate.Dev API
   */
  private async makeRequest(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      return response;
    } catch (error: any) {
      throw new Error(`Network error: ${error.message}`);
    }
  }
}

/**
 * Helper function to format date for Getlate.Dev API
 */
export function formatScheduleDate(date: Date): string {
  return date.toISOString();
}

/**
 * Validate platform name
 */
export function isValidPlatform(platform: string): boolean {
  const validPlatforms = [
    'twitter',
    'instagram',
    'facebook',
    'linkedin',
    'tiktok',
    'youtube',
    'pinterest',
    'reddit',
    'bluesky',
    'threads',
    'google-business'
  ];
  
  return validPlatforms.includes(platform.toLowerCase());
}
