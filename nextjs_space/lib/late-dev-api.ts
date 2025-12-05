
/**
 * Late.dev API Client - Profile & Invite Based Integration
 * Uses centralized WritgoAI API key for all operations
 * Clients connect their own accounts via Platform Invites
 * Documentation: https://docs.getlate.dev/
 */

const LATE_DEV_API_BASE = 'https://getlate.dev/api/v1';

// Get centralized API key from environment
const getCentralApiKey = (): string => {
  const apiKey = process.env.LATE_DEV_API_KEY;
  if (!apiKey) {
    throw new Error('LATE_DEV_API_KEY not configured in environment');
  }
  return apiKey;
};

export interface LateDevAccount {
  _id: string;
  platform: string; // 'linkedin', 'facebook', 'instagram', 'twitter', 'youtube', 'tiktok', 'pinterest', 'reddit'
  username?: string;
  profileId?: string;
}

export interface LateDevProfile {
  _id: string;
  name: string;
  description?: string;
  color?: string;
  isDefault?: boolean;
  createdAt?: string;
}

export interface PlatformInvite {
  _id: string;
  token: string;
  profileId: string;
  platform: string;
  inviteUrl: string;
  isUsed: boolean;
  expiresAt: string;
  createdAt: string;
}

/**
 * Create a Late.dev Profile for a project (one profile per project)
 */
export async function createLateDevProfile(projectName: string, projectId: string): Promise<{ profileId: string; name: string } | null> {
  try {
    const apiKey = getCentralApiKey();
    const profileName = `${projectName} (${projectId.slice(-6)})`;
    
    console.log('[Late.dev] Creating profile for project:', profileName);
    
    const response = await fetch(`${LATE_DEV_API_BASE}/profiles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: profileName,
        description: `WritgoAI Project: ${projectName}`,
        color: '#FF9933', // WritgoAI orange
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Late.dev] Failed to create profile:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('[Late.dev] Profile created successfully:', data.profile._id);
    
    return {
      profileId: data.profile._id,
      name: data.profile.name,
    };
  } catch (error: any) {
    console.error('[Late.dev] Error creating profile:', error);
    return null;
  }
}

/**
 * Get all profiles
 */
export async function getLateDevProfiles(): Promise<LateDevProfile[]> {
  try {
    const apiKey = getCentralApiKey();
    const response = await fetch(`${LATE_DEV_API_BASE}/profiles`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.profiles || [];
  } catch (error) {
    console.error('[Late.dev] Error fetching profiles:', error);
    return [];
  }
}

/**
 * Create Platform Invite for client to connect their account
 */
export async function createPlatformInvite(profileId: string, platform: string): Promise<PlatformInvite | null> {
  try {
    const apiKey = getCentralApiKey();
    
    console.log('[Late.dev] Creating platform invite for:', platform, 'on profile:', profileId);
    
    const response = await fetch(`${LATE_DEV_API_BASE}/platform-invites`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profileId,
        platform, // instagram, facebook, linkedin, twitter, tiktok, youtube, pinterest, reddit, bluesky, threads
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Late.dev] Failed to create platform invite:', response.status, errorText);
      console.error('[Late.dev] Payload was:', { profileId, platform });
      return null;
    }

    const data = await response.json();
    console.log('[Late.dev] Platform invite created:', platform, '-> URL:', data.invite?.inviteUrl);
    return data.invite;
  } catch (error: any) {
    console.error('[Late.dev] Error creating platform invite:', error);
    return null;
  }
}

/**
 * Get platform invites for a profile
 */
export async function getPlatformInvites(profileId?: string): Promise<PlatformInvite[]> {
  try {
    const apiKey = getCentralApiKey();
    const url = profileId 
      ? `${LATE_DEV_API_BASE}/platform-invites?profileId=${profileId}`
      : `${LATE_DEV_API_BASE}/platform-invites`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.invites || [];
  } catch (error) {
    console.error('[Late.dev] Error fetching platform invites:', error);
    return [];
  }
}

/**
 * Fetch connected accounts for a specific profile
 */
export async function getLateDevAccountsByProfile(profileId: string): Promise<LateDevAccount[]> {
  try {
    const apiKey = getCentralApiKey();
    const response = await fetch(`${LATE_DEV_API_BASE}/accounts?profileId=${profileId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Late.dev] Error fetching accounts:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    console.log('[Late.dev] Fetched accounts for profile', profileId, ':', data.accounts?.length || 0);
    return data.accounts || [];
  } catch (error: any) {
    console.error('[Late.dev] Error fetching accounts:', error);
    return [];
  }
}

/**
 * Validate Late.dev API key (central key)
 */
export async function validateLateDevApiKey(): Promise<boolean> {
  try {
    const apiKey = getCentralApiKey();
    const response = await fetch(`${LATE_DEV_API_BASE}/profiles`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('[Late.dev] Error validating API key:', error);
    return false;
  }
}

/**
 * Publish a post to Late.dev (using central key)
 * Updated to use new Late.dev API format with platforms array
 */
export async function publishToLateDev(params: {
  accountIds: string[]; // Array of Late.dev account IDs
  platforms: Array<{ platform: string; accountId: string }>; // Platform-specific data
  content: string;
  mediaItems?: Array<{ type: string; url: string }>; // AI-generated images
  scheduledFor?: Date;
  timezone?: string;
  publishNow?: boolean;
}): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const apiKey = getCentralApiKey();
    
    const payload: any = {
      content: params.content,
      platforms: params.platforms,
      publishNow: params.publishNow || false,
      isDraft: false,
    };

    if (params.mediaItems && params.mediaItems.length > 0) {
      payload.mediaItems = params.mediaItems;
    }

    if (params.scheduledFor && !params.publishNow) {
      payload.scheduledFor = params.scheduledFor.toISOString();
      payload.timezone = params.timezone || 'Europe/Amsterdam';
    }

    const response = await fetch(`${LATE_DEV_API_BASE}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Late.dev API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      postId: data.post?._id || data._id,
    };
  } catch (error: any) {
    console.error('[Late.dev] Error publishing post:', error);
    return {
      success: false,
      error: error.message,
    };
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
    bluesky: 'Bluesky',
    threads: 'Threads',
  };
  return names[platform.toLowerCase()] || platform;
}

/**
 * Get platform icon/color
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
    bluesky: '#0085FF',
    threads: '#000000',
  };
  return colors[platform.toLowerCase()] || '#6B7280';
}
