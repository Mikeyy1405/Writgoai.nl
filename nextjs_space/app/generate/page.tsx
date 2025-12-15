'use client';

import { useState, useEffect } from 'react';
import SimplifiedLayout from '@/components/SimplifiedLayout';
import { Sparkles, Loader2, Eye, ChevronDown, ChevronUp } from 'lucide-react';

interface Topic {
  title: string;
  description: string;
  keywords: string[];
  priority: string;
}

interface ContentPlan {
  id: string;
  source: string;
  name: string;
  plan: {
    keyword: string;
    topics: Topic[];
  };
}

export default function GeneratePage() {
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [generatedArticle, setGeneratedArticle] = useState<any>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/simplified/content-plan');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
        if (data.plans.length > 0) {
          setExpandedPlan(data.plans[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateArticle = async (topic: Topic, projectId: string) => {
    setGenerating(true);
    setSelectedTopic(topic);
    setGeneratedArticle(null);

    try {
      const response = await fetch('/api/simplified/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          projectId: projectId !== 'client' ? projectId : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate article');
      }

      const data = await response.json();
      setGeneratedArticle(data.article);
    } catch (error) {
      console.error('Error generating article:', error);
      alert('Er ging iets mis bij het genereren van het artikel.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <SimplifiedLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </SimplifiedLayout>
    );
  }

  if (plans.length === 0) {
    return (
      <SimplifiedLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800">✨ Content Genereren</h1>
            <p className="text-lg text-slate-600 mt-2">Laat AI je artikelen schrijven</p>
          </div>
          <div className="bg-white rounded-xl p-12 text-center shadow-lg">
            <Sparkles className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Maak eerst een content plan!
            </h2>
            <p className="text-slate-600 mb-4">
              Ga naar Content Plan om topics te genereren.
            </p>
            <a
              href="/content-plan"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:shadow-xl transition-shadow"
            >
              <Sparkles className="w-5 h-5" />
              <span>Naar Content Plan</span>
            </a>
          </div>
        </div>
      </SimplifiedLayout>
    );
  }

  return (
    <SimplifiedLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">✨ Content Genereren</h1>
          <p className="text-lg text-slate-600 mt-2">Laat AI je artikelen schrijven</p>
        </div>

        {/* Generated Article Preview */}
        {generatedArticle && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-lg border-2 border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-800">
                ✅ Artikel Gegenereerd!
              </h2>
              <a
                href="/publish"
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-shadow text-sm font-semibold"
              >
                Naar Publiceren →
              </a>
            </div>

            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {generatedArticle.title}
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                {generatedArticle.metaDescription}
              </p>
              
              {generatedArticle.featuredImage && (
                <img
                  src={generatedArticle.featuredImage}
                  alt={generatedArticle.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}

              <div className="flex items-center space-x-4 text-sm text-slate-500">
                <span>📝 {generatedArticle.wordCount} woorden</span>
                <span>•</span>
                <span>🖼️ Featured image gegenereerd</span>
                <span>•</span>
                <span>✅ SEO geoptimaliseerd</span>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-700 hover:text-orange-600">
                  Bekijk artikel preview
                </summary>
                <div
                  className="mt-4 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: generatedArticle.content.substring(0, 1000) + '...' }}
                />
              </details>
            </div>
          </div>
        )}

        {/* Content Plans with Topics */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            📚 Selecteer een topic om te genereren
          </h2>

          <div className="space-y-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="border border-slate-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedPlan(expandedPlan === plan.id ? null : plan.id)
                  }
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="text-left">
                    <h3 className="font-bold text-slate-800">
                      {plan.plan.keyword}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {plan.name} • {plan.plan.topics.length} topics
                    </p>
                  </div>
                  {expandedPlan === plan.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {expandedPlan === plan.id && (
                  <div className="px-4 pb-4 space-y-2">
                    {plan.plan.topics.map((topic: Topic, index: number) => (
                      <div
                        key={index}
                        className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-800 mb-1">
                              {topic.title}
                            </h4>
                            <p className="text-sm text-slate-600 mb-2">
                              {topic.description}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {topic.keywords.map((kw, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-white text-slate-600 rounded text-xs"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => handleGenerateArticle(topic, plan.id)}
                            disabled={generating}
                            className="ml-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center space-x-2 text-sm font-semibold whitespace-nowrap"
                          >
                            {generating && selectedTopic === topic ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Genereren...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                <span>Genereer</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {generating && selectedTopic && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <h3 className="font-semibold text-blue-900">
                  Artikel wordt gegenereerd...
                </h3>
              </div>
              <p className="text-sm text-blue-700">
                AI schrijft een compleet artikel over: <strong>{selectedTopic.title}</strong>
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Dit kan 30-60 seconden duren. We genereren content, featured image en SEO metadata.
              </p>
            </div>
          )}
        </div>
      </div>
    </SimplifiedLayout>
  );
}
