'use client';

import { useEffect, useState } from 'react';
import { Calendar, Sparkles, Play, Pause, RefreshCw, CheckCircle } from 'lucide-react';

interface ContentPlanDay {
  day: number;
  date: string;
  theme: string;
  mainKeyword?: string;
  blog?: {
    title: string;
    description: string;
    keywords: string[];
  };
  instagram?: {
    caption: string;
    hashtags: string[];
  };
  tiktok?: {
    title: string;
    description: string;
  };
  youtube?: {
    title: string;
    description: string;
  };
}

interface ClientStatus {
  isSetup: boolean;
  hasContentPlan: boolean;
  automationActive: boolean;
  lastPlanGenerated?: string;
  client?: {
    id: string;
    contentPlan?: ContentPlanDay[];
  };
}

export default function WritgoContentPlan() {
  const [status, setStatus] = useState<ClientStatus | null>(null);
  const [contentPlan, setContentPlan] = useState<ContentPlanDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<7 | 14 | 30>(7);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/writgo-marketing/status');
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatus(data);
      
      if (data.client?.contentPlan) {
        setContentPlan(data.client.contentPlan);
      }
    } catch (err) {
      setError('Failed to load status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      const response = await fetch('/api/admin/writgo-marketing/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: selectedDays })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate plan');
      }
      
      const data = await response.json();
      setContentPlan(data.contentPlan);
      await fetchStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to generate content plan');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleAutomation = async () => {
    if (!status?.hasContentPlan) {
      setError('Genereer eerst een content plan voordat je automation activeert');
      return;
    }

    try {
      setToggling(true);
      setError(null);
      
      const response = await fetch('/api/admin/writgo-marketing/activate-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !status?.automationActive })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to toggle automation');
      }
      
      await fetchStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle automation');
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!status?.isSetup) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
            <Calendar className="w-16 h-16 text-[#FF6B35] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-100 mb-4">
              Setup Vereist
            </h1>
            <p className="text-gray-400 mb-6">
              Ga eerst naar het hoofddashboard om Writgo.nl als client op te zetten.
            </p>
            <a
              href="/admin/writgo-marketing"
              className="inline-block px-6 py-3 bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-lg transition-colors"
            >
              Naar Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-[#FF6B35]" />
            <h1 className="text-3xl font-bold text-gray-100">Content Planning</h1>
          </div>
          <p className="text-gray-400">
            Genereer en beheer je content plan voor Writgo.nl
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                Genereer Content Plan
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Kies hoeveel dagen vooruit je wilt plannen
              </p>
              
              <div className="flex gap-3 mb-4">
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    onClick={() => setSelectedDays(days as 7 | 14 | 30)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedDays === days
                        ? 'bg-[#FF6B35] text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {days} dagen
                  </button>
                ))}
              </div>

              <button
                onClick={handleGeneratePlan}
                disabled={generating}
                className="px-6 py-3 bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Bezig met genereren...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Genereer Plan
                  </>
                )}
              </button>

              {status.lastPlanGenerated && (
                <p className="mt-2 text-sm text-gray-500">
                  Laatste update: {new Date(status.lastPlanGenerated).toLocaleDateString('nl-NL')} om{' '}
                  {new Date(status.lastPlanGenerated).toLocaleTimeString('nl-NL')}
                </p>
              )}
            </div>

            <div className="flex-1 lg:text-right">
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                Automation Status
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                {status.automationActive 
                  ? 'Content wordt automatisch gegenereerd'
                  : 'Automation staat uit'
                }
              </p>
              
              <button
                onClick={handleToggleAutomation}
                disabled={toggling || !status.hasContentPlan}
                className={`px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                  status.automationActive
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {toggling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Bezig...
                  </>
                ) : status.automationActive ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Deactiveer Automation
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Activeer Automation
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Content Plan Display */}
        {contentPlan.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">
              Content Plan ({contentPlan.length} dagen)
            </h2>
            
            {contentPlan.map((day) => (
              <div
                key={day.day}
                className="bg-gray-900 rounded-xl border border-gray-800 p-6"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#FF6B35] rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">{day.day}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-100 mb-1">
                      {day.theme}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {new Date(day.date).toLocaleDateString('nl-NL', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    {day.mainKeyword && (
                      <p className="text-[#FF6B35] text-sm mt-1">
                        🎯 {day.mainKeyword}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Blog */}
                  {day.blog && (
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <h4 className="font-semibold text-gray-100 mb-2 flex items-center gap-2">
                        📝 Blog Post
                      </h4>
                      <p className="text-gray-200 font-medium mb-2">{day.blog.title}</p>
                      <p className="text-gray-400 text-sm mb-3">{day.blog.description}</p>
                      {day.blog.keywords && day.blog.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {day.blog.keywords.slice(0, 3).map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Instagram */}
                  {day.instagram && (
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <h4 className="font-semibold text-gray-100 mb-2 flex items-center gap-2">
                        📸 Instagram Post
                      </h4>
                      <p className="text-gray-300 text-sm mb-3 line-clamp-3">
                        {day.instagram.caption}
                      </p>
                      {day.instagram.hashtags && day.instagram.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {day.instagram.hashtags.slice(0, 5).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[#FF6B35] text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TikTok */}
                  {day.tiktok && (
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <h4 className="font-semibold text-gray-100 mb-2 flex items-center gap-2">
                        🎵 TikTok Video
                      </h4>
                      <p className="text-gray-200 font-medium mb-2">{day.tiktok.title}</p>
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {day.tiktok.description}
                      </p>
                    </div>
                  )}

                  {/* YouTube */}
                  {day.youtube && (
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <h4 className="font-semibold text-gray-100 mb-2 flex items-center gap-2">
                        🎬 YouTube Short
                      </h4>
                      <p className="text-gray-200 font-medium mb-2">{day.youtube.title}</p>
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {day.youtube.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-100 mb-2">
              Nog geen content plan
            </h3>
            <p className="text-gray-400 mb-6">
              Genereer een content plan om te beginnen met je marketing automation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
