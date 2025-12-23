/**
 * Later.dev API Client
 * Social media scheduling and publishing
 */

const LATE_API_BASE = 'https://getlate.dev/api/v1';

interface LateProfile {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface LateAccount {
  _id: string;
  platform: string;
  username: string;
  profileId: string;
  profilePicture?: string;
}

interface LatePlatform {
  platform: string;
  accountId: string;
  status?: string;
}

interface LatePost {
  _id: string;
  content: string;
  media?: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledFor?: string;
  platforms: LatePlatform[];
  createdAt: string;
  publishedAt?: string;
}

interface CreatePostOptions {
  content: string;
  media?: string[];
  platforms: { platform: string; accountId: string }[];
  scheduledFor?: string;
  timezone?: string;
  status?: 'draft' | 'scheduled' | 'published';
}

class LateClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.LATE_API_KEY || '';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Late API key not configured');
    }

    const response = await fetch(`${LATE_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Late API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Profile Management
  async createProfile(name: string, description?: string): Promise<LateProfile> {
    return this.request<LateProfile>('/profiles', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async listProfiles(): Promise<{ profiles: LateProfile[] }> {
    return this.request<{ profiles: LateProfile[] }>('/profiles');
  }

  async getProfile(profileId: string): Promise<LateProfile> {
    return this.request<LateProfile>(`/profiles/${profileId}`);
  }

  async deleteProfile(profileId: string): Promise<void> {
    await this.request(`/profiles/${profileId}`, { method: 'DELETE' });
  }

  // Account Connection
  // Returns the OAuth connect URL for a platform
  // The apiKey is passed as a query param because this URL is opened in the browser
  getConnectUrl(platform: string, profileId: string, redirectUrl?: string): string {
    const params = new URLSearchParams({ profileId });
    if (redirectUrl) params.append('redirect_url', redirectUrl);
    // API key must be passed as apiKey query param for browser redirects
    return `${LATE_API_BASE}/connect/${platform}?${params.toString()}&apiKey=${this.apiKey}`;
  }

  async listAccounts(profileId?: string): Promise<{ accounts: LateAccount[] }> {
    const endpoint = profileId ? `/accounts?profileId=${profileId}` : '/accounts';
    return this.request<{ accounts: LateAccount[] }>(endpoint);
  }

  async disconnectAccount(accountId: string): Promise<void> {
    await this.request(`/accounts/${accountId}`, { method: 'DELETE' });
  }

  // Post Management
  async createPost(options: CreatePostOptions): Promise<LatePost> {
    return this.request<LatePost>('/posts', {
      method: 'POST',
      body: JSON.stringify({
        content: options.content,
        media: options.media,
        platforms: options.platforms,
        scheduledFor: options.scheduledFor,
        timezone: options.timezone || 'Europe/Amsterdam',
        status: options.status || (options.scheduledFor ? 'scheduled' : 'draft'),
      }),
    });
  }

  async listPosts(options?: {
    status?: string;
    profileId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ posts: LatePost[] }> {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.profileId) params.append('profileId', options.profileId);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    
    const query = params.toString();
    return this.request<{ posts: LatePost[] }>(`/posts${query ? `?${query}` : ''}`);
  }

  async getPost(postId: string): Promise<LatePost> {
    return this.request<LatePost>(`/posts/${postId}`);
  }

  async updatePost(postId: string, updates: Partial<CreatePostOptions>): Promise<LatePost> {
    return this.request<LatePost>(`/posts/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deletePost(postId: string): Promise<void> {
    await this.request(`/posts/${postId}`, { method: 'DELETE' });
  }

  async publishPost(postId: string): Promise<LatePost> {
    return this.request<LatePost>(`/posts/${postId}/publish`, {
      method: 'POST',
    });
  }

  // Media Upload
  async uploadMedia(file: Buffer | Blob, filename: string): Promise<{ _id: string; url: string }> {
    const formData = new FormData();
    const blob = Buffer.isBuffer(file) ? new Blob([new Uint8Array(file)]) : file;
    formData.append('file', blob, filename);

    const response = await fetch(`${LATE_API_BASE}/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload media: ${response.status}`);
    }

    return response.json();
  }

  async uploadMediaFromUrl(imageUrl: string): Promise<{ _id: string; url: string } | null> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) return null;
      
      const buffer = await response.arrayBuffer();
      const filename = imageUrl.split('/').pop() || 'image.jpg';
      
      return this.uploadMedia(Buffer.from(buffer), filename);
    } catch (error) {
      console.error('Failed to upload media from URL:', error);
      return null;
    }
  }

  // Check if API key is configured
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Singleton instance
let lateClient: LateClient | null = null;

export function getLateClient(): LateClient {
  if (!lateClient) {
    lateClient = new LateClient();
  }
  return lateClient;
}

export { LateClient, type LateProfile, type LateAccount, type LatePost, type CreatePostOptions };
