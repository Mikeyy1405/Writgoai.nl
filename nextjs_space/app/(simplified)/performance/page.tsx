'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ProjectSelector from '@/components/project-selector';

interface PerformanceData {
  url: string;
  total_clicks: number;
  total_impressions: number;
  avg_ctr: number;
  avg_position: number;
}

interface PerformanceAlert {
  id: string;
  url: string;
  alertType: string;
  severity: string;
  message: string;
  percentageChange: number;
  isRead: boolean;
  createdAt: string;
}

interface ImprovementTip {
  id: string;
  url: string;
  tipType: string;
  priority: string;
  title: string;
  description: string;
  actionItems: string[];
  isCompleted: boolean;
  createdAt: string;
}

interface GoogleUpdate {
  id: string;
  name: string;
  date: string;
  type: string;
  description: string;
  impactLevel: string;
  impact?: {
    impactScore: number;
    clicksChange: number;
    impressionsChange: number;
    positionChange: number;
    analysis: string;
  };
}

export default function PerformancePage() {
  const router = useRouter();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [tips, setTips] = useState<ImprovementTip[]>([]);
  const [updates, setUpdates] = useState<GoogleUpdate[]>([]);
  const [sortBy, setSortBy] = useState<'clicks' | 'impressions' | 'ctr' | 'position'>('clicks');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<'all' | 'good' | 'warning' | 'critical'>('all');

  useEffect(() => {
    if (selectedProject) {
      loadData();
    }
  }, [selectedProject]);

  const loadData = async () => {
    if (!selectedProject) return;

    setLoading(true);
    try {
      // Load performance data
      const perfRes = await fetch(`/api/client/gsc/performance?projectId=${selectedProject}&days=30&limit=100`);
      const perfData = await perfRes.json();
      if (perfData.success) {
        setPerformanceData(perfData.topUrls || []);
      }

      // Load alerts
      const alertsRes = await fetch(`/api/client/gsc/alerts?projectId=${selectedProject}`);
      const alertsData = await alertsRes.json();
      if (alertsData.success) {
        setAlerts(alertsData.alerts || []);
      }

      // Load tips
      const tipsRes = await fetch(`/api/client/gsc/tips?projectId=${selectedProject}`);
      const tipsData = await tipsRes.json();
      if (tipsData.success) {
        setTips(tipsData.tips || []);
      }

      // Load Google updates with impact
      const updatesRes = await fetch(`/api/client/gsc/updates?projectId=${selectedProject}`);
      const updatesData = await updatesRes.json();
      if (updatesData.success) {
        setUpdates(updatesData.impact || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!selectedProject) return;

    setSyncing(true);
    try {
      const res = await fetch('/api/client/gsc/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProject })
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Sync voltooid! ${data.urlsProcessed} URLs verwerkt.`);
        loadData();
      } else {
        alert(`⚠️ ${data.error}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('❌ Sync mislukt');
    } finally {
      setSyncing(false);
    }
  };

  const handleMarkAlertRead = async (alertId: string) => {
    try {
      const res = await fetch('/api/client/gsc/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId })
      });

      if (res.ok) {
        setAlerts(alerts.map(a => a.id === alertId ? { ...a, isRead: true } : a));
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const handleMarkTipCompleted = async (tipId: string) => {
    try {
      const res = await fetch('/api/client/gsc/tips', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipId })
      });

      if (res.ok) {
        setTips(tips.map(t => t.id === tipId ? { ...t, isCompleted: true } : t));
      }
    } catch (error) {
      console.error('Error marking tip as completed:', error);
    }
  };

  const getStatusIcon = (data: PerformanceData) => {
    const ctr = data.avg_ctr * 100;
    const position = data.avg_position;

    if (ctr >= 3 && position <= 5) return '🟢';
    if (ctr >= 2 && position <= 10) return '🟡';
    return '🔴';
  };

  const getStatusLabel = (data: PerformanceData) => {
    const ctr = data.avg_ctr * 100;
    const position = data.avg_position;

    if (ctr >= 3 && position <= 5) return 'Uitstekend';
    if (ctr >= 2 && position <= 10) return 'Goed';
    return 'Verbetering nodig';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const sortedData = [...performanceData].sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'clicks': return (a.total_clicks - b.total_clicks) * multiplier;
      case 'impressions': return (a.total_impressions - b.total_impressions) * multiplier;
      case 'ctr': return (a.avg_ctr - b.avg_ctr) * multiplier;
      case 'position': return (a.avg_position - b.avg_position) * -multiplier; // Lower is better
      default: return 0;
    }
  });

  const filteredData = sortedData.filter(data => {
    if (filterBy === 'all') return true;
    const status = getStatusLabel(data);
    if (filterBy === 'good' && status === 'Uitstekend') return true;
    if (filterBy === 'warning' && status === 'Goed') return true;
    if (filterBy === 'critical' && status === 'Verbetering nodig') return true;
    return false;
  });

  const unreadAlerts = alerts.filter(a => !a.isRead);
  const incompleteTips = tips.filter(t => !t.isCompleted);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 Performance Dashboard</h1>
            <p className="text-gray-600 mt-2">Monitor je Google Search Console prestaties</p>
          </div>
          <Button onClick={() => router.push('/')} variant="outline">
            ← Terug naar Dashboard
          </Button>
        </div>

        {/* Project Selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <ProjectSelector
                  value={selectedProject}
                  onChange={setSelectedProject}
                  placeholder="Selecteer een website..."
                />
              </div>
              <Button
                onClick={handleSync}
                disabled={!selectedProject || syncing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {syncing ? '🔄 Synchroniseren...' : '🔄 Sync GSC Data'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {!selectedProject ? (
          <Alert>
            <AlertDescription>
              👆 Selecteer een website om performance data te bekijken
            </AlertDescription>
          </Alert>
        ) : loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Data laden...</p>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-gray-600 text-sm">Totaal Artikelen</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{performanceData.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-gray-600 text-sm">Totaal Clicks</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                      {performanceData.reduce((sum, d) => sum + d.total_clicks, 0).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-gray-600 text-sm">Nieuwe Alerts</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">{unreadAlerts.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-gray-600 text-sm">Actieve Tips</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{incompleteTips.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alerts Section */}
            {unreadAlerts.length > 0 && (
              <Card className="border-orange-300 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    ⚠️ Performance Alerts ({unreadAlerts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {unreadAlerts.slice(0, 5).map(alert => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold">{alert.message}</p>
                            <p className="text-sm mt-1 opacity-80">{alert.url}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAlertRead(alert.id)}
                          >
                            ✓ Gelezen
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Improvement Tips */}
            {incompleteTips.length > 0 && (
              <Card className="border-purple-300 bg-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    💡 Verbetering Tips ({incompleteTips.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {incompleteTips.slice(0, 5).map(tip => (
                      <div
                        key={tip.id}
                        className={`p-4 rounded-lg border ${getPriorityColor(tip.priority)}`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <p className="font-semibold">{tip.title}</p>
                            <p className="text-sm mt-1 opacity-90">{tip.description}</p>
                            <p className="text-xs mt-2 opacity-70">{tip.url}</p>
                            {tip.actionItems && tip.actionItems.length > 0 && (
                              <ul className="mt-3 space-y-1 text-sm">
                                {tip.actionItems.map((item, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>✓</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkTipCompleted(tip.id)}
                          >
                            ✓ Voltooid
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Google Updates */}
            {updates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🔍 Google Algorithm Updates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {updates.slice(0, 3).map((update: any) => (
                      <div key={update.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-lg">{update.update.name}</p>
                            <p className="text-sm text-gray-600 mt-1">{update.update.description}</p>
                            {update && (
                              <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                                <p className="font-medium mb-2">Impact op jouw website:</p>
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-xs text-gray-600">Clicks</p>
                                    <p className={`font-bold ${update.clicksChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {update.clicksChange > 0 ? '+' : ''}{update.clicksChange.toFixed(1)}%
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-600">Impressions</p>
                                    <p className={`font-bold ${update.impressionsChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {update.impressionsChange > 0 ? '+' : ''}{update.impressionsChange.toFixed(1)}%
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-600">Impact Score</p>
                                    <p className={`font-bold ${update.impactScore > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {update.impactScore.toFixed(1)}
                                    </p>
                                  </div>
                                </div>
                                {update.analysis && (
                                  <div className="mt-3 pt-3 border-t text-xs whitespace-pre-wrap">
                                    {update.analysis}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Performance Table */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>📈 Content Performance (Laatste 30 dagen)</CardTitle>
                  <div className="flex gap-2">
                    <select
                      value={filterBy}
                      onChange={(e) => setFilterBy(e.target.value as any)}
                      className="border rounded px-3 py-1 text-sm"
                    >
                      <option value="all">Alle Artikelen</option>
                      <option value="good">🟢 Uitstekend</option>
                      <option value="warning">🟡 Goed</option>
                      <option value="critical">🔴 Verbetering Nodig</option>
                    </select>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="border rounded px-3 py-1 text-sm"
                    >
                      <option value="clicks">Sorteer op Clicks</option>
                      <option value="impressions">Sorteer op Impressions</option>
                      <option value="ctr">Sorteer op CTR</option>
                      <option value="position">Sorteer op Positie</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 text-sm font-semibold">Status</th>
                        <th className="text-left p-3 text-sm font-semibold">URL</th>
                        <th className="text-right p-3 text-sm font-semibold">Clicks</th>
                        <th className="text-right p-3 text-sm font-semibold">Impressions</th>
                        <th className="text-right p-3 text-sm font-semibold">CTR</th>
                        <th className="text-right p-3 text-sm font-semibold">Positie</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((data, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{getStatusIcon(data)}</span>
                              <span className="text-xs text-gray-600">{getStatusLabel(data)}</span>
                            </div>
                          </td>
                          <td className="p-3 text-sm">
                            <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {data.url.replace(/^https?:\/\/[^\/]+/, '')}
                            </a>
                          </td>
                          <td className="p-3 text-right font-semibold text-blue-600">
                            {data.total_clicks.toLocaleString()}
                          </td>
                          <td className="p-3 text-right text-gray-600">
                            {data.total_impressions.toLocaleString()}
                          </td>
                          <td className="p-3 text-right text-gray-600">
                            {(data.avg_ctr * 100).toFixed(2)}%
                          </td>
                          <td className="p-3 text-right font-medium">
                            #{data.avg_position.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredData.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    Geen data beschikbaar. Klik op "Sync GSC Data" om te starten.
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
