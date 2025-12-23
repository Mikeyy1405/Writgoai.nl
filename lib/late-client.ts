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

interface MediaItem {
  mediaId: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: {
    url: string;
  };
}

interface LatePlatform {
  platform: string;
  accountId: string;
  status?: string;
}

interface LatePost {
  _id: string;
  content: string;
  mediaItems?: MediaItem[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledFor?: string;
  platforms: LatePlatform[];
  createdAt: string;
  publishedAt?: string;
}

interface CreatePostOptions {
  content: string;
  mediaItems?: MediaItem[];
  platforms: { platform: string; accountId: string; platformSpecificData?: any }[];
  scheduledFor?: string;
  timezone?: string;
  publishNow?: boolean;
  isDraft?: boolean;
  title?: string;
  tags?: string[];
  hashtags?: string[];
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
    console.log(`🔄 Creating Late.dev profile: ${name}`);
    
    try {
      const result = await this.request<LateProfile>('/profiles', {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      });
      
      console.log(`✅ Late.dev profile created: ${result._id}`);
      return result;
    } catch (error: any) {
      console.error(`❌ Late.dev create profile failed: ${error.message}`);
      throw error;
    }
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
  // Gets the OAuth connect URL for a platform from Late.dev API
  async getConnectUrl(platform: string, profileId: string, redirectUrl?: string): Promise<string> {
    const params = new URLSearchParams({ profileId });
    if (redirectUrl) params.append('redirect_url', redirectUrl);

    const url = `${LATE_API_BASE}/connect/${platform}?${params.toString()}&apiKey=${this.apiKey}`;

    console.log(`🔗 Fetching auth URL from Late.dev: ${url}`);

    try {
      // Make API request to get the authUrl
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Late.dev connect error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      console.log('✅ Late.dev connect response:', data);

      if (data.authUrl) {
        return data.authUrl;
      } else {
        throw new Error('No authUrl in Late.dev response');
      }
    } catch (error: any) {
      console.error('❌ Failed to get authUrl from Late.dev:', error);
      throw error;
    }
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
    // Convert mediaItems to media array of IDs (Late API expects "media": ["id1", "id2"])
    const media = options.mediaItems?.map(item => item.mediaId);

    return this.request<LatePost>('/posts', {
      method: 'POST',
      body: JSON.stringify({
        content: options.content,
        media: media && media.length > 0 ? media : undefined,
        platforms: options.platforms,
        scheduledFor: options.scheduledFor,
        timezone: options.timezone || 'Europe/Amsterdam',
        publishNow: options.publishNow,
        isDraft: options.isDraft,
        title: options.title,
        tags: options.tags,
        hashtags: options.hashtags,
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

  // Helper function to detect MIME type from filename
  private getMimeType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop() || '';
    const mimeTypes: Record<string, string> = {
      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
      // Videos
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'webm': 'video/webm',
      'mkv': 'video/x-matroska',
      'flv': 'video/x-flv',
      'wmv': 'video/x-ms-wmv',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  // Media Upload
  async uploadMedia(file: Buffer | Blob, filename: string): Promise<MediaItem> {
    console.log('📤 Uploading media file:', filename);

    const formData = new FormData();
    const mimeType = this.getMimeType(filename);

    // Create proper Blob with MIME type
    const blob = Buffer.isBuffer(file)
      ? new Blob([new Uint8Array(file)], { type: mimeType })
      : file;

    console.log(`📎 File details: ${filename}, MIME type: ${mimeType}, size: ${blob.size} bytes`);

    formData.append('file', blob, filename);

    const response = await fetch(`${LATE_API_BASE}/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload media: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Media uploaded successfully:', result._id);

    // Determine media type from filename or result
    const isVideo = !!filename.toLowerCase().match(/\.(mp4|mov|avi|webm|mkv)$/);

    return {
      mediaId: result._id,
      url: result.url,
      type: isVideo ? 'video' : 'image',
    };
  }

  async uploadMediaFromUrl(imageUrl: string): Promise<MediaItem> {
    console.log('📤 Uploading media from URL:', imageUrl);
    
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      const filename = imageUrl.split('/').pop() || 'image.jpg';
      
      const mediaItem = await this.uploadMedia(Buffer.from(buffer), filename);
      console.log('✅ Media uploaded successfully:', mediaItem.mediaId);
      
      return mediaItem;
    } catch (error: any) {
      console.error('❌ Failed to upload media from URL:', error.message);
      throw new Error(`Media upload failed: ${error.message}`);
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

export { LateClient, type LateProfile, type LateAccount, type LatePost, type CreatePostOptions, type MediaItem };
