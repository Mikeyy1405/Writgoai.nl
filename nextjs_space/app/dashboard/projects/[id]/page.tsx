'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  FolderKanban,
  Globe,
  Link as LinkIcon,
  BookOpen,
  Share2,
  Calendar,
  CheckCircle,
  AlertCircle,
  Settings as SettingsIcon
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type TabType = 'general' | 'wordpress' | 'affiliate' | 'knowledge' | 'social' | 'content';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.id as string;
  
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<any>(null);

  // Load project data
  useEffect(() => {
    async function loadProject() {
      try {
        const response = await fetch(`/api/admin/projects/${projectId}`);
        if (!response.ok) throw new Error('Failed to load project');
        
        const data = await response.json();
        setProject(data);
      } catch (error) {
        console.error('Error loading project:', error);
        toast({
          title: 'Fout',
          description: 'Het project kon niet worden geladen.',
          variant: 'destructive',
        });
        router.push('/dashboard/projects');
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      loadProject();
    }
  }, [projectId, router, toast]);

  const handleSave = async (updates: any) => {
    setSaving(true);
    
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update project');
      
      const updatedProject = await response.json();
      setProject(updatedProject);
      
      toast({
        title: 'Opgeslagen',
        description: 'De wijzigingen zijn succesvol opgeslagen.',
      });
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: 'Fout',
        description: 'De wijzigingen konden niet worden opgeslagen.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { 
      id: 'general' as TabType, 
      label: 'Algemeen', 
      icon: SettingsIcon,
      description: 'Basis instellingen'
    },
    { 
      id: 'wordpress' as TabType, 
      label: 'WordPress', 
      icon: Globe,
      description: 'WordPress integratie'
    },
    { 
      id: 'affiliate' as TabType, 
      label: 'Affiliate & Links', 
      icon: LinkIcon,
      description: 'Affiliate links beheren'
    },
    { 
      id: 'knowledge' as TabType, 
      label: 'Knowledge Base', 
      icon: BookOpen,
      description: 'Documentatie & richtlijnen'
    },
    { 
      id: 'social' as TabType, 
      label: 'Social Media', 
      icon: Share2,
      description: 'Social media koppelingen'
    },
    { 
      id: 'content' as TabType, 
      label: 'Content Plan', 
      icon: Calendar,
      description: 'Content strategie'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF9933]" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <h3 className="text-xl font-semibold text-white mb-2">Project niet gevonden</h3>
        <p className="text-gray-400 mb-6">Dit project bestaat niet of is verwijderd.</p>
        <Link href="/dashboard/projects">
          <Button className="bg-[#FF9933] hover:bg-[#FF9933]/90 text-white">
            Terug naar projecten
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link 
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Terug naar projecten
        </Link>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-zinc-800 rounded-lg">
            <FolderKanban className="w-6 h-6 text-[#FF9933]" />
          </div>
          <h1 className="text-3xl font-bold text-white">{project.name}</h1>
        </div>
        {project.websiteUrl && (
          <a
            href={project.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#3B82F6] hover:text-[#3B82F6]/80 flex items-center gap-1"
          >
            <Globe className="w-4 h-4" />
            <span>{project.websiteUrl}</span>
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Tab Headers */}
        <div className="border-b border-zinc-800 overflow-x-auto">
          <div className="flex min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap
                    transition-colors border-b-2
                    ${isActive 
                      ? 'border-[#FF9933] text-[#FF9933] bg-[#FF9933]/5' 
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-zinc-800/50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <div className="text-left">
                    <div>{tab.label}</div>
                    {!isActive && (
                      <div className="text-xs text-gray-500">{tab.description}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'general' && <GeneralTab project={project} onSave={handleSave} saving={saving} />}
          {activeTab === 'wordpress' && <WordPressTab project={project} onSave={handleSave} saving={saving} />}
          {activeTab === 'affiliate' && <AffiliateTab projectId={projectId} />}
          {activeTab === 'knowledge' && <KnowledgeTab projectId={projectId} />}
          {activeTab === 'social' && <SocialTab project={project} />}
          {activeTab === 'content' && <ContentTab project={project} />}
        </div>
      </div>
    </div>
  );
}

// General Tab Component
function GeneralTab({ project, onSave, saving }: { project: any; onSave: (data: any) => void; saving: boolean }) {
  const [formData, setFormData] = useState({
    name: project.name || '',
    websiteUrl: project.websiteUrl || '',
    description: project.description || '',
    niche: project.niche || '',
    targetAudience: project.targetAudience || '',
    brandVoice: project.brandVoice || '',
    writingStyle: project.writingStyle || '',
    customInstructions: project.customInstructions || '',
    status: project.status || 'active',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Project Naam <span className="text-red-400">*</span>
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white"
            required
          />
        </div>

        {/* Website URL */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Website URL
          </label>
          <Input
            type="url"
            value={formData.websiteUrl}
            onChange={(e) => handleChange('websiteUrl', e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white"
            placeholder="https://example.com"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Beschrijving
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF9933] transition-colors resize-none"
          placeholder="Waar gaat je website over?"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Niche */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Niche/Categorie
          </label>
          <Input
            type="text"
            value={formData.niche}
            onChange={(e) => handleChange('niche', e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white"
            placeholder="Bijv. Technologie, Lifestyle"
          />
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Doelgroep
          </label>
          <Input
            type="text"
            value={formData.targetAudience}
            onChange={(e) => handleChange('targetAudience', e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white"
            placeholder="Bijv. Jonge professionals"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Brand Voice */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Brand Voice
          </label>
          <Input
            type="text"
            value={formData.brandVoice}
            onChange={(e) => handleChange('brandVoice', e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white"
            placeholder="Bijv. Professional, Vriendelijk"
          />
        </div>

        {/* Writing Style */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Schrijfstijl
          </label>
          <Input
            type="text"
            value={formData.writingStyle}
            onChange={(e) => handleChange('writingStyle', e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white"
            placeholder="Bijv. Informatief, Conversationeel"
          />
        </div>
      </div>

      {/* Custom Instructions */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Custom Instructies voor AI
        </label>
        <textarea
          value={formData.customInstructions}
          onChange={(e) => handleChange('customInstructions', e.target.value)}
          rows={4}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF9933] transition-colors resize-none"
          placeholder="Specifieke instructies voor de AI bij het genereren van content..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Geef specifieke richtlijnen aan de AI voor het schrijven van content voor dit project
        </p>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Status
        </label>
        <select
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF9933] transition-colors"
        >
          <option value="active">Actief</option>
          <option value="inactive">Inactief</option>
          <option value="archived">Gearchiveerd</option>
        </select>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-zinc-800">
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
            <>
              <Save className="w-4 h-4 mr-2" />
              Wijzigingen Opslaan
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// WordPress Tab Component
function WordPressTab({ project, onSave, saving }: { project: any; onSave: (data: any) => void; saving: boolean }) {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [formData, setFormData] = useState({
    wordpressUrl: project.wordpressUrl || '',
    wordpressUsername: project.wordpressUsername || '',
    wordpressPassword: project.wordpressPassword || '',
    wordpressCategory: project.wordpressCategory || '',
    wordpressAutoPublish: project.wordpressAutoPublish || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTestConnection = async () => {
    if (!formData.wordpressUrl || !formData.wordpressUsername || !formData.wordpressPassword) {
      toast({
        title: 'Fout',
        description: 'Vul alle WordPress gegevens in om de verbinding te testen.',
        variant: 'destructive',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`/api/admin/projects/${project.id}/test-wordpress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordpressUrl: formData.wordpressUrl,
          wordpressUsername: formData.wordpressUsername,
          wordpressPassword: formData.wordpressPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTestResult({ success: true, message: 'Verbinding succesvol!' });
        toast({
          title: 'Verbinding gelukt',
          description: 'De WordPress verbinding is succesvol getest.',
        });
      } else {
        setTestResult({ success: false, message: data.error || 'Verbinding mislukt' });
        toast({
          title: 'Verbinding mislukt',
          description: data.error || 'Kon geen verbinding maken met WordPress.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error testing WordPress connection:', error);
      setTestResult({ success: false, message: 'Er ging iets mis bij het testen' });
      toast({
        title: 'Fout',
        description: 'Er ging iets mis bij het testen van de verbinding.',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-400 mb-2">
          🔐 WordPress Applicatie Wachtwoord
        </h3>
        <p className="text-sm text-gray-300">
          Ga naar je WordPress dashboard → Gebruikers → Profiel → Applicatie Wachtwoorden om een nieuw wachtwoord aan te maken.
          Gebruik dit wachtwoord in plaats van je normale login wachtwoord.
        </p>
      </div>

      {/* WordPress URL */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          WordPress URL
        </label>
        <Input
          type="url"
          value={formData.wordpressUrl}
          onChange={(e) => handleChange('wordpressUrl', e.target.value)}
          className="bg-zinc-800 border-zinc-700 text-white"
          placeholder="https://jouwsite.com"
        />
        <p className="text-xs text-gray-500 mt-1">
          Het hoofdadres van je WordPress website
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WordPress Username */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            WordPress Gebruikersnaam
          </label>
          <Input
            type="text"
            value={formData.wordpressUsername}
            onChange={(e) => handleChange('wordpressUsername', e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white"
            placeholder="admin"
          />
        </div>

        {/* WordPress Password */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            WordPress Applicatie Wachtwoord
          </label>
          <Input
            type="password"
            value={formData.wordpressPassword}
            onChange={(e) => handleChange('wordpressPassword', e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white"
            placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
          />
        </div>
      </div>

      {/* Test Connection Button */}
      <div>
        <Button
          type="button"
          onClick={handleTestConnection}
          disabled={testing}
          variant="outline"
          className="border-zinc-700 text-white hover:bg-zinc-800"
        >
          {testing ? (
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

        {testResult && (
          <div className={`mt-3 p-3 rounded-lg ${
            testResult.success 
              ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm">{testResult.message}</span>
            </div>
          </div>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Standaard Categorie
        </label>
        <Input
          type="text"
          value={formData.wordpressCategory}
          onChange={(e) => handleChange('wordpressCategory', e.target.value)}
          className="bg-zinc-800 border-zinc-700 text-white"
          placeholder="Bijv. Blog, Nieuws"
        />
        <p className="text-xs text-gray-500 mt-1">
          De categorie waarin nieuwe posts automatisch worden geplaatst
        </p>
      </div>

      {/* Auto Publish */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="autoPublish"
          checked={formData.wordpressAutoPublish}
          onChange={(e) => handleChange('wordpressAutoPublish', e.target.checked)}
          className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-[#FF9933] focus:ring-[#FF9933]"
        />
        <label htmlFor="autoPublish" className="text-sm text-gray-300">
          Automatisch publiceren naar WordPress
        </label>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-zinc-800">
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
            <>
              <Save className="w-4 h-4 mr-2" />
              Wijzigingen Opslaan
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// Placeholder components for other tabs (to be implemented)
function AffiliateTab({ projectId }: { projectId: string }) {
  return (
    <div className="text-center py-12">
      <LinkIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
      <h3 className="text-xl font-semibold text-white mb-2">Affiliate & Links</h3>
      <p className="text-gray-400">
        Beheer je affiliate links en preferred products.
      </p>
      <p className="text-sm text-gray-500 mt-4">
        Deze functionaliteit wordt binnenkort toegevoegd.
      </p>
    </div>
  );
}

function KnowledgeTab({ projectId }: { projectId: string }) {
  return (
    <div className="text-center py-12">
      <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-600" />
      <h3 className="text-xl font-semibold text-white mb-2">Knowledge Base</h3>
      <p className="text-gray-400">
        Upload en beheer brand guidelines, FAQ's en andere documenten.
      </p>
      <p className="text-sm text-gray-500 mt-4">
        Deze functionaliteit wordt binnenkort toegevoegd.
      </p>
    </div>
  );
}

function SocialTab({ project }: { project: any }) {
  return (
    <div className="text-center py-12">
      <Share2 className="w-16 h-16 mx-auto mb-4 text-gray-600" />
      <h3 className="text-xl font-semibold text-white mb-2">Social Media</h3>
      <p className="text-gray-400">
        Koppel je social media accounts en beheer posting instellingen.
      </p>
      <p className="text-sm text-gray-500 mt-4">
        Deze functionaliteit wordt binnenkort toegevoegd.
      </p>
    </div>
  );
}

function ContentTab({ project }: { project: any }) {
  return (
    <div className="text-center py-12">
      <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-600" />
      <h3 className="text-xl font-semibold text-white mb-2">Content Plan</h3>
      <p className="text-gray-400">
        Beheer je content pillars, keywords en publicatie frequentie.
      </p>
      <p className="text-sm text-gray-500 mt-4">
        Deze functionaliteit wordt binnenkort toegevoegd.
      </p>
    </div>
  );
}
