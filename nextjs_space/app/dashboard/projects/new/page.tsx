'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { useProject } from '@/lib/contexts/ProjectContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NewProjectPage() {
  const router = useRouter();
  const { addProject } = useProject();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    websiteUrl: '',
    description: '',
    niche: '',
    targetAudience: '',
    brandVoice: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Fout',
        description: 'Project naam is verplicht',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const newProject = await addProject({
        name: formData.name,
        websiteUrl: formData.websiteUrl || null,
        description: formData.description || null,
        status: 'active',
      });

      if (newProject) {
        toast({
          title: 'Project aangemaakt',
          description: `${formData.name} is succesvol aangemaakt.`,
        });
        
        // Redirect to edit page to configure more settings
        router.push(`/dashboard/projects/${newProject.id}`);
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Fout',
        description: 'Het project kon niet worden aangemaakt. Probeer het opnieuw.',
        variant: 'destructive',
      });
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
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
          <h1 className="text-3xl font-bold text-white">Nieuw Project</h1>
        </div>
        <p className="text-gray-400">
          Maak een nieuw project aan om te beginnen met content creatie
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Naam <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Bijv. Mijn Website"
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Een herkenbare naam voor je project
            </p>
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
              placeholder="https://example.com"
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Het adres van je website
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Beschrijving
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Waar gaat je website over?"
              rows={4}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#FF9933] transition-colors resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Een korte beschrijving van je project
            </p>
          </div>

          {/* Niche */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Niche/Categorie
            </label>
            <Input
              type="text"
              value={formData.niche}
              onChange={(e) => handleChange('niche', e.target.value)}
              placeholder="Bijv. Technologie, Lifestyle, Gezondheid"
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              In welke niche opereert je website?
            </p>
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
              placeholder="Bijv. Jonge professionals, Ouders, Studenten"
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Voor wie is je content bedoeld?
            </p>
          </div>

          {/* Brand Voice */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Brand Voice / Schrijfstijl
            </label>
            <Input
              type="text"
              value={formData.brandVoice}
              onChange={(e) => handleChange('brandVoice', e.target.value)}
              placeholder="Bijv. Professional, Vriendelijk, Grappig"
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Welke toon past bij je merk?
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-zinc-800/50 border-t border-zinc-800 flex items-center justify-between">
          <Link href="/dashboard/projects">
            <Button
              type="button"
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-zinc-800"
            >
              Annuleren
            </Button>
          </Link>

          <Button
            type="submit"
            disabled={saving || !formData.name.trim()}
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
                Project Aanmaken
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-400 mb-2">
          💡 Tip
        </h3>
        <p className="text-sm text-gray-300">
          Na het aanmaken van je project kun je meer gedetailleerde instellingen configureren, 
          zoals WordPress integratie, affiliate links, en social media koppelingen.
        </p>
      </div>
    </div>
  );
}
