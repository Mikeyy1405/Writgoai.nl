'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Building, Globe, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    companyName: '',
    website: '',
    password: '',
    generatePassword: true,
  });
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/agency/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          companyName: formData.companyName || null,
          website: formData.website || null,
          password: formData.generatePassword ? undefined : formData.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Klant aangemaakt!');
        if (data.generatedPassword) {
          setGeneratedPassword(data.generatedPassword);
        } else {
          router.push('/dashboard/agency/clients');
        }
      } else {
        toast.error(data.error || 'Kon klant niet aanmaken');
      }
    } catch (error) {
      toast.error('Er ging iets mis');
    } finally {
      setLoading(false);
    }
  };

  if (generatedPassword) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="max-w-lg mx-auto">
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">✅ Klant Aangemaakt!</h2>
            <p className="text-gray-300 mb-6">Bewaar het wachtwoord goed - je kunt het niet meer opvragen.</p>
            
            <div className="bg-black/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400 mb-2">Inloggegevens:</p>
              <p className="text-white"><strong>Email:</strong> {formData.email}</p>
              <p className="text-white"><strong>Wachtwoord:</strong> <code className="bg-white/10 px-2 py-1 rounded">{generatedPassword}</code></p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Email: ${formData.email}\nWachtwoord: ${generatedPassword}`);
                  toast.success('Gekopieerd!');
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Kopieer Gegevens
              </button>
              <Link
                href="/dashboard/agency/clients"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Naar Klanten
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard/agency/clients"
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Nieuwe Klant</h1>
            <p className="text-gray-400">Voeg een nieuwe klant toe aan je agency</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
            {/* Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <User className="w-4 h-4" />
                Naam *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Mail className="w-4 h-4" />
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="john@example.com"
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Building className="w-4 h-4" />
                Bedrijfsnaam
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="Acme B.V."
              />
            </div>

            {/* Website */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Globe className="w-4 h-4" />
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="https://example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Lock className="w-4 h-4" />
                Wachtwoord
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.generatePassword}
                    onChange={(e) => setFormData({ ...formData, generatePassword: e.target.checked })}
                    className="rounded border-gray-600 bg-white/5"
                  />
                  <span className="text-gray-400 text-sm">Genereer automatisch wachtwoord</span>
                </label>
                {!formData.generatePassword && (
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!formData.generatePassword}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    placeholder="Kies een wachtwoord"
                    minLength={6}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Link
              href="/dashboard/agency/clients"
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
              Klant Aanmaken
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
