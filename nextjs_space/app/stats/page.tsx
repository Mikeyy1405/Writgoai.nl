'use client';

import { useEffect, useState } from 'react';
import SimplifiedLayout from '@/components/SimplifiedLayout';
import { TrendingUp, FileText, Eye, Loader2, ExternalLink } from 'lucide-react';

interface RecentContent {
  id: string;
  title: string;
  type: string;
  publishedAt: string | null;
  createdAt: string;
}

interface Stats {
  totalProjects: number;
  contentThisMonth: number;
  publishedArticles: number;
  recentContent: RecentContent[];
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    contentThisMonth: 0,
    publishedArticles: 0,
    recentContent: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/simplified/stats');
      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
        setError(null);
      } else {
        // Handle API errors
        const errorMessage = data.message || data.error || 'Er is een fout opgetreden';
        console.error('Error fetching stats:', {
          status: response.status,
          error: data.error,
          message: data.message,
          details: data.details
        });
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Kan geen verbinding maken met de server. Controleer je internetverbinding.');
    } finally {
      setLoading(false);
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

  return (
    <SimplifiedLayout>
      <div className="space-y-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800">Fout bij ophalen statistieken</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button 
                  onClick={fetchStats}
                  className="mt-3 text-sm font-medium text-red-800 hover:text-red-900 underline"
                >
                  Probeer opnieuw
                </button>
              </div>
            </div>
          </div>
        )}
        <div>
          <h1 className="text-4xl font-bold text-slate-800">📊 Statistieken</h1>
          <p className="text-lg text-slate-600 mt-2">Volg je content performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-8 h-8" />
              <span className="text-4xl font-bold">{stats.totalProjects}</span>
            </div>
            <h3 className="text-lg font-semibold">Actieve Projecten</h3>
            <p className="text-sm opacity-80 mt-1">WordPress websites gekoppeld</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Eye className="w-8 h-8" />
              <span className="text-4xl font-bold">{stats.contentThisMonth}</span>
            </div>
            <h3 className="text-lg font-semibold">Content Deze Maand</h3>
            <p className="text-sm opacity-80 mt-1">Artikelen gegenereerd</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8" />
              <span className="text-4xl font-bold">{stats.publishedArticles}</span>
            </div>
            <h3 className="text-lg font-semibold">Gepubliceerd</h3>
            <p className="text-sm opacity-80 mt-1">Artikelen live</p>
          </div>
        </div>

        {/* Recent Content */}
        {stats.recentContent.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-slate-800 mb-4">📋 Recente Content</h2>
            <div className="space-y-3">
              {stats.recentContent.map((content) => (
                <div
                  key={content.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{content.title}</h3>
                    <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                      <span className="capitalize">{content.type.replace('-', ' ')}</span>
                      <span>•</span>
                      <span>
                        {new Date(content.createdAt).toLocaleDateString('nl-NL', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <div>
                    {content.publishedAt ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        Gepubliceerd
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                        Concept
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Summary */}
        <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-6 border border-orange-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4">📈 Maand Overzicht</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {stats.contentThisMonth}
              </div>
              <div className="text-sm text-slate-600">Artikelen gegenereerd</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {stats.publishedArticles}
              </div>
              <div className="text-sm text-slate-600">Artikelen gepubliceerd</div>
            </div>
          </div>

          {stats.contentThisMonth > 0 && (
            <div className="mt-4 p-3 bg-white rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Publicatie rate</span>
                <span className="font-bold text-slate-800">
                  {Math.round((stats.publishedArticles / stats.contentThisMonth) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                <div
                  className="bg-gradient-to-r from-orange-500 to-pink-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (stats.publishedArticles / stats.contentThisMonth) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        {stats.totalProjects === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-bold text-blue-900 mb-2">💡 Aan de slag!</h3>
            <p className="text-sm text-blue-700 mb-3">
              Je hebt nog geen projecten. Maak je eerste project aan om te beginnen met
              content genereren.
            </p>
            <a
              href="/projects"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
            >
              <span>Maak Project Aan</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </SimplifiedLayout>
  );
}
