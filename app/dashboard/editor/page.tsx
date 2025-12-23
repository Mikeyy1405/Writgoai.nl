'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import for RichTextEditor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>
});

interface Article {
  id?: string;
  title: string;
  content: string;
  word_count: number;
  project_id?: string;
  featured_image?: string;
}

interface Project {
  id: string;
  name: string;
  website_url: string;
  wp_url?: string;
  wp_username?: string;
}

export default function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'html' | 'preview'>('visual');
  const [featuredImage, setFeaturedImage] = useState<string>('');
  const [generatingFeaturedImage, setGeneratingFeaturedImage] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticle();
  }, [searchParams]);

  async function loadArticle() {
    setLoading(true);
    
    const articleId = searchParams.get('article');
    const jobId = searchParams.get('job');
    
    // Try to load from article ID (from library)
    if (articleId) {
      try {
        const response = await fetch(`/api/articles/get?id=${articleId}`);
        const data = await response.json();
        
        if (data.article) {
          const articleData = data.article;
          setArticle(articleData);
          setEditedTitle(articleData.title);
          setEditedContent(articleData.content);
          setFeaturedImage(articleData.featured_image || '');
          
          // Load project
          if (articleData.project_id) {
            const projectResponse = await fetch('/api/projects/list');
            const projectData = await projectResponse.json();
            const foundProject = projectData.projects?.find((p: Project) => p.id === articleData.project_id);
            if (foundProject) {
              setProject(foundProject);
            }
          }
          
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Failed to load article:', e);
      }
    }
    
    // Try to load from job ID (from writer)
    if (jobId) {
      try {
        const response = await fetch(`/api/generate/article-background?job_id=${jobId}`);
        const job = await response.json();
        
        if (job && job.status === 'completed' && job.article_content) {
          const articleData = {
            title: job.title,
            content: job.article_content,
            word_count: job.article_content.split(/\s+/).length,
            project_id: job.project_id,
            featured_image: job.featured_image,
          };
          
          setArticle(articleData);
          setEditedTitle(articleData.title);
          setEditedContent(articleData.content);
          setFeaturedImage(articleData.featured_image || '');
          
          // Load project
          if (job.project_id) {
            const projectResponse = await fetch('/api/projects/list');
            const projectData = await projectResponse.json();
            const foundProject = projectData.projects?.find((p: Project) => p.id === job.project_id);
            if (foundProject) {
              setProject(foundProject);
            }
          }
          
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Failed to load job:', e);
      }
    }
    
    // No article found - no localStorage fallback, everything via database
    setLoading(false);
    alert('Geen artikel gevonden! Ga eerst naar Writer of Bibliotheek.');
    router.push('/dashboard/writer');
  }

  // Generate AI image
  const generateAIImage = useCallback(async (prompt: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          style: 'photorealistic',
          aspectRatio: '16:9'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      return data.url;
    } catch (err: any) {
      console.error('Image generation error:', err);
      alert(`Fout bij genereren afbeelding: ${err.message}`);
      return null;
    }
  }, []);

  // Generate featured image
  const generateFeaturedImageHandler = async () => {
    setGeneratingFeaturedImage(true);
    try {
      const prompt = `Professional blog header image for article about: ${editedTitle}`;
      const imageUrl = await generateAIImage(prompt);
      if (imageUrl) {
        setFeaturedImage(imageUrl);
        setSuccess('Featured image gegenereerd!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Featured image generation error:', err);
    } finally {
      setGeneratingFeaturedImage(false);
    }
  };

  // Calculate word count
  const wordCount = editedContent.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 0).length;

  // Save article
  async function saveArticle() {
    if (!article) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/articles/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: article.id,
          project_id: project?.id || article.project_id,
          title: editedTitle,
          content: editedContent,
          featured_image: featuredImage,
          status: 'draft',
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save article');
      }

      // Update article with saved ID
      if (data.article?.id) {
        setArticle({ ...article, id: data.article.id });
      }

      setSuccess('Artikel opgeslagen!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Fout bij opslaan');
    } finally {
      setSaving(false);
    }
  }

  // Publish to WordPress
  async function publishToWordPress() {
    if (!project?.wp_url || !project?.wp_username) {
      alert('WordPress is niet geconfigureerd voor dit project. Ga naar Projecten om WordPress credentials toe te voegen.');
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      // First save the article
      const saveResponse = await fetch('/api/articles/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: article?.id,
          project_id: project.id,
          title: editedTitle,
          content: editedContent,
          featured_image: featuredImage,
          status: 'draft',
        })
      });

      const saveData = await saveResponse.json();
      
      if (!saveResponse.ok) {
        throw new Error(saveData.error || 'Failed to save article');
      }

      // Then publish to WordPress
      const publishResponse = await fetch('/api/wordpress/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          article_id: saveData.article?.id || article?.id,
        })
      });

      const publishData = await publishResponse.json();

      if (!publishResponse.ok) {
        throw new Error(publishData.error || 'Failed to publish to WordPress');
      }

      setSuccess(`Artikel gepubliceerd! ${publishData.url || ''}`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Publish error:', err);
      setError(err.message || 'Fout bij publiceren');
    } finally {
      setPublishing(false);
    }
  }

  // Download as HTML
  function downloadHTML() {
    const htmlContent = `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${editedTitle}</title>
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
        img { max-width: 100%; height: auto; }
        .featured-image { margin-bottom: 30px; }
    </style>
</head>
<body>
    ${featuredImage ? `<img src="${featuredImage}" alt="${editedTitle}" class="featured-image">` : ''}
    <h1>${editedTitle}</h1>
    <div class="content">${editedContent}</div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${editedTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Copy to clipboard
  function copyToClipboard() {
    const plainText = editedContent.replace(/<[^>]*>/g, '\n').replace(/\n\s*\n/g, '\n\n').trim();
    const fullText = `${editedTitle}\n\n${plainText}`;
    
    navigator.clipboard.writeText(fullText).then(() => {
      setSuccess('Gekopieerd naar klembord!');
      setTimeout(() => setSuccess(null), 3000);
    }).catch(() => {
      alert('Kon niet kopiëren. Probeer handmatig te kopiëren.');
    });
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-12 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Artikel laden...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="p-6 lg:p-12">
        <div className="bg-gray-800/50 rounded-xl p-8 text-center">
          <p className="text-gray-400 text-lg mb-4">Geen artikel gevonden</p>
          <button
            onClick={() => router.push('/dashboard/writer')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Ga naar Writer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Editor</h1>
          <p className="text-gray-400">
            {project?.name || 'Onbekend project'} • {wordCount.toLocaleString()} woorden
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            📋 Kopiëren
          </button>
          <button
            onClick={downloadHTML}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            ⬇️ Download
          </button>
          <button
            onClick={saveArticle}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? '💾 Opslaan...' : '💾 Opslaan'}
          </button>
          <button
            onClick={publishToWordPress}
            disabled={publishing || !project?.wp_url}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            title={!project?.wp_url ? 'WordPress niet geconfigureerd' : 'Publiceer naar WordPress'}
          >
            {publishing ? '🚀 Publiceren...' : '🚀 WordPress'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
          <p className="text-green-400">{success}</p>
        </div>
      )}

      {/* Featured Image */}
      <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Featured Image</h3>
          <button
            onClick={generateFeaturedImageHandler}
            disabled={generatingFeaturedImage}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {generatingFeaturedImage ? '🎨 Genereren...' : '🎨 Genereer met AI'}
          </button>
        </div>
        {featuredImage ? (
          <img src={featuredImage} alt="Featured" className="w-full max-h-64 object-cover rounded-lg" />
        ) : (
          <div className="w-full h-32 bg-gray-700 rounded-lg flex items-center justify-center">
            <p className="text-gray-400">Geen featured image</p>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-2">Titel</label>
        <input
          type="text"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-xl font-semibold focus:outline-none focus:border-orange-500"
        />
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode('visual')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'visual' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Visual Editor
        </button>
        <button
          onClick={() => setViewMode('html')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'html' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          HTML
        </button>
        <button
          onClick={() => setViewMode('preview')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'preview' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Preview
        </button>
      </div>

      {/* Content Editor */}
      <div className="bg-gray-800/50 rounded-xl overflow-hidden">
        {viewMode === 'visual' && (
          <RichTextEditor
            content={editedContent}
            onChange={setEditedContent}
            onGenerateImage={generateAIImage}
          />
        )}
        {viewMode === 'html' && (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-[600px] p-6 bg-gray-900 text-gray-300 font-mono text-sm focus:outline-none resize-none"
            spellCheck={false}
          />
        )}
        {viewMode === 'preview' && (
          <div 
            className="p-8 prose prose-invert prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: editedContent }}
          />
        )}
      </div>
    </div>
  );
}
