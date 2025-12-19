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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Users,
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Key,
  Coins,
  Loader2,
  TrendingUp,
  Activity,
  Mail,
  Globe,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  website?: string;
  subscriptionCredits: number;
  topUpCredits: number;
  isUnlimited: boolean;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  automationActive: boolean;
  createdAt: string;
  _count?: {
    contentPieces: number;
  };
}

export default function UnifiedAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    companyName: '',
    website: '',
    subscriptionCredits: '',
    topUpCredits: '',
    isUnlimited: false,
    subscriptionPlan: '',
    subscriptionStatus: ''
  });

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordClient, setPasswordClient] = useState<Client | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [creditsClient, setCreditsClient] = useState<Client | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState('');
  const [creditType, setCreditType] = useState('top-up');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadClients();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router]);

  async function loadClients() {
    try {
      const response = await fetch('/api/admin/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
      toast.error('Fout bij laden van klanten');
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(client: Client) {
    setEditingClient(client);
    setEditForm({
      name: client.name,
      email: client.email,
      companyName: client.companyName || '',
      website: client.website || '',
      subscriptionCredits: client.subscriptionCredits.toString(),
      topUpCredits: client.topUpCredits.toString(),
      isUnlimited: client.isUnlimited,
      subscriptionPlan: client.subscriptionPlan || '',
      subscriptionStatus: client.subscriptionStatus || ''
    });
    setEditModalOpen(true);
  }

  async function handleEditSubmit() {
    if (!editingClient) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        toast.success('Klant succesvol bijgewerkt');
        setEditModalOpen(false);
        loadClients();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Fout bij bijwerken klant');
      }
    } catch (error) {
      console.error('Failed to update client:', error);
      toast.error('Fout bij bijwerken klant');
    } finally {
      setActionLoading(false);
    }
  }

  function openPasswordModal(client: Client) {
    setPasswordClient(client);
    setNewPassword('');
    setPasswordModalOpen(true);
  }

  async function handlePasswordChange() {
    if (!passwordClient) return;

    if (newPassword.length < 6) {
      toast.error('Wachtwoord moet minimaal 6 tekens zijn');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/clients/${passwordClient.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'changePassword',
          newPassword
        })
      });

      if (response.ok) {
        toast.success('Wachtwoord succesvol gewijzigd');
        setPasswordModalOpen(false);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Fout bij wijzigen wachtwoord');
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error('Fout bij wijzigen wachtwoord');
    } finally {
      setActionLoading(false);
    }
  }

  function openCreditsModal(client: Client) {
    setCreditsClient(client);
    setCreditsToAdd('');
    setCreditType('top-up');
    setCreditsModalOpen(true);
  }

  async function handleAddCredits() {
    if (!creditsClient) return;

    const amount = parseFloat(creditsToAdd);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Ongeldig creditbedrag');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/clients/${creditsClient.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addCredits',
          creditsToAdd: amount,
          creditType: creditType === 'subscription' ? 'subscription' : 'top-up'
        })
      });

      if (response.ok) {
        toast.success('Credits succesvol toegevoegd');
        setCreditsModalOpen(false);
        loadClients();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Fout bij toevoegen credits');
      }
    } catch (error) {
      console.error('Failed to add credits:', error);
      toast.error('Fout bij toevoegen credits');
    } finally {
      setActionLoading(false);
    }
  }

  function openDeleteModal(client: Client) {
    setDeleteClient(client);
    setDeleteModalOpen(true);
  }

  async function handleDelete() {
    if (!deleteClient) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/clients/${deleteClient.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Klant succesvol verwijderd');
        setDeleteModalOpen(false);
        loadClients();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Fout bij verwijderen klant');
      }
    } catch (error) {
      console.error('Failed to delete client:', error);
      toast.error('Fout bij verwijderen klant');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Filter clients
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.companyName && client.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Stats
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.automationActive).length;
  const activeSubscriptions = clients.filter(c => c.subscriptionStatus === 'active').length;
  const totalCredits = clients.reduce((sum, c) => sum + c.subscriptionCredits + c.topUpCredits, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto bg-zinc-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-black to-[#FF6B35] rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">WritgoAI Admin Dashboard</h1>
            <p className="text-gray-300">Volledig beheer over klanten, content & notificaties</p>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-orange-600" />
            <span className="font-semibold text-white">E-mail Notificaties Actief:</span>
            <span className="text-gray-700">
              Je ontvangt automatisch e-mails bij nieuwe klanten, credit wijzigingen en abonnement updates
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Totaal Klanten</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalClients}</div>
            <p className="text-xs text-gray-500 mt-1">{activeClients} met actieve automation</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Actieve Abonnementen</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{activeSubscriptions}</div>
            <p className="text-xs text-gray-500 mt-1">Betalende klanten</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Totale Credits</CardTitle>
            <Coins className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalCredits.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Over alle klanten</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Content Gegenereerd</CardTitle>
            <FileText className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {clients.reduce((sum, c) => sum + (c._count?.contentPieces || 0), 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Totaal deze maand</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Content Automation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card 
          className="shadow-lg cursor-pointer hover:shadow-xl transition-shadow border-l-4 border-l-purple-500"
          onClick={() => router.push('/admin/content-generator')}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Content Generator</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Genereer SEO-geoptimaliseerde content met AI en publiceer direct naar WordPress
                  </p>
                  <div className="flex items-center text-purple-400 text-sm font-medium">
                    Content Genereren
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="shadow-lg cursor-pointer hover:shadow-xl transition-shadow border-l-4 border-l-blue-500"
          onClick={() => router.push('/admin/wordpress-sites')}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">WordPress Sites</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Beheer WordPress sites voor automatische content publicatie en multi-site support
                  </p>
                  <div className="flex items-center text-blue-400 text-sm font-medium">
                    Sites Beheren
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Klantenbeheer */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-900 to-[#FF6B35] text-white">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Klantenbeheer</CardTitle>
              <CardDescription className="text-gray-200">
                Beheer alle klanten, credits en instellingen
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900/10 px-4 py-2 rounded-lg">
              <Users className="w-5 h-5" />
              <span className="font-semibold">{filteredClients.length} klanten</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Zoek op naam, email of bedrijf..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base border-zinc-700"
              />
            </div>
          </div>

          {/* Clients Table */}
          <div className="rounded-lg border border-zinc-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-800">
                <TableRow>
                  <TableHead className="font-semibold text-white">Klant</TableHead>
                  <TableHead className="font-semibold text-white">Email</TableHead>
                  <TableHead className="font-semibold text-white">Credits</TableHead>
                  <TableHead className="font-semibold text-white">Plan</TableHead>
                  <TableHead className="font-semibold text-white">Status</TableHead>
                  <TableHead className="text-right font-semibold text-white">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-zinc-900">
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{client.name}</p>
                        {client.companyName && (
                          <p className="text-sm text-gray-500">{client.companyName}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-700">{client.email}</TableCell>
                    <TableCell>
                      {client.isUnlimited ? (
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                          <Coins className="h-3 w-3 mr-1" />
                          Unlimited
                        </Badge>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Sub: {client.subscriptionCredits}
                          </Badge>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Top-up: {client.topUpCredits}
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.subscriptionPlan ? (
                        <Badge className="bg-[#FF6B35] hover:bg-[#FF6B35]/90">
                          {client.subscriptionPlan}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">Geen</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.automationActive ? (
                        <Badge className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Actief
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-300">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactief
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(client)}
                          className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPasswordModal(client)}
                          className="hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-300"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCreditsModal(client)}
                          className="hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                        >
                          <Coins className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDeleteModal(client)}
                          className="hover:bg-red-700"
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

          {filteredClients.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? 'Geen klanten gevonden met deze zoekopdracht' : 'Nog geen klanten geregistreerd'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Klant Bewerken</DialogTitle>
            <DialogDescription>
              Wijzig de gegevens van {editingClient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Naam</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Bedrijfsnaam</Label>
                <Input
                  id="companyName"
                  value={editForm.companyName}
                  onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subCredits">Subscription Credits</Label>
                <Input
                  id="subCredits"
                  type="number"
                  value={editForm.subscriptionCredits}
                  onChange={(e) => setEditForm({ ...editForm, subscriptionCredits: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topUpCredits">Top-up Credits</Label>
                <Input
                  id="topUpCredits"
                  type="number"
                  value={editForm.topUpCredits}
                  onChange={(e) => setEditForm({ ...editForm, topUpCredits: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan">Abonnement Plan</Label>
                <Select
                  value={editForm.subscriptionPlan}
                  onValueChange={(value) => setEditForm({ ...editForm, subscriptionPlan: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editForm.subscriptionStatus}
                  onValueChange={(value) => setEditForm({ ...editForm, subscriptionStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="past_due">Past Due</SelectItem>
                    <SelectItem value="trialing">Trialing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="unlimited"
                checked={editForm.isUnlimited}
                onChange={(e) => setEditForm({ ...editForm, isUnlimited: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-700"
              />
              <Label htmlFor="unlimited">Unlimited Credits</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleEditSubmit} disabled={actionLoading} className="bg-[#FF6B35] hover:bg-[#FF6B35]/90">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wachtwoord Wijzigen</DialogTitle>
            <DialogDescription>
              Nieuw wachtwoord voor {passwordClient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nieuw Wachtwoord</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimaal 6 tekens"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordModalOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handlePasswordChange} disabled={actionLoading} className="bg-[#FF6B35] hover:bg-[#FF6B35]/90">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Wijzigen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credits Modal */}
      <Dialog open={creditsModalOpen} onOpenChange={setCreditsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credits Toevoegen</DialogTitle>
            <DialogDescription>
              Voeg credits toe aan {creditsClient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="creditAmount">Aantal Credits</Label>
              <Input
                id="creditAmount"
                type="number"
                value={creditsToAdd}
                onChange={(e) => setCreditsToAdd(e.target.value)}
                placeholder="10, 20, 50..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditType">Credit Type</Label>
              <Select value={creditType} onValueChange={setCreditType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top-up">Top-up Credits</SelectItem>
                  <SelectItem value="subscription">Subscription Credits</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditsModalOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleAddCredits} disabled={actionLoading} className="bg-[#FF6B35] hover:bg-[#FF6B35]/90">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Klant Verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je {deleteClient?.name} wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt. Alle content en projecten van deze klant worden ook verwijderd.
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
