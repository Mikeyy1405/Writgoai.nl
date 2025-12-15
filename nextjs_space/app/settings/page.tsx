'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import SimplifiedLayout from '@/components/SimplifiedLayout';
import { Settings as SettingsIcon, Link as LinkIcon, Unlink, TrendingUp, Search, ExternalLink, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface GSCStats {
  connected: boolean;
  siteUrl?: string;
  sites?: string[];
  stats?: {
    totalClicks: number;
    totalImpressions: number;
    averageCTR: number;
    averagePosition: number;
  };
  topQueries?: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  topPages?: Array<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  performanceData?: Array<{
    date: string;
    clicks: number;
    impressions: number;
  }>;
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const [gscStats, setGscStats] = useState<GSCStats>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchGSCStatus();

    // Check for OAuth callback messages
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'google_search_console_connected') {
      setMessage({ type: 'success', text: 'Google Search Console succesvol verbonden!' });
      // Refresh stats after connection
      setTimeout(() => fetchGSCStatus(), 1000);
    } else if (error) {
      setMessage({ type: 'error', text: `Er ging iets mis: ${error}` });
    }
  }, [searchParams]);

  const fetchGSCStatus = async () => {
    try {
      const response = await fetch('/api/integrations/google-search-console/stats');
      if (response.ok) {
        const data = await response.json();
        setGscStats(data);
      }
    } catch (error) {
      console.error('Error fetching GSC status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // Redirect to OAuth flow
      window.location.href = '/api/integrations/google-search-console/connect';
    } catch (error) {
      console.error('Error connecting to Google Search Console:', error);
      setMessage({ type: 'error', text: 'Fout bij verbinden met Google Search Console' });
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Weet je zeker dat je de verbinding met Google Search Console wilt verbreken?')) {
      return;
    }

    setDisconnecting(true);
    try {
      const response = await fetch('/api/integrations/google-search-console/disconnect', {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Google Search Console verbinding verbroken' });
        setGscStats({ connected: false });
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      setMessage({ type: 'error', text: 'Fout bij verbreken verbinding' });
    } finally {
      setDisconnecting(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('nl-NL').format(Math.round(num));
  };

  const formatPercentage = (num: number) => {
    return (num * 100).toFixed(2) + '%';
  };

  return (
    <SimplifiedLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-slate-800 flex items-center space-x-3">
            <SettingsIcon className="w-10 h-10" />
            <span>Instellingen & Integraties</span>
          </h1>
          <p className="text-lg text-slate-600 mt-2">Beheer je integraties en instellingen</p>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div
            className={`rounded-lg p-4 flex items-center space-x-3 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
            <span
              className={`font-semibold ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {message.text}
            </span>
          </div>
        )}

        {/* Google Search Console Section */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Google Search Console</h2>
                <p className="text-sm text-slate-600">Track je SEO performance en rankings</p>
              </div>
            </div>
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            ) : gscStats.connected ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Verbonden</span>
              </span>
            ) : (
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-semibold">
                Niet verbonden
              </span>
            )}
          </div>

          {/* Connection Status */}
          {!loading && (
            <>
              {!gscStats.connected ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Waarom Google Search Console?</h3>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>Track je website ranking in Google</li>
                      <li>Zie welke keywords traffic genereren</li>
                      <li>Monitor clicks en impressions</li>
                      <li>Optimaliseer je content strategie</li>
                    </ul>
                  </div>
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:shadow-xl transition-shadow disabled:opacity-50 flex items-center justify-center space-x-2 font-semibold"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Verbinden...</span>
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-5 h-5" />
                        <span>Verbind met Google Search Console</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Connected Site Info */}
                  {gscStats.siteUrl && (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-600 mb-1">Verbonden site:</p>
                      <a
                        href={gscStats.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1"
                      >
                        <span>{gscStats.siteUrl}</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {/* Stats Overview */}
                  {gscStats.stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-600 mb-1">Total Clicks</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {formatNumber(gscStats.stats.totalClicks)}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-600 mb-1">Impressions</p>
                        <p className="text-2xl font-bold text-green-900">
                          {formatNumber(gscStats.stats.totalImpressions)}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-purple-600 mb-1">Average CTR</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {formatPercentage(gscStats.stats.averageCTR)}
                        </p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <p className="text-sm text-orange-600 mb-1">Avg Position</p>
                        <p className="text-2xl font-bold text-orange-900">
                          {gscStats.stats.averagePosition.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Top Queries */}
                  {gscStats.topQueries && gscStats.topQueries.length > 0 && (
                    <div>
                      <h3 className="font-bold text-slate-800 mb-3">🔍 Top Queries (laatste 30 dagen)</h3>
                      <div className="space-y-2">
                        {gscStats.topQueries.slice(0, 5).map((query, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="font-semibold text-slate-800">{query.query}</p>
                              <p className="text-xs text-slate-500">
                                Position: {query.position.toFixed(1)} • CTR: {formatPercentage(query.ctr)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-blue-600">
                                {formatNumber(query.clicks)} clicks
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatNumber(query.impressions)} impressions
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Pages */}
                  {gscStats.topPages && gscStats.topPages.length > 0 && (
                    <div>
                      <h3 className="font-bold text-slate-800 mb-3">📄 Top Pagina's (laatste 30 dagen)</h3>
                      <div className="space-y-2">
                        {gscStats.topPages.slice(0, 5).map((page, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <a
                                href={page.page}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-semibold text-blue-600 hover:text-blue-700 truncate block"
                              >
                                {page.page}
                              </a>
                              <p className="text-xs text-slate-500">
                                Position: {page.position.toFixed(1)} • CTR: {formatPercentage(page.ctr)}
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-sm font-bold text-green-600">
                                {formatNumber(page.clicks)} clicks
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatNumber(page.impressions)} impressions
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Disconnect Button */}
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="w-full px-6 py-3 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 font-semibold"
                  >
                    {disconnecting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Verbreken...</span>
                      </>
                    ) : (
                      <>
                        <Unlink className="w-5 h-5" />
                        <span>Verbinding verbreken</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Future Integrations Placeholder */}
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
          <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Meer integraties binnenkort</h3>
          <p className="text-sm text-slate-500">
            We werken aan meer integraties zoals Google Analytics, Ahrefs, en meer!
          </p>
        </div>
      </div>
    </SimplifiedLayout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}
