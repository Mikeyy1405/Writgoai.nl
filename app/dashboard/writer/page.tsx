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
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const savedIdea = localStorage.getItem('selectedIdea');
    const savedProject = localStorage.getItem('selectedProject');
    
    const titleParam = searchParams.get('title');
    const keywordParam = searchParams.get('keyword');
    const typeParam = searchParams.get('type');
    
    if (titleParam && keywordParam) {
      setIdea({
        title: titleParam,
        category: '',
        description: '',
        keywords: [keywordParam],
        contentType: typeParam || 'article',
      });
    } else if (savedIdea) {
      setIdea(JSON.parse(savedIdea));
    } else {
      alert('Geen idee geselecteerd! Ga eerst naar Content Plan.');
      router.push('/dashboard/content-plan');
      return;
    }
    
    if (savedProject) {
      setProject(JSON.parse(savedProject));
    }
  }, [router, searchParams]);

  async function generateArticle() {
    if (!idea) return;
    
    setGenerating(true);
    setError(null);
    setProgress(null);
    setArticle(null);
    
    abortControllerRef.current = new AbortController();
    
    try {
      // Get language from localStorage or default to nl
      const language = localStorage.getItem('contentLanguage') || 'nl';
      
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
                setGenerating(false);
              } else if (data.type === 'error') {
                setError(data.message);
                setGenerating(false);
              }
            } catch (e) {
              console.warn('Failed to parse SSE:', e);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Er is een fout opgetreden');
      }
      setGenerating(false);
    }
  }

  function cancelGeneration() {
    abortControllerRef.current?.abort();
    setGenerating(false);
    setProgress(null);
  }

  async function saveArticle() {
    if (!article) return;
    
    try {
      const response = await fetch('/api/articles/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          content: article.content,
          word_count: article.word_count,
          project_id: project?.id,
          featured_image: article.featured_image,
          slug: article.slug,
          status: 'draft',
        }),
      });

      if (response.ok) {
        alert('Artikel opgeslagen in bibliotheek!');
        router.push('/dashboard/library');
      } else {
        alert('Fout bij opslaan');
      }
    } catch (err) {
      alert('Fout bij opslaan');
    }
  }

  function openInEditor() {
    if (!article) return;
    localStorage.setItem('editorArticle', JSON.stringify(article));
    router.push('/dashboard/editor');
  }

  function downloadHtml() {
    if (!article) return;
    
    // Create clean HTML for export (black text on white background)
    const exportHtml = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${article.metaDescription || ''}">
  <title>${article.title}</title>
  <style>
    body {
      font-family: Georgia, 'Times New Roman', serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.8;
      color: #1a1a1a;
      background: #fff;
    }
    h1 {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 2.5rem;
      font-weight: 800;
      color: #111;
      margin-bottom: 1.5rem;
      line-height: 1.2;
    }
    h2 {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 1.75rem;
      font-weight: 700;
      color: #222;
      margin-top: 2.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #f97316;
    }
    h3 {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 1.375rem;
      font-weight: 600;
      color: #333;
      margin-top: 2rem;
      margin-bottom: 0.75rem;
    }
    p {
      margin-bottom: 1.25rem;
      color: #374151;
    }
    ul, ol {
      margin: 1.5rem 0;
      padding-left: 1.5rem;
    }
    li {
      margin-bottom: 0.5rem;
      color: #374151;
    }
    strong {
      color: #111;
      font-weight: 700;
    }
    a {
      color: #f97316;
    }
    blockquote {
      border-left: 4px solid #f97316;
      padding-left: 1rem;
      margin: 1.5rem 0;
      font-style: italic;
      color: #4b5563;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 1.5rem 0;
    }
    .featured-image {
      margin: 2rem 0;
    }
  </style>
</head>
<body>
${article.content}
</body>
</html>`;

    const blob = new Blob([exportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${article.slug || 'artikel'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!idea) {
    return (
      <div className="p-6 lg:p-12 flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">⏳ Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 lg:p-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/content-plan')}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
          >
            ← Terug naar Content Plan
          </button>
          <h1 className="text-3xl font-bold mb-2">✍️ Artikel Schrijven</h1>
          <p className="text-gray-400">AI genereert een volledig SEO-geoptimaliseerd artikel</p>
        </div>

        {/* Idea Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {idea.contentType && (
              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">
                {idea.contentType}
              </span>
            )}
            {idea.cluster && (
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                📁 {idea.cluster}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{idea.title}</h2>
          {idea.description && (
            <p className="text-gray-400 mb-4">{idea.description}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {idea.keywords.map((kw, i) => (
              <span key={i} className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-sm">
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Settings */}
        {!generating && !article && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h3 className="text-white font-medium mb-4">⚙️ Instellingen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Doellengte (woorden)</label>
                <div className="flex gap-2">
                  {[1500, 2000, 3000, 5000].map((count) => (
                    <button
                      key={count}
                      onClick={() => setWordCount(count)}
                      className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                        wordCount === count
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {count.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-300 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Generate Button */}
        {!generating && !article && (
          <button
            onClick={generateArticle}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Genereer Artikel ({wordCount.toLocaleString()} woorden)
          </button>
        )}

        {/* Progress Section */}
        {generating && progress && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-medium">{progress.message}</span>
                <span className="text-orange-400 font-bold">{progress.progress}%</span>
              </div>
              
              <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500 ease-out"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              
              <p className="text-gray-400 text-sm mt-2">{progress.detail}</p>
            </div>

            <div className="flex justify-between mt-6">
              {Array.from({ length: progress.totalSteps }, (_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    i + 1 < progress.step ? 'bg-green-500 text-white' :
                    i + 1 === progress.step ? 'bg-orange-500 text-white animate-pulse' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {i + 1 < progress.step ? '✓' : i + 1}
                  </div>
                  <span className="text-xs text-gray-500 mt-2 text-center hidden md:block">
                    {['Onderzoek', 'Intro', 'Content', 'Conclusie', 'Afbeelding'][i]}
                  </span>
                </div>
              ))}
            </div>

            {progress.outline && (
              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h4 className="text-white font-medium mb-2">📋 Outline</h4>
                <ul className="text-gray-400 text-sm space-y-1">
                  {progress.outline.sections?.slice(0, 4).map((section: any, i: number) => (
                    <li key={i}>• {section.heading}</li>
                  ))}
                  {progress.outline.sections?.length > 4 && (
                    <li className="text-gray-500">... en {progress.outline.sections.length - 4} meer secties</li>
                  )}
                </ul>
              </div>
            )}

            <button
              onClick={cancelGeneration}
              className="mt-4 px-4 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
            >
              Annuleren
            </button>
          </div>
        )}

        {/* Generated Article */}
        {article && (
          <div className="space-y-6">
            {/* Article Stats */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex flex-wrap gap-4 justify-between items-center">
                <div className="flex gap-6">
                  <div>
                    <p className="text-gray-400 text-xs uppercase">Woorden</p>
                    <p className="text-2xl font-bold text-white">{article.word_count.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase">Leestijd</p>
                    <p className="text-2xl font-bold text-white">{Math.ceil(article.word_count / 200)} min</p>
                  </div>
                  {article.slug && (
                    <div>
                      <p className="text-gray-400 text-xs uppercase">Slug</p>
                      <p className="text-white font-mono text-sm">{article.slug}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={openInEditor}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ✏️ Bewerken
                  </button>
                  <button
                    onClick={saveArticle}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    💾 Opslaan
                  </button>
                  <button
                    onClick={downloadHtml}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    📥 Download
                  </button>
                  <button
                    onClick={() => {
                      setArticle(null);
                      setProgress(null);
                    }}
                    className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    🔄 Opnieuw
                  </button>
                </div>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('preview')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'preview' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                👁️ Preview
              </button>
              <button
                onClick={() => setViewMode('html')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'html' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                &lt;/&gt; HTML
              </button>
            </div>

            {/* Featured Image */}
            {article.featured_image && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <img 
                  src={article.featured_image} 
                  alt={article.title}
                  className="w-full h-64 object-cover"
                />
                <div className="p-3 bg-gray-800/50">
                  <p className="text-gray-400 text-sm">🖼️ Featured Image (Flux Pro)</p>
                </div>
              </div>
            )}

            {/* Article Preview - Dark mode for editing */}
            {viewMode === 'preview' && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
                <div 
                  className="article-preview-dark prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                  style={{
                    color: '#fff',
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: '1.125rem',
                    lineHeight: '1.8',
                  }}
                />
                <style jsx global>{`
                  .article-preview-dark {
                    color: #fff !important;
                  }
                  .article-preview-dark h1 {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 2.25rem;
                    font-weight: 800;
                    color: #fff !important;
                    margin-bottom: 1.5rem;
                    line-height: 1.2;
                  }
                  .article-preview-dark h2 {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #f97316 !important;
                    margin-top: 2.5rem;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 2px solid #f97316;
                  }
                  .article-preview-dark h3 {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #d1d5db !important;
                    margin-top: 2rem;
                    margin-bottom: 0.75rem;
                  }
                  .article-preview-dark p {
                    margin-bottom: 1.25rem;
                    color: #e5e7eb !important;
                  }
                  .article-preview-dark ul,
                  .article-preview-dark ol {
                    margin: 1.5rem 0;
                    padding-left: 1.5rem;
                    color: #e5e7eb !important;
                  }
                  .article-preview-dark ul {
                    list-style-type: disc;
                  }
                  .article-preview-dark ol {
                    list-style-type: decimal;
                  }
                  .article-preview-dark li {
                    margin-bottom: 0.5rem;
                    color: #e5e7eb !important;
                    line-height: 1.7;
                  }
                  .article-preview-dark strong {
                    color: #fff !important;
                    font-weight: 700;
                  }
                  .article-preview-dark em {
                    color: #d1d5db !important;
                    font-style: italic;
                  }
                  .article-preview-dark a {
                    color: #f97316 !important;
                    text-decoration: none;
                  }
                  .article-preview-dark a:hover {
                    text-decoration: underline;
                  }
                  .article-preview-dark blockquote {
                    border-left: 4px solid #f97316;
                    padding-left: 1rem;
                    margin: 1.5rem 0;
                    font-style: italic;
                    color: #9ca3af !important;
                    background: rgba(249, 115, 22, 0.1);
                    padding: 1rem;
                    border-radius: 0 8px 8px 0;
                  }
                  .article-preview-dark img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    margin: 1.5rem 0;
                  }
                  .article-preview-dark figure {
                    margin: 2rem 0;
                  }
                  .article-preview-dark figure img {
                    width: 100%;
                    border-radius: 12px;
                  }
                `}</style>
              </div>
            )}

            {/* HTML View */}
            {viewMode === 'html' && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <pre className="text-gray-300 text-sm overflow-x-auto whitespace-pre-wrap font-mono">
                  {article.content}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
