'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Article {
  id: string;
  title: string;
  content: string;
  word_count: number;
  project_id: string;
  status: 'draft' | 'published';
  created_at: string;
}

interface Project {
  id: string;
  name: string;
}

export default function LibraryPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
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
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getProjectName(projectId: string) {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Onbekend Project';
  }

  function openEditor(article: Article) {
    // Set article in localStorage and navigate to editor
    localStorage.setItem('generatedArticle', JSON.stringify({
      title: article.title,
      content: article.content,
      word_count: article.word_count,
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
    
    try {
      const response = await fetch('/api/wordpress/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          content: article.content
        })
      });

      if (!response.ok) throw new Error('Failed to publish');

      const data = await response.json();
      alert(`✅ Artikel gepubliceerd!\n\n${data.url || 'Bekijk op je website'}`);
      
      // Reload articles
      loadData();
    } catch (error) {
      console.error('Publish error:', error);
      alert('❌ Fout bij publiceren. Check je WordPress instellingen.');
    } finally {
      setPublishing(false);
      setSelectedArticle(null);
    }
  }

  function downloadArticle(article: Article) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.title}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 50px auto; 
            padding: 20px; 
            line-height: 1.6; 
        }
        h1 { color: #333; margin-bottom: 20px; }
        .meta { color: #666; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #eee; }
        .content { color: #444; }
    </style>
</head>
<body>
    <h1>${article.title}</h1>
    <div class="meta">
        <strong>Woorden:</strong> ${article.word_count}<br>
        <strong>Project:</strong> ${getProjectName(article.project_id)}
    </div>
    <div class="content">${article.content.replace(/\n/g, '<br><br>')}</div>
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

    alert('✅ Artikel gedownload!');
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
  const totalWords = articles.reduce((sum, a) => sum + a.word_count, 0);

  return (
    <div className="p-6 lg:p-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📚 Bibliotheek</h1>
          <p className="text-gray-400 text-lg">
            Beheer al je opgeslagen content
          </p>
        </div>

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
            {articles.map((article) => (
              <div
                key={article.id}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-orange-500/50 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{article.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        article.status === 'published' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {article.status === 'published' ? '✓ Gepubliceerd' : '○ Concept'}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-400 mb-3">
                      <span>📝 {article.word_count} woorden</span>
                      <span>📁 {getProjectName(article.project_id)}</span>
                      <span>📅 {new Date(article.created_at).toLocaleDateString('nl-NL')}</span>
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {article.content.substring(0, 150)}...
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => openEditor(article)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all"
                  >
                    📝 Bewerken
                  </button>
                  <button
                    onClick={() => downloadArticle(article)}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-all"
                  >
                    💾 Download
                  </button>
                  <button
                    onClick={() => publishArticle(article)}
                    disabled={publishing && selectedArticle?.id === article.id}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg hover:shadow-orange-500/50 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                  >
                    {publishing && selectedArticle?.id === article.id ? '⏳ Publiceren...' : '🚀 Publiceren'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
