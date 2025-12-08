'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Landmark, ArrowLeft, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BankPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchBankData();
    }
  }, [status, session]);

  const fetchBankData = async (accountId?: string) => {
    try {
      const url = accountId
        ? `/api/financien/bank?accountId=${accountId}`
        : '/api/financien/bank';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch bank data');
      const data = await res.json();
      setAccounts(data.accounts || []);
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching bank data:', error);
      toast.error('Kon bankgegevens niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    const toastId = toast.loading('Synchroniseren...');
    try {
      const res = await fetch('/api/financien/bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      });

      if (!res.ok) throw new Error('Sync failed');
      const data = await res.json();
      toast.success(`${data.synced} transacties gesynchroniseerd`, { id: toastId });
      fetchBankData(selectedAccount || undefined);
    } catch (error) {
      toast.error('Synchronisatie mislukt', { id: toastId });
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
            href="/financien"
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Landmark className="w-8 h-8 text-[#ff6b35]" />
              Banktransacties
            </h1>
            <p className="text-gray-400 mt-1">
              Bekijk en koppel transacties aan facturen
            </p>
          </div>
          <button
            onClick={handleSync}
            className="px-4 py-2 bg-[#ff6b35] hover:bg-[#ff8555] text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Synchroniseer
          </button>
        </div>

        {/* Bank Accounts */}
        {accounts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => {
                  setSelectedAccount(account.id);
                  fetchBankData(account.id);
                }}
                className={`p-4 rounded-xl border transition-colors text-left ${
                  selectedAccount === account.id
                    ? 'bg-[#ff6b35]/10 border-[#ff6b35]'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <p className="text-white font-semibold">{account.name}</p>
                {account.iban && (
                  <p className="text-gray-400 text-sm">{account.iban}</p>
                )}
                {account.balance && (
                  <p className="text-green-400 font-semibold mt-2">
                    €{parseFloat(account.balance).toFixed(2)}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Transactions */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Datum
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Omschrijving
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Tegenpartij
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
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-gray-300 text-sm">
                        {new Date(transaction.transactionDate).toLocaleDateString('nl-NL')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white">{transaction.description || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-300">{transaction.counterpartyName || '-'}</p>
                      {transaction.counterpartyAccount && (
                        <p className="text-gray-500 text-xs">{transaction.counterpartyAccount}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p
                        className={`font-semibold ${
                          transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        €{Math.abs(transaction.amount).toFixed(2)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          transaction.status === 'matched'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {transaction.status === 'matched' ? 'Gekoppeld' : 'Ongekoppeld'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {transactions.length === 0 && (
            <div className="p-12 text-center">
              <Landmark className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Geen transacties gevonden</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
