'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Globe, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    websiteUrl: '',
    description: '',
    targetAudience: '',
    brandVoice: '',
    niche: '',
    keywords: '',
    writingStyle: '',
    customInstructions: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.websiteUrl) {
      toast.error('Naam en website URL zijn verplicht');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/client/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean)
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Project aangemaakt!');
        router.push(`/client-portal/projects/${data.project.id}`);
      } else {
        toast.error(data.error || 'Fout bij aanmaken project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Fout bij aanmaken project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Terug
        </Button>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Globe className="w-8 h-8 text-orange-600" />
          Nieuw Project
        </h1>
        <p className="text-gray-400 mt-2">
          Voeg een nieuw website project toe
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card className="p-6 bg-gray-900 border-gray-800 space-y-6">
          {/* Basis Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Basis Informatie
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-white">Project Naam *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Bijv. Writgo.nl, YogaStartGids"
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="websiteUrl" className="text-white">Website URL *</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({...formData, websiteUrl: e.target.value})}
                  placeholder="https://website.nl"
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-white">Beschrijving</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Korte omschrijving van het project..."
                  className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="niche" className="text-white">Niche/Sector</Label>
                <Input
                  id="niche"
                  value={formData.niche}
                  onChange={(e) => setFormData({...formData, niche: e.target.value})}
                  placeholder="Bijv. Yoga, Tech, Marketing"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>

          {/* Content Strategie */}
          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Content Strategie
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="targetAudience" className="text-white">Doelgroep</Label>
                <Textarea
                  id="targetAudience"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                  placeholder="Beschrijf je doelgroep..."
                  className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="brandVoice" className="text-white">Brand Voice / Tone of Voice</Label>
                <Textarea
                  id="brandVoice"
                  value={formData.brandVoice}
                  onChange={(e) => setFormData({...formData, brandVoice: e.target.value})}
                  placeholder="Beschrijf de gewenste tone of voice..."
                  className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="keywords" className="text-white">Keywords (komma gescheiden)</Label>
                <Input
                  id="keywords"
                  value={formData.keywords}
                  onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                  placeholder="keyword1, keyword2, keyword3"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="writingStyle" className="text-white">Schrijfstijl</Label>
                <Textarea
                  id="writingStyle"
                  value={formData.writingStyle}
                  onChange={(e) => setFormData({...formData, writingStyle: e.target.value})}
                  placeholder="Beschrijf de gewenste schrijfstijl..."
                  className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="customInstructions" className="text-white">Custom Instructies voor AI</Label>
                <Textarea
                  id="customInstructions"
                  value={formData.customInstructions}
                  onChange={(e) => setFormData({...formData, customInstructions: e.target.value})}
                  placeholder="Extra instructies waar de AI rekening mee moet houden..."
                  className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 bg-transparent border-gray-700"
              disabled={loading}
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Aanmaken...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Project Aanmaken
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
