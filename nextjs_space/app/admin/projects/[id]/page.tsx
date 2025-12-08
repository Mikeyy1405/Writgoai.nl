'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  ArrowLeft,
  Save,
  Globe,
  FileText,
  Plug,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface AdminProject {
  id: string;
  name: string;
  websiteUrl: string | null;
  description: string | null;
  wordpressUrl: string | null;
  wordpressUsername: string | null;
  wordpressPassword: string | null;
  wordpressCategory: string | null;
  wordpressAutoPublish: boolean;
  language: string;
  niche: string | null;
  targetAudience: string | null;
  brandVoice: string | null;
  keywords: string[];
  isActive: boolean;
  blogPostCount: number;
  createdAt: string;
}

export default function AdminProjectDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<AdminProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    websiteUrl: '',
    description: '',
    wordpressUrl: '',
    wordpressUsername: '',
    wordpressPassword: '',
    wordpressCategory: '',
    wordpressAutoPublish: false,
    language: 'NL',
    niche: '',
    targetAudience: '',
    brandVoice: '',
    keywords: '',
    isActive: true,
  });

  useEffect(() => {
    if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'admin') {
        toast.error('Alleen admins hebben toegang tot deze pagina');
        router.push('/client-portal');
        return;
      }
      fetchProject();
    } else if (status === 'unauthenticated') {
      router.push('/inloggen');
    }
  }, [status, session, router, projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/projects/${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch project');
      
      const data = await res.json();
      setProject(data.project);
      
      // Update form data
      setFormData({
        name: data.project.name || '',
        websiteUrl: data.project.websiteUrl || '',
        description: data.project.description || '',
        wordpressUrl: data.project.wordpressUrl || '',
        wordpressUsername: data.project.wordpressUsername || '',
        wordpressPassword: data.project.wordpressPassword || '',
        wordpressCategory: data.project.wordpressCategory || '',
        wordpressAutoPublish: data.project.wordpressAutoPublish || false,
        language: data.project.language || 'NL',
        niche: data.project.niche || '',
        targetAudience: data.project.targetAudience || '',
        brandVoice: data.project.brandVoice || '',
        keywords: data.project.keywords?.join(', ') || '',
        isActive: data.project.isActive !== false,
      });
    } catch (error: any) {
      console.error('Error fetching project:', error);
      toast.error('Kon project niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Project naam is verplicht');
      return;
    }

    try {
      setUpdating(true);
      
      const payload = {
        ...formData,
        keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()) : [],
      };

      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update project');
      }

      toast.success('Project succesvol bijgewerkt!');
      fetchProject(); // Refresh project data
    } catch (error: any) {
      console.error('Error updating project:', error);
      toast.error(error.message || 'Kon project niet bijwerken');
    } finally {
      setUpdating(false);
    }
  };

  const handleTestWordPress = async () => {
    try {
      setTesting(true);
      const res = await fetch(`/api/admin/projects/${projectId}/test-wordpress`, {
        method: 'POST',
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`✅ WordPress connectie succesvol! Ingelogd als: ${data.user?.name || data.user?.username}`);
      } else {
        toast.error(`❌ WordPress connectie mislukt: ${data.error || 'Onbekende fout'}`);
      }
    } catch (error: any) {
      console.error('Error testing WordPress:', error);
      toast.error('Kon WordPress verbinding niet testen');
    } finally {
      setTesting(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="py-8 text-center">
            <p className="text-white mb-4">Project niet gevonden</p>
            <Link href="/admin/projects">
              <Button>Terug naar projecten</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        <Link href="/admin/projects">
          <Button variant="ghost" size="sm" className="mb-4 text-gray-300 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar projecten
          </Button>
        </Link>

        {/* Project Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="h-8 w-8 text-orange-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{project.name}</h1>
          </div>
          {project.websiteUrl && (
            <a
              href={project.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              {project.websiteUrl}
            </a>
          )}
          <div className="flex gap-2 mt-3">
            <Badge variant="outline" className="text-gray-300 border-gray-600">
              {project.blogPostCount} blog posts
            </Badge>
            {project.wordpressUrl && (
              <Badge variant="outline" className="text-green-400 border-green-600">
                <Plug className="h-3 w-3 mr-1" />
                WordPress gekoppeld
              </Badge>
            )}
            {project.isActive ? (
              <Badge variant="outline" className="text-green-400 border-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Actief
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-400 border-red-600">
                <XCircle className="h-3 w-3 mr-1" />
                Inactief
              </Badge>
            )}
          </div>
        </div>

        {/* Edit Form */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl text-white">Project Instellingen</CardTitle>
            <CardDescription className="text-gray-400">
              Beheer de instellingen van dit project
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
                    rows={3}
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <Label htmlFor="niche" className="text-gray-300">Niche</Label>
                    <Input
                      id="niche"
                      value={formData.niche}
                      onChange={(e) => handleInputChange('niche', e.target.value)}
                      className="bg-gray-700/50 border-gray-600 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="isActive" className="text-gray-300">Status</Label>
                    <Select 
                      value={formData.isActive ? "active" : "inactive"} 
                      onValueChange={(value) => handleInputChange('isActive', value === "active")}
                    >
                      <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="active">Actief</SelectItem>
                        <SelectItem value="inactive">Inactief</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* WordPress Connection */}
              <div className="space-y-4 pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">WordPress Koppeling</h3>
                  {formData.wordpressUrl && formData.wordpressUsername && formData.wordpressPassword && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTestWordPress}
                      disabled={testing}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      {testing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Testen...
                        </>
                      ) : (
                        <>
                          <Plug className="h-4 w-4 mr-2" />
                          Test Verbinding
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
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
                    <Label htmlFor="wordpressUsername" className="text-gray-300">Username</Label>
                    <Input
                      id="wordpressUsername"
                      value={formData.wordpressUsername}
                      onChange={(e) => handleInputChange('wordpressUsername', e.target.value)}
                      className="bg-gray-700/50 border-gray-600 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wordpressPassword" className="text-gray-300">Application Password</Label>
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
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brandVoice" className="text-gray-300">Brand Voice</Label>
                  <Input
                    id="brandVoice"
                    value={formData.brandVoice}
                    onChange={(e) => handleInputChange('brandVoice', e.target.value)}
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords" className="text-gray-300">Keywords (komma gescheiden)</Label>
                  <Textarea
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => handleInputChange('keywords', e.target.value)}
                    rows={2}
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={updating}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {updating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Bijwerken...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Wijzigingen opslaan
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
