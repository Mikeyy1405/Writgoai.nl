'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function UitgavenPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/inloggen');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'admin' && session?.user?.email !== 'info@writgo.nl') {
        router.push('/client-portal');
      } else {
        fetchExpenses();
      }
    }
  }, [status, session, router]);

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/financien/uitgaven');
      if (res.ok) {
        const json = await res.json();
        setExpenses(json.expenses || []);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
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

  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.total_price_incl_tax || 0), 0);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/financien" className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Uitgaven</h1>
            <p className="text-zinc-400 mt-1">Inkoopfacturen en uitgaven</p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <p className="text-zinc-400 text-sm">Totale uitgaven</p>
          <p className="text-3xl font-bold mt-1">€{totalExpenses.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</p>
        </div>

        {/* Expenses Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-800">
              <tr>
                <th className="text-left p-4 text-zinc-400 font-medium">Referentie</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Leverancier</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Datum</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Bedrag</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length > 0 ? (
                expenses.map((expense) => (
                  <tr key={expense.id} className="border-t border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                    <td className="p-4 font-mono">{expense.reference || expense.id}</td>
                    <td className="p-4">{expense.contact?.company_name || expense.contact_name || '-'}</td>
                    <td className="p-4 text-zinc-400">{expense.date}</td>
                    <td className="p-4 font-medium">€{parseFloat(expense.total_price_incl_tax || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        expense.state === 'paid' ? 'bg-green-500/20 text-green-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {expense.state || 'open'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    Geen uitgaven gevonden. Sync met Moneybird om uitgaven op te halen.
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
