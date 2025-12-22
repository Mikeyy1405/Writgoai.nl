'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
}

export default function EditorPage() {
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

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
    
    if (savedProject) {
      setProject(JSON.parse(savedProject));
    }
  }, [router]);

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
          project_id: project.id,
          status: 'draft'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save article');
      }

      // Cleanup localStorage
      localStorage.removeItem('selectedIdea');
      localStorage.removeItem('generatedArticle');
      
      alert('✅ Artikel opgeslagen in bibliotheek!');
      router.push('/dashboard/library');
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Fout bij opslaan');
    } finally {
      setSaving(false);
    }
  }

  function goBack() {
    router.push('/dashboard/writer');
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
    <h1>${editedTitle}</h1>
    <div class="meta">
        <strong>Woorden:</strong> ${currentWordCount.toLocaleString()}<br>
        <strong>Project:</strong> ${project?.name || 'Onbekend'}
    </div>
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

  return (
    <div className="p-6 lg:p-12">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={goBack}
            className="mb-4 text-orange-400 hover:text-orange-300 transition-colors"
          >
            ← Terug naar Writer
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">📝 Editor</h1>
          <p className="text-gray-400 text-lg">
            Bewerk en verfijn je content
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Project Info */}
        {project && (
          <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-2">{project.name}</h3>
            <p className="text-gray-400 text-sm">🌐 {project.website_url}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="text-4xl font-bold text-orange-500 mb-2">{currentWordCount.toLocaleString()}</div>
            <div className="text-gray-400">Woorden</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="text-4xl font-bold text-white mb-2">
              {editedTitle.length}
            </div>
            <div className="text-gray-400">Karakters in Titel</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="text-4xl font-bold text-green-500 mb-2">✓</div>
            <div className="text-gray-400">Klaar voor Opslaan</div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode('edit')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'edit' 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            ✏️ Bewerken
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

        {/* Editor */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6">
          {/* Title Input */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-3">Titel</label>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-xl font-bold"
              placeholder="Artikel titel..."
            />
          </div>
          
          {viewMode === 'edit' ? (
            <div className="mb-6">
              <label className="block text-white font-medium mb-3">Content (HTML)</label>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={25}
                className="w-full bg-gray-900 border border-gray-700 text-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm leading-relaxed"
                placeholder="Artikel content..."
              />
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-white font-medium mb-3">Preview</label>
              <div className="bg-white rounded-lg p-8 max-h-[600px] overflow-y-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">{editedTitle}</h1>
                <div 
                  className="prose prose-lg max-w-none text-gray-800"
                  dangerouslySetInnerHTML={{ __html: editedContent }}
                />
              </div>
            </div>
          )}

          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6">
            <p className="text-orange-400 text-sm">
              💡 <strong>Tip:</strong> Bewerk de content naar wens. Je kunt HTML tags gebruiken voor formatting. Klik op "Preview" om het resultaat te bekijken.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={saveToLibrary}
            disabled={saving}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all disabled:opacity-50"
          >
            {saving ? '⏳ Opslaan...' : '💾 Opslaan in Bibliotheek'}
          </button>

          <button
            onClick={downloadArticle}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all"
          >
            📥 Download HTML
          </button>

          <button
            onClick={goBack}
            className="bg-gray-800 border border-gray-700 text-gray-300 px-8 py-4 rounded-xl font-medium hover:bg-gray-700 transition-all"
          >
            ← Terug
          </button>
        </div>
    </div>
  );
}
