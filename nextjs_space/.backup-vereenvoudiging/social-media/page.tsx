'use client';

import { useState, useEffect } from 'react';
import {  Sparkles,  Twitter,  Linkedin,  Facebook,  Instagram,  TrendingUp, Copy, Send, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Settings as SettingsIcon, History } from 'lucide-react';

interface Project { id: string; name: string; getlateApiKey?: string; autopostEnabled?: boolean; connectedPlatforms?: string[]; }
interface SocialPost { id: string; platform: string; content: string; hashtags: string[]; imagePrompt?: string; characterCount: number; status?: string; createdAt?: string; projectName?: string; errorMessage?: string; }

const PLATFORMS = [
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: '#1DA1F2', maxChars: 280 },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0077B5', maxChars: 3000 },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2', maxChars: 2000 },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F', maxChars: 2200 },
];

const TONES = [
  { id: 'professional', label: 'Professioneel' }, { id: 'casual', label: 'Casual' }, { id: 'friendly', label: 'Vriendelijk' }, { id: 'inspiring', label: 'Inspirerend' }, { id: 'humorous', label: 'Humoristisch' },
];

export default function SocialMediaPage() {
  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'settings'>('generate');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [tone, setTone] = useState('professional');
  const [generateImage, setGenerateImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<SocialPost[]>([]);
  const [history, setHistory] = useState<SocialPost[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [getlateApiKey, setGetlateApiKey] = useState('');
  const [autopostEnabled, setAutopostEnabled] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);

  useEffect(() => { fetchProjects(); fetchHistory(); }, []);
  useEffect(() => { if (selectedProject && activeTab === 'settings') fetchSettings(); }, [selectedProject, activeTab]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/simplified/projects');
      if (res.ok) { const data = await res.json(); setProjects(data.projects || []); if (data.projects?.length > 0 && !selectedProject) setSelectedProject(data.projects[0].id); }
    } catch (error) { console.error('Error fetching projects:', error); }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try { const res = await fetch('/api/simplified/social-media/history'); if (res.ok) { const data = await res.json(); setHistory(data.posts || []); } }
    catch (error) { console.error('Error fetching history:', error); }
    finally { setHistoryLoading(false); }
  };

  const fetchSettings = async () => {
    if (!selectedProject) return;
    setSettingsLoading(true);
    try {
      const res = await fetch(`/api/simplified/social-media/settings?projectId=${selectedProject}`);
      if (res.ok) { const data = await res.json(); setGetlateApiKey(data.getlateApiKeyConfigured ? '***configured***' : ''); setAutopostEnabled(data.autopostEnabled || false); setConnectedPlatforms(data.connectedPlatforms || []); }
    } catch (error) { console.error('Error fetching settings:', error); }
    finally { setSettingsLoading(false); }
  };

  const handleGenerate = async () => {
    if (!selectedProject || !topic.trim() || selectedPlatforms.length === 0) { alert('Selecteer een project, voer een topic in en kies minimaal 1 platform'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/simplified/social-media/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: selectedProject, topic: topic.trim(), platforms: selectedPlatforms, tone, generateImage, }), });
      if (!res.ok) { const error = await res.json(); throw new Error(error.error || 'Failed to generate posts'); }
      const data = await res.json(); setGeneratedPosts(data.posts || []); alert(data.message);
    } catch (error: any) { alert('Error: ' + error.message); }
    finally { setLoading(false); }
  };

  const handlePost = async (postId: string, action: 'now' | 'schedule') => {
    const scheduledDate = action === 'schedule' ? prompt('Wanneer wil je dit posten? (yyyy-mm-dd HH:MM)') : null;
    if (action === 'schedule' && !scheduledDate) return;
    setLoading(true);
    try {
      const res = await fetch('/api/simplified/social-media/post', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, action, scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : undefined }), });
      if (!res.ok) { const error = await res.json(); throw new Error(error.error || 'Failed to post'); }
      const data = await res.json(); alert(data.message); fetchHistory(); setGeneratedPosts([]);
    } catch (error: any) { alert('Error: ' + error.message); }
    finally { setLoading(false); }
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); alert('Gekopieerd naar klembord!'); };

  const saveSettings = async () => {
    if (!selectedProject) return;
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/simplified/social-media/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: selectedProject, getlateApiKey: getlateApiKey === '***configured***' ? undefined : getlateApiKey, autopostEnabled, connectedPlatforms, }), });
      if (!res.ok) { const error = await res.json(); throw new Error(error.error || 'Failed to save settings'); }
      const data = await res.json(); alert(data.message); fetchProjects();
    } catch (error: any) { alert('Error: ' + error.message); }
    finally { setSettingsLoading(false); }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { icon: any; color: string; label: string }> = {
      posted: { icon: CheckCircle2, color: 'text-green-500 bg-green-500/20', label: 'Gepost' },
      scheduled: { icon: Clock, color: 'text-blue-500 bg-blue-500/20', label: 'Ingepland' },
      failed: { icon: XCircle, color: 'text-red-500 bg-red-500/20', label: 'Gefaald' },
      pending: { icon: AlertCircle, color: 'text-yellow-500 bg-yellow-500/20', label: 'Pending' },
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${config.color}`}><Icon className="w-3 h-3" />{config.label}</span>;
  };

  const currentProject = projects.find(p => p.id === selectedProject);
  const hasGetlateConfigured = currentProject?.getlateApiKey;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-orange-500" />Social Media Manager</h1>
          <p className="text-gray-400">Genereer unieke social media content en post automatisch via Getlate.Dev</p>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="space-y-4">
            <label className="block text-white font-bold">Project</label>
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none">
              {projects.map(project => (<option key={project.id} value={project.id}>{project.name}</option>))}
            </select>
            {currentProject && (
              <div className="p-4 bg-gray-900 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Getlate.Dev API Key:</span>
                  <span className={hasGetlateConfigured ? 'text-green-500' : 'text-red-500'}>{hasGetlateConfigured ? '✅ Geconfigureerd' : '❌ Niet geconfigureerd'}</span>
                </div>
                {!hasGetlateConfigured && <p className="text-sm text-orange-400">⚠️ Configureer je Getlate.Dev API key in het Settings tabblad</p>}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4 border-b border-gray-800">
          {[
            { id: 'generate', icon: Sparkles, label: 'Genereer Posts' },
            { id: 'history', icon: History, label: 'Post History' },
            { id: 'settings', icon: SettingsIcon, label: 'Instellingen' }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-3 px-4 font-bold flex items-center gap-2 transition-colors ${activeTab === tab.id ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400 hover:text-white'}`}>
                <Icon className="w-4 h-4" />{tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'generate' && (
          <div className="space-y-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <label className="block text-white font-bold mb-2">Topic / Keyword</label>
              <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Bijv: 'Nieuwe muziekles tips'" className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none" />
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <label className="block text-white font-bold mb-4">Platforms</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PLATFORMS.map(platform => {
                  const Icon = platform.icon;
                  const isSelected = selectedPlatforms.includes(platform.id);
                  return (
                    <button key={platform.id} onClick={() => { if (isSelected) setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.id)); else setSelectedPlatforms([...selectedPlatforms, platform.id]); }} className={`p-4 rounded-lg border-2 transition-all ${isSelected ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-gray-900 hover:border-gray-600'}`}>
                      <Icon className="w-8 h-8 mx-auto mb-2" style={{ color: platform.color }} />
                      <div className="text-white font-bold text-sm">{platform.name}</div>
                      <div className="text-gray-400 text-xs mt-1">max {platform.maxChars}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <label className="block text-white font-bold mb-4">Tone of Voice</label>
              <div className="flex flex-wrap gap-3">
                {TONES.map(t => (
                  <button key={t.id} onClick={() => setTone(t.id)} className={`px-4 py-2 rounded-lg border transition-colors ${tone === t.id ? 'border-orange-500 bg-orange-500/20 text-orange-500' : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'}`}>{t.label}</button>
                ))}
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={generateImage} onChange={(e) => setGenerateImage(e.target.checked)} className="w-5 h-5" />
                <span className="text-white">Genereer ook afbeelding prompt (AI)</span>
              </label>
            </div>

            <button onClick={handleGenerate} disabled={loading || !selectedProject || !topic || selectedPlatforms.length === 0} className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? <><div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />Bezig met genereren...</> : <><Sparkles className="w-5 h-5" />Genereer Social Media Posts</>}
            </button>

            {generatedPosts.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Gegenereerde Posts</h2>
                {generatedPosts.map(post => {
                  const platform = PLATFORMS.find(p => p.id === post.platform);
                  const Icon = platform?.icon || Twitter;
                  return (
                    <div key={post.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Icon className="w-6 h-6" style={{ color: platform?.color }} />
                          <span className="text-white font-bold">{platform?.name}</span>
                        </div>
                        <span className="text-gray-400 text-sm">{post.characterCount} / {platform?.maxChars} karakters</span>
                      </div>
                      <div className="bg-gray-900 p-4 rounded-lg mb-4 whitespace-pre-wrap text-gray-300">{post.content}</div>
                      {post.hashtags && post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">{post.hashtags.map((tag, i) => (<span key={i} className="text-orange-500 text-sm">#{tag}</span>))}</div>
                      )}
                      {post.imagePrompt && (
                        <div className="bg-gray-900 p-3 rounded-lg mb-4">
                          <p className="text-gray-400 text-sm mb-1">Image Prompt:</p>
                          <p className="text-gray-300 text-sm">{post.imagePrompt}</p>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <button onClick={() => copyToClipboard(post.content)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"><Copy className="w-4 h-4" />Kopieer</button>
                        {hasGetlateConfigured && (
                          <>
                            <button onClick={() => handlePost(post.id, 'now')} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"><Send className="w-4 h-4" />Post Nu</button>
                            <button onClick={() => handlePost(post.id, 'schedule')} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"><Calendar className="w-4 h-4" />Plan In</button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
            {historyLoading ? (<div className="p-12 text-center text-gray-400">Laden...</div>) : history.length === 0 ? (<div className="p-12 text-center text-gray-400">Nog geen posts gegenereerd.</div>) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900"><tr><th className="px-6 py-3 text-left text-white font-bold">Datum</th><th className="px-6 py-3 text-left text-white font-bold">Project</th><th className="px-6 py-3 text-left text-white font-bold">Platform</th><th className="px-6 py-3 text-left text-white font-bold">Content</th><th className="px-6 py-3 text-left text-white font-bold">Status</th><th className="px-6 py-3 text-left text-white font-bold">Acties</th></tr></thead>
                  <tbody className="divide-y divide-gray-800">
                    {history.map(post => {
                      const platform = PLATFORMS.find(p => p.id === post.platform);
                      const Icon = platform?.icon || Twitter;
                      return (
                        <tr key={post.id} className="hover:bg-gray-900/50">
                          <td className="px-6 py-4 text-gray-400 text-sm">{post.createdAt ? new Date(post.createdAt).toLocaleDateString('nl-NL') : '-'}</td>
                          <td className="px-6 py-4 text-white">{post.projectName || '-'}</td>
                          <td className="px-6 py-4"><div className="flex items-center gap-2"><Icon className="w-5 h-5" style={{ color: platform?.color }} /><span className="text-white text-sm">{platform?.name}</span></div></td>
                          <td className="px-6 py-4 text-gray-400 max-w-md truncate">{post.content}</td>
                          <td className="px-6 py-4">{getStatusBadge(post.status || 'pending')}</td>
                          <td className="px-6 py-4"><button onClick={() => copyToClipboard(post.content)} className="text-orange-500 hover:text-orange-400 text-sm flex items-center gap-1"><Copy className="w-4 h-4" />Kopieer</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Getlate.Dev Configuratie</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-2">API Key</label>
                  <input type="password" value={getlateApiKey} onChange={(e) => setGetlateApiKey(e.target.value)} placeholder="Voer je Getlate.Dev API key in" className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none" />
                  <p className="text-gray-500 text-sm mt-2">Verkrijg je API key op <a href="https://getlate.dev" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">getlate.dev</a></p>
                </div>
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={autopostEnabled} onChange={(e) => setAutopostEnabled(e.target.checked)} className="w-5 h-5" />
                    <span className="text-white">Autopost inschakelen</span>
                  </label>
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Verbonden Platforms</label>
                  <div className="grid grid-cols-2 gap-3">
                    {PLATFORMS.map(platform => {
                      const Icon = platform.icon;
                      const isConnected = connectedPlatforms.includes(platform.id);
                      return (
                        <label key={platform.id} className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-800">
                          <input type="checkbox" checked={isConnected} onChange={(e) => { if (e.target.checked) setConnectedPlatforms([...connectedPlatforms, platform.id]); else setConnectedPlatforms(connectedPlatforms.filter(p => p !== platform.id)); }} className="w-4 h-4" />
                          <Icon className="w-5 h-5" style={{ color: platform.color }} />
                          <span className="text-white">{platform.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <button onClick={saveSettings} disabled={settingsLoading || !selectedProject} className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">{settingsLoading ? 'Opslaan...' : 'Instellingen Opslaan'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
