'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import for RichTextEditor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>
});

interface Article {
  title: string;
  content: string;
  word_count: number;
  project_id?: string;
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

  useEffect(() => {
    const savedArticle = localStorage.getItem('generatedArticle');
    const savedProject = localStorage.getItem('selectedProject');
    
    if (!savedArticle) {
      alert('Geen artikel gevonden! Ga eerst naar Writer.');
      router.push('/dashboard/writer');
      return;
    }
    
    const articleData = JSON.parse(savedArticle);
    setArticle(articleData);
    setEditedTitle(articleData.title);
    setEditedContent(articleData.content);
    setFeaturedImage(articleData.featured_image || '');
    
    if (savedProject) {
      setProject(JSON.parse(savedProject));
    }
  }, [router]);

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
    } finally {
      setGeneratingFeaturedImage(false);
    }
  };

  // Save to library
  async function saveToLibrary() {
    if (!editedContent || !editedTitle) {
      setError('Titel en content zijn verplicht');
      return;
    }
    
    if (!project) {
      setError('Geen project geselecteerd. Ga terug naar Content Plan.');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/articles/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
          featured_image: featuredImage,
          project_id: project.id,
          status: 'draft'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save article');
      }

      localStorage.removeItem('selectedIdea');
      localStorage.removeItem('generatedArticle');
      
      setSuccess('Artikel opgeslagen in bibliotheek!');
      setTimeout(() => router.push('/dashboard/library'), 1500);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Fout bij opslaan');
    } finally {
      setSaving(false);
    }
  }

  // Publish to WritGo Blog
  async function publishToWritGoBlog() {
    if (!editedContent || !editedTitle) {
      setError('Titel en content zijn verplicht');
      return;
    }
    
    setPublishing(true);
    setError(null);
    
    try {
      // Generate slug from title
      const slug = editedTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Create excerpt from content
      const plainText = editedContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const excerpt = plainText.substring(0, 160) + '...';

      const response = await fetch('/api/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedTitle,
          slug: slug,
          content: editedContent,
          excerpt: excerpt,
          featured_image: featuredImage,
          status: 'published',
          published_at: new Date().toISOString(),
          meta_title: editedTitle,
          meta_description: excerpt
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish');
      }

      localStorage.removeItem('selectedIdea');
      localStorage.removeItem('generatedArticle');
      
      setSuccess('🎉 Artikel gepubliceerd op WritGo Blog!');
      
      // Open the published article in new tab
      if (data.post?.slug) {
        window.open(`/blog/${data.post.slug}`, '_blank');
      }
      
      setTimeout(() => router.push('/dashboard/blog'), 2000);
    } catch (err: any) {
      console.error('Publish error:', err);
      setError(err.message || 'Fout bij publiceren');
    } finally {
      setPublishing(false);
    }
  }

  // Publish to WordPress
  async function publishToWordPress() {
    if (!editedContent || !editedTitle) {
      setError('Titel en content zijn verplicht');
      return;
    }

    if (!project?.wp_url || !project?.wp_username) {
      setError('WordPress is niet geconfigureerd voor dit project. Ga naar Projecten om WordPress credentials toe te voegen.');
      return;
    }
    
    setPublishing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/wordpress/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          title: editedTitle,
          content: editedContent
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish to WordPress');
      }

      localStorage.removeItem('selectedIdea');
      localStorage.removeItem('generatedArticle');
      
      setSuccess('🎉 Artikel gepubliceerd op WordPress!');
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
      
      setTimeout(() => router.push('/dashboard/library'), 2000);
    } catch (err: any) {
      console.error('WordPress publish error:', err);
      setError(err.message || 'Fout bij publiceren naar WordPress');
    } finally {
      setPublishing(false);
    }
  }

  function downloadArticle() {
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
        img { max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0; }
        .featured-image { width: 100%; margin-bottom: 30px; }
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

  if (!article) {
    return (
      <div className="p-6 lg:p-12 flex items-center justify-center">
        <div className="text-white text-xl">⏳ Laden...</div>
      </div>
    );
  }

  const currentWordCount = editedContent.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 0).length;
  const isWritGoBlog = project?.website_url?.toLowerCase().includes('writgo.nl');
  const hasWordPress = project?.wp_url && project?.wp_username;

  return (
    <div className="p-6 lg:p-12">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => router.push('/dashboard/writer')}
          className="mb-4 text-orange-400 hover:text-orange-300 transition-colors"
        >
          ← Terug naar Writer
        </button>
        <h1 className="text-4xl font-bold text-white mb-2">✏️ Artikel Editor</h1>
        <p className="text-gray-400 text-lg">
          Bewerk, verfijn en publiceer je content
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">✕</button>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
          <p className="text-green-400">{success}</p>
        </div>
      )}

      {/* Project Info */}
      {project && (
        <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">{project.name}</h3>
              <p className="text-gray-400 text-sm">🌐 {project.website_url}</p>
            </div>
            <div className="flex gap-2">
              {isWritGoBlog && (
                <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">
                  🟠 WritGo Blog
                </span>
              )}
              {hasWordPress && (
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                  🔗 WordPress
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <div className="text-2xl font-bold text-orange-500 mb-1">{currentWordCount.toLocaleString()}</div>
          <div className="text-gray-400 text-sm">Woorden</div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <div className="text-2xl font-bold text-white mb-1">{editedTitle.length}</div>
          <div className="text-gray-400 text-sm">Titel karakters</div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <div className="text-2xl font-bold text-white mb-1">
            {Math.ceil(currentWordCount / 200)}
          </div>
          <div className="text-gray-400 text-sm">Min. leestijd</div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-500 mb-1">
            {featuredImage ? '✓' : '○'}
          </div>
          <div className="text-gray-400 text-sm">Featured Image</div>
        </div>
      </div>

      {/* Featured Image Section */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">🖼️ Featured Image</h3>
        
        {featuredImage ? (
          <div className="relative">
            <img 
              src={featuredImage} 
              alt="Featured" 
              className="w-full max-h-64 object-cover rounded-lg"
            />
            <button
              onClick={() => setFeaturedImage('')}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-4">Geen featured image</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={generateFeaturedImageHandler}
                disabled={generatingFeaturedImage}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {generatingFeaturedImage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Genereren...
                  </>
                ) : (
                  <>🤖 Genereer met AI</>
                )}
              </button>
              <button
                onClick={() => {
                  const url = prompt('Voer afbeelding URL in:');
                  if (url) setFeaturedImage(url);
                }}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600"
              >
                🔗 URL toevoegen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Title Input */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6">
        <label className="block text-white font-medium mb-3">Titel</label>
        <input
          type="text"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-xl font-bold"
          placeholder="Artikel titel..."
        />
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode('visual')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            viewMode === 'visual' 
              ? 'bg-orange-500 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          ✨ Visueel
        </button>
        <button
          onClick={() => setViewMode('html')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            viewMode === 'html' 
              ? 'bg-orange-500 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          &lt;/&gt; HTML
        </button>
        <button
          onClick={() => setViewMode('preview')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            viewMode === 'preview' 
              ? 'bg-orange-500 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          👁️ Preview
        </button>
      </div>

      {/* Editor Content */}
      <div className="mb-6">
        {viewMode === 'visual' && (
          <RichTextEditor
            content={editedContent}
            onChange={setEditedContent}
            onGenerateImage={generateAIImage}
            placeholder="Begin met schrijven of plak je content..."
          />
        )}
        
        {viewMode === 'html' && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <label className="block text-white font-medium mb-3">HTML Code</label>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={25}
              className="w-full bg-gray-900 border border-gray-700 text-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm leading-relaxed"
              placeholder="HTML content..."
            />
          </div>
        )}
        
        {viewMode === 'preview' && (
          <div className="bg-white rounded-xl overflow-hidden">
            {featuredImage && (
              <img src={featuredImage} alt={editedTitle} className="w-full h-64 object-cover" />
            )}
            <div className="p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">{editedTitle}</h1>
              <div 
                className="prose prose-lg max-w-none text-gray-800"
                dangerouslySetInnerHTML={{ __html: editedContent }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">📤 Publiceren</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Save to Library */}
          <button
            onClick={saveToLibrary}
            disabled={saving}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-4 rounded-xl font-medium transition-all disabled:opacity-50 flex flex-col items-center gap-2"
          >
            <span className="text-2xl">💾</span>
            <span>{saving ? 'Opslaan...' : 'Opslaan als Concept'}</span>
          </button>

          {/* Publish to WritGo Blog */}
          <button
            onClick={publishToWritGoBlog}
            disabled={publishing}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg hover:shadow-orange-500/50 text-white px-6 py-4 rounded-xl font-medium transition-all disabled:opacity-50 flex flex-col items-center gap-2"
          >
            <span className="text-2xl">🚀</span>
            <span>{publishing ? 'Publiceren...' : 'Publiceer op WritGo Blog'}</span>
          </button>

          {/* Publish to WordPress */}
          {hasWordPress && (
            <button
              onClick={publishToWordPress}
              disabled={publishing}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-xl font-medium transition-all disabled:opacity-50 flex flex-col items-center gap-2"
            >
              <span className="text-2xl">📝</span>
              <span>{publishing ? 'Publiceren...' : 'Publiceer op WordPress'}</span>
            </button>
          )}

          {/* Download */}
          <button
            onClick={downloadArticle}
            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-4 rounded-xl font-medium transition-all flex flex-col items-center gap-2"
          >
            <span className="text-2xl">📥</span>
            <span>Download HTML</span>
          </button>
        </div>

        {!hasWordPress && !isWritGoBlog && (
          <p className="text-gray-400 text-sm mt-4">
            💡 Tip: Voeg WordPress credentials toe aan je project om direct te kunnen publiceren.
          </p>
        )}
      </div>
    </div>
  );
}
