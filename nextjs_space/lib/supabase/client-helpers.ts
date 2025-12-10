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
 */
export async function getDashboardStats(
  clientId: string
): Promise<DashboardStats> {
  const supabase = getSupabaseAdmin();
  
  // Get current month start
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get content count this month
  const { count: contentCount } = await supabase
    .from('content_deliveries')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .gte('created_at', monthStart.toISOString());

  // Get total impressions and engagements
  const { data: metricsData } = await supabase
    .from('content_deliveries')
    .select('impressions, engagements')
    .eq('client_id', clientId);

  const totalImpressions = metricsData?.reduce((sum, item) => sum + (item.impressions || 0), 0) || 0;
  const totalEngagements = metricsData?.reduce((sum, item) => sum + (item.engagements || 0), 0) || 0;

  // Get connected platforms count
  const { count: platformsCount } = await supabase
    .from('connected_platforms')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('active', true);

  // Get active subscription info
  const subscription = await getClientSubscription(clientId);

  const stats: DashboardStats = {
    content_this_month: contentCount || 0,
    total_impressions: totalImpressions,
    total_engagements: totalEngagements,
    connected_platforms: platformsCount || 0,
  };

  if (subscription) {
    // Calculate remaining content
    const { count: usedPillar } = await supabase
      .from('content_deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_id', subscription.id)
      .eq('content_type', 'pillar');

    const { count: usedCluster } = await supabase
      .from('content_deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_id', subscription.id)
      .eq('content_type', 'cluster');

    const { count: usedSocial } = await supabase
      .from('content_deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_id', subscription.id)
      .eq('content_type', 'social');

    const { count: usedVideos } = await supabase
      .from('content_deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_id', subscription.id)
      .eq('content_type', 'video');

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
  }

  return stats;
}
