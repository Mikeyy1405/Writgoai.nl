
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Sparkles, Zap, Building2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CreditCalculator } from '@/components/credit-calculator';

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const packages = [
    {
      id: 'starter',
      name: 'Starter',
      icon: Sparkles,
      price: '€29',
      period: '/ maand',
      credits: 1000,
      contentEstimate: '≈ 14 blogs of 8 videos',
      description: 'Perfect voor starters',
      features: [
        'Alle AI modellen (GPT-4, Claude, Gemini)',
        '1000 credits per maand',
        'Alle tools: Blog, Video, Social, Code',
        'Content Library',
        'Keyword Research',
        'Email support',
        'Top-up credits mogelijk',
      ],
      popular: false,
      priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || '',
    },
    {
      id: 'pro',
      name: 'Pro',
      icon: Zap,
      price: '€79',
      period: '/ maand',
      credits: 3000,
      contentEstimate: '≈ 42 blogs of 25 videos',
      description: 'Voor professionals',
      features: [
        '✨ Alles van Starter',
        '3000 credits per maand',
        'Priority support (< 4 uur)',
        'Advanced AI modellen',
        'Bulk content generatie',
        'Social media automation',
        'Analytics dashboard',
      ],
      popular: true,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      icon: Building2,
      price: '€199',
      period: '/ maand',
      credits: 10000,
      contentEstimate: '≈ 142 blogs of 83 videos',
      description: 'Voor teams & agencies',
      features: [
        '✨ Alles van Pro',
        '10.000 credits per maand',
        'Multi-user accounts (tot 5 gebruikers)',
        'White-label optie',
        'Dedicated account manager',
        'Custom integraties',
        'Priority support (< 2 uur)',
        '24/7 support',
      ],
      popular: false,
      priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || '',
    },
  ];

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Er ging iets mis');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Er ging iets mis bij het starten van de checkout');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-black/30 border-b border-gray-700/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent cursor-pointer">
              WritgoAI
            </h1>
          </Link>
          <div className="flex gap-4">
            <Link href="/client-login">
              <Button variant="outline" className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10">
                Inloggen
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 px-4 py-2 rounded-full font-semibold mb-8 border border-orange-500/30">
            💳 Simpel & Transparant
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
            Kies je plan
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Start gratis, upgrade wanneer je wilt. Geen verborgen kosten.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => {
              const Icon = pkg.icon;
              return (
                <Card
                  key={pkg.id}
                  className={`relative bg-gray-800/50 border-2 backdrop-blur-sm ${
                    pkg.popular
                      ? 'border-orange-500 shadow-[0_20px_40px_rgba(255,107,53,0.3)]'
                      : 'border-gray-700'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                        🔥 Meest Gekozen
                      </div>
                    </div>
                  )}
                  <CardHeader className="text-center pb-6">
                    <div className="flex justify-center mb-4">
                      <div className={`p-3 rounded-full ${pkg.popular ? 'bg-orange-500/20' : 'bg-gray-700/50'}`}>
                        <Icon className={`w-8 h-8 ${pkg.popular ? 'text-orange-400' : 'text-gray-400'}`} />
                      </div>
                    </div>
                    <CardDescription className="text-gray-400 text-sm mb-2">{pkg.description}</CardDescription>
                    <CardTitle className="text-3xl text-white mb-4">{pkg.name}</CardTitle>
                    <div className="flex items-end justify-center gap-1 mb-2">
                      <span className="text-5xl font-extrabold text-white">{pkg.price}</span>
                      <span className="text-gray-400 mb-2">{pkg.period}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="text-2xl font-bold text-orange-400 mb-1">
                        {pkg.credits} credits/maand
                      </div>
                      <div className="text-sm text-gray-400">{pkg.contentEstimate}</div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-8">
                      {pkg.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => handleSubscribe(pkg.id)}
                      disabled={loading !== null}
                      className={`w-full ${
                        pkg.popular
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                    >
                      {loading === pkg.id ? 'Laden...' : `Start ${pkg.name}`} →
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Credit Calculator */}
          <div className="mt-16">
            <CreditCalculator />
          </div>

          {/* Trial Banner */}
          <div className="mt-16 text-center">
            <div className="max-w-3xl mx-auto bg-gradient-to-r from-orange-500/20 to-orange-600/20 backdrop-blur-sm border border-orange-500/30 rounded-2xl p-8">
              <div className="text-4xl mb-4">🎁</div>
              <h3 className="text-2xl font-bold text-white mb-3">Start met 1000 Gratis Credits!</h3>
              <p className="text-gray-300 mb-6">
                Bij registratie krijg je 1000 credits cadeau. Daarmee kun je al <strong className="text-orange-400">14 blogs</strong> of <strong className="text-orange-400">8 videos</strong> maken - helemaal gratis!
              </p>
              <Link href="/client-register">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg px-8 py-6">
                  Gratis Starten →
                </Button>
              </Link>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-12 text-center">
            <div className="max-w-3xl mx-auto bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">Hoe werken credits?</h3>
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div>
                  <div className="text-orange-400 font-bold mb-2">📝 Blog artikel</div>
                  <div className="text-gray-400 text-sm">70 credits per artikel (inclusief research en afbeeldingen)</div>
                </div>
                <div>
                  <div className="text-orange-400 font-bold mb-2">🎬 Video generatie</div>
                  <div className="text-gray-400 text-sm">120 credits per video (inclusief voiceover en muziek)</div>
                </div>
                <div>
                  <div className="text-orange-400 font-bold mb-2">📱 Social media post</div>
                  <div className="text-gray-400 text-sm">20 credits per post</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/30 border-t border-gray-700/50 text-white py-12 px-4 text-center backdrop-blur-sm">
        <div className="container mx-auto">
          <p className="mb-4">
            Vragen? Mail naar{' '}
            <a href="mailto:info@WritgoAI.nl" className="text-orange-400 font-semibold hover:underline">
              info@WritgoAI.nl
            </a>
          </p>
          <p className="text-gray-400 text-sm">© 2025 WritgoAI. Alle rechten voorbehouden.</p>
        </div>
      </footer>
    </div>
  );
}
