/**
 * TypeScript Database Types for Client Dashboard
 * 
 * Complete TypeScript interfaces for all client dashboard tables
 */

// ============================================
// ENUMS
// ============================================

export type PackageType = 'INSTAPPER' | 'STARTER' | 'GROEI' | 'DOMINANT';

export type ContentType = 'pillar' | 'cluster' | 'social' | 'video';

export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'failed';

export type PlatformType =
  | 'linkedin_personal'
  | 'linkedin_company'
  | 'instagram'
  | 'facebook_personal'
  | 'facebook_page'
  | 'twitter'
  | 'tiktok'
  | 'pinterest'
  | 'google_my_business'
  | 'youtube';

// ============================================
// DATABASE TABLES
// ============================================

export interface ClientSubscription {
  id: string;
  client_id: string;
  package_type: PackageType;
  price: number;
  pillar_articles: number;
  cluster_articles: number;
  social_posts: number;
  videos: number;
  start_date: Date;
  end_date?: Date | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ConnectedPlatform {
  id: string;
  client_id: string;
  platform_type: PlatformType;
  platform_name: string;
  access_token?: string | null;
  refresh_token?: string | null;
  token_expiry?: Date | null;
  platform_user_id?: string | null;
  platform_username?: string | null;
  connected_at: Date;
  active: boolean;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface ContentDelivery {
  id: string;
  client_id: string;
  subscription_id?: string | null;
  content_type: ContentType;
  title: string;
  content?: string | null;
  status: ContentStatus;
  scheduled_date?: Date | null;
  published_date?: Date | null;
  platform_ids: string[];
  impressions: number;
  engagements: number;
  clicks: number;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// INSERT TYPES (for creating new records)
// ============================================

export type ClientSubscriptionInsert = Omit<
  ClientSubscription,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string;
  created_at?: Date;
  updated_at?: Date;
};

export type ConnectedPlatformInsert = Omit<
  ConnectedPlatform,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string;
  created_at?: Date;
  updated_at?: Date;
};

export type ContentDeliveryInsert = Omit<
  ContentDelivery,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string;
  created_at?: Date;
  updated_at?: Date;
};

// ============================================
// UPDATE TYPES (for updating existing records)
// ============================================

export type ClientSubscriptionUpdate = Partial<
  Omit<ClientSubscription, 'id' | 'client_id' | 'created_at' | 'updated_at'>
>;

export type ConnectedPlatformUpdate = Partial<
  Omit<ConnectedPlatform, 'id' | 'client_id' | 'created_at' | 'updated_at'>
>;

export type ContentDeliveryUpdate = Partial<
  Omit<ContentDelivery, 'id' | 'client_id' | 'created_at' | 'updated_at'>
>;

// ============================================
// DASHBOARD STATS
// ============================================

export interface DashboardStats {
  content_this_month: number;
  total_impressions: number;
  total_engagements: number;
  connected_platforms: number;
  package_info?: {
    type: PackageType;
    price: number;
    remaining: {
      pillar_articles: number;
      cluster_articles: number;
      social_posts: number;
      videos: number;
    };
  };
}
