/**
 * GetLateDev API Integration Service
 * 
 * Real implementation using GetLate.dev API
 */

import { DistributionTask } from '@/lib/types/distribution';
import { createPost, getAccounts, getUsageStats } from '@/lib/getlate';

// ============================================
// TYPES
// ============================================

export interface JobStatus {
  job_id: string;
  status: 'pending' | 'scheduled' | 'publishing' | 'published' | 'failed';
  published_at?: Date;
  error_message?: string;
  platform_results?: Array<{
    platform: string;
    status: 'success' | 'failed';
    post_id?: string;
    error?: string;
  }>;
}

export interface SchedulePostResponse {
  success: boolean;
  job_id: string;
  scheduled_at: Date;
  message?: string;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Schedule a post via GetLateDev API
 * @param task - The distribution task to schedule
 * @returns Promise with job ID
 */
export async function schedulePost(task: DistributionTask): Promise<string> {
  try {
    console.log('[GetLateDev] Scheduling post:', {
      content_id: task.content_id,
      platforms: task.platforms,
      scheduled_at: task.scheduled_at,
    });

    // Use the real GetLate API
    const result = await createPost({
      content: task.content || '',
      platforms: task.platforms || [],
      scheduledAt: task.scheduled_at?.toISOString(),
      mediaItems: task.media_url ? [{
        url: task.media_url,
        type: 'image'
      }] : undefined
    });

    // Return the job/post ID from GetLate
    const jobId = result.id || result.postId || `job_${Date.now()}`;
    console.log('[GetLateDev] Post scheduled successfully:', jobId);
    
    return jobId;
  } catch (error) {
    console.error('[GetLateDev] Error scheduling post:', error);
    throw error;
  }
}

/**
 * Get status of a scheduled job
 * @param jobId - The GetLateDev job ID
 * @returns Promise with job status
 */
export async function getJobStatus(jobId: string): Promise<JobStatus> {
  try {
    console.log('[GetLateDev] Fetching job status:', jobId);

    // GetLate.dev doesn't have a specific job status endpoint in the current API
    // This would need to be implemented when they add it
    // For now, return a default scheduled status
    
    return {
      job_id: jobId,
      status: 'scheduled',
      platform_results: [],
    };
  } catch (error) {
    console.error('[GetLateDev] Error fetching job status:', error);
    throw error;
  }
}

/**
 * Cancel a scheduled job
 * @param jobId - The GetLateDev job ID
 * @returns Promise with success status
 */
export async function cancelJob(jobId: string): Promise<boolean> {
  try {
    console.log('[GetLateDev] Cancelling job:', jobId);

    // GetLate.dev cancel functionality would be implemented here
    // when they add the endpoint
    console.warn('[GetLateDev] Cancel job not yet implemented by GetLate API');
    
    return false;
  } catch (error) {
    console.error('[GetLateDev] Error cancelling job:', error);
    return false;
  }
}

/**
 * Webhook handler for GetLateDev status updates
 * @param payload - Webhook payload from GetLateDev
 */
export async function handleWebhook(payload: any): Promise<void> {
  try {
    console.log('[GetLateDev] Webhook received:', payload);

    // Handle different webhook event types
    const eventType = payload.type || payload.event;
    
    switch (eventType) {
      case 'post.published':
        console.log('[GetLateDev] Post published:', payload.postId);
        break;
      case 'post.failed':
        console.log('[GetLateDev] Post failed:', payload.postId, payload.error);
        break;
      default:
        console.log('[GetLateDev] Unknown webhook event:', eventType);
    }
  } catch (error) {
    console.error('[GetLateDev] Error handling webhook:', error);
    throw error;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Validate GetLateDev API configuration
 * @returns Whether the API is properly configured
 */
export function isConfigured(): boolean {
  const hasKey = process.env.LATE_DEV_API_KEY !== undefined || 
                 process.env.GETLATE_API_KEY !== undefined;
  
  if (!hasKey) {
    console.warn('[GetLateDev] API key not configured. Set LATE_DEV_API_KEY in .env');
  }
  
  return hasKey;
}

/**
 * Test GetLateDev API connection
 * @returns Promise with test result
 */
export async function testConnection(): Promise<boolean> {
  try {
    console.log('[GetLateDev] Testing connection...');
    
    if (!isConfigured()) {
      console.error('[GetLateDev] API not configured');
      return false;
    }

    // Test by fetching accounts
    const accounts = await getAccounts();
    console.log('[GetLateDev] Connection successful. Accounts:', accounts);
    
    return true;
  } catch (error) {
    console.error('[GetLateDev] Connection test failed:', error);
    return false;
  }
}
