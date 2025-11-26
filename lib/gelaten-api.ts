
/**
 * Gelaten.dev API Integration
 * Unified social media posting platform for LinkedIn, Facebook, Instagram, Twitter, YouTube
 */

interface GelatenAccount {
  id: string;
  platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'youtube';
  username: string;
  displayName: string;
  isConnected: boolean;
}

interface GelatenPostData {
  accountId: string;
  content: string;
  mediaUrl?: string;
  linkUrl?: string;
  scheduledFor?: Date;
}

interface GelatenPostResponse {
  id: string;
  platformPostId: string;
  status: 'published' | 'scheduled' | 'failed';
  publishedAt?: Date;
  error?: string;
}

interface GelatenEngagementData {
  likes: number;
  comments: number;
  shares: number;
  views?: number;
  clicks?: number;
}

/**
 * Get connected social media accounts for a given API key
 */
export async function getGelatenAccounts(apiKey: string): Promise<GelatenAccount[]> {
  try {
    const response = await fetch('https://api.gelaten.dev/v1/accounts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch accounts');
    }

    const data = await response.json();
    return data.accounts || [];
  } catch (error) {
    console.error('Error fetching Gelaten accounts:', error);
    throw error;
  }
}

/**
 * Publish or schedule a post to a social media platform
 */
export async function publishGelatenPost(
  apiKey: string,
  postData: GelatenPostData
): Promise<GelatenPostResponse> {
  try {
    const payload: any = {
      account_id: postData.accountId,
      content: postData.content,
    };

    if (postData.mediaUrl) {
      payload.media_url = postData.mediaUrl;
    }

    if (postData.linkUrl) {
      payload.link_url = postData.linkUrl;
    }

    if (postData.scheduledFor) {
      payload.scheduled_for = postData.scheduledFor.toISOString();
    }

    const response = await fetch('https://api.gelaten.dev/v1/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to publish post');
    }

    const data = await response.json();
    
    return {
      id: data.id,
      platformPostId: data.platform_post_id,
      status: data.status,
      publishedAt: data.published_at ? new Date(data.published_at) : undefined,
      error: data.error,
    };
  } catch (error) {
    console.error('Error publishing Gelaten post:', error);
    throw error;
  }
}

/**
 * Get engagement data for a published post
 */
export async function getGelatenPostEngagement(
  apiKey: string,
  postId: string
): Promise<GelatenEngagementData> {
  try {
    const response = await fetch(`https://api.gelaten.dev/v1/posts/${postId}/engagement`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch engagement data');
    }

    const data = await response.json();
    
    return {
      likes: data.likes || 0,
      comments: data.comments || 0,
      shares: data.shares || 0,
      views: data.views,
      clicks: data.clicks,
    };
  } catch (error) {
    console.error('Error fetching Gelaten engagement:', error);
    throw error;
  }
}

/**
 * Delete a scheduled post
 */
export async function deleteGelatenPost(
  apiKey: string,
  postId: string
): Promise<boolean> {
  try {
    const response = await fetch(`https://api.gelaten.dev/v1/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete post');
    }

    return true;
  } catch (error) {
    console.error('Error deleting Gelaten post:', error);
    throw error;
  }
}

/**
 * Validate Gelaten API key by attempting to fetch accounts
 */
export async function validateGelatenApiKey(apiKey: string): Promise<boolean> {
  try {
    await getGelatenAccounts(apiKey);
    return true;
  } catch (error) {
    return false;
  }
}
