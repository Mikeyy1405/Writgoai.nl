'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ClipboardList,
  User,
  Calendar,
  Euro,
  Clock,
  Loader2,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

const typeOptions = [
  { value: 'blog', label: '📝 Blog/Content', desc: 'Artikelen, blogs, SEO content' },
  { value: 'video', label: '🎬 Video', desc: 'Video productie en editing' },
  { value: 'chatbot', label: '🤖 Chatbot', desc: 'AI chatbot ontwikkeling' },
  { value: 'automation', label: '⚙️ Automatisering', desc: 'Workflows en automatisering' },
  { value: 'website', label: '🌐 Website', desc: 'Website ontwikkeling' },
  { value: 'design', label: '🎨 Design', desc: 'Grafisch ontwerp' },
  { value: 'custom', label: '📋 Custom', desc: 'Overige AI diensten' },
];

const priorityOptions = [
  { value: 'low', label: 'Laag', color: 'text-gray-400' },
  { value: 'normal', label: 'Normaal', color: 'text-blue-400' },
  { value: 'high', label: 'Hoog', color: 'text-orange-400' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-400' },
];

interface Client {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
}

export default function NewAssignmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    clientId: '',
    title: '',
    description: '',
    type: 'blog',
    priority: 'normal',
    deadline: '',
    estimatedHours: '',
    budget: '',
    notes: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/agency/clients');
      const data = await res.json();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/agency/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Opdracht aangemaakt!');
        router.push('/admin/assignments');
      } else {
        toast.error(data.error || 'Kon opdracht niet aanmaken');
      }
    } catch (error) {
      toast.error('Er ging iets mis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/assignments"
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-yellow-400" />
              Nieuwe Opdracht
            </h1>
            <p className="text-gray-400">Maak een nieuwe opdracht voor een klant</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <User className="w-4 h-4" />
              Klant *
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
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
          </div>

          {/* Type Selection */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <FileText className="w-4 h-4" />
              Type Opdracht *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {typeOptions.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    formData.type === type.value
                      ? 'bg-blue-500/20 border-blue-500/50 text-white'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <span className="text-2xl block mb-1">{type.label.split(' ')[0]}</span>
                  <span className="text-sm font-medium">{type.label.split(' ').slice(1).join(' ')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title & Description */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Titel *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="Bijv. SEO blog artikelen schrijven"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Beschrijving *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Gedetailleerde beschrijving van de opdracht..."
              />
            </div>
          </div>

          {/* Priority, Deadline, Budget */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Priority */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  Prioriteit
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  {priorityOptions.map(p => (
                    <option key={p.value} value={p.value} className="bg-[#1a1a1a]">
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deadline */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Calendar className="w-4 h-4" />
                  Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Budget */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Euro className="w-4 h-4" />
                  Budget
                </label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <label className="text-sm font-medium text-gray-300 mb-2 block">Notities (intern)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Interne notities over deze opdracht..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Link
              href="/admin/assignments"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Annuleren
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Opdracht Aanmaken
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
