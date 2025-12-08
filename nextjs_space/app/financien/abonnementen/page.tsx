'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AbonnementenPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/inloggen');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'admin' && session?.user?.email !== 'info@writgo.nl') {
        router.push('/client-portal');
      } else {
        fetchSubscriptions();
      }
    }
  }, [status, session, router]);

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('/api/financien/abonnementen');
      if (res.ok) {
        const json = await res.json();
        setSubscriptions(json.subscriptions || []);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6B35]"></div>
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter(s => s.active);
  const totalMRR = activeSubscriptions.reduce((sum, s) => {
    const amount = parseFloat(s.total_price_excl_tax || 0);
    return sum + amount;
  }, 0);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/financien" className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Abonnementen</h1>
            <p className="text-zinc-400 mt-1">Recurring billing overzicht</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400 text-sm">Actieve abonnementen</p>
            <p className="text-2xl font-bold mt-1">{activeSubscriptions.length}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400 text-sm">Maandelijkse recurring</p>
            <p className="text-2xl font-bold mt-1">€{totalMRR.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400 text-sm">Jaarlijkse recurring</p>
            <p className="text-2xl font-bold mt-1">€{(totalMRR * 12).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-800">
              <tr>
                <th className="text-left p-4 text-zinc-400 font-medium">Klant</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Frequentie</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Bedrag</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Volgende factuur</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length > 0 ? (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-t border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                    <td className="p-4">{sub.contact?.company_name || '-'}</td>
                    <td className="p-4 text-zinc-400">{sub.frequency || 'Maandelijks'}</td>
                    <td className="p-4 font-medium">€{parseFloat(sub.total_price_excl_tax || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</td>
                    <td className="p-4 text-zinc-400">{sub.next_invoice_date || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        sub.active ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'
                      }`}>
                        {sub.active ? 'Actief' : 'Inactief'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    Geen abonnementen gevonden. Sync met Moneybird om abonnementen op te halen.
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
