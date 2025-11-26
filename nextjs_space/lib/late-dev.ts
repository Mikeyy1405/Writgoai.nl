
/**
 * Late.dev API integration
 * Unified social media posting API
 */

const LATE_DEV_API_KEY = process.env.LATE_DEV_API_KEY;
const LATE_DEV_API_URL = 'https://api.getlate.dev/v1';

interface LateDevInviteResponse {
  id: string;
  url: string;
  expiresAt: string;
  scope: string;
}

interface LateDevAccount {
  id: string;
  platform: string;
  username?: string;
  avatar?: string;
  connected: boolean;
}

interface LateDevPostRequest {
  profileIds: string[];
  text?: string;
  media?: {
    url: string;
    type: 'image' | 'video';
  }[];
  scheduledAt?: string;
}

interface LateDevPostResponse {
  id: string;
  status: string;
  posts: {
    platform: string;
    status: string;
    url?: string;
    error?: string;
  }[];
}

/**
 * Create an invite URL for a client to connect their social media accounts
 */
export async function createLateDevInvite(clientId: string): Promise<LateDevInviteResponse> {
  const response = await fetch(`${LATE_DEV_API_URL}/invite/tokens`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LATE_DEV_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      scope: 'all', // Allow connecting all available platforms
      externalId: clientId, // Link to our client ID
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Late.dev invite creation failed: ${error}`);
  }

  return response.json();
}

/**
 * Get all connected accounts from Late.dev
 */
export async function getLateDevAccounts(): Promise<LateDevAccount[]> {
  const response = await fetch(`${LATE_DEV_API_URL}/profiles`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${LATE_DEV_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Late.dev accounts fetch failed: ${error}`);
  }

  return response.json();
}

/**
 * Create a post via Late.dev to multiple platforms
 */
export async function createLateDevPost(
  postData: LateDevPostRequest
): Promise<LateDevPostResponse> {
  const response = await fetch(`${LATE_DEV_API_URL}/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LATE_DEV_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Late.dev post creation failed: ${error}`);
  }

  return response.json();
}

/**
 * Delete a connected account from Late.dev
 */
export async function disconnectLateDevAccount(profileId: string): Promise<void> {
  const response = await fetch(`${LATE_DEV_API_URL}/profiles/${profileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${LATE_DEV_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Late.dev disconnect failed: ${error}`);
  }
}

/**
 * Get usage stats from Late.dev
 */
export async function getLateDevUsageStats() {
  const response = await fetch(`${LATE_DEV_API_URL}/usage-stats`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${LATE_DEV_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Late.dev usage stats fetch failed: ${error}`);
  }

  return response.json();
}
