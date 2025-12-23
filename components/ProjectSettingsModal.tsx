'use client';

import { useState, useEffect } from 'react';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

interface Affiliate {
  id: string;
  platform: string;
  affiliate_id: string | null;
  site_code: string | null;
  client_id: string | null;
  client_secret: string | null;
  custom_links: any[];
  is_active: boolean;
}

interface KnowledgeBaseEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  source_url: string | null;
  tags: string[];
  is_active: boolean;
}

export default function ProjectSettingsModal({ 
  isOpen, 
  onClose, 
  projectId, 
  projectName 
}: ProjectSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'affiliates' | 'knowledge'>('affiliates');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Affiliates state
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [bolConfig, setBolConfig] = useState({
    site_code: '',
    client_id: '',
    client_secret: '',
    is_active: true,
  });

  // Knowledge base state
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeBaseEntry[]>([]);
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    category: 'general',
    source_url: '',
    tags: '',
  });
  const [editingEntry, setEditingEntry] = useState<KnowledgeBaseEntry | null>(null);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && projectId) {
      loadAffiliates();
      loadKnowledgeBase();
    }
  }, [isOpen, projectId]);

  const loadAffiliates = async () => {
    try {
      const response = await fetch(`/api/project/affiliates?project_id=${projectId}`);
      const data = await response.json();
      if (data.success) {
        setAffiliates(data.affiliates);
        // Find Bol.com config
        const bol = data.affiliates.find((a: Affiliate) => a.platform === 'bol.com');
        if (bol) {
          setBolConfig({
            site_code: bol.site_code || '',
            client_id: bol.client_id || '',
            client_secret: bol.client_secret || '',
            is_active: bol.is_active,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load affiliates:', err);
    }
  };

  const loadKnowledgeBase = async () => {
    try {
      const response = await fetch(`/api/project/knowledge-base?project_id=${projectId}`);
      const data = await response.json();
      if (data.success) {
        setKnowledgeEntries(data.entries);
      }
    } catch (err) {
      console.error('Failed to load knowledge base:', err);
    }
  };

  const saveBolConfig = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/project/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          platform: 'bol.com',
          site_code: bolConfig.site_code,
          client_id: bolConfig.client_id,
          client_secret: bolConfig.client_secret,
          is_active: bolConfig.is_active,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Bol.com instellingen opgeslagen!');
        loadAffiliates();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveKnowledgeEntry = async () => {
    if (!newEntry.title || !newEntry.content) {
      setError('Titel en inhoud zijn verplicht');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/project/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingEntry?.id,
          project_id: projectId,
          title: newEntry.title,
          content: newEntry.content,
          category: newEntry.category,
          source_url: newEntry.source_url || null,
          tags: newEntry.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(editingEntry ? 'Item bijgewerkt!' : 'Item toegevoegd!');
        setNewEntry({ title: '', content: '', category: 'general', source_url: '', tags: '' });
        setEditingEntry(null);
        loadKnowledgeBase();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteKnowledgeEntry = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit item wilt verwijderen?')) return;

    try {
      const response = await fetch(`/api/project/knowledge-base?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        loadKnowledgeBase();
      }
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  const editEntry = (entry: KnowledgeBaseEntry) => {
    setEditingEntry(entry);
    setNewEntry({
      title: entry.title,
      content: entry.content,
      category: entry.category,
      source_url: entry.source_url || '',
      tags: entry.tags.join(', '),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Project Instellingen</h2>
            <p className="text-gray-400 text-sm mt-1">{projectName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('affiliates')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'affiliates'
                ? 'text-orange-400 border-b-2 border-orange-400 bg-orange-500/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🔗 Affiliate Links
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'knowledge'
                ? 'text-orange-400 border-b-2 border-orange-400 bg-orange-500/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📚 Kennisbank
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mx-6 mt-4 p-3 bg-green-500/20 border border-green-500 rounded text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'affiliates' && (
            <div className="space-y-6">
              {/* Bol.com Section */}
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <img 
                    src="https://www.bol.com/nl/etc/designs/bol/img/favicon.ico" 
                    alt="Bol.com" 
                    className="w-8 h-8"
                  />
                  <h3 className="text-lg font-semibold text-white">Bol.com Affiliate</h3>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded text-blue-300 text-sm">
                    <strong>💡 Hoe krijg je Bol.com API credentials?</strong>
                    <ol className="mt-2 ml-4 list-decimal space-y-1 text-blue-200">
                      <li>Meld je aan bij het <a href="https://partner.bol.com" target="_blank" rel="noopener" className="underline">Bol.com Partner Programma</a></li>
                      <li>Ga naar Account → API Credentials</li>
                      <li>Maak een nieuwe API key aan</li>
                      <li>Kopieer de Client ID en Client Secret</li>
                    </ol>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">
                      Site Code (Partner ID)
                    </label>
                    <input
                      type="text"
                      value={bolConfig.site_code}
                      onChange={(e) => setBolConfig({ ...bolConfig, site_code: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="1296565"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Je Bol.com partner site code voor affiliate links
                    </p>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={bolConfig.client_id}
                      onChange={(e) => setBolConfig({ ...bolConfig, client_id: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                      placeholder="34713130-133d-4aa0-bee4-0926dc30913f"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">
                      Client Secret
                    </label>
                    <input
                      type="password"
                      value={bolConfig.client_secret}
                      onChange={(e) => setBolConfig({ ...bolConfig, client_secret: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                      placeholder="••••••••••••••••"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="bolActive"
                      checked={bolConfig.is_active}
                      onChange={(e) => setBolConfig({ ...bolConfig, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-orange-500 focus:ring-orange-500"
                    />
                    <label htmlFor="bolActive" className="text-gray-300">
                      Bol.com integratie actief
                    </label>
                  </div>

                  <button
                    onClick={saveBolConfig}
                    disabled={saving}
                    className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/50 disabled:opacity-50 transition-all"
                  >
                    {saving ? 'Opslaan...' : 'Bol.com Instellingen Opslaan'}
                  </button>
                </div>
              </div>

              {/* Other affiliate platforms can be added here */}
              <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50 border-dashed">
                <p className="text-gray-500 text-center">
                  Meer affiliate platforms komen binnenkort (Amazon, Coolblue, etc.)
                </p>
              </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="space-y-6">
              {/* Add/Edit Entry Form */}
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {editingEntry ? '✏️ Item Bewerken' : '➕ Nieuw Item Toevoegen'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">Titel *</label>
                    <input
                      type="text"
                      value={newEntry.title}
                      onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Bijv: Over ons bedrijf"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">Categorie</label>
                    <select
                      value={newEntry.category}
                      onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="general">Algemeen</option>
                      <option value="company">Bedrijfsinformatie</option>
                      <option value="products">Producten/Diensten</option>
                      <option value="faq">FAQ</option>
                      <option value="guidelines">Richtlijnen</option>
                      <option value="links">Belangrijke Links</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">Inhoud *</label>
                    <textarea
                      value={newEntry.content}
                      onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                      rows={5}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Voeg hier informatie toe die de AI moet gebruiken bij het genereren van content..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Deze informatie wordt automatisch meegenomen bij het genereren van artikelen
                    </p>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">Bron URL (optioneel)</label>
                    <input
                      type="url"
                      value={newEntry.source_url}
                      onChange={(e) => setNewEntry({ ...newEntry, source_url: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">Tags (komma gescheiden)</label>
                    <input
                      type="text"
                      value={newEntry.tags}
                      onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="bedrijf, over ons, contact"
                    />
                  </div>

                  <div className="flex gap-3">
                    {editingEntry && (
                      <button
                        onClick={() => {
                          setEditingEntry(null);
                          setNewEntry({ title: '', content: '', category: 'general', source_url: '', tags: '' });
                        }}
                        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
                      >
                        Annuleren
                      </button>
                    )}
                    <button
                      onClick={saveKnowledgeEntry}
                      disabled={saving}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/50 disabled:opacity-50 transition-all"
                    >
                      {saving ? 'Opslaan...' : editingEntry ? 'Bijwerken' : 'Toevoegen'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Existing Entries */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  📋 Bestaande Items ({knowledgeEntries.length})
                </h3>

                {knowledgeEntries.length === 0 ? (
                  <div className="bg-gray-800/30 rounded-lg p-8 border border-gray-700/50 border-dashed text-center">
                    <p className="text-gray-500">
                      Nog geen kennisbank items. Voeg informatie toe die de AI moet gebruiken.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {knowledgeEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-white">{entry.title}</h4>
                              <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300">
                                {entry.category}
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm line-clamp-2">
                              {entry.content}
                            </p>
                            {entry.tags.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {entry.tags.map((tag, i) => (
                                  <span key={i} className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => editEntry(entry)}
                              className="text-gray-400 hover:text-white"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => deleteKnowledgeEntry(entry.id)}
                              className="text-gray-400 hover:text-red-400"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
}
