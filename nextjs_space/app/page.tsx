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
            <div className="absolute inset-0 border-4 border-writgo-primary/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-writgo-primary border-t-transparent rounded-full animate-spin" />
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
      description: "Creëer AI-gegenereerde video's",
      credits: '120 credits',
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: 'Social Media Studio',
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
      icon: <Target className="w-6 h-6" />,
      title: 'Link Building',
      description: 'SEO linkbuilding strategieën',
      credits: '50 credits',
    },
    {
      icon: <Newspaper className="w-6 h-6" />,
      title: 'News Articles',
      description: 'Actuele nieuwsartikelen schrijven',
      credits: '60 credits',
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: 'Code Generator',
      description: 'Genereer code snippets en scripts',
      credits: '30 credits',
    },
    {
      icon: <Layout className="w-6 h-6" />,
      title: 'Content Library',
      description: 'Toegang tot content bibliotheek',
      credits: 'Gratis',
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'WordPress Integratie',
      description: 'Direct publiceren naar WordPress',
      credits: 'Gratis',
    },
  ];

  const features = [
    {
      icon: <Sparkles className="w-6 h-6 text-writgo-primary" />,
      title: 'Nieuwste AI Modellen',
      description: 'GPT-5.1, Claude 4.5, Gemini 2.0',
    },
    {
      icon: <Search className="w-6 h-6 text-writgo-secondary" />,
      title: 'SEO Geoptimaliseerd',
      description: 'Rank hoger in Google',
    },
    {
      icon: <Zap className="w-6 h-6 text-writgo-primary" />,
      title: '10x Sneller',
      description: 'Dan handmatig schrijven',
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-writgo-secondary" />,
      title: 'Tone of Voice',
      description: 'Volledig aanpasbaar',
    },
    {
      icon: <Award className="w-6 h-6 text-writgo-primary" />,
      title: '100% Unieke Content',
      description: 'Geen duplicaten',
    },
    {
      icon: <Languages className="w-6 h-6 text-writgo-secondary" />,
      title: 'Multi-Language',
      description: '30+ talen ondersteund',
    },
    {
      icon: <Image className="w-6 h-6 text-writgo-primary" />,
      title: 'AI Afbeeldingen',
      description: 'Automatisch gegenereerd',
    },
    {
      icon: <Shield className="w-6 h-6 text-writgo-secondary" />,
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
      subtitle: '~14 blogs',
      features: [
        'Alle AI modellen',
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
      subtitle: '~42 blogs',
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
      subtitle: '~142 blogs',
      features: [
        'Alle Professional features',
        'Multi-user accounts',
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
      <section className="relative overflow-hidden pt-32 pb-20 px-4 sm:px-6 lg:px-8 text-center">
        {/* Animated background with gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-writgo-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-writgo-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-writgo-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-writgo-secondary rounded-full backdrop-blur-sm animate-fade-in">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">AI Content Platform - Nieuw: GPT-5.1 & Claude 4.5</span>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-pearl-white animate-fade-in">
              Genereer SEO-blogs in
              <br />
              <span className="text-pearl-white">
                minuten, niet in uren.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-text-muted max-w-3xl mx-auto animate-fade-in">
              Het AI-platform voor content creatie. Doe het zelf met onze tools, of laat ons team het volledig voor je regelen.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
              <Link href="/registreren">
                <Button size="lg" className="btn-gradient-orange text-white px-8 h-12 text-lg font-semibold group border-0">
                  Start Gratis - 1000 Credits
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#managed-service">
                <Button size="lg" variant="outline" className="border-pearl-white text-pearl-white hover:bg-white/10 px-8 h-12 text-lg font-semibold">
                  Bekijk Managed Service
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 pt-8 animate-fade-in">
              <div className="flex items-center gap-2 text-pearl-white">
                <Check className="w-5 h-5 text-pearl-white" />
                <span className="text-sm">Geen creditcard</span>
              </div>
              <div className="flex items-center gap-2 text-pearl-white">
                <Check className="w-5 h-5 text-pearl-white" />
                <span className="text-sm">Direct starten</span>
              </div>
              <div className="flex items-center gap-2 text-pearl-white">
                <Check className="w-5 h-5 text-pearl-white" />
                <span className="text-sm">Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-border-dark text-center">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-writgo-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-pearl-white">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hoe Wil Jij Werken Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-writgo-secondary text-white border-0">
              Kies Je Werkwijze
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-pearl-white mb-4">
              Hoe wil jij werken?
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Self-service tools voor volledige controle, of managed service voor hands-off content
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 justify-items-center">
            {/* Self-Service Card */}
            <Card className="glass-dark border-border-dark hover:border-writgo-primary/40 transition-all duration-300 group text-center max-w-xl w-full">
              <CardContent className="p-8">
                <div className="inline-flex p-4 rounded-2xl bg-writgo-primary mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-pearl-white mb-4">Zelf aan de slag met AI</h3>
                <ul className="space-y-3 mb-6 text-left inline-block">
                  <li className="flex items-start gap-3 text-text-muted">
                    <Check className="w-5 h-5 text-writgo-secondary flex-shrink-0 mt-0.5" />
                    <span>12+ AI-powered tools</span>
                  </li>
                  <li className="flex items-start gap-3 text-text-muted">
                    <Check className="w-5 h-5 text-writgo-secondary flex-shrink-0 mt-0.5" />
                    <span>Blog Generator, Keyword Research, Video's</span>
                  </li>
                  <li className="flex items-start gap-3 text-text-muted">
                    <Check className="w-5 h-5 text-writgo-secondary flex-shrink-0 mt-0.5" />
                    <span>Direct resultaat, jij hebt controle</span>
                  </li>
                  <li className="flex items-start gap-3 text-text-muted">
                    <Check className="w-5 h-5 text-writgo-secondary flex-shrink-0 mt-0.5" />
                    <span>Betaal per credit (vanaf €29/maand)</span>
                  </li>
                </ul>
                <Link href="#tools" className="block">
                  <span className="text-writgo-secondary hover:underline font-semibold inline-flex items-center">
                    Bekijk Tools <ArrowRight className="ml-2 w-4 h-4" />
                  </span>
                </Link>
              </CardContent>
            </Card>

            {/* Managed Service Card */}
            <Card className="glass-dark border-border-dark hover:border-writgo-primary/40 transition-all duration-300 group text-center max-w-xl w-full">
              <CardContent className="p-8">
                <div className="inline-flex p-4 rounded-2xl bg-writgo-primary mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-pearl-white mb-4">Laat ons het regelen</h3>
                <ul className="space-y-3 mb-6 text-left inline-block">
                  <li className="flex items-start gap-3 text-text-muted">
                    <Check className="w-5 h-5 text-writgo-secondary flex-shrink-0 mt-0.5" />
                    <span>Volledig contentplan op maat</span>
                  </li>
                  <li className="flex items-start gap-3 text-text-muted">
                    <Check className="w-5 h-5 text-writgo-secondary flex-shrink-0 mt-0.5" />
                    <span>Wekelijks nieuwe SEO-content</span>
                  </li>
                  <li className="flex items-start gap-3 text-text-muted">
                    <Check className="w-5 h-5 text-writgo-secondary flex-shrink-0 mt-0.5" />
                    <span>WordPress publicatie inclusief</span>
                  </li>
                  <li className="flex items-start gap-3 text-text-muted">
                    <Check className="w-5 h-5 text-writgo-secondary flex-shrink-0 mt-0.5" />
                    <span>Persoonlijke accountmanager</span>
                  </li>
                </ul>
                <Link href="#managed-service" className="block">
                  <span className="text-writgo-secondary hover:underline font-semibold inline-flex items-center">
                    Plan een Gesprek <ArrowRight className="ml-2 w-4 h-4" />
                  </span>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Tools Grid */}
      <section id="tools" className="py-20 px-4 sm:px-6 lg:px-8 bg-surface/50 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-writgo-secondary text-white border-0">
              Self-Service Tools
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-pearl-white mb-4">
              12+ AI-Powered Tools
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Professionele content tools voor elke use case
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
            {aiTools.map((tool, index) => (
              <Card
                key={index}
                className="glass-dark border-border-dark hover:border-writgo-primary/40 transition-all duration-300 hover:scale-105 group text-center max-w-xs w-full"
              >
                <CardContent className="p-6">
                  <div className="inline-flex p-3 rounded-xl bg-writgo-primary mb-4 group-hover:scale-110 transition-transform text-white">
                    {tool.icon}
                  </div>
                  <h3 className="text-lg font-bold text-pearl-white mb-2">{tool.title}</h3>
                  <p className="text-text-muted text-sm mb-3">{tool.description}</p>
                  <Badge variant="outline" className="text-writgo-secondary border-writgo-secondary/30 text-xs">
                    {tool.credits}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-writgo-secondary text-white border-0">
              Platform Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-pearl-white mb-4">
              Alles wat je nodig hebt
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Enterprise-grade features voor professionele content creatie
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="glass-dark border-border-dark hover:border-writgo-primary/40 transition-all duration-300 group text-center max-w-xs w-full"
              >
                <CardContent className="p-6">
                  <div className="inline-flex p-3 rounded-xl bg-surface mb-4 group-hover:bg-writgo-primary/10 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-pearl-white mb-2">{feature.title}</h3>
                  <p className="text-text-muted text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Managed Service Section */}
      <section id="managed-service" className="py-20 px-4 sm:px-6 lg:px-8 bg-surface/50 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-writgo-secondary text-white border-0">
              Managed Service
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-pearl-white mb-6">
              Geen tijd? Wij doen het voor je.
            </h2>
            <p className="text-lg text-text-muted max-w-3xl mx-auto mb-8">
              Laat content over aan de experts. Wij maken een volledig contentplan op maat, schrijven wekelijks 
              nieuwe SEO-geoptimaliseerde artikelen en publiceren ze direct op je WordPress website.
            </p>
          </div>

          <div className="max-w-4xl mx-auto mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="flex items-start gap-4 p-4 glass-dark rounded-lg text-left">
                <div className="flex-shrink-0 p-2 bg-writgo-primary/10 rounded-lg">
                  <Calendar className="w-6 h-6 text-writgo-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-pearl-white mb-1">Maandelijks contentplan</h4>
                  <p className="text-sm text-text-muted">Strategische planning afgestemd op jouw doelgroep</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 glass-dark rounded-lg text-left">
                <div className="flex-shrink-0 p-2 bg-writgo-primary/10 rounded-lg">
                  <FileText className="w-6 h-6 text-writgo-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-pearl-white mb-1">X blogs per maand</h4>
                  <p className="text-sm text-text-muted">Professionele artikelen, volledig SEO-geoptimaliseerd</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 glass-dark rounded-lg text-left">
                <div className="flex-shrink-0 p-2 bg-writgo-primary/10 rounded-lg">
                  <Globe className="w-6 h-6 text-writgo-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-pearl-white mb-1">WordPress publicatie</h4>
                  <p className="text-sm text-text-muted">Automatisch gepubliceerd op jouw website</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 glass-dark rounded-lg text-left">
                <div className="flex-shrink-0 p-2 bg-writgo-primary/10 rounded-lg">
                  <BarChart className="w-6 h-6 text-writgo-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-pearl-white mb-1">Rapportages</h4>
                  <p className="text-sm text-text-muted">Maandelijkse performance rapportages</p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="glass-dark rounded-2xl p-8 border border-border-dark glow-orange">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-pearl-white mb-2">Managed Service</h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-sm text-text-muted">Vanaf</span>
                  <span className="text-5xl font-bold text-writgo-primary">€499</span>
                  <span className="text-text-muted">/maand</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8 text-left max-w-md mx-auto">
                <li className="flex items-center gap-3 text-text-muted">
                  <Check className="w-5 h-5 text-writgo-secondary flex-shrink-0" />
                  <span>4-8 artikelen per maand</span>
                </li>
                <li className="flex items-center gap-3 text-text-muted">
                  <Check className="w-5 h-5 text-writgo-secondary flex-shrink-0" />
                  <span>Volledig contentplan</span>
                </li>
                <li className="flex items-center gap-3 text-text-muted">
                  <Check className="w-5 h-5 text-writgo-secondary flex-shrink-0" />
                  <span>WordPress publicatie</span>
                </li>
                <li className="flex items-center gap-3 text-text-muted">
                  <Check className="w-5 h-5 text-writgo-secondary flex-shrink-0" />
                  <span>SEO-optimalisatie</span>
                </li>
                <li className="flex items-center gap-3 text-text-muted">
                  <Check className="w-5 h-5 text-writgo-secondary flex-shrink-0" />
                  <span>Persoonlijke accountmanager</span>
                </li>
              </ul>
              <Link href="/contact">
                <Button size="lg" className="w-full btn-gradient-orange text-white font-semibold border-0">
                  Plan een Vrijblijvend Gesprek
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-writgo-secondary text-white border-0">
              Prijzen
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-pearl-white mb-4">
              Kies het plan dat bij je past
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Transparante prijzen zonder verborgen kosten. Start vandaag nog.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto justify-items-center">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`glass-dark transition-all duration-300 relative text-center max-w-sm w-full ${
                  plan.popular
                    ? 'border-writgo-primary scale-105 glow-orange'
                    : 'border-border-dark hover:border-writgo-primary/40'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-writgo-primary text-white font-bold border-0">POPULAIR</Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-pearl-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-2 mb-1">
                    <span className="text-4xl font-bold text-pearl-white">{plan.price}</span>
                    <span className="text-text-muted">{plan.period}</span>
                  </div>
                  <p className="text-writgo-secondary font-semibold mb-2">{plan.credits}</p>
                  <p className="text-text-muted text-sm mb-6">{plan.subtitle}</p>
                  <ul className="space-y-3 mb-8 text-left inline-block">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-text-muted">
                        <Check className="w-5 h-5 text-writgo-secondary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/registreren">
                    <Button
                      className={`w-full font-semibold ${
                        plan.popular
                          ? 'btn-gradient-orange text-white border-0'
                          : 'border-pearl-white text-pearl-white hover:bg-white/10'
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface/50 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-writgo-secondary text-white border-0">
              Succesverhalen
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-pearl-white mb-4">
              Wat onze klanten zeggen
            </h2>
            <p className="text-lg text-text-muted">
              Echte resultaten van tevreden gebruikers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="glass-dark border-border-dark hover:border-writgo-primary/40 transition-all text-center max-w-sm w-full">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4 justify-center">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-writgo-primary text-writgo-primary" />
                    ))}
                  </div>
                  <p className="text-pearl-white mb-6 italic">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3 justify-center">
                    <div className="w-10 h-10 rounded-full bg-writgo-primary flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-pearl-white">{testimonial.name}</div>
                      <div className="text-sm text-text-muted">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <Card className="relative overflow-hidden border-0">
            <div className="absolute inset-0 bg-gradient-to-r from-writgo-primary/80 to-writgo-primary opacity-100" />
            <CardContent className="p-12 text-center relative z-10">
              <Sparkles className="w-12 h-12 text-white mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Klaar om te beginnen?
              </h2>
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                Begin vandaag nog met professionele content creatie. Kies self-service of managed service.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/registreren">
                  <Button size="lg" className="bg-white text-writgo-primary hover:bg-gray-100 px-8 h-12 text-lg font-semibold border-0">
                    Start Gratis
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="#managed-service">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 h-12 text-lg font-semibold">
                    Plan een Gesprek
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
      <footer className="border-t border-border-dark py-12 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2 text-center md:text-left">
              <h3 className="text-2xl font-bold text-writgo-primary mb-4">
                WritGo
              </h3>
              <p className="text-text-muted mb-4">
                Het AI Content Platform. Self-service tools of managed service - kies wat bij jou past.
              </p>
              <div className="flex gap-4 justify-center md:justify-start">
                <Link href="/privacy" className="text-text-muted hover:text-pearl-white transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="text-text-muted hover:text-pearl-white transition-colors">
                  Voorwaarden
                </Link>
              </div>
            </div>

            <div className="text-center md:text-left">
              <h4 className="font-semibold text-pearl-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="#tools" className="text-text-muted hover:text-pearl-white transition-colors">AI Tools</Link></li>
                <li><Link href="#pricing" className="text-text-muted hover:text-pearl-white transition-colors">Prijzen</Link></li>
                <li><Link href="#managed-service" className="text-text-muted hover:text-pearl-white transition-colors">Managed Service</Link></li>
                <li><Link href="/inloggen" className="text-text-muted hover:text-pearl-white transition-colors">Inloggen</Link></li>
              </ul>
            </div>

            <div className="text-center md:text-left">
              <h4 className="font-semibold text-pearl-white mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="text-text-muted">support@writgo.nl</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border-dark pt-8 text-center text-text-muted text-sm">
            <p>&copy; {new Date().getFullYear()} WritGo. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
// Updated with 2026 Design Trends - Dec 2025
