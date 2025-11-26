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
      icon: <Layout className="w-8 h-8" />,
      title: 'Site Planner',
      description: 'Genereer complete content structuren voor je website in minuten',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'Content Generator',
      description: 'Schrijf SEO-geoptimaliseerde artikelen met AI in elke taal',
      color: 'from-orange-500 to-orange-600',
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Topical Mapping',
      description: 'Ontdek 1000+ content ideeën voor je niche automatisch',
      color: 'from-blue-400 to-blue-500',
    },
    {
      icon: <Image className="w-8 h-8" />,
      title: 'AI Afbeeldingen',
      description: 'Genereer unieke afbeeldingen voor je content met AI',
      color: 'from-orange-400 to-orange-500',
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: 'WordPress Integratie',
      description: 'Publiceer direct naar je WordPress site met één klik',
      color: 'from-blue-600 to-blue-700',
    },
    {
      icon: <BarChart className="w-8 h-8" />,
      title: 'SEO Optimizer',
      description: 'Optimaliseer je content voor zoekmachines automatisch',
      color: 'from-orange-600 to-orange-700',
    },
  ];

  const benefits = [
    {
      icon: <Clock className="w-6 h-6 text-blue-500" />,
      title: 'Bespaar 20+ uur per week',
      description: 'Automatiseer je content productie volledig',
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-blue-500" />,
      title: 'Verhoog je traffic',
      description: 'SEO-geoptimaliseerde content die rankt',
    },
    {
      icon: <Zap className="w-6 h-6 text-blue-500" />,
      title: 'Snellere publicaties',
      description: 'Van idee naar live content in minuten',
    },
    {
      icon: <Shield className="w-6 h-6 text-blue-500" />,
      title: 'Unieke content',
      description: 'Geen duplicate content, altijd origineel',
    },
  ];

  const stats = [
    { value: '50K+', label: 'Artikelen Gegenereerd' },
    { value: '1000+', label: 'Tevreden Gebruikers' },
    { value: '95%', label: 'Klanttevredenheid' },
    { value: '24/7', label: 'AI Beschikbaar' },
  ];

  const testimonials = [
    {
      name: 'Sarah van der Berg',
      role: 'Content Manager',
      avatar: 'S',
      text: 'WritGo heeft onze content productie getransformeerd. We maken nu 5x meer artikelen in minder tijd!',
      rating: 5,
    },
    {
      name: 'Mark Jansen',
      role: 'SEO Specialist',
      avatar: 'M',
      text: 'De SEO optimalisatie is geweldig. Onze organische traffic is met 300% gestegen in 3 maanden.',
      rating: 5,
    },
    {
      name: 'Lisa Bakker',
      role: 'Blogger',
      avatar: 'L',
      text: 'Eindelijk kan ik me focussen op strategie terwijl WritGo de content schrijft. Game changer!',
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
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-500">AI-Powered Content Platform</span>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white">
              Creëer Content die
              <br />
              <span className="text-green-500">
                Écht Converteert
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto">
              WritGo combineert AI-technologie met SEO-expertise om unieke, hoogwaardige content te genereren 
              die rankt en converteert. Bespaar tijd, verhoog je traffic en groei je business.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/registreren">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 h-12 text-lg group">
                  Start Gratis Trial
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="border-gray-700 text-white hover:bg-gray-800 px-8 h-12 text-lg">
                  Bekijk Features
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
            <Badge className="mb-4 bg-blue-500/10 text-blue-500 border-blue-500/20">
              Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Alles wat je nodig hebt
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Van content planning tot publicatie - WritGo biedt alle tools die je nodig hebt voor succesvol content marketing
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
              <Badge className="mb-4 bg-orange-500/10 text-orange-500 border-orange-500/20">
                Waarom WritGo?
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Content marketing die echt werkt
              </h2>
              <p className="text-lg text-gray-400 mb-8">
                WritGo helpt duizenden bedrijven en marketeers om hun content productie te automatiseren 
                zonder in te leveren op kwaliteit. Ervaar het verschil.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex-shrink-0 p-2 bg-blue-500/10 rounded-lg">
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
            <Badge className="mb-4 bg-blue-500/10 text-blue-500 border-blue-500/20">
              Testimonials
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Wat onze klanten zeggen
            </h2>
            <p className="text-lg text-gray-400">
              Honderden tevreden gebruikers wereldwijd
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-orange-500 text-orange-500" />
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
                WritGo
              </h3>
              <p className="text-gray-400 mb-4">
                AI-powered content platform voor moderne marketeers. Creëer, optimaliseer en publiceer content die converteert.
              </p>
              <div className="flex gap-4">
                <Link href="/privacy" className="text-gray-400 hover:text-blue-500 transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="text-gray-400 hover:text-blue-500 transition-colors">
                  Voorwaarden
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-gray-400 hover:text-blue-500 transition-colors">Features</Link></li>
                <li><Link href="/prijzen" className="text-gray-400 hover:text-blue-500 transition-colors">Prijzen</Link></li>
                <li><Link href="/inloggen" className="text-gray-400 hover:text-blue-500 transition-colors">Inloggen</Link></li>
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
