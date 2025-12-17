
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  CreditCard,
  Plus,
  Minus,
  User,
  Loader2,
  History,
  MessageSquare,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Client {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  subscriptionCredits: number;
  topUpCredits: number;
  totalCreditsUsed: number;
  isUnlimited: boolean;
  createdAt: string;
  _count?: {
    savedContent: number;
    projects: number;
  };
}

interface Note {
  id: string;
  note: string;
  adminEmail: string;
  createdAt: string;
}

interface Activity {
  id: string;
  action: string;
  description: string;
  createdAt: string;
}

export default function ClientCreditsManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditType, setCreditType] = useState<'subscription' | 'topup'>('topup');
  const [creditReason, setCreditReason] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadClientDetails(selectedClient.id);
    }
  }, [selectedClient]);

  async function loadClients() {
    try {
      setLoadingClients(true);
      const response = await fetch('/api/superadmin/clients?limit=100');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('Kon klanten niet laden');
    } finally {
      setLoadingClients(false);
    }
  }

  async function loadClientDetails(clientId: string) {
    try {
      // Load notes
      const notesRes = await fetch(`/api/superadmin/clients/${clientId}/notes`);
      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData.notes);
      }

      // Load activity
      const activityRes = await fetch(`/api/superadmin/clients/${clientId}/activity`);
      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setActivities(activityData.activity);
      }
    } catch (error) {
      console.error('Error loading client details:', error);
    }
  }

  async function adjustCredits(action: 'add' | 'remove') {
    if (!selectedClient || !creditAmount || !creditReason) {
      toast.error('Vul alle velden in');
      return;
    }

    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Voer een geldig bedrag in');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/superadmin/clients/${selectedClient.id}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: action === 'add' ? amount : -amount,
          type: creditType,
          reason: creditReason,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Credits ${action === 'add' ? 'toegevoegd' : 'verwijderd'}!`);
        
        // Update client in list
        setClients(prev =>
          prev.map(c =>
            c.id === selectedClient.id
              ? { ...c, subscriptionCredits: data.updatedClient.subscriptionCredits, topUpCredits: data.updatedClient.topUpCredits }
              : c
          )
        );
        setSelectedClient(data.updatedClient);
        
        // Reload details
        await loadClientDetails(selectedClient.id);
        
        // Reset form
        setCreditAmount('');
        setCreditReason('');
      } else {
        toast.error('Kon credits niet aanpassen');
      }
    } catch (error) {
      console.error('Error adjusting credits:', error);
      toast.error('Er ging iets mis');
    } finally {
      setLoading(false);
    }
  }

  async function addNote() {
    if (!selectedClient || !newNote.trim()) {
      toast.error('Voer een notitie in');
      return;
    }

    try {
      const response = await fetch(`/api/superadmin/clients/${selectedClient.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote }),
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(prev => [data.newNote, ...prev]);
        setNewNote('');
        toast.success('Notitie toegevoegd!');
      } else {
        toast.error('Kon notitie niet toevoegen');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Er ging iets mis');
    }
  }

  const filteredClients = clients.filter(
    c =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCredits = (client: Client) => client.subscriptionCredits + client.topUpCredits;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Client List */}
      <div className="lg:col-span-1">
        <Card className="p-4 bg-zinc-800/50 border-zinc-700">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Zoek klanten..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-900/50 border-zinc-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {loadingClients ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#FF6B35]" />
              </div>
            ) : filteredClients.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Geen klanten gevonden</p>
            ) : (
              filteredClients.map(client => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedClient?.id === client.id
                      ? 'bg-[#FF6B35] text-white'
                      : 'bg-zinc-900/30 hover:bg-zinc-900/50 text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{client.name}</p>
                      <p className="text-sm opacity-75 truncate">{client.email}</p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-bold">{client.isUnlimited ? '∞' : totalCredits(client)}</p>
                      <p className="text-xs opacity-75">credits</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Client Details */}
      <div className="lg:col-span-2">
        {!selectedClient ? (
          <Card className="p-8 bg-zinc-800/50 border-zinc-700">
            <div className="text-center text-gray-400">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecteer een klant om te beheren</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Client Header */}
            <Card className="p-6 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border-zinc-700">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedClient.name}</h3>
                  <p className="text-gray-400">{selectedClient.email}</p>
                  {selectedClient.companyName && (
                    <p className="text-sm text-gray-500 mt-1">{selectedClient.companyName}</p>
                  )}
                </div>
                <Badge className={selectedClient.subscriptionStatus === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-slate-8000/20 text-gray-300'}>
                  {selectedClient.subscriptionPlan || 'geen plan'}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-zinc-900/50 rounded-lg">
                  <p className="text-2xl font-bold text-[#FF6B35]">
                    {selectedClient.isUnlimited ? '∞' : totalCredits(selectedClient)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Totaal Credits</p>
                </div>
                <div className="text-center p-3 bg-zinc-900/50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-400">{selectedClient.totalCreditsUsed || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Gebruikt</p>
                </div>
                <div className="text-center p-3 bg-zinc-900/50 rounded-lg">
                  <p className="text-2xl font-bold text-green-400">{selectedClient._count?.projects || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Projecten</p>
                </div>
              </div>
            </Card>

            {/* Credits Management */}
            <Card className="p-6 bg-zinc-800/50 border-zinc-700">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#FF6B35]" />
                Credits Beheren
              </h4>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Abonnement Credits</label>
                  <p className="text-2xl font-bold text-white">{selectedClient.subscriptionCredits}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Top-up Credits</label>
                  <p className="text-2xl font-bold text-white">{selectedClient.topUpCredits}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={creditType === 'subscription' ? 'default' : 'outline'}
                    onClick={() => setCreditType('subscription')}
                    className={creditType === 'subscription' ? 'bg-[#FF6B35]' : ''}
                  >
                    Abonnement
                  </Button>
                  <Button
                    variant={creditType === 'topup' ? 'default' : 'outline'}
                    onClick={() => setCreditType('topup')}
                    className={creditType === 'topup' ? 'bg-[#FF6B35]' : ''}
                  >
                    Top-up
                  </Button>
                </div>

                <Input
                  type="number"
                  placeholder="Aantal credits"
                  value={creditAmount}
                  onChange={e => setCreditAmount(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-700 text-white"
                />

                <Input
                  placeholder="Reden voor aanpassing"
                  value={creditReason}
                  onChange={e => setCreditReason(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-700 text-white"
                />

                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => adjustCredits('add')} disabled={loading} className="bg-green-600 hover:bg-green-700">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                    Toevoegen
                  </Button>
                  <Button onClick={() => adjustCredits('remove')} disabled={loading} className="bg-red-600 hover:bg-red-700">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4 mr-2" />}
                    Verwijderen
                  </Button>
                </div>
              </div>
            </Card>

            {/* Notes */}
            <Card className="p-6 bg-zinc-800/50 border-zinc-700">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#FF6B35]" />
                Notities
              </h4>

              <div className="space-y-3 mb-4">
                <Textarea
                  placeholder="Nieuwe notitie..."
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-700 text-white"
                  rows={3}
                />
                <Button onClick={addNote} className="bg-[#FF6B35] hover:bg-[#ff5520] w-full">
                  Notitie Toevoegen
                </Button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {notes.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">Geen notities</p>
                ) : (
                  notes.map(note => (
                    <div key={note.id} className="p-3 bg-zinc-900/50 rounded-lg">
                      <p className="text-white text-sm">{note.note}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                        <span>{note.adminEmail}</span>
                        <span>{new Date(note.createdAt).toLocaleDateString('nl-NL')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Activity Log */}
            <Card className="p-6 bg-zinc-800/50 border-zinc-700">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <History className="h-5 w-5 text-[#FF6B35]" />
                Recente Activiteit
              </h4>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {activities.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">Geen activiteit</p>
                ) : (
                  activities.slice(0, 10).map(activity => (
                    <div key={activity.id} className="p-3 bg-zinc-900/50 rounded-lg flex items-start gap-3">
                      <TrendingUp className="h-4 w-4 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{activity.action}</p>
                        <p className="text-gray-400 text-xs">{activity.description}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(activity.createdAt).toLocaleString('nl-NL')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
