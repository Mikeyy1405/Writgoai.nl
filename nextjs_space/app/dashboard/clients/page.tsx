
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search, 
  ArrowLeft,
  Crown,
  Mail,
  Phone,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

interface ClientSubscription {
  id: string;
  status: string;
  startDate: string;
  nextBillingDate: string | null;
  articlesUsed: number;
  reelsUsed: number;
  Package: {
    tier: string;
    displayName: string;
    monthlyPrice: number;
    serviceType: string;
  };
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  bufferConnected: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  ClientSubscription: ClientSubscription[];
  Task: { id: string; status: string }[];
}

export default function ClientsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'admin') {
      router.push('/client-portal');
    } else {
      fetchClients();
    }
  }, [status, session, router]);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/admin/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.companyName && client.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getActiveSubscription = (client: Client) => {
    return client.ClientSubscription.find(sub => sub.status === 'ACTIVE');
  };

  const getTaskStats = (client: Client) => {
    const total = client.Task.length;
    const completed = client.Task.filter(t => t.status === 'COMPLETED').length;
    const active = total - completed;
    return { total, completed, active };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[#FF6B35] mx-auto animate-spin" />
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-800">
      {/* Header */}
      <div className="bg-slate-900 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Terug
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-300 flex items-center gap-2">
                  <Users className="w-6 h-6 text-[#FF6B35]" />
                  Klanten Beheer
                </h1>
                <p className="text-gray-600">Overzicht van alle klanten en hun abonnementen</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totaal Klanten</CardTitle>
              <Users className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actieve Abonnementen</CardTitle>
              <Crown className="h-4 w-4 text-[#FF6B35]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clients.filter(c => getActiveSubscription(c)).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Buffer Verbonden</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clients.filter(c => c.bufferConnected).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Onboarding Voltooid</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clients.filter(c => c.onboardingCompleted).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Zoek op naam, email of bedrijf..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Clients List */}
        <div className="space-y-4">
          {filteredClients.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-600">
                  {searchTerm ? 'Geen klanten gevonden met deze zoekopdracht' : 'Nog geen klanten'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredClients.map((client) => {
              const subscription = getActiveSubscription(client);
              const taskStats = getTaskStats(client);

              return (
                <Card key={client.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-slate-300">{client.name}</h3>
                          {subscription && (
                            <Badge className="bg-[#FF6B35] text-white">
                              <Crown className="w-3 h-3 mr-1" />
                              {subscription.Package.tier}
                            </Badge>
                          )}
                          {client.bufferConnected && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Buffer OK
                            </Badge>
                          )}
                          {!client.onboardingCompleted && (
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              Onboarding incomplete
                            </Badge>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="w-4 h-4" />
                              {client.email}
                            </div>
                            {client.phone && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="w-4 h-4" />
                                {client.phone}
                              </div>
                            )}
                            {client.companyName && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Building2 className="w-4 h-4" />
                                {client.companyName}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              Klant sinds {new Date(client.createdAt).toLocaleDateString('nl-NL')}
                            </div>
                          </div>

                          <div className="space-y-2">
                            {subscription ? (
                              <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-200 rounded-lg p-3">
                                <div className="text-xs text-gray-600 mb-1">Actief Abonnement</div>
                                <div className="font-semibold text-slate-300">{subscription.Package.displayName}</div>
                                <div className="text-sm text-gray-600">€{subscription.Package.monthlyPrice}/maand</div>
                                <div className="text-xs text-gray-500 mt-2">
                                  Artikelen: {subscription.articlesUsed} gebruikt
                                </div>
                                {subscription.nextBillingDate && (
                                  <div className="text-xs text-gray-500">
                                    Volgende betaling: {new Date(subscription.nextBillingDate).toLocaleDateString('nl-NL')}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <XCircle className="w-4 h-4" />
                                  <span className="text-sm">Geen actief abonnement</span>
                                </div>
                              </div>
                            )}

                            <div className="text-xs text-gray-600">
                              Opdrachten: {taskStats.active} actief • {taskStats.completed} voltooid
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4">
                        <Link href={`/dashboard/clients/${client.id}`}>
                          <Button className="bg-[#0B3C5D] hover:bg-[#0B3C5D]/90">
                            Beheer
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
