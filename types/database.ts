// Database types for WritgoAI MVP
// Content Planning System Types

export type ArticleStatus = 'idea' | 'planned' | 'writing' | 'review' | 'published';
export type ContentType = 'homepage' | 'pillar' | 'cluster' | 'blog' | 'landing';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type SearchIntent = 'informational' | 'navigational' | 'transactional' | 'commercial';

// SitePlan types
export interface SitePlanHomepage {
  title: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  sections: SitePlanSection[];
}

export interface SitePlanSection {
  title: string;
  description: string;
  cta?: string;
}

export interface PillarPage {
  id: string;
  title: string;
  slug: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  description: string;
  searchIntent: SearchIntent;
  estimatedWordCount: number;
  priority: Priority;
  clusterTopics: string[];
}

export interface ClusterPage {
  id: string;
  title: string;
  slug: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  description: string;
  searchIntent: SearchIntent;
  estimatedWordCount: number;
  priority: Priority;
  parentPillarId: string;
}

export interface BlogPostIdea {
  id: string;
  title: string;
  slug: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  description: string;
  searchIntent: SearchIntent;
  estimatedWordCount: number;
  priority: Priority;
  category?: string;
  cluster?: string;
}

export interface SitePlan {
  id: string;
  clientId: string;
  projectId: string;
  name: string;
  homepage: SitePlanHomepage | null;
  pillarPages: PillarPage[] | null;
  clusterPages: ClusterPage[] | null;
  blogPosts: BlogPostIdea[] | null;
  keywords: string[];
  targetAudience: string | null;
  language: string;
  status: 'draft' | 'active' | 'archived';
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ArticleIdea extended types
export interface ArticleIdea {
  id: string;
  clientId: string;
  projectId: string | null;
  title: string;
  slug: string;
  focusKeyword: string;
  topic: string;
  secondaryKeywords: string[];
  searchIntent: SearchIntent | null;
  searchVolume: number | null;
  difficulty: number | null;
  contentOutline: ContentOutline | null;
  targetWordCount: number | null;
  contentType: ContentType | null;
  contentCategory: string | null;
  internalLinks: InternalLink[] | null;
  relatedArticles: string[];
  imageIdeas: string[];
  videoIdeas: string[];
  priority: Priority;
  category: string | null;
  cluster: string | null;
  scheduledFor: string | null;
  status: ArticleStatus;
  hasContent: boolean;
  contentId: string | null;
  generatedAt: string | null;
  publishedAt: string | null;
  aiScore: number | null;
  trending: boolean;
  seasonal: boolean;
  competitorGap: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  language: string;
}

export interface ContentOutline {
  introduction: string;
  sections: OutlineSection[];
  conclusion: string;
}

export interface OutlineSection {
  heading: string;
  subheadings?: string[];
  keyPoints: string[];
}

export interface InternalLink {
  url: string;
  anchor: string;
  context?: string;
}

// Create/Update types
export interface CreateArticleIdea {
  clientId: string;
  projectId?: string;
  title: string;
  slug: string;
  focusKeyword: string;
  topic: string;
  secondaryKeywords?: string[];
  searchIntent?: SearchIntent;
  searchVolume?: number;
  difficulty?: number;
  contentOutline?: ContentOutline;
  targetWordCount?: number;
  contentType?: ContentType;
  contentCategory?: string;
  priority?: Priority;
  category?: string;
  cluster?: string;
  scheduledFor?: string;
  status?: ArticleStatus;
  notes?: string;
  language?: string;
}

export interface UpdateArticleIdea {
  title?: string;
  slug?: string;
  focusKeyword?: string;
  topic?: string;
  secondaryKeywords?: string[];
  searchIntent?: SearchIntent;
  searchVolume?: number;
  difficulty?: number;
  contentOutline?: ContentOutline;
  targetWordCount?: number;
  contentType?: ContentType;
  contentCategory?: string;
  priority?: Priority;
  category?: string;
  cluster?: string;
  scheduledFor?: string;
  status?: ArticleStatus;
  notes?: string;
  hasContent?: boolean;
  contentId?: string;
  generatedAt?: string;
  publishedAt?: string;
}

export interface CreateSitePlan {
  clientId: string;
  projectId: string;
  name?: string;
  homepage?: SitePlanHomepage;
  pillarPages?: PillarPage[];
  clusterPages?: ClusterPage[];
  blogPosts?: BlogPostIdea[];
  keywords?: string[];
  targetAudience?: string;
  language?: string;
  status?: 'draft' | 'active' | 'archived';
}

// Credit costs for content planning
export const CONTENT_PLANNING_CREDITS = {
  SITE_PLAN_GENERATION: 50,      // Generate complete site plan
  KEYWORD_RESEARCH_50: 20,       // Research for 50 keywords
  BLOG_GENERATION: 10,           // Generate single blog post
  PILLAR_PAGE_GENERATION: 25,    // Generate pillar page
  CLUSTER_PAGE_GENERATION: 15,   // Generate cluster page
} as const;

// Filter types
export interface ArticleIdeaFilters {
  projectId?: string;
  status?: ArticleStatus | ArticleStatus[];
  contentType?: ContentType | ContentType[];
  priority?: Priority | Priority[];
  category?: string;
  cluster?: string;
  hasContent?: boolean;
  searchQuery?: string;
}

// Kanban board types
export interface KanbanColumn {
  id: ArticleStatus;
  title: string;
  color: string;
  ideas: ArticleIdea[];
}

export const KANBAN_COLUMNS: Omit<KanbanColumn, 'ideas'>[] = [
  { id: 'idea', title: 'Ideeën', color: 'bg-gray-100' },
  { id: 'planned', title: 'Gepland', color: 'bg-blue-100' },
  { id: 'writing', title: 'In Schrijven', color: 'bg-yellow-100' },
  { id: 'review', title: 'Review', color: 'bg-purple-100' },
  { id: 'published', title: 'Gepubliceerd', color: 'bg-green-100' },
];
