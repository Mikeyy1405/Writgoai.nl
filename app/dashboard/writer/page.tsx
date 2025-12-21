'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ContentIdea {
  title: string;
  category: string;
  description: string;
  keywords: string[];
  project_id?: string;
}

interface Article {
  title: string;
  content: string;
  word_count: number;
  project_id?: string;
}

export default function WriterPage() {
  const router = useRouter();
  const [idea, setIdea] = useState<ContentIdea | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const savedIdea = localStorage.getItem('selectedIdea');
    if (!savedIdea) {
      alert('Geen idee geselecteerd! Ga eerst naar Content Plan.');
      router.push('/dashboard/content-plan');
      return;
    }
    setIdea(JSON.parse(savedIdea));
  }, [router]);

  async function generateArticle() {
    if (!idea) return;
    
    setGenerating(true);
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
        content: data.content || data.article || '',
        word_count: data.word_count || 1500,
        project_id: idea.project_id
      };
      
      setArticle(generatedArticle);
      localStorage.setItem('generatedArticle', JSON.stringify(generatedArticle));
      alert('✅ Artikel geschreven!');
    } catch (error) {
      console.error('Generate error:', error);
      alert('❌ Fout bij genereren artikel');
    } finally {
      setGenerating(false);
    }
  }

  function goToEditor() {
    if (!article) return;
    router.push('/dashboard/editor');
  }

  function goBack() {
    router.push('/dashboard/content-plan');
  }

  if (!idea) {
    return (
      <div className="p-6 lg:p-12 flex items-center justify-center">
        <div className="text-white text-xl">⏳ Laden...</div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-12">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={goBack}
            className="mb-4 text-orange-400 hover:text-orange-300 transition-colors"
          >
            ← Terug naar Content Plan
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">✍️ Content Writer</h1>
          <p className="text-gray-400 text-lg">
            AI schrijft je artikel automatisch
          </p>
        </div>

        {/* Selected Idea */}
        <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-xl p-6 mb-8">
          <h2 className="text-sm font-medium text-orange-400 mb-3">GESELECTEERD IDEE</h2>
          <h3 className="text-2xl font-bold text-white mb-3">{idea.title}</h3>
          <p className="text-gray-400 mb-4">{idea.description}</p>
          <div className="flex gap-2 flex-wrap">
            {idea.keywords.map((kw, i) => (
              <span key={i} className="text-xs bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full font-medium">
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="text-4xl font-bold text-orange-500 mb-2">
              {article ? article.word_count : '~1500'}
            </div>
            <div className="text-gray-400">Verwacht Aantal Woorden</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="text-4xl font-bold text-white mb-2">
              {article ? '✓' : '○'}
            </div>
            <div className="text-gray-400">
              {article ? 'Artikel Klaar' : 'Nog Niet Geschreven'}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        {!article && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 text-center mb-8">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold text-white mb-4">AI Schrijft Artikel</h2>
            <p className="text-gray-400 mb-6">
              AI schrijft automatisch een volledig SEO-geoptimaliseerd artikel
            </p>
            <button
              onClick={generateArticle}
              disabled={generating}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all disabled:opacity-50"
            >
              {generating ? '⏳ AI aan het schrijven...' : '🚀 Schrijf Artikel'}
            </button>
          </div>
        )}

        {/* Article Preview */}
        {article && (
          <div>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">✅ Artikel Geschreven</h2>
                <div className="text-orange-400 font-medium">
                  📝 {article.word_count} woorden
                </div>
              </div>
              
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 mb-6 max-h-96 overflow-y-auto">
                <h3 className="text-xl font-bold text-white mb-4">{article.title}</h3>
                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {article.content.substring(0, 800)}...
                </div>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6">
                <p className="text-orange-400 text-sm">
                  💡 <strong>Tip:</strong> Ga naar de Editor om het volledige artikel te bekijken en te bewerken
                </p>
              </div>

              <button
                onClick={goToEditor}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all"
              >
                Volgende: Editor →
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
