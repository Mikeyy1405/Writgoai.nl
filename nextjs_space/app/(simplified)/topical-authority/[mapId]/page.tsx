/**
 * Topical Authority Map Detail Page
 * Shows the complete map with pillars, subtopics, and articles
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, ChevronRight, ChevronDown, FileText, CheckCircle2, Clock, PlayCircle, ExternalLink } from 'lucide-react';

export default function TopicalAuthorityMapPage() {
  const router = useRouter();
  const params = useParams();
  const mapId = params.mapId as string;

  const [loading, setLoading] = useState(true);
  const [map, setMap] = useState<any>(null);
  const [expandedPillars, setExpandedPillars] = useState<Set<string>>(new Set());
  const [expandedSubtopics, setExpandedSubtopics] = useState<Set<string>>(new Set());
  const [generatingArticleId, setGeneratingArticleId] = useState<string | null>(null);

  useEffect(() => {
    loadMap();
  }, [mapId]);

  const loadMap = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client/topical-authority/map/${mapId}`);
      const data = await response.json();
      
      if (data.success) {
        setMap(data.data);
        // Expand first pillar by default
        if (data.data.pillars && data.data.pillars.length > 0) {
          setExpandedPillars(new Set([data.data.pillars[0].id]));
        }
      }
    } catch (error) {
      console.error('Failed to load map:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePillar = (pillarId: string) => {
    const newExpanded = new Set(expandedPillars);
    if (newExpanded.has(pillarId)) {
      newExpanded.delete(pillarId);
    } else {
      newExpanded.add(pillarId);
    }
    setExpandedPillars(newExpanded);
  };

  const toggleSubtopic = (subtopicId: string) => {
    const newExpanded = new Set(expandedSubtopics);
    if (newExpanded.has(subtopicId)) {
      newExpanded.delete(subtopicId);
    } else {
      newExpanded.add(subtopicId);
    }
    setExpandedSubtopics(newExpanded);
  };

  const generateArticle = async (articleId: string) => {
    if (generatingArticleId) return; // Prevent multiple generations

    try {
      setGeneratingArticleId(articleId);
      
      const response = await fetch('/api/client/topical-authority/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to content generation page with pre-filled data
        const articleData = data.data;
        router.push(`/client-portal/schrijven?fromTopicalAuthority=true&articleId=${articleId}&title=${encodeURIComponent(articleData.title)}`);
      } else {
        alert('Fout: ' + (data.details || data.error));
      }
    } catch (error: any) {
      alert('Fout: ' + error.message);
    } finally {
      setGeneratingArticleId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!map) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Map niet gevonden</h1>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 bg-primary text-white rounded-lg"
        >
          Terug
        </button>
      </div>
    );
  }

  const progress = Math.round((map.totalArticlesPublished / map.totalArticlesTarget) * 100);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{map.niche}</h1>
              <p className="text-gray-600">{map.description}</p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              map.status === 'active' ? 'bg-green-100 text-green-700' :
              map.status === 'completed' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {map.status === 'active' ? 'Actief' : 
               map.status === 'completed' ? 'Voltooid' : 'Concept'}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">Totale Voortgang</span>
              <span className="font-bold">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-primary to-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{map.totalArticlesTarget}</div>
              <div className="text-sm text-gray-600">Target Artikelen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{map.totalArticlesPlanned}</div>
              <div className="text-sm text-gray-600">Gepland</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{map.totalArticlesGenerated}</div>
              <div className="text-sm text-gray-600">Gegenereerd</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{map.totalArticlesPublished}</div>
              <div className="text-sm text-gray-600">Gepubliceerd</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{map.pillars?.length || 0}</div>
              <div className="text-sm text-gray-600">Pillars</div>
            </div>
          </div>
        </div>

        {/* Topical Authority Map Tree */}
        <div className="space-y-4">
          {map.pillars?.map((pillar: any) => {
            const isExpanded = expandedPillars.has(pillar.id);
            const pillarProgress = pillar.subtopics
              ? Math.round(
                  (pillar.subtopics.reduce((sum: number, st: any) => 
                    sum + (st.articles?.filter((a: any) => a.status === 'published').length || 0), 0) /
                   pillar.subtopics.reduce((sum: number, st: any) => sum + (st.articles?.length || 0), 0)) * 100
                )
              : 0;

            return (
              <div key={pillar.id} className="bg-white rounded-xl border-2 border-gray-200">
                {/* Pillar Header */}
                <div
                  onClick={() => togglePillar(pillar.id)}
                  className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{pillar.title}</h3>
                      <p className="text-sm text-gray-600">{pillar.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{pillarProgress}% voltooid</div>
                      <div className="text-xs text-gray-600">
                        {pillar.subtopics?.length || 0} subtopics
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtopics */}
                {isExpanded && pillar.subtopics && (
                  <div className="border-t border-gray-200">
                    {pillar.subtopics.map((subtopic: any) => {
                      const isSubExpanded = expandedSubtopics.has(subtopic.id);
                      const subtopicProgress = subtopic.articles
                        ? Math.round(
                            (subtopic.articles.filter((a: any) => a.status === 'published').length /
                             subtopic.articles.length) * 100
                          )
                        : 0;

                      return (
                        <div key={subtopic.id} className="border-b border-gray-100 last:border-b-0">
                          {/* Subtopic Header */}
                          <div
                            onClick={() => toggleSubtopic(subtopic.id)}
                            className="p-4 pl-12 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {isSubExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                              <div className="flex-1">
                                <h4 className="font-semibold">{subtopic.title}</h4>
                                <p className="text-xs text-gray-600">{subtopic.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-medium">{subtopicProgress}%</div>
                              <div className="text-xs text-gray-600">
                                {subtopic.articles?.length || 0} artikelen
                              </div>
                            </div>
                          </div>

                          {/* Articles */}
                          {isSubExpanded && subtopic.articles && (
                            <div className="bg-gray-50">
                              {subtopic.articles.map((article: any) => (
                                <div
                                  key={article.id}
                                  className="p-3 pl-20 flex items-center justify-between hover:bg-white border-b border-gray-200 last:border-b-0"
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    {article.status === 'published' ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    ) : article.status === 'generated' ? (
                                      <FileText className="w-4 h-4 text-blue-600" />
                                    ) : (
                                      <Clock className="w-4 h-4 text-gray-400" />
                                    )}
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{article.title}</div>
                                      <div className="text-xs text-gray-600">
                                        {article.focusKeyword} • {article.wordCountTarget} woorden
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {article.status === 'planned' && (
                                      <button
                                        onClick={() => generateArticle(article.id)}
                                        disabled={generatingArticleId === article.id}
                                        className="px-4 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 flex items-center gap-2"
                                      >
                                        {generatingArticleId === article.id ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <PlayCircle className="w-3 h-3" />
                                        )}
                                        Genereer
                                      </button>
                                    )}
                                    {article.publishedUrl && (
                                      <a
                                        href={article.publishedUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 flex items-center gap-2"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        Bekijk
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
