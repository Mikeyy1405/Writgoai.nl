'use client';

import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published_at: string;
  focus_keyword?: string;
}

interface RelatedArticlesProps {
  currentSlug: string;
  currentKeyword?: string;
  limit?: number;
}

export default function RelatedArticles({ 
  currentSlug, 
  currentKeyword,
  limit = 3 
}: RelatedArticlesProps) {
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadRelated() {
      try {
        const response = await fetch(`/api/articles/related?slug=${currentSlug}&keyword=${currentKeyword || ''}&limit=${limit}`);
        const data = await response.json();
        setArticles(data.articles || []);
      } catch (error) {
        console.error('Failed to load related articles:', error);
      } finally {
        setLoading(false);
      }
    }
    loadRelated();
  }, [currentSlug, currentKeyword, limit]);

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Gerelateerde artikelen</h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (articles.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-orange-50 to-gray-50 rounded-lg p-6 border border-orange-100">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <span className="text-orange-600 mr-2">📚</span>
        Gerelateerde artikelen
      </h3>
      <div className="space-y-4">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/blog/${article.slug}`}
            className="block group hover:bg-white rounded-lg p-4 transition-all duration-200"
          >
            <h4 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors mb-1">
              {article.title}
            </h4>
            <p className="text-sm text-gray-600 line-clamp-2">
              {article.excerpt}
            </p>
            {article.focus_keyword && (
              <span className="inline-block mt-2 text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                {article.focus_keyword}
              </span>
            )}
          </Link>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-orange-200">
        <Link
          href="/blog"
          className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center"
        >
          Bekijk alle artikelen
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

// Add React import
import React from 'react';
