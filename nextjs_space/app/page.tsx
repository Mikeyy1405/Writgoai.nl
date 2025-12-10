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
  Share2, BarChart, Clock, Shield,
  Target, Bot, Award, Languages,
  MessageSquare, Calendar, Eye, EyeOff, X, Play, CheckCircle2,
  Scissors, PenTool, Wrench, Hammer, Stethoscope, Home
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
          <p className="text-xl text-pearl-white font-semibold">Writgo Media wordt geladen...</p>
        </div>
      </div>
    );
  }

  const problemPoints = [
    {
      icon: <Search className="w-8 h-8" />,
      title: '🔍 Onzichtbaar op Google',
      points: [
        'Je concurrent staat #1, jij op pagina 3',
        '95% van clicks gaat naar top 3',
        'Gemiste omzet: €2.000-€10.000/maand'
      ],
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: '⏰ Geen Tijd voor Marketing',
      points: [
        'Je bent loodgieter, geen influencer',
        'Social media vergeet je steeds',
        'Marketing is altijd "voor later"'
      ],
    },
    {
      icon: <X className="w-8 h-8" />,
      title: '💸 Bureaus Zijn Te Duur',
      points: [
        'Quotes van €1.500-€5.000/maand',
        'Eindeloze meetings en calls',
        'Lange contracten, onduidelijke ROI'
      ],
    },
  ];

  const omnipresenceChannels = [
    {
      icon: <Search className="w-8 h-8" />,
      title: '🔍 Google (SEO)',
      description: 'SEO-geoptimaliseerde blog articles',
      details: ['Pillar/cluster strategie', 'Lokale keywords', 'Rank in top 3 voor jouw regio'],
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: '💼 LinkedIn',
      description: 'Thought leadership posts',
      details: ['B2B exposure', 'Professionele uitstraling', '3-4x per week automatisch'],
    },
    {
      icon: <Image className="w-8 h-8" />,
      title: '📸 Instagram',
      description: 'Carrousels, quotes, tips',
      details: ['Stories templates', 'Engagement content', 'Visueel aanwezig bij je doelgroep'],
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: '🎬 YouTube/Video',
      description: 'Faceless video\'s (30-60 sec)',
      details: ['AI voiceover Nederlands', 'YouTube Shorts + Reels', 'Viral bereik zonder camera'],
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: '📍 Google Mijn Bedrijf',
      description: 'Lokale SEO boost',
      details: ['Updates en offers', 'Map pack rankings', 'Verschijn in "near me" zoekopdrachten'],
    },
  ];

  const howItWorksSteps = [
    {
      number: '1',
      title: 'Kies Je Pakket',
      time: '5 min',
      description: 'Selecteer INSTAPPER, STARTER, GROEI of DOMINANT. Kies wat past bij jouw ambities.',
    },
    {
      number: '2',
      title: 'Vul Onboarding In',
      time: '10 min',
      description: 'Eenmalige vragenlijst over je bedrijf, doelgroep en tone-of-voice. Dat is alles.',
    },
    {
      number: '3',
      title: 'AI Genereert Content',
      time: 'automatisch',
      description: 'Onze 400+ AI modellen maken SEO artikelen, social posts en video\'s. Op maat voor jouw branche.',
    },
    {
      number: '4',
      title: 'Content Wordt Gepubliceerd',
      time: 'automatisch',
      description: 'Alles gaat automatisch live op WordPress, LinkedIn, Instagram, Google Mijn Bedrijf, etc.',
    },
    {
      number: '5',
      title: 'Bekijk Resultaten in Dashboard',
      time: 'real-time',
      description: 'Volg je groei in traffic, rankings en engagement. Maandelijkse PDF rapportage in je inbox.',
    },
  ];

  const pricingPackages = [
    {
      name: 'INSTAPPER',
      price: '€197',
      period: '/maand',
      description: 'Ideaal voor: Starters, kleine budgetten',
      features: [
        '✅ 2 SEO Artikelen (800-1200 woorden)',
        '✅ 16 Social Media Posts',
        '✅ 4 Faceless video\'s',
        '✅ Platform flexibiliteit',
        '✅ Automatische posting',
      ],
      popular: false,
    },
    {
      name: 'STARTER',
      price: '€297',
      period: '/maand',
      description: 'Ideaal voor: SEO autoriteit opbouwen',
      features: [
        '✅ 1 Pillar + 2 Cluster Artikelen',
        '✅ 16 Social Media Posts',
        '✅ 4 Faceless video\'s',
        '✅ Pillar-Cluster strategie',
        '✅ Automatische posting',
      ],
      popular: false,
    },
    {
      name: 'GROEI',
      price: '€497',
      period: '/maand',
      description: 'Ideaal voor: Ambitieuze ondernemers',
      features: [
        '✅ 1 Pillar + 3 Cluster Artikelen',
        '✅ 24 Social Media Posts',
        '✅ 8 Faceless video\'s',
        '✅ Pillar-Cluster strategie',
        '✅ Priority support',
      ],
      popular: true,
    },
    {
      name: 'DOMINANT',
      price: '€797',
      period: '/maand',
      description: 'Ideaal voor: Marktleiders',
      features: [
        '✅ 2 Pillar + 4 Cluster Artikelen',
        '✅ 40 Social Media Posts',
        '✅ 12 Faceless video\'s',
        '✅ Advanced strategie',
        '✅ Dedicated account manager',
      ],
      popular: false,
    },
  ];

  const technologyFeatures = [
    {
      icon: <Bot className="w-8 h-8" />,
      title: '🤖 400+ AI Modellen',
      description: 'GPT-4, Claude, Gemini, Llama, Mistral',
      details: 'Beste model per taak automatisch gekozen via onze slimme AI technologie',
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: '📅 Auto-Publishing',
      description: 'LinkedIn, Instagram, X automatisch',
      details: 'WordPress blog publicatie, Google Mijn Bedrijf updates. Geen handmatig werk.',
    },
    {
      icon: <BarChart className="w-8 h-8" />,
      title: '📊 Real-time Analytics',
      description: 'Dashboard met alle metrics',
      details: 'Traffic, engagement, rankings. Maandelijkse rapportage (PDF).',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: '🚀 5 Minuten Setup',
      description: 'Checkout → content binnen 24 uur',
      details: 'Geen onboarding calls. Self-service wizard.',
    },
    {
      icon: <X className="w-8 h-8" />,
      title: '❌ Geen Calls, Geen Meetings',
      description: '100% self-service',
      details: 'AI chatbot voor support. Zero-touch model.',
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: '✅ Lokale SEO Expertise',
      description: '8 jaar ervaring',
      details: 'Industrie-specifieke prompts. Nederlandse markt focus.',
    },
  ];

  const targetAudiences = [
    { icon: <Scissors className="w-6 h-6" />, title: '💇 Kappers & Schoonheidssalons' },
    { icon: <Stethoscope className="w-6 h-6" />, title: '🦷 Tandartsen & Mondhygiënisten' },
    { icon: <Wrench className="w-6 h-6" />, title: '🔧 Installateurs & Loodgieters' },
    { icon: <Target className="w-6 h-6" />, title: '🏃 Fysiotherapeuten & Zorg' },
    { icon: <Home className="w-6 h-6" />, title: '🏠 Makelaars & Vastgoed' },
    { icon: <Hammer className="w-6 h-6" />, title: '🔨 Klus- & Onderhoudsbedrijven' },
  ];

  const caseStudies = [
    {
      title: 'Tandartspraktijk Amsterdam',
      subtitle: 'GROEI pakket',
      before: 'Voor: 50 bezoekers/maand, pagina 3 Google',
      after: 'Na 3 maanden: 450 bezoekers/maand (+800%)',
      results: ['7 keywords in top 3', 'ROI: 600-1.500%'],
      icon: <TrendingUp className="w-8 h-8 text-writgo-primary" />,
    },
    {
      title: 'Installatiebedrijf Rotterdam',
      subtitle: 'GROEI pakket',
      before: 'Voor: 0 social media presence',
      after: 'Na 6 maanden: 1.200+ LinkedIn connecties',
      results: ['Wekelijkse leads via LinkedIn', 'Uitgegroeid naar 5 medewerkers'],
      icon: <Award className="w-8 h-8 text-writgo-primary" />,
    },
    {
      title: 'Kapsalon Utrecht',
      subtitle: 'STARTER → GROEI upgrade',
      before: 'Voor: 200 Instagram volgers',
      after: 'Na 9 maanden: 2.000+ volgers',
      results: ['30+ Google reviews (4.8★)', 'Agenda 3 weken vol geboekt'],
      icon: <Calendar className="w-8 h-8 text-writgo-primary" />,
    },
  ];

  const faqs = [
    {
      question: 'Hoeveel tijd kost het mij?',
      answer: '0 minuten per maand. Alles is volledig geautomatiseerd. Je vult 1x het onboarding formulier in (5 min), daarna regelen wij alles.',
    },
    {
      question: 'Moet ik content goedkeuren voordat het live gaat?',
      answer: 'Nee, standaard publiceren wij automatisch. Je kunt content wel bekijken in je dashboard (24u vooraf) en wijzigingen aanvragen via de chat.',
    },
    {
      question: 'Hoe snel zie ik resultaat?',
      answer: 'Social media: direct zichtbaar (week 1). SEO rankings: 2-3 maanden (Google is traag). Omnipresence effect: 3-6 maanden voor volledige dominantie.',
    },
    {
      question: 'Kan ik maandelijks opzeggen?',
      answer: 'Ja, geen contract. Opzeggen kan tot de 15e van de maand. Geen vragen, geen gedoe.',
    },
    {
      question: 'Wat als ik niet tevreden ben?',
      answer: '30 dagen niet-goed-geld-terug garantie. Geen risico.',
    },
    {
      question: 'Schrijft AI echt alles?',
      answer: 'Ja, 400+ AI modellen. Wij kiezen automatisch het beste model per taak. Claude voor lange artikelen, GPT-4 voor social posts, Llama voor video scripts.',
    },
    {
      question: 'Werkt het voor mijn branche?',
      answer: 'Voor alle lokale dienstverleners: kappers, tandartsen, installateurs, fysiotherapeuten, makelaars, garages, rijscholen, etc.',
    },
    {
      question: 'Heb ik meetings of calls nodig?',
      answer: 'Nee, 100% self-service. Geen sales calls, geen intake meetings, geen maandelijkse check-ins. Alles via dashboard + AI chatbot.',
    },
    {
      question: 'Wat is omnipresence precies?',
      answer: 'Overal zichtbaar zijn waar je klanten zoeken: Google, LinkedIn, Instagram, YouTube, Google Mijn Bedrijf. Rule of 7: klanten moeten je 7x zien voordat ze kopen.',
    },
    {
      question: 'Waarom €197-€797 en niet €2.000+ zoals bureaus?',
      answer: 'AI doet het werk, niet mensen. Geen personeel = lage kosten. Wij geven die besparing door aan jou.',
    },
    {
      question: 'Wat als ik geen WordPress website heb?',
      answer: 'Wij kunnen een simpele WordPress site voor je hosten (jouwbedrijf.writgo.nl) of je blogs leveren als content pakket (copy-paste).',
    },
    {
      question: 'Kan ik mijn social media accounts koppelen?',
      answer: 'Ja, via OAuth (LinkedIn, Instagram). Als je niet koppelt, sturen we je content wekelijks via email (copy-paste ready).',
    },
    {
      question: 'Wat is het verschil tussen Pillar en Cluster artikelen?',
      answer: 'Pillar = uitgebreide gids (2.500-3.000 woorden) over een hoofdonderwerp. Clusters = kortere artikelen (1.200-1.500 woorden) over specifieke subtopics. Deze strategie domineert Google.',
    },
    {
      question: 'Krijg ik rapportages?',
      answer: 'Ja, wekelijkse email updates + maandelijkse PDF rapportage. Plus real-time dashboard met traffic, engagement, rankings.',
    },
    {
      question: 'Hoe werkt de 30 dagen garantie?',
      answer: 'Niet tevreden in de eerste 30 dagen? Mail ons, geld terug. Geen vragen, geen gedoe.',
    },
  ];

  const stats = [
    { value: '400+', label: 'AI modellen' },
    { value: '5 min', label: 'Zero setup' },
    { value: '47+', label: 'Lokale dienstverleners' },
    { value: '4.9/5', label: '⭐ (23 reviews)' },
  ];

  return (
    <div className="min-h-screen bg-deep-space">
      <PublicNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-40 pb-20 px-4 sm:px-6 lg:px-8 text-center">
        {/* Animated background with gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-writgo-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-writgo-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-writgo-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            {/* Main heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-pearl-white animate-fade-in leading-tight">
              100% AUTONOME AI CONTENT MARKETING
              <br />
              <span className="text-writgo-primary">
                SEO + SOCIAL MEDIA + VIDEO
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-text-muted max-w-3xl mx-auto animate-fade-in">
              Volledig Geautomatiseerd, Zonder Meetings
              <br className="hidden sm:block" />
              Vanaf €197/maand voor lokale dienstverleners
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
              <Link href="/registreren">
                <Button size="lg" className="btn-gradient-orange text-white px-8 h-12 text-lg font-semibold group border-0">
                  Start Nu
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/prijzen">
                <Button size="lg" variant="outline" className="border-pearl-white text-pearl-white hover:bg-white/10 px-8 h-12 text-lg font-semibold group">
                  Bekijk Pakketten
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 pt-8 animate-fade-in">
              <div className="flex items-center gap-2 text-pearl-white">
                <Check className="w-5 h-5 text-writgo-secondary" />
                <span className="text-sm">400+ AI modellen</span>
              </div>
              <div className="flex items-center gap-2 text-pearl-white">
                <Check className="w-5 h-5 text-writgo-secondary" />
                <span className="text-sm">Zero setup (5 min)</span>
              </div>
              <div className="flex items-center gap-2 text-pearl-white">
                <Check className="w-5 h-5 text-writgo-secondary" />
                <span className="text-sm">Annuleer wanneer je wilt</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-border-dark text-center bg-surface/30">
        <div className="max-w-7xl mx-auto">
          <p className="text-pearl-white font-semibold mb-2">Vertrouwd door 47+ lokale dienstverleners</p>
          <div className="flex items-center justify-center gap-1 mb-4">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="ml-2 text-text-muted">4.9/5 (23 reviews)</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center mt-8">
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

      {/* Problem Section - Herken je dit? */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-writgo-secondary text-white border-0">
              Het Probleem
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-pearl-white mb-4">
              Herken je dit?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
            {problemPoints.map((point, index) => (
              <Card key={index} className="glass-dark border-border-dark hover:border-writgo-primary/40 transition-all duration-300 text-left max-w-sm w-full">
                <CardContent className="p-8">
                  <div className="inline-flex p-4 rounded-2xl bg-writgo-primary/10 mb-6 text-writgo-primary">
                    {point.icon}
                  </div>
                  <h3 className="text-xl font-bold text-pearl-white mb-4">{point.title}</h3>
                  <ul className="space-y-2">
                    {point.points.map((item, idx) => (
                      <li key={idx} className="text-text-muted flex items-start gap-2">
                        <span className="text-writgo-primary mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section - Omnipresence */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface/50 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-writgo-secondary text-white border-0">
              De Oplossing
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-pearl-white mb-4">
              Omnipresence = Overal Zichtbaar
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Wij zorgen dat je op alle kanalen aanwezig bent waar jouw klanten zijn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12 justify-items-center">
            {omnipresenceChannels.map((channel, index) => (
              <Card key={index} className="glass-dark border-border-dark hover:border-writgo-primary/40 transition-all duration-300 text-left max-w-xs w-full">
                <CardContent className="p-6">
                  <div className="inline-flex p-3 rounded-xl bg-writgo-primary mb-4 text-white">
                    {channel.icon}
                  </div>
                  <h3 className="text-lg font-bold text-pearl-white mb-2">{channel.title}</h3>
                  <p className="text-text-muted text-sm mb-3">{channel.description}</p>
                  <ul className="space-y-1">
                    {channel.details.map((detail, idx) => (
                      <li key={idx} className="text-text-muted text-xs flex items-start gap-1">
                        <Check className="w-3 h-3 text-writgo-secondary flex-shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xl text-pearl-white">
              En het mooie? Onze AI regelt <span className="text-writgo-primary font-bold">ALLES</span>. 
              Jij hoeft letterlijk <span className="text-writgo-primary font-bold">niets</span> te doen.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="hoe-het-werkt" className="py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-writgo-secondary text-white border-0">
              Volledig Geautomatiseerd
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-pearl-white mb-4">
              Hoe Het Werkt
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              5 stappen naar omnipresence - zonder dat jij er iets voor hoeft te doen
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 justify-items-center">
            {howItWorksSteps.map((step, index) => (
              <div key={index} className="text-center max-w-xs">
                <div className="relative mb-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-writgo-primary flex items-center justify-center text-white text-3xl font-bold">
                    {step.number}
                  </div>
                  {index < howItWorksSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-[60%] w-full h-0.5 bg-writgo-primary/30" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-pearl-white mb-2">{step.title}</h3>
                <Badge variant="outline" className="text-writgo-secondary border-writgo-secondary/30 mb-3">
                  {step.time}
                </Badge>
                <p className="text-text-muted text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section - Waarom Writgo Anders Is */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface/50 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-writgo-secondary text-white border-0">
              Technologie
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-pearl-white mb-4">
              POWERED BY 400+ AI MODELLEN
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Waarom Writgo anders is dan traditionele marketing bureaus
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {technologyFeatures.map((feature, index) => (
              <Card key={index} className="glass-dark border-border-dark hover:border-writgo-primary/40 transition-all duration-300 text-left max-w-sm w-full">
                <CardContent className="p-6">
                  <div className="inline-flex p-3 rounded-xl bg-writgo-primary/10 mb-4 text-writgo-primary">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-pearl-white mb-2">{feature.title}</h3>
                  <p className="text-text-muted text-sm mb-2">{feature.description}</p>
                  <p className="text-text-muted text-xs">{feature.details}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section id="pakketten" className="py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-writgo-secondary text-white border-0">
              Pakketten
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-pearl-white mb-4">
              KIES JE OMNIPRESENCE PAKKET
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Maandelijks opzegbaar • Geen setup kosten • 30 dagen garantie
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto justify-items-center mb-8">
            {pricingPackages.map((pkg, index) => (
              <Card
                key={index}
                className={`glass-dark transition-all duration-300 relative text-center w-full ${
                  pkg.popular
                    ? 'border-writgo-primary scale-105 glow-orange'
                    : 'border-border-dark hover:border-writgo-primary/40'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-writgo-primary text-white font-bold border-0">⭐ BEST SELLER</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-pearl-white mb-2">{pkg.name}</h3>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-3xl font-bold text-writgo-primary">{pkg.price}</span>
                    <span className="text-text-muted text-sm">{pkg.period}</span>
                  </div>
                  <p className="text-text-muted text-xs mb-4 italic">{pkg.description}</p>
                  <ul className="space-y-2 mb-6 text-left">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="text-text-muted text-sm">
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/registreren">
                    <Button
                      className={`w-full font-semibold ${
                        pkg.popular
                          ? 'btn-gradient-orange text-white border-0'
                          : 'border-pearl-white text-pearl-white hover:bg-white/10'
                      }`}
                      variant={pkg.popular ? 'default' : 'outline'}
                    >
                      Start met {pkg.name}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center space-y-2">
            <p className="text-text-muted">
              ✅ Maandelijks opzegbaar • ✅ Geen setup kosten • ✅ 30 dagen niet-goed-geld-terug garantie
            </p>
            <p className="text-sm text-text-muted italic">
              Geen contract. Geen gedoe. Gewoon resultaat.
            </p>
          </div>
        </div>
      </section>

      {/* Voor Wie Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-writgo-secondary text-white border-0">
              Voor Wie
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-pearl-white mb-4">
              SPECIAAL VOOR LOKALE DIENSTVERLENERS
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto mb-2">
              Die marktleider willen worden in hun regio
            </p>
            <p className="text-sm text-text-muted italic">
              En alle andere lokale dienstverleners die marktleider willen worden in hun regio.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 justify-items-center">
            {targetAudiences.map((audience, index) => (
              <Card key={index} className="glass-dark border-border-dark hover:border-writgo-primary/40 transition-all text-center w-full">
                <CardContent className="p-6">
                  <div className="inline-flex p-3 rounded-xl bg-writgo-primary mb-3 text-white">
                    {audience.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-pearl-white">{audience.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Results/Case Studies Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface/50 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-writgo-secondary text-white border-0">
              Resultaten
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-pearl-white mb-4">
              BEWEZEN RESULTATEN
            </h2>
            <p className="text-lg text-text-muted">
              Van onzichtbaar naar omnipresent
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
            {caseStudies.map((study, index) => (
              <Card key={index} className="glass-dark border-border-dark hover:border-writgo-primary/40 transition-all text-left max-w-sm w-full">
                <CardContent className="p-8">
                  <div className="mb-4">
                    {study.icon}
                  </div>
                  <h3 className="text-xl font-bold text-pearl-white mb-1">{study.title}</h3>
                  <Badge className="mb-4 bg-writgo-primary/20 text-writgo-primary border-0 text-xs">
                    {study.subtitle}
                  </Badge>
                  <p className="text-sm text-text-muted mb-2">{study.before}</p>
                  <p className="text-sm text-writgo-secondary font-semibold mb-3">{study.after}</p>
                  <ul className="space-y-1">
                    {study.results.map((result, idx) => (
                      <li key={idx} className="text-text-muted text-xs flex items-start gap-2">
                        <CheckCircle2 className="w-3 h-3 text-writgo-secondary flex-shrink-0 mt-0.5" />
                        <span>{result}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-writgo-secondary text-white border-0">
              Veelgestelde Vragen
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-pearl-white mb-4">
              VEELGESTELDE VRAGEN
            </h2>
            <p className="text-lg text-text-muted">
              Alles wat je moet weten over Writgo Omnipresence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {faqs.map((faq, index) => (
              <Card key={index} className="glass-dark border-border-dark hover:border-writgo-primary/40 transition-all">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-pearl-white mb-2">{faq.question}</h3>
                  <p className="text-text-muted">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface/50 text-center">
        <div className="max-w-4xl mx-auto">
          <Card className="relative overflow-hidden border-0">
            <div className="absolute inset-0 bg-gradient-to-r from-writgo-primary/80 to-writgo-primary opacity-100" />
            <CardContent className="p-12 text-center relative z-10">
              <Sparkles className="w-12 h-12 text-white mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                KLAAR OM JE CONCURRENTIE TE DOMINEREN?
              </h2>
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                Start vandaag. Geen gedoe. Geen meetings. Gewoon resultaat.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="#pakketten">
                  <Button size="lg" className="bg-white text-writgo-primary hover:bg-gray-100 px-8 h-12 text-lg font-semibold border-0">
                    Kies Je Pakket en Start Direct →
                  </Button>
                </a>
              </div>
              <p className="text-sm text-white/80 mt-4">
                ✅ 5 minuten setup • ✅ Maandelijks opzegbaar • ✅ Eerste content binnen 24 uur
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
              <Link href="/" className="inline-block mb-2">
                <span className="text-2xl font-bold tracking-tight">
                  <span className="text-white">Writgo </span>
                  <span className="text-[#FF6B35]">Media</span>
                </span>
              </Link>
              <p className="text-writgo-primary mb-2 font-bold text-lg">
                #OMNIPRESENCE
              </p>
              <p className="text-text-muted mb-4">
                100% AI-Powered Omnipresence voor Lokale Dienstverleners. Geen gedoe, geen meetings, gewoon resultaat.
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
                <li><a href="#pakketten" className="text-text-muted hover:text-pearl-white transition-colors">Pakketten</a></li>
                <li><a href="#hoe-het-werkt" className="text-text-muted hover:text-pearl-white transition-colors">Hoe Het Werkt</a></li>
                <li><Link href="/inloggen" className="text-text-muted hover:text-pearl-white transition-colors">Inloggen</Link></li>
              </ul>
            </div>

            <div className="text-center md:text-left">
              <h4 className="font-semibold text-pearl-white mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="text-text-muted">info@writgo.nl</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border-dark pt-8 text-center text-text-muted text-sm">
            <p>&copy; 2025 Writgo Media - AI-Powered Omnipresence voor Lokale Dienstverleners</p>
            {/* TODO: Replace with actual KvK and BTW numbers before production deployment */}
            <p className="mt-2 text-xs">KvK: [nummer] | BTW: [nummer]</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
// Updated with 2026 Design Trends - Dec 2025
