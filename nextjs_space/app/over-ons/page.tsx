'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import PublicNav from '@/components/public-nav';
import PublicFooter from '@/components/public-footer';
import { 
  Zap, Award, TrendingUp, Shield, Globe, Sliders, 
  Target, CheckCircle2, Sparkles
} from 'lucide-react';

export default function OverOnsPage() {
  const coreValues = [
    {
      icon: Zap,
      title: 'Autonomie',
      description: 'Marketing hoeft niet complex te zijn. Wij nemen alles uit handen zodat jij je kunt focussen op je vak.',
    },
    {
      icon: Sparkles,
      title: 'Innovatie',
      description: 'Altijd de nieuwste AI-technologie. 400+ modellen die continu worden geoptimaliseerd.',
    },
    {
      icon: TrendingUp,
      title: 'Toegankelijkheid',
      description: 'Premium marketing voor iedereen. Vanaf €197/maand, zonder lange contracten.',
    },
    {
      icon: Target,
      title: 'Resultaatgerichtheid',
      description: 'Data drijft onze beslissingen. Meetbare groei in traffic, rankings en engagement.',
    },
    {
      icon: Globe,
      title: 'Nederlandse Focus',
      description: 'Wij begrijpen de Nederlandse markt. SEO, tone-of-voice en platforms specifiek voor Nederland.',
    },
    {
      icon: Sliders,
      title: 'Platform Flexibiliteit',
      description: 'JIJ kiest waar je zichtbaar wilt zijn. Alleen LinkedIn? Prima. Alle platforms? Ook goed. Content wordt aangepast per platform via Getlate.dev.',
    },
  ];

  const stats = [
    { value: '400+', label: 'AI Modellen' },
    { value: '8', label: 'Jaar Ervaring' },
    { value: '47+', label: 'Lokale Dienstverleners' },
    { value: '100%', label: 'Autonoom' },
  ];

  const expertise = [
    {
      title: '8 jaar ervaring in SEO',
      description: 'Van affiliate marketing tot Google rankings. We weten wat werkt.',
    },
    {
      title: 'Track record in rankings',
      description: 'Meerdere #1 posities in competitieve niches.',
    },
    {
      title: '400+ AI modellen',
      description: 'Eigen AI platform met de nieuwste technologie (GPT-5.1, Claude 4.5, Gemini 3, etc.).',
    },
    {
      title: '🎯 Platform Flexibiliteit via Getlate.dev',
      description: 'Verbind elk social media platform dat je wilt. LinkedIn, Instagram, TikTok, Facebook, Twitter/X, Pinterest, GMB, YouTube.',
    },
    {
      title: 'Nederlandse markt',
      description: 'Specifiek gebouwd voor lokale dienstverleners in Nederland.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <PublicNav />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-6xl mx-auto">
          <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
            Over Writgo.nl
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            AI-First Omnipresence Marketing
            <br />
            <span className="text-orange-500">voor Lokale Dienstverleners</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Wij maken professionele omnipresence marketing toegankelijk voor iedere lokale ondernemer
          </p>
        </div>
      </section>

      {/* Missie Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-orange-900/20 to-gray-900/50 border-orange-500/30 p-8 sm:p-12">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Onze Missie
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                "Wij maken professionele omnipresence marketing toegankelijk voor iedere lokale 
                ondernemer in Nederland, volledig autonoom en AI-gedreven, zodat zij zich kunnen 
                focussen op waar ze goed in zijn: hun vak."
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Visie Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gray-800/50 border-gray-700 p-8 sm:p-12">
            <div className="text-center">
              <Award className="w-16 h-16 text-orange-500 mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Onze Visie
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                "Writgo.nl is de #1 autonome content partner voor lokale dienstverleners in Nederland."
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
              Kernwaarden
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Waar Wij Voor Staan
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Deze 6 principes vormen de basis van alles wat we doen
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreValues.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card
                  key={index}
                  className="bg-gray-800/50 border-gray-700 hover:border-orange-500/40 transition-all duration-300 hover:scale-105"
                >
                  <CardContent className="p-8">
                    <Icon className="w-12 h-12 text-orange-500 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                    <p className="text-gray-300">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Achtergrond Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
              Achtergrond
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Expertise & Ervaring
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Gebouwd door experts met jarenlange ervaring in SEO en AI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {expertise.map((item, index) => (
              <Card
                key={index}
                className="bg-gray-800/50 border-gray-700 hover:border-orange-500/40 transition-all"
              >
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-gray-300">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats Grid */}
          <Card className="bg-gradient-to-br from-orange-900/20 to-gray-900/50 border-orange-500/30 p-8 sm:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold text-orange-500 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-300 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Why Different Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Waarom Writgo.nl Anders Is
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Traditionele bureaus vs. Writgo.nl
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Traditional Agencies */}
            <Card className="bg-red-900/10 border-red-500/30">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-red-400 mb-6">Traditionele Bureaus</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-2 text-gray-300">
                    <span className="text-red-400">✗</span>
                    <span>€2.500-€4.500 per maand</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-300">
                    <span className="text-red-400">✗</span>
                    <span>Eindeloze meetings en calls</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-300">
                    <span className="text-red-400">✗</span>
                    <span>Lange contracten (12 maanden)</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-300">
                    <span className="text-red-400">✗</span>
                    <span>Feedback rondes en wachttijden</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-300">
                    <span className="text-red-400">✗</span>
                    <span>Onduidelijke ROI</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Writgo.nl */}
            <Card className="bg-green-900/10 border-green-500/30">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-green-400 mb-6">Writgo.nl</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-2 text-gray-300">
                    <span className="text-green-400">✓</span>
                    <span>€197-€797 per maand</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-300">
                    <span className="text-green-400">✓</span>
                    <span>Geen calls, geen meetings</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-300">
                    <span className="text-green-400">✓</span>
                    <span>Maandelijks opzegbaar</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-300">
                    <span className="text-green-400">✓</span>
                    <span>100% autonoom, geen feedback nodig</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-300">
                    <span className="text-green-400">✓</span>
                    <span>Real-time dashboard met metrics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="relative overflow-hidden border-0">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/80 to-orange-600/80" />
            <CardContent className="p-12 text-center relative z-10">
              <Sparkles className="w-12 h-12 text-white mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Klaar om te beginnen?
              </h2>
              <p className="text-lg text-white/90 mb-8">
                Sluit je aan bij 47+ lokale dienstverleners die al hun content automatiseren
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/prijzen">
                  <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100 px-8 h-12 text-lg font-semibold border-0">
                    Bekijk Pakketten
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 h-12 text-lg font-semibold">
                    Neem Contact Op
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
