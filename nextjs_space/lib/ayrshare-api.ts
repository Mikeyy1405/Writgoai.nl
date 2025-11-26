
/**
 * Ayrshare API Client
 * Social media publishing via Ayrshare.com
 * Documentation: https://www.ayrshare.com/docs/introduction
 */

const AYRSHARE_API_BASE = 'https://app.ayrshare.com/api';

// Get centralized API key from environment
const getApiKey = (): string => {
  const apiKey = process.env.AYRSHARE_API_KEY;
  if (!apiKey) {
    throw new Error('AYRSHARE_API_KEY not configured in environment');
  }
  return apiKey;
};

export interface AyrshareProfile {
  profileKey: string;
  title: string;
  createdAt: string;
}

export interface AyrshareSocialAccount {
  platform: string; // 'facebook', 'instagram', 'linkedin', 'twitter', 'youtube', etc.
  username?: string;
  displayName?: string;
  id: string;
}

export interface AyrsharePostResponse {
  id: string;
  status: string;
  postIds?: {
    [platform: string]: string;
  };
  errors?: any[];
}

export interface AyrshareError {
  error: string;
  message: string;
  code?: number;
  requiresBusinessPlan?: boolean;
}

/**
 * Create a Profile (one per project/client)
 * Each profile can have multiple social accounts connected
 */
export async function createAyrshareProfile(profileTitle: string): Promise<{ profileKey: string; error?: AyrshareError } | null> {
  try {
    const apiKey = getApiKey();
    
    console.log('[Ayrshare] Creating profile:', profileTitle);
    
    const response = await fetch(`${AYRSHARE_API_BASE}/profiles/profile`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: profileTitle,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Ayrshare] Failed to create profile:', response.status, errorText);
      
      // Try to parse error response
      let errorData: any = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }

      // Check for Business Plan requirement error
      if (response.status === 403 && (errorData.code === 167 || errorData.message?.includes('Business Plan'))) {
        console.error('[Ayrshare] Business Plan required for profile creation');
        return {
          profileKey: '',
          error: {
            error: 'business_plan_required',
            message: 'Creating multiple profiles requires an Ayrshare Business Plan. Please upgrade your Ayrshare account or use a single profile for all projects.',
            code: errorData.code,
            requiresBusinessPlan: true,
          },
        };
      }

      return {
        profileKey: '',
        error: {
          error: 'profile_creation_failed',
          message: errorData.message || 'Failed to create Ayrshare profile',
          code: errorData.code,
        },
      };
    }

    const data = await response.json();
    console.log('[Ayrshare] Profile created:', data.profileKey);
    
    return {
      profileKey: data.profileKey,
    };
  } catch (error: any) {
    console.error('[Ayrshare] Error creating profile:', error);
    return {
      profileKey: '',
      error: {
        error: 'unexpected_error',
        message: error.message || 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Delete a profile
 */
export async function deleteAyrshareProfile(profileKey: string): Promise<boolean> {
  try {
    const apiKey = getApiKey();
    
    const response = await fetch(`${AYRSHARE_API_BASE}/profiles/profile/${profileKey}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('[Ayrshare] Error deleting profile:', error);
    return false;
  }
}

/**
 * Generate JWT link for client to connect their social accounts
 * This link expires after 24 hours
 */
export async function generateAyrshareJWTLink(
  profileKey: string,
  domain?: string
): Promise<{ url: string } | null> {
  try {
    const apiKey = getApiKey();
    
    console.log('[Ayrshare] Generating JWT link for profile:', profileKey);
    
    const response = await fetch(`${AYRSHARE_API_BASE}/profiles/generateJWT`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profileKey,
        domain: domain || 'writgoai.nl',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Ayrshare] Failed to generate JWT:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('[Ayrshare] JWT link generated');
    
    return {
      url: data.url,
    };
  } catch (error: any) {
    console.error('[Ayrshare] Error generating JWT:', error);
    return null;
  }
}

/**
 * Get all social accounts connected to a profile
 */
export async function getAyrshareSocialAccounts(profileKey: string): Promise<AyrshareSocialAccount[]> {
  try {
    const apiKey = getApiKey();
    
    const response = await fetch(`${AYRSHARE_API_BASE}/profiles/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Profile-Key': profileKey,
      },
    });

    if (!response.ok) {
      console.error('[Ayrshare] Failed to fetch accounts:', response.status);
      return [];
    }

    const data = await response.json();
    
    // Extract connected platforms from response
    const accounts: AyrshareSocialAccount[] = [];
    
    if (data.activeSocialAccounts) {
      for (const platform of data.activeSocialAccounts) {
        accounts.push({
          platform: platform.toLowerCase(),
          username: data[platform]?.username || data[platform]?.name,
          displayName: data[platform]?.displayName || data[platform]?.name,
          id: data[platform]?.id || platform,
        });
      }
    }
    
    console.log('[Ayrshare] Found accounts:', accounts.length);
    return accounts;
  } catch (error: any) {
    console.error('[Ayrshare] Error fetching accounts:', error);
    return [];
  }
}

/**
 * Publish a post to social media
 * Supports multiple platforms in one call
 */
export async function publishAyrsharePost(params: {
  profileKey: string;
  platforms: string[]; // ['facebook', 'instagram', 'linkedin', 'twitter']
  post: string;
  mediaUrls?: string[];
  scheduleDate?: Date;
  shorten?: boolean;
}): Promise<AyrsharePostResponse | null> {
  try {
    const apiKey = getApiKey();
    
    const payload: any = {
      post: params.post,
      platforms: params.platforms,
    };

    if (params.mediaUrls && params.mediaUrls.length > 0) {
      payload.mediaUrls = params.mediaUrls;
    }

    if (params.scheduleDate) {
      // Ayrshare expects ISO 8601 format in UTC
      payload.scheduleDate = params.scheduleDate.toISOString();
    }

    if (params.shorten !== undefined) {
      payload.shorten = params.shorten;
    }

    console.log('[Ayrshare] Publishing post to:', params.platforms.join(', '));
    
    const response = await fetch(`${AYRSHARE_API_BASE}/post`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Profile-Key': params.profileKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Ayrshare] Failed to publish post:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('[Ayrshare] Post published:', data.id);
    
    return {
      id: data.id,
      status: data.status,
      postIds: data.postIds || {},
      errors: data.errors || [],
    };
  } catch (error: any) {
    console.error('[Ayrshare] Error publishing post:', error);
    return null;
  }
}

/**
 * Get post analytics/status
 */
export async function getAyrsharePostAnalytics(
  profileKey: string,
  postId: string
): Promise<any | null> {
  try {
    const apiKey = getApiKey();
    
    const response = await fetch(`${AYRSHARE_API_BASE}/post/${postId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Profile-Key': profileKey,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Ayrshare] Error fetching analytics:', error);
    return null;
  }
}

/**
 * Delete a scheduled post
 */
export async function deleteAyrsharePost(
  profileKey: string,
  postId: string
): Promise<boolean> {
  try {
    const apiKey = getApiKey();
    
    const response = await fetch(`${AYRSHARE_API_BASE}/delete/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Profile-Key': profileKey,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('[Ayrshare] Error deleting post:', error);
    return false;
  }
}

/**
 * Validate API key by attempting to fetch profiles
 */
export async function validateAyrshareApiKey(): Promise<boolean> {
  try {
    const apiKey = getApiKey();
    const response = await fetch(`${AYRSHARE_API_BASE}/profiles`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('[Ayrshare] Error validating API key:', error);
    return false;
  }
}

/**
 * Get platform display name
 */
export function getPlatformDisplayName(platform: string): string {
  const names: Record<string, string> = {
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    instagram: 'Instagram',
    twitter: 'X (Twitter)',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    pinterest: 'Pinterest',
    reddit: 'Reddit',
    telegram: 'Telegram',
  };
  return names[platform.toLowerCase()] || platform;
}

/**
 * Get platform color/icon
 */
export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    linkedin: '#0A66C2',
    facebook: '#1877F2',
    instagram: '#E4405F',
    twitter: '#000000',
    youtube: '#FF0000',
    tiktok: '#000000',
    pinterest: '#E60023',
    reddit: '#FF4500',
    telegram: '#0088CC',
  };
  return colors[platform.toLowerCase()] || '#6B7280';
}
