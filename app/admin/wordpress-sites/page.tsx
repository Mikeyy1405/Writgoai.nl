'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Globe,
  Plus,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  TestTube,
  ArrowLeft,
  Link as LinkIcon
} from 'lucide-react';

interface WordPressSite {
  id: string;
  name: string;
  url: string;
  username: string;
  applicationPassword: string;
  apiEndpoint: string;
  isActive: boolean;
  lastTestedAt?: string;
  testStatus?: string;
  testMessage?: string;
  createdAt: string;
  _count?: {
    publishedContent: number;
  };
}

export default function WordPressSitesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sites, setSites] = useState<WordPressSite[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<WordPressSite | null>(null);
  const [deletingSite, setDeletingSite] = useState<WordPressSite | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    username: '',
    applicationPassword: ''
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadSites();
    }
  }, [status, router]);

  async function loadSites() {
    try {
      const response = await fetch('/api/admin/wordpress-sites');
      if (response.ok) {
        const data = await response.json();
        setSites(data.sites || []);
      }
    } catch (error) {
      console.error('Failed to load WordPress sites:', error);
      toast.error('Fout bij laden van WordPress sites');
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setFormData({
      name: '',
      url: '',
      username: '',
      applicationPassword: ''
    });
    setAddModalOpen(true);
  }

  function openEditModal(site: WordPressSite) {
    setEditingSite(site);
    setFormData({
      name: site.name,
      url: site.url,
      username: site.username,
      applicationPassword: site.applicationPassword
    });
    setEditModalOpen(true);
  }

  async function handleAddSubmit() {
    if (!formData.name || !formData.url || !formData.username || !formData.applicationPassword) {
      toast.error('Alle velden zijn verplicht');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/wordpress-sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('WordPress site succesvol toegevoegd');
        setAddModalOpen(false);
        loadSites();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Fout bij toevoegen site');
      }
    } catch (error) {
      console.error('Failed to add site:', error);
      toast.error('Fout bij toevoegen site');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleEditSubmit() {
    if (!editingSite) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/wordpress-sites/${editingSite.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('WordPress site succesvol bijgewerkt');
        setEditModalOpen(false);
        loadSites();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Fout bij bijwerken site');
      }
    } catch (error) {
      console.error('Failed to update site:', error);
      toast.error('Fout bij bijwerken site');
    } finally {
      setActionLoading(false);
    }
  }

  function openDeleteModal(site: WordPressSite) {
    setDeletingSite(site);
    setDeleteModalOpen(true);
  }

  async function handleDelete() {
    if (!deletingSite) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/wordpress-sites/${deletingSite.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('WordPress site succesvol verwijderd');
        setDeleteModalOpen(false);
        loadSites();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Fout bij verwijderen site');
      }
    } catch (error) {
      console.error('Failed to delete site:', error);
      toast.error('Fout bij verwijderen site');
    } finally {
      setActionLoading(false);
    }
  }

  async function testConnection(siteId: string) {
    setTestingId(siteId);
    try {
      const response = await fetch(`/api/admin/wordpress-sites/${siteId}/test`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        loadSites(); // Refresh to show updated test status
      } else {
        toast.error(data.message);
        loadSites();
      }
    } catch (error) {
      console.error('Failed to test connection:', error);
      toast.error('Fout bij testen verbinding');
    } finally {
      setTestingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto bg-zinc-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/dashboard')}
          className="mb-4 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Terug naar Dashboard
        </Button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">WordPress Sites</h1>
              <p className="text-gray-300">Beheer WordPress sites voor content publicatie</p>
            </div>
          </div>
          <Button
            onClick={openAddModal}
            className="bg-[#FF6B35] hover:bg-[#FF6B35]/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe Site
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Totaal Sites</CardTitle>
            <Globe className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{sites.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Actieve Sites</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {sites.filter(s => s.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Totaal Gepubliceerd</CardTitle>
            <LinkIcon className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {sites.reduce((sum, s) => sum + (s._count?.publishedContent || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sites Table */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-900 to-blue-900 text-white">
          <CardTitle className="text-2xl">WordPress Sites</CardTitle>
          <CardDescription className="text-gray-200">
            Configureer en beheer je WordPress sites
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {sites.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Globe className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nog geen WordPress sites</p>
              <p className="text-sm mb-4">Voeg je eerste WordPress site toe om te beginnen</p>
              <Button onClick={openAddModal} className="bg-[#FF6B35] hover:bg-[#FF6B35]/90">
                <Plus className="w-4 h-4 mr-2" />
                Eerste Site Toevoegen
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-800">
                  <TableRow>
                    <TableHead className="font-semibold text-white">Site</TableHead>
                    <TableHead className="font-semibold text-white">URL</TableHead>
                    <TableHead className="font-semibold text-white">Status</TableHead>
                    <TableHead className="font-semibold text-white">Test Status</TableHead>
                    <TableHead className="font-semibold text-white">Gepubliceerd</TableHead>
                    <TableHead className="text-right font-semibold text-white">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sites.map((site) => (
                    <TableRow key={site.id} className="hover:bg-zinc-900">
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{site.name}</p>
                          <p className="text-sm text-gray-500">@{site.username}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={site.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 hover:underline text-sm"
                        >
                          {site.url}
                        </a>
                      </TableCell>
                      <TableCell>
                        {site.isActive ? (
                          <Badge className="bg-green-600">Actief</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-400">Inactief</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {site.testStatus === 'success' ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-gray-300">Verbonden</span>
                          </div>
                        ) : site.testStatus === 'failed' ? (
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-gray-300">Mislukt</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Niet getest</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {site._count?.publishedContent || 0} posts
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testConnection(site.id)}
                            disabled={testingId === site.id}
                            className="hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300"
                          >
                            {testingId === site.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <TestTube className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(site)}
                            className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteModal(site)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nieuwe WordPress Site</DialogTitle>
            <DialogDescription>
              Voeg een WordPress site toe voor content publicatie
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Site Naam</Label>
              <Input
                id="name"
                placeholder="bijv. Hoofdwebsite, Blog Site"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Site URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                De volledige URL van je WordPress site (zonder /wp-admin)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">WordPress Username</Label>
              <Input
                id="username"
                placeholder="admin"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appPassword">Application Password</Label>
              <Input
                id="appPassword"
                type="password"
                placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                value={formData.applicationPassword}
                onChange={(e) => setFormData({ ...formData, applicationPassword: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Genereer een Application Password in WordPress: Users → Profile → Application Passwords
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Annuleren
            </Button>
            <Button
              onClick={handleAddSubmit}
              disabled={actionLoading}
              className="bg-[#FF6B35] hover:bg-[#FF6B35]/90"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>WordPress Site Bewerken</DialogTitle>
            <DialogDescription>
              Wijzig de gegevens van {editingSite?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Site Naam</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-url">Site URL</Label>
              <Input
                id="edit-url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username">WordPress Username</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-appPassword">Application Password</Label>
              <Input
                id="edit-appPassword"
                type="password"
                value={formData.applicationPassword}
                onChange={(e) => setFormData({ ...formData, applicationPassword: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Annuleren
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={actionLoading}
              className="bg-[#FF6B35] hover:bg-[#FF6B35]/90"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>WordPress Site Verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je {deletingSite?.name} wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Annuleren
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
