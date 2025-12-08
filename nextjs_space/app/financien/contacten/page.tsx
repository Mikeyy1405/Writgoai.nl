'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Plus } from 'lucide-react';

export default function ContactenPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/inloggen');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'admin' && session?.user?.email !== 'info@writgo.nl') {
        router.push('/client-portal');
      } else {
        fetchContacts();
      }
    }
  }, [status, session, router]);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/financien/contacten');
      if (res.ok) {
        const json = await res.json();
        setContacts(json.contacts || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
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

  const filteredContacts = contacts.filter(contact => 
    contact.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/financien" className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Contacten</h1>
            <p className="text-zinc-400 mt-1">Klanten en contactpersonen beheren</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Zoek op naam of email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B35]"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] hover:bg-[#FF6B35]/80 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            Nieuw Contact
          </button>
        </div>

        {/* Contacts Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-800">
              <tr>
                <th className="text-left p-4 text-zinc-400 font-medium">Bedrijf</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Naam</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Email</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Telefoon</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Klant ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="border-t border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                    <td className="p-4">{contact.company_name || '-'}</td>
                    <td className="p-4">{contact.firstname} {contact.lastname}</td>
                    <td className="p-4 text-zinc-400">{contact.email || '-'}</td>
                    <td className="p-4 text-zinc-400">{contact.phone || '-'}</td>
                    <td className="p-4 text-zinc-400">{contact.customer_id || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    {searchTerm ? 'Geen contacten gevonden met deze zoekopdracht.' : 'Geen contacten gevonden. Sync met Moneybird om contacten op te halen.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-4 text-sm text-zinc-400">
          {filteredContacts.length} van {contacts.length} contacten
        </div>
      </div>
    </div>
  );
}
