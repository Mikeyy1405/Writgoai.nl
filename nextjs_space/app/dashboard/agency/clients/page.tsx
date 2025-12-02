'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Mail,
  Globe,
  Building,
  FileText,
  ClipboardList,
  Trash2,
  Edit,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Client {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  website: string | null;
  createdAt: string;
  _count: {
    assignments: number;
    invoices: number;
    clientRequests: number;
    projects: number;
  };
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

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
      toast.error('Kon klanten niet laden');
    } finally {
      setLoading(false);
    }
  };

  const deleteClient = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze klant wilt verwijderen? Dit verwijdert ook alle opdrachten en facturen.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/agency/clients/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Klant verwijderd');
        fetchClients();
      } else {
        toast.error('Kon klant niet verwijderen');
      }
    } catch (error) {
      toast.error('Er ging iets mis');
    }
    setMenuOpen(null);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.companyName?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-white/10 rounded w-1/3"></div>
          <div className="h-12 bg-white/10 rounded"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white/10 rounded-xl"></div>
          ))}
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
            <Users className="w-8 h-8 text-blue-400" />
            Klanten
          </h1>
          <p className="text-gray-400 mt-1">{clients.length} klanten in totaal</p>
        </div>
        <Link
          href="/dashboard/agency/clients/new"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nieuwe Klant
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Zoek op naam, email of bedrijf..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Clients List */}
      <div className="space-y-4">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Geen klanten gevonden</p>
            <Link
              href="/dashboard/agency/clients/new"
              className="inline-flex items-center gap-2 mt-4 text-blue-400 hover:text-blue-300"
            >
              <Plus className="w-4 h-4" />
              Voeg eerste klant toe
            </Link>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{client.name}</h3>
                    {client.companyName && (
                      <span className="flex items-center gap-1 text-sm text-gray-400">
                        <Building className="w-4 h-4" />
                        {client.companyName}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {client.email}
                    </span>
                    {client.website && (
                      <a
                        href={client.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-blue-400"
                      >
                        <Globe className="w-4 h-4" />
                        {client.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === client.id ? null : client.id)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                  {menuOpen === client.id && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-10">
                      <Link
                        href={`/dashboard/agency/clients/${client.id}`}
                        className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white"
                      >
                        <Eye className="w-4 h-4" />
                        Bekijken
                      </Link>
                      <Link
                        href={`/dashboard/agency/clients/${client.id}/edit`}
                        className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white"
                      >
                        <Edit className="w-4 h-4" />
                        Bewerken
                      </Link>
                      <button
                        onClick={() => deleteClient(client.id)}
                        className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full"
                      >
                        <Trash2 className="w-4 h-4" />
                        Verwijderen
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-300">
                    <strong>{client._count.assignments}</strong> opdrachten
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">
                    <strong>{client._count.invoices}</strong> facturen
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Klant sinds {new Date(client.createdAt).toLocaleDateString('nl-NL')}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
