'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
  Tag,
  Package
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AffiliateLink {
  id: string;
  name: string;
  url: string;
  description?: string | null;
  category?: string | null;
  keywords?: string[];
  isActive: boolean;
  clickCount: number;
  createdAt: string;
}

interface BolcomSettings {
  clientId: string;
  clientSecret: string;
  affiliateId: string;
}

export default function AffiliateLinksTab({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLink, setEditingLink] = useState<AffiliateLink | null>(null);
  const [bolcomSettings, setBolcomSettings] = useState<BolcomSettings>({
    clientId: '',
    clientSecret: '',
    affiliateId: '',
  });
  const [testingBolcom, setTestingBolcom] = useState(false);

  useEffect(() => {
    loadLinks();
    loadBolcomSettings();
  }, [projectId]);

  const loadLinks = async () => {
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/affiliate-links`);
      if (response.ok) {
        const data = await response.json();
        setLinks(data);
      }
    } catch (error) {
      console.error('Error loading affiliate links:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBolcomSettings = async () => {
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        const settings = data.settings || {};
        setBolcomSettings({
          clientId: settings.bolcomClientId || '',
          clientSecret: settings.bolcomClientSecret || '',
          affiliateId: settings.bolcomAffiliateId || '',
        });
      }
    } catch (error) {
      console.error('Error loading Bol.com settings:', error);
    }
  };

  const handleSaveBolcomSettings = async () => {
    try {
      // First get current project data
      const getResponse = await fetch(`/api/admin/projects/${projectId}`);
      const projectData = await getResponse.json();
      
      // Merge Bol.com settings into existing settings
      const updatedSettings = {
        ...(projectData.settings || {}),
        bolcomClientId: bolcomSettings.clientId,
        bolcomClientSecret: bolcomSettings.clientSecret,
        bolcomAffiliateId: bolcomSettings.affiliateId,
      };

      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: updatedSettings,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Opgeslagen',
          description: 'Bol.com instellingen zijn opgeslagen.',
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Kon de instellingen niet opslaan.',
        variant: 'destructive',
      });
    }
  };

  const handleTestBolcom = async () => {
    if (!bolcomSettings.clientId || !bolcomSettings.clientSecret) {
      toast({
        title: 'Fout',
        description: 'Vul eerst de Bol.com gegevens in.',
        variant: 'destructive',
      });
      return;
    }

    setTestingBolcom(true);
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/test-bolcom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bolcomSettings),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Verbinding gelukt',
          description: 'De Bol.com verbinding is succesvol getest.',
        });
      } else {
        toast({
          title: 'Verbinding mislukt',
          description: data.error || 'Kon geen verbinding maken met Bol.com.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Er ging iets mis bij het testen van de verbinding.',
        variant: 'destructive',
      });
    } finally {
      setTestingBolcom(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Weet je zeker dat je deze affiliate link wilt verwijderen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/projects/${projectId}/affiliate-links/${linkId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLinks(links.filter(l => l.id !== linkId));
        toast({
          title: 'Verwijderd',
          description: 'De affiliate link is verwijderd.',
        });
      }
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Kon de affiliate link niet verwijderen.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF9933]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Bol.com Settings */}
      <div className="border border-zinc-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-5 h-5 text-[#FF9933]" />
          <h3 className="text-lg font-semibold text-white">Bol.com Integratie</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Client ID
              </label>
              <Input
                type="text"
                value={bolcomSettings.clientId}
                onChange={(e) => setBolcomSettings({ ...bolcomSettings, clientId: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder="Your Bol.com Client ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Client Secret
              </label>
              <Input
                type="password"
                value={bolcomSettings.clientSecret}
                onChange={(e) => setBolcomSettings({ ...bolcomSettings, clientSecret: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder="Your Bol.com Client Secret"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Affiliate ID
            </label>
            <Input
              type="text"
              value={bolcomSettings.affiliateId}
              onChange={(e) => setBolcomSettings({ ...bolcomSettings, affiliateId: e.target.value })}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="Your Bol.com Affiliate ID"
            />
            <p className="text-xs text-gray-500 mt-1">
              Je affiliate ID wordt gebruikt om commissie te verdienen
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSaveBolcomSettings}
              className="bg-[#FF9933] hover:bg-[#FF9933]/90 text-white"
            >
              Opslaan
            </Button>
            <Button
              onClick={handleTestBolcom}
              disabled={testingBolcom}
              variant="outline"
              className="border-zinc-700 text-white hover:bg-zinc-800"
            >
              {testingBolcom ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testen...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Test Verbinding
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Custom Affiliate Links */}
      <div className="border border-zinc-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <LinkIcon className="w-5 h-5 text-[#FF9933]" />
            <h3 className="text-lg font-semibold text-white">Custom Affiliate Links</h3>
          </div>
          <Button
            onClick={() => {
              setShowAddForm(true);
              setEditingLink(null);
            }}
            size="sm"
            className="bg-[#FF9933] hover:bg-[#FF9933]/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe Link
          </Button>
        </div>

        {showAddForm && (
          <AffiliateLinkForm
            projectId={projectId}
            link={editingLink}
            onSave={() => {
              setShowAddForm(false);
              setEditingLink(null);
              loadLinks();
            }}
            onCancel={() => {
              setShowAddForm(false);
              setEditingLink(null);
            }}
          />
        )}

        {links.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <LinkIcon className="w-12 h-12 mx-auto mb-2 text-gray-600" />
            <p>Nog geen affiliate links toegevoegd</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {links.map((link) => (
              <div
                key={link.id}
                className="bg-zinc-800 rounded-lg p-4 flex items-start justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-white">{link.name}</h4>
                    {link.category && (
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded">
                        {link.category}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      link.isActive 
                        ? 'bg-green-500/10 text-green-400' 
                        : 'bg-gray-500/10 text-gray-400'
                    }`}>
                      {link.isActive ? 'Actief' : 'Inactief'}
                    </span>
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#3B82F6] hover:text-[#3B82F6]/80 flex items-center gap-1"
                  >
                    <span className="truncate">{link.url}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                  {link.description && (
                    <p className="text-sm text-gray-400 mt-1">{link.description}</p>
                  )}
                  {link.keywords && link.keywords.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <Tag className="w-3 h-3 text-gray-500" />
                      <div className="flex flex-wrap gap-1">
                        {link.keywords.map((keyword, i) => (
                          <span key={i} className="text-xs text-gray-500">
                            {keyword}{i < link.keywords!.length - 1 ? ',' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingLink(link);
                      setShowAddForm(true);
                    }}
                    className="text-gray-400 hover:text-white hover:bg-zinc-700"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteLink(link.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Form component for adding/editing affiliate links
function AffiliateLinkForm({
  projectId,
  link,
  onSave,
  onCancel,
}: {
  projectId: string;
  link: AffiliateLink | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: link?.name || '',
    url: link?.url || '',
    description: link?.description || '',
    category: link?.category || '',
    keywords: link?.keywords?.join(', ') || '',
    isActive: link?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.url) {
      toast({
        title: 'Fout',
        description: 'Naam en URL zijn verplicht.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const url = link
        ? `/api/admin/projects/${projectId}/affiliate-links/${link.id}`
        : `/api/admin/projects/${projectId}/affiliate-links`;
      
      const method = link ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          url: formData.url,
          description: formData.description || null,
          category: formData.category || null,
          keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()) : [],
          isActive: formData.isActive,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Opgeslagen',
          description: link ? 'Affiliate link bijgewerkt.' : 'Affiliate link toegevoegd.',
        });
        onSave();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Kon de affiliate link niet opslaan.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 mb-4">
      <h4 className="text-sm font-medium text-white mb-4">
        {link ? 'Link Bewerken' : 'Nieuwe Affiliate Link'}
      </h4>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Naam <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="Bijv. Amazon Product"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Categorie
            </label>
            <Input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="Bijv. product, service"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            URL <span className="text-red-400">*</span>
          </label>
          <Input
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className="bg-zinc-800 border-zinc-700 text-white"
            placeholder="https://..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Beschrijving
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF9933] transition-colors resize-none"
            placeholder="Korte beschrijving..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Keywords
          </label>
          <Input
            type="text"
            value={formData.keywords}
            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            className="bg-zinc-800 border-zinc-700 text-white"
            placeholder="keyword1, keyword2, keyword3"
          />
          <p className="text-xs text-gray-500 mt-1">
            Gescheiden door komma's
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-[#FF9933] focus:ring-[#FF9933]"
          />
          <label htmlFor="isActive" className="text-sm text-gray-300">
            Link is actief
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#FF9933] hover:bg-[#FF9933]/90 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Opslaan...
              </>
            ) : (
              'Opslaan'
            )}
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            variant="ghost"
            className="text-gray-400 hover:text-white hover:bg-zinc-800"
          >
            Annuleren
          </Button>
        </div>
      </div>
    </form>
  );
}
