'use client';

import { useState } from 'react';

interface NewsSource {
  title: string;
  summary: string;
  source: string;
  url?: string;
  publishedDate?: string;
}

interface NewsArticle {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  headings: string[];
}

interface FeaturedImage {
  url: string;
  alt: string;
  photographer?: string;
  photographerUrl?: string;
  source?: string;
}

interface NewsResearchResponse {
  sources: NewsSource[];
  article?: NewsArticle;
  featuredImage?: FeaturedImage;
  suggestedTopics: string[];
  generatedAt: string;
  error?: string;
  rawResearch?: string;
}

type ResearchType = 'website' | 'topic' | 'prompt';

export default function AdminNewsWriter() {
  const [researchType, setResearchType] = useState<ResearchType>('topic');
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<'nl' | 'en'>('nl');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NewsResearchResponse | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
          generateArticle: true,
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
        return 'bijv. AI ontwikkelingen, elektrische autos, crypto nieuws...';
      case 'prompt':
        return 'bijv. Schrijf een nieuwsartikel over de laatste ontwikkelingen in de techsector...';
      default:
        return '';
    }
  };

  const getInputLabel = () => {
    switch (researchType) {
      case 'website':
        return 'Website URL';
      case 'topic':
        return 'Nieuwsonderwerp';
      case 'prompt':
        return 'Custom Opdracht';
      default:
        return 'Input';
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyFullArticle = () => {
    if (!result?.article) return;
    const fullContent = `# ${result.article.title}\n\n${result.article.content.replace(/<[^>]*>/g, '\n').replace(/\n\n+/g, '\n\n').trim()}`;
    copyToClipboard(fullContent, 'article');
  };

  const copyHtmlArticle = () => {
    if (!result?.article) return;
    const htmlContent = `<h1>${result.article.title}</h1>\n${result.article.content}`;
    copyToClipboard(htmlContent, 'html');
  };

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-6">Nieuwsartikel Genereren</h2>

        {/* Research Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Input Type
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
              Custom
            </button>
          </div>
        </div>

        {/* Language Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Artikel Taal
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
              Nederlands
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                language === 'en'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              English
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

        {/* Generate Button */}
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
              Research en artikel genereren...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>🚀</span>
              Genereer Nieuwsartikel
            </span>
          )}
        </button>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Generated Article */}
          {result.article && (
            <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl border border-green-700/50 overflow-hidden">
              {/* Featured Image */}
              {result.featuredImage && (
                <div className="relative">
                  <img
                    src={result.featuredImage.url}
                    alt={result.featuredImage.alt}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">
                        Foto: {result.featuredImage.photographer || 'Onbekend'}
                        {result.featuredImage.source && ` via ${result.featuredImage.source}`}
                      </span>
                      <button
                        onClick={() => copyToClipboard(result.featuredImage!.url, 'image')}
                        className="text-white/80 hover:text-white transition-colors"
                      >
                        {copiedField === 'image' ? '✓ Gekopieerd' : '📋 Kopieer URL'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6">
                {/* Category Badge */}
                <div className="mb-4">
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                    {result.article.category}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white mb-4">
                  {result.article.title}
                </h2>

                {/* Excerpt */}
                <p className="text-gray-300 text-lg mb-6 italic border-l-4 border-green-500 pl-4">
                  {result.article.excerpt}
                </p>

                {/* Article Content */}
                <div
                  className="prose prose-invert prose-lg max-w-none mb-6"
                  dangerouslySetInnerHTML={{ __html: result.article.content }}
                />

                {/* SEO Section */}
                <div className="bg-gray-900/50 rounded-lg p-5 mb-6 border border-gray-600">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span>🔍</span> SEO Gegevens
                  </h3>

                  <div className="space-y-4">
                    {/* Focus Keyword */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium text-gray-400">Focus Keyword</label>
                        <button
                          onClick={() => copyToClipboard(result.article!.focusKeyword, 'focusKeyword')}
                          className="text-xs text-orange-400 hover:text-orange-300"
                        >
                          {copiedField === 'focusKeyword' ? '✓ Gekopieerd' : 'Kopieer'}
                        </button>
                      </div>
                      <div className="px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg text-orange-300 font-medium">
                        {result.article.focusKeyword}
                      </div>
                    </div>

                    {/* SEO Title */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium text-gray-400">
                          SEO Titel <span className="text-gray-500">({result.article.seoTitle?.length || 0}/60)</span>
                        </label>
                        <button
                          onClick={() => copyToClipboard(result.article!.seoTitle, 'seoTitle')}
                          className="text-xs text-orange-400 hover:text-orange-300"
                        >
                          {copiedField === 'seoTitle' ? '✓ Gekopieerd' : 'Kopieer'}
                        </button>
                      </div>
                      <div className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white">
                        {result.article.seoTitle}
                      </div>
                    </div>

                    {/* Meta Description */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium text-gray-400">
                          Meta Omschrijving <span className="text-gray-500">({result.article.metaDescription?.length || 0}/155)</span>
                        </label>
                        <button
                          onClick={() => copyToClipboard(result.article!.metaDescription, 'metaDescription')}
                          className="text-xs text-orange-400 hover:text-orange-300"
                        >
                          {copiedField === 'metaDescription' ? '✓ Gekopieerd' : 'Kopieer'}
                        </button>
                      </div>
                      <div className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-300 text-sm">
                        {result.article.metaDescription}
                      </div>
                    </div>

                    {/* Headings */}
                    {result.article.headings && result.article.headings.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-sm font-medium text-gray-400">Tussenkoppen (H2)</label>
                          <button
                            onClick={() => copyToClipboard(result.article!.headings.join('\n'), 'headings')}
                            className="text-xs text-orange-400 hover:text-orange-300"
                          >
                            {copiedField === 'headings' ? '✓ Gekopieerd' : 'Kopieer alle'}
                          </button>
                        </div>
                        <div className="space-y-1">
                          {result.article.headings.map((heading, index) => (
                            <div key={index} className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-300 text-sm">
                              <span className="text-orange-400 font-mono text-xs">H2</span>
                              {heading}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={copyFullArticle}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      copiedField === 'article'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {copiedField === 'article' ? '✓ Gekopieerd!' : '📝 Kopieer als Tekst'}
                  </button>
                  <button
                    onClick={copyHtmlArticle}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      copiedField === 'html'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {copiedField === 'html' ? '✓ Gekopieerd!' : '🔗 Kopieer als HTML'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(result.article!.title, 'title')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      copiedField === 'title'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {copiedField === 'title' ? '✓ Gekopieerd!' : '📰 Kopieer Titel'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(result.article!.excerpt, 'excerpt')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      copiedField === 'excerpt'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {copiedField === 'excerpt' ? '✓ Gekopieerd!' : '💬 Kopieer Excerpt'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Topics */}
          {result.suggestedTopics && result.suggestedTopics.length > 0 && (
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span>💡</span> Gerelateerde Onderwerpen
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

          {/* Sources */}
          {result.sources && result.sources.length > 0 && (
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <span>📚</span> Bronnen ({result.sources.length})
              </h3>
              <div className="space-y-4">
                {result.sources.map((source, index) => (
                  <div
                    key={index}
                    className="bg-gray-900/50 rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-white mb-2">
                          {source.title}
                        </h4>
                        <p className="text-gray-400 text-sm mb-3">
                          {source.summary}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500">
                            {source.source}
                          </span>
                          {source.publishedDate && (
                            <span className="text-gray-500">
                              {source.publishedDate}
                            </span>
                          )}
                          {source.url && (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-400 hover:text-orange-300 transition-colors"
                            >
                              Bekijk bron →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated At */}
          <div className="text-center text-sm text-gray-500">
            Gegenereerd op: {new Date(result.generatedAt).toLocaleString('nl-NL')}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !result && !error && (
        <div className="bg-gray-800/30 rounded-xl p-12 border border-gray-700/50 text-center">
          <div className="text-6xl mb-4">📰</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Klaar om een nieuwsartikel te genereren
          </h3>
          <p className="text-gray-400 max-w-md mx-auto mb-4">
            Voer een website, onderwerp of custom opdracht in. De News Writer
            doet research met Perplexity en schrijft een professioneel artikel
            zoals je zou zien op NU.nl of RTL Nieuws.
          </p>
          <div className="text-sm text-gray-500">
            Inclusief passende featured image van Pixabay, Pexels of Unsplash
          </div>
        </div>
      )}
    </div>
  );
}
