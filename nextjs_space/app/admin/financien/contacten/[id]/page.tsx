'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  FileText,
  Save,
  Edit,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Contact {
  id: string;
  company_name?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  customer_id?: string;
  address1?: string;
  address2?: string;
  zipcode?: string;
  city?: string;
  country?: string;
  tax_number?: string;
  chamber_of_commerce?: string;
}

export default function ContactDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const contactId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [contact, setContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState<Partial<Contact>>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'admin') {
      router.push('/admin');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchContact();
    }
  }, [status, session, contactId]);

  const fetchContact = async () => {
    try {
      const res = await fetch(`/api/financien/contacten/${contactId}`);
      if (!res.ok) throw new Error('Failed to fetch contact');
      const data = await res.json();
      setContact(data.contact);
      setFormData(data.contact);
    } catch (error) {
      console.error('Error fetching contact:', error);
      toast.error('Kon contact niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/financien/contacten/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to update contact');

      const data = await res.json();
      setContact(data.contact);
      setEditing(false);
      toast.success('Contact bijgewerkt');
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Kon contact niet bijwerken');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(contact || {});
    setEditing(false);
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="animate-pulse space-y-6 max-w-4xl mx-auto">
          <div className="h-12 bg-slate-900/10 rounded w-1/3"></div>
          <div className="h-96 bg-slate-900/10 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-400">Contact niet gevonden</p>
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
            href="/admin/financien/contacten"
            className="p-2 bg-slate-900/10 hover:bg-slate-900/20 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <User className="w-8 h-8 text-[#ff6b35]" />
              {contact.company_name || `${contact.firstname} ${contact.lastname}`}
            </h1>
            <p className="text-gray-400 mt-1">Contact details uit Moneybird</p>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-[#ff6b35] hover:bg-[#ff8555] text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Bewerken
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Opslaan...' : 'Opslaan'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 bg-slate-900/10 hover:bg-slate-900/20 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <X className="w-4 h-4" />
                Annuleren
              </button>
            </div>
          )}
        </div>

        {/* Contact Details */}
        <div className="bg-slate-900/5 border border-white/10 rounded-xl p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-[#ff6b35]" />
              Basis Informatie
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Bedrijfsnaam</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.company_name || ''}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35]"
                  />
                ) : (
                  <p className="text-white">{contact.company_name || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Customer ID</label>
                <p className="text-white">{contact.customer_id || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Voornaam</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.firstname || ''}
                    onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35]"
                  />
                ) : (
                  <p className="text-white">{contact.firstname || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Achternaam</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.lastname || ''}
                    onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35]"
                  />
                ) : (
                  <p className="text-white">{contact.lastname || '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#ff6b35]" />
              Contactgegevens
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Email</label>
                {editing ? (
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35]"
                  />
                ) : (
                  <p className="text-white">{contact.email || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Telefoon</label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35]"
                  />
                ) : (
                  <p className="text-white">{contact.phone || '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#ff6b35]" />
              Adres
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm text-gray-400 mb-1 block">Adres 1</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.address1 || ''}
                    onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35]"
                  />
                ) : (
                  <p className="text-white">{contact.address1 || '-'}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-400 mb-1 block">Adres 2</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.address2 || ''}
                    onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35]"
                  />
                ) : (
                  <p className="text-white">{contact.address2 || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Postcode</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.zipcode || ''}
                    onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35]"
                  />
                ) : (
                  <p className="text-white">{contact.zipcode || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Plaats</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35]"
                  />
                ) : (
                  <p className="text-white">{contact.city || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Land</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.country || ''}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35]"
                  />
                ) : (
                  <p className="text-white">{contact.country || '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Tax Info */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#ff6b35]" />
              Fiscale Informatie
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">BTW Nummer</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.tax_number || ''}
                    onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35]"
                  />
                ) : (
                  <p className="text-white">{contact.tax_number || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">KvK Nummer</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.chamber_of_commerce || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, chamber_of_commerce: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-900/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35]"
                  />
                ) : (
                  <p className="text-white">{contact.chamber_of_commerce || '-'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
