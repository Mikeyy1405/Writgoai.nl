'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Search, Plus, Mail, Phone, Building, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactenPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'admin') {
      router.push('/admin');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchContacts();
    }
  }, [status, session]);

  const fetchContacts = async (search?: string) => {
    try {
      const url = search
        ? `/api/financien/contacten?search=${encodeURIComponent(search)}`
        : '/api/financien/contacten';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch contacts');
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Kon contacten niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContacts(searchTerm);
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
            href="/admin/financien"
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-[#ff6b35]" />
              Contacten & Klanten
            </h1>
            <p className="text-gray-400 mt-1">
              Beheer klanten en leveranciers in Moneybird
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#ff6b35] hover:bg-[#ff8555] text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nieuw Contact
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Zoek op naam, email of bedrijf..."
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff6b35]"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Zoeken
            </button>
          </form>
        </div>

        {/* Contacts Table */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Bedrijf / Naam
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Contactgegevens
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Locatie
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">
                          {contact.company_name || `${contact.firstname} ${contact.lastname}`}
                        </p>
                        {contact.customer_id && (
                          <p className="text-gray-400 text-sm">ID: {contact.customer_id}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {contact.email && (
                          <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <Mail className="w-4 h-4" />
                            {contact.email}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <Phone className="w-4 h-4" />
                            {contact.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-300 text-sm">
                        {contact.city && contact.country ? (
                          <p>
                            {contact.city}, {contact.country}
                          </p>
                        ) : (
                          <p className="text-gray-500">Geen locatie</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/financien/facturen?contactId=${contact.id}`}
                        className="text-[#ff6b35] hover:text-[#ff8555] text-sm"
                      >
                        Bekijk facturen
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {contacts.length === 0 && (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Geen contacten gevonden</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
