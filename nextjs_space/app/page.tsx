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
      icon: <EyeOff className="w-8 h-8" />,
      title: 'Onzichtbaar Online',
      description: 'Je concurrent verschijnt op Google. Jij niet.',
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Geen Tijd',
      description: "Marketing is 'voor later'. Maar later komt nooit.",
    },
    {
      icon: <X className="w-8 h-8" />,
      title: 'Te Duur/Complex',
      description: 'Bureaus kosten €2.000+/maand en veel gedoe.',
    },
  ];

  const omnipresenceChannels = [
    {
      icon: <Search className="w-8 h-8" />,
      title: 'Google (SEO)',
      description: 'Rank voor 10-50 zoektermen. Klanten vinden jou.',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'LinkedIn',
      description: 'Thought leadership. B2B leads stromen binnen.',
    },
    {
      icon: <Image className="w-8 h-8" />,
      title: 'Instagram',
      description: 'Visuele content. Lokale klanten zien je overal.',
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: 'YouTube/TikTok',
      description: "Video's die viral gaan. Nieuwe doelgroepen.",
    },
  ];

  const howItWorksSteps = [
    {
      number: '1',
      title: 'Kies Je Pakket',
      time: '2 min',
      description: 'Selecteer INSTAPPER, STARTER, GROEI of DOMINANT. Vul je bedrijfsgegevens in.',
    },
    {
      number: '2',
      title: 'AI Analyseert',
      time: 'automatisch',
      description: 'Onze AI scant je branche en concurrentie. Bepaalt optimale content strategie. Stelt tone-of-voice in.',
    },
    {
      number: '3',
      title: 'Content Wordt Gemaakt',
      time: 'automatisch',
      description: 'SEO artikelen, social posts, video\'s. Alles in jouw stijl en branche. Geoptimaliseerd voor resultaat.',
    },
    {
      number: '4',
      title: 'Alles Wordt Gepubliceerd',
      time: 'automatisch',
      description: 'Content gaat live op alle platforms. Jij wordt overal zichtbaar. Leads komen binnen.',
    },
  ];

  const pricingPackages = [
    {
      name: 'INSTAPPER',
      price: '€297',
      period: '/maand',
      features: [
        '3.000 woorden SEO content',
        '8x LinkedIn posts',
        '8x Instagram posts',
        '4x Faceless video\'s',
      ],
      popular: false,
    },
    {
      name: 'STARTER',
      price: '€497',
      period: '/maand',
      features: [
        '4.900 woorden (pillar/cluster)',
        '8x LinkedIn posts',
        '8x Instagram posts',
        '4x Faceless video\'s',
      ],
      popular: false,
    },
    {
      name: 'GROEI',
      price: '€797',
      period: '/maand',
      features: [
        '7.500 woorden SEO content',
        '12x LinkedIn posts',
        '12x Instagram posts',
        '8x Faceless video\'s',
        '4x Google Mijn Bedrijf posts',
      ],
      popular: true,
    },
    {
      name: 'DOMINANT',
      price: '€1.297',
      period: '/maand',
      features: [
        '12.000 woorden SEO content',
        '16x LinkedIn posts',
        '16x Instagram posts',
        '12x Faceless video\'s',
        '8x Google Mijn Bedrijf posts',
        '12x Twitter/X posts',
        '8x Pinterest pins',
      ],
      popular: false,
    },
  ];

  const targetAudiences = [
    { icon: <Wrench className="w-6 h-6" />, title: 'Installateurs & CV Monteurs' },
    { icon: <Scissors className="w-6 h-6" />, title: 'Kappers & Schoonheidssalons' },
    { icon: <Stethoscope className="w-6 h-6" />, title: 'Tandartsen & Mondhygiënisten' },
    { icon: <Target className="w-6 h-6" />, title: 'Fysiotherapeuten & Zorg' },
    { icon: <Hammer className="w-6 h-6" />, title: 'Klus- & Onderhoudsbedrijven' },
    { icon: <Home className="w-6 h-6" />, title: 'Lokale Dienstverleners' },
  ];

  const caseStudies = [
    {
      title: 'Tandartspraktijk Amsterdam',
      result: 'Van 50 naar 500 bezoekers/maand',
      icon: <TrendingUp className="w-8 h-8 text-writgo-primary" />,
    },
    {
      title: 'Installatiebedrijf Rotterdam',
      result: 'Top 3 Google ranking in 3 maanden',
      icon: <Award className="w-8 h-8 text-writgo-primary" />,
    },
    {
      title: 'Kapsalon Utrecht',
      result: 'Agenda 3 weken vol geboekt',
      icon: <Calendar className="w-8 h-8 text-writgo-primary" />,
    },
  ];

  const faqs = [
    {
      question: 'Hoeveel tijd kost het mij?',
      answer: '0 minuten. Alles is geautomatiseerd.',
    },
    {
      question: 'Moet ik content goedkeuren?',
      answer: 'Optioneel. Je kunt auto-publish kiezen.',
    },
    {
      question: 'Hoe snel zie ik resultaat?',
      answer: 'SEO: 2-3 maanden. Social: direct zichtbaar.',
    },
    {
      question: 'Kan ik opzeggen?',
      answer: 'Ja, maandelijks opzegbaar. Geen contract.',
    },
    {
      question: 'Wat als ik niet tevreden ben?',
      answer: 'Stop na 1 maand. Geen vragen.',
    },
    {
      question: 'Schrijft AI echt alles?',
      answer: 'Ja, onze AI + jouw branche kennis = perfecte content.',
    },
    {
      question: 'Werkt het voor mijn branche?',
      answer: 'Voor alle lokale dienstverleners.',
    },
    {
      question: 'Heb ik meetings nodig?',
      answer: 'Nee, volledig geautomatiseerd. Geen calls.',
    },
    {
      question: 'Wat is omnipresence?',
      answer: 'Overal zichtbaar zijn waar je klanten zijn.',
    },
    {
      question: 'Waarom €297-1297?',
      answer: '10x goedkoper dan bureaus, 10x beter dan zelf doen.',
    },
  ];

  const stats = [
    { value: '50+', label: 'Lokale dienstverleners geholpen' },
    { value: '100%', label: 'Geautomatiseerd' },
    { value: '0 uur', label: 'Jouw tijdsinvestering' },
    { value: 'Top 3', label: 'Google rankings gemiddeld' },
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
              <Bot className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">100% AI-Powered Omnipresence</span>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-pearl-white animate-fade-in">
              Omnipresence voor
              <br />
              <span className="text-writgo-primary">
                Lokale Dienstverleners
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-text-muted max-w-3xl mx-auto animate-fade-in">
              Wees overal waar je klanten zijn. Google. LinkedIn. Instagram. YouTube.
              <br className="hidden sm:block" />
              Volledig geautomatiseerd met AI. Jij hoeft <span className="text-writgo-primary font-semibold">NIETS</span> te doen.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
              <a href="#pakketten">
                <Button size="lg" className="btn-gradient-orange text-white px-8 h-12 text-lg font-semibold group border-0">
                  Start Direct - Kies Je Pakket
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
              <a href="#hoe-het-werkt">
                <Button size="lg" variant="outline" className="border-pearl-white text-pearl-white hover:bg-white/10 px-8 h-12 text-lg font-semibold">
                  Bekijk Hoe Het Werkt
                </Button>
              </a>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 pt-8 animate-fade-in">
              <div className="flex items-center gap-2 text-pearl-white">
                <Check className="w-5 h-5 text-writgo-secondary" />
                <span className="text-sm">Volledig geautomatiseerd</span>
              </div>
              <div className="flex items-center gap-2 text-pearl-white">
                <Check className="w-5 h-5 text-writgo-secondary" />
                <span className="text-sm">Geen gedoe, geen meetings</span>
              </div>
              <div className="flex items-center gap-2 text-pearl-white">
                <Check className="w-5 h-5 text-writgo-secondary" />
                <span className="text-sm">Maandelijks opzegbaar</span>
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
              <Card key={index} className="glass-dark border-border-dark hover:border-writgo-primary/40 transition-all duration-300 text-center max-w-sm w-full">
                <CardContent className="p-8">
                  <div className="inline-flex p-4 rounded-2xl bg-writgo-primary/10 mb-6 text-writgo-primary">
                    {point.icon}
                  </div>
                  <h3 className="text-xl font-bold text-pearl-white mb-3">{point.title}</h3>
                  <p className="text-text-muted">{point.description}</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 justify-items-center">
            {omnipresenceChannels.map((channel, index) => (
              <Card key={index} className="glass-dark border-border-dark hover:border-writgo-primary/40 transition-all duration-300 text-center max-w-xs w-full">
                <CardContent className="p-6">
                  <div className="inline-flex p-3 rounded-xl bg-writgo-primary mb-4 text-white">
                    {channel.icon}
                  </div>
                  <h3 className="text-lg font-bold text-pearl-white mb-2">{channel.title}</h3>
                  <p className="text-text-muted text-sm">{channel.description}</p>
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
              4 stappen naar omnipresence - zonder dat jij er iets voor hoeft te doen
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
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

      {/* Packages Section */}
      <section id="pakketten" className="py-20 px-4 sm:px-6 lg:px-8 bg-surface/50 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-writgo-secondary text-white border-0">
              Pakketten
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-pearl-white mb-4">
              Kies Je Pakket
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Vaste pakketten, vaste prijzen. Volledig geautomatiseerd.
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
                  <div className="flex items-baseline justify-center gap-1 mb-4">
                    <span className="text-3xl font-bold text-writgo-primary">{pkg.price}</span>
                    <span className="text-text-muted text-sm">{pkg.period}</span>
                  </div>
                  <ul className="space-y-2 mb-6 text-left">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-text-muted text-sm">
                        <Check className="w-4 h-4 text-writgo-secondary flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
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

          <p className="text-text-muted text-center">
            Maandelijks opzegbaar. Geen contract. Geen gedoe.
          </p>
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
              Speciaal voor Lokale Dienstverleners
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Die marktleider willen worden in hun regio
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
              Échte Resultaten
            </h2>
            <p className="text-lg text-text-muted">
              Van onzichtbaar naar omnipresent
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
            {caseStudies.map((study, index) => (
              <Card key={index} className="glass-dark border-border-dark hover:border-writgo-primary/40 transition-all text-center max-w-sm w-full">
                <CardContent className="p-8">
                  <div className="mb-6">
                    {study.icon}
                  </div>
                  <h3 className="text-xl font-bold text-pearl-white mb-3">{study.title}</h3>
                  <p className="text-lg text-writgo-secondary font-semibold">{study.result}</p>
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
              Alles wat je wilt weten
            </h2>
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
                Klaar om Dominant Zichtbaar te Worden?
              </h2>
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                Start vandaag. Geen gedoe. Geen meetings. Gewoon resultaat.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="#pakketten">
                  <Button size="lg" className="bg-white text-writgo-primary hover:bg-gray-100 px-8 h-12 text-lg font-semibold border-0">
                    Kies Je Pakket en Start Direct
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </a>
              </div>
              <p className="text-sm text-white/80 mt-4">
                Volledig geautomatiseerd • Maandelijks opzegbaar • Resultaat binnen 30 dagen
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
                  <span className="text-white">Writgo</span>
                  <span className="text-[#FF6B35]">Media</span>
                </span>
              </Link>
              <p className="text-text-muted mb-4 italic">
                Omnipresence voor Lokale Dienstverleners
              </p>
              <p className="text-text-muted mb-4">
                Volledig geautomatiseerde omnipresence met AI. Geen gedoe, geen meetings, gewoon resultaat.
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
            <p>&copy; 2025 Writgo Media - Omnipresence voor Lokale Dienstverleners</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
// Updated with 2026 Design Trends - Dec 2025
