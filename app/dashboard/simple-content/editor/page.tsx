'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Article {
  title: string;
  content: string;
  word_count: number;
}

export default function EditorPage() {
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Haal gegenereerd artikel op
    const savedArticle = localStorage.getItem('generatedArticle');
    if (!savedArticle) {
      alert('Geen artikel gevonden!');
      router.push('/dashboard/simple-content');
      return;
    }
    setArticle(JSON.parse(savedArticle));
  }, [router]);

  async function publishArticle() {
    if (!article) return;
    
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
      localStorage.removeItem('selectedIdea');
      localStorage.removeItem('generatedArticle');
      router.push('/dashboard/simple-content');
    } catch (error) {
      console.error('Publish error:', error);
      alert('❌ Fout bij publiceren. Probeer downloaden.');
    } finally {
      setPublishing(false);
    }
  }

  function downloadArticle() {
    if (!article) return;
    
    setDownloading(true);
    try {
      // Maak HTML bestand
      const htmlContent = `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.title}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; line-height: 1.6; }
        h1 { color: #333; }
        p { color: #666; }
    </style>
</head>
<body>
    <h1>${article.title}</h1>
    <p><strong>Aantal woorden:</strong> ${article.word_count}</p>
    <hr>
    <div>${article.content.replace(/\n/g, '<br>')}</div>
</body>
</html>
      `;

      // Download als HTML bestand
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
    } catch (error) {
      console.error('Download error:', error);
      alert('❌ Fout bij downloaden');
    } finally {
      setDownloading(false);
    }
  }

  function goBack() {
    router.push('/dashboard/simple-content/writer');
  }

  function startNew() {
    localStorage.removeItem('selectedIdea');
    localStorage.removeItem('generatedArticle');
    router.push('/dashboard/simple-content');
  }

  if (!article) {
    return <div className="p-8">Loading...</div>;
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
          <h1 className="text-4xl font-bold mb-2">📝 Stap 3: Editor</h1>
          <p className="text-gray-600">Bekijk artikel → Download of Publiceer</p>
        </div>

        {/* Article Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600">{article.word_count}</div>
            <div className="text-gray-600">Woorden</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600">✓</div>
            <div className="text-gray-600">Klaar voor publicatie</div>
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
        <div className="grid grid-cols-2 gap-4 mb-4">
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
            {publishing ? '⏳ Publiceren...' : '🚀 Publiceer op WordPress'}
          </button>
        </div>

        <button
          onClick={startNew}
          className="w-full px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
        >
          🔄 Nieuw Artikel Maken
        </button>
      </div>
    </div>
  );
}
