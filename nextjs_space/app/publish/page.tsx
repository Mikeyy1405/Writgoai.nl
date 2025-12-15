'use client';

import { useState, useEffect } from 'react';
import SimplifiedLayout from '@/components/SimplifiedLayout';
import { Send, Loader2, ExternalLink, Eye, Trash2 } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  metaDesc: string;
  thumbnailUrl: string;
  wordCount: number;
  createdAt: string;
  projectId: string;
}

export default function PublishPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishTarget, setPublishTarget] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/simplified/generate');
      if (response.ok) {
        const data = await response.json();
        setArticles(data.articles);
        
        // Initialize publish targets
        const targets: { [key: string]: string } = {};
        data.articles.forEach((article: Article) => {
          targets[article.id] = 'both';
        });
        setPublishTarget(targets);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (articleId: string) => {
    const target = publishTarget[articleId] || 'both';
    setPublishing(articleId);

    try {
      const response = await fetch('/api/simplified/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          publishTo: target,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to publish');
      }

      const data = await response.json();
      
      // Check for errors
      if (data.results.wordpress && !data.results.wordpress.success) {
        alert(`WordPress error: ${data.results.wordpress.error}`);
      } else if (data.results.social && !data.results.social.success) {
        alert(`Social media error: ${data.results.social.error}`);
      } else {
        alert('Artikel succesvol gepubliceerd! 🎉');
        // Refresh list
        fetchArticles();
      }
    } catch (error: any) {
      console.error('Error publishing:', error);
      alert(`Er ging iets mis: ${error.message}`);
    } finally {
      setPublishing(null);
    }
  };

  if (loading) {
    return (
      <SimplifiedLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </SimplifiedLayout>
    );
  }

  if (articles.length === 0) {
    return (
      <SimplifiedLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800">🚀 Publiceren</h1>
            <p className="text-lg text-slate-600 mt-2">
              Publiceer je content naar WordPress en social media
            </p>
          </div>
          <div className="bg-white rounded-xl p-12 text-center shadow-lg">
            <Send className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Nog geen artikelen om te publiceren
            </h2>
            <p className="text-slate-600 mb-4">
              Genereer eerst content om te publiceren.
            </p>
            <a
              href="/generate"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:shadow-xl transition-shadow"
            >
              <Send className="w-5 h-5" />
              <span>Content Genereren</span>
            </a>
          </div>
        </div>
      </SimplifiedLayout>
    );
  }

  return (
    <SimplifiedLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">🚀 Publiceren</h1>
          <p className="text-lg text-slate-600 mt-2">
            {articles.length} artikel{articles.length !== 1 ? 'en' : ''} klaar om te publiceren
          </p>
        </div>

        <div className="space-y-4">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-white rounded-xl p-6 shadow-lg border border-slate-200"
            >
              <div className="flex gap-6">
                {/* Thumbnail */}
                {article.thumbnailUrl && (
                  <div className="w-48 h-32 flex-shrink-0">
                    <img
                      src={article.thumbnailUrl}
                      alt={article.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                    {article.metaDesc}
                  </p>
                  <div className="flex items-center space-x-3 text-xs text-slate-500">
                    <span>📝 {article.wordCount} woorden</span>
                    <span>•</span>
                    <span>
                      📅 {new Date(article.createdAt).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-3 w-64 flex-shrink-0">
                  <label className="text-xs font-semibold text-slate-700">
                    Publiceer naar:
                  </label>
                  <select
                    value={publishTarget[article.id]}
                    onChange={(e) =>
                      setPublishTarget({
                        ...publishTarget,
                        [article.id]: e.target.value,
                      })
                    }
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    disabled={publishing === article.id}
                  >
                    <option value="both">WordPress + Socials</option>
                    <option value="wordpress">Alleen WordPress</option>
                    <option value="social">Alleen Socials</option>
                  </select>

                  <button
                    onClick={() => handlePublish(article.id)}
                    disabled={publishing === article.id}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center justify-center space-x-2 text-sm font-semibold"
                  >
                    {publishing === article.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Publiceren...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Publiceer</span>
                      </>
                    )}
                  </button>

                  <details className="text-xs">
                    <summary className="cursor-pointer text-slate-600 hover:text-orange-600">
                      Preview
                    </summary>
                    <div
                      className="mt-2 max-h-32 overflow-y-auto prose prose-xs"
                      dangerouslySetInnerHTML={{
                        __html: article.content.substring(0, 300) + '...',
                      }}
                    />
                  </details>
                </div>
              </div>

              {publishing === article.id && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-700 font-semibold">
                      Bezig met publiceren...
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Dit kan tot 30 seconden duren. Even geduld.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-bold text-slate-800 mb-2">💡 Tips</h3>
          <ul className="text-sm text-slate-700 space-y-1">
            <li>
              • WordPress: Zorg dat je project de juiste WordPress credentials heeft
            </li>
            <li>
              • Socials: Configureer je GetLate.dev API key in je project instellingen
            </li>
            <li>
              • Artikelen worden automatisch verwijderd uit deze lijst na succesvolle publicatie
            </li>
          </ul>
        </div>
      </div>
    </SimplifiedLayout>
  );
}
