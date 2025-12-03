
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Link2, 
  Plus, 
  Trash2, 
  Edit, 
  TrendingUp, 
  ArrowLeft,
  Sparkles,
  Copy,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AffiliateLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: string | null;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

export default function AffiliateLinksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<AffiliateLink | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    category: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    } else if (session?.user?.role !== 'client') {
      router.push('/dashboard');
    } else {
      fetchLinks();
    }
  }, [status, session, router]);

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/client/affiliate-links');
      if (response.ok) {
        const data = await response.json();
        setLinks(data);
      }
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.url) {
      toast.error('Titel en URL zijn verplicht');
      return;
    }

    try {
      const url = editingLink
        ? `/api/client/affiliate-links/${editingLink.id}`
        : '/api/client/affiliate-links';
      
      const method = editingLink ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingLink ? 'Link bijgewerkt!' : 'Link toegevoegd!');
        setIsDialogOpen(false);
        setEditingLink(null);
        setFormData({ title: '', url: '', description: '', category: '' });
        fetchLinks();
      } else {
        throw new Error('Failed to save link');
      }
    } catch (error) {
      toast.error('Er ging iets mis');
    }
  };

  const handleEdit = (link: AffiliateLink) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      description: link.description || '',
      category: link.category || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze link wilt verwijderen?')) return;

    try {
      const response = await fetch(`/api/client/affiliate-links/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Link verwijderd');
        fetchLinks();
      }
    } catch (error) {
      toast.error('Er ging iets mis');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Link gekopieerd!');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <Button
                variant="ghost"
                onClick={() => router.push('/client-portal')}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Terug naar Dashboard
              </Button>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                  <Link2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-purple-700">
                    Affiliate Links
                  </h1>
                  <p className="text-gray-600 mt-1">Beheer je affiliate links voor automatische integratie in content</p>
                </div>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setEditingLink(null);
                    setFormData({ title: '', url: '', description: '', category: '' });
                  }}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:opacity-90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuwe Link
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingLink ? 'Link Bewerken' : 'Nieuwe Link Toevoegen'}</DialogTitle>
                  <DialogDescription>
                    Voeg affiliate links toe die automatisch in je content verwerkt worden
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="title">Titel *</Label>
                    <Input
                      id="title"
                      placeholder="bijv. Amazon Associates, bol.com Partner"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="url">Affiliate URL *</Label>
                    <Input
                      id="url"
                      placeholder="https://..."
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categorie</Label>
                    <Input
                      id="category"
                      placeholder="bijv. Product, Service, Software"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Beschrijving</Label>
                    <Textarea
                      id="description"
                      placeholder="Notities over deze affiliate link..."
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuleren
                  </Button>
                  <Button onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700">
                    {editingLink ? 'Bijwerken' : 'Toevoegen'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <Card className="mb-8 bg-gradient-to-r from-purple-50 to-white border-2 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Sparkles className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-purple-900 mb-2">Automatische Affiliate Link Integratie</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  De AI gebruikt deze affiliate links automatisch in je content waar relevant. Je hoeft ze niet 
                  handmatig toe te voegen - het systeem detecteert contextue le mogelijkheden en plaatst de links 
                  natuurlijk in de tekst. Bekijk het aantal keer dat elke link is gebruikt in je content.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-white/90 text-sm">Totaal Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black">{links.length}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-white/90 text-sm">Actieve Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black">{links.filter(l => l.isActive).length}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-white/90 text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Totaal Gebruik
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black">{links.reduce((sum, l) => sum + l.usageCount, 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Links Grid */}
        {links.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Link2 className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium mb-2">Nog geen affiliate links</p>
              <p className="text-sm text-gray-500 mb-4">Voeg je eerste affiliate link toe om te beginnen</p>
              <Button onClick={() => setIsDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Eerste Link Toevoegen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {links.map((link) => (
              <Card key={link.id} className="hover:shadow-lg transition-all border-2 border-gray-100 hover:border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{link.title}</h3>
                        {link.category && (
                          <Badge variant="outline" className="text-purple-600 border-purple-300">
                            {link.category}
                          </Badge>
                        )}
                        <Badge 
                          className={link.isActive 
                            ? 'bg-green-100 text-green-700 border-green-200' 
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                          }
                          variant="outline"
                        >
                          {link.isActive ? 'Actief' : 'Inactief'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate max-w-md"
                        >
                          {link.url}
                        </a>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(link.url)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      {link.description && (
                        <p className="text-sm text-gray-600 mb-2">{link.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          <span className="font-medium">{link.usageCount}× gebruikt</span>
                        </div>
                        <span>•</span>
                        <span>Toegevoegd op {new Date(link.createdAt).toLocaleDateString('nl-NL')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(link)}
                        className="border-purple-200 hover:bg-purple-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(link.id)}
                        className="border-red-200 hover:bg-red-50 text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
