'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { SitemapData } from '@/lib/sitemap-loader';
import { useProject } from './ProjectContext';

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
}

export interface WordPressPost {
  id: number;
  title: string;
  link: string;
  excerpt?: string;
  status: string;
}

export interface WordPressPage {
  id: number;
  title: string;
  link: string;
  excerpt?: string;
  status: string;
}

export interface WordPressTag {
  id: number;
  name: string;
  slug: string;
}

export interface WordPressData {
  categories: WordPressCategory[];
  posts: WordPressPost[];
  pages: WordPressPage[];
  tags: WordPressTag[];
  sitemap: SitemapData | null;
}

interface WordPressDataContextType {
  data: WordPressData | null;
  loading: boolean;
  error: string | null;
  loadWordPressData: (projectId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  clearData: () => void;
}

const WordPressDataContext = createContext<WordPressDataContextType | undefined>(undefined);

const CACHE_KEY_PREFIX = 'wp_data_';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  data: WordPressData;
  timestamp: number;
}

export function WordPressDataProvider({ children }: { children: React.ReactNode }) {
  const { currentProject } = useProject();
  const [data, setData] = useState<WordPressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastProjectId, setLastProjectId] = useState<string | null>(null);

  // Load data from cache
  const loadFromCache = useCallback((projectId: string): WordPressData | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${projectId}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const { data, timestamp }: CachedData = JSON.parse(cached);
        
        // Check if cache is still valid
        if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
          console.log('✅ WordPress data loaded from cache');
          return data;
        } else {
          // Cache expired, remove it
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (err) {
      console.error('Error loading from cache:', err);
    }
    
    return null;
  }, []);

  // Save data to cache
  const saveToCache = useCallback((projectId: string, data: WordPressData) => {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${projectId}`;
      const cachedData: CachedData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cachedData));
    } catch (err) {
      console.error('Error saving to cache:', err);
    }
  }, []);

  // Load WordPress data for a project
  const loadWordPressData = useCallback(async (projectId: string) => {
    if (!projectId) {
      console.warn('No project ID provided');
      return;
    }

    // Check cache first
    const cachedData = loadFromCache(projectId);
    if (cachedData) {
      setData(cachedData);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📡 Loading WordPress data for project:', projectId);
      
      const response = await fetch('/api/client/wordpress/site-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to load WordPress data: ${response.status}`);
      }

      const wordpressData: WordPressData = await response.json();
      
      setData(wordpressData);
      saveToCache(projectId, wordpressData);
      
      console.log('✅ WordPress data loaded:', {
        categories: wordpressData.categories.length,
        posts: wordpressData.posts.length,
        pages: wordpressData.pages.length,
        tags: wordpressData.tags.length,
        sitemapPages: wordpressData.sitemap?.totalPages || 0,
      });
    } catch (err: any) {
      console.error('❌ Error loading WordPress data:', err);
      setError(err.message || 'Failed to load WordPress data');
      // Set empty data on error so components don't break
      setData({
        categories: [],
        posts: [],
        pages: [],
        tags: [],
        sitemap: null,
      });
    } finally {
      setLoading(false);
    }
  }, [loadFromCache, saveToCache]);

  // Refresh data for current project
  const refreshData = useCallback(async () => {
    if (currentProject?.id) {
      await loadWordPressData(currentProject.id);
    }
  }, [currentProject?.id, loadWordPressData]);

  // Clear data
  const clearData = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  // Auto-load WordPress data when project changes
  useEffect(() => {
    if (currentProject?.id && currentProject.id !== lastProjectId && !loading) {
      console.log('[WordPressData] Project changed, loading WordPress data...');
      setLastProjectId(currentProject.id);
      loadWordPressData(currentProject.id);
    }
  }, [currentProject?.id, lastProjectId, loading, loadWordPressData]);

  const value: WordPressDataContextType = {
    data,
    loading,
    error,
    loadWordPressData,
    refreshData,
    clearData,
  };

  return (
    <WordPressDataContext.Provider value={value}>
      {children}
    </WordPressDataContext.Provider>
  );
}

export function useWordPressData() {
  const context = useContext(WordPressDataContext);
  
  if (context === undefined) {
    throw new Error('useWordPressData must be used within a WordPressDataProvider');
  }
  
  return context;
}

/**
 * Hook to automatically load WordPress data when project switches
 * Usage: Call this in components that need WordPress data to stay synced with the current project
 */
export function useWordPressDataSync(currentProjectId: string | null) {
  const { loadWordPressData, loading } = useWordPressData();
  const [lastProjectId, setLastProjectId] = useState<string | null>(null);

  useEffect(() => {
    // Load data when project changes and not already loading
    if (currentProjectId && currentProjectId !== lastProjectId && !loading) {
      console.log('[useWordPressDataSync] Project changed, loading WordPress data for:', currentProjectId);
      loadWordPressData(currentProjectId);
      setLastProjectId(currentProjectId);
    }
  }, [currentProjectId, lastProjectId, loadWordPressData, loading]);
}
