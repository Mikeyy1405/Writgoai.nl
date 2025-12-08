'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart3, Users, Receipt, Repeat, ShoppingCart, 
  Landmark, Calculator, FileBarChart, TrendingUp, 
  TrendingDown, AlertTriangle, RefreshCw, Euro
} from 'lucide-react';

export default function FinancienDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/inloggen');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'admin' && session?.user?.email !== 'info@writgo.nl') {
        router.push('/client-portal');
      } else {
        fetchDashboardData();
      }
    }
  }, [status, session, router]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/financien/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch('/api/financien/sync', { method: 'POST' });
      await fetchDashboardData();
    } finally {
      setSyncing(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6B35]"></div>
      </div>
    );
  }

  const menuItems = [
    { label: 'Contacten', href: '/financien/contacten', icon: Users, description: 'Klanten beheren' },
    { label: 'Facturen', href: '/financien/facturen', icon: Receipt, description: 'Verkoopfacturen' },
    { label: 'Abonnementen', href: '/financien/abonnementen', icon: Repeat, description: 'Recurring billing' },
    { label: 'Uitgaven', href: '/financien/uitgaven', icon: ShoppingCart, description: 'Inkoopfacturen' },
    { label: 'Bank', href: '/financien/bank', icon: Landmark, description: 'Transacties' },
    { label: 'BTW', href: '/financien/btw', icon: Calculator, description: 'BTW overzicht' },
    { label: 'Rapporten', href: '/financien/rapporten', icon: FileBarChart, description: 'Financiële rapporten' },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Financieel Dashboard</h1>
            <p className="text-zinc-400 mt-1">Moneybird Integratie</p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] hover:bg-[#FF6B35]/80 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Synchroniseren...' : 'Sync met Moneybird'}
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">MRR</p>
                <p className="text-2xl font-bold mt-1">€{data?.mrr?.toLocaleString() || '0'}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">ARR</p>
                <p className="text-2xl font-bold mt-1">€{data?.arr?.toLocaleString() || '0'}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Euro className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Openstaand</p>
                <p className="text-2xl font-bold mt-1">€{data?.outstanding?.toLocaleString() || '0'}</p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Receipt className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Te Laat</p>
                <p className="text-2xl font-bold mt-1">{data?.lateInvoices || 0}</p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <h2 className="text-xl font-semibold mb-4">Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-[#FF6B35]/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#FF6B35]/20 rounded-lg group-hover:bg-[#FF6B35]/30 transition-colors">
                  <item.icon className="w-6 h-6 text-[#FF6B35]" />
                </div>
                <div>
                  <h3 className="font-semibold">{item.label}</h3>
                  <p className="text-zinc-400 text-sm">{item.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Invoices */}
        <h2 className="text-xl font-semibold mb-4">Recente Facturen</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-800">
              <tr>
                <th className="text-left p-4 text-zinc-400 font-medium">Factuur</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Klant</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Bedrag</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Status</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Datum</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentInvoices?.length > 0 ? (
                data.recentInvoices.map((invoice: any) => (
                  <tr key={invoice.id} className="border-t border-zinc-800">
                    <td className="p-4">{invoice.invoice_id || invoice.id}</td>
                    <td className="p-4">{invoice.contact_name || '-'}</td>
                    <td className="p-4">€{invoice.total_price_incl_tax || '0'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        invoice.state === 'paid' ? 'bg-green-500/20 text-green-400' :
                        invoice.state === 'late' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {invoice.state}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400">{invoice.invoice_date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    Geen facturen gevonden. Klik op "Sync met Moneybird" om data op te halen.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
