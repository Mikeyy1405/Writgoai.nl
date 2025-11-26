
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Users, 
  Activity, 
  Search, 
  X, 
  CheckCircle, 
  TrendingUp,
  LogOut,
  ChevronRight,
  Edit2,
  Save,
  Loader2,
  Infinity
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// --- INTERFACES ---

interface Client {
  id: string;
  name: string;
  companyName: string | null;
  email: string;
  subscriptionCredits: number;
  topUpCredits: number;
  isUnlimited: boolean;
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    savedContent: number;
    projects: number;
  };
}

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  credits: {
    totalPurchased: number;
    totalUsed: number;
    currentSubscription: number;
    currentTopUp: number;
  };
}

// --- MAIN COMPONENT ---

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState('users');
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  
  // User Management State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<Client | null>(null);
  const [creditInput, setCreditInput] = useState('');
  const [modalTab, setModalTab] = useState('overview');

  // Derived State
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.companyName && client.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCredits = (stats?.credits.currentSubscription || 0) + (stats?.credits.currentTopUp || 0);
  const activeClientsCount = clients.filter(c => c.subscriptionStatus === 'active').length;

  // --- AUTH & DATA LOADING ---
  
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/client-login');
      return;
    }
    
    if (status === 'authenticated' && session) {
      if (session.user?.email !== 'info@writgo.nl') {
        console.log('Unauthorized access attempt to super admin:', session.user?.email);
        router.push('/client-portal');
        return;
      }
      
      loadData();
    }
  }, [status, session]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load stats
      const statsRes = await fetch('/api/superadmin/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      
      // Load clients
      const clientsRes = await fetch('/api/superadmin/clients?limit=100');
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData.clients || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Fout bij laden van data');
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---

  const showNotification = (msg: string) => {
    setNotification(msg);
    toast.success(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // User Modal Handlers
  const handleOpenModal = (client: Client) => {
    setSelectedClient(client);
    setEditedClient({ ...client });
    setIsEditing(false);
    setModalTab('overview');
  };

  const handleUpdateCredits = async (amount: number, type: 'subscription' | 'topup' = 'topup') => {
    if (!selectedClient) return;
    
    try {
      const response = await fetch(`/api/superadmin/clients/${selectedClient.id}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          type,
          reason: `Admin aanpassing: ${amount > 0 ? '+' : ''}${amount} credits`
        })
      });

      if (response.ok) {
        const { updatedClient } = await response.json();
        setSelectedClient(updatedClient);
        setEditedClient(updatedClient);
        
        // Update in list
        setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
        
        showNotification(amount > 0 ? 'Credits toegevoegd' : 'Credits afgeschreven');
        setCreditInput('');
        await loadData(); // Refresh stats
      }
    } catch (error) {
      console.error('Error updating credits:', error);
      toast.error('Fout bij bijwerken van credits');
    }
  };

  const handleSaveChanges = async () => {
    if (!editedClient) return;
    
    try {
      const response = await fetch(`/api/superadmin/clients/${editedClient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionStatus: editedClient.subscriptionStatus,
          subscriptionPlan: editedClient.subscriptionPlan,
          isUnlimited: editedClient.isUnlimited
        })
      });

      if (response.ok) {
        const updatedClient = await response.json();
        setSelectedClient(updatedClient);
        setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
        setIsEditing(false);
        showNotification('Wijzigingen opgeslagen');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Fout bij opslaan');
    }
  };

  const handleInputChange = (field: keyof Client, value: any) => {
    setEditedClient(prev => prev ? { ...prev, [field]: value } : null);
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const getTotalCredits = (client: Client) => {
    return client.subscriptionCredits + client.topUpCredits;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-30 border-b border-gray-800 bg-gray-900/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white shadow-lg shadow-orange-900/20">
                <Activity size={20} />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Admin<span className="text-orange-500">Panel</span>
              </span>
            </div>
            
            {/* Main Navigation Tabs */}
            <div className="hidden md:flex items-center gap-1 bg-gray-800/50 p-1 rounded-lg border border-gray-800">
              <NavTab active={currentTab === 'users'} onClick={() => setCurrentTab('users')} icon={Users} label="Klanten" />
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/client-portal')}
                className="text-gray-400 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Terug
              </Button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 ring-2 ring-gray-800"></div>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* --- VIEW: USERS DASHBOARD --- */}
        {currentTab === 'users' && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-gray-400">Beheer klanten, abonnementen en credits.</p>
            </div>

            {/* Stats Grid */}
            <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard title="Totaal Klanten" value={clients.length} icon={Users} trend={`${activeClientsCount} actief`} color="blue" />
              <StatCard title="Credits in Omloop" value={totalCredits.toLocaleString()} icon={Activity} trend="Huidig saldo" color="orange" />
              <StatCard title="Actieve Gebruikers" value={activeClientsCount} icon={CheckCircle} trend="Met actief abonnement" color="green" />
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex flex-col gap-4 rounded-xl border border-gray-800 bg-gray-800/50 p-4 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Zoek op naam, bedrijf, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div className="text-sm text-gray-400">
                {filteredClients.length} van {clients.length} klanten
              </div>
            </div>

            {/* User Table */}
            <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-xl">
              <div className="hidden border-b border-gray-800 bg-gray-800/50 px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 md:grid md:grid-cols-12 md:gap-4">
                <div className="col-span-4">Klant & Bedrijf</div>
                <div className="col-span-3">Status & Plan</div>
                <div className="col-span-2">Credits</div>
                <div className="col-span-2">Content</div>
                <div className="col-span-1 text-right">Actie</div>
              </div>
              <div className="divide-y divide-gray-800">
                {filteredClients.map((client) => (
                  <div key={client.id} className="group hover:bg-gray-800/50 transition-colors">
                    <div className="hidden items-center px-6 py-4 md:grid md:grid-cols-12 md:gap-4">
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-700 bg-gray-800 text-sm font-bold text-orange-500">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-white">{client.name}</div>
                          <div className="text-sm text-gray-400">{client.companyName || client.email}</div>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <StatusBadge status={client.subscriptionStatus} />
                        <span className="ml-2 text-xs text-gray-500">{client.subscriptionPlan || 'Free'}</span>
                      </div>
                      <div className="col-span-2 font-mono text-orange-500">
                        {client.isUnlimited ? (
                          <span className="flex items-center gap-1">
                            <Infinity className="w-4 h-4" />
                            Onbeperkt
                          </span>
                        ) : (
                          getTotalCredits(client).toLocaleString()
                        )}
                      </div>
                      <div className="col-span-2">
                        <div className="text-sm text-white">{client._count?.savedContent || 0} artikelen</div>
                        <div className="text-xs text-gray-500">{client._count?.projects || 0} projecten</div>
                      </div>
                      <div className="col-span-1 text-right">
                        <button onClick={() => handleOpenModal(client)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-700 hover:text-white">
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>
                    {/* Mobile Row */}
                    <div className="flex items-center justify-between p-4 md:hidden">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-orange-500 font-bold">{client.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="font-medium text-white">{client.name}</div>
                          <div className="text-xs text-gray-400">{client.companyName || client.email}</div>
                        </div>
                      </div>
                      <button onClick={() => handleOpenModal(client)} className="rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-white">Beheer</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* --- USER DETAIL MODAL --- */}
      {selectedClient && editedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-2xl">
            <div className="flex shrink-0 items-start justify-between border-b border-gray-700 p-6 bg-gray-800">
              <div className="flex items-center gap-4 w-full">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-gray-600 bg-gray-700 text-2xl font-bold text-orange-500">
                  {editedClient.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input type="text" value={editedClient.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white focus:border-orange-500 outline-none" />
                      <input type="text" value={editedClient.companyName || ''} onChange={(e) => handleInputChange('companyName', e.target.value)} placeholder="Bedrijfsnaam" className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:border-orange-500 outline-none" />
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-2xl font-bold text-white truncate">{selectedClient.name}</h2>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>{selectedClient.companyName || 'Geen bedrijf'}</span>
                        <span className="h-1 w-1 rounded-full bg-gray-500"></span>
                        <span>{selectedClient.email}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={() => isEditing ? handleSaveChanges() : setIsEditing(true)} className={`p-2 rounded-lg transition-colors ${isEditing ? 'bg-green-600 text-white hover:bg-green-500' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                    {isEditing ? <Save size={20} /> : <Edit2 size={20} />}
                  </button>
                  <button onClick={() => {setSelectedClient(null); setIsEditing(false);}} className="rounded-full p-2 text-gray-400 hover:bg-gray-700 hover:text-white"><X size={24} /></button>
                </div>
              </div>
            </div>
            {/* Modal Content */}
            <div className="overflow-y-auto p-6 bg-gray-800 space-y-6">
               <div className="grid grid-cols-2 gap-4">
                 <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
                   <p className="mb-1 text-sm text-gray-400">Credits Saldo</p>
                   <p className="font-mono text-3xl font-bold text-orange-500">
                     {selectedClient.isUnlimited ? (
                       <span className="flex items-center gap-2">
                         <Infinity className="w-8 h-8" />
                         Onbeperkt
                       </span>
                     ) : (
                       getTotalCredits(selectedClient).toLocaleString()
                     )}
                   </p>
                 </div>
                 <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
                   <p className="mb-1 text-sm text-gray-400">Content</p>
                   <div className="flex items-end gap-2">
                     <p className="text-3xl font-bold text-white">{selectedClient._count?.savedContent || 0}</p>
                     <TrendingUp size={20} className="mb-1.5 text-green-500" />
                   </div>
                 </div>
               </div>
               
               {!selectedClient.isUnlimited && (
                 <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-5">
                   <label className="mb-3 block text-sm font-medium text-gray-300">Credits beheren</label>
                   <div className="flex gap-2">
                     <input type="number" placeholder="Aantal credits..." value={creditInput} onChange={(e) => setCreditInput(e.target.value)} className="flex-1 rounded-lg border border-gray-600 bg-gray-900 px-4 py-2 text-white focus:border-orange-500 outline-none" />
                     <button onClick={() => handleUpdateCredits(Number(creditInput))} className="rounded-lg bg-orange-600 px-4 py-2 text-white hover:bg-orange-500">+</button>
                     <button onClick={() => handleUpdateCredits(-Number(creditInput))} className="rounded-lg bg-gray-700 px-4 py-2 text-white hover:bg-gray-600">-</button>
                   </div>
                 </div>
               )}
               
               <div className="relative overflow-hidden rounded-xl border border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 p-6">
                 <div className="flex items-start justify-between mb-4">
                   <div>
                     <p className="text-xs uppercase tracking-wider text-gray-400">Plan</p>
                     <h3 className="text-2xl font-bold text-white">{selectedClient.subscriptionPlan || 'Free'}</h3>
                   </div>
                   <StatusBadge status={selectedClient.subscriptionStatus} />
                 </div>
                 {selectedClient.isUnlimited && (
                   <div className="mt-3 flex items-center gap-2 text-purple-400">
                     <Infinity className="w-5 h-5" />
                     <span className="text-sm font-medium">Onbeperkte credits</span>
                   </div>
                 )}
               </div>

               <div className="grid grid-cols-2 gap-4 text-sm">
                 <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                   <p className="text-gray-400 mb-1">Projecten</p>
                   <p className="text-2xl font-bold text-white">{selectedClient._count?.projects || 0}</p>
                 </div>
                 <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                   <p className="text-gray-400 mb-1">Lid sinds</p>
                   <p className="text-sm font-medium text-white">
                     {new Date(selectedClient.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                   </p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg bg-orange-600 px-6 py-3 text-white shadow-lg shadow-orange-900/50 animate-in slide-in-from-bottom-5">
          <CheckCircle size={20} />
          <span className="font-medium">{notification}</span>
        </div>
      )}
    </div>
  );
}

// --- SUBCOMPONENTS ---

function NavTab({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${active ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
      <Icon size={16} className={active ? 'text-orange-500' : ''} />
      {label}
    </button>
  );
}

function StatCard({ title, value, icon: Icon, trend, color }: { title: string; value: string | number; icon: any; trend: string; color: string }) {
  const colors = { orange: "text-orange-500 bg-orange-500/10 border-orange-500/20", blue: "text-blue-400 bg-blue-500/10 border-blue-500/20", green: "text-green-400 bg-green-500/10 border-green-500/20" };
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div><p className="mb-1 text-sm font-medium text-gray-400">{title}</p><h3 className="text-2xl font-bold text-white">{value}</h3></div>
        <div className={`rounded-lg border p-2 ${colors[color as keyof typeof colors]}`}><Icon size={24} /></div>
      </div>
      <div className="flex items-center text-xs"><span className="text-gray-400">Status: <span className="font-medium text-white">{trend}</span></span></div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = { 
    'active': 'bg-green-900/30 text-green-400 border-green-900', 
    'inactive': 'bg-red-900/30 text-red-400 border-red-900',
    'cancelled': 'bg-gray-700/30 text-gray-400 border-gray-700',
    'trialing': 'bg-blue-900/30 text-blue-400 border-blue-900'
  };
  
  const labels = {
    'active': 'Actief',
    'inactive': 'Inactief',
    'cancelled': 'Geannuleerd',
    'trialing': 'Proefperiode'
  };
  
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-700 border-gray-600'}`}>{labels[status as keyof typeof labels] || status}</span>;
}
