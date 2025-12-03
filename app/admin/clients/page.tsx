
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Search,
  Edit,
  Trash2,
  Key,
  Coins,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit modal
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
  
  // Password modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordClient, setPasswordClient] = useState<Client | null>(null);
  const [newPassword, setNewPassword] = useState('');
  
  // Credits modal
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [creditsClient, setCreditsClient] = useState<Client | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState('');
  const [creditType, setCreditType] = useState('top-up');
  
  // Delete confirmation
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
  
  useEffect(() => {
    if (searchTerm) {
      const filtered = clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [searchTerm, clients]);
  
  async function loadClients() {
    try {
      const response = await fetch('/api/admin/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
        setFilteredClients(data.clients);
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
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Klantenbeheer
          </h1>
          <p className="text-muted-foreground mt-1">
            Beheer alle klanten, credits en instellingen
          </p>
        </div>
        <Button asChild>
          <Link href="/admin">Terug naar Dashboard</Link>
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Zoeken</CardTitle>
          <CardDescription>Zoek klanten op naam, email of bedrijf</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Zoek klanten..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Klanten ({filteredClients.length})</CardTitle>
          <CardDescription>
            Alle geregistreerde klanten met hun accountgegevens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klant</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        {client.companyName && (
                          <p className="text-sm text-muted-foreground">{client.companyName}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>
                      {client.isUnlimited ? (
                        <Badge variant="outline" className="bg-purple-50">
                          <Coins className="h-3 w-3 mr-1" />
                          Unlimited
                        </Badge>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline">
                            Sub: {client.subscriptionCredits}
                          </Badge>
                          <Badge variant="outline">
                            Top-up: {client.topUpCredits}
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.subscriptionPlan ? (
                        <Badge>{client.subscriptionPlan}</Badge>
                      ) : (
                        <span className="text-muted-foreground">Geen</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.automationActive ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Actief
                        </Badge>
                      ) : (
                        <Badge variant="outline">
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
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPasswordModal(client)}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCreditsModal(client)}
                        >
                          <Coins className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDeleteModal(client)}
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
            <Button onClick={handleEditSubmit} disabled={actionLoading}>
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
            <Button onClick={handlePasswordChange} disabled={actionLoading}>
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
            <Button onClick={handleAddCredits} disabled={actionLoading}>
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
