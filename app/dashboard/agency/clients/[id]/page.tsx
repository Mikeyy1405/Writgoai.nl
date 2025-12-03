'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  ArrowLeft, Loader2, CreditCard, FileText, Activity, Plus, Minus, Save,
  Mail, Building, Calendar, TrendingUp, Users, CheckCircle, DollarSign,
  ClipboardList, Edit, Trash2, Infinity
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  assignments?: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    createdAt: string;
  }>;
  invoices?: Array<{
    id: string;
    invoiceNumber: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
  clientRequests?: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    createdAt: string;
  }>;
  _count: {
    savedContent: number;
    projects: number;
    assignments?: number;
    invoices?: number;
    clientRequests?: number;
  };
}

interface Note {
  id: string;
  note: string;
  adminEmail: string;
  createdAt: string;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'agency' | 'credits' | 'notes' | 'activity'>('overview');

  // Credits adjustment
  const [creditAmount, setCreditAmount] = useState('');
  const [creditType, setCreditType] = useState<'subscription' | 'topup'>('topup');
  const [creditReason, setCreditReason] = useState('');
  const [adjustingCredits, setAdjustingCredits] = useState(false);

  // Note creation
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', companyName: '', website: '' });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/inloggen');
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
      // First try admin API, fallback to superadmin API
      const clientRes = await fetch(`/api/admin/agency/clients/${clientId}`);
      
      if (clientRes.ok) {
        const clientData = await clientRes.json();
        setClient(clientData);
        setEditForm({
          name: clientData.name || '',
          email: clientData.email || '',
          companyName: clientData.companyName || '',
          website: clientData.website || ''
        });
      } else {
        // Fallback to superadmin API
        const superAdminRes = await fetch(`/api/superadmin/clients/${clientId}`);
        if (superAdminRes.ok) {
          const clientData = await superAdminRes.json();
          setClient(clientData);
          setEditForm({
            name: clientData.name || '',
            email: clientData.email || '',
            companyName: clientData.companyName || '',
            website: clientData.website || ''
          });
        }
      }

      // Fetch notes
      const notesRes = await fetch(`/api/superadmin/clients/${clientId}/notes`);
      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData.notes || []);
      }

      // Fetch activity
      const activityRes = await fetch(`/api/superadmin/clients/${clientId}/activity`);
      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setActivity(activityData.activity || []);
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
      toast.error('Fout bij laden van klantgegevens');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClient = async () => {
    try {
      const response = await fetch(`/api/admin/agency/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        toast.success('Klant bijgewerkt!');
        setIsEditing(false);
        fetchClientData();
      } else {
        toast.error('Fout bij bijwerken van klant');
      }
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Fout bij bijwerken van klant');
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
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  const totalCredits = client.subscriptionCredits + client.topUpCredits;
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'trialing': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'canceled': case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-gray-800 bg-gray-900/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/agency/clients">
                <Button variant="ghost" size="sm" className="hover:bg-gray-800">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">{client.name}</h1>
                <p className="text-sm text-gray-400">{client.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(client.subscriptionStatus || 'inactive')}>
                {client.subscriptionStatus === 'active' ? 'Actief' : 'Inactief'}
              </Badge>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="border-gray-700 hover:bg-gray-800"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Bewerken
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        name: client.name || '',
                        email: client.email || '',
                        companyName: client.companyName || '',
                        website: client.website || ''
                      });
                    }}
                    className="border-gray-700 hover:bg-gray-800"
                  >
                    Annuleren
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleUpdateClient}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Opslaan
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Tabs */}
        <Card className="bg-gray-800/50 border-gray-700">
          <div className="p-2 flex gap-2 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overzicht', icon: Users },
              { id: 'agency', label: 'Agency', icon: ClipboardList },
              { id: 'credits', label: 'Credits', icon: CreditCard },
              { id: 'notes', label: 'Notities', icon: FileText },
              { id: 'activity', label: 'Activiteit', icon: Activity }
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                onClick={() => setActiveTab(tab.id as any)}
                className={activeTab === tab.id ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-gray-700'}
                size="sm"
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
              <Card className="bg-gray-800/50 border-gray-700">
                <div className="p-6">
                  <p className="text-sm text-gray-400 mb-2">Totaal Credits</p>
                  <p className="text-3xl font-bold text-green-400">
                    {client.isUnlimited ? (
                      <span className="flex items-center gap-2">
                        <Infinity className="w-8 h-8" />
                        Onbeperkt
                      </span>
                    ) : (
                      totalCredits.toLocaleString()
                    )}
                  </p>
                </div>
              </Card>
              <Card className="bg-gray-800/50 border-gray-700">
                <div className="p-6">
                  <p className="text-sm text-gray-400 mb-2">Gebruikt</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {Math.round(client.totalCreditsUsed).toLocaleString()}
                  </p>
                </div>
              </Card>
              <Card className="bg-gray-800/50 border-gray-700">
                <div className="p-6">
                  <p className="text-sm text-gray-400 mb-2">Projecten</p>
                  <p className="text-3xl font-bold">{client._count.projects}</p>
                </div>
              </Card>
              <Card className="bg-gray-800/50 border-gray-700">
                <div className="p-6">
                  <p className="text-sm text-gray-400 mb-2">Content</p>
                  <p className="text-3xl font-bold">{client._count.savedContent}</p>
                </div>
              </Card>
            </div>

            {/* Client Info */}
            <Card className="bg-gray-800/50 border-gray-700">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Klant Informatie</h2>
                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Naam</label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="bg-gray-900 border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Email</label>
                      <Input
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="bg-gray-900 border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Bedrijf</label>
                      <Input
                        value={editForm.companyName}
                        onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                        className="bg-gray-900 border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Website</label>
                      <Input
                        value={editForm.website}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        className="bg-gray-900 border-gray-700"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-green-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-400">Email</p>
                        <p className="font-medium">{client.email}</p>
                      </div>
                    </div>
                    {client.companyName && (
                      <div className="flex items-start gap-3">
                        <Building className="h-5 w-5 text-green-500 mt-1" />
                        <div>
                          <p className="text-sm text-gray-400">Bedrijf</p>
                          <p className="font-medium">{client.companyName}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-green-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-400">Lid sinds</p>
                        <p className="font-medium">
                          {new Date(client.createdAt).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-green-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-400">Subscription Plan</p>
                        <p className="font-medium">{client.subscriptionPlan || 'Geen'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Projects */}
            <Card className="bg-gray-800/50 border-gray-700">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Projecten ({client.projects.length})</h2>
                <div className="space-y-3">
                  {client.projects.slice(0, 5).map((project) => (
                    <div key={project.id} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
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

        {/* Agency Tab */}
        {activeTab === 'agency' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <div className="p-6">
                  <p className="text-sm text-gray-400 mb-2">Opdrachten</p>
                  <p className="text-3xl font-bold text-blue-400">{client._count.assignments || 0}</p>
                </div>
              </Card>
              <Card className="bg-gray-800/50 border-gray-700">
                <div className="p-6">
                  <p className="text-sm text-gray-400 mb-2">Facturen</p>
                  <p className="text-3xl font-bold text-green-400">{client._count.invoices || 0}</p>
                </div>
              </Card>
              <Card className="bg-gray-800/50 border-gray-700">
                <div className="p-6">
                  <p className="text-sm text-gray-400 mb-2">Verzoeken</p>
                  <p className="text-3xl font-bold text-purple-400">{client._count.clientRequests || 0}</p>
                </div>
              </Card>
            </div>

            {/* Recent Assignments */}
            {client.assignments && client.assignments.length > 0 && (
              <Card className="bg-gray-800/50 border-gray-700">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Recente Opdrachten</h2>
                    <Link href="/dashboard/agency/assignments">
                      <Button variant="outline" size="sm" className="border-gray-700">
                        Bekijk alle
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {client.assignments.slice(0, 5).map((assignment) => (
                      <div key={assignment.id} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{assignment.title}</p>
                            <p className="text-sm text-gray-400 mt-1">{assignment.type}</p>
                          </div>
                          <Badge className="bg-blue-500/20 text-blue-400">{assignment.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Recent Invoices */}
            {client.invoices && client.invoices.length > 0 && (
              <Card className="bg-gray-800/50 border-gray-700">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Recente Facturen</h2>
                    <Link href="/dashboard/agency/invoices">
                      <Button variant="outline" size="sm" className="border-gray-700">
                        Bekijk alle
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {client.invoices.slice(0, 5).map((invoice) => (
                      <div key={invoice.id} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{invoice.invoiceNumber}</p>
                            <p className="text-sm text-gray-400 mt-1">€{invoice.total.toFixed(2)}</p>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400">{invoice.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Credits Tab */}
        {activeTab === 'credits' && (
          <div className="space-y-6">
            {/* Current Credits */}
            <Card className="bg-gray-800/50 border-gray-700">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Huidige Credits</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Subscription</p>
                    <p className="text-2xl font-bold text-green-400">
                      {client.subscriptionCredits.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Top-up</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {client.topUpCredits.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Totaal</p>
                    <p className="text-2xl font-bold">
                      {client.isUnlimited ? (
                        <span className="flex items-center gap-2">
                          <Infinity className="w-6 h-6" />
                          Onbeperkt
                        </span>
                      ) : (
                        totalCredits.toLocaleString()
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Adjust Credits */}
            {!client.isUnlimited && (
              <Card className="bg-gray-800/50 border-gray-700">
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
                          className="bg-gray-900 border-gray-700"
                          disabled={adjustingCredits}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Type</label>
                        <select
                          value={creditType}
                          onChange={(e) => setCreditType(e.target.value as any)}
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
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
                        className="bg-gray-900 border-gray-700 min-h-[80px]"
                        disabled={adjustingCredits}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleAdjustCredits(true)}
                        disabled={adjustingCredits || !creditAmount || !creditReason}
                        className="flex-1 bg-green-600 hover:bg-green-700"
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
                        className="flex-1 bg-red-600 hover:bg-red-700"
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
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            {/* Add Note */}
            <Card className="bg-gray-800/50 border-gray-700">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Nieuwe Notitie</h2>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Voeg een notitie toe..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="bg-gray-900 border-gray-700 min-h-[100px]"
                    disabled={addingNote}
                  />
                  <Button
                    onClick={handleAddNote}
                    disabled={addingNote || !newNote.trim()}
                    className="bg-green-600 hover:bg-green-700"
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
            <Card className="bg-gray-800/50 border-gray-700">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Notities ({notes.length})</h2>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {notes.map((note) => (
                    <div key={note.id} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                      <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
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
          <Card className="bg-gray-800/50 border-gray-700">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Activiteit Log ({activity.length})</h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {activity.map((log) => (
                  <div key={log.id} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
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
