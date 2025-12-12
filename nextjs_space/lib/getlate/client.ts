/**
 * Getlate.dev API Client
 * 
 * Handles all interactions with the Late API for social media management.
 * Docs: https://getlate.dev/api/docs
 */

const GETLATE_API_KEY = process.env.GETLATE_API_KEY;
const GETLATE_API_URL = 'https://getlate.dev/api/v1';

export interface GetlateProfile {
  _id: string;
  name: string;
  description?: string;
  color?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface GetlateAccount {
  _id: string;
  platform: string;
  username: string;
  displayName: string;
  profileId: string;
  isActive: boolean;
  profilePicture?: string;
  followersCount?: number;
}

export interface GetlatePost {
  _id: string;
  content: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledFor?: string;
  platforms: Array<{
    platform: string;
    accountId: string;
    status: string;
  }>;
}

export class GetlateClient {
  private apiKey: string;
  
  constructor() {
    if (!GETLATE_API_KEY) {
      throw new Error('GETLATE_API_KEY not configured in environment variables');
    }
    this.apiKey = GETLATE_API_KEY;
  }
  
  /**
   * Make authenticated request to Getlate API
   */
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${GETLATE_API_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(
        error.error || error.message || `Getlate API request failed: ${response.status}`
      );
    }
    
    return await response.json() as T;
  }
  
  // ============================================================================
  // PROFILE MANAGEMENT
  // ============================================================================
  
  /**
   * List all profiles
   */
  async listProfiles(): Promise<{ profiles: GetlateProfile[] }> {
    return await this.request<{ profiles: GetlateProfile[] }>('/profiles');
  }
  
  /**
   * Create a new profile
   */
  async createProfile(
    name: string, 
    description?: string,
    color?: string
  ): Promise<{ message: string; profile: GetlateProfile }> {
    return await this.request<{ message: string; profile: GetlateProfile }>('/profiles', {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        color: color || '#ffeda0', // Default yellow
        isDefault: false
      })
    });
  }
  
  /**
   * Get profile by ID
   */
  async getProfile(profileId: string): Promise<{ profile: GetlateProfile }> {
    return await this.request<{ profile: GetlateProfile }>(`/profiles/${profileId}`);
  }
  
  /**
   * Update profile
   */
  async updateProfile(
    profileId: string,
    data: Partial<Pick<GetlateProfile, 'name' | 'description' | 'color'>>
  ): Promise<{ message: string; profile: GetlateProfile }> {
    return await this.request<{ message: string; profile: GetlateProfile }>(
      `/profiles/${profileId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data)
      }
    );
  }
  
  /**
   * Delete profile (must have no connected accounts)
   */
  async deleteProfile(profileId: string): Promise<{ message: string }> {
    return await this.request<{ message: string }>(`/profiles/${profileId}`, {
      method: 'DELETE'
    });
  }
  
  // ============================================================================
  // SOCIAL MEDIA CONNECTION
  // ============================================================================
  
  /**
   * Get OAuth connection URL for a platform
   */
  async getConnectUrl(
    profileId: string, 
    platform: string,
    redirectUrl?: string
  ): Promise<{ authUrl: string; state: string }> {
    const params = new URLSearchParams({
      profileId,
      ...(redirectUrl && { redirect_url: redirectUrl })
    });
    
    return await this.request<{ authUrl: string; state: string }>(
      `/connect/${platform}?${params.toString()}`
    );
  }
  
  /**
   * Connect Bluesky using app password (direct connection)
   */
  async connectBluesky(
    identifier: string,
    appPassword: string,
    profileId: string,
    userId: string,
    redirectUri?: string
  ): Promise<{ message: string; account: GetlateAccount }> {
    return await this.request<{ message: string; account: GetlateAccount }>(
      '/connect/bluesky/credentials',
      {
        method: 'POST',
        body: JSON.stringify({
          identifier,
          appPassword,
          state: `${userId}-${profileId}`,
          redirectUri
        })
      }
    );
  }
  
  // ============================================================================
  // ACCOUNT MANAGEMENT
  // ============================================================================
  
  /**
   * List connected accounts
   */
  async listAccounts(profileId?: string): Promise<{ 
    accounts: GetlateAccount[];
    hasAnalyticsAccess: boolean;
  }> {
    const params = profileId ? `?profileId=${profileId}` : '';
    return await this.request<{ 
      accounts: GetlateAccount[];
      hasAnalyticsAccess: boolean;
    }>(`/accounts${params}`);
  }
  
  /**
   * Get specific account
   */
  async getAccount(accountId: string): Promise<GetlateAccount> {
    const result = await this.listAccounts();
    const account = result.accounts.find(acc => acc._id === accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }
    return account;
  }
  
  /**
   * Update account
   */
  async updateAccount(
    accountId: string,
    data: Partial<Pick<GetlateAccount, 'username' | 'displayName'>>
  ): Promise<{ message: string; account: GetlateAccount }> {
    return await this.request<{ message: string; account: GetlateAccount }>(
      `/accounts/${accountId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data)
      }
    );
  }
  
  /**
   * Disconnect account
   */
  async disconnectAccount(accountId: string): Promise<{ message: string }> {
    return await this.request<{ message: string }>(`/accounts/${accountId}`, {
      method: 'DELETE'
    });
  }
  
  // ============================================================================
  // POST MANAGEMENT
  // ============================================================================
  
  /**
   * Create a post
   */
  async createPost(data: {
    content: string;
    platforms: Array<{
      platform: string;
      accountId: string;
    }>;
    status?: 'draft' | 'published';
    scheduledFor?: string; // ISO 8601 format
    timezone?: string; // e.g., "Europe/Amsterdam"
    media?: string[]; // Media IDs from upload
  }): Promise<GetlatePost> {
    return await this.request<GetlatePost>('/posts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  /**
   * List posts
   */
  async listPosts(filters?: {
    profileId?: string;
    status?: 'draft' | 'scheduled' | 'published' | 'failed';
    limit?: number;
    offset?: number;
  }): Promise<{ posts: GetlatePost[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.profileId) params.append('profileId', filters.profileId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    
    const queryString = params.toString();
    return await this.request<{ posts: GetlatePost[]; total: number }>(
      `/posts${queryString ? '?' + queryString : ''}`
    );
  }
  
  /**
   * Get post by ID
   */
  async getPost(postId: string): Promise<{ post: GetlatePost }> {
    return await this.request<{ post: GetlatePost }>(`/posts/${postId}`);
  }
  
  /**
   * Update post
   */
  async updatePost(
    postId: string,
    data: Partial<{
      content: string;
      scheduledFor: string;
      status: 'draft' | 'scheduled' | 'published';
    }>
  ): Promise<{ message: string; post: GetlatePost }> {
    return await this.request<{ message: string; post: GetlatePost }>(
      `/posts/${postId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data)
      }
    );
  }
  
  /**
   * Delete post
   */
  async deletePost(postId: string): Promise<{ message: string }> {
    return await this.request<{ message: string }>(`/posts/${postId}`, {
      method: 'DELETE'
    });
  }
  
  // ============================================================================
  // MEDIA UPLOAD
  // ============================================================================
  
  /**
   * Upload media (image/video)
   * Note: This requires FormData, implementation depends on usage context
   */
  async uploadMedia(file: File | Buffer, filename: string): Promise<{
    mediaId: string;
    url: string;
    type: string;
  }> {
    // Implementation note: FormData handling differs between Node.js and browser
    // This is a placeholder that should be implemented based on the actual usage
    throw new Error('uploadMedia not yet implemented - requires FormData handling');
  }
}

/**
 * Singleton instance of the Getlate client
 */
export const getlateClient = new GetlateClient();
