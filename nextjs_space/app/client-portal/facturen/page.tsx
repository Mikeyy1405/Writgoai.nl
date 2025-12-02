'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Euro,
  Download,
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string | null;
  paidAt: string | null;
  subtotal: number;
  taxAmount: number;
  total: number;
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

export default function ClientInvoicesPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/inloggen');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchInvoices();
    }
  }, [status]);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/client/invoices');
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500/20 text-gray-400';
      case 'sent': return 'bg-blue-500/20 text-blue-400';
      case 'paid': return 'bg-green-500/20 text-green-400';
      case 'overdue': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Concept';
      case 'sent': return 'Openstaand';
      case 'paid': return 'Betaald';
      case 'overdue': return 'Verlopen';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'sent': return <Clock className="w-4 h-4" />;
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Calculate totals
  const totalUnpaid = invoices
    .filter(i => ['sent', 'overdue'].includes(i.status))
    .reduce((sum, i) => sum + i.total, 0);

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-white/10 rounded w-1/3"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-white/10 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/client-portal"
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-green-400" />
            Mijn Facturen
          </h1>
          <p className="text-gray-400">Overzicht van al je facturen</p>
        </div>
      </div>

      {/* Summary */}
      {totalUnpaid > 0 && (
        <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-300 text-sm">Openstaand Bedrag</p>
              <p className="text-2xl font-bold text-white">
                €{totalUnpaid.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      )}

      {/* Invoices List */}
      <div className="space-y-4">
        {invoices.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Geen facturen gevonden</p>
          </div>
        ) : (
          invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
            >
              <div
                className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedId(expandedId === invoice.id ? null : invoice.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{invoice.invoiceNumber}</h3>
                      <p className="text-gray-400 text-sm">
                        {new Date(invoice.issueDate).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">
                        €{invoice.total.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500">incl. BTW</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </div>
                </div>

                {invoice.dueDate && invoice.status !== 'paid' && (
                  <div className="mt-3 text-sm text-gray-400 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Vervaldatum: {new Date(invoice.dueDate).toLocaleDateString('nl-NL')}
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {expandedId === invoice.id && (
                <div className="border-t border-white/10 p-6 bg-white/5">
                  <h4 className="text-sm font-medium text-gray-400 mb-4">Factuur Items</h4>
                  <div className="space-y-3">
                    {invoice.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div>
                          <p className="text-white">{item.description}</p>
                          <p className="text-sm text-gray-500">
                            {item.quantity}x €{item.unitPrice.toFixed(2)}
                          </p>
                        </div>
                        <p className="text-white font-medium">
                          €{item.total.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotaal</span>
                      <span>€{invoice.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>BTW (21%)</span>
                      <span>€{invoice.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/10">
                      <span>Totaal</span>
                      <span>€{invoice.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {invoice.paidAt && (
                    <p className="mt-4 text-sm text-green-400 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Betaald op {new Date(invoice.paidAt).toLocaleDateString('nl-NL')}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
