'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Filter } from 'lucide-react';

export default function FacturenPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/inloggen');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'admin' && session?.user?.email !== 'info@writgo.nl') {
        router.push('/client-portal');
      } else {
        fetchInvoices();
      }
    }
  }, [status, session, router]);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/financien/facturen');
      if (res.ok) {
        const json = await res.json();
        setInvoices(json.invoices || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
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

  const filteredInvoices = filter === 'all' 
    ? invoices 
    : invoices.filter(inv => inv.state === filter);

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_price_incl_tax || 0), 0);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/financien" className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Facturen</h1>
            <p className="text-zinc-400 mt-1">Verkoopfacturen overzicht</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all' ? 'bg-[#FF6B35] text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            Alle ({invoices.length})
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'open' ? 'bg-[#FF6B35] text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            Open ({invoices.filter(i => i.state === 'open').length})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'paid' ? 'bg-[#FF6B35] text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            Betaald ({invoices.filter(i => i.state === 'paid').length})
          </button>
          <button
            onClick={() => setFilter('late')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'late' ? 'bg-[#FF6B35] text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            Te laat ({invoices.filter(i => i.state === 'late').length})
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400 text-sm">Totaal gefilterd</p>
            <p className="text-2xl font-bold mt-1">€{totalAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400 text-sm">Aantal facturen</p>
            <p className="text-2xl font-bold mt-1">{filteredInvoices.length}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400 text-sm">Gemiddeld bedrag</p>
            <p className="text-2xl font-bold mt-1">
              €{filteredInvoices.length > 0 ? (totalAmount / filteredInvoices.length).toLocaleString('nl-NL', { minimumFractionDigits: 2 }) : '0,00'}
            </p>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-800">
              <tr>
                <th className="text-left p-4 text-zinc-400 font-medium">Factuurnr</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Klant</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Datum</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Bedrag</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                    <td className="p-4 font-mono">{invoice.invoice_id}</td>
                    <td className="p-4">{invoice.contact?.company_name || invoice.contact_name || '-'}</td>
                    <td className="p-4 text-zinc-400">{invoice.invoice_date}</td>
                    <td className="p-4 font-medium">€{parseFloat(invoice.total_price_incl_tax || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        invoice.state === 'paid' ? 'bg-green-500/20 text-green-400' :
                        invoice.state === 'late' ? 'bg-red-500/20 text-red-400' :
                        invoice.state === 'open' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-zinc-700 text-zinc-400'
                      }`}>
                        {invoice.state}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    Geen facturen gevonden. Sync met Moneybird om facturen op te halen.
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
