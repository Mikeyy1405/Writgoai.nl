/**
 * Supabase Helper Functions for Client Dashboard
 * 
 * Helper functions for managing client subscriptions, platforms, and content
 */

import { getSupabaseAdmin } from '@/lib/supabase';
import {
  ClientSubscription,
  ClientSubscriptionInsert,
  ClientSubscriptionUpdate,
  ConnectedPlatform,
  ConnectedPlatformInsert,
  ConnectedPlatformUpdate,
  ContentDelivery,
  ContentDeliveryInsert,
  ContentStatus,
  ContentType,
  DashboardStats,
} from './database.types';

// ============================================
// CLIENT SUBSCRIPTION HELPERS
// ============================================

/**
 * Get active subscription for a client
 */
export async function getClientSubscription(
  clientId: string
): Promise<ClientSubscription | null> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('client_subscriptions')
    .select('*')
    .eq('client_id', clientId)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching client subscription:', error);
    throw error;
  }

  return data as ClientSubscription | null;
}

/**
 * Update client subscription
 */
export async function updateClientSubscription(
  clientId: string,
  updates: ClientSubscriptionUpdate
): Promise<ClientSubscription> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('client_subscriptions')
    .update(updates)
    .eq('client_id', clientId)
    .eq('active', true)
    .select()
    .single();

  if (error) {
    console.error('Error updating client subscription:', error);
    throw error;
  }

  return data as ClientSubscription;
}

/**
 * Create a new subscription for a client
 */
export async function createClientSubscription(
  subscription: ClientSubscriptionInsert
): Promise<ClientSubscription> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('client_subscriptions')
    .insert(subscription)
    .select()
    .single();

  if (error) {
    console.error('Error creating client subscription:', error);
    throw error;
  }

  return data as ClientSubscription;
}

// ============================================
// CONNECTED PLATFORMS HELPERS
// ============================================

/**
 * Get all connected platforms for a client
 */
export async function getConnectedPlatforms(
  clientId: string
): Promise<ConnectedPlatform[]> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('connected_platforms')
    .select('*')
    .eq('client_id', clientId)
    .eq('active', true)
    .order('connected_at', { ascending: false });

  if (error) {
    console.error('Error fetching connected platforms:', error);
    throw error;
  }

  return data as ConnectedPlatform[];
}

/**
 * Connect a new platform
 */
export async function connectPlatform(
  platform: ConnectedPlatformInsert
): Promise<ConnectedPlatform> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('connected_platforms')
    .insert(platform)
    .select()
    .single();

  if (error) {
    console.error('Error connecting platform:', error);
    throw error;
  }

  return data as ConnectedPlatform;
}

/**
 * Disconnect a platform
 */
export async function disconnectPlatform(platformId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('connected_platforms')
    .update({ active: false })
    .eq('id', platformId);

  if (error) {
    console.error('Error disconnecting platform:', error);
    throw error;
  }
}

/**
 * Update a connected platform
 */
export async function updateConnectedPlatform(
  platformId: string,
  updates: ConnectedPlatformUpdate
): Promise<ConnectedPlatform> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('connected_platforms')
    .update(updates)
    .eq('id', platformId)
    .select()
    .single();

  if (error) {
    console.error('Error updating connected platform:', error);
    throw error;
  }

  return data as ConnectedPlatform;
}

// ============================================
// CONTENT DELIVERIES HELPERS
// ============================================

export interface ContentFilters {
  type?: ContentType;
  status?: ContentStatus;
  limit?: number;
  offset?: number;
}

/**
 * Get content deliveries for a client
 */
export async function getContentDeliveries(
  clientId: string,
  filters?: ContentFilters
): Promise<ContentDelivery[]> {
  const supabase = getSupabaseAdmin();
  
  let query = supabase
    .from('content_deliveries')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (filters?.type) {
    query = query.eq('content_type', filters.type);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(
      filters.offset,
      filters.offset + (filters.limit || 10) - 1
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching content deliveries:', error);
    throw error;
  }

  return data as ContentDelivery[];
}

/**
 * Create a new content delivery
 */
export async function createContentDelivery(
  content: ContentDeliveryInsert
): Promise<ContentDelivery> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('content_deliveries')
    .insert(content)
    .select()
    .single();

  if (error) {
    console.error('Error creating content delivery:', error);
    throw error;
  }

  return data as ContentDelivery;
}

// ============================================
// DASHBOARD STATS HELPERS
// ============================================

/**
 * Get dashboard statistics for a client
 * Uses existing SavedContent and Project tables with graceful fallbacks
 */
export async function getDashboardStats(
  clientId: string
): Promise<DashboardStats> {
  const supabase = getSupabaseAdmin();
  
  // Get current month start in UTC
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  // Initialize stats with defaults (graceful fallback)
  const stats: DashboardStats = {
    content_this_month: 0,
    total_impressions: 0,
    total_engagements: 0,
    connected_platforms: 0,
  };

  try {
    // Get content count this month from SavedContent table
    const { count: contentCount, error: contentError } = await supabase
      .from('SavedContent')
      .select('*', { count: 'exact', head: true })
      .eq('clientId', clientId)
      .gte('createdAt', monthStart.toISOString());

    if (!contentError) {
      stats.content_this_month = contentCount || 0;
    } else {
      console.warn('Error fetching content count:', contentError);
    }

    // Get total content count from SavedContent table
    const { count: totalContent, error: totalError } = await supabase
      .from('SavedContent')
      .select('*', { count: 'exact', head: true })
      .eq('clientId', clientId);

    if (!totalError) {
      stats.total_impressions = totalContent || 0; // Use total_impressions field for total content count
    } else {
      console.warn('Error fetching total content:', totalError);
    }

    // Get published articles count (where publishedAt is not null)
    const { count: publishedCount, error: publishedError } = await supabase
      .from('SavedContent')
      .select('*', { count: 'exact', head: true })
      .eq('clientId', clientId)
      .not('publishedAt', 'is', null);

    if (!publishedError) {
      stats.total_engagements = publishedCount || 0; // Use total_engagements field for published articles count
    } else {
      console.warn('Error fetching published content:', publishedError);
    }

    // Get total projects count from Project table
    const { count: projectsCount, error: projectsError } = await supabase
      .from('Project')
      .select('*', { count: 'exact', head: true })
      .eq('clientId', clientId);

    if (!projectsError) {
      stats.connected_platforms = projectsCount || 0; // Use connected_platforms field for projects count
    } else {
      console.warn('Error fetching projects count:', projectsError);
    }
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    // Return stats with default values (graceful fallback)
  }

  // Try to get connected platforms (optional, will not crash if table doesn't exist)
  try {
    const { count: platformsCount, error: platformsError } = await supabase
      .from('connected_platforms')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('active', true);

    if (!platformsError && platformsCount !== null) {
      // Only override if we got a valid result
      // stats.connected_platforms = platformsCount;
      // Keep using Project count for now since that's more relevant
    }
  } catch (error) {
    // Silently fail if connected_platforms table doesn't exist
    console.warn('connected_platforms table not available:', error);
  }

  // Try to get subscription info (optional, will not crash if table doesn't exist)
  try {
    const subscription = await getClientSubscription(clientId);
    
    if (subscription) {
      // Try to calculate remaining content from content_deliveries if it exists
      try {
        const [
          { count: usedPillar },
          { count: usedCluster },
          { count: usedSocial },
          { count: usedVideos },
        ] = await Promise.all([
          supabase
            .from('content_deliveries')
            .select('*', { count: 'exact', head: true })
            .eq('subscription_id', subscription.id)
            .eq('content_type', 'pillar'),
          supabase
            .from('content_deliveries')
            .select('*', { count: 'exact', head: true })
            .eq('subscription_id', subscription.id)
            .eq('content_type', 'cluster'),
          supabase
            .from('content_deliveries')
            .select('*', { count: 'exact', head: true })
            .eq('subscription_id', subscription.id)
            .eq('content_type', 'social'),
          supabase
            .from('content_deliveries')
            .select('*', { count: 'exact', head: true })
            .eq('subscription_id', subscription.id)
            .eq('content_type', 'video'),
        ]);

        stats.package_info = {
          type: subscription.package_type,
          price: subscription.price,
          remaining: {
            pillar_articles: Math.max(0, subscription.pillar_articles - (usedPillar || 0)),
            cluster_articles: Math.max(0, subscription.cluster_articles - (usedCluster || 0)),
            social_posts: Math.max(0, subscription.social_posts - (usedSocial || 0)),
            videos: Math.max(0, subscription.videos - (usedVideos || 0)),
          },
        };
      } catch (error) {
        console.warn('content_deliveries table not available, using default remaining counts:', error);
        // If content_deliveries doesn't exist, use full subscription limits
        stats.package_info = {
          type: subscription.package_type,
          price: subscription.price,
          remaining: {
            pillar_articles: subscription.pillar_articles,
            cluster_articles: subscription.cluster_articles,
            social_posts: subscription.social_posts,
            videos: subscription.videos,
          },
        };
      }
    }
  } catch (error) {
    // Silently fail if subscription tables don't exist
    console.warn('Subscription tables not available:', error);
  }

  return stats;
}
