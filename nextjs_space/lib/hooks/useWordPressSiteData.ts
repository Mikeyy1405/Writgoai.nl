'use client';

import { useWordPressData } from '@/lib/contexts/WordPressDataContext';

/**
 * Hook to easily access WordPress categories
 */
export function useWordPressCategories() {
  const { data, loading } = useWordPressData();
  return { categories: data?.categories || [], loading };
}

/**
 * Hook to easily access WordPress posts
 */
export function useWordPressPosts() {
  const { data, loading } = useWordPressData();
  return { posts: data?.posts || [], loading };
}

/**
 * Hook to easily access WordPress pages
 */
export function useWordPressPages() {
  const { data, loading } = useWordPressData();
  return { pages: data?.pages || [], loading };
}

/**
 * Hook to easily access WordPress tags
 */
export function useWordPressTags() {
  const { data, loading } = useWordPressData();
  return { tags: data?.tags || [], loading };
}

/**
 * Hook to easily access WordPress sitemap
 */
export function useWordPressSitemap() {
  const { data, loading } = useWordPressData();
  return { sitemap: data?.sitemap, loading };
}

/**
 * Hook to find relevant internal links for a given topic
 * Uses simple keyword matching to find relevant posts/pages from the sitemap
 */
export function useInternalLinks(topic?: string, limit: number = 5) {
  const { data } = useWordPressData();
  
  if (!data?.sitemap?.pages || !topic) {
    return [];
  }
  
  // Simple relevance matching
  const topicWords = topic.toLowerCase().split(' ').filter(word => word.length > 3);
  
  return data.sitemap.pages
    .filter(page => page.type === 'post')
    .map(page => {
      const titleLower = page.title.toLowerCase();
      const urlLower = page.url.toLowerCase();
      
      const relevance = topicWords.filter(word => 
        titleLower.includes(word) || urlLower.includes(word)
      ).length;
      
      return {
        ...page,
        relevance
      };
    })
    .filter(page => page.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}
