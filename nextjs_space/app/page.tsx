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
  Target, Brain, Layout, Bot, Award, Infinity, Code, Languages,
  Smartphone, MessageSquare, Lightbulb, Calendar, UserCheck, Handshake
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
      <div className="min-h-screen bg-deep-space flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-electric-violet/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-electric-violet border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-xl text-pearl-white font-semibold">WritGo wordt geladen...</p>
        </div>
      </div>
    );
  }

  const aiTools = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Blog Generator',
      description: 'Genereer volledige SEO-geoptimaliseerde blogs',
      credits: '70 credits',
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: 'Keyword Research',
      description: 'Vind de beste zoekwoorden voor je niche',
      credits: '40 credits',
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: 'Video Generator',
      description: 'Creëer AI-gegenereerde video\'s',
      credits: '120 credits',
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: 'Social Media',
      description: 'Posts voor alle sociale platformen',
      credits: '20 credits',
    },
    {
      icon: <ShoppingBag className="w-6 h-6" />,
      title: 'Product Reviews',
      description: 'Schrijf overtuigende productreviews',
      credits: '70 credits',
    },
    {
      icon: <Bot className="w-6 h-6" />,
      title: 'AI Chatbot',
      description: 'Beantwoord vragen met AI',
      credits: '1-5 credits',
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Content Planning',
      description: 'Plan je content strategie',
      credits: '40 credits',
    },
    {
      icon: <Image className="w-6 h-6" />,
      title: 'AI Afbeeldingen',
      description: 'Genereer unieke afbeeldingen',
      credits: '30 credits',
    },
  ];

  const features = [
    {
      icon: <Sparkles className="w-6 h-6 text-electric-violet" />,
      title: 'Nieuwste AI Modellen',
      description: 'GPT-4o & Claude 4.5',
    },
    {
      icon: <Search className="w-6 h-6 text-electric-violet" />,
      title: 'SEO Geoptimaliseerd',
      description: 'Rank hoger in Google',
    },
    {
      icon: <Zap className="w-6 h-6 text-electric-violet" />,
      title: '10x Sneller',
      description: 'Dan handmatig schrijven',
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-electric-violet" />,
      title: 'Tone of Voice',
      description: 'Volledig aanpasbaar',
    },
    {
      icon: <Award className="w-6 h-6 text-electric-violet" />,
      title: '100% Unieke Content',
      description: 'Geen duplicaten',
    },
    {
      icon: <Languages className="w-6 h-6 text-electric-violet" />,
      title: 'Multi-Language',
      description: '30+ talen ondersteund',
    },
    {
      icon: <Image className="w-6 h-6 text-electric-violet" />,
      title: 'AI Afbeeldingen',
      description: 'Automatisch gegenereerd',
    },
    {
      icon: <Shield className="w-6 h-6 text-electric-violet" />,
      title: 'GDPR Compliant',
      description: 'Veilig & privacy-proof',
    },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '€29',
      period: '/maand',
      credits: '1.000 credits',
      features: [
        'Alle AI-tools toegang',
        '12+ content generators',
        'SEO optimalisatie',
        'Email support',
      ],
      popular: false,
    },
    {
      name: 'Professional',
      price: '€79',
      period: '/maand',
      credits: '3.000 credits',
      features: [
        'Alle Starter features',
        'Priority support',
        'Geavanceerde analytics',
        'WordPress integratie',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '€199',
      period: '/maand',
      credits: '10.000 credits',
      features: [
        'Alle Professional features',
        'Dedicated accountmanager',
        'Custom integraties',
        'API toegang',
      ],
      popular: false,
    },
  ];

  const stats = [
    { value: '100K+', label: 'Artikelen gegenereerd' },
    { value: '5M+', label: 'Woorden per maand' },
    { value: '10x', label: 'Sneller dan handmatig' },
    { value: '99%', label: 'Klanttevredenheid' },
  ];

  const testimonials = [
    {
      name: 'Sarah van der Berg',
      role: 'Content Manager',
      avatar: 'S',
      text: 'WritGo heeft ons contentproces compleet getransformeerd. We publiceren nu 3x meer artikelen met betere SEO resultaten.',
      rating: 5,
    },
    {
      name: 'Mark Jansen',
      role: 'Digital Marketer',
      avatar: 'M',
      text: 'De managed service is fantastisch. Elke week nieuwe content zonder dat ik er naar om hoef te kijken.',
      rating: 5,
    },
    {
      name: 'Lisa Bakker',
      role: 'E-commerce Eigenaar',
      avatar: 'L',
      text: 'De self-service tools zijn intuïtief en krachtig. Ik kan nu zelf professionele content maken in minuten.',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-deep-space">
      <PublicNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Animated background with gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-electric-violet/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-neon-cyan/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-soft-lavender/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 glass-violet rounded-full backdrop-blur-sm animate-fade-in">
              <Sparkles className="w-4 h-4 text-neon-cyan" />
              <span className="text-sm font-medium text-pearl-white">AI Content Platform - Nieuw: Claude 4.5 & GPT-4o</span>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-pearl-white animate-fade-in">
              Genereer SEO-blogs in
              <br />
              <span className="bg-gradient-to-r from-electric-violet via-soft-lavender to-neon-cyan bg-clip-text text-transparent">
                minuten, niet in uren
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto animate-fade-in">
              Het AI-platform voor content creatie. Doe het zelf met onze tools, of laat ons team het volledig voor je regelen.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
              <Link href="/registreren">
                <Button size="lg" className="btn-gradient-violet-cyan text-white px-8 h-12 text-lg font-semibold group border-0">
                  Start Gratis - 1000 Credits
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#managed-service">
                <Button size="lg" variant="outline" className="border-electric-violet text-pearl-white hover:bg-electric-violet/10 px-8 h-12 text-lg font-semibold">
                  Bekijk Managed Service
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 pt-8 animate-fade-in">
              <div className="flex items-center gap-2 text-gray-300">
                <Check className="w-5 h-5 text-neon-cyan" />
                <span className="text-sm">Geen creditcard</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Check className="w-5 h-5 text-neon-cyan" />
                <span className="text-sm">Direct starten</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Check className="w-5 h-5 text-neon-cyan" />
                <span className="text-sm">Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-slate/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-electric-violet to-neon-cyan bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hoe Wil Jij Werken Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 glass-violet text-neon-cyan border-electric-violet/20">
              Kies Je Werkwijze
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-pearl-white mb-4">
              Hoe wil jij werken?
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Self-service tools voor volledige controle, of managed service voor hands-off content
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Self-Service Card */}
            <Card className="glass-violet border-electric-violet/20 hover:border-electric-violet/40 transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-electric-violet to-soft-lavender mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-pearl-white mb-4">Zelf aan de slag met AI</h3>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
                    <span>12+ AI-powered tools voor alle content</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
                    <span>Blog Generator, Keyword Research, Video's</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
                    <span>Direct resultaat, jij hebt controle</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
                    <span>Betaal per credit (vanaf €29/maand)</span>
                  </li>
                </ul>
                <Link href="#tools">
                  <Button className="w-full btn-gradient-violet-cyan text-white font-semibold border-0">
                    Bekijk Tools
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Managed Service Card */}
            <Card className="glass-violet border-neon-cyan/20 hover:border-neon-cyan/40 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge className="bg-neon-cyan text-deep-space font-bold">POPULAIR</Badge>
              </div>
              <CardContent className="p-8">
                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-neon-cyan to-electric-violet mb-6 group-hover:scale-110 transition-transform">
                  <Handshake className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-pearl-white mb-4">Laat ons het regelen</h3>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
                    <span>Volledig contentplan op maat</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
                    <span>Wekelijks nieuwe SEO-content</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
                    <span>WordPress publicatie inclusief</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
                    <span>Persoonlijke accountmanager</span>
                  </li>
                </ul>
                <Link href="#managed-service">
                  <Button className="w-full btn-gradient-violet-cyan text-white font-semibold border-0">
                    Plan een Gesprek
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Tools Grid */}
      <section id="tools" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-midnight/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 glass-violet text-electric-violet border-electric-violet/20">
              Self-Service Tools
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-pearl-white mb-4">
              12+ AI-Powered Tools
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Professionele content tools voor elke use case
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiTools.map((tool, index) => (
              <Card
                key={index}
                className="glass-violet border-electric-violet/20 hover:border-electric-violet/40 transition-all duration-300 hover:scale-105 group"
              >
                <CardContent className="p-6">
                  <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-electric-violet to-neon-cyan mb-4 group-hover:scale-110 transition-transform text-white">
                    {tool.icon}
                  </div>
                  <h3 className="text-lg font-bold text-pearl-white mb-2">{tool.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{tool.description}</p>
                  <Badge variant="outline" className="text-neon-cyan border-neon-cyan/30 text-xs">
                    {tool.credits}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 glass-violet text-neon-cyan border-electric-violet/20">
              Platform Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-pearl-white mb-4">
              Alles wat je nodig hebt
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Enterprise-grade features voor professionele content creatie
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="glass-violet border-slate/30 hover:border-electric-violet/40 transition-all duration-300 group text-center"
              >
                <CardContent className="p-6">
                  <div className="inline-flex p-3 rounded-xl bg-electric-violet/10 mb-4 group-hover:bg-electric-violet/20 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-pearl-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Managed Service Section */}
      <section id="managed-service" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-midnight/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 glass-violet text-neon-cyan border-neon-cyan/20">
                Managed Service
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-pearl-white mb-6">
                Geen tijd? Wij doen het voor je.
              </h2>
              <p className="text-lg text-gray-300 mb-8">
                Laat content over aan de experts. Wij maken een volledig contentplan op maat, schrijven wekelijks 
                nieuwe SEO-geoptimaliseerde artikelen en publiceren ze direct op je WordPress website.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4 p-4 glass-violet rounded-lg">
                  <div className="flex-shrink-0 p-2 bg-electric-violet/10 rounded-lg">
                    <Calendar className="w-6 h-6 text-electric-violet" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-pearl-white mb-1">Contentplan op Maat</h4>
                    <p className="text-sm text-gray-400">Strategische planning afgestemd op jouw doelgroep en doelen</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 glass-violet rounded-lg">
                  <div className="flex-shrink-0 p-2 bg-neon-cyan/10 rounded-lg">
                    <FileText className="w-6 h-6 text-neon-cyan" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-pearl-white mb-1">Wekelijkse Content</h4>
                    <p className="text-sm text-gray-400">Professionele artikelen, volledig SEO-geoptimaliseerd</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 glass-violet rounded-lg">
                  <div className="flex-shrink-0 p-2 bg-soft-lavender/10 rounded-lg">
                    <UserCheck className="w-6 h-6 text-soft-lavender" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-pearl-white mb-1">Persoonlijke Manager</h4>
                    <p className="text-sm text-gray-400">Direct contact met je eigen contentmanager</p>
                  </div>
                </div>
              </div>
              <Link href="/contact">
                <Button size="lg" className="btn-gradient-violet-cyan text-white font-semibold border-0">
                  Plan een Vrijblijvend Gesprek
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            <div className="relative">
              <div className="glass-violet rounded-2xl p-8 border border-electric-violet/20 glow-violet">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-pearl-white mb-2">Managed Service</h3>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-sm text-gray-400">Vanaf</span>
                    <span className="text-5xl font-bold bg-gradient-to-r from-electric-violet to-neon-cyan bg-clip-text text-transparent">€499</span>
                    <span className="text-gray-400">/maand</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-neon-cyan flex-shrink-0" />
                    <span>4-8 artikelen per maand</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-neon-cyan flex-shrink-0" />
                    <span>Volledig contentplan</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-neon-cyan flex-shrink-0" />
                    <span>WordPress publicatie</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-neon-cyan flex-shrink-0" />
                    <span>SEO-optimalisatie</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-neon-cyan flex-shrink-0" />
                    <span>AI-afbeeldingen inclusief</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-neon-cyan flex-shrink-0" />
                    <span>Persoonlijke accountmanager</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-neon-cyan flex-shrink-0" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <Link href="/contact">
                  <Button className="w-full btn-gradient-violet-cyan text-white font-semibold border-0">
                    Neem Contact Op
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 glass-violet text-electric-violet border-electric-violet/20">
              Prijzen
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-pearl-white mb-4">
              Kies het plan dat bij je past
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Transparante prijzen zonder verborgen kosten. Start vandaag nog.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`glass-violet transition-all duration-300 relative ${
                  plan.popular
                    ? 'border-neon-cyan/40 scale-105 glow-cyan'
                    : 'border-electric-violet/20 hover:border-electric-violet/40'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-neon-cyan text-deep-space font-bold">POPULAIR</Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-pearl-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl font-bold text-pearl-white">{plan.price}</span>
                    <span className="text-gray-400">{plan.period}</span>
                  </div>
                  <p className="text-neon-cyan font-semibold mb-6">{plan.credits}</p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-300">
                        <Check className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/registreren">
                    <Button
                      className={`w-full font-semibold ${
                        plan.popular
                          ? 'btn-gradient-violet-cyan text-white border-0'
                          : 'border-electric-violet text-pearl-white hover:bg-electric-violet/10'
                      }`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      Start Nu
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-midnight/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 glass-violet text-neon-cyan border-electric-violet/20">
              Succesverhalen
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-pearl-white mb-4">
              Wat onze klanten zeggen
            </h2>
            <p className="text-lg text-gray-300">
              Echte resultaten van tevreden gebruikers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="glass-violet border-slate/30 hover:border-electric-violet/40 transition-all">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-neon-cyan text-neon-cyan" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 italic">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-electric-violet to-neon-cyan flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-pearl-white">{testimonial.name}</div>
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
          <Card className="relative overflow-hidden border-0">
            <div className="absolute inset-0 bg-gradient-to-r from-electric-violet via-soft-lavender to-neon-cyan opacity-100" />
            <CardContent className="p-12 text-center relative z-10">
              <Sparkles className="w-12 h-12 text-white mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Klaar om te starten?
              </h2>
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                Begin vandaag nog met professionele content creatie. Kies self-service of managed service.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/registreren">
                  <Button size="lg" className="bg-white text-electric-violet hover:bg-gray-100 px-8 h-12 text-lg font-semibold border-0">
                    Gratis Proberen
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="#managed-service">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 h-12 text-lg font-semibold">
                    Managed Service
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-white/80 mt-4">
                Geen creditcard nodig • Direct starten • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-electric-violet to-neon-cyan bg-clip-text text-transparent mb-4">
                WritGo AI
              </h3>
              <p className="text-gray-400 mb-4">
                Het AI Content Platform. Self-service tools of managed service - kies wat bij jou past.
              </p>
              <div className="flex gap-4">
                <Link href="/privacy" className="text-gray-400 hover:text-neon-cyan transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="text-gray-400 hover:text-neon-cyan transition-colors">
                  Voorwaarden
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-pearl-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="#tools" className="text-gray-400 hover:text-neon-cyan transition-colors">AI Tools</Link></li>
                <li><Link href="#pricing" className="text-gray-400 hover:text-neon-cyan transition-colors">Prijzen</Link></li>
                <li><Link href="#managed-service" className="text-gray-400 hover:text-neon-cyan transition-colors">Managed Service</Link></li>
                <li><Link href="/inloggen" className="text-gray-400 hover:text-neon-cyan transition-colors">Inloggen</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-pearl-white mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="text-gray-400">support@writgo.nl</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate/30 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} WritGo. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
// Updated with 2026 Design Trends - Dec 2025
