'use client';

import { useState, useEffect } from 'react';

export default function ArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/articles/list');
      const data = await response.json();
      if (response.ok) {
        setArticles(data.articles || []);
      }
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleUpdate = async (articleId: string) => {
    if (!confirm('Weet je zeker dat je dit artikel wilt updaten met nieuwe AI content?')) {
      return;
    }

    setUpdating(articleId);
    try {
      const response = await fetch('/api/articles/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update article');
      }

      alert('✅ Artikel succesvol geüpdatet!');
      loadArticles();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-500/20 text-gray-400 border-gray-500',
      published: 'bg-green-500/20 text-green-400 border-green-500',
    };
    const labels: Record<string, string> = {
      draft: 'Concept',
      published: 'Gepubliceerd',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="p-6 lg:p-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Artikelen</h1>
          <p className="text-gray-400 text-lg">
            Overzicht van al je gegenereerde artikelen
          </p>
        </div>

        {loading ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
            <div className="text-center py-12 text-gray-400">
              Artikelen laden...
            </div>
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✍️</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Nog geen artikelen
              </h3>
              <p className="text-gray-400 mb-6">
                Genereer je eerste artikel met de AI Generator
              </p>
              <a
                href="/dashboard/generate"
                className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 transition-all"
              >
                Genereer Artikel
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-orange-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        {article.title}
                      </h3>
                      {getStatusBadge(article.status)}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>📝 {article.project?.name || 'Unknown Project'}</span>
                      <span>
                        📅 {new Date(article.created_at).toLocaleDateString('nl-NL')}
                      </span>
                      {article.published_at && (
                        <span>
                          ✅ Gepubliceerd: {new Date(article.published_at).toLocaleDateString('nl-NL')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {article.status === 'published' && (
                    <button
                      onClick={() => handleUpdate(article.id)}
                      disabled={updating === article.id}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
                    >
                      {updating === article.id ? '🔄 Updaten...' : '🔄 Update met AI'}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const preview = window.open('', '_blank');
                      if (preview) {
                        preview.document.write(`
                          <html>
                            <head>
                              <title>${article.title}</title>
                              <style>
                                body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
                                h1 { color: #333; }
                                h2 { color: #555; margin-top: 30px; }
                                p { line-height: 1.6; color: #666; }
                              </style>
                            </head>
                            <body>
                              <h1>${article.title}</h1>
                              ${article.content}
                            </body>
                          </html>
                        `);
                      }
                    }}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all"
                  >
                    👁️ Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
