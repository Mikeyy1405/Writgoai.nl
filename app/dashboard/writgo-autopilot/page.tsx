'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import DashboardLayout from '@/components/DashboardLayout';

interface AutoPilotConfig {
  id: string;
  enabled: boolean;
  strategies: {
    link_magnet: boolean;
    low_ctr: boolean;
    striking_distance: boolean;
    content_gap: boolean;
  };
  content_frequency: string;
  target_keywords: string[];
  language: string;
  tone: string;
}

interface Article {
  id: string;
  title: string;
  status: string;
  published_at: string | null;
  views: number;
  clicks: number;
  impressions: number;
  ctr: number | null;
  avg_position: number | null;
}

interface ActivityLog {
  id: string;
  action_type: string;
  description: string;
  status: string;
  created_at: string;
}

export default function WritGoAutoPilotPage() {
  const [config, setConfig] = useState<AutoPilotConfig | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load AutoPilot config
      const { data: configData } = await supabase
        .from('writgo_autopilot_config')
        .select('*')
        .single();

      if (configData) {
        setConfig(configData);
      }

      // Load articles
      const { data: articlesData } = await supabase
        .from('articles')
        .select('id, title, status, published_at, views, clicks, impressions, ctr, avg_position')
        .order('published_at', { ascending: false })
        .limit(10);

      if (articlesData) {
        setArticles(articlesData);
      }

      // Load activity logs
      const { data: logsData } = await supabase
        .from('writgo_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (logsData) {
        setActivityLogs(logsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoPilot = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('writgo_autopilot_config')
        .update({ enabled: !config.enabled })
        .eq('id', config.id);

      if (error) throw error;

      setConfig({ ...config, enabled: !config.enabled });

      // Log activity
      await supabase.from('writgo_activity_logs').insert({
        action_type: config.enabled ? 'autopilot_disabled' : 'autopilot_enabled',
        description: config.enabled ? 'AutoPilot uitgeschakeld' : 'AutoPilot ingeschakeld',
        status: 'success',
      });

      await loadData();
    } catch (error) {
      console.error('Error toggling AutoPilot:', error);
      alert('Fout bij het wijzigen van AutoPilot status');
    } finally {
      setSaving(false);
    }
  };

  const updateStrategy = async (strategy: keyof AutoPilotConfig['strategies']) => {
    if (!config) return;

    const newStrategies = {
      ...config.strategies,
      [strategy]: !config.strategies[strategy],
    };

    try {
      const { error } = await supabase
        .from('writgo_autopilot_config')
        .update({ strategies: newStrategies })
        .eq('id', config.id);

      if (error) throw error;

      setConfig({ ...config, strategies: newStrategies });
    } catch (error) {
      console.error('Error updating strategy:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">WritGo AutoPilot</h1>
            <p className="text-gray-600 mt-1">
              Automatische SEO content generatie voor WritGo.nl
            </p>
          </div>
          <button
            onClick={toggleAutoPilot}
            disabled={saving}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              config?.enabled
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {saving ? 'Bezig...' : config?.enabled ? '⏸️ Pauzeer AutoPilot' : '▶️ Start AutoPilot'}
          </button>
        </div>

        {/* Status Card */}
        <div className={`rounded-lg p-6 ${config?.enabled ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 border-2 border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                AutoPilot Status: {config?.enabled ? '🟢 Actief' : '⚪ Inactief'}
              </h3>
              <p className="text-gray-600 mt-1">
                {config?.enabled
                  ? 'AutoPilot is actief en genereert automatisch content'
                  : 'AutoPilot is gepauzeerd'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Content frequentie</div>
              <div className="text-lg font-semibold text-gray-900">
                {config?.content_frequency === 'daily' && 'Dagelijks'}
                {config?.content_frequency === 'weekly' && 'Wekelijks'}
                {config?.content_frequency === 'biweekly' && 'Tweewekelijks'}
                {config?.content_frequency === 'monthly' && 'Maandelijks'}
              </div>
            </div>
          </div>
        </div>

        {/* Strategies */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Content Strategieën</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config && Object.entries(config.strategies).map(([key, value]) => (
              <div
                key={key}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
                }`}
                onClick={() => updateStrategy(key as keyof AutoPilotConfig['strategies'])}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {key === 'link_magnet' && '🧲 Link Magnet'}
                      {key === 'low_ctr' && '📊 Low CTR Optimizer'}
                      {key === 'striking_distance' && '🎯 Striking Distance'}
                      {key === 'content_gap' && '🔍 Content Gap Filler'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {key === 'link_magnet' && 'Creëer linkbare content'}
                      {key === 'low_ctr' && 'Optimaliseer lage CTR artikelen'}
                      {key === 'striking_distance' && 'Target keywords op positie 11-20'}
                      {key === 'content_gap' && 'Vul content gaps op'}
                    </p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${value ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    {value && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Articles Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recente Artikelen</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titel</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weergaven</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicks</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CTR</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Positie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {articles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Nog geen artikelen. Start AutoPilot om content te genereren!
                    </td>
                  </tr>
                ) : (
                  articles.map((article) => (
                    <tr key={article.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{article.title}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(article.status)}`}>
                          {article.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{article.views || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{article.clicks || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {article.ctr ? `${(article.ctr * 100).toFixed(2)}%` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {article.avg_position ? article.avg_position.toFixed(1) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Logs */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Activiteit Log</h2>
          <div className="space-y-3">
            {activityLogs.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Nog geen activiteit</p>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className={`mt-1 ${getActivityStatusColor(log.status)}`}>
                    {log.status === 'success' && '✓'}
                    {log.status === 'error' && '✗'}
                    {log.status === 'warning' && '⚠'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{log.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(log.created_at).toLocaleString('nl-NL')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
