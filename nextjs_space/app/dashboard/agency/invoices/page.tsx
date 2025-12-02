'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Euro,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

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
  client: {
    id: string;
    name: string;
    email: string;
    companyName: string | null;
  };
  items: any[];
}

const statusOptions = [
  { value: 'all', label: 'Alle' },
  { value: 'draft', label: 'Concept' },
  { value: 'sent', label: 'Verzonden' },
  { value: 'paid', label: 'Betaald' },
  { value: 'overdue', label: 'Verlopen' },
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      
      const res = await fetch(`/api/admin/agency/invoices?${params}`);
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Kon facturen niet laden');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/agency/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success('Status bijgewerkt');
        fetchInvoices();
      } else {
        toast.error('Kon status niet bijwerken');
      }
    } catch (error) {
      toast.error('Er ging iets mis');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4 text-gray-400" />;
      case 'sent': return <Send className="w-4 h-4 text-blue-400" />;
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
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
      case 'sent': return 'Verzonden';
      case 'paid': return 'Betaald';
      case 'overdue': return 'Verlopen';
      default: return status;
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate totals
  const totalUnpaid = invoices
    .filter(i => ['sent', 'overdue'].includes(i.status))
    .reduce((sum, i) => sum + i.total, 0);
  const totalPaid = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.total, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-white/10 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-green-400" />
            Facturen
          </h1>
          <p className="text-gray-400 mt-1">{invoices.length} facturen in totaal</p>
        </div>
        <Link
          href="/dashboard/agency/invoices/new"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nieuwe Factuur
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Totaal Betaald</p>
          <p className="text-3xl font-bold text-green-400">€{totalPaid.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Openstaand</p>
          <p className="text-3xl font-bold text-orange-400">€{totalUnpaid.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Totaal</p>
          <p className="text-3xl font-bold text-white">€{(totalPaid + totalUnpaid).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Zoek op factuurnummer of klant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value} className="bg-[#1a1a1a]">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Geen facturen gevonden</p>
            <Link
              href="/dashboard/agency/invoices/new"
              className="inline-flex items-center gap-2 mt-4 text-green-400 hover:text-green-300"
            >
              <Plus className="w-4 h-4" />
              Maak eerste factuur
            </Link>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(invoice.status)}
                  <div>
                    <h3 className="text-lg font-semibold text-white">{invoice.invoiceNumber}</h3>
                    <p className="text-gray-400 text-sm">{invoice.client.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">
                      €{invoice.total.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">
                      excl. BTW: €{invoice.subtotal.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {getStatusLabel(invoice.status)}
                  </span>

                  <select
                    value={invoice.status}
                    onChange={(e) => updateStatus(invoice.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
                  >
                    <option value="draft" className="bg-[#1a1a1a]">Concept</option>
                    <option value="sent" className="bg-[#1a1a1a]">Verzonden</option>
                    <option value="paid" className="bg-[#1a1a1a]">Betaald</option>
                    <option value="overdue" className="bg-[#1a1a1a]">Verlopen</option>
                  </select>

                  <Link
                    href={`/dashboard/agency/invoices/${invoice.id}`}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Eye className="w-5 h-5 text-gray-400" />
                  </Link>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-6 mt-4 pt-4 border-t border-white/10 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Datum: {new Date(invoice.issueDate).toLocaleDateString('nl-NL')}
                </span>
                {invoice.dueDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Vervaldatum: {new Date(invoice.dueDate).toLocaleDateString('nl-NL')}
                  </span>
                )}
                <span>{invoice.items.length} items</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
