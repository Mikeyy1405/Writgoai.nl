/**
 * WordPress Autopilot Types
 * Type definitions voor het WordPress Content Autopilot systeem
 */

export interface WordPressAutopilotSite {
  id: string;
  clientId: string;
  name: string;
  siteUrl: string;
  username: string;
  applicationPassword: string;
  niche?: string;
  language?: 'nl' | 'en' | 'de' | 'fr' | 'es';
  postingFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  contentTypes: string[]; // ['article', 'listicle', 'how-to', 'review']
  status: 'active' | 'paused' | 'error';
  lastPostDate?: Date;
  nextPostDate?: Date;
  totalPosts: number;
  averageViews?: number;
  topicalAuthorityScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentStrategy {
  id: string;
  siteId: string;
  niche: string;
  mainTopics: string[]; // ['Water Filtration', 'Home Water Safety', etc.]
  subtopics: Record<string, string[]>; // { 'Water Filtration': ['Reverse Osmosis', 'Carbon Filters'] }
  keywordClusters: KeywordCluster[];
  contentCalendar: ContentCalendarItem[];
  topicalAuthorityGoal: number; // Target coverage percentage
  currentCoverage: number; // Current coverage percentage
  createdAt: Date;
  updatedAt: Date;
}

export interface KeywordCluster {
  id: string;
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchVolume: number;
  difficulty: 'easy' | 'medium' | 'hard';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planned' | 'in_progress' | 'published';
}

export interface ContentCalendarItem {
  id: string;
  siteId: string;
  strategyId: string;
  title: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  contentType: 'article' | 'listicle' | 'how-to' | 'review' | 'guide';
  topic: string;
  subtopic?: string;
  scheduledDate: Date;
  status: 'scheduled' | 'generating' | 'generated' | 'published' | 'failed';
  contentId?: string; // Link to SavedContent
  wordpressPostId?: number;
  publishedUrl?: string;
  generatedAt?: Date;
  publishedAt?: Date;
  error?: string;
}

export interface AutopilotPerformanceMetrics {
  siteId: string;
  siteName: string;
  totalPosts: number;
  postsThisMonth: number;
  postsThisWeek: number;
  averageWordCount: number;
  totalViews: number;
  averageViews: number;
  topicalAuthorityScore: number;
  topPerformingPosts: PerformingPost[];
  recentPosts: PerformingPost[];
  keywordRankings: KeywordRanking[];
  contentCoverage: ContentCoverage;
}

export interface PerformingPost {
  id: string;
  title: string;
  url: string;
  publishedAt: Date;
  views: number;
  wordCount: number;
  focusKeyword: string;
  seoScore?: number;
}

export interface KeywordRanking {
  keyword: string;
  position: number;
  previousPosition?: number;
  url: string;
  trend: 'up' | 'down' | 'stable';
}

export interface ContentCoverage {
  totalTopics: number;
  coveredTopics: number;
  percentage: number;
  uncoveredTopics: string[];
  topicBreakdown: Record<string, {
    total: number;
    covered: number;
    percentage: number;
  }>;
}

export interface ContentUpdateSuggestion {
  contentId: string;
  title: string;
  url: string;
  publishedAt: Date;
  lastUpdated?: Date;
  suggestions: {
    type: 'seo' | 'content' | 'readability' | 'freshness';
    priority: 'low' | 'medium' | 'high';
    description: string;
    estimatedImpact: string;
  }[];
  currentScore: {
    seo: number;
    readability: number;
    freshness: number;
  };
  potentialScore: {
    seo: number;
    readability: number;
    freshness: number;
  };
}

export interface AutopilotSettings {
  siteId: string;
  enabled: boolean;
  postingFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  preferredPostingTime?: string; // '09:00'
  contentLength: 'short' | 'medium' | 'long' | 'auto'; // auto = competitor analysis
  includeImages: boolean;
  includeFAQ: boolean;
  includeYouTube: boolean;
  autoPublish: boolean;
  notifications: {
    onPublish: boolean;
    onError: boolean;
    email?: string;
  };
}
