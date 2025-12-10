/**
 * Distribution Center Types
 * 
 * TypeScript types for multi-platform content distribution via GetLateDev
 */

// ============================================
// PLATFORM TYPES
// ============================================

export type PlatformType = 
  | 'linkedin' 
  | 'instagram' 
  | 'facebook' 
  | 'tiktok' 
  | 'twitter' 
  | 'pinterest' 
  | 'google_my_business' 
  | 'youtube';

export type DistributionStatusType = 
  | 'pending' 
  | 'scheduled' 
  | 'publishing' 
  | 'published' 
  | 'failed' 
  | 'cancelled';

// ============================================
// MAIN INTERFACES
// ============================================

export interface DistributionTask {
  id: string;
  content_id: string;
  client_id: string;
  platforms: PlatformType[];
  scheduled_at: Date;
  status: DistributionStatusType;
  getlatedev_job_id?: string;
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
  error_message?: string;
  metadata?: Record<string, any>;
}

export interface PlatformConfig {
  platform: PlatformType;
  enabled: boolean;
  display_name: string;
  icon: string;
  color: string;
  connected: boolean;
  last_sync?: Date;
  settings: {
    posting_times?: string[];
    daily_limit?: number;
    auto_hashtags?: boolean;
  };
}

export interface QueueItem {
  id: string;
  task: DistributionTask;
  content: {
    title: string;
    preview: string;
    type: 'article' | 'social_post' | 'video_script';
  };
  client: {
    id: string;
    name: string;
    company: string;
  };
}

export interface DistributionStats {
  today: number;
  this_week: number;
  pending: number;
  success_rate: number;
  failed: number;
}

// ============================================
// PLATFORM CONFIGURATIONS
// ============================================

export const PLATFORM_CONFIGS: Record<PlatformType, Omit<PlatformConfig, 'connected' | 'last_sync' | 'enabled'>> = {
  linkedin: {
    platform: 'linkedin',
    display_name: 'LinkedIn',
    icon: 'linkedin',
    color: '#0A66C2',
    settings: {
      posting_times: ['09:00', '12:00', '17:00'],
      daily_limit: 5,
      auto_hashtags: true,
    },
  },
  instagram: {
    platform: 'instagram',
    display_name: 'Instagram',
    icon: 'instagram',
    color: '#E4405F',
    settings: {
      posting_times: ['10:00', '14:00', '19:00'],
      daily_limit: 10,
      auto_hashtags: true,
    },
  },
  facebook: {
    platform: 'facebook',
    display_name: 'Facebook',
    icon: 'facebook',
    color: '#1877F2',
    settings: {
      posting_times: ['08:00', '13:00', '20:00'],
      daily_limit: 8,
      auto_hashtags: false,
    },
  },
  tiktok: {
    platform: 'tiktok',
    display_name: 'TikTok',
    icon: 'music-2',
    color: '#000000',
    settings: {
      posting_times: ['11:00', '15:00', '21:00'],
      daily_limit: 3,
      auto_hashtags: true,
    },
  },
  twitter: {
    platform: 'twitter',
    display_name: 'Twitter/X',
    icon: 'twitter',
    color: '#1DA1F2',
    settings: {
      posting_times: ['09:00', '12:00', '15:00', '18:00'],
      daily_limit: 20,
      auto_hashtags: true,
    },
  },
  pinterest: {
    platform: 'pinterest',
    display_name: 'Pinterest',
    icon: 'pin',
    color: '#E60023',
    settings: {
      posting_times: ['10:00', '15:00', '20:00'],
      daily_limit: 5,
      auto_hashtags: true,
    },
  },
  google_my_business: {
    platform: 'google_my_business',
    display_name: 'Google Mijn Bedrijf',
    icon: 'map-pin',
    color: '#4285F4',
    settings: {
      posting_times: ['09:00', '14:00'],
      daily_limit: 2,
      auto_hashtags: false,
    },
  },
  youtube: {
    platform: 'youtube',
    display_name: 'YouTube',
    icon: 'youtube',
    color: '#FF0000',
    settings: {
      posting_times: ['10:00', '16:00'],
      daily_limit: 1,
      auto_hashtags: false,
    },
  },
};

// ============================================
// INSERT TYPES
// ============================================

export type DistributionTaskInsert = Omit<
  DistributionTask,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string;
  created_at?: Date;
  updated_at?: Date;
};

export type DistributionTaskUpdate = Partial<
  Omit<DistributionTask, 'id' | 'created_at'>
>;

// ============================================
// FILTER & SORT TYPES
// ============================================

export interface QueueFilters {
  platform?: PlatformType;
  client_id?: string;
  status?: DistributionStatusType;
  date_from?: Date;
  date_to?: Date;
}

export type QueueSortBy = 'scheduled_at' | 'client' | 'platform' | 'status';
export type SortDirection = 'asc' | 'desc';

// ============================================
// API RESPONSE TYPES
// ============================================

export interface DistributionOverview {
  stats: DistributionStats;
  recent_activity: QueueItem[];
  platform_status: PlatformConfig[];
}

export interface QueueResponse {
  items: QueueItem[];
  total: number;
  page: number;
  per_page: number;
}
