'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  User,
  Plus,
  Trash2,
  Euro,
  Calendar,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Client {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
}

interface Assignment {
  id: string;
  title: string;
  type: string;
  finalPrice: number | null;
  budget: number | null;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  assignmentId?: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientAssignments, setClientAssignments] = useState<Assignment[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0 }
  ]);
  const [taxRate, setTaxRate] = useState(21);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchClients();
    // Set default due date to 14 days from now
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 14);
    setDueDate(defaultDue.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchClientAssignments(selectedClient);
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/agency/clients');
      const data = await res.json();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchClientAssignments = async (clientId: string) => {
    try {
      const res = await fetch(`/api/admin/agency/assignments?clientId=${clientId}&status=completed`);
      const data = await res.json();
      setClientAssignments(data.assignments || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 }
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addAssignmentToInvoice = (assignment: Assignment) => {
    const price = assignment.finalPrice || assignment.budget || 0;
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: assignment.title,
        quantity: 1,
        unitPrice: price,
        assignmentId: assignment.id,
      }
    ]);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient) {
      toast.error('Selecteer een klant');
      return;
    }

    if (items.some(item => !item.description || item.unitPrice <= 0)) {
      toast.error('Vul alle items correct in');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/agency/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient,
          items: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            assignmentId: item.assignmentId,
          })),
          taxRate,
          dueDate,
          notes,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Factuur ${data.invoice.invoiceNumber} aangemaakt!`);
        router.push('/dashboard/agency/invoices');
      } else {
        toast.error(data.error || 'Kon factuur niet aanmaken');
      }
    } catch (error) {
      toast.error('Er ging iets mis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard/agency/invoices"
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-green-400" />
              Nieuwe Factuur
            </h1>
            <p className="text-gray-400">Maak een nieuwe factuur voor een klant</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <User className="w-4 h-4" />
              Klant *
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="" className="bg-[#1a1a1a]">Selecteer een klant...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id} className="bg-[#1a1a1a]">
                  {client.name} {client.companyName ? `(${client.companyName})` : ''}
                </option>
              ))}
            </select>

            {/* Quick add from completed assignments */}
            {clientAssignments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-gray-400 mb-2">Voltooide opdrachten toevoegen:</p>
                <div className="flex flex-wrap gap-2">
                  {clientAssignments.map(assignment => (
                    <button
                      key={assignment.id}
                      type="button"
                      onClick={() => addAssignmentToInvoice(assignment)}
                      className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm rounded-lg transition-colors"
                    >
                      + {assignment.title.substring(0, 30)}...
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Invoice Items */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Factuur Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Item Toevoegen
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="flex gap-4 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Beschrijving"
                      required
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="Aantal"
                      min="0.01"
                      step="0.01"
                      required
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="w-32">
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        placeholder="Prijs"
                        min="0"
                        step="0.01"
                        required
                        className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="w-28 text-right py-2">
                    <span className="text-white font-medium">
                      €{(item.quantity * item.unitPrice).toFixed(2)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotaal</span>
                    <span>€{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-400">
                    <span className="flex items-center gap-2">
                      BTW
                      <input
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none"
                      />
                      %
                    </span>
                    <span>€{taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/10">
                    <span>Totaal</span>
                    <span>€{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Calendar className="w-4 h-4" />
                  Vervaldatum
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Notities</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Optionele notities..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Link
              href="/dashboard/agency/invoices"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Annuleren
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Factuur Aanmaken
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
