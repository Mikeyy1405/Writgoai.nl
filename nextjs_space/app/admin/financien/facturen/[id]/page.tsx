'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Send,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  User,
  Mail,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface InvoiceDetail {
  description: string;
  price: string;
  amount: string;
  tax_rate_id?: string;
}

interface Invoice {
  id: string;
  contact_id: string;
  state: string;
  invoice_id: string;
  invoice_date: string;
  due_date: string;
  total_price_excl_tax: string;
  total_price_incl_tax: string;
  total_unpaid: string;
  details_attributes: InvoiceDetail[];
  notes?: string;
  url?: string;
}

export default function InvoiceDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [sendEmail, setSendEmail] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'admin') {
      router.push('/admin');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchInvoice();
    }
  }, [status, session, invoiceId]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/financien/facturen/${invoiceId}`);
      if (!res.ok) throw new Error('Failed to fetch invoice');
      const data = await res.json();
      setInvoice(data.invoice);
      setPaymentAmount(data.invoice.total_unpaid);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Kon factuur niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!sendEmail) {
      toast.error('Vul een email adres in');
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/financien/facturen/${invoiceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          delivery_method: 'Email',
          email_address: sendEmail,
        }),
      });

      if (!res.ok) throw new Error('Failed to send invoice');

      toast.success('Factuur verstuurd');
      setShowSendModal(false);
      fetchInvoice();
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Kon factuur niet versturen');
    } finally {
      setSending(false);
    }
  };

  const handleRegisterPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Vul een geldig bedrag in');
      return;
    }

    setRegistering(true);
    try {
      const res = await fetch(`/api/financien/facturen/${invoiceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register_payment',
          amount: paymentAmount,
          payment_date: paymentDate,
        }),
      });

      if (!res.ok) throw new Error('Failed to register payment');

      toast.success('Betaling geregistreerd');
      setShowPaymentModal(false);
      fetchInvoice();
    } catch (error) {
      console.error('Error registering payment:', error);
      toast.error('Kon betaling niet registreren');
    } finally {
      setRegistering(false);
    }
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'paid':
        return 'bg-green-500/20 text-green-400';
      case 'open':
      case 'pending_payment':
        return 'bg-blue-500/20 text-blue-400';
      case 'late':
      case 'reminded':
        return 'bg-red-500/20 text-red-400';
      case 'draft':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (state: string) => {
    const texts: Record<string, string> = {
      draft: 'Concept',
      open: 'Open',
      pending_payment: 'In afwachting',
      late: 'Te laat',
      reminded: 'Herinnerd',
      paid: 'Betaald',
      uncollectible: 'Oninbaar',
    };
    return texts[state] || state;
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="animate-pulse space-y-6 max-w-4xl mx-auto">
          <div className="h-12 bg-white/10 rounded w-1/3"></div>
          <div className="h-96 bg-white/10 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-400">Factuur niet gevonden</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin/financien/facturen"
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-[#ff6b35]" />
              Factuur {invoice.invoice_id}
            </h1>
            <p className="text-gray-400 mt-1">Factuur details uit Moneybird</p>
          </div>
          <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getStatusColor(invoice.state)}`}>
            {getStatusText(invoice.state)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          {invoice.state !== 'paid' && (
            <>
              {invoice.state === 'draft' && (
                <button
                  onClick={() => setShowSendModal(true)}
                  className="px-4 py-2 bg-[#ff6b35] hover:bg-[#ff8555] text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Versturen
                </button>
              )}
              {invoice.state !== 'draft' && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Betaling Registreren
                </button>
              )}
            </>
          )}
          {invoice.url && (
            <a
              href={invoice.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Bekijk in Moneybird
            </a>
          )}
        </div>

        {/* Invoice Details */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">Factuurdatum</p>
              <p className="text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#ff6b35]" />
                {new Date(invoice.invoice_date).toLocaleDateString('nl-NL')}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Vervaldatum</p>
              <p className="text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#ff6b35]" />
                {new Date(invoice.due_date).toLocaleDateString('nl-NL')}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Contact ID</p>
              <p className="text-white flex items-center gap-2">
                <User className="w-4 h-4 text-[#ff6b35]" />
                {invoice.contact_id}
              </p>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Factuurregels</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      Beschrijving
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">
                      Aantal
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">
                      Prijs
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">
                      Totaal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {invoice.details_attributes.map((detail, index) => {
                    const total = parseFloat(detail.price) * parseFloat(detail.amount);
                    return (
                      <tr key={index}>
                        <td className="px-4 py-3 text-white">{detail.description}</td>
                        <td className="px-4 py-3 text-right text-white">{detail.amount}</td>
                        <td className="px-4 py-3 text-right text-white">
                          €{parseFloat(detail.price).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-white">
                          €{total.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-white/10 pt-4">
            <div className="space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotaal (excl. BTW)</span>
                <span className="text-white">
                  €{parseFloat(invoice.total_price_excl_tax).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span className="text-white">Totaal (incl. BTW)</span>
                <span className="text-[#ff6b35]">
                  €{parseFloat(invoice.total_price_incl_tax).toFixed(2)}
                </span>
              </div>
              {invoice.state !== 'paid' && parseFloat(invoice.total_unpaid) > 0 && (
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-orange-400">Openstaand</span>
                  <span className="text-orange-400">
                    €{parseFloat(invoice.total_unpaid).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Notities</h2>
              <p className="text-gray-300">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">Factuur Versturen</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Email Adres</label>
                <input
                  type="email"
                  value={sendEmail}
                  onChange={(e) => setSendEmail(e.target.value)}
                  placeholder="klant@voorbeeld.nl"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff6b35]"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSendInvoice}
                  disabled={sending}
                  className="flex-1 px-4 py-2 bg-[#ff6b35] hover:bg-[#ff8555] text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {sending ? 'Versturen...' : 'Versturen'}
                </button>
                <button
                  onClick={() => setShowSendModal(false)}
                  disabled={sending}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">Betaling Registreren</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Bedrag</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35]"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Betalingsdatum</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35]"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRegisterPayment}
                  disabled={registering}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {registering ? 'Registreren...' : 'Registreren'}
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  disabled={registering}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
