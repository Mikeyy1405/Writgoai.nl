'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Article {
  title: string;
  content: string;
  word_count: number;
}

interface Project {
  id: string;
  name: string;
  website_url: string;
  niche: string;
}

export default function EditorPage() {
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const savedArticle = localStorage.getItem('generatedArticle');
    const savedProject = localStorage.getItem('selectedProject');
    
    if (!savedArticle) {
      alert('Geen artikel gevonden!');
      router.push('/dashboard/simple-content');
      return;
    }
    
    setArticle(JSON.parse(savedArticle));
    if (savedProject) {
      setProject(JSON.parse(savedProject));
    }
  }, [router]);

  async function saveToLibrary() {
    if (!article || !project) return;
    
    setSaving(true);
    try {
      // Opslaan in database via articles API
      const response = await fetch('/api/articles/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          content: article.content,
          word_count: article.word_count,
          project_id: project.id,
          status: 'draft'
        })
      });

      if (!response.ok) throw new Error('Failed to save');

      setSavedToLibrary(true);
      alert('✅ Artikel opgeslagen in bibliotheek!');
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Fout bij opslaan. Je kunt nog steeds downloaden of publiceren.');
      setSavedToLibrary(true); // Ga door met workflow
    } finally {
      setSaving(false);
    }
  }

  async function publishArticle() {
    if (!article || !savedToLibrary) {
      alert('Sla eerst op in bibliotheek!');
      return;
    }
    
    setPublishing(true);
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
      
      // Cleanup en terug naar start
      cleanupAndRestart();
    } catch (error) {
      console.error('Publish error:', error);
      alert('❌ Fout bij publiceren. Probeer downloaden of check WordPress instellingen.');
    } finally {
      setPublishing(false);
    }
  }

  function downloadArticle() {
    if (!article || !savedToLibrary) {
      alert('Sla eerst op in bibliotheek!');
      return;
    }
    
    setDownloading(true);
    try {
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
        <strong>Aantal woorden:</strong> ${article.word_count}<br>
        <strong>Project:</strong> ${project?.name || 'Onbekend'}
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
      
      // Na download, optie om opnieuw te beginnen
      setTimeout(() => {
        if (confirm('Wil je een nieuw artikel maken?')) {
          cleanupAndRestart();
        }
      }, 1000);
    } catch (error) {
      console.error('Download error:', error);
      alert('❌ Fout bij downloaden');
    } finally {
      setDownloading(false);
    }
  }

  function cleanupAndRestart() {
    localStorage.removeItem('selectedIdea');
    localStorage.removeItem('generatedArticle');
    router.push('/dashboard/simple-content/content-plan');
  }

  function goBack() {
    router.push('/dashboard/simple-content/writer');
  }

  if (!article) {
    return <div className="p-8">⏳ Laden...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={goBack}
            className="mb-4 text-blue-600 hover:underline"
          >
            ← Terug naar Writer
          </button>
          <h1 className="text-4xl font-bold mb-2">📝 Stap 4: Editor & Bibliotheek</h1>
          <p className="text-gray-600">Opslaan → Download of Publiceer</p>
        </div>

        {/* Progress */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${savedToLibrary ? 'bg-green-500' : 'bg-gray-300'}`}>
              {savedToLibrary ? '✓' : '1'}
            </div>
            <div className="flex-1">
              <div className="font-bold">Opslaan in Bibliotheek</div>
              <div className="text-sm text-gray-600">
                {savedToLibrary ? 'Opgeslagen!' : 'Klik op "Opslaan in Bibliotheek"'}
              </div>
            </div>
          </div>
        </div>

        {/* Article Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600">{article.word_count}</div>
            <div className="text-gray-600">Woorden</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600">
              {savedToLibrary ? '✓' : '○'}
            </div>
            <div className="text-gray-600">
              {savedToLibrary ? 'In bibliotheek' : 'Nog niet opgeslagen'}
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6">{article.title}</h2>
          <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto bg-gray-50 p-6 rounded-lg">
            {article.content}
          </div>
        </div>

        {/* Action Buttons */}
        {!savedToLibrary ? (
          <button
            onClick={saveToLibrary}
            disabled={saving}
            className="w-full px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-lg font-semibold mb-4"
          >
            {saving ? '⏳ Opslaan...' : '💾 Opslaan in Bibliotheek'}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={downloadArticle}
                disabled={downloading}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-lg font-semibold"
              >
                {downloading ? '⏳ Downloaden...' : '💾 Download HTML'}
              </button>
              
              <button
                onClick={publishArticle}
                disabled={publishing}
                className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-lg font-semibold"
              >
                {publishing ? '⏳ Publiceren...' : '🚀 Publiceer WordPress'}
              </button>
            </div>

            <button
              onClick={cleanupAndRestart}
              className="w-full px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
            >
              🔄 Nieuw Artikel Maken
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
