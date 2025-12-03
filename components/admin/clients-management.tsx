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
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Key,
  Coins,
  Loader2,
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

export default function ClientsManagement() {
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
    loadClients();
  }, []);

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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  // Filter clients
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.companyName && client.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-[#FF6B35]" />
            Klantenbeheer
          </CardTitle>
          <CardDescription className="text-gray-400">
            Beheer alle klanten, abonnementen, credits en instellingen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
            <Input
              placeholder="Zoek op naam, email of bedrijf..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Clients Table */}
          <div className="rounded-lg border border-zinc-700 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-800">
                <TableRow className="border-zinc-700">
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
                  <TableRow key={client.id} className="hover:bg-zinc-800/50 border-zinc-700">
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{client.name}</p>
                        {client.companyName && (
                          <p className="text-sm text-gray-500">{client.companyName}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-400">{client.email}</TableCell>
                    <TableCell>
                      {client.isUnlimited ? (
                        <Badge variant="outline" className="bg-purple-900/30 text-purple-300 border-purple-700">
                          <Coins className="h-3 w-3 mr-1" />
                          Unlimited
                        </Badge>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="bg-blue-900/30 text-blue-300 border-blue-700">
                            Sub: {client.subscriptionCredits}
                          </Badge>
                          <Badge variant="outline" className="bg-green-900/30 text-green-300 border-green-700">
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
                        <span className="text-gray-500">Geen</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.automationActive ? (
                        <Badge className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Actief
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-400 border-gray-600">
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
                          className="hover:bg-blue-900/30 hover:text-blue-300 hover:border-blue-700 bg-transparent border-zinc-700 text-gray-400"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPasswordModal(client)}
                          className="hover:bg-yellow-900/30 hover:text-yellow-300 hover:border-yellow-700 bg-transparent border-zinc-700 text-gray-400"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCreditsModal(client)}
                          className="hover:bg-green-900/30 hover:text-green-300 hover:border-green-700 bg-transparent border-zinc-700 text-gray-400"
                        >
                          <Coins className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDeleteModal(client)}
                          className="hover:bg-red-700 bg-red-600"
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
        <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-white">Klant Bewerken</DialogTitle>
            <DialogDescription className="text-gray-400">
              Wijzig de gegevens van {editingClient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Naam</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-gray-300">Bedrijfsnaam</Label>
                <Input
                  id="companyName"
                  value={editForm.companyName}
                  onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="text-gray-300">Website</Label>
                <Input
                  id="website"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subCredits" className="text-gray-300">Subscription Credits</Label>
                <Input
                  id="subCredits"
                  type="number"
                  value={editForm.subscriptionCredits}
                  onChange={(e) => setEditForm({ ...editForm, subscriptionCredits: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topUpCredits" className="text-gray-300">Top-up Credits</Label>
                <Input
                  id="topUpCredits"
                  type="number"
                  value={editForm.topUpCredits}
                  onChange={(e) => setEditForm({ ...editForm, topUpCredits: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan" className="text-gray-300">Abonnement Plan</Label>
                <Select
                  value={editForm.subscriptionPlan}
                  onValueChange={(value) => setEditForm({ ...editForm, subscriptionPlan: value })}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Selecteer plan" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-gray-300">Status</Label>
                <Select
                  value={editForm.subscriptionStatus}
                  onValueChange={(value) => setEditForm({ ...editForm, subscriptionStatus: value })}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Selecteer status" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
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
              <Label htmlFor="unlimited" className="text-gray-300">Unlimited Credits</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)} className="bg-transparent border-zinc-700 text-gray-300 hover:bg-zinc-800">
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
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-white">Wachtwoord Wijzigen</DialogTitle>
            <DialogDescription className="text-gray-400">
              Nieuw wachtwoord voor {passwordClient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-gray-300">Nieuw Wachtwoord</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimaal 6 tekens"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordModalOpen(false)} className="bg-transparent border-zinc-700 text-gray-300 hover:bg-zinc-800">
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
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-white">Credits Toevoegen</DialogTitle>
            <DialogDescription className="text-gray-400">
              Voeg credits toe aan {creditsClient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="creditAmount" className="text-gray-300">Aantal Credits</Label>
              <Input
                id="creditAmount"
                type="number"
                value={creditsToAdd}
                onChange={(e) => setCreditsToAdd(e.target.value)}
                placeholder="10, 20, 50..."
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditType" className="text-gray-300">Credit Type</Label>
              <Select value={creditType} onValueChange={setCreditType}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="top-up">Top-up Credits</SelectItem>
                  <SelectItem value="subscription">Subscription Credits</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditsModalOpen(false)} className="bg-transparent border-zinc-700 text-gray-300 hover:bg-zinc-800">
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
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-white">Klant Verwijderen</DialogTitle>
            <DialogDescription className="text-gray-400">
              Weet je zeker dat je {deleteClient?.name} wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt. Alle content en projecten van deze klant worden ook verwijderd.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} className="bg-transparent border-zinc-700 text-gray-300 hover:bg-zinc-800">
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
