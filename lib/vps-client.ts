/**
 * VPS Agent Client
 *
 * Simple client to communicate with your VPS agent for automated WordPress publishing
 */

interface PublishOptions {
  topic: string;
  site: string;
  instructions?: string;
  category?: string;
  tags?: string[];
  publishImmediately?: boolean;
}

interface PublishResult {
  success: boolean;
  message?: string;
  jobId?: string;
  estimatedTime?: string;
  error?: string;
}

const VPS_AGENT_URL = process.env.VPS_AGENT_URL || 'http://localhost:3001';
const VPS_API_SECRET = process.env.VPS_API_SECRET;

/**
 * Publish an article to WordPress via VPS agent
 *
 * @example
 * ```typescript
 * const result = await publishToWordPress({
 *   topic: 'Yoga voor beginners - 10 tips',
 *   site: 'yogastartgids.nl'
 * });
 *
 * console.log(result.url); // https://yogastartgids.nl/yoga-voor-beginners-10-tips
 * ```
 */
export async function publishToWordPress(options: PublishOptions): Promise<PublishResult> {
  if (!VPS_API_SECRET) {
    return {
      success: false,
      error: 'VPS_API_SECRET not configured in environment variables'
    };
  }

  try {
    const response = await fetch(`${VPS_AGENT_URL}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Secret': VPS_API_SECRET
      },
      body: JSON.stringify(options)
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`
      };
    }

    return data;

  } catch (error: any) {
    return {
      success: false,
      error: `VPS agent not reachable: ${error.message}`
    };
  }
}

/**
 * Test login to WordPress site via VPS agent
 */
export async function testWordPressLogin(site: string): Promise<{ success: boolean; error?: string }> {
  if (!VPS_API_SECRET) {
    return {
      success: false,
      error: 'VPS_API_SECRET not configured'
    };
  }

  try {
    const response = await fetch(`${VPS_AGENT_URL}/test-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Secret': VPS_API_SECRET
      },
      body: JSON.stringify({ site })
    });

    return await response.json();

  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get VPS agent status
 */
export async function getVPSAgentStatus() {
  if (!VPS_API_SECRET) {
    return null;
  }

  try {
    const response = await fetch(`${VPS_AGENT_URL}/status`, {
      headers: {
        'X-API-Secret': VPS_API_SECRET
      }
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();

  } catch (error) {
    return null;
  }
}
