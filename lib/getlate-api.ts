
/**
 * Getlate.dev API Client
 * 
 * Unified social media scheduling API for 10 platforms:
 * X (Twitter), Instagram, TikTok, LinkedIn, Facebook, YouTube, 
 * Threads, Reddit, Pinterest, Bluesky
 */

const GETLATE_API_URL = 'https://getlate.dev/api/v1';
const API_KEY = process.env.GETLATE_API_KEY || process.env.LATE_DEV_API_KEY;

if (!API_KEY) {
  console.warn('⚠️ GETLATE_API_KEY niet gevonden in environment variables');
}

interface GetlateProfile {
  id: string;
  name: string;
  createdAt: string;
  accountsCount: number;
}

interface GetlateAccount {
  id: string;
  platform: string; // 'twitter', 'instagram', 'linkedin', 'facebook', 'tiktok', 'youtube', 'threads', 'reddit', 'pinterest', 'bluesky'
  username?: string;
  displayName?: string;
  profileUrl?: string;
  avatar?: string;
  isActive: boolean;
}

interface GetlatePost {
  id: string;
  content: string;
  platforms: Array<{
    platform: string;
    accountId: string;
    platformSpecificData?: Record<string, any>;
  }>;
  mediaItems?: Array<{
    type: 'image' | 'video';
    url: string;
  }>;
  scheduledFor?: string; // ISO 8601 date string
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  createdAt: string;
  publishedAt?: string;
}

interface CreatePostPayload {
  content: string;
  platforms: Array<{
    platform: string;
    accountId: string;
    platformSpecificData?: Record<string, any>;
  }>;
  mediaItems?: Array<{
    type: 'image' | 'video';
    url: string;
  }>;
  scheduledFor?: string; // ISO 8601 date string, optional for immediate posting
  profileId?: string; // Profile ID for multi-profile setups
}

/**
 * Maak HTTP request naar Getlate API
 */
async function makeRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<any> {
  if (!API_KEY) {
    throw new Error('Getlate API key niet geconfigureerd');
  }

  const url = `${GETLATE_API_URL}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || errorData.message || `Getlate API error: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error: any) {
    console.error('Getlate API Error:', error);
    throw error;
  }
}

/**
 * Haal alle profiles op
 */
export async function listProfiles(): Promise<GetlateProfile[]> {
  const response = await makeRequest('/profiles');
  return response.profiles || [];
}

/**
 * Maak een nieuw profile aan
 */
export async function createProfile(name: string): Promise<GetlateProfile> {
  const response = await makeRequest('/profiles', 'POST', { name });
  return response.profile;
}

/**
 * Haal profile details op
 */
export async function getProfile(profileId: string): Promise<GetlateProfile> {
  const response = await makeRequest(`/profiles/${profileId}`);
  return response.profile;
}

/**
 * Haal alle connected accounts op voor een profile
 */
export async function listAccounts(profileId?: string): Promise<GetlateAccount[]> {
  const endpoint = profileId ? `/profiles/${profileId}/accounts` : '/accounts';
  const response = await makeRequest(endpoint);
  return response.accounts || [];
}

/**
 * Haal een specifiek account op
 */
export async function getAccount(accountId: string): Promise<GetlateAccount> {
  const response = await makeRequest(`/accounts/${accountId}`);
  return response.account;
}

/**
 * Maak een nieuwe post aan (direct publiceren of inplannen)
 */
export async function createPost(postData: CreatePostPayload): Promise<GetlatePost> {
  const response = await makeRequest('/posts', 'POST', postData);
  return response.post;
}

/**
 * Schedule een post voor later
 */
export async function schedulePost(
  content: string,
  platforms: Array<{ platform: string; accountId: string; platformSpecificData?: any }>,
  scheduledFor: Date,
  mediaItems?: Array<{ type: 'image' | 'video'; url: string }>,
  profileId?: string
): Promise<GetlatePost> {
  return createPost({
    content,
    platforms,
    scheduledFor: scheduledFor.toISOString(),
    mediaItems,
    profileId,
  });
}

/**
 * Publiceer een post direct (geen scheduling)
 */
export async function publishPost(
  content: string,
  platforms: Array<{ platform: string; accountId: string; platformSpecificData?: any }>,
  mediaItems?: Array<{ type: 'image' | 'video'; url: string }>,
  profileId?: string
): Promise<GetlatePost> {
  return createPost({
    content,
    platforms,
    mediaItems,
    profileId,
    // No scheduledFor = immediate publishing
  });
}

/**
 * Haal een specifieke post op
 */
export async function getPost(postId: string): Promise<GetlatePost> {
  const response = await makeRequest(`/posts/${postId}`);
  return response.post;
}

/**
 * Haal alle posts op (met optionele filtering)
 */
export async function listPosts(filters?: {
  profileId?: string;
  status?: 'draft' | 'scheduled' | 'published' | 'failed';
  platform?: string;
  limit?: number;
}): Promise<GetlatePost[]> {
  const params = new URLSearchParams();
  
  if (filters?.profileId) params.append('profileId', filters.profileId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.platform) params.append('platform', filters.platform);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  
  const endpoint = `/posts${params.toString() ? '?' + params.toString() : ''}`;
  const response = await makeRequest(endpoint);
  return response.posts || [];
}

/**
 * Verwijder een scheduled post
 */
export async function deletePost(postId: string): Promise<void> {
  await makeRequest(`/posts/${postId}`, 'DELETE');
}

/**
 * Update een scheduled post
 */
export async function updatePost(
  postId: string,
  updates: Partial<CreatePostPayload>
): Promise<GetlatePost> {
  const response = await makeRequest(`/posts/${postId}`, 'PUT', updates);
  return response.post;
}

/**
 * Test de API connectie
 */
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    await listProfiles();
    return {
      success: true,
      message: 'Getlate API verbinding succesvol',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Getlate API verbinding gefaald',
    };
  }
}

/**
 * Platform-specifieke helpers
 */

// Reddit: Post naar een subreddit
export async function postToReddit(
  accountId: string,
  subreddit: string,
  content: string,
  scheduledFor?: Date
): Promise<GetlatePost> {
  return createPost({
    content,
    platforms: [{
      platform: 'reddit',
      accountId,
      platformSpecificData: {
        subreddit,
      },
    }],
    scheduledFor: scheduledFor?.toISOString(),
  });
}

// Pinterest: Post een pin naar een board
export async function postToPinterest(
  accountId: string,
  boardId: string,
  content: string,
  imageUrl: string,
  scheduledFor?: Date
): Promise<GetlatePost> {
  return createPost({
    content,
    platforms: [{
      platform: 'pinterest',
      accountId,
      platformSpecificData: {
        boardId,
      },
    }],
    mediaItems: [{
      type: 'image',
      url: imageUrl,
    }],
    scheduledFor: scheduledFor?.toISOString(),
  });
}

// Instagram: Post met content type (post, story, reel)
export async function postToInstagram(
  accountId: string,
  content: string,
  mediaUrl: string,
  contentType: 'post' | 'story' | 'reel' = 'post',
  scheduledFor?: Date
): Promise<GetlatePost> {
  return createPost({
    content,
    platforms: [{
      platform: 'instagram',
      accountId,
      platformSpecificData: {
        contentType,
      },
    }],
    mediaItems: [{
      type: contentType === 'reel' ? 'video' : 'image',
      url: mediaUrl,
    }],
    scheduledFor: scheduledFor?.toISOString(),
  });
}

// Helper: Converteer platform naam naar Getlate platform ID
export function normalizePlatformName(platform: string): string {
  const platformMap: Record<string, string> = {
    'twitter': 'twitter',
    'x': 'twitter',
    'instagram': 'instagram',
    'facebook': 'facebook',
    'linkedin': 'linkedin',
    'tiktok': 'tiktok',
    'youtube': 'youtube',
    'threads': 'threads',
    'reddit': 'reddit',
    'pinterest': 'pinterest',
    'bluesky': 'bluesky',
  };
  
  return platformMap[platform.toLowerCase()] || platform;
}

// Helper: Haal platform emoji op
export function getPlatformEmoji(platform: string): string {
  const emojiMap: Record<string, string> = {
    'twitter': '𝕏',
    'instagram': '📸',
    'facebook': '👤',
    'linkedin': '💼',
    'tiktok': '🎵',
    'youtube': '📹',
    'threads': '🧵',
    'reddit': '🤖',
    'pinterest': '📌',
    'bluesky': '🦋',
  };
  
  return emojiMap[normalizePlatformName(platform)] || '📱';
}
