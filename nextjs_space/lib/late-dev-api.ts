
/**
 * Late.dev API Client - Profile & Invite Based Integration
 * Uses centralized WritgoAI API key for all operations
 * Clients connect their own accounts via Connect API
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
  platform: string;
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

export interface ConnectResponse {
  authUrl: string;
  platform: string;
  profileId: string;
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
        color: '#FF9933',
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
 * Start OAuth connection for a platform using the Connect API
 * This is the correct way to connect accounts with custom redirect URL
 * 
 * Uses: GET /v1/connect/{platform}?profileId=XXX&redirect_url=YOUR_URL
 * Returns: { authUrl: "https://..." } - redirect user to this URL
 */
export async function startPlatformConnect(profileId: string, platform: string): Promise<ConnectResponse | null> {
  try {
    const apiKey = getCentralApiKey();
    
    const isLinkedIn = platform.toLowerCase() === 'linkedin';
    const logPrefix = isLinkedIn ? '[LinkedIn Connect]' : '[Late.dev Connect]';
    
    console.log(`${logPrefix} Starting OAuth connection for:`, platform, 'on profile:', profileId);
    
    // Create redirect URL to our own success page
    const baseUrl = process.env.NEXTAUTH_URL || 'https://writgoai.nl';
    const redirectUrl = `${baseUrl}/client-portal/social-connect-success?platform=${platform}`;
    
    console.log(`${logPrefix} Redirect URL:`, redirectUrl);
    
    // Build the Connect API URL with query parameters
    const connectUrl = new URL(`${LATE_DEV_API_BASE}/connect/${platform.toLowerCase()}`);
    connectUrl.searchParams.set('profileId', profileId);
    connectUrl.searchParams.set('redirect_url', redirectUrl);
    
    console.log(`${logPrefix} Connect API URL:`, connectUrl.toString());
    
    const response = await fetch(connectUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    console.log(`${logPrefix} Response status:`, response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${logPrefix} Failed to start platform connection`);
      console.error(`${logPrefix} Status:`, response.status, response.statusText);
      console.error(`${logPrefix} Error body:`, errorText);
      
      if (isLinkedIn) {
        console.error(`${logPrefix} LinkedIn-specifieke fout - controleer of LinkedIn is ingeschakeld in Late.dev dashboard`);
      }
      
      return null;
    }

    const data = await response.json();
    console.log(`${logPrefix} Connect response received`);
    console.log(`${logPrefix} Auth URL:`, data.authUrl);
    
    return {
      authUrl: data.authUrl,
      platform: platform.toLowerCase(),
      profileId: profileId,
    };
  } catch (error: any) {
    const isLinkedIn = platform.toLowerCase() === 'linkedin';
    const logPrefix = isLinkedIn ? '[LinkedIn Connect]' : '[Late.dev Connect]';
    
    console.error(`${logPrefix} Exception starting platform connection:`, error);
    console.error(`${logPrefix} Error message:`, error.message);
    
    return null;
  }
}

/**
 * Legacy function - now wraps startPlatformConnect for backwards compatibility
 * Returns a PlatformInvite-like object with inviteUrl set to authUrl
 */
export async function createPlatformInvite(profileId: string, platform: string): Promise<PlatformInvite | null> {
  const connectResult = await startPlatformConnect(profileId, platform);
  
  if (!connectResult) {
    return null;
  }
  
  // Return a PlatformInvite-compatible object
  return {
    _id: `connect_${Date.now()}`,
    token: '',
    profileId: connectResult.profileId,
    platform: connectResult.platform,
    inviteUrl: connectResult.authUrl,
    isUsed: false,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    createdAt: new Date().toISOString(),
  };
}

/**
 * Get platform invites for a profile (legacy endpoint)
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
 */
export async function publishToLateDev(params: {
  accountIds: string[];
  platforms: Array<{ platform: string; accountId: string }>;
  content: string;
  mediaItems?: Array<{ type: string; url: string }>;
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
