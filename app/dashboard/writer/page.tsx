'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ContentIdea {
  title: string;
  category: string;
  description: string;
  keywords: string[];
  contentType?: string;
  cluster?: string;
  project_id?: string;
  language?: string;
  searchVolume?: number | null;
  competition?: string | null;
  cpc?: number | null;
  keywordDifficulty?: number | null;
}

interface Article {
  title: string;
  content: string;
  word_count: number;
  project_id?: string;
  featured_image?: string;
  slug?: string;
  metaDescription?: string;
}

interface Project {
  id: string;
  name: string;
  website_url: string;
}

interface ProgressData {
  step: number;
  totalSteps: number;
  progress: number;
  message: string;
  detail: string;
  outline?: any;
}

export default function WriterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [idea, setIdea] = useState<ContentIdea | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(2000);
  const [viewMode, setViewMode] = useState<'preview' | 'html'>('preview');
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('nl');
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    loadArticleData();
  }, [searchParams]);

  async function loadArticleData() {
    setLoading(true);
    
    const projectId = searchParams.get('project');
    const articleIndex = searchParams.get('article');
    const titleParam = searchParams.get('title');
    const keywordParam = searchParams.get('keyword');
    const typeParam = searchParams.get('type');

    // Load project info
    if (projectId) {
      try {
        const projectResponse = await fetch(`/api/projects/list`);
        const projectData = await projectResponse.json();
        const foundProject = projectData.projects?.find((p: Project) => p.id === projectId);
        if (foundProject) {
          setProject(foundProject);
        }
      } catch (e) {
        console.error('Failed to load project:', e);
      }
    }

    // Method 1: Load from database via article index
    if (projectId && articleIndex !== null) {
      try {
        const response = await fetch(`/api/content-plan/article?project_id=${projectId}&index=${articleIndex}`);
        const data = await response.json();
        
        if (data.article) {
          setIdea({
            title: data.article.title,
            category: data.article.category || '',
            description: data.article.description || '',
            keywords: data.article.keywords || [],
            contentType: data.article.contentType || 'article',
            cluster: data.article.cluster,
            searchVolume: data.article.searchVolume,
            competition: data.article.competition,
            cpc: data.article.cpc,
            keywordDifficulty: data.article.keywordDifficulty,
          });
          setLanguage(data.article.language || 'nl');
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Failed to load article from database:', e);
      }
    }

    // Method 2: Load from URL params (for direct links)
    if (titleParam && keywordParam) {
      setIdea({
        title: titleParam,
        category: '',
        description: '',
        keywords: [keywordParam],
        contentType: typeParam || 'article',
      });
      setLoading(false);
      return;
    }

    // Method 3: Fallback to localStorage (backward compatibility)
    const savedIdea = localStorage.getItem('selectedContentIdea') || localStorage.getItem('selectedIdea');
    const savedLanguage = localStorage.getItem('contentLanguage');
    
    if (savedIdea) {
      setIdea(JSON.parse(savedIdea));
      if (savedLanguage) setLanguage(savedLanguage);
      setLoading(false);
      return;
    }

    // No article found - redirect to content plan
    setLoading(false);
    alert('Geen artikel geselecteerd! Ga eerst naar Content Plan.');
    router.push('/dashboard/content-plan');
  }

  async function generateArticle() {
    if (!idea) return;
    
    setGenerating(true);
    setError(null);
    setProgress(null);
    setArticle(null);
    
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch('/api/generate/article-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: idea.title,
          keyword: idea.keywords[0] || idea.title,
          description: idea.description,
          contentType: idea.contentType,
          wordCount,
          language,
          websiteUrl: project?.website_url,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to start article generation');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'progress') {
                setProgress(data);
              } else if (data.type === 'complete') {
                setArticle(data.article);
                setProgress(null);
              } else if (data.type === 'error') {
                setError(data.message);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Er is een fout opgetreden');
      }
    } finally {
      setGenerating(false);
    }
  }

  function cancelGeneration() {
    abortControllerRef.current?.abort();
    setGenerating(false);
    setProgress(null);
  }

  async function publishToWordPress() {
    if (!article || !project) {
      alert('Geen artikel of project beschikbaar');
      return;
    }

    try {
      const response = await fetch('/api/wordpress/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          title: article.title,
          content: article.content,
          featured_image: article.featured_image,
          slug: article.slug,
          meta_description: article.metaDescription,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Artikel gepubliceerd naar WordPress!');
      } else {
        alert('Fout bij publiceren: ' + (data.error || 'Onbekende fout'));
      }
    } catch (e) {
      alert('Fout bij publiceren naar WordPress');
    }
  }

  function copyToClipboard() {
    if (article) {
      navigator.clipboard.writeText(article.content);
      alert('Artikel gekopieerd naar klembord!');
    }
  }

  function downloadAsHTML() {
    if (article) {
      const blob = new Blob([article.content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${article.slug || 'artikel'}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Artikel laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">✍️ Artikel Schrijver</h1>
            <p className="text-gray-400 mt-1">AI-powered content generatie</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/content-plan')}
            className="text-gray-400 hover:text-white transition"
          >
            ← Terug naar Content Plan
          </button>
        </div>

        {/* Article Info */}
        {idea && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">{idea.title}</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <span className="text-gray-500 text-sm">Type</span>
                <p className="text-white">{idea.contentType || 'Artikel'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Cluster</span>
                <p className="text-white">{idea.cluster || '-'}</p>
              </div>
              {idea.searchVolume && (
                <div>
                  <span className="text-gray-500 text-sm">Zoekvolume</span>
                  <p className="text-green-400 font-semibold">{idea.searchVolume.toLocaleString()}/maand</p>
                </div>
              )}
              {idea.competition && (
                <div>
                  <span className="text-gray-500 text-sm">Concurrentie</span>
                  <p className={`font-semibold ${
                    idea.competition === 'LOW' ? 'text-green-400' :
                    idea.competition === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
                  }`}>{idea.competition}</p>
                </div>
              )}
            </div>

            {idea.description && (
              <p className="text-gray-400 mb-4">{idea.description}</p>
            )}

            {idea.keywords && idea.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {idea.keywords.map((kw, i) => (
                  <span key={i} className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Generation Controls */}
        {!article && !generating && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Generatie Instellingen</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Aantal woorden</label>
                <select
                  value={wordCount}
                  onChange={(e) => setWordCount(Number(e.target.value))}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-orange-500 focus:outline-none"
                >
                  <option value={1000}>~1000 woorden</option>
                  <option value={1500}>~1500 woorden</option>
                  <option value={2000}>~2000 woorden</option>
                  <option value={2500}>~2500 woorden</option>
                  <option value={3000}>~3000 woorden</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Taal</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-orange-500 focus:outline-none"
                >
                  <option value="nl">Nederlands</option>
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>

            <button
              onClick={generateArticle}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/50 transition"
            >
              🚀 Genereer Artikel
            </button>
          </div>
        )}

        {/* Progress */}
        {generating && progress && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{progress.message}</h3>
              <button
                onClick={cancelGeneration}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Annuleren
              </button>
            </div>
            
            <div className="mb-2">
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>
            
            <p className="text-gray-400 text-sm">{progress.detail}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-6 mb-6">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-4 text-sm text-red-400 hover:text-red-300"
            >
              Sluiten
            </button>
          </div>
        )}

        {/* Generated Article */}
        {article && (
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            {/* Article Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{article.title}</h2>
                  <p className="text-gray-400 text-sm mt-1">{article.word_count} woorden</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode(viewMode === 'preview' ? 'html' : 'preview')}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    {viewMode === 'preview' ? 'HTML' : 'Preview'}
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    📋 Kopiëren
                  </button>
                  <button
                    onClick={downloadAsHTML}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    ⬇️ Download
                  </button>
                  {project && (
                    <button
                      onClick={publishToWordPress}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                    >
                      🚀 Publiceren
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="p-6 max-h-[600px] overflow-y-auto">
              {viewMode === 'preview' ? (
                <div 
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
              ) : (
                <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono bg-gray-900 p-4 rounded-lg">
                  {article.content}
                </pre>
              )}
            </div>

            {/* Featured Image */}
            {article.featured_image && (
              <div className="p-6 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Featured Image</h3>
                <img 
                  src={article.featured_image} 
                  alt={article.title}
                  className="max-w-md rounded-lg"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
