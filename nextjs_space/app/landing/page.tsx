
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, Star, Zap, TrendingUp, Users, Lock, ArrowRight, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect om te beginnen met AI content',
      monthlyPrice: 0,
      yearlyPrice: 0,
      credits: 100,
      features: [
        '100 credits per maand',
        '5 AI-gegenereerde blogs',
        'Basis SEO optimalisatie',
        'Content bibliotheek',
        'Email support',
        'WritgoAI watermark'
      ],
      cta: 'Gratis Starten',
      popular: false,
      color: 'from-gray-500 to-gray-700'
    },
    {
      name: 'Professional',
      description: 'Voor serieuze content creators',
      monthlyPrice: 49,
      yearlyPrice: 470, // ~20% korting
      credits: 2500,
      features: [
        '2.500 credits per maand',
        '~50 AI-gegenereerde blogs',
        'Geavanceerde SEO & keyword research',
        'Product reviews & top lijsten',
        'Onbeperkte content bibliotheek',
        'Social media posts generator',
        'WordPress integratie',
        'Video content generator',
        'Priority support',
        'Geen watermark'
      ],
      cta: 'Start Professional',
      popular: true,
      color: 'from-orange-500 to-orange-700'
    },
    {
      name: 'Business',
      description: 'Voor agencies en grote teams',
      monthlyPrice: 149,
      yearlyPrice: 1430, // ~20% korting
      credits: 10000,
      features: [
        '10.000 credits per maand',
        'Onbeperkte blogs & content',
        'Complete automation suite',
        'Dedicated account manager',
        'API toegang',
        'White-label mogelijkheden',
        'Bulk content generatie',
        'Custom AI training',
        'Multi-user accounts (tot 5)',
        'Analytics & rapportage',
        'Priority support + telefoon',
        'Alles van Professional'
      ],
      cta: 'Start Business',
      popular: false,
      color: 'from-purple-500 to-purple-700'
    },
    {
      name: 'Enterprise',
      description: 'Op maat gemaakte oplossingen',
      monthlyPrice: null,
      yearlyPrice: null,
      credits: '∞',
      features: [
        'Onbeperkte credits',
        'Custom AI modellen',
        'Dedicated infrastructure',
        'SLA garanties',
        'Onbeperkte gebruikers',
        'Custom integraties',
        'Persoonlijke training',
        '24/7 premium support',
        'Alles van Business'
      ],
      cta: 'Contact Sales',
      popular: false,
      color: 'from-blue-500 to-blue-700'
    }
  ];

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'AI-Powered Content',
      description: 'Geavanceerde AI die perfect aansluit bij jouw tone of voice en merkidentiteit'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'SEO Geoptimaliseerd',
      description: 'Elke content is geoptimaliseerd voor zoekmachines met real-time keyword research'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: '10x Sneller',
      description: 'Genereer in minuten wat normaal uren zou kosten. Schaal je content productie explosief'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Multi-Platform',
      description: 'Van blogs tot social media, van video scripts tot product reviews - alles in één tool'
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Altijd Unique',
      description: 'Elke content is uniek, plagiaatvrij en voldoet aan de hoogste kwaliteitseisen'
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: 'Nederlands + Engels',
      description: 'Native ondersteuning voor meerdere talen met perfecte grammatica en stijl'
    }
  ];

  const stats = [
    { value: '50K+', label: 'AI-Gegenereerde Artikelen' },
    { value: '1.2M+', label: 'Woorden per Dag' },
    { value: '98%', label: 'Klanttevredenheid' },
    { value: '10x', label: 'Sneller dan Traditioneel' }
  ];

  const testimonials = [
    {
      name: 'Sarah de Vries',
      role: 'Content Manager bij TechStart',
      content: 'WritgoAI heeft onze content productie compleet getransformeerd. We publiceren nu 5x meer artikelen met dezelfde resources.',
      rating: 5
    },
    {
      name: 'Mark Janssen',
      role: 'E-commerce Ondernemer',
      content: 'De product review generator is goud waard. Ik genereer nu in 10 minuten wat voorheen een hele dag kostte.',
      rating: 5
    },
    {
      name: 'Lisa Vermeulen',
      role: 'SEO Specialist',
      content: 'De SEO optimalisatie en keyword research zijn next-level. Onze rankings zijn met 150% gestegen in 3 maanden.',
      rating: 5
    }
  ];

  const getPrice = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === null) return null;
    if (billingCycle === 'monthly') return plan.monthlyPrice;
    return Math.round(plan.yearlyPrice / 12);
  };

  const getSavings = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === null || plan.monthlyPrice === 0) return 0;
    return Math.round(((plan.monthlyPrice * 12 - plan.yearlyPrice) / (plan.monthlyPrice * 12)) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-gray-800/50 to-gray-900" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-32 sm:pb-32">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="px-4 py-2 bg-orange-500/20 rounded-full text-orange-400 text-sm font-semibold border border-orange-500/30">
                🚀 Nieuw: Claude 4.5 Sonnet AI Model
              </span>
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-orange-200 to-orange-400 bg-clip-text text-transparent">
              Content Creatie op
              <br />
              <span className="text-orange-400">Autopilot</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Genereer SEO-geoptimaliseerde blogs, product reviews, social media content en meer met de kracht van AI. 
              <span className="text-orange-400 font-semibold"> 10x sneller, 5x goedkoper.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/client-register">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-6 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  Start Gratis - 100 Credits
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-2 border-orange-500 text-orange-400 hover:bg-orange-500/10 px-8 py-6 text-lg rounded-xl">
                Bekijk Demo
              </Button>
            </div>

            <p className="text-gray-400 text-sm mt-4">
              ✓ Geen creditcard vereist  ✓ Direct starten  ✓ Opzeggen wanneer je wilt
            </p>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-orange-400 mb-2">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Waarom WritgoAI?</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Alles wat je nodig hebt om je content strategie naar het volgende level te tillen
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-orange-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 text-white">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24" id="pricing">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Kies je Plan</h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Begin gratis en upgrade wanneer je schaalt. Flexibel en transparant.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-800 rounded-full p-1 border border-gray-700">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full transition-all duration-300 ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Maandelijks
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full transition-all duration-300 ${
                billingCycle === 'yearly'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Jaarlijks
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">Bespaar 20%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const price = getPrice(plan);
            const savings = getSavings(plan);

            return (
              <div
                key={plan.name}
                className={`relative bg-gray-800/50 backdrop-blur-sm rounded-2xl border-2 overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                  plan.popular
                    ? 'border-orange-500 shadow-xl shadow-orange-500/20 transform scale-105'
                    : 'border-gray-700 hover:border-orange-500/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                    Meest Populair
                  </div>
                )}

                <div className="p-8">
                  <div className={`w-12 h-12 bg-gradient-to-br ${plan.color} rounded-xl mb-4`} />
                  
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-6 h-10">{plan.description}</p>

                  <div className="mb-6">
                    {price === null ? (
                      <div className="text-3xl font-bold">Op aanvraag</div>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold">€{price}</span>
                          <span className="text-gray-400">/ maand</span>
                        </div>
                        {billingCycle === 'yearly' && savings > 0 && (
                          <div className="text-green-400 text-sm mt-1">
                            Bespaar €{plan.monthlyPrice * 12 - plan.yearlyPrice} per jaar ({savings}% korting)
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="mb-6 p-4 bg-gray-900/50 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Credits per maand</div>
                    <div className="text-2xl font-bold text-orange-400">{plan.credits}</div>
                  </div>

                  <Link href={plan.name === 'Enterprise' ? '/contact' : '/client-register'}>
                    <Button
                      className={`w-full mb-6 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>

                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">
            💡 Niet zeker welk plan bij je past? Probeer eerst gratis of{' '}
            <Link href="/contact" className="text-orange-400 hover:text-orange-300">
              neem contact op
            </Link>
          </p>
        </div>
      </div>

      {/* Testimonials */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 bg-gradient-to-b from-transparent to-gray-900/50">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Wat onze klanten zeggen</h2>
          <p className="text-xl text-gray-400">
            Sluit je aan bij duizenden tevreden content creators
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-orange-400 text-orange-400" />
                ))}
              </div>
              <p className="text-gray-300 mb-6">&quot;{testimonial.content}&quot;</p>
              <div>
                <div className="font-semibold">{testimonial.name}</div>
                <div className="text-sm text-gray-400">{testimonial.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="relative">
            <h2 className="text-4xl font-bold mb-4">Klaar om je content game te veranderen?</h2>
            <p className="text-xl mb-8 text-orange-100 max-w-2xl mx-auto">
              Begin vandaag nog gratis en ervaar de kracht van AI-gedreven content creatie
            </p>
            <Link href="/client-register">
              <Button size="lg" className="bg-slate-900 text-orange-600 hover:bg-slate-800/50 px-8 py-6 text-lg rounded-xl shadow-xl">
                Start Gratis - Krijg 100 Credits
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="text-orange-100 text-sm mt-4">
              Geen creditcard vereist • Direct starten • Cancel anytime
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">
                <span className="text-white">Writgo</span>
                <span className="text-[#FF6B35]">Media</span>
              </h3>
              <p className="text-gray-400 text-sm">
                De #1 AI content platform voor professionals
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#features" className="hover:text-orange-400">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-orange-400">Pricing</Link></li>
                <li><Link href="/client-login" className="hover:text-orange-400">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/contact" className="hover:text-orange-400">Contact</Link></li>
                <li><Link href="/docs" className="hover:text-orange-400">Documentatie</Link></li>
                <li><Link href="/faq" className="hover:text-orange-400">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-orange-400">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-orange-400">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 text-sm">
            © 2025 Writgo Media. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
