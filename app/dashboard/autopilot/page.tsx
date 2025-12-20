'use client';

import { useState, useEffect } from 'react';
import GSCDataCard from '@/components/GSCDataCard';

export default function AutoPilotPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadConfig();
      loadLogs();
      loadInsights();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects/list');
      const data = await response.json();
      if (response.ok) {
        setProjects(data.projects || []);
        if (data.projects?.length > 0) {
          setSelectedProject(data.projects[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/autopilot/config?project_id=${selectedProject}`);
      const data = await response.json();
      if (response.ok) {
        setConfig(data.config || {
          enabled: false,
          frequency: 'weekly',
          target_keywords: [],
          content_strategy: 'balanced',
        });
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await fetch(`/api/autopilot/logs?project_id=${selectedProject}&limit=20`);
      const data = await response.json();
      if (response.ok) {
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const loadInsights = async () => {
    try {
      const response = await fetch(`/api/autopilot/insights?project_id=${selectedProject}`);
      const data = await response.json();
      if (response.ok) {
        setInsights(data.insights || []);
      }
    } catch (error) {
      console.error('Failed to load insights:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/autopilot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject,
          ...config,
        }),
      });

      if (response.ok) {
        alert('✅ AutoPilot configuratie opgeslagen!');
        loadConfig();
      } else {
        throw new Error('Failed to save config');
      }
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRunNow = async () => {
    if (!confirm('AutoPilot nu uitvoeren?')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/autopilot/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: selectedProject }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('✅ AutoPilot cycle gestart!');
        loadLogs();
        loadInsights();
      } else {
        throw new Error(data.error || 'Failed to run autopilot');
      }
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      scan: '🔍',
      plan: '📋',
      generate: '✨',
      publish: '✅',
      update: '🔄',
      optimize: '⚡',
      error: '❌',
    };
    return icons[action] || '📝';
  };

  const getInsightBadge = (type: string) => {
    const styles: Record<string, string> = {
      link_magnet: 'bg-purple-500/20 text-purple-400 border-purple-500',
      low_ctr: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
      striking_distance: 'bg-blue-500/20 text-blue-400 border-blue-500',
      content_gap: 'bg-red-500/20 text-red-400 border-red-500',
    };
    const labels: Record<string, string> = {
      link_magnet: 'Link Magnet',
      low_ctr: 'Low CTR',
      striking_distance: 'Striking Distance',
      content_gap: 'Content Gap',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${styles[type] || 'bg-gray-500/20 text-gray-400 border-gray-500'}`}>
        {labels[type] || type}
      </span>
    );
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6 lg:p-12">
        <div className="text-center text-gray-400">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="p-6 lg:p-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AutoPilot</h1>
          <p className="text-gray-400 text-lg">
            Automatisch content genereren en optimaliseren op basis van data
          </p>
        </div>

        {/* Project Selector */}
        <div className="mb-6">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Status</h2>
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${config.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {config.enabled ? '✅ Actief' : '⏸️ Gepauzeerd'}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-black/50 border border-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Laatste Run</div>
                  <div className="text-white font-medium">
                    {config.last_run ? new Date(config.last_run).toLocaleDateString('nl-NL') : 'Nog niet uitgevoerd'}
                  </div>
                </div>
                <div className="bg-black/50 border border-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Volgende Run</div>
                  <div className="text-white font-medium">
                    {config.next_run ? new Date(config.next_run).toLocaleDateString('nl-NL') : 'Niet gepland'}
                  </div>
                </div>
                <div className="bg-black/50 border border-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Insights</div>
                  <div className="text-white font-medium">{insights.length} pending</div>
                </div>
              </div>

              <button
                onClick={handleRunNow}
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 disabled:opacity-50"
              >
                {loading ? '⚡ Bezig...' : '⚡ Nu Uitvoeren'}
              </button>
            </div>

            {/* Settings */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Instellingen</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">AutoPilot Inschakelen</div>
                    <div className="text-sm text-gray-400">Automatisch content genereren en optimaliseren</div>
                  </div>
                  <button
                    onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.enabled ? 'bg-orange-500' : 'bg-gray-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 font-medium">Frequentie</label>
                  <select
                    value={config.frequency}
                    onChange={(e) => setConfig({ ...config, frequency: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                  >
                    <option value="daily">Dagelijks</option>
                    <option value="weekly">Wekelijks</option>
                    <option value="biweekly">Tweewekelijks</option>
                    <option value="monthly">Maandelijks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 font-medium">Content Strategie</label>
                  <select
                    value={config.content_strategy}
                    onChange={(e) => setConfig({ ...config, content_strategy: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                  >
                    <option value="aggressive">Agressief (Veel nieuwe content)</option>
                    <option value="balanced">Gebalanceerd (Mix van nieuw en updates)</option>
                    <option value="conservative">Conservatief (Focus op optimalisatie)</option>
                  </select>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Opslaan...' : '💾 Opslaan'}
                </button>
              </div>
            </div>

            {/* Insights */}
            {insights.length > 0 && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Performance Insights</h2>
                <div className="space-y-3">
                  {insights.slice(0, 5).map((insight) => (
                    <div key={insight.id} className="bg-black/50 border border-gray-800 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getInsightBadge(insight.insight_type)}
                          <span className="text-sm text-gray-400">Priority: {insight.priority}</span>
                        </div>
                      </div>
                      <div className="text-white font-medium mb-1">{insight.query}</div>
                      <div className="text-sm text-gray-400">
                        Suggested: {insight.suggested_action?.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* GSC Data */}
          <GSCDataCard projectId={selectedProject} />

          {/* Activity Log */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Activity Log</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  Nog geen activiteit
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="border-l-2 border-gray-700 pl-4 pb-3">
                    <div className="flex items-start space-x-2">
                      <span className="text-lg">{getActionIcon(log.action)}</span>
                      <div className="flex-1">
                        <div className="text-white text-sm">{log.message}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(log.created_at).toLocaleString('nl-NL')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
