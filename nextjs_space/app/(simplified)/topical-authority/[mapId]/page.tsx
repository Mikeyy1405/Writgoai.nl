/**
 * Topical Authority Map Detail Page
 * Shows the complete map with pillars, subtopics, and articles
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, ChevronRight, ChevronDown, FileText, CheckCircle2, Clock, PlayCircle, ExternalLink, Globe } from 'lucide-react';

export default function TopicalAuthorityMapPage() {
  const router = useRouter();
  const params = useParams();
  const mapId = params.mapId as string;

  const [loading, setLoading] = useState(true);
  const [map, setMap] = useState<any>(null);
  const [expandedPillars, setExpandedPillars] = useState<Set<string>>(new Set());
  const [expandedSubtopics, setExpandedSubtopics] = useState<Set<string>>(new Set());
  const [generatingArticleId, setGeneratingArticleId] = useState<string | null>(null);
  const [publishingArticleId, setPublishingArticleId] = useState<string | null>(null);

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
      
      // Redirect direct naar de nieuwe auto-generate route
      // Deze route handelt automatisch de volledige generatie af
      console.log('[TopicalAuthority] Redirecting to auto-generate:', articleId);
      router.push(`/topical-authority/generate/${articleId}`);
      
    } catch (error: any) {
      console.error('[TopicalAuthority] Error:', error);
      alert('Fout: ' + error.message);
      setGeneratingArticleId(null);
    }
  };

  const publishToBlog = async (articleId: string) => {
    if (publishingArticleId) return; // Prevent multiple publishes

    if (!confirm('Weet je zeker dat je dit artikel wilt publiceren naar de Writgo.nl blog?')) {
      return;
    }

    try {
      setPublishingArticleId(articleId);
      
      const response = await fetch('/api/client/blog/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.alreadyPublished) {
          alert('✅ Dit artikel is al gepubliceerd!\n\nBekijk het op: https://writgo.nl' + data.blogPost.url);
        } else {
          alert('✅ Artikel gepubliceerd naar Writgo.nl blog!\n\nBekijk het op: https://writgo.nl' + data.blogPost.url);
        }
        // Reload map to update blogPostId
        loadMap();
      } else {
        alert('❌ Fout: ' + (data.error || 'Kon artikel niet publiceren'));
      }
    } catch (error: any) {
      alert('❌ Fout: ' + error.message);
    } finally {
      setPublishingArticleId(null);
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

  // Als er geen pillars zijn, toon de simpele lijst view
  if (!map.pillars || map.pillars.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold mb-2 text-yellow-900">
              ⚠️ Geen Pillar Structuur Beschikbaar
            </h2>
            <p className="text-yellow-700 mb-4">
              Deze map heeft geen pillar/subtopic structuur. Gebruik de simpele lijst view om de artikelen te bekijken.
            </p>
            <button
              onClick={() => router.push(`/topical-authority/${mapId}/lijst`)}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 font-medium"
            >
              → Bekijk Simpele Artikel Lijst
            </button>
          </div>
          
          {/* Stats Preview */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h3 className="font-bold text-lg mb-4">{map.niche}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{map.totalArticlesTarget}</div>
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
            </div>
          </div>
        </div>
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
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{map.niche}</h1>
              <p className="text-slate-200">{map.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/topical-authority/${mapId}/lijst`)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
              >
                📋 Simpele Lijst
              </button>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                map.status === 'active' ? 'bg-green-100 text-green-700' :
                map.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-white'
              }`}>
                {map.status === 'active' ? 'Actief' : 
                 map.status === 'completed' ? 'Voltooid' : 'Concept'}
              </div>
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
              <div className="text-sm text-slate-200">Target Artikelen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{map.totalArticlesPlanned}</div>
              <div className="text-sm text-slate-200">Gepland</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{map.totalArticlesGenerated}</div>
              <div className="text-sm text-slate-200">Gegenereerd</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{map.totalArticlesPublished}</div>
              <div className="text-sm text-slate-200">Gepubliceerd</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{map.pillars?.length || 0}</div>
              <div className="text-sm text-slate-200">Pillars</div>
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
                      <ChevronDown className="w-5 h-5 text-slate-200" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-200" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{pillar.title}</h3>
                      <p className="text-sm text-slate-200">{pillar.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{pillarProgress}% voltooid</div>
                      <div className="text-xs text-slate-200">
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
                                <ChevronDown className="w-4 h-4 text-slate-200" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-200" />
                              )}
                              <div className="flex-1">
                                <h4 className="font-semibold">{subtopic.title}</h4>
                                <p className="text-xs text-slate-200">{subtopic.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-medium">{subtopicProgress}%</div>
                              <div className="text-xs text-slate-200">
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
                                      <Clock className="w-4 h-4 text-slate-200" />
                                    )}
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{article.title}</div>
                                      <div className="text-xs text-slate-200">
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
                                    {article.status === 'generated' && !article.blogPostId && (
                                      <button
                                        onClick={() => publishToBlog(article.id)}
                                        disabled={publishingArticleId === article.id}
                                        className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2"
                                        title="Publiceer naar Writgo.nl blog"
                                      >
                                        {publishingArticleId === article.id ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <Globe className="w-3 h-3" />
                                        )}
                                        Publiceer
                                      </button>
                                    )}
                                    {article.blogPostId && (
                                      <a
                                        href={`/blog/${article.blogPostSlug || ''}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                        title="Bekijk op Writgo.nl blog"
                                      >
                                        <Globe className="w-3 h-3" />
                                        Blog
                                      </a>
                                    )}
                                    {article.publishedUrl && (
                                      <a
                                        href={article.publishedUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 flex items-center gap-2"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        WordPress
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
