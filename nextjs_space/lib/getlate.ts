
/**
 * GetLate.dev API Integration Library
 * Unified social media posting API
 */

const GETLATE_API_URL = 'https://getlate.dev/api/v1';
const GETLATE_API_KEY = process.env.LATE_DEV_API_KEY;

if (!GETLATE_API_KEY) {
  console.warn('⚠️ LATE_DEV_API_KEY not found in environment');
}

interface GetLatePost {
  content: string;
  platforms: string[];
  scheduledAt?: string;
  mediaItems?: Array<{
    url: string;
    type: 'image' | 'video';
  }>;
  platformData?: {
    reddit?: { subreddit: string };
    pinterest?: { boardId: string };
  };
}

interface GetLateInvite {
  scope: 'profiles' | 'team';
  profileIds?: string[];
}

/**
 * Create an invite token for connecting social media accounts
 */
export async function createInviteToken(data: GetLateInvite) {
  const response = await fetch(`${GETLATE_API_URL}/invite/tokens`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GETLATE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`GetLate API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a platform-specific invite
 */
export async function createPlatformInvite(platform: string, profileId: string) {
  const response = await fetch(`${GETLATE_API_URL}/platform-invites`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GETLATE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      platform,
      profileId,
    }),
  });

  if (!response.ok) {
    throw new Error(`GetLate API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get connected accounts for a profile
 */
export async function getAccounts() {
  const response = await fetch(`${GETLATE_API_URL}/accounts`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${GETLATE_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`GetLate API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Schedule or publish a post
 */
export async function createPost(postData: GetLatePost) {
  const response = await fetch(`${GETLATE_API_URL}/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GETLATE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `GetLate API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get usage statistics
 */
export async function getUsageStats() {
  const response = await fetch(`${GETLATE_API_URL}/usage-stats`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${GETLATE_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`GetLate API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get user information
 */
export async function getUsers() {
  const response = await fetch(`${GETLATE_API_URL}/users`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${GETLATE_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`GetLate API error: ${response.statusText}`);
  }

  return response.json();
}

export default {
  createInviteToken,
  createPlatformInvite,
  getAccounts,
  createPost,
  getUsageStats,
  getUsers,
};
