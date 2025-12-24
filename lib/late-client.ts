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
    // Format mediaItems for Late.dev API
    // Late API expects: [{ url, type, thumbnail? }] - NOT just mediaIds
    const mediaItems = options.mediaItems?.map(item => ({
      url: item.url,
      type: item.type,
      ...(item.thumbnail && { thumbnail: item.thumbnail }),
    }));

    const body = {
      content: options.content,
      platforms: options.platforms,
      timezone: options.timezone || 'Europe/Amsterdam',
      publishNow: options.publishNow,
      isDraft: options.isDraft,
      ...(options.title && { title: options.title }),
      ...(options.tags && options.tags.length > 0 && { tags: options.tags }),
      ...(options.hashtags && options.hashtags.length > 0 && { hashtags: options.hashtags }),
      ...(options.scheduledFor && { scheduledFor: options.scheduledFor }),
      ...(mediaItems && mediaItems.length > 0 && { mediaItems }),
    };

    console.log('📤 Creating Late post with body:', JSON.stringify(body, null, 2));

    return this.request<LatePost>('/posts', {
      method: 'POST',
      body: JSON.stringify(body),
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

  // Media Upload using presigned URL flow
  async uploadMedia(file: Buffer | Blob, filename: string): Promise<MediaItem> {
    console.log('📤 Uploading media file:', filename);

    const mimeType = this.getMimeType(filename);

    // Create proper Blob with MIME type
    const blob = Buffer.isBuffer(file)
      ? new Blob([new Uint8Array(file)], { type: mimeType })
      : file;

    console.log(`📎 File details: ${filename}, MIME type: ${mimeType}, size: ${blob.size} bytes`);

    // Step 1: Request presigned URL
    console.log('🔄 Requesting presigned URL...');
    const presignResponse = await this.request<{
      uploadUrl: string;
      publicUrl: string;
      key: string;
      type: string;
    }>('/media/presign', {
      method: 'POST',
      body: JSON.stringify({
        filename,
        contentType: mimeType,
        size: blob.size,
      }),
    });

    console.log('✅ Presigned URL received:', {
      publicUrl: presignResponse.publicUrl,
      type: presignResponse.type,
    });

    // Step 2: Upload file to presigned URL
    console.log('🔄 Uploading file to presigned URL...');
    const uploadResponse = await fetch(presignResponse.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
      },
      body: blob,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Failed to upload to presigned URL: ${uploadResponse.status} - ${errorText}`);
    }

    console.log('✅ Media uploaded successfully to:', presignResponse.publicUrl);

    // Determine media type from response or filename
    const isVideo = presignResponse.type === 'video' ||
                    !!filename.toLowerCase().match(/\.(mp4|mov|avi|webm|mkv)$/);

    return {
      mediaId: presignResponse.key,
      url: presignResponse.publicUrl,
      type: isVideo ? 'video' : 'image',
    };
  }

  async uploadMediaFromUrl(imageUrl: string): Promise<MediaItem> {
    console.log('📤 Uploading media from URL:', imageUrl);
    
    try {
      console.log('📡 Fetching image from URL...');
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.error(`❌ Failed to fetch image: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      console.log('✅ Image fetched successfully, converting to buffer...');
      const buffer = await response.arrayBuffer();
      console.log(`📦 Buffer size: ${buffer.byteLength} bytes`);
      
      // Sanitize filename by removing query parameters
      const urlWithoutQuery = imageUrl.split('?')[0];
      const filename = urlWithoutQuery.split('/').pop() || 'image.jpg';
      console.log(`📝 Sanitized filename: ${filename}`);
      
      console.log('🔄 Calling uploadMedia...');
      const mediaItem = await this.uploadMedia(Buffer.from(buffer), filename);
      console.log('✅ Media uploaded successfully:', mediaItem.mediaId);
      
      return mediaItem;
    } catch (error: any) {
      console.error('❌ Failed to upload media from URL:', error.message);
      console.error('🔍 Error details:', error);
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
