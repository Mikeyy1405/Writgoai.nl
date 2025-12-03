'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  HelpCircle,
  FileText,
  Download,
  Copy,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  ArrowRight,
  BarChart3,
  Users,
  Lightbulb,
  Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface KeywordData {
  keyword: string;
  searchVolume: string | number;
  difficulty: number;
  intent: string;
  cpc: string;
  trend: string;
}

interface KeywordResult {
  mainKeyword: KeywordData;
  relatedKeywords: KeywordData[];
  longTailKeywords?: KeywordData[];
  questionKeywords?: KeywordData[];
  competitorInsights?: {
    topCompetitors: string[];
    contentGaps: string[];
    opportunities: string[];
  };
  contentSuggestions?: {
    title: string;
    type: string;
    targetKeywords: string[];
  }[];
  searchIntent?: {
    primary: string;
    breakdown: Record<string, number>;
  };
  summary?: {
    totalKeywords: number;
    avgDifficulty: number;
    bestOpportunities: string[];
  };
  metadata?: {
    generatedAt: string;
    totalKeywords: number;
  };
}

export default function ZoekwoordOnderzoekPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  const [mainKeyword, setMainKeyword] = useState('');
  const [niche, setNiche] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [language, setLanguage] = useState('nl');
  const [includeQuestions, setIncludeQuestions] = useState(true);
  const [includeLongTail, setIncludeLongTail] = useState(true);
  const [includeCompetitor, setIncludeCompetitor] = useState(true);
  const [maxResults, setMaxResults] = useState(50);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<KeywordResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    related: true,
    longTail: true,
    questions: true,
    competitor: true,
    content: true,
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!session) {
    router.push('/inloggen');
    return null;
  }

  const handleResearch = async () => {
    if (!mainKeyword.trim()) {
      toast.error('Voer een zoekwoord in');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/client/keyword-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainKeyword: mainKeyword.trim(),
          niche: niche.trim(),
          targetAudience: targetAudience.trim(),
          language,
          includeQuestions,
          includeLongTail,
          includeCompetitor,
          maxResults,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Research mislukt');
      }

      const data = await response.json();
      setResults(data);
      toast.success('Keyword research voltooid!');
    } catch (error: any) {
      toast.error(error.message || 'Er ging iets mis');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const copyToClipboard = (keywords: KeywordData[]) => {
    const text = keywords.map(k => k.keyword).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Keywords gekopieerd!');
  };

  const exportToCsv = () => {
    if (!results) return;
    
    const allKeywords = [
      results.mainKeyword,
      ...(results.relatedKeywords || []),
      ...(results.longTailKeywords || []),
      ...(results.questionKeywords || []),
    ];

    const csv = [
      'Keyword,Search Volume,Difficulty,Intent,CPC,Trend',
      ...allKeywords.map(k => 
        `"${k.keyword}","${k.searchVolume}",${k.difficulty},"${k.intent}","${k.cpc}","${k.trend}"`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keyword-research-${mainKeyword.replace(/\s+/g, '-')}.csv`;
    a.click();
    toast.success('CSV geëxporteerd!');
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 30) return 'text-emerald-400 bg-emerald-400/10';
    if (difficulty < 50) return 'text-yellow-400 bg-yellow-400/10';
    if (difficulty < 70) return 'text-orange-400 bg-orange-400/10';
    return 'text-red-400 bg-red-400/10';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'rising') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getIntentBadge = (intent: string) => {
    const colors: Record<string, string> = {
      informational: 'bg-blue-500/20 text-blue-400',
      transactional: 'bg-emerald-500/20 text-emerald-400',
      commercial: 'bg-purple-500/20 text-purple-400',
      navigational: 'bg-orange-500/20 text-orange-400',
    };
    return colors[intent] || 'bg-gray-500/20 text-gray-400';
  };

  const KeywordTable = ({ keywords, title, section }: { keywords: KeywordData[]; title: string; section: string }) => (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800">
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <span className="px-2 py-0.5 bg-gray-800 rounded text-sm text-gray-400">
            {keywords.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(keywords);
            }}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Copy className="w-4 h-4 text-gray-400" />
          </button>
          {expandedSections[section] ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {expandedSections[section] && (
        <div className="border-t border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Keyword</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Volume</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Moeilijkheid</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Intent</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">CPC</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Trend</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((kw, index) => (
                  <tr key={index} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-3 px-4 text-white font-medium">{kw.keyword}</td>
                    <td className="py-3 px-4 text-center text-gray-300">{kw.searchVolume}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-sm ${getDifficultyColor(kw.difficulty)}`}>
                        {kw.difficulty}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${getIntentBadge(kw.intent)}`}>
                        {kw.intent}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-300 capitalize">{kw.cpc}</td>
                    <td className="py-3 px-4 text-center">{getTrendIcon(kw.trend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Search className="w-8 h-8 text-emerald-500" />
              Zoekwoord Onderzoek
            </h1>
            <p className="text-gray-400 mt-2">
              Ontdek winstgevende zoekwoorden voor jouw content strategie
            </p>
          </div>
          {results && (
            <button
              onClick={exportToCsv}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>

        {/* Research Form */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Main Keyword */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hoofd Zoekwoord *
              </label>
              <input
                type="text"
                value={mainKeyword}
                onChange={(e) => setMainKeyword(e.target.value)}
                placeholder="bijv. elektrische auto kopen"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Niche */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Niche / Branche
              </label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="bijv. automotive, e-commerce"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Doelgroep
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="bijv. consumenten, B2B professionals"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Taal
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                <option value="nl">Nederlands</option>
                <option value="en">Engels</option>
                <option value="de">Duits</option>
                <option value="fr">Frans</option>
              </select>
            </div>

            {/* Max Results */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Aantal Keywords
              </label>
              <select
                value={maxResults}
                onChange={(e) => setMaxResults(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                <option value={25}>25 keywords</option>
                <option value={50}>50 keywords</option>
                <option value={100}>100 keywords</option>
              </select>
            </div>

            {/* Options */}
            <div className="md:col-span-2 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLongTail}
                  onChange={(e) => setIncludeLongTail(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-gray-300">Long-tail keywords</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeQuestions}
                  onChange={(e) => setIncludeQuestions(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-gray-300">Vraag-keywords</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCompetitor}
                  onChange={(e) => setIncludeCompetitor(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-gray-300">Concurrentie analyse</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleResearch}
              disabled={loading || !mainKeyword.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Onderzoeken...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Start Onderzoek
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Search className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {results.metadata?.totalKeywords || 0}
                    </p>
                    <p className="text-sm text-gray-400">Totaal Keywords</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Target className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white capitalize">
                      {results.searchIntent?.primary || '-'}
                    </p>
                    <p className="text-sm text-gray-400">Primaire Intent</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {results.mainKeyword?.difficulty || 0}
                    </p>
                    <p className="text-sm text-gray-400">Moeilijkheid</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white capitalize">
                      {results.mainKeyword?.searchVolume || '-'}
                    </p>
                    <p className="text-sm text-gray-400">Zoekvolume</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Keyword */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-xl border border-emerald-500/30 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Hoofd Zoekwoord
              </h3>
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-2xl font-bold text-white">{results.mainKeyword?.keyword}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1 bg-gray-800 rounded-lg text-gray-300">
                    Volume: {results.mainKeyword?.searchVolume}
                  </span>
                  <span className={`px-3 py-1 rounded-lg ${getDifficultyColor(results.mainKeyword?.difficulty || 0)}`}>
                    Difficulty: {results.mainKeyword?.difficulty}
                  </span>
                  <span className={`px-3 py-1 rounded-lg ${getIntentBadge(results.mainKeyword?.intent || '')}`}>
                    {results.mainKeyword?.intent}
                  </span>
                </div>
              </div>
            </div>

            {/* Related Keywords */}
            {results.relatedKeywords?.length > 0 && (
              <KeywordTable
                keywords={results.relatedKeywords}
                title="Gerelateerde Keywords"
                section="related"
              />
            )}

            {/* Long-tail Keywords */}
            {results.longTailKeywords?.length > 0 && (
              <KeywordTable
                keywords={results.longTailKeywords}
                title="Long-tail Keywords"
                section="longTail"
              />
            )}

            {/* Question Keywords */}
            {results.questionKeywords?.length > 0 && (
              <KeywordTable
                keywords={results.questionKeywords}
                title="Vraag-gebaseerde Keywords"
                section="questions"
              />
            )}

            {/* Competitor Insights */}
            {results.competitorInsights && (
              <div className="bg-gray-900/50 rounded-xl border border-gray-800">
                <button
                  onClick={() => toggleSection('competitor')}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    Concurrentie Inzichten
                  </h3>
                  {expandedSections.competitor ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {expandedSections.competitor && (
                  <div className="border-t border-gray-800 p-4 grid md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Top Concurrenten</h4>
                      <ul className="space-y-1">
                        {results.competitorInsights.topCompetitors?.map((comp, i) => (
                          <li key={i} className="text-gray-300 flex items-center gap-2">
                            <Globe className="w-3 h-3 text-gray-500" />
                            {comp}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Content Gaps</h4>
                      <ul className="space-y-1">
                        {results.competitorInsights.contentGaps?.map((gap, i) => (
                          <li key={i} className="text-gray-300 flex items-center gap-2">
                            <ArrowRight className="w-3 h-3 text-emerald-500" />
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Kansen</h4>
                      <ul className="space-y-1">
                        {results.competitorInsights.opportunities?.map((opp, i) => (
                          <li key={i} className="text-emerald-400 flex items-center gap-2">
                            <Lightbulb className="w-3 h-3" />
                            {opp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Content Suggestions */}
            {results.contentSuggestions?.length > 0 && (
              <div className="bg-gray-900/50 rounded-xl border border-gray-800">
                <button
                  onClick={() => toggleSection('content')}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    Content Suggesties
                  </h3>
                  {expandedSections.content ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {expandedSections.content && (
                  <div className="border-t border-gray-800 p-4 space-y-3">
                    {results.contentSuggestions.map((suggestion, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-4 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-white font-medium">{suggestion.title}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                              {suggestion.type}
                            </span>
                            {suggestion.targetKeywords?.slice(0, 3).map((kw, j) => (
                              <span key={j} className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                        <Link
                          href={`/client-portal/blog-generator?keyword=${encodeURIComponent(suggestion.targetKeywords?.[0] || suggestion.title)}`}
                          className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm transition-colors"
                        >
                          Schrijf
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Search Intent Breakdown */}
            {results.searchIntent?.breakdown && (
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-yellow-400" />
                  Zoekintentie Verdeling
                </h3>
                <div className="grid sm:grid-cols-4 gap-4">
                  {Object.entries(results.searchIntent.breakdown).map(([intent, percentage]) => (
                    <div key={intent} className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-2">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-gray-700"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={`${(percentage as number) * 1.76} 176`}
                            className={getIntentBadge(intent).replace('bg-', 'text-').replace('/20', '')}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-white font-bold">
                          {percentage}%
                        </span>
                      </div>
                      <p className="text-gray-300 capitalize text-sm">{intent}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!results && !loading && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              Start je keyword research
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Voer een zoekwoord in en ontdek gerelateerde keywords, long-tail variaties,
              en content kansen voor jouw strategie.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
