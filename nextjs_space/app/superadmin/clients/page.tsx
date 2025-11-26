
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search, 
  Filter,
  Eye,
  CreditCard,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface Client {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
  subscriptionCredits: number;
  topUpCredits: number;
  totalCreditsUsed: number;
  isUnlimited: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    savedContent: number;
    projects: number;
  };
}

export default function SuperAdminClients() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    } else if (status === 'authenticated') {
      if (session?.user?.email !== 'info@writgo.nl') {
        router.push('/client-portal');
      } else {
        fetchClients();
      }
    }
  }, [status, session, router, page, search, statusFilter]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await fetch(`/api/superadmin/clients?${params}`);
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalCredits = (client: Client) => {
    return client.subscriptionCredits + client.topUpCredits;
  };

  const getStatusBadge = (status: string | null) => {
    if (status === 'active') {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Actief</Badge>;
    } else if (status === 'trialing') {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Trial</Badge>;
    } else if (status === 'canceled' || status === 'cancelled') {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Geannuleerd</Badge>;
    }
    return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">Geen</Badge>;
  };

  if (loading && clients.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/superadmin/dashboard">
                <Button variant="ghost" size="sm" className="hover:bg-white/10">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  Klanten Beheer
                </h1>
                <p className="text-sm text-gray-400 mt-1">{clients.length} van {totalPages * 20} klanten</p>
              </div>
            </div>
            <Link href="/client-portal">
              <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                Terug naar Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <Card className="bg-white/5 border-white/10">
          <div className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Zoek op naam, email of bedrijf..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => {
                    setStatusFilter('all');
                    setPage(1);
                  }}
                  className={statusFilter === 'all' ? 'bg-orange-500' : 'border-white/20'}
                >
                  Alle
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  onClick={() => {
                    setStatusFilter('active');
                    setPage(1);
                  }}
                  className={statusFilter === 'active' ? 'bg-green-500' : 'border-white/20'}
                >
                  Actief
                </Button>
                <Button
                  variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                  onClick={() => {
                    setStatusFilter('inactive');
                    setPage(1);
                  }}
                  className={statusFilter === 'inactive' ? 'bg-gray-500' : 'border-white/20'}
                >
                  Inactief
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Clients List */}
        <div className="space-y-3">
          {loading ? (
            <Card className="bg-white/5 border-white/10 p-8">
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            </Card>
          ) : clients.length === 0 ? (
            <Card className="bg-white/5 border-white/10 p-8">
              <p className="text-center text-gray-400">Geen klanten gevonden</p>
            </Card>
          ) : (
            clients.map((client) => (
              <Card
                key={client.id}
                className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Client Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                          <span className="text-lg font-bold text-white">
                            {client.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{client.name}</h3>
                          <p className="text-sm text-gray-400 truncate">{client.email}</p>
                          {client.companyName && (
                            <p className="text-xs text-gray-500 mt-1">{client.companyName}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:flex sm:gap-6 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-1">Credits</p>
                        <p className="text-lg font-bold text-green-400">
                          {client.isUnlimited ? '∞' : getTotalCredits(client).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-1">Gebruikt</p>
                        <p className="text-lg font-bold text-purple-400">
                          {Math.round(client.totalCreditsUsed).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-1">Content</p>
                        <p className="text-lg font-bold">{client._count.savedContent}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-1">Status</p>
                        {getStatusBadge(client.subscriptionStatus)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/10 sm:border-0">
                      <Link href={`/superadmin/clients/${client.id}`} className="flex-1 sm:flex-none">
                        <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                          <Eye className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Details</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card className="bg-white/5 border-white/10">
            <div className="p-4 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="border-white/20"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Vorige
              </Button>
              <span className="text-sm text-gray-400">
                Pagina {page} van {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="border-white/20"
              >
                Volgende
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
