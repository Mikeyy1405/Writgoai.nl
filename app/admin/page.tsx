'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, FileText, DollarSign, Activity, Search, 
  Loader2, ArrowRight, TrendingUp, Clock, CheckCircle2,
  UserCheck, CreditCard, LogOut, Home, Menu, X,
  Package, MessageSquare, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

interface Client {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  subscriptionStatus: string;
  subscriptionPlan: string;
  subscriptionCredits: number;
  topUpCredits: number;
  totalCreditsUsed: number;
  isUnlimited: boolean;
  createdAt: string;
  _count: {
    savedContent: number;
    projects: number;
  };
}

interface Order {
  id: string;
  title: string;
  status: string;
  category: string;
  client: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface Stats {
  totalClients: number;
  activeClients: number;
  credits: {
    totalPurchased: number;
    totalUsed: number;
    subscriptionCredits: number;
    topUpCredits: number;
  };
  subscriptions: Record<string, number>;
  recentActivity: any[];
  revenue: {
    total: number;
    credits: number;
  };
  monthlyRevenue: any[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'orders'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hasFetchedRef = useRef(false);

  // Auth check and data fetching
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/client-login');
      return;
    }
    
    if (session?.user?.email !== 'info@writgo.nl') {
      router.push('/client-portal');
      return;
    }
    
    // Only fetch data once
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchData();
    }
  }, [status, session?.user?.email]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch stats
      const statsRes = await fetch('/api/superadmin/stats');
      if (!statsRes.ok) {
        throw new Error('Failed to fetch stats');
      }
      const statsData = await statsRes.json();
      setStats(statsData);
      
      // Fetch clients
      const clientsRes = await fetch('/api/superadmin/clients?limit=10');
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData.clients || []);
      }
      
      // Fetch orders
      const ordersRes = await fetch('/api/admin/orders?status=all');
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders?.slice(0, 10) || []);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  // Loading state
  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Dashboard laden...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <Card className="bg-gray-900 border-gray-800 max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Fout bij laden</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <Button onClick={() => {
              hasFetchedRef.current = false;
              fetchData();
            }} className="bg-blue-600 hover:bg-blue-700">
              Opnieuw proberen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Safe filter functions with null checks
  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  const filteredOrders = orders.filter(order =>
    order.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.client?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-gray-400 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-xs md:text-sm text-gray-400">WritGo Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Link href="/client-portal">
                <Button variant="ghost" size="sm" className="hidden md:flex">
                  <Home className="w-4 h-4 mr-2" />
                  Portal
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="text-red-400 hover:text-red-300"
              >
                <LogOut className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Uitloggen</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800 bg-gray-900 p-4">
            <div className="flex flex-col gap-2">
              <Button
                variant={activeTab === 'overview' ? 'default' : 'ghost'}
                className="justify-start"
                onClick={() => {
                  setActiveTab('overview');
                  setMobileMenuOpen(false);
                }}
              >
                <Activity className="w-4 h-4 mr-2" />
                Overzicht
              </Button>
              <Button
                variant={activeTab === 'clients' ? 'default' : 'ghost'}
                className="justify-start"
                onClick={() => {
                  setActiveTab('clients');
                  setMobileMenuOpen(false);
                }}
              >
                <Users className="w-4 h-4 mr-2" />
                Klanten
              </Button>
              <Button
                variant={activeTab === 'orders' ? 'default' : 'ghost'}
                className="justify-start"
                onClick={() => {
                  setActiveTab('orders');
                  setMobileMenuOpen(false);
                }}
              >
                <Package className="w-4 h-4 mr-2" />
                Opdrachten
              </Button>
            </div>
          </div>
        )}
        
        {/* Desktop Tabs */}
        <div className="hidden md:flex gap-2 px-6 pb-4">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('overview')}
          >
            <Activity className="w-4 h-4 mr-2" />
            Overzicht
          </Button>
          <Button
            variant={activeTab === 'clients' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('clients')}
          >
            <Users className="w-4 h-4 mr-2" />
            Klanten ({clients.length})
          </Button>
          <Button
            variant={activeTab === 'orders' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('orders')}
          >
            <Package className="w-4 h-4 mr-2" />
            Opdrachten ({orders.length})
          </Button>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Totaal Klanten</p>
                      <p className="text-2xl md:text-3xl font-bold text-white">
                        {stats?.totalClients ?? 0}
                      </p>
                    </div>
                    <Users className="w-8 h-8 md:w-10 md:h-10 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Actieve Klanten</p>
                      <p className="text-2xl md:text-3xl font-bold text-green-400">
                        {stats?.activeClients ?? 0}
                      </p>
                    </div>
                    <UserCheck className="w-8 h-8 md:w-10 md:h-10 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Credits Gebruikt</p>
                      <p className="text-2xl md:text-3xl font-bold text-blue-400">
                        {(stats?.credits?.totalUsed ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <CreditCard className="w-8 h-8 md:w-10 md:h-10 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Totale Omzet</p>
                      <p className="text-2xl md:text-3xl font-bold text-yellow-400">
                        €{(stats?.revenue?.total ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 md:w-10 md:h-10 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Snelle Acties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/admin/clients">
                    <Button className="w-full justify-between bg-blue-600 hover:bg-blue-700">
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        Beheer Klanten
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/admin/orders">
                    <Button className="w-full justify-between bg-blue-600 hover:bg-blue-700">
                      <span className="flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        Beheer Opdrachten
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Abonnementen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {stats?.subscriptions && Object.keys(stats.subscriptions).length > 0 ? (
                    Object.entries(stats.subscriptions).map(([plan, count]) => (
                      <div key={plan} className="flex justify-between items-center">
                        <span className="text-gray-400 capitalize">{plan}</span>
                        <Badge className="bg-blue-500/20 text-blue-300">{count}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Geen abonnementen</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Recente Activiteit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                    stats.recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-gray-950">
                        <Activity className="w-4 h-4 text-blue-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{activity?.clientName ?? 'Onbekend'}</p>
                          <p className="text-xs text-gray-500 truncate">{activity?.clientEmail ?? ''}</p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {activity?.timestamp ? new Date(activity.timestamp).toLocaleDateString('nl-NL') : ''}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Geen recente activiteit</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Zoek klanten..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-800"
                />
              </div>
              <Link href="/superadmin/clients">
                <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                  Alle Klanten
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredClients.map((client) => (
                <Card key={client.id} className="bg-gray-900 border-gray-800 hover:border-blue-500/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-300 font-bold">
                              {client.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white truncate">{client.name}</h3>
                            <p className="text-sm text-gray-400 truncate">{client.email}</p>
                            {client.companyName && (
                              <p className="text-xs text-gray-500 truncate">{client.companyName}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 items-center">
                        <div className="flex flex-col items-end">
                          <Badge className={
                            client.subscriptionStatus === 'active'
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-gray-500/20 text-gray-400'
                          }>
                            {client.subscriptionStatus}
                          </Badge>
                          <span className="text-xs text-gray-500 mt-1">
                            {client.subscriptionPlan}
                          </span>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">
                            {client.isUnlimited ? '∞' : 
                              (client.subscriptionCredits + client.topUpCredits).toLocaleString()
                            }
                          </p>
                          <p className="text-xs text-gray-500">credits</p>
                        </div>
                        
                        <Link href={`/superadmin/clients/${client.id}`}>
                          <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 mt-3 pt-3 border-t border-gray-800">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Content</p>
                        <p className="text-sm font-bold text-white">{client._count.savedContent}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Projecten</p>
                        <p className="text-sm font-bold text-white">{client._count.projects}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Gebruikt</p>
                        <p className="text-sm font-bold text-white">
                          {client.totalCreditsUsed.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Zoek opdrachten..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-800"
                />
              </div>
              <Link href="/admin/orders">
                <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                  Alle Opdrachten
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="bg-gray-900 border-gray-800 hover:border-blue-500/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white truncate">{order.title}</h3>
                        <p className="text-sm text-gray-400 truncate">{order.client.name}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge className="bg-blue-500/20 text-blue-300 text-xs">
                            {order.category}
                          </Badge>
                          <Badge className={
                            order.status === 'done'
                              ? 'bg-green-500/20 text-green-300'
                              : order.status === 'open'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-yellow-500/20 text-yellow-300'
                          }>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('nl-NL')}
                        </span>
                        <Link href="/admin/orders">
                          <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
