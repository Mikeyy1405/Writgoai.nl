'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  FileText,
  Video,
  Bot,
  Cog,
  Globe,
  Palette,
  HelpCircle,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const requestTypes = [
  {
    value: 'blog',
    label: 'Blog & Content',
    icon: FileText,
    description: 'SEO artikelen, blogs, product beschrijvingen',
    color: 'blue',
  },
  {
    value: 'video',
    label: 'Video',
    icon: Video,
    description: 'Video productie, editing, YouTube content',
    color: 'red',
  },
  {
    value: 'chatbot',
    label: 'Chatbot',
    icon: Bot,
    description: 'AI chatbot voor je website of klantenservice',
    color: 'purple',
  },
  {
    value: 'automation',
    label: 'Automatisering',
    icon: Cog,
    description: 'Workflows, integraties, automatische processen',
    color: 'yellow',
  },
  {
    value: 'website',
    label: 'Website',
    icon: Globe,
    description: 'Website ontwikkeling, landing pages, webshops',
    color: 'green',
  },
  {
    value: 'design',
    label: 'Design',
    icon: Palette,
    description: 'Grafisch ontwerp, logo, branding, social media',
    color: 'pink',
  },
  {
    value: 'other',
    label: 'Anders',
    icon: HelpCircle,
    description: 'Overige AI-gerelateerde diensten',
    color: 'gray',
  },
];

export default function NewRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    description: '',
    budget: '',
    deadline: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.title || !formData.description) {
      toast.error('Vul alle verplichte velden in');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/client/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Kon verzoek niet indienen');
      }
    } catch (error) {
      toast.error('Er ging iets mis');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-8">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Verzoek Ingediend!</h2>
            <p className="text-gray-300 mb-6">
              We hebben je verzoek ontvangen en nemen zo snel mogelijk contact met je op.
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/client-portal"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Naar Dashboard
              </Link>
              <button
                onClick={() => {
                  setSuccess(false);
                  setFormData({ type: '', title: '', description: '', budget: '', deadline: '' });
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Nieuw Verzoek
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-3xl mx-auto">
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
              <Sparkles className="w-6 h-6 text-green-400" />
              Nieuw AI Verzoek
            </h1>
            <p className="text-gray-400">Vertel ons wat je nodig hebt</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <label className="text-sm font-medium text-gray-300 mb-4 block">Wat voor project is dit? *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {requestTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-green-500/20 border-green-500/50'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-green-400' : 'text-gray-400'}`} />
                    <p className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                      {type.label}
                    </p>
                  </button>
                );
              })}
            </div>
            {formData.type && (
              <p className="text-gray-400 text-sm mt-3">
                {requestTypes.find(t => t.value === formData.type)?.description}
              </p>
            )}
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
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                placeholder="Korte beschrijving van je project"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Beschrijving *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={6}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 resize-none"
                placeholder="Vertel ons meer over wat je nodig hebt. Wat wil je bereiken? Zijn er specifieke eisen?"
              />
            </div>
          </div>

          {/* Budget & Deadline */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Budget indicatie</label>
                <select
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-500"
                >
                  <option value="" className="bg-[#1a1a1a]">Selecteer...</option>
                  <option value="< €500" className="bg-[#1a1a1a]">&lt; €500</option>
                  <option value="€500 - €1.000" className="bg-[#1a1a1a]">€500 - €1.000</option>
                  <option value="€1.000 - €2.500" className="bg-[#1a1a1a]">€1.000 - €2.500</option>
                  <option value="€2.500 - €5.000" className="bg-[#1a1a1a]">€2.500 - €5.000</option>
                  <option value="> €5.000" className="bg-[#1a1a1a]">&gt; €5.000</option>
                  <option value="Op maat" className="bg-[#1a1a1a]">Op maat / weet ik niet</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Gewenste deadline</label>
                <select
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-500"
                >
                  <option value="" className="bg-[#1a1a1a]">Selecteer...</option>
                  <option value="Zo snel mogelijk" className="bg-[#1a1a1a]">Zo snel mogelijk</option>
                  <option value="Binnen 1 week" className="bg-[#1a1a1a]">Binnen 1 week</option>
                  <option value="Binnen 2 weken" className="bg-[#1a1a1a]">Binnen 2 weken</option>
                  <option value="Binnen 1 maand" className="bg-[#1a1a1a]">Binnen 1 maand</option>
                  <option value="Flexibel" className="bg-[#1a1a1a]">Flexibel</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Link
              href="/client-portal"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Annuleren
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.type}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Verzoek Indienen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
