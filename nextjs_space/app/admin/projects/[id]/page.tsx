'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Settings, Link as LinkIcon, BookOpen, Plug, 
  Share2, Save, Plus, Trash2, Edit2, X, Check,
  ArrowLeft, AlertCircle
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  description?: string;
}

interface AffiliateLink {
  id: string;
  name: string;
  url: string;
  description?: string;
  category?: string;
  keywords?: string[];
  isActive: boolean;
  clickCount: number;
}

interface KnowledgeBaseItem {
  id: string;
  title: string;
  content: string;
  type: string;
  tags?: string[];
  isActive: boolean;
}

interface ProjectSettings {
  brandVoice?: string;
  targetAudience?: string;
  contentGuidelines?: string;
  defaultSeoTitle?: string;
  defaultSeoDescription?: string;
  defaultKeywords?: string[];
  autoIncludeAffiliateLinks?: boolean;
  useKnowledgeBase?: boolean;
  contentTone?: string;
  autoPublishBlogs?: boolean;
  autoPublishSocial?: boolean;
}

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`);
      if (!res.ok) throw new Error('Failed to load project');
      const data = await res.json();
      setProject(data);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Instellingen', icon: Settings },
    { id: 'affiliate', label: 'Affiliate Links', icon: LinkIcon },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { id: 'integrations', label: 'Integraties', icon: Plug },
    { id: 'social', label: 'Social Media', icon: Share2 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Project laden...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Project niet gevonden</h2>
          <button
            onClick={() => router.push('/admin/clients')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Terug naar klanten
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-800">
      {/* Header */}
      <div className="bg-slate-900 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {project.name}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {project.websiteUrl}
                </p>
              </div>
            </div>
            {saveMessage && (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span>{saveMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-4 border-b-2 transition-colors whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <OverviewTab 
            projectId={projectId} 
            setSaving={setSaving}
            setSaveMessage={setSaveMessage}
          />
        )}
        {activeTab === 'affiliate' && <AffiliateLinksTab projectId={projectId} />}
        {activeTab === 'knowledge' && <KnowledgeBaseTab projectId={projectId} />}
        {activeTab === 'integrations' && <IntegrationsTab projectId={projectId} />}
        {activeTab === 'social' && <SocialMediaTab projectId={projectId} />}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ 
  projectId, 
  setSaving,
  setSaveMessage 
}: { 
  projectId: string;
  setSaving: (val: boolean) => void;
  setSaveMessage: (val: string) => void;
}) {
  const [settings, setSettings] = useState<ProjectSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, [projectId]);

  const loadSettings = async () => {
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/settings`);
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (!res.ok) throw new Error('Failed to save settings');
      
      setSaveMessage('Instellingen opgeslagen! ✓');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('Fout bij opslaan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Brand Settings */}
      <div className="bg-slate-900 rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Merk Instellingen</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Brand Voice
            </label>
            <textarea
              value={settings.brandVoice || ''}
              onChange={(e) => setSettings({ ...settings, brandVoice: e.target.value })}
              placeholder="Beschrijf de tone of voice van het merk..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Doelgroep
            </label>
            <textarea
              value={settings.targetAudience || ''}
              onChange={(e) => setSettings({ ...settings, targetAudience: e.target.value })}
              placeholder="Beschrijf de doelgroep..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Content Richtlijnen
            </label>
            <textarea
              value={settings.contentGuidelines || ''}
              onChange={(e) => setSettings({ ...settings, contentGuidelines: e.target.value })}
              placeholder="Richtlijnen voor content creatie..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Content Tone
            </label>
            <select
              value={settings.contentTone || 'professional'}
              onChange={(e) => setSettings({ ...settings, contentTone: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="professional">Professioneel</option>
              <option value="casual">Casual</option>
              <option value="friendly">Vriendelijk</option>
              <option value="authoritative">Autoritair</option>
            </select>
          </div>
        </div>
      </div>

      {/* SEO Settings */}
      <div className="bg-slate-900 rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">SEO Instellingen</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Default SEO Title
            </label>
            <input
              type="text"
              value={settings.defaultSeoTitle || ''}
              onChange={(e) => setSettings({ ...settings, defaultSeoTitle: e.target.value })}
              placeholder="Standaard SEO titel..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Default SEO Description
            </label>
            <textarea
              value={settings.defaultSeoDescription || ''}
              onChange={(e) => setSettings({ ...settings, defaultSeoDescription: e.target.value })}
              placeholder="Standaard SEO beschrijving..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Content Settings */}
      <div className="bg-slate-900 rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Content Instellingen</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.autoIncludeAffiliateLinks ?? true}
              onChange={(e) => setSettings({ ...settings, autoIncludeAffiliateLinks: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-white">Automatisch Affiliate Links Toevoegen</div>
              <div className="text-sm text-gray-600">Voeg relevante affiliate links automatisch toe aan content</div>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.useKnowledgeBase ?? true}
              onChange={(e) => setSettings({ ...settings, useKnowledgeBase: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-white">Knowledge Base Gebruiken</div>
              <div className="text-sm text-gray-600">Gebruik knowledge base informatie bij content generatie</div>
            </div>
          </label>
        </div>
      </div>

      {/* Publishing Settings */}
      <div className="bg-slate-900 rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Publicatie Instellingen</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.autoPublishBlogs ?? false}
              onChange={(e) => setSettings({ ...settings, autoPublishBlogs: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-white">Automatisch Blogs Publiceren</div>
              <div className="text-sm text-gray-600">Publiceer gegenereerde blogs automatisch</div>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.autoPublishSocial ?? false}
              onChange={(e) => setSettings({ ...settings, autoPublishSocial: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-white">Automatisch Social Media Posten</div>
              <div className="text-sm text-gray-600">Post gegenereerde social media content automatisch</div>
            </div>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
        >
          <Save className="w-5 h-5" />
          Instellingen Opslaan
        </button>
      </div>
    </div>
  );
}

// Affiliate Links Tab Component
function AffiliateLinksTab({ projectId }: { projectId: string }) {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLink, setEditingLink] = useState<AffiliateLink | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    category: '',
    keywords: ''
  });

  useEffect(() => {
    loadLinks();
  }, [projectId]);

  const loadLinks = async () => {
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/affiliate-links`);
      const data = await res.json();
      setLinks(data);
    } catch (error) {
      console.error('Error loading links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const keywordsArray = formData.keywords 
        ? formData.keywords.split(',').map(k => k.trim()).filter(k => k)
        : [];

      const url = editingLink
        ? `/api/admin/projects/${projectId}/affiliate-links/${editingLink.id}`
        : `/api/admin/projects/${projectId}/affiliate-links`;
      
      const method = editingLink ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          keywords: keywordsArray
        })
      });

      if (!res.ok) throw new Error('Failed to save link');

      setFormData({ name: '', url: '', description: '', category: '', keywords: '' });
      setShowAddForm(false);
      setEditingLink(null);
      loadLinks();
    } catch (error) {
      console.error('Error saving link:', error);
    }
  };

  const handleDelete = async (linkId: string) => {
    if (!confirm('Weet je zeker dat je deze affiliate link wilt verwijderen?')) return;

    try {
      const res = await fetch(`/api/admin/projects/${projectId}/affiliate-links/${linkId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete link');
      loadLinks();
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  };

  const handleEdit = (link: AffiliateLink) => {
    setEditingLink(link);
    setFormData({
      name: link.name,
      url: link.url,
      description: link.description || '',
      category: link.category || '',
      keywords: link.keywords?.join(', ') || ''
    });
    setShowAddForm(true);
  };

  if (loading) {
    return <div className="text-center py-8">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Affiliate Links</h2>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingLink(null);
            setFormData({ name: '', url: '', description: '', category: '', keywords: '' });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? 'Annuleren' : 'Nieuwe Link'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-lg border p-6 space-y-4">
          <h3 className="font-semibold text-lg">
            {editingLink ? 'Link Bewerken' : 'Nieuwe Affiliate Link'}
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Naam *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Product/dienst naam"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              URL *
            </label>
            <input
              type="url"
              required
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://affiliate-link.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Beschrijving
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Korte beschrijving van het product/dienst"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Categorie
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="product, service, tool, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Keywords (komma gescheiden)
            </label>
            <input
              type="text"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingLink(null);
                setFormData({ name: '', url: '', description: '', category: '', keywords: '' });
              }}
              className="px-4 py-2 border rounded-lg hover:bg-slate-800"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingLink ? 'Bijwerken' : 'Toevoegen'}
            </button>
          </div>
        </form>
      )}

      {/* Links List */}
      <div className="grid gap-4">
        {links.length === 0 ? (
          <div className="bg-slate-900 rounded-lg border p-8 text-center text-gray-500">
            Nog geen affiliate links toegevoegd
          </div>
        ) : (
          links.map((link) => (
            <div key={link.id} className="bg-slate-900 rounded-lg border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-white">{link.name}</h3>
                    {link.category && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        {link.category}
                      </span>
                    )}
                    {!link.isActive && (
                      <span className="px-2 py-1 bg-slate-800/50 text-slate-300 text-xs rounded">
                        Inactief
                      </span>
                    )}
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline block mb-2"
                  >
                    {link.url}
                  </a>
                  {link.description && (
                    <p className="text-sm text-gray-600 mb-2">{link.description}</p>
                  )}
                  {link.keywords && link.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {link.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-slate-800/50 text-slate-300 text-xs rounded"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    Clicks: {link.clickCount}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(link)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Knowledge Base Tab Component
function KnowledgeBaseTab({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<KnowledgeBaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeBaseItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'document',
    tags: ''
  });

  useEffect(() => {
    loadKnowledge();
  }, [projectId]);

  const loadKnowledge = async () => {
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/knowledge`);
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error('Error loading knowledge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tagsArray = formData.tags 
        ? formData.tags.split(',').map(t => t.trim()).filter(t => t)
        : [];

      const url = editingItem
        ? `/api/admin/projects/${projectId}/knowledge/${editingItem.id}`
        : `/api/admin/projects/${projectId}/knowledge`;
      
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray
        })
      });

      if (!res.ok) throw new Error('Failed to save item');

      setFormData({ title: '', content: '', type: 'document', tags: '' });
      setShowAddForm(false);
      setEditingItem(null);
      loadKnowledge();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Weet je zeker dat je dit knowledge base item wilt verwijderen?')) return;

    try {
      const res = await fetch(`/api/admin/projects/${projectId}/knowledge/${itemId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete item');
      loadKnowledge();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleEdit = (item: KnowledgeBaseItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      content: item.content,
      type: item.type,
      tags: item.tags?.join(', ') || ''
    });
    setShowAddForm(true);
  };

  if (loading) {
    return <div className="text-center py-8">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Knowledge Base</h2>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingItem(null);
            setFormData({ title: '', content: '', type: 'document', tags: '' });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? 'Annuleren' : 'Nieuw Document'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-lg border p-6 space-y-4">
          <h3 className="font-semibold text-lg">
            {editingItem ? 'Document Bewerken' : 'Nieuw Knowledge Base Document'}
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Titel *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Document titel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="document">Document</option>
              <option value="faq">FAQ</option>
              <option value="guideline">Richtlijn</option>
              <option value="brand_voice">Brand Voice</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Content *
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={10}
              placeholder="Document inhoud..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tags (komma gescheiden)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingItem(null);
                setFormData({ title: '', content: '', type: 'document', tags: '' });
              }}
              className="px-4 py-2 border rounded-lg hover:bg-slate-800"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingItem ? 'Bijwerken' : 'Toevoegen'}
            </button>
          </div>
        </form>
      )}

      {/* Items List */}
      <div className="grid gap-4">
        {items.length === 0 ? (
          <div className="bg-slate-900 rounded-lg border p-8 text-center text-gray-500">
            Nog geen knowledge base items toegevoegd
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-slate-900 rounded-lg border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-white">{item.title}</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {item.type}
                    </span>
                    {!item.isActive && (
                      <span className="px-2 py-1 bg-slate-800/50 text-slate-300 text-xs rounded">
                        Inactief
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {item.content}
                  </p>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-slate-800/50 text-slate-300 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Integrations Tab Component
function IntegrationsTab({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Integraties</h2>
      <div className="bg-slate-900 rounded-lg border p-8 text-center text-gray-500">
        <Plug className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium mb-2">Integraties Overzicht</p>
        <p className="text-sm">WordPress, Getlate en andere integraties worden hier getoond</p>
      </div>
    </div>
  );
}

// Social Media Tab Component
function SocialMediaTab({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Social Media Accounts</h2>
      <div className="bg-slate-900 rounded-lg border p-8 text-center text-gray-500">
        <Share2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium mb-2">Social Media Overzicht</p>
        <p className="text-sm">Gekoppelde social media accounts worden hier getoond</p>
      </div>
    </div>
  );
}
