/**
 * Projects Database Helper Functions
 * Provides functions for managing Projects via Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { generateId, DEFAULT_LANGUAGE } from './utils';

// Create supabase client for this module
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface Project {
  id: string;
  clientId: string;
  name: string;
  websiteUrl: string;
  description: string | null;
  sitemap: Record<string, unknown> | null;
  sitemapScannedAt: string | null;
  targetAudience: string | null;
  brandVoice: string | null;
  niche: string | null;
  keywords: string[];
  contentPillars: string[];
  writingStyle: string | null;
  customInstructions: string | null;
  wordpressUrl: string | null;
  wordpressUsername: string | null;
  wordpressPassword: string | null;
  wordpressCategory: string | null;
  wordpressAutoPublish: boolean;
  isActive: boolean;
  isPrimary: boolean;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProject {
  clientId: string;
  name: string;
  websiteUrl: string;
  description?: string;
  targetAudience?: string;
  brandVoice?: string;
  niche?: string;
  keywords?: string[];
  contentPillars?: string[];
  language?: string;
}

export interface UpdateProject {
  name?: string;
  websiteUrl?: string;
  description?: string;
  targetAudience?: string;
  brandVoice?: string;
  niche?: string;
  keywords?: string[];
  contentPillars?: string[];
  writingStyle?: string;
  customInstructions?: string;
  wordpressUrl?: string;
  wordpressUsername?: string;
  wordpressPassword?: string;
  wordpressCategory?: string;
  wordpressAutoPublish?: boolean;
  isActive?: boolean;
  isPrimary?: boolean;
  language?: string;
}

/**
 * Get all projects for a client
 */
export async function getProjects(clientId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('Project')
    .select('*')
    .eq('clientId', clientId)
    .order('isPrimary', { ascending: false })
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }

  return (data || []) as Project[];
}

/**
 * Get a single project by ID
 */
export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('Project')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching project:', error);
    throw error;
  }

  return data as Project;
}

/**
 * Get project with verification that it belongs to client
 */
export async function getProjectForClient(
  projectId: string, 
  clientId: string
): Promise<Project | null> {
  const { data, error } = await supabase
    .from('Project')
    .select('*')
    .eq('id', projectId)
    .eq('clientId', clientId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching project:', error);
    throw error;
  }

  return data as Project;
}

/**
 * Create a new project
 */
export async function createProject(project: CreateProject): Promise<Project> {
  const id = generateId();
  const now = new Date().toISOString();
  
  const insertData = {
    id,
    clientId: project.clientId,
    name: project.name,
    websiteUrl: project.websiteUrl,
    description: project.description || null,
    targetAudience: project.targetAudience || null,
    brandVoice: project.brandVoice || null,
    niche: project.niche || null,
    keywords: project.keywords || [],
    contentPillars: project.contentPillars || [],
    language: project.language || DEFAULT_LANGUAGE,
    isActive: true,
    isPrimary: false,
    wordpressAutoPublish: false,
    createdAt: now,
    updatedAt: now,
  };

  const { data, error } = await supabase
    .from('Project')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    throw error;
  }

  return data as Project;
}

/**
 * Update a project
 */
export async function updateProject(
  id: string, 
  updates: UpdateProject
): Promise<Project> {
  const updateData = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('Project')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }

  return data as Project;
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('Project')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

/**
 * Set a project as primary (unsets other projects)
 */
export async function setPrimaryProject(
  projectId: string, 
  clientId: string
): Promise<void> {
  const { error: unsetError } = await supabase
    .from('Project')
    .update({ isPrimary: false, updatedAt: new Date().toISOString() })
    .eq('clientId', clientId)
    .neq('id', projectId);

  if (unsetError) {
    console.error('Error unsetting primary projects:', unsetError);
    throw unsetError;
  }

  const { error: setError } = await supabase
    .from('Project')
    .update({ isPrimary: true, updatedAt: new Date().toISOString() })
    .eq('id', projectId);

  if (setError) {
    console.error('Error setting primary project:', setError);
    throw setError;
  }
}

/**
 * Get primary project for a client
 */
export async function getPrimaryProject(clientId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('Project')
    .select('*')
    .eq('clientId', clientId)
    .eq('isPrimary', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      const { data: firstProject } = await supabase
        .from('Project')
        .select('*')
        .eq('clientId', clientId)
        .order('createdAt', { ascending: true })
        .limit(1)
        .single();
      
      return firstProject as Project | null;
    }
    console.error('Error fetching primary project:', error);
    throw error;
  }

  return data as Project;
}

/**
 * Get project count for a client
 */
export async function getProjectCount(clientId: string): Promise<number> {
  const { count, error } = await supabase
    .from('Project')
    .select('*', { count: 'exact', head: true })
    .eq('clientId', clientId);

  if (error) {
    console.error('Error counting projects:', error);
    throw error;
  }

  return count || 0;
}
