/**
 * Enhanced GetLate.dev API Integration met Error Handling en Retry Logic
 * Voor robuuste social media posting
 */

const GETLATE_API_URL = 'https://getlate.dev/api/v1';
const GETLATE_API_KEY = process.env.LATE_DEV_API_KEY || process.env.GETLATE_API_KEY;

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

if (!GETLATE_API_KEY) {
  console.warn('⚠️ GetLate API key niet gevonden. Set LATE_DEV_API_KEY of GETLATE_API_KEY in .env');
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

interface PostResult {
  success: boolean;
  id?: string;
  postId?: string;
  message?: string;
  error?: string;
  attempts?: number;
  fallbackToManual?: boolean;
}

/**
 * Sleep functie voor retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check of GetLate is geconfigureerd
 */
export function isGetLateConfigured(): boolean {
  return !!GETLATE_API_KEY;
}

/**
 * Validate GetLate API key
 */
async function validateApiKey(): Promise<{ valid: boolean; error?: string }> {
  if (!GETLATE_API_KEY) {
    return { valid: false, error: 'GetLate API key niet geconfigureerd' };
  }

  try {
    // Test API key by fetching user info
    const response = await fetch(`${GETLATE_API_URL}/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GETLATE_API_KEY}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { valid: false, error: 'Ongeldige API key' };
      }
      return { valid: false, error: `API error: ${response.statusText}` };
    }

    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

/**
 * Create post met retry logic
 */
export async function createPostEnhanced(postData: GetLatePost): Promise<PostResult> {
  // Check if configured
  if (!isGetLateConfigured()) {
    console.error('[GetLate] API niet geconfigureerd');
    return {
      success: false,
      error: 'GetLate API niet geconfigureerd',
      fallbackToManual: true,
      attempts: 0,
    };
  }

  // Validate post data
  if (!postData.content) {
    return {
      success: false,
      error: 'Content is verplicht',
      attempts: 0,
    };
  }

  if (!postData.platforms || postData.platforms.length === 0) {
    return {
      success: false,
      error: 'Minimaal 1 platform is verplicht',
      attempts: 0,
    };
  }

  let lastError: Error | null = null;
  let attempt = 0;

  // Retry loop
  for (attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[GetLate] Poging ${attempt}/${MAX_RETRIES} voor platforms: ${postData.platforms.join(', ')}`);

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
        const errorMessage = errorData.message || errorData.error || response.statusText;
        
        // Check for specific error types
        if (response.status === 401) {
          throw new Error('Ongeldige API key - vernieuw authenticatie');
        } else if (response.status === 429) {
          throw new Error('Rate limit bereikt - probeer later opnieuw');
        } else if (response.status === 400) {
          // Bad request - don't retry
          console.error('[GetLate] Bad request:', errorMessage);
          return {
            success: false,
            error: `GetLate API fout: ${errorMessage}`,
            attempts: attempt,
            fallbackToManual: true,
          };
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('[GetLate] ✅ Post succesvol aangemaakt:', result.id || result.postId);

      return {
        success: true,
        id: result.id,
        postId: result.postId || result.id,
        message: postData.scheduledAt ? 'Post ingepland' : 'Post gepubliceerd',
        attempts: attempt,
      };

    } catch (error: any) {
      lastError = error;
      console.error(`[GetLate] ❌ Poging ${attempt} gefaald:`, error.message);

      // If this is not the last attempt, wait before retrying
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY * attempt; // Exponential backoff
        console.log(`[GetLate] ⏳ Wachten ${delay}ms voor nieuwe poging...`);
        await sleep(delay);
      }
    }
  }

  // All retries failed
  console.error(`[GetLate] ❌ Alle ${MAX_RETRIES} pogingen gefaald`);
  return {
    success: false,
    error: lastError?.message || 'GetLate publicatie gefaald na meerdere pogingen',
    attempts: attempt,
    fallbackToManual: true,
  };
}

/**
 * Create post met graceful degradation - returneert altijd success met fallback info
 */
export async function createPostWithFallback(postData: GetLatePost): Promise<PostResult> {
  const result = await createPostEnhanced(postData);
  
  if (result.success) {
    return result;
  }

  // If GetLate fails, return success but with fallback flag
  console.log('[GetLate] ⚠️ Publicatie gefaald, maar workflow gaat door');
  return {
    success: true,
    fallbackToManual: true,
    error: `GetLate fout (niet kritiek): ${result.error}`,
    message: 'Content aangemaakt - social media post handmatig publiceren aanbevolen',
  };
}

/**
 * Get connected accounts met error handling
 */
export async function getAccountsSafe(): Promise<{ success: boolean; accounts?: any[]; error?: string }> {
  if (!isGetLateConfigured()) {
    return { success: false, error: 'GetLate niet geconfigureerd' };
  }

  try {
    const response = await fetch(`${GETLATE_API_URL}/accounts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GETLATE_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const accounts = await response.json();
    return { success: true, accounts };
  } catch (error: any) {
    console.error('[GetLate] Error fetching accounts:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test GetLate connection
 */
export async function testGetLateConnection(): Promise<{ success: boolean; error?: string; accounts?: number }> {
  if (!isGetLateConfigured()) {
    return { success: false, error: 'GetLate API key niet geconfigureerd' };
  }

  try {
    // Validate API key
    const validation = await validateApiKey();
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Get accounts to test connection
    const accountsResult = await getAccountsSafe();
    if (!accountsResult.success) {
      return { success: false, error: accountsResult.error };
    }

    return { 
      success: true, 
      accounts: accountsResult.accounts?.length || 0 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Batch create posts voor meerdere platforms met individual error handling
 */
export async function createPostsBatch(posts: GetLatePost[]): Promise<PostResult[]> {
  const results: PostResult[] = [];

  for (const post of posts) {
    const result = await createPostWithFallback(post);
    results.push(result);
    
    // Small delay between posts to avoid rate limiting
    if (posts.length > 1) {
      await sleep(1000);
    }
  }

  return results;
}

export default {
  createPostEnhanced,
  createPostWithFallback,
  getAccountsSafe,
  testGetLateConnection,
  createPostsBatch,
  isGetLateConfigured,
};
