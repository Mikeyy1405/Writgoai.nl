'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function BankPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/inloggen');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'admin' && session?.user?.email !== 'info@writgo.nl') {
        router.push('/client-portal');
      } else {
        fetchBankData();
      }
    }
  }, [status, session, router]);

  const fetchBankData = async () => {
    try {
      const res = await fetch('/api/financien/bank');
      if (res.ok) {
        const json = await res.json();
        setAccounts(json.accounts || []);
        setTransactions(json.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching bank data:', error);
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

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/financien" className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Bank</h1>
            <p className="text-zinc-400 mt-1">Bankrekeningen en transacties</p>
          </div>
        </div>

        {/* Bank Accounts */}
        <h2 className="text-xl font-semibold mb-4">Bankrekeningen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {accounts.length > 0 ? (
            accounts.map((account) => (
              <div key={account.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <p className="text-zinc-400 text-sm">{account.name}</p>
                <p className="text-2xl font-bold mt-1">€{parseFloat(account.balance || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</p>
                <p className="text-zinc-500 text-xs mt-2">{account.account_number}</p>
              </div>
            ))
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <p className="text-zinc-400 text-sm">Totaal saldo</p>
              <p className="text-2xl font-bold mt-1">€{totalBalance.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</p>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <h2 className="text-xl font-semibold mb-4">Recente transacties</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-800">
              <tr>
                <th className="text-left p-4 text-zinc-400 font-medium">Datum</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Omschrijving</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Rekening</th>
                <th className="text-right p-4 text-zinc-400 font-medium">Bedrag</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-t border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                    <td className="p-4 text-zinc-400">{transaction.date}</td>
                    <td className="p-4">{transaction.message || transaction.description || '-'}</td>
                    <td className="p-4 text-zinc-400">{transaction.account_name || '-'}</td>
                    <td className={`p-4 text-right font-medium ${
                      parseFloat(transaction.amount) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {parseFloat(transaction.amount) >= 0 ? '+' : ''}€{Math.abs(parseFloat(transaction.amount || 0)).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">
                    Geen transacties gevonden. Sync met Moneybird om transacties op te halen.
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
