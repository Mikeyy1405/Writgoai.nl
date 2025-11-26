
// Late.dev API helper functions

import fs from 'fs';
import path from 'path';

interface LateDevAccount {
  id: string;
  accountId: string;
  platform: string;
  platformAccountId: string;
  username?: string;
  connected: boolean;
}

// Get Late.dev API key from secrets file (shared Writgo API key)
export function getLateDevApiKey(): string | null {
  try {
    const secretsPath = path.join(process.env.HOME || '/home/ubuntu', '.config', 'abacusai_auth_secrets.json');
    if (fs.existsSync(secretsPath)) {
      const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf-8'));
      return secrets?.['late.dev']?.secrets?.api_key?.value || null;
    }
  } catch (error) {
    console.error('Failed to load Late.dev API key:', error);
  }
  
  // Fallback to environment variable
  return process.env.LATE_DEV_API_KEY || null;
}

// Get or create a profile for a client
export async function getOrCreateProfile(clientEmail: string): Promise<string> {
  const apiKey = getLateDevApiKey();
  if (!apiKey) throw new Error('Late.dev API key not configured');
  
  // This is a simplified version - in reality you'd need to implement
  // profile creation logic with Late.dev API
  return `profile_${clientEmail}`;
}

// Get all accounts for a profile
export async function getProfileAccounts(profileId: string) {
  const apiKey = getLateDevApiKey();
  if (!apiKey) return [];
  
  try {
    const response = await fetch(`https://api.late.dev/api/profiles/${profileId}/accounts`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) return [];
    
    return await response.json();
  } catch (error) {
    console.error('Error getting profile accounts:', error);
    return [];
  }
}

// Create a platform invite URL
export async function createPlatformInvite(platform: string, profileId: string) {
  const apiKey = getLateDevApiKey();
  if (!apiKey) throw new Error('Late.dev API key not configured');
  
  // Generate callback URL that redirects directly back to our app
  const baseUrl = process.env.NEXTAUTH_URL || 'https://WritgoAI.nl';
  const callbackUrl = `${baseUrl}/client-portal/social-media-studio?connected=${platform}`;
  
  try {
    const response = await fetch('https://api.late.dev/api/invites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        profileId,
        platform,
        redirectUrl: callbackUrl, // Direct redirect back to our app
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Late.dev API error:', errorText);
      throw new Error(`Failed to create invite: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    return { 
      inviteUrl: result.inviteUrl || result.url || result.invite_url, 
      inviteId: result.id,
      expiresAt: result.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  } catch (error) {
    console.error('Error creating platform invite:', error);
    throw error;
  }
}

// Disconnect an account
export async function disconnectAccount(accountId: string) {
  const apiKey = getLateDevApiKey();
  if (!apiKey) throw new Error('Late.dev API key not configured');
  
  try {
    const response = await fetch(`https://api.late.dev/api/accounts/${accountId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to disconnect account: ${response.status}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error disconnecting account:', error);
    throw error;
  }
}

// Create a post
export async function createPost(postData: any) {
  const { text, mediaUrls, accountIds } = postData;
  const result = await publishToLatedev(text, mediaUrls || [], accountIds);
  
  if (!result.success) {
    throw new Error(result.error || 'Post creation failed');
  }
  
  return {
    _id: result.lateDevId,
    platforms: accountIds,
    success: true
  };
}

// Upload media from URL
export async function uploadMediaFromUrl(url: string) {
  const apiKey = getLateDevApiKey();
  if (!apiKey) throw new Error('Late.dev API key not configured');
  
  try {
    const response = await fetch('https://api.late.dev/api/media/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ url })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload media: ${response.status}`);
    }
    
    const result = await response.json();
    return { 
      mediaUrl: result.url,
      mediaId: result.id,
      type: result.type || 'image',
      url: result.url
    };
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
}

// Publish post to social media via Late.dev
export async function publishToLatedev(
  text: string,
  mediaUrls: string[],
  accountIds: string[]
): Promise<{ success: boolean; lateDevId?: string; error?: string }> {
  try {
    const apiKey = getLateDevApiKey();
    
    if (!apiKey) {
      throw new Error('Late.dev API key not configured');
    }
    
    const postData = {
      accountIds,
      text,
      mediaUrls
    };
    
    const response = await fetch('https://api.late.dev/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(postData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Late.dev API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      lateDevId: result.id
    };
    
  } catch (error) {
    console.error('Late.dev publish error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get Late.dev account by ID
export async function getLateDevAccount(accountId: string) {
  try {
    const apiKey = getLateDevApiKey();
    
    if (!apiKey) {
      throw new Error('Late.dev API key not configured');
    }
    
    const response = await fetch(`https://api.late.dev/api/accounts/${accountId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get account: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting Late.dev account:', error);
    return null;
  }
}
