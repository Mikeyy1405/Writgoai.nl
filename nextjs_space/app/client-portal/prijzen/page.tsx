'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Video,
  Bot,
  Cog,
  Globe,
  Palette,
  HelpCircle,
  Coins,
  Check,
  Infinity,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { SERVICE_PRICING } from '@/lib/service-pricing';

const services = [
  {
    key: 'blog',
    icon: FileText,
    color: 'blue',
  },
  {
    key: 'video',
    icon: Video,
    color: 'red',
  },
  {
    key: 'chatbot',
    icon: Bot,
    color: 'purple',
  },
  {
    key: 'automation',
    icon: Cog,
    color: 'yellow',
  },
  {
    key: 'website',
    icon: Globe,
    color: 'green',
  },
  {
    key: 'design',
    icon: Palette,
    color: 'pink',
  },
  {
    key: 'other',
    icon: HelpCircle,
    color: 'gray',
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [clientCredits, setClientCredits] = useState(0);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClientData() {
      if (status === 'loading') return;
      if (!session) {
        router.push('/inloggen');
        return;
      }

      try {
        const res = await fetch('/api/client/profile');
        if (res.ok) {
          const data = await res.json();
          setClientCredits((data.subscriptionCredits || 0) + (data.topUpCredits || 0));
          setIsUnlimited(data.isUnlimited || false);
        }
      } catch (error) {
        console.error('Error fetching client data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchClientData();
  }, [session, status, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/client-portal"
              className="p-2 hover:bg-slate-900/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-green-400" />
                Diensten & Prijzen
              </h1>
              <p className="text-gray-400">Wat kost welke dienst in credits?</p>
            </div>
          </div>

          {/* Credits Display */}
          <div className="bg-slate-900/5 border border-white/10 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              {isUnlimited ? (
                <>
                  <Infinity className="w-5 h-5 text-green-400" />
                  <span className="text-white font-semibold">Onbeperkt</span>
                </>
              ) : (
                <>
                  <Coins className="w-5 h-5 text-green-400" />
                  <span className="text-white font-semibold">{clientCredits.toLocaleString()}</span>
                  <span className="text-gray-400 text-sm">credits</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white mb-1">Hoe werkt het?</h3>
              <p className="text-gray-300 text-sm">
                Elk project kost een aantal credits. De complexiteit van het project bepaalt hoeveel credits je nodig hebt.
                Onbeperkte klanten kunnen alle diensten zonder limiet aanvragen.
              </p>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const serviceData = SERVICE_PRICING[service.key as keyof typeof SERVICE_PRICING];
            const Icon = service.icon;
            const canAfford = isUnlimited || clientCredits >= serviceData.credits;

            return (
              <div
                key={service.key}
                className={`bg-slate-900/5 border rounded-xl p-6 transition-all ${
                  canAfford
                    ? 'border-white/10 hover:border-green-500/50 hover:bg-slate-900/10'
                    : 'border-red-500/20 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-${service.color}-500/10`}>
                    <Icon className={`w-6 h-6 text-${service.color}-400`} />
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                    <Coins className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-bold text-white">{serviceData.credits}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{serviceData.label}</h3>
                <p className="text-gray-400 text-sm mb-4">{serviceData.description}</p>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-gray-300 text-xs mb-3">Wat krijg je:</p>
                  <div className="space-y-2">
                    {serviceData.details.split(',').map((detail, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-xs">{detail.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {!canAfford && (
                  <div className="mt-4 text-xs text-red-400 font-medium">
                    ⚠️ Niet genoeg credits
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Klaar om te beginnen?</h2>
          <p className="text-gray-300 mb-6">
            Dien je eerste AI verzoek in en laat ons je helpen met je project
          </p>
          <Link
            href="/client-portal/nieuw-verzoek"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            Nieuw Verzoek Indienen
          </Link>
        </div>
      </div>
    </div>
  );
}
