'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Article {
  id: string;
  title: string;
  content: string;
  project_id: string;
  status: 'draft' | 'published';
  created_at: string;
  slug?: string;
  excerpt?: string;
}

interface Project {
  id: string;
  name: string;
  website_url: string;
  wp_url?: string;
  wp_username?: string;
}

export default function LibraryPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      // Load articles
      const articlesRes = await fetch('/api/articles/list');
      if (articlesRes.ok) {
        const articlesData = await articlesRes.json();
        setArticles(articlesData.articles || []);
      }

      // Load projects
      const projectsRes = await fetch('/api/projects/list');
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects || []);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Fout bij laden data');
    } finally {
      setLoading(false);
    }
  }

  function getProject(projectId: string) {
    return projects.find(p => p.id === projectId);
  }

  function getProjectName(projectId: string) {
    const project = getProject(projectId);
    return project?.name || 'Onbekend Project';
  }

  function isWordPressConfigured(projectId: string) {
    const project = getProject(projectId);
    return project?.wp_url && project?.wp_username;
  }

  function isWritGoBlog(projectId: string) {
    const project = getProject(projectId);
    if (!project) return false;
    return project.website_url.toLowerCase().includes('writgo.nl');
  }

  function openEditor(article: Article) {
    localStorage.setItem('generatedArticle', JSON.stringify({
      title: article.title,
      content: article.content,
      word_count: article.content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 0).length,
      project_id: article.project_id
    }));
    
    const project = projects.find(p => p.id === article.project_id);
    if (project) {
      localStorage.setItem('selectedProject', JSON.stringify(project));
    }
    
    router.push('/dashboard/editor');
  }

  async function publishArticle(article: Article) {
    setPublishing(true);
    setSelectedArticle(article);
    setError(null);
    
    try {
      const isWritGo = isWritGoBlog(article.project_id);
      const hasWordPress = isWordPressConfigured(article.project_id);
      
      if (isWritGo) {
        // WritGo Blog - update status to published
        const response = await fetch('/api/articles/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: article.id,
            status: 'published',
            published_at: new Date().toISOString(),
            slug: article.slug || article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to publish');
        }

        alert(`✅ Artikel gepubliceerd op WritGo Blog!`);
      } else if (hasWordPress) {
        // WordPress - publish via API
        const response = await fetch('/api/wordpress/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: article.project_id,
            article_id: article.id
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to publish to WordPress');
        }

        alert(`✅ Artikel gepubliceerd op WordPress!\n\n${data.url || 'Bekijk op je website'}`);
      } else {
        // No WordPress configured
        alert('⚠️ WordPress is niet geconfigureerd voor dit project.\n\nGa naar Projecten om WordPress credentials toe te voegen, of download het artikel als HTML.');
        setPublishing(false);
        setSelectedArticle(null);
        return;
      }
      
      // Reload articles
      loadData();
    } catch (err: any) {
      console.error('Publish error:', err);
      setError(err.message || 'Fout bij publiceren');
      alert(`❌ ${err.message || 'Fout bij publiceren'}`);
    } finally {
      setPublishing(false);
      setSelectedArticle(null);
    }
  }

  function downloadArticle(article: Article) {
    const wordCount = article.content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 0).length;
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.title}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px; 
            margin: 50px auto; 
            padding: 20px; 
            line-height: 1.8;
            color: #333;
        }
        h1 { color: #1a1a1a; margin-bottom: 20px; font-size: 2.5em; }
        h2 { color: #333; margin-top: 40px; font-size: 1.8em; }
        h3 { color: #444; margin-top: 30px; font-size: 1.4em; }
        p { margin-bottom: 1.2em; }
        ul, ol { margin-bottom: 1.2em; padding-left: 2em; }
        li { margin-bottom: 0.5em; }
        blockquote { 
            border-left: 4px solid #f97316; 
            padding-left: 20px; 
            margin: 20px 0;
            color: #666;
            font-style: italic;
        }
        strong { color: #1a1a1a; }
        .meta { 
            color: #666; 
            margin-bottom: 30px; 
            padding-bottom: 20px; 
            border-bottom: 2px solid #eee;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <h1>${article.title}</h1>
    <div class="meta">
        <strong>Woorden:</strong> ${wordCount.toLocaleString()}<br>
        <strong>Project:</strong> ${getProjectName(article.project_id)}<br>
        <strong>Datum:</strong> ${new Date(article.created_at).toLocaleDateString('nl-NL')}
    </div>
    <div class="content">${article.content}</div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${article.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  function copyToClipboard(article: Article) {
    // Strip HTML tags for plain text
    const plainText = article.content.replace(/<[^>]*>/g, '\n').replace(/\n\s*\n/g, '\n\n').trim();
    const fullText = `${article.title}\n\n${plainText}`;
    
    navigator.clipboard.writeText(fullText).then(() => {
      alert('✅ Artikel gekopieerd naar klembord!');
    }).catch(() => {
      alert('❌ Kon niet kopiëren. Probeer handmatig te kopiëren.');
    });
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-12 flex items-center justify-center">
        <div className="text-white text-xl">⏳ Laden...</div>
      </div>
    );
  }

  const draftCount = articles.filter(a => a.status === 'draft').length;
  const publishedCount = articles.filter(a => a.status === 'published').length;
  const totalWords = articles.reduce((sum, a) => {
    const count = a.content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 0).length;
    return sum + count;
  }, 0);

  return (
    <div className="p-6 lg:p-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📚 Bibliotheek</h1>
          <p className="text-gray-400 text-lg">
            Beheer al je opgeslagen content
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-red-400">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">✕</button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="text-4xl font-bold text-orange-500 mb-2">{articles.length}</div>
            <div className="text-gray-400">Totaal Artikelen</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="text-4xl font-bold text-yellow-500 mb-2">{draftCount}</div>
            <div className="text-gray-400">Concepten</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="text-4xl font-bold text-green-500 mb-2">{publishedCount}</div>
            <div className="text-gray-400">Gepubliceerd</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="text-4xl font-bold text-white mb-2">{totalWords.toLocaleString()}</div>
            <div className="text-gray-400">Totaal Woorden</div>
          </div>
        </div>

        {/* Articles List */}
        {articles.length === 0 ? (
          <div className="bg-gray-800/30 border-2 border-dashed border-gray-700 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-white mb-2">Geen Artikelen</h3>
            <p className="text-gray-400 mb-6">
              Je hebt nog geen artikelen opgeslagen. Ga naar Content Plan om te beginnen.
            </p>
            <button
              onClick={() => router.push('/dashboard/content-plan')}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 transition-all"
            >
              Ga naar Content Plan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => {
              const isWritGo = isWritGoBlog(article.project_id);
              const hasWordPress = isWordPressConfigured(article.project_id);
              const wordCount = article.content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 0).length;
              
              return (
                <div
                  key={article.id}
                  className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-orange-500/50 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-bold text-white">{article.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          article.status === 'published' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {article.status === 'published' ? '✓ Gepubliceerd' : '○ Concept'}
                        </span>
                        {isWritGo && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400">
                            🟠 WritGo Blog
                          </span>
                        )}
                        {!isWritGo && hasWordPress && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                            🔗 WordPress
                          </span>
                        )}
                        {!isWritGo && !hasWordPress && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                            ○ Geen WP
                          </span>
                        )}
                      </div>
                      <div className="flex gap-4 text-sm text-gray-400 mb-3">
                        <span>📝 {wordCount.toLocaleString()} woorden</span>
                        <span>📁 {getProjectName(article.project_id)}</span>
                        <span>📅 {new Date(article.created_at).toLocaleDateString('nl-NL')}</span>
                      </div>
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {article.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => openEditor(article)}
                      className="flex-1 min-w-[120px] bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all"
                    >
                      📝 Bewerken
                    </button>
                    <button
                      onClick={() => copyToClipboard(article)}
                      className="flex-1 min-w-[120px] bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium transition-all"
                    >
                      📋 Kopiëren
                    </button>
                    <button
                      onClick={() => downloadArticle(article)}
                      className="flex-1 min-w-[120px] bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-all"
                    >
                      💾 Download
                    </button>
                    <button
                      onClick={() => publishArticle(article)}
                      disabled={publishing && selectedArticle?.id === article.id}
                      className="flex-1 min-w-[120px] bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg hover:shadow-orange-500/50 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                    >
                      {publishing && selectedArticle?.id === article.id 
                        ? '⏳ Publiceren...' 
                        : isWritGo 
                          ? '🚀 Publiceer Blog' 
                          : hasWordPress
                            ? '🚀 Publiceer WP'
                            : '🚀 Publiceer'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
