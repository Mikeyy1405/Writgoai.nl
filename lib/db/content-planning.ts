/**
 * Content Planning Database Helper Functions
 * Provides functions for managing SitePlans and ArticleIdeas via Supabase
 */

import { supabase } from '@/lib/supabase';
import type {
  ArticleIdea,
  SitePlan,
  CreateArticleIdea,
  UpdateArticleIdea,
  CreateSitePlan,
  ArticleIdeaFilters,
  ArticleStatus,
} from '@/types/database';

/**
 * Generate a slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

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
      // No rows returned
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
  
  const { data, error } = await supabase
    .from('SitePlan')
    .upsert({
      id,
      ...plan,
      generatedAt: now,
      createdAt: now,
      updatedAt: now,
    }, {
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

  // Apply filters
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

  // Order by priority and creation date
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
  
  // Ensure slug is unique
  const slug = idea.slug || generateSlug(idea.title);
  
  const { data, error } = await supabase
    .from('ArticleIdea')
    .insert({
      id,
      ...idea,
      slug,
      status: idea.status || 'idea',
      priority: idea.priority || 'medium',
      hasContent: false,
      trending: false,
      seasonal: false,
      competitorGap: false,
      createdAt: now,
      updatedAt: now,
      language: idea.language || 'NL',
    })
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
    ...idea,
    slug: idea.slug || generateSlug(idea.title),
    status: idea.status || 'idea',
    priority: idea.priority || 'medium',
    hasContent: false,
    trending: false,
    seasonal: false,
    competitorGap: false,
    createdAt: now,
    updatedAt: now,
    language: idea.language || 'NL',
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
  const { data, error } = await supabase
    .from('ArticleIdea')
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
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
  
  // Set timestamps based on status
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
    .select('status', { count: 'exact' })
    .eq('clientId', clientId);

  if (projectId) {
    query = query.eq('projectId', projectId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching article ideas count:', error);
    throw error;
  }

  // Group by status
  const counts: Record<ArticleStatus, number> = {
    idea: 0,
    planned: 0,
    writing: 0,
    review: 0,
    published: 0,
  };

  if (data) {
    for (const row of data) {
      const status = row.status as ArticleStatus;
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
