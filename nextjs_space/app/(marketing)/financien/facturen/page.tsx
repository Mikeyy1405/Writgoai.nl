'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Receipt, Search, Plus, Send, CheckCircle, ArrowLeft, Filter, Download } from 'lucide-react';
import toast from 'react-hot-toast';

function FacturenContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stateFilter, setStateFilter] = useState(searchParams.get('state') || 'all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchInvoices();
    }
  }, [status, session, stateFilter]);

  const fetchInvoices = async () => {
    try {
      const url =
        stateFilter && stateFilter !== 'all'
          ? `/api/financien/facturen?state=${stateFilter}`
          : '/api/financien/facturen';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch invoices');
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Kon facturen niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async (invoiceId: string, email: string) => {
    const toastId = toast.loading('Factuur versturen...');
    try {
      const res = await fetch(`/api/financien/facturen/${invoiceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          delivery_method: 'Email',
          email_address: email,
        }),
      });

      if (!res.ok) throw new Error('Failed to send invoice');
      toast.success('Factuur verstuurd', { id: toastId });
      fetchInvoices();
    } catch (error) {
      toast.error('Versturen mislukt', { id: toastId });
    }
  };

  const handleRegisterPayment = async (invoiceId: string, amount: string) => {
    const toastId = toast.loading('Betaling registreren...');
    try {
      const res = await fetch(`/api/financien/facturen/${invoiceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register_payment',
          amount,
          payment_date: new Date().toISOString().split('T')[0],
        }),
      });

      if (!res.ok) throw new Error('Failed to register payment');
      toast.success('Betaling geregistreerd', { id: toastId });
      fetchInvoices();
    } catch (error) {
      toast.error('Registratie mislukt', { id: toastId });
    }
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'paid':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'draft':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'open':
      case 'pending_payment':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'late':
      case 'reminded':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (state: string) => {
    const labels: { [key: string]: string } = {
      draft: 'Concept',
      open: 'Open',
      pending_payment: 'Wacht op betaling',
      late: 'Te laat',
      reminded: 'Herinnering verstuurd',
      paid: 'Betaald',
      scheduled: 'Ingepland',
      uncollectible: 'Oninbaar',
    };
    return labels[state] || state;
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
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/financien"
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Receipt className="w-8 h-8 text-[#ff6b35]" />
              Verkoopfacturen
            </h1>
            <p className="text-gray-400 mt-1">
              Beheer en verstuur facturen via Moneybird
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setStateFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              stateFilter === 'all'
                ? 'bg-[#ff6b35] text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Alle
          </button>
          <button
            onClick={() => setStateFilter('draft')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              stateFilter === 'draft'
                ? 'bg-[#ff6b35] text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Concepten
          </button>
          <button
            onClick={() => setStateFilter('open')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              stateFilter === 'open'
                ? 'bg-[#ff6b35] text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setStateFilter('paid')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              stateFilter === 'paid'
                ? 'bg-[#ff6b35] text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Betaald
          </button>
          <button
            onClick={() => setStateFilter('late')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              stateFilter === 'late'
                ? 'bg-[#ff6b35] text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Te laat
          </button>
        </div>

        {/* Invoices Table */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Factuurnummer
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Klant
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{invoice.invoice_id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-300">{invoice.contact?.company_name || 'Onbekend'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-300 text-sm">
                        {invoice.invoice_date
                          ? new Date(invoice.invoice_date).toLocaleDateString('nl-NL')
                          : '-'}
                      </p>
                      {invoice.due_date && (
                        <p className="text-gray-500 text-xs">
                          Vervalt: {new Date(invoice.due_date).toLocaleDateString('nl-NL')}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-semibold">
                        €{parseFloat(invoice.total_price_incl_tax || '0').toFixed(2)}
                      </p>
                      {invoice.total_unpaid && parseFloat(invoice.total_unpaid) > 0 && (
                        <p className="text-gray-400 text-xs">
                          Openstaand: €{parseFloat(invoice.total_unpaid).toFixed(2)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(
                          invoice.state
                        )}`}
                      >
                        {getStatusLabel(invoice.state)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {invoice.url && (
                          <a
                            href={invoice.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#ff6b35] hover:text-[#ff8555] text-sm"
                          >
                            Bekijk
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invoices.length === 0 && (
            <div className="p-12 text-center">
              <Receipt className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Geen facturen gevonden</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FacturenPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="animate-pulse space-y-6 max-w-7xl mx-auto">
          <div className="h-12 bg-white/10 rounded w-1/3"></div>
          <div className="h-96 bg-white/10 rounded-xl"></div>
        </div>
      </div>
    }>
      <FacturenContent />
    </React.Suspense>
  );
}
