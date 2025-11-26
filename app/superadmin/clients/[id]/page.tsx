
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft,
  Loader2,
  CreditCard,
  FileText,
  Activity,
  Plus,
  Minus,
  Save,
  Mail,
  Building,
  Calendar,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

interface Client {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  website: string | null;
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
  subscriptionCredits: number;
  topUpCredits: number;
  totalCreditsUsed: number;
  totalCreditsPurchased: number;
  isUnlimited: boolean;
  createdAt: string;
  projects: Array<{
    id: string;
    name: string;
    websiteUrl: string;
    createdAt: string;
  }>;
  savedContent: Array<{
    id: string;
    title: string;
    createdAt: string;
  }>;
  _count: {
    savedContent: number;
    projects: number;
    creditTransactions: number;
  };
}

interface Note {
  id: string;
  note: string;
  adminEmail: string;
  createdAt: string;
  updatedAt: string;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  metadata: any;
  createdAt: string;
}

export default function ClientDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'credits' | 'notes' | 'activity'>('overview');

  // Credits adjustment
  const [creditAmount, setCreditAmount] = useState('');
  const [creditType, setCreditType] = useState<'subscription' | 'topup'>('topup');
  const [creditReason, setCreditReason] = useState('');
  const [adjustingCredits, setAdjustingCredits] = useState(false);

  // Note creation
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    } else if (status === 'authenticated') {
      if (session?.user?.email !== 'info@writgo.nl') {
        router.push('/client-portal');
      } else {
        fetchClientData();
      }
    }
  }, [status, session, router, clientId]);

  const fetchClientData = async () => {
    setLoading(true);
    try {
      const [clientRes, notesRes, activityRes] = await Promise.all([
        fetch(`/api/superadmin/clients/${clientId}`),
        fetch(`/api/superadmin/clients/${clientId}/notes`),
        fetch(`/api/superadmin/clients/${clientId}/activity`)
      ]);

      if (clientRes.ok) {
        const clientData = await clientRes.json();
        setClient(clientData);
      }
      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData.notes);
      }
      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setActivity(activityData.activity);
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
      toast.error('Fout bij laden van klantgegevens');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustCredits = async (isAdding: boolean) => {
    if (!creditAmount || !creditReason.trim()) {
      toast.error('Vul zowel het bedrag als de reden in');
      return;
    }

    setAdjustingCredits(true);
    try {
      const amount = isAdding ? parseInt(creditAmount) : -parseInt(creditAmount);
      
      const response = await fetch(`/api/superadmin/clients/${clientId}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          type: creditType,
          reason: creditReason
        })
      });

      if (response.ok) {
        toast.success(`Credits ${isAdding ? 'toegevoegd' : 'verwijderd'}!`);
        setCreditAmount('');
        setCreditReason('');
        fetchClientData();
      } else {
        toast.error('Fout bij aanpassen credits');
      }
    } catch (error) {
      console.error('Error adjusting credits:', error);
      toast.error('Fout bij aanpassen credits');
    } finally {
      setAdjustingCredits(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('Vul een notitie in');
      return;
    }

    setAddingNote(true);
    try {
      const response = await fetch(`/api/superadmin/clients/${clientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote })
      });

      if (response.ok) {
        toast.success('Notitie toegevoegd!');
        setNewNote('');
        fetchClientData();
      } else {
        toast.error('Fout bij toevoegen notitie');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Fout bij toevoegen notitie');
    } finally {
      setAddingNote(false);
    }
  };

  if (loading || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const totalCredits = client.subscriptionCredits + client.topUpCredits;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/superadmin/clients">
                <Button variant="ghost" size="sm" className="hover:bg-white/10">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">{client.name}</h1>
                <p className="text-sm text-gray-400">{client.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {client.subscriptionStatus === 'active' ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Actief</Badge>
              ) : (
                <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">Inactief</Badge>
              )}
              <Link href="/client-portal">
                <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hidden sm:flex">
                  Terug naar Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Tabs */}
        <Card className="bg-white/5 border-white/10">
          <div className="p-2 flex gap-2 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overzicht', icon: FileText },
              { id: 'credits', label: 'Credits', icon: CreditCard },
              { id: 'notes', label: 'Notities', icon: FileText },
              { id: 'activity', label: 'Activiteit', icon: Activity }
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                onClick={() => setActiveTab(tab.id as any)}
                className={activeTab === tab.id ? 'bg-orange-500' : 'hover:bg-white/10'}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white/5 border-white/10">
                <div className="p-6">
                  <p className="text-sm text-gray-400 mb-2">Totaal Credits</p>
                  <p className="text-3xl font-bold text-green-400">
                    {client.isUnlimited ? '∞' : totalCredits.toLocaleString()}
                  </p>
                </div>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <div className="p-6">
                  <p className="text-sm text-gray-400 mb-2">Gebruikt</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {Math.round(client.totalCreditsUsed).toLocaleString()}
                  </p>
                </div>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <div className="p-6">
                  <p className="text-sm text-gray-400 mb-2">Projecten</p>
                  <p className="text-3xl font-bold">{client._count.projects}</p>
                </div>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <div className="p-6">
                  <p className="text-sm text-gray-400 mb-2">Content</p>
                  <p className="text-3xl font-bold">{client._count.savedContent}</p>
                </div>
              </Card>
            </div>

            {/* Client Info */}
            <Card className="bg-white/5 border-white/10">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Klant Informatie</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-orange-500 mt-1" />
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="font-medium">{client.email}</p>
                    </div>
                  </div>
                  {client.companyName && (
                    <div className="flex items-start gap-3">
                      <Building className="h-5 w-5 text-orange-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-400">Bedrijf</p>
                        <p className="font-medium">{client.companyName}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-orange-500 mt-1" />
                    <div>
                      <p className="text-sm text-gray-400">Lid sinds</p>
                      <p className="font-medium">
                        {new Date(client.createdAt).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-orange-500 mt-1" />
                    <div>
                      <p className="text-sm text-gray-400">Subscription Plan</p>
                      <p className="font-medium">{client.subscriptionPlan || 'Geen'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Projects */}
            <Card className="bg-white/5 border-white/10">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Projecten ({client.projects.length})</h2>
                <div className="space-y-3">
                  {client.projects.slice(0, 5).map((project) => (
                    <div key={project.id} className="p-4 bg-white/5 rounded-lg">
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-gray-400 mt-1">{project.websiteUrl}</p>
                    </div>
                  ))}
                  {client.projects.length === 0 && (
                    <p className="text-gray-500 text-center py-4">Geen projecten</p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Credits Tab */}
        {activeTab === 'credits' && (
          <div className="space-y-6">
            {/* Current Credits */}
            <Card className="bg-white/5 border-white/10">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Huidige Credits</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">Subscription</p>
                    <p className="text-2xl font-bold text-green-400">
                      {client.subscriptionCredits.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">Top-up</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {client.topUpCredits.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">Totaal</p>
                    <p className="text-2xl font-bold">
                      {client.isUnlimited ? '∞' : totalCredits.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Adjust Credits */}
            <Card className="bg-white/5 border-white/10">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Credits Aanpassen</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Bedrag</label>
                      <Input
                        type="number"
                        placeholder="Aantal credits"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        className="bg-white/5 border-white/10"
                        disabled={adjustingCredits}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Type</label>
                      <select
                        value={creditType}
                        onChange={(e) => setCreditType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white"
                        disabled={adjustingCredits}
                      >
                        <option value="subscription">Subscription</option>
                        <option value="topup">Top-up</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Reden</label>
                    <Textarea
                      placeholder="Waarom worden deze credits aangepast?"
                      value={creditReason}
                      onChange={(e) => setCreditReason(e.target.value)}
                      className="bg-white/5 border-white/10 min-h-[80px]"
                      disabled={adjustingCredits}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleAdjustCredits(true)}
                      disabled={adjustingCredits || !creditAmount || !creditReason}
                      className="flex-1 bg-green-500 hover:bg-green-600"
                    >
                      {adjustingCredits ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Credits Toevoegen
                    </Button>
                    <Button
                      onClick={() => handleAdjustCredits(false)}
                      disabled={adjustingCredits || !creditAmount || !creditReason}
                      className="flex-1 bg-red-500 hover:bg-red-600"
                    >
                      {adjustingCredits ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Minus className="h-4 w-4 mr-2" />
                      )}
                      Credits Verwijderen
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            {/* Add Note */}
            <Card className="bg-white/5 border-white/10">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Nieuwe Notitie</h2>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Voeg een notitie toe..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="bg-white/5 border-white/10 min-h-[100px]"
                    disabled={addingNote}
                  />
                  <Button
                    onClick={handleAddNote}
                    disabled={addingNote || !newNote.trim()}
                    className="bg-gradient-to-r from-orange-500 to-orange-600"
                  >
                    {addingNote ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Notitie Opslaan
                  </Button>
                </div>
              </div>
            </Card>

            {/* Notes List */}
            <Card className="bg-white/5 border-white/10">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Notities ({notes.length})</h2>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {notes.map((note) => (
                    <div key={note.id} className="p-4 bg-white/5 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                        <span className="text-xs text-gray-500">{note.adminEmail}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(note.createdAt).toLocaleDateString('nl-NL', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p className="text-gray-500 text-center py-8">Nog geen notities</p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <Card className="bg-white/5 border-white/10">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Activiteit Log ({activity.length})</h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {activity.map((log) => (
                  <div key={log.id} className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{log.action}</p>
                        <p className="text-sm text-gray-400 mt-1">{log.description}</p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleDateString('nl-NL', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                {activity.length === 0 && (
                  <p className="text-gray-500 text-center py-8">Geen activiteit</p>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
