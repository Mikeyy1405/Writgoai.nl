'use client';

import { useState, useEffect } from 'react';

interface ContentUpdateSuggestion {
  contentId: string;
  title: string;
  url: string;
  publishedAt: string;
  suggestions: {
    type: 'seo' | 'content' | 'readability' | 'freshness';
    priority: 'low' | 'medium' | 'high';
    description: string;
    estimatedImpact: string;
  }[];
  currentScore: {
    seo: number;
    readability: number;
    freshness: number;
  };
  potentialScore: {
    seo: number;
    readability: number;
    freshness: number;
  };
}

export default function ContentUpdaterPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [content, setContent] = useState<any[]>([]);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<ContentUpdateSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      loadContent(selectedSite.id);
    }
  }, [selectedSite]);

  const loadSites = async () => {
    try {
      const response = await fetch('/api/admin/wordpress-autopilot/sites');
      const data = await response.json();
      if (data.success) {
        setSites(data.sites);
        if (data.sites.length > 0) {
          setSelectedSite(data.sites[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load sites:', error);
    }
  };

  const loadContent = async (siteId: string) => {
    try {
      const response = await fetch(`/api/admin/wordpress-autopilot/content?siteId=${siteId}&status=published`);
      const data = await response.json();
      if (data.success) {
        setContent(data.content);
      }
    } catch (error) {
      console.error('Failed to load content:', error);
    }
  };

  const analyzeContent = async (contentId: string) => {
    setLoading(true);
    setSuggestions(null);
    
    try {
      const response = await fetch('/api/admin/wordpress-autopilot/update-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, action: 'analyze' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Failed to analyze content:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateContent = async (contentId: string) => {
    setUpdating(true);
    
    try {
      const response = await fetch('/api/admin/wordpress-autopilot/update-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, action: 'update' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Content succesvol bijgewerkt!');
        setSuggestions(null);
        setSelectedContent(null);
      }
    } catch (error) {
      console.error('Failed to update content:', error);
      alert('Update mislukt');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-800">
      <div className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold text-white">✨ AI Content Updater</h1>
          <p className="text-gray-600 mt-1">
            Analyseer en verbeter bestaande WordPress content met AI
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sites Sidebar */}
          <div className="col-span-3">
            <div className="bg-slate-900 rounded-lg shadow-sm p-4">
              <h3 className="font-bold text-white mb-4">Selecteer Site</h3>
              <div className="space-y-2">
                {sites.map((site) => (
                  <button
                    key={site.id}
                    onClick={() => setSelectedSite(site)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedSite?.id === site.id
                        ? 'bg-blue-50 border-2 border-blue-600'
                        : 'bg-slate-800 border border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="font-medium text-white">{site.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{site.totalPosts} posts</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content List */}
          <div className="col-span-5">
            <div className="bg-slate-900 rounded-lg shadow-sm p-4">
              <h3 className="font-bold text-white mb-4">Gepubliceerde Content</h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {content.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedContent(item);
                      analyzeContent(item.contentId);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedContent?.id === item.id
                        ? 'bg-blue-50 border-2 border-blue-600'
                        : 'bg-slate-800 border border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="font-medium text-white text-sm">{item.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(item.publishedAt).toLocaleDateString('nl-NL')}
                    </div>
                  </button>
                ))}
                {content.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Geen gepubliceerde content
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Suggestions Panel */}
          <div className="col-span-4">
            <div className="bg-slate-900 rounded-lg shadow-sm p-6">
              {!selectedContent && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">👈</div>
                  <p>Selecteer content om te analyseren</p>
                </div>
              )}

              {selectedContent && loading && (
                <div className="text-center py-12">
                  <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-gray-600">AI analyseert content...</p>
                </div>
              )}

              {selectedContent && !loading && suggestions && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">
                    {selectedContent.title}
                  </h3>

                  {/* Score Cards */}
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {Object.entries(suggestions.currentScore).map(([key, value]) => (
                      <div key={key} className="bg-slate-800 rounded-lg p-3">
                        <div className="text-xs text-gray-600 capitalize">{key}</div>
                        <div className="text-lg font-bold text-white">{value}</div>
                        <div className="text-xs text-green-600">
                          → {suggestions.potentialScore[key as keyof typeof suggestions.potentialScore]}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Suggestions */}
                  <div className="space-y-3 mb-6">
                    <h4 className="font-bold text-white">Verbeter Suggesties</h4>
                    {suggestions.suggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border-l-4 ${
                          suggestion.priority === 'high'
                            ? 'bg-red-50 border-red-500'
                            : suggestion.priority === 'medium'
                            ? 'bg-yellow-50 border-yellow-500'
                            : 'bg-blue-50 border-blue-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium uppercase text-gray-600">
                            {suggestion.type}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              suggestion.priority === 'high'
                                ? 'bg-red-200 text-red-700'
                                : suggestion.priority === 'medium'
                                ? 'bg-yellow-200 text-yellow-700'
                                : 'bg-blue-200 text-blue-700'
                            }`}
                          >
                            {suggestion.priority}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300">{suggestion.description}</p>
                        <p className="text-xs text-gray-500 mt-1">💡 {suggestion.estimatedImpact}</p>
                      </div>
                    ))}
                  </div>

                  {/* Update Button */}
                  <button
                    onClick={() => updateContent(selectedContent.contentId)}
                    disabled={updating}
                    className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {updating ? '⏳ Bezig met updaten...' : '✨ Update Content met AI'}
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Kost 25 credits
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
