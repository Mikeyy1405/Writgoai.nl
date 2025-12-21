'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import DashboardLayout from '@/components/DashboardLayout';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface AutoPilotConfig {
  id: string;
  enabled: boolean;
  strategies: Record<string, boolean>;
  content_frequency: string;
  language: string;
  tone: string;
}

interface QueuedArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  focus_keyword: string;
  scheduled_for: string;
  status: 'queued' | 'scheduled' | 'draft';
  created_at: string;
}

interface Article {
  id: string;
  title: string;
  status: string;
  published_at: string;
  views: number | null;
  clicks: number | null;
  impressions: number | null;
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
  const [queuedArticles, setQueuedArticles] = useState<QueuedArticle[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedArticle, setSelectedArticle] = useState<QueuedArticle | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<Partial<QueuedArticle>>({});

  useEffect(() => {
    loadData();
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

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

      // Load queued/scheduled articles
      const { data: queueData } = await supabase
        .from('writgo_content_queue')
        .select('*')
        .in('status', ['queued', 'scheduled'])
        .order('scheduled_for', { ascending: true });

      if (queueData) {
        setQueuedArticles(queueData);
      }

      // Load published articles
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
        .update({ enabled: !config.enabled, updated_at: new Date().toISOString() })
        .eq('id', config.id);

      if (!error) {
        setConfig({ ...config, enabled: !config.enabled });
        
        // Log activity
        await supabase.from('writgo_activity_logs').insert({
          action_type: config.enabled ? 'autopilot_stopped' : 'autopilot_started',
          description: config.enabled ? 'AutoPilot gepauzeerd' : 'AutoPilot gestart',
          status: 'success',
        });
        
        loadData();
      }
    } catch (error) {
      console.error('Error toggling AutoPilot:', error);
    } finally {
      setSaving(false);
    }
  };

  const openPreview = (article: QueuedArticle) => {
    setSelectedArticle(article);
    setShowPreview(true);
  };

  const openEdit = (article: QueuedArticle) => {
    setSelectedArticle(article);
    setEditForm({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      focus_keyword: article.focus_keyword,
      scheduled_for: article.scheduled_for,
    });
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!selectedArticle) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('writgo_content_queue')
        .update(editForm)
        .eq('id', selectedArticle.id);

      if (!error) {
        setShowEdit(false);
        loadData();
      }
    } catch (error) {
      console.error('Error saving edit:', error);
    } finally {
      setSaving(false);
    }
  };

  const publishNow = async (articleId: string) => {
    if (!confirm('Dit artikel direct publiceren?')) return;
    
    setSaving(true);
    try {
      // Move from queue to articles
      const queuedArticle = queuedArticles.find(a => a.id === articleId);
      if (!queuedArticle) return;

      const { error: insertError } = await supabase
        .from('articles')
        .insert({
          title: queuedArticle.title,
          content: queuedArticle.content,
          excerpt: queuedArticle.excerpt,
          focus_keyword: queuedArticle.focus_keyword,
          slug: queuedArticle.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          status: 'published',
          published_at: new Date().toISOString(),
        });

      if (!insertError) {
        // Delete from queue
        await supabase
          .from('writgo_content_queue')
          .delete()
          .eq('id', articleId);

        loadData();
      }
    } catch (error) {
      console.error('Error publishing:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteFromQueue = async (articleId: string) => {
    if (!confirm('Dit artikel verwijderen uit de planning?')) return;
    
    setSaving(true);
    try {
      await supabase
        .from('writgo_content_queue')
        .delete()
        .eq('id', articleId);
      
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setSaving(false);
    }
  };

  const generateContent = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/writgo/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'WordPress SEO automatisering',
          keywords: ['WordPress', 'SEO', 'automatisering'],
        }),
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={user || { email: 'Loading...' }}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user || { email: 'Loading...' }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">WritGo AutoPilot</h1>
            <p className="text-gray-600 mt-1">
              Automatische SEO content generatie voor WritGo.nl
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={generateContent}
              disabled={saving}
              className="px-6 py-3 rounded-lg font-semibold bg-orange-600 hover:bg-orange-700 text-white transition-colors disabled:opacity-50"
            >
              {saving ? 'Bezig...' : '✨ Genereer Content'}
            </button>
            <button
              onClick={toggleAutoPilot}
              disabled={saving}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                config?.enabled
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {config?.enabled ? '⏸️ Pauzeer AutoPilot' : '▶️ Start AutoPilot'}
            </button>
          </div>
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

        {/* Content Planning/Queue */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📅 Content Planning</h2>
          <div className="space-y-4">
            {queuedArticles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Geen geplande artikelen. Klik op "Genereer Content" om te beginnen!</p>
              </div>
            ) : (
              queuedArticles.map((article) => (
                <div key={article.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-500 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{article.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{article.excerpt}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span>📅 {new Date(article.scheduled_for).toLocaleDateString('nl-NL', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                        {article.focus_keyword && (
                          <span className="px-2 py-1 bg-orange-50 text-orange-600 rounded-full text-xs">
                            🏷️ {article.focus_keyword}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => openPreview(article)}
                        className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                      >
                        👁️ Preview
                      </button>
                      <button
                        onClick={() => openEdit(article)}
                        className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => publishNow(article.id)}
                        className="px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                      >
                        🚀 Nu Publiceren
                      </button>
                      <button
                        onClick={() => deleteFromQueue(article.id)}
                        className="px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Published Articles Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Gepubliceerde Artikelen</h2>
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
                      Nog geen gepubliceerde artikelen
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 Activiteit Log</h2>
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

      {/* Preview Modal */}
      {showPreview && selectedArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Preview: {selectedArticle.title}</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && selectedArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Edit Artikel</h2>
                <button
                  onClick={() => setShowEdit(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titel</label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt</label>
                <textarea
                  value={editForm.excerpt || ''}
                  onChange={(e) => setEditForm({ ...editForm, excerpt: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Focus Keyword</label>
                <input
                  type="text"
                  value={editForm.focus_keyword || ''}
                  onChange={(e) => setEditForm({ ...editForm, focus_keyword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Publicatie Datum</label>
                <input
                  type="datetime-local"
                  value={editForm.scheduled_for ? new Date(editForm.scheduled_for).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditForm({ ...editForm, scheduled_for: new Date(e.target.value).toISOString() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  value={editForm.content || ''}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  rows={15}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowEdit(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Bezig...' : 'Opslaan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
