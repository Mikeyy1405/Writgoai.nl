'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function BTWPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [btwData, setBtwData] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/inloggen');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'admin' && session?.user?.email !== 'info@writgo.nl') {
        router.push('/client-portal');
      } else {
        fetchBTWData();
      }
    }
  }, [status, session, router]);

  const fetchBTWData = async () => {
    try {
      const res = await fetch('/api/financien/btw');
      if (res.ok) {
        const json = await res.json();
        setBtwData(json);
      }
    } catch (error) {
      console.error('Error fetching BTW data:', error);
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

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/financien" className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">BTW Overzicht</h1>
            <p className="text-zinc-400 mt-1">BTW berekeningen en aangiften</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <p className="text-zinc-400 text-sm">BTW te betalen</p>
            <p className="text-2xl font-bold mt-1 text-red-400">
              €{(btwData?.toBePaid || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <p className="text-zinc-400 text-sm">BTW te vorderen</p>
            <p className="text-2xl font-bold mt-1 text-green-400">
              €{(btwData?.toReceive || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <p className="text-zinc-400 text-sm">Netto te betalen</p>
            <p className="text-2xl font-bold mt-1">
              €{((btwData?.toBePaid || 0) - (btwData?.toReceive || 0)).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* BTW Rates */}
        <h2 className="text-xl font-semibold mb-4">BTW Tarieven</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-6">
          <table className="w-full">
            <thead className="bg-zinc-800">
              <tr>
                <th className="text-left p-4 text-zinc-400 font-medium">Tarief</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Percentage</th>
                <th className="text-right p-4 text-zinc-400 font-medium">Omzet</th>
                <th className="text-right p-4 text-zinc-400 font-medium">BTW Bedrag</th>
              </tr>
            </thead>
            <tbody>
              {btwData?.rates && btwData.rates.length > 0 ? (
                btwData.rates.map((rate: any, idx: number) => (
                  <tr key={idx} className="border-t border-zinc-800">
                    <td className="p-4">{rate.name}</td>
                    <td className="p-4 text-zinc-400">{rate.percentage}%</td>
                    <td className="p-4 text-right">€{(rate.revenue || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</td>
                    <td className="p-4 text-right font-medium">€{(rate.amount || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">
                    Geen BTW gegevens beschikbaar. Sync met Moneybird om BTW gegevens op te halen.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Transactions */}
        <h2 className="text-xl font-semibold mb-4">Recente BTW Transacties</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-800">
              <tr>
                <th className="text-left p-4 text-zinc-400 font-medium">Datum</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Type</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Beschrijving</th>
                <th className="text-right p-4 text-zinc-400 font-medium">BTW Bedrag</th>
              </tr>
            </thead>
            <tbody>
              {btwData?.transactions && btwData.transactions.length > 0 ? (
                btwData.transactions.map((transaction: any) => (
                  <tr key={transaction.id} className="border-t border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                    <td className="p-4 text-zinc-400">{transaction.date}</td>
                    <td className="p-4">{transaction.type}</td>
                    <td className="p-4 text-zinc-400">{transaction.description}</td>
                    <td className="p-4 text-right font-medium">€{(transaction.vat_amount || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">
                    Geen BTW transacties gevonden.
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
