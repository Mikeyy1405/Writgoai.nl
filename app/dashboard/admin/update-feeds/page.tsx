'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export const dynamic = 'force-dynamic';

export default function UpdateFeedsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const updateFeeds = async () => {
    if (!confirm('Alle RSS feeds vervangen door premium feeds?')) return;
    
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/writgo/update-feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        alert(`✅ Success! ${data.results.added} premium RSS feeds toegevoegd!`);
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout user={{ email: 'Admin' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Update RSS Feeds</h1>
          <p className="text-gray-300 mt-2">
            Vervang alle RSS feeds door premium feeds (Google, OpenAI, SEO nieuws)
          </p>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Premium RSS Feeds (19 feeds)</h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="font-semibold text-red-400 mb-2">🔥 Breaking News (elk uur)</h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-4">
                <li>• Google Search Central Blog</li>
                <li>• OpenAI News</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-orange-400 mb-2">📰 SEO Nieuws (dagelijks)</h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-4">
                <li>• Search Engine Land, Journal, Roundtable</li>
                <li>• Google AI Blog, Anthropic News</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-blue-400 mb-2">📚 SEO Tutorials</h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-4">
                <li>• Ahrefs, Moz, Backlinko, Semrush</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-green-400 mb-2">🔧 WordPress How-To</h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-4">
                <li>• Yoast, WPBeginner, Kinsta, WP Tavern</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-purple-400 mb-2">💡 Tips & Best Practices</h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-4">
                <li>• Neil Patel, HubSpot, Copyblogger, CMI</li>
              </ul>
            </div>
          </div>

          <button
            onClick={updateFeeds}
            disabled={loading}
            className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? '🔄 Bezig met updaten...' : '🚀 Update RSS Feeds'}
          </button>
        </div>

        {result && (
          <div className={`border rounded-lg p-6 ${result.success ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50'}`}>
            <h3 className="text-lg font-semibold text-white mb-3">
              {result.success ? '✅ Success!' : '❌ Error'}
            </h3>
            
            {result.success && (
              <div className="space-y-3">
                <p className="text-gray-300">{result.message}</p>
                
                <div className="text-sm text-gray-400">
                  <p>Toegevoegd: {result.results.added}</p>
                  <p>Gefaald: {result.results.failed}</p>
                  {result.results.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-red-400">Fouten:</p>
                      <ul className="ml-4">
                        {result.results.errors.map((err: string, i: number) => (
                          <li key={i}>• {err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {result.feeds && (
                  <div className="mt-4">
                    <p className="font-semibold text-white mb-2">Actieve feeds:</p>
                    <div className="space-y-1 text-sm">
                      {result.feeds.map((feed: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-gray-300">
                          <span>{feed.name}</span>
                          <span className="text-xs text-gray-500">
                            {feed.category} | Priority {feed.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {result.error && (
              <p className="text-red-300">{result.error}</p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
