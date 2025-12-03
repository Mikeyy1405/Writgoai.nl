'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import PublicNav from '@/components/public-nav';
import { 
  Check, Star, Zap, TrendingUp, Users, ArrowRight, Sparkles,
  FileText, Video, Image, Search, Globe, 
  Newspaper, ShoppingBag, Share2, BarChart, Clock, Shield, Rocket,
  Target, Brain, Layout, Bot, Award, Infinity
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Redirect authenticated users
  useEffect(() => {
    if (status === 'authenticated' && session && !isRedirecting) {
      setIsRedirecting(true);
      router.replace('/client-portal');
    }
  }, [status, session, router, isRedirecting]);

  // Loading state
  if (status === 'loading' || (status === 'authenticated' && session)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-orange-500/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-xl text-gray-300 font-semibold">WritGo wordt geladen...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: <Bot className="w-8 h-8" />,
      title: 'AI Chatbots',
      description: 'Slimme chatbots die 24/7 je klanten helpen en vragen beantwoorden',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'Content Automatisering',
      description: 'Automatisch content creëren voor je website, blog of social media',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: 'Video Productie',
      description: 'Professionele video\'s maken voor marketing, uitleg of presentaties',
      color: 'from-green-600 to-green-700',
    },
    {
      icon: <BarChart className="w-8 h-8" />,
      title: 'Data Analyse',
      description: 'Inzichten uit je data halen met AI-gedreven analyse en rapportage',
      color: 'from-teal-500 to-teal-600',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Workflow Automatisering',
      description: 'Repetitieve taken automatiseren en tijd besparen met AI',
      color: 'from-cyan-500 to-cyan-600',
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Maatwerk Oplossingen',
      description: 'Custom AI-oplossingen speciaal voor jouw specifieke uitdaging',
      color: 'from-green-400 to-green-500',
    },
  ];

  const benefits = [
    {
      icon: <Clock className="w-6 h-6 text-green-500" />,
      title: 'Bespaar tijd en moeite',
      description: 'Automatiseer repetitieve taken en focus op wat echt belangrijk is',
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-green-500" />,
      title: 'Groei je bedrijf',
      description: 'Schaal op zonder extra personeel met slimme AI-oplossingen',
    },
    {
      icon: <Zap className="w-6 h-6 text-green-500" />,
      title: 'Werk efficiënter',
      description: 'Los dagelijkse uitdagingen op met intelligente automatisering',
    },
    {
      icon: <Shield className="w-6 h-6 text-green-500" />,
      title: 'Maatwerk service',
      description: 'Persoonlijke aandacht en oplossingen die bij jou passen',
    },
  ];

  const stats = [
    { value: '100+', label: 'AI Projecten Gerealiseerd' },
    { value: '50+', label: 'Tevreden Klanten' },
    { value: '24/7', label: 'AI Support' },
    { value: '10x', label: 'Sneller Werken' },
  ];

  const testimonials = [
    {
      name: 'Sarah van der Berg',
      role: 'Ondernemer E-commerce',
      avatar: 'S',
      text: 'De AI chatbot van WritGo heeft onze klantenservice getransformeerd. Klanten krijgen 24/7 directe hulp en wij besparen enorm op kosten!',
      rating: 5,
    },
    {
      name: 'Mark Jansen',
      role: 'Marketing Manager',
      avatar: 'M',
      text: 'WritGo heeft onze complete content workflow geautomatiseerd. We produceren nu in een fractie van de tijd hoogwaardige content voor alle kanalen.',
      rating: 5,
    },
    {
      name: 'Lisa Bakker',
      role: 'Freelancer',
      avatar: 'L',
      text: 'Dankzij de workflow automatisering van WritGo kan ik me focussen op creatief werk terwijl AI de routinetaken overneemt. Perfecte balans!',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <PublicNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">AI Agency voor Slimme Oplossingen</span>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white">
              AI Oplossingen voor
              <br />
              <span className="text-green-500">
                Alledaagse Problemen
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto">
              WritGo is jouw AI agency die slimme oplossingen ontwikkelt voor dagelijkse uitdagingen. 
              Of het nu gaat om je bedrijf, werk of privéleven - wij automatiseren en optimaliseren met AI.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/registreren">
                <Button size="lg" className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 h-12 text-lg group">
                  Start Gratis
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="border-gray-700 text-white hover:bg-gray-800 px-8 h-12 text-lg">
                  Bekijk Oplossingen
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 pt-8">
              <div className="flex items-center gap-2 text-gray-400">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm">Geen creditcard nodig</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm">14 dagen gratis</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm">Opzeggen wanneer je wilt</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-green-500 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-500/10 text-green-500 border-green-500/20">
              Onze Oplossingen
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              AI voor werk én privé
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Van chatbots tot workflow automatisering - WritGo ontwikkelt AI-oplossingen die jouw dagelijkse 
              uitdagingen oplossen en je leven makkelijker maken
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105 group"
              >
                <CardContent className="p-6">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-green-500/10 text-green-500 border-green-500/20">
                Waarom WritGo?
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Jouw AI Partner voor Dagelijkse Uitdagingen
              </h2>
              <p className="text-lg text-gray-400 mb-8">
                WritGo helpt ondernemers, bedrijven én particulieren om hun dagelijkse taken te automatiseren 
                met slimme AI-oplossingen. Of je nu je bedrijf wilt laten groeien of gewoon tijd wilt besparen - 
                wij bouwen de perfecte oplossing voor jou.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex-shrink-0 p-2 bg-green-500/10 rounded-lg">
                      {benefit.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{benefit.title}</h4>
                      <p className="text-sm text-gray-400">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-video bg-gray-800/50 rounded-2xl border border-gray-700 flex items-center justify-center">
                <div className="text-center">
                  <Rocket className="w-20 h-20 text-green-500 mx-auto mb-4 animate-bounce" />
                  <p className="text-gray-400">Demo Video Komt Hier</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-500/10 text-green-500 border-green-500/20">
              Succesverhalen
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Echte resultaten van echte klanten
            </h2>
            <p className="text-lg text-gray-400">
              Van kleine ondernemers tot grote bedrijven - iedereen profiteert van AI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-green-500 text-green-500" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 italic">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{testimonial.name}</div>
                      <div className="text-sm text-gray-400">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gray-800/50 border-green-500/20 overflow-hidden">
            <CardContent className="p-12 text-center relative">
              <div className="absolute inset-0 bg-grid-white/5" />
              <div className="relative z-10">
                <Sparkles className="w-12 h-12 text-green-500 mx-auto mb-6" />
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Klaar om te beginnen?
                </h2>
                <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                  Sluit je aan bij duizenden tevreden gebruikers en transformeer je content marketing vandaag nog
                </p>
                <Link href="/registreren">
                  <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 h-12 text-lg">
                    Start Nu Gratis
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <p className="text-sm text-gray-400 mt-4">
                  Geen creditcard nodig • 14 dagen gratis trial
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold text-green-500 mb-4">
                WritGo AI
              </h3>
              <p className="text-gray-400 mb-4">
                Jouw AI agency voor slimme oplossingen. We ontwikkelen AI-tools en automatisering 
                voor alledaagse problemen op werk, in je bedrijf en privé.
              </p>
              <div className="flex gap-4">
                <Link href="/privacy" className="text-gray-400 hover:text-green-500 transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="text-gray-400 hover:text-green-500 transition-colors">
                  Voorwaarden
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-gray-400 hover:text-green-500 transition-colors">Oplossingen</Link></li>
                <li><Link href="/prijzen" className="text-gray-400 hover:text-green-500 transition-colors">Prijzen</Link></li>
                <li><Link href="/inloggen" className="text-gray-400 hover:text-green-500 transition-colors">Inloggen</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="text-gray-400">support@writgo.nl</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} WritGo. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
// Updated Mon Nov 24 22:26:51 UTC 2025
