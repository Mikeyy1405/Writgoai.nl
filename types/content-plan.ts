/**
 * Comprehensive Content Plan Types
 *
 * This defines the complete structure for a professional content plan
 * with all the details needed to write high-quality SEO articles.
 */

export interface HeadingStructure {
  level: 2 | 3 | 4;
  text: string;
  keywords: string[];
  wordCountTarget?: number;
  contentHints?: string[];
}

export interface ContentAngle {
  hook: string;
  uniqueValue: string;
  targetPain: string;
  solution: string;
}

export interface TargetPersona {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  painPoints: string[];
  goals: string[];
  searchBehavior: string;
}

export interface SEOMetadata {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  semanticKeywords: string[];
  longtailVariations: string[];
}

export interface KeywordStrategy {
  primary: string;
  secondary: string[];
  longtail: string[];
  semantic: string[];
  relatedSearches: string[];
  peopleAlsoAsk: string[];
}

export interface InternalLinking {
  suggestedLinks: Array<{
    anchorText: string;
    targetTopic: string;
    placement: 'introduction' | 'body' | 'conclusion';
    reason: string;
  }>;
  linkableKeywords: string[];
}

export interface ContentSources {
  primarySources: string[];
  statistics: string[];
  expertQuotes?: string[];
  caseStudies?: string[];
  tools?: string[];
}

export interface CompetitorInsight {
  url?: string;
  title?: string;
  wordCount?: number;
  headingsCount?: number;
  strengths?: string[];
  gaps?: string[];
  opportunities?: string[];
}

export interface WritingGuidelines {
  tone: 'professional' | 'conversational' | 'educational' | 'persuasive' | 'casual';
  readingLevel: number; // Flesch reading ease score target
  wordCountMin: number;
  wordCountMax: number;
  paragraphLength: 'short' | 'medium' | 'long';
  includeExamples: boolean;
  includeStatistics: boolean;
  includeVisuals: boolean;
}

export interface ContentOutline {
  introduction: {
    hook: string;
    problem: string;
    solution: string;
    wordCount: number;
  };
  mainSections: Array<{
    heading: string;
    subheadings: HeadingStructure[];
    keyPoints: string[];
    wordCount: number;
    includeVisual?: boolean;
    visualType?: 'image' | 'infographic' | 'table' | 'chart' | 'screenshot';
  }>;
  conclusion: {
    summary: string;
    cta: string;
    nextSteps: string[];
    wordCount: number;
  };
  faq?: Array<{
    question: string;
    answer: string;
  }>;
}

export interface ComprehensiveContentIdea {
  // Basic Info
  id?: string;
  title: string;
  slug?: string;
  category: string;
  cluster: string;

  // Content Type & Intent
  contentType: 'pillar' | 'cluster' | 'supporting' | 'how-to' | 'guide' | 'comparison' | 'list' | 'case-study' | 'faq' | 'news';
  searchIntent: 'informational' | 'commercial' | 'transactional' | 'navigational';

  // Priority & Status
  priority: 'high' | 'medium' | 'low';
  status?: 'todo' | 'in_progress' | 'review' | 'published' | 'update_needed';

  // SEO
  seoMetadata: SEOMetadata;
  keywordStrategy: KeywordStrategy;

  // Keyword Research Data
  searchVolume?: number | null;
  keywordDifficulty?: number; // 0-100
  competition?: string | null;
  rankingPotential?: number; // 0-100
  recommendation?: 'high-priority' | 'medium-priority' | 'low-priority' | 'skip';
  recommendationReason?: string;

  // Content Strategy
  contentAngle: ContentAngle;
  targetPersona: TargetPersona;
  writingGuidelines: WritingGuidelines;

  // Detailed Outline
  outline: ContentOutline;

  // Internal Linking
  internalLinking: InternalLinking;

  // Research & Sources
  sources: ContentSources;
  competitorInsights?: CompetitorInsight[];

  // Metadata
  estimatedWritingTime?: number; // in minutes
  complexity?: 'simple' | 'moderate' | 'complex';
  requiredExpertise?: 'none' | 'basic' | 'intermediate' | 'expert';

  // Publishing
  scheduledDate?: Date;
  publishedDate?: Date;
  lastUpdated?: Date;

  // Performance (after publishing)
  views?: number;
  averageTimeOnPage?: number;
  bounceRate?: number;
  currentRanking?: number;
  targetRanking?: number;
}

/**
 * Content Cluster with full strategy
 */
export interface ComprehensiveCluster {
  id: string;
  name: string;
  pillarTopic: string;
  pillarArticle?: ComprehensiveContentIdea;
  supportingArticles: ComprehensiveContentIdea[];

  // Cluster Strategy
  strategy: {
    topicalAuthority: number; // 0-100 score
    coveragePercentage: number; // % of topic covered
    internalLinks: number;
    estimatedMonths: number; // to complete cluster
  };

  // Cluster Keywords
  primaryKeywords: string[];
  semanticField: string[]; // Related concepts and terms

  // Progress
  articlesTotal: number;
  articlesCompleted: number;
  articlesInProgress: number;

  // Performance
  totalSearchVolume?: number;
  averageDifficulty?: number;
  estimatedTraffic?: number; // Monthly organic traffic estimate
}

/**
 * Complete Content Plan
 */
export interface ComprehensiveContentPlan {
  id?: string;
  projectId: string;

  // Niche Analysis
  niche: string;
  nicheKeywords: string[];
  language: string;
  targetAudience: string[];

  // Competition Analysis
  competitionLevel: 'low' | 'medium' | 'high' | 'very-high';
  domainAuthority: number;
  competitorUrls?: string[];

  // Strategy
  targetArticleCount: number;
  estimatedMonths: number;
  articlesPerWeek: number;
  priorityOrder: 'seo' | 'conversion' | 'authority' | 'balanced';

  // Content
  clusters: ComprehensiveCluster[];
  articles: ComprehensiveContentIdea[];

  // Stats
  stats: {
    totalArticles: number;
    pillarPages: number;
    clusterCount: number;
    avgWordCount: number;
    totalEstimatedSearchVolume: number;
    avgKeywordDifficulty: number;
    avgRankingPotential: number;
    byContentType: Record<string, number>;
    byPriority: Record<string, number>;
    byStatus: Record<string, number>;
  };

  // AI Analysis
  reasoning: string;
  opportunities: string[];
  recommendations: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastAnalyzedAt?: Date;
}

/**
 * Backward compatible type (legacy support)
 */
export interface LegacyContentIdea {
  title: string;
  category: string;
  description: string;
  keywords: string[];
  contentType: string;
  cluster: string;
  priority: string;
  difficulty?: string;
  searchIntent?: string;
  searchVolume?: number | null;
  competition?: string | null;
  status?: 'todo' | 'in_progress' | 'review' | 'published' | 'update_needed';
}

/**
 * Utility type: Convert legacy to comprehensive
 */
export function legacyToComprehensive(legacy: LegacyContentIdea): ComprehensiveContentIdea {
  return {
    title: legacy.title,
    category: legacy.category,
    cluster: legacy.cluster,
    contentType: legacy.contentType as any,
    searchIntent: (legacy.searchIntent as any) || 'informational',
    priority: legacy.priority as any,
    status: legacy.status,

    seoMetadata: {
      metaTitle: legacy.title,
      metaDescription: legacy.description || '',
      focusKeyword: legacy.keywords[0] || '',
      secondaryKeywords: legacy.keywords.slice(1, 4),
      semanticKeywords: [],
      longtailVariations: [],
    },

    keywordStrategy: {
      primary: legacy.keywords[0] || '',
      secondary: legacy.keywords.slice(1, 4),
      longtail: [],
      semantic: [],
      relatedSearches: [],
      peopleAlsoAsk: [],
    },

    contentAngle: {
      hook: 'Generated from legacy data',
      uniqueValue: legacy.description || '',
      targetPain: '',
      solution: '',
    },

    targetPersona: {
      name: 'Default Persona',
      level: 'intermediate',
      painPoints: [],
      goals: [],
      searchBehavior: 'Google search',
    },

    writingGuidelines: {
      tone: 'professional',
      readingLevel: 60,
      wordCountMin: 1000,
      wordCountMax: 2500,
      paragraphLength: 'medium',
      includeExamples: true,
      includeStatistics: true,
      includeVisuals: true,
    },

    outline: {
      introduction: {
        hook: 'To be defined',
        problem: 'To be defined',
        solution: 'To be defined',
        wordCount: 200,
      },
      mainSections: [],
      conclusion: {
        summary: 'To be defined',
        cta: 'To be defined',
        nextSteps: [],
        wordCount: 150,
      },
    },

    internalLinking: {
      suggestedLinks: [],
      linkableKeywords: legacy.keywords,
    },

    sources: {
      primarySources: [],
      statistics: [],
    },

    searchVolume: legacy.searchVolume,
    competition: legacy.competition,
  };
}

/**
 * Utility type: Convert comprehensive to legacy (for backward compatibility)
 */
export function comprehensiveToLegacy(comprehensive: ComprehensiveContentIdea): LegacyContentIdea {
  return {
    title: comprehensive.title,
    category: comprehensive.category,
    description: comprehensive.contentAngle.uniqueValue,
    keywords: [comprehensive.keywordStrategy.primary, ...comprehensive.keywordStrategy.secondary],
    contentType: comprehensive.contentType,
    cluster: comprehensive.cluster,
    priority: comprehensive.priority,
    difficulty: comprehensive.keywordDifficulty?.toString(),
    searchIntent: comprehensive.searchIntent,
    searchVolume: comprehensive.searchVolume,
    competition: comprehensive.competition,
    status: comprehensive.status,
  };
}
