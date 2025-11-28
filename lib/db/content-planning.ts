/**
 * Content Planning Database Helper Functions
 * Provides functions for managing SitePlans and ArticleIdeas via Supabase
 */

import { createClient } from '@supabase/supabase-js';
import type {
  ArticleIdea,
  SitePlan,
  CreateArticleIdea,
  UpdateArticleIdea,
  CreateSitePlan,
  ArticleIdeaFilters,
  ArticleStatus,
} from '@/types/database';
import { generateId, generateSlug, DEFAULT_LANGUAGE } from './utils';

// Re-export utility functions for convenience
export { generateId, generateSlug } from './utils';

// Create supabase client for this module
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// =====================================================
// SITE PLAN FUNCTIONS
// =====================================================

/**
 * Get site plan for a project
 */
export async function getSitePlan(projectId: string): Promise<SitePlan | null> {
  const { data, error } = await supabase
    .from('SitePlan')
    .select('*')
    .eq('projectId', projectId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching site plan:', error);
    throw error;
  }

  return data as SitePlan;
}

/**
 * Create or update a site plan for a project
 */
export async function upsertSitePlan(plan: CreateSitePlan): Promise<SitePlan> {
  const id = generateId();
  const now = new Date().toISOString();
  
  const insertData = {
    id,
    clientId: plan.clientId,
    projectId: plan.projectId,
    name: plan.name || 'Content Strategy',
    homepage: plan.homepage || null,
    pillarPages: plan.pillarPages || null,
    clusterPages: plan.clusterPages || null,
    blogPosts: plan.blogPosts || null,
    keywords: plan.keywords || [],
    targetAudience: plan.targetAudience || null,
    language: plan.language || 'nl',
    status: plan.status || 'draft',
    generatedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  const { data, error } = await supabase
    .from('SitePlan')
    .upsert(insertData, {
      onConflict: 'projectId',
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting site plan:', error);
    throw error;
  }

  return data as SitePlan;
}

/**
 * Update site plan status
 */
export async function updateSitePlanStatus(
  projectId: string, 
  status: 'draft' | 'active' | 'archived'
): Promise<SitePlan> {
  const { data, error } = await supabase
    .from('SitePlan')
    .update({ status, updatedAt: new Date().toISOString() })
    .eq('projectId', projectId)
    .select()
    .single();

  if (error) {
    console.error('Error updating site plan status:', error);
    throw error;
  }

  return data as SitePlan;
}

/**
 * Delete site plan
 */
export async function deleteSitePlan(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('SitePlan')
    .delete()
    .eq('projectId', projectId);

  if (error) {
    console.error('Error deleting site plan:', error);
    throw error;
  }
}

// =====================================================
// ARTICLE IDEA FUNCTIONS
// =====================================================

/**
 * Get all article ideas for a project with optional filters
 */
export async function getArticleIdeas(
  clientId: string,
  filters?: ArticleIdeaFilters
): Promise<ArticleIdea[]> {
  let query = supabase
    .from('ArticleIdea')
    .select('*')
    .eq('clientId', clientId);

  if (filters?.projectId) {
    query = query.eq('projectId', filters.projectId);
  }

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }

  if (filters?.contentType) {
    if (Array.isArray(filters.contentType)) {
      query = query.in('contentType', filters.contentType);
    } else {
      query = query.eq('contentType', filters.contentType);
    }
  }

  if (filters?.priority) {
    if (Array.isArray(filters.priority)) {
      query = query.in('priority', filters.priority);
    } else {
      query = query.eq('priority', filters.priority);
    }
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.cluster) {
    query = query.eq('cluster', filters.cluster);
  }

  if (filters?.hasContent !== undefined) {
    query = query.eq('hasContent', filters.hasContent);
  }

  if (filters?.searchQuery) {
    query = query.or(`title.ilike.%${filters.searchQuery}%,focusKeyword.ilike.%${filters.searchQuery}%`);
  }

  query = query.order('priority', { ascending: false })
    .order('createdAt', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching article ideas:', error);
    throw error;
  }

  return (data || []) as ArticleIdea[];
}

/**
 * Get a single article idea by ID
 */
export async function getArticleIdea(id: string): Promise<ArticleIdea | null> {
  const { data, error } = await supabase
    .from('ArticleIdea')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching article idea:', error);
    throw error;
  }

  return data as ArticleIdea;
}

/**
 * Create a new article idea
 */
export async function createArticleIdea(idea: CreateArticleIdea): Promise<ArticleIdea> {
  const id = generateId();
  const now = new Date().toISOString();
  const slug = idea.slug || generateSlug(idea.title);
  
  const insertData = {
    id,
    clientId: idea.clientId,
    projectId: idea.projectId || null,
    title: idea.title,
    slug,
    focusKeyword: idea.focusKeyword,
    topic: idea.topic,
    secondaryKeywords: idea.secondaryKeywords || [],
    searchIntent: idea.searchIntent || null,
    searchVolume: idea.searchVolume || null,
    difficulty: idea.difficulty || null,
    contentOutline: idea.contentOutline || null,
    targetWordCount: idea.targetWordCount || null,
    contentType: idea.contentType || null,
    contentCategory: idea.contentCategory || null,
    priority: idea.priority || 'medium',
    category: idea.category || null,
    cluster: idea.cluster || null,
    scheduledFor: idea.scheduledFor || null,
    status: idea.status || 'idea',
    hasContent: false,
    contentId: null,
    generatedAt: null,
    publishedAt: null,
    aiScore: null,
    trending: false,
    seasonal: false,
    competitorGap: false,
    notes: idea.notes || null,
    createdAt: now,
    updatedAt: now,
    language: idea.language || DEFAULT_LANGUAGE,
  };

  const { data, error } = await supabase
    .from('ArticleIdea')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating article idea:', error);
    throw error;
  }

  return data as ArticleIdea;
}

/**
 * Create multiple article ideas at once
 */
export async function createArticleIdeas(ideas: CreateArticleIdea[]): Promise<ArticleIdea[]> {
  const now = new Date().toISOString();
  
  const ideasToInsert = ideas.map(idea => ({
    id: generateId(),
    clientId: idea.clientId,
    projectId: idea.projectId || null,
    title: idea.title,
    slug: idea.slug || generateSlug(idea.title),
    focusKeyword: idea.focusKeyword,
    topic: idea.topic,
    secondaryKeywords: idea.secondaryKeywords || [],
    searchIntent: idea.searchIntent || null,
    searchVolume: idea.searchVolume || null,
    difficulty: idea.difficulty || null,
    contentOutline: idea.contentOutline || null,
    targetWordCount: idea.targetWordCount || null,
    contentType: idea.contentType || null,
    contentCategory: idea.contentCategory || null,
    priority: idea.priority || 'medium',
    category: idea.category || null,
    cluster: idea.cluster || null,
    scheduledFor: idea.scheduledFor || null,
    status: idea.status || 'idea',
    hasContent: false,
    contentId: null,
    generatedAt: null,
    publishedAt: null,
    aiScore: null,
    trending: false,
    seasonal: false,
    competitorGap: false,
    notes: idea.notes || null,
    createdAt: now,
    updatedAt: now,
    language: idea.language || DEFAULT_LANGUAGE,
  }));

  const { data, error } = await supabase
    .from('ArticleIdea')
    .insert(ideasToInsert)
    .select();

  if (error) {
    console.error('Error creating article ideas:', error);
    throw error;
  }

  return (data || []) as ArticleIdea[];
}

/**
 * Update an article idea
 */
export async function updateArticleIdea(
  id: string, 
  updates: UpdateArticleIdea
): Promise<ArticleIdea> {
  const updateData = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('ArticleIdea')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating article idea:', error);
    throw error;
  }

  return data as ArticleIdea;
}

/**
 * Update article status (for Kanban board)
 */
export async function updateArticleStatus(
  id: string, 
  status: ArticleStatus
): Promise<ArticleIdea> {
  const updates: UpdateArticleIdea = { status };
  
  if (status === 'published') {
    updates.publishedAt = new Date().toISOString();
  }

  return updateArticleIdea(id, updates);
}

/**
 * Schedule an article for publication
 */
export async function scheduleArticle(
  id: string, 
  scheduledFor: string
): Promise<ArticleIdea> {
  return updateArticleIdea(id, {
    scheduledFor,
    status: 'planned',
  });
}

/**
 * Mark article as having generated content
 */
export async function linkContentToIdea(
  ideaId: string,
  contentId: string
): Promise<ArticleIdea> {
  return updateArticleIdea(ideaId, {
    hasContent: true,
    contentId,
    generatedAt: new Date().toISOString(),
    status: 'writing',
  });
}

/**
 * Delete an article idea
 */
export async function deleteArticleIdea(id: string): Promise<void> {
  const { error } = await supabase
    .from('ArticleIdea')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting article idea:', error);
    throw error;
  }
}

/**
 * Get article ideas count by status
 */
export async function getArticleIdeasCountByStatus(
  clientId: string,
  projectId?: string
): Promise<Record<ArticleStatus, number>> {
  let query = supabase
    .from('ArticleIdea')
    .select('status')
    .eq('clientId', clientId);

  if (projectId) {
    query = query.eq('projectId', projectId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching article ideas count:', error);
    throw error;
  }

  const counts: Record<ArticleStatus, number> = {
    idea: 0,
    planned: 0,
    writing: 0,
    review: 0,
    published: 0,
  };

  if (data) {
    for (const row of data) {
      const status = (row as { status: ArticleStatus }).status;
      counts[status] = (counts[status] || 0) + 1;
    }
  }

  return counts;
}

/**
 * Get upcoming scheduled articles
 */
export async function getScheduledArticles(
  clientId: string,
  projectId?: string,
  limit: number = 10
): Promise<ArticleIdea[]> {
  let query = supabase
    .from('ArticleIdea')
    .select('*')
    .eq('clientId', clientId)
    .not('scheduledFor', 'is', null)
    .gte('scheduledFor', new Date().toISOString())
    .order('scheduledFor', { ascending: true })
    .limit(limit);

  if (projectId) {
    query = query.eq('projectId', projectId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching scheduled articles:', error);
    throw error;
  }

  return (data || []) as ArticleIdea[];
}
