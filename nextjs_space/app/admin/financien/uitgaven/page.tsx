'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, ArrowLeft, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UitgavenPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'admin') {
      router.push('/admin');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchExpenses();
    }
  }, [status, session]);

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/financien/uitgaven');
      if (!res.ok) throw new Error('Failed to fetch expenses');
      const data = await res.json();
      setExpenses(data.expenses || []);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Kon uitgaven niet laden');
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="animate-pulse space-y-6 max-w-7xl mx-auto">
          <div className="h-12 bg-white/10 rounded w-1/3"></div>
          <div className="h-96 bg-white/10 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin/financien"
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-[#ff6b35]" />
              Uitgaven & Inkoopfacturen
            </h1>
            <p className="text-gray-400 mt-1">
              Registreer en categoriseer bedrijfskosten
            </p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Leverancier
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Categorie
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Datum
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Bedrag
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{expense.supplierName}</p>
                      <p className="text-gray-400 text-sm">{expense.invoiceNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-300">{expense.category || 'Geen categorie'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-300 text-sm">
                        {new Date(expense.invoiceDate).toLocaleDateString('nl-NL')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-semibold">€{expense.total.toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          expense.status === 'paid'
                            ? 'bg-green-500/20 text-green-400'
                            : expense.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {expense.status === 'paid' ? 'Betaald' : expense.status === 'pending' ? 'In behandeling' : expense.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {expenses.length === 0 && (
            <div className="p-12 text-center">
              <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Geen uitgaven gevonden</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
