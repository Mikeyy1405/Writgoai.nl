'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function NewAdminProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    websiteUrl: '',
    description: '',
    wordpressUrl: '',
    wordpressUsername: '',
    wordpressPassword: '',
    wordpressCategory: '',
    language: 'NL',
    niche: '',
    targetAudience: '',
    brandVoice: '',
    keywords: '',
  });

  // Check admin access
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'unauthenticated' || (session?.user as any)?.role !== 'admin') {
    router.push('/inloggen');
    return null;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Project naam is verplicht');
      return;
    }

    try {
      setCreating(true);
      
      const payload = {
        ...formData,
        keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()) : [],
      };

      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create project');
      }

      const data = await res.json();
      toast.success('Project succesvol aangemaakt!');
      router.push(`/admin/projects/${data.project.id}`);
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast.error(error.message || 'Kon project niet aanmaken');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        <Link href="/admin/projects">
          <Button variant="ghost" size="sm" className="mb-4 text-gray-300 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar projecten
          </Button>
        </Link>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Nieuw Admin Project</CardTitle>
            <CardDescription className="text-gray-400">
              Maak een nieuw project aan om content te beheren voor een andere website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Basis Informatie</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">Project Naam *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="bijv. Writgo.nl, KlantSite.nl"
                    required
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="websiteUrl" className="text-gray-300">Website URL</Label>
                  <Input
                    id="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                    placeholder="https://example.com"
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-300">Beschrijving</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Korte beschrijving van het project..."
                    rows={3}
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-gray-300">Taal</Label>
                    <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                      <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="NL">Nederlands</SelectItem>
                        <SelectItem value="EN">English</SelectItem>
                        <SelectItem value="DE">Deutsch</SelectItem>
                        <SelectItem value="FR">Français</SelectItem>
                        <SelectItem value="ES">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="niche" className="text-gray-300">Niche/Categorie</Label>
                    <Input
                      id="niche"
                      value={formData.niche}
                      onChange={(e) => handleInputChange('niche', e.target.value)}
                      placeholder="bijv. Technology, Marketing"
                      className="bg-gray-700/50 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* WordPress Connection */}
              <div className="space-y-4 pt-4 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-white">WordPress Koppeling</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="wordpressUrl" className="text-gray-300">WordPress URL</Label>
                  <Input
                    id="wordpressUrl"
                    value={formData.wordpressUrl}
                    onChange={(e) => handleInputChange('wordpressUrl', e.target.value)}
                    placeholder="https://example.com"
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wordpressUsername" className="text-gray-300">WordPress Username</Label>
                    <Input
                      id="wordpressUsername"
                      value={formData.wordpressUsername}
                      onChange={(e) => handleInputChange('wordpressUsername', e.target.value)}
                      placeholder="admin"
                      className="bg-gray-700/50 border-gray-600 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wordpressPassword" className="text-gray-300">
                      WordPress Application Password
                    </Label>
                    <Input
                      id="wordpressPassword"
                      type="password"
                      value={formData.wordpressPassword}
                      onChange={(e) => handleInputChange('wordpressPassword', e.target.value)}
                      placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                      className="bg-gray-700/50 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wordpressCategory" className="text-gray-300">Standaard Categorie</Label>
                  <Input
                    id="wordpressCategory"
                    value={formData.wordpressCategory}
                    onChange={(e) => handleInputChange('wordpressCategory', e.target.value)}
                    placeholder="Uncategorized"
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>
              </div>

              {/* Content Settings */}
              <div className="space-y-4 pt-4 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-white">Content Instellingen</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="targetAudience" className="text-gray-300">Doelgroep</Label>
                  <Input
                    id="targetAudience"
                    value={formData.targetAudience}
                    onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                    placeholder="bijv. Ondernemers, Marketing professionals"
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brandVoice" className="text-gray-300">Brand Voice/Tone</Label>
                  <Input
                    id="brandVoice"
                    value={formData.brandVoice}
                    onChange={(e) => handleInputChange('brandVoice', e.target.value)}
                    placeholder="bijv. Professional, Vriendelijk, Informeel"
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords" className="text-gray-300">Keywords (komma gescheiden)</Label>
                  <Textarea
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => handleInputChange('keywords', e.target.value)}
                    placeholder="keyword1, keyword2, keyword3"
                    rows={2}
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Project aanmaken...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Project aanmaken
                    </>
                  )}
                </Button>
                <Link href="/admin/projects">
                  <Button type="button" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                    Annuleren
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
