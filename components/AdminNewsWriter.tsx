'use client';

import { useState } from 'react';

interface NewsArticle {
  title: string;
  summary: string;
  source: string;
  url?: string;
  publishedDate?: string;
  relevanceScore: number;
}

interface NewsResearchResponse {
  articles: NewsArticle[];
  analysis: string;
  suggestedTopics: string[];
  generatedAt: string;
  parseError?: boolean;
}

type ResearchType = 'website' | 'topic' | 'prompt';

export default function AdminNewsWriter() {
  const [researchType, setResearchType] = useState<ResearchType>('topic');
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<'nl' | 'en'>('nl');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NewsResearchResponse | null>(null);

  const handleResearch = async () => {
    if (!input.trim()) {
      setError('Voer een zoekopdracht in');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/news-writer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: researchType,
          input: input.trim(),
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Er is een fout opgetreden');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholder = () => {
    switch (researchType) {
      case 'website':
        return 'https://voorbeeld.nl of voorbeeld.nl';
      case 'topic':
        return 'bijv. AI ontwikkelingen, duurzame energie, crypto nieuws...';
      case 'prompt':
        return 'bijv. Zoek naar nieuws over de laatste iPhone release en vergelijk met Samsung...';
      default:
        return '';
    }
  };

  const getInputLabel = () => {
    switch (researchType) {
      case 'website':
        return 'Website URL';
      case 'topic':
        return 'Onderwerp';
      case 'prompt':
        return 'Research Opdracht';
      default:
        return 'Input';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-6">Nieuws Research</h2>

        {/* Research Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Research Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setResearchType('website')}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                researchType === 'website'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span className="text-lg mr-2">🌐</span>
              Website
            </button>
            <button
              onClick={() => setResearchType('topic')}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                researchType === 'topic'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span className="text-lg mr-2">📰</span>
              Onderwerp
            </button>
            <button
              onClick={() => setResearchType('prompt')}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                researchType === 'prompt'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span className="text-lg mr-2">✍️</span>
              Custom Prompt
            </button>
          </div>
        </div>

        {/* Language Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Taal
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setLanguage('nl')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                language === 'nl'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              🇳🇱 Nederlands
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                language === 'en'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>

        {/* Input Field */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {getInputLabel()}
          </label>
          {researchType === 'prompt' ? (
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={getPlaceholder()}
              rows={4}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          ) : (
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={getPlaceholder()}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleResearch();
                }
              }}
            />
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Research Button */}
        <button
          onClick={handleResearch}
          disabled={loading || !input.trim()}
          className={`w-full px-6 py-4 rounded-lg text-white font-semibold transition-all ${
            loading || !input.trim()
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Bezig met research...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>🔍</span>
              Start Research
            </span>
          )}
        </button>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Analysis */}
          <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <span>📊</span> Analyse
              </h3>
              <button
                onClick={() => copyToClipboard(result.analysis)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
                title="Kopieer analyse"
              >
                📋 Kopieer
              </button>
            </div>
            <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {result.analysis}
            </div>
          </div>

          {/* Suggested Topics */}
          {result.suggestedTopics && result.suggestedTopics.length > 0 && (
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span>💡</span> Voorgestelde Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.suggestedTopics.map((topic, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setResearchType('topic');
                      setInput(topic);
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-orange-500 text-gray-300 hover:text-white rounded-full text-sm transition-all"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* News Articles */}
          {result.articles && result.articles.length > 0 && (
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <span>📰</span> Nieuwsartikelen ({result.articles.length})
              </h3>
              <div className="space-y-4">
                {result.articles.map((article, index) => (
                  <div
                    key={index}
                    className="bg-gray-900/50 rounded-lg p-5 border border-gray-700 hover:border-orange-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              article.relevanceScore >= 80
                                ? 'bg-green-500/20 text-green-400'
                                : article.relevanceScore >= 60
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}
                          >
                            {article.relevanceScore}% relevant
                          </span>
                          {article.publishedDate && (
                            <span className="text-xs text-gray-500">
                              {article.publishedDate}
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg font-medium text-white mb-2">
                          {article.title}
                        </h4>
                        <p className="text-gray-400 text-sm mb-3">
                          {article.summary}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500">
                            Bron: <span className="text-gray-400">{article.source}</span>
                          </span>
                          {article.url && (
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-400 hover:text-orange-300 transition-colors"
                            >
                              Bekijk artikel →
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `${article.title}\n\n${article.summary}\n\nBron: ${article.source}${
                              article.url ? `\nURL: ${article.url}` : ''
                            }`
                          )
                        }
                        className="text-gray-500 hover:text-white transition-colors"
                        title="Kopieer artikel"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated At */}
          <div className="text-center text-sm text-gray-500">
            Gegenereerd op: {new Date(result.generatedAt).toLocaleString('nl-NL')}
            {result.parseError && (
              <span className="ml-2 text-yellow-500">
                (Raw response - parsing failed)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !result && !error && (
        <div className="bg-gray-800/30 rounded-xl p-12 border border-gray-700/50 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Klaar om nieuws te researchen
          </h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Kies een research type, voer je zoekopdracht in en ontdek het meest
            actuele en relevante nieuws voor jouw content.
          </p>
        </div>
      )}
    </div>
  );
}
