'use client';

import { useState } from 'react';

interface ArticleIdea {
  title: string;
  category: string;
  description: string;
  keywords: string[];
}

export default function SimpleContentPage() {
  const [contentPlan, setContentPlan] = useState<ArticleIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatedArticles, setGeneratedArticles] = useState<any[]>([]);

  async function generatePlan() {
    setLoading(true);
    try {
      const response = await fetch('/api/simple/generate-content-plan', {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to generate plan');

      const data = await response.json();
      setContentPlan(data.plan);
      alert(`✅ Content plan gegenereerd! ${data.count} artikel ideeën klaar.`);
    } catch (error) {
      console.error('Plan error:', error);
      alert('❌ Fout bij genereren content plan');
    } finally {
      setLoading(false);
    }
  }

  async function generateArticle(idea: ArticleIdea) {
    setGenerating(idea.title);
    try {
      const response = await fetch('/api/simple/generate-and-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(idea)
      });

      if (!response.ok) throw new Error('Failed to generate article');

      const data = await response.json();
      setGeneratedArticles([...generatedArticles, data.article]);
      
      // Remove from plan
      setContentPlan(contentPlan.filter(p => p.title !== idea.title));
      
      alert(`✅ Artikel gepubliceerd!\n\n${data.article.title}\n${data.article.word_count} woorden\n\n${data.article.url}`);
    } catch (error) {
      console.error('Generate error:', error);
      alert('❌ Fout bij genereren artikel');
    } finally {
      setGenerating(null);
    }
  }

  const categoryColors: Record<string, string> = {
    'Google SEO': 'bg-blue-100 text-blue-800',
    'AI & SEO': 'bg-purple-100 text-purple-800',
    'WordPress': 'bg-green-100 text-green-800',
    'Content Marketing': 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🚀 Simpel Content Systeem</h1>
          <p className="text-gray-600">AI genereert content plan → Klik genereer → Artikel live!</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600">{contentPlan.length}</div>
            <div className="text-gray-600">Ideeën in plan</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600">{generatedArticles.length}</div>
            <div className="text-gray-600">Artikelen gepubliceerd</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-purple-600">
              {contentPlan.length + generatedArticles.length}
            </div>
            <div className="text-gray-600">Totaal</div>
          </div>
        </div>

        {/* Generate Plan Button */}
        {contentPlan.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Start met Content Plan</h2>
            <p className="text-gray-600 mb-6">
              AI genereert 30 artikel ideeën voor topical authority
            </p>
            <button
              onClick={generatePlan}
              disabled={loading}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-lg font-semibold"
            >
              {loading ? '⏳ Genereren...' : '🤖 Genereer Content Plan'}
            </button>
          </div>
        )}

        {/* Content Plan */}
        {contentPlan.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">📋 Content Plan</h2>
              <button
                onClick={generatePlan}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                🔄 Nieuw Plan
              </button>
            </div>

            <div className="space-y-3">
              {contentPlan.map((idea, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColors[idea.category] || 'bg-gray-100'}`}>
                        {idea.category}
                      </span>
                      <span className="text-sm text-gray-500">#{index + 1}</span>
                    </div>
                    <h3 className="text-lg font-bold mb-2">{idea.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{idea.description}</p>
                    <div className="flex gap-2 flex-wrap">
                      {idea.keywords.map((kw, i) => (
                        <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => generateArticle(idea)}
                    disabled={generating === idea.title}
                    className="ml-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold whitespace-nowrap"
                  >
                    {generating === idea.title ? '⏳ Genereren...' : '✍️ Genereer'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generated Articles */}
        {generatedArticles.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">✅ Gepubliceerde Artikelen</h2>
            <div className="space-y-3">
              {generatedArticles.map((article, index) => (
                <div key={index} className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-2">{article.title}</h3>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>📝 {article.word_count} woorden</span>
                    <a href={article.url} target="_blank" className="text-blue-600 hover:underline">
                      🔗 Bekijk artikel
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
