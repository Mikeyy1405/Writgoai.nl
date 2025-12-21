'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ArticleIdea {
  title: string;
  category: string;
  description: string;
  keywords: string[];
}

interface Article {
  title: string;
  content: string;
  word_count: number;
}

export default function WriterPage() {
  const router = useRouter();
  const [idea, setIdea] = useState<ArticleIdea | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Haal geselecteerde idee op
    const savedIdea = localStorage.getItem('selectedIdea');
    if (!savedIdea) {
      alert('Geen idee geselecteerd!');
      router.push('/dashboard/simple-content');
      return;
    }
    setIdea(JSON.parse(savedIdea));
  }, [router]);

  async function generateArticle() {
    if (!idea) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/generate/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: idea.title,
          keywords: idea.keywords,
          description: idea.description
        })
      });

      if (!response.ok) throw new Error('Failed to generate article');

      const data = await response.json();
      const generatedArticle = {
        title: idea.title,
        content: data.content || data.article || 'Artikel gegenereerd',
        word_count: data.word_count || 1500
      };
      
      setArticle(generatedArticle);
      // Sla artikel op voor editor
      localStorage.setItem('generatedArticle', JSON.stringify(generatedArticle));
      alert('✅ Artikel geschreven!');
    } catch (error) {
      console.error('Generate error:', error);
      alert('❌ Fout bij genereren artikel');
    } finally {
      setLoading(false);
    }
  }

  function goToEditor() {
    if (!article) return;
    router.push('/dashboard/simple-content/editor');
  }

  function goBack() {
    router.push('/dashboard/simple-content');
  }

  if (!idea) {
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
            ← Terug naar Content Plan
          </button>
          <h1 className="text-4xl font-bold mb-2">✍️ Stap 2: Writer</h1>
          <p className="text-gray-600">AI schrijft het artikel → Ga naar Editor</p>
        </div>

        {/* Selected Idea */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Geselecteerd Idee</h2>
          <h3 className="text-xl font-bold text-blue-600 mb-2">{idea.title}</h3>
          <p className="text-gray-600 mb-3">{idea.description}</p>
          <div className="flex gap-2 flex-wrap">
            {idea.keywords.map((kw, i) => (
              <span key={i} className="text-xs bg-blue-100 px-2 py-1 rounded">
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Generate Article */}
        {!article && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">🤖 AI Schrijft Artikel</h2>
            <p className="text-gray-600 mb-6">
              AI schrijft automatisch een volledig artikel
            </p>
            <button
              onClick={generateArticle}
              disabled={loading}
              className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-lg font-semibold"
            >
              {loading ? '⏳ AI aan het schrijven...' : '🚀 Schrijf Artikel'}
            </button>
          </div>
        )}

        {/* Article Preview */}
        {article && (
          <div>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">✅ Artikel Geschreven</h2>
                <div className="text-gray-600">
                  📝 {article.word_count} woorden
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg mb-6 max-h-96 overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">{article.title}</h3>
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                  {article.content.substring(0, 500)}...
                </div>
              </div>

              <button
                onClick={goToEditor}
                className="w-full px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-semibold"
              >
                Volgende: Editor →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
