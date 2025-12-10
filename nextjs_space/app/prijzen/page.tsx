'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PublicNav from '@/components/public-nav';
import PublicFooter from '@/components/public-footer';
import { Check, Star, Linkedin, Instagram, Facebook, Twitter, Video, Globe, Youtube, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';

export default function PrijzenPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const packages = [
    {
      name: 'INSTAPPER',
      price: '€197',
      period: '/maand',
      description: 'Ideaal voor: Starters, kleine budgetten',
      features: [
        '2 SEO Artikelen (800-1200 woorden)',
        '16 Social Media Posts (op jouw gekozen platforms)',
        '4 Faceless Videos (30-60 sec)',
        'Automatische posting op ALLE verbonden accounts',
        'Platform flexibiliteit: verbind 1, 2, 5 of 10 accounts',
        'Maandelijks opzegbaar',
      ],
      popular: false,
    },
    {
      name: 'STARTER',
      price: '€297',
      period: '/maand',
      description: 'Ideaal voor: Bedrijven die SEO autoriteit willen bouwen',
      features: [
        '1 Pillar Artikel (2000+ woorden)',
        '2 Cluster Artikelen (800-1200 woorden)',
        '16 Social Media Posts',
        '4 Faceless Videos',
        'Pillar-Cluster SEO strategie',
        'Automatische posting op ALLE platforms',
        'Maandelijks opzegbaar',
      ],
      popular: false,
    },
    {
      name: 'GROEI',
      price: '€497',
      period: '/maand',
      description: 'Ideaal voor: Ambitieuze ondernemers',
      features: [
        '1 Pillar Artikel (2000+ woorden)',
        '3 Cluster Artikelen',
        '24 Social Media Posts (~6 per week)',
        '8 Faceless Videos (2 per week)',
        'Pillar-Cluster SEO strategie',
        'Automatische posting op ALLE platforms',
        'Priority support',
        'Maandelijks opzegbaar',
      ],
      popular: true,
    },
    {
      name: 'DOMINANT',
      price: '€797',
      period: '/maand',
      description: 'Ideaal voor: Marktleiders',
      features: [
        '2 Pillar Artikelen (2000+ woorden)',
        '4 Cluster Artikelen',
        '40 Social Media Posts',
        '12 Faceless Videos (3 per week)',
        'Advanced Pillar-Cluster strategie',
        'Automatische posting op ALLE platforms',
        'Priority support + dedicated account manager',
        'Maandelijks opzegbaar',
      ],
      popular: false,
    },
  ];

  const platforms = [
    { name: 'LinkedIn', icon: Linkedin, color: 'text-blue-500' },
    { name: 'Instagram', icon: Instagram, color: 'text-pink-500' },
    { name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
    { name: 'Twitter/X', icon: Twitter, color: 'text-sky-500' },
    { name: 'TikTok', icon: Video, color: 'text-black' },
    { name: 'Pinterest', icon: TrendingUp, color: 'text-red-500' },
    { name: 'Google My Business', icon: Globe, color: 'text-orange-500' },
    { name: 'YouTube', icon: Youtube, color: 'text-red-600' },
  ];

  const faqs = [
    {
      question: 'Wat als ik alleen LinkedIn wil?',
      answer: 'Geen probleem! Je kunt zelf bepalen welke platforms je wilt verbinden. Verbind alleen LinkedIn als dat is waar je zichtbaar wilt zijn. De content wordt automatisch aangepast voor het platform dat je kiest.',
    },
    {
      question: 'Kan ik later upgraden?',
      answer: 'Ja, je kunt op elk moment upgraden naar een hoger pakket. Het verschil wordt automatisch verrekend en je krijgt direct toegang tot de extra content.',
    },
    {
      question: 'Hoe werkt de onboarding?',
      answer: 'Na je aankoop vul je een eenmalig vragenformulier in (15 minuten) over je bedrijf, diensten, doelgroep en tone of voice. Daarna verbind je je social media accounts via Getlate.dev en wij regelen de rest.',
    },
    {
      question: 'Wat is het verschil tussen Pillar en Cluster artikelen?',
      answer: 'Een Pillar artikel is een uitgebreide gids (2000+ woorden) over een hoofdonderwerp. Cluster artikelen zijn kortere artikelen (800-1200 woorden) over specifieke subtopics die linken naar het Pillar artikel. Deze strategie helpt je om Google te domineren voor jouw onderwerp.',
    },
    {
      question: 'Kan ik maandelijks opzeggen?',
      answer: 'Ja, alle pakketten zijn maandelijks opzegbaar. Geen lange contracten, geen gedoe. Opzeggen kan tot de 15e van de maand.',
    },
    {
      question: 'Werkt het echt 100% autonoom?',
      answer: 'Ja! Na de onboarding (15 minuten) doen wij alles. Geen calls, geen meetings, geen feedback rondes. Je kunt wel in je dashboard meekijken en wijzigingen aanvragen als je dat wilt.',
    },
    {
      question: 'Moet ik content goedkeuren voordat het live gaat?',
      answer: 'Nee, standaard publiceren wij automatisch. Je kunt content wel 24 uur vooraf bekijken in je dashboard en wijzigingen aanvragen via chat als je dat wilt.',
    },
    {
      question: 'Wat krijg ik voor mijn geld vergeleken met traditionele bureaus?',
      answer: 'Traditionele bureaus rekenen €2.500-€4.500/maand voor vergelijkbare diensten, plus eindeloze meetings. Bij Writgo.nl betaal je €197-€797/maand en heb je GEEN meetings, GEEN calls, en GEEN gedoe. Alles is 100% autonoom.',
    },
  ];

  const comparisonFeatures = [
    { feature: 'SEO Artikelen per maand', instapper: '2', starter: '3 (1 Pillar + 2 Cluster)', groei: '4 (1 Pillar + 3 Cluster)', dominant: '6 (2 Pillar + 4 Cluster)' },
    { feature: 'Social Media Posts', instapper: '16', starter: '16', groei: '24', dominant: '40' },
    { feature: 'Faceless Videos', instapper: '4', starter: '4', groei: '8', dominant: '12' },
    { feature: 'Platform Flexibiliteit', instapper: '✓', starter: '✓', groei: '✓', dominant: '✓' },
    { feature: 'Automatische Posting', instapper: '✓', starter: '✓', groei: '✓', dominant: '✓' },
    { feature: 'Pillar-Cluster Strategie', instapper: '—', starter: '✓', groei: '✓', dominant: '✓' },
    { feature: 'Priority Support', instapper: '—', starter: '—', groei: '✓', dominant: '✓' },
    { feature: 'Dedicated Account Manager', instapper: '—', starter: '—', groei: '—', dominant: '✓' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <PublicNav />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-6xl mx-auto">
          <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
            Transparante Prijzen
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Eenvoudige, Transparante Prijzen
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-2">
            Kies het pakket dat bij jouw ambitie past
          </p>
          <p className="text-lg text-gray-400">
            Maandelijks opzegbaar • Geen setup kosten • 30 dagen garantie
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg, index) => (
              <Card
                key={index}
                className={`relative bg-gray-800/50 backdrop-blur-sm border-2 transition-all duration-300 ${
                  pkg.popular
                    ? 'border-orange-500 scale-105 shadow-2xl shadow-orange-500/30'
                    : 'border-gray-700 hover:border-orange-500/40'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-orange-500 text-white font-bold border-0">
                      ⭐ BESTSELLER
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl text-white mb-2">{pkg.name}</CardTitle>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-4xl font-bold text-orange-500">{pkg.price}</span>
                    <span className="text-gray-400">{pkg.period}</span>
                  </div>
                  <p className="text-sm text-gray-400 italic">{pkg.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/registreren">
                    <Button
                      className={`w-full ${
                        pkg.popular
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0'
                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                    >
                      Start met {pkg.name}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Vergelijk Alle Pakketten
            </h2>
            <p className="text-xl text-gray-300">
              Bekijk alle features in één overzicht
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-6 py-4 text-left text-white font-semibold">Feature</th>
                  <th className="px-6 py-4 text-center text-white font-semibold">INSTAPPER</th>
                  <th className="px-6 py-4 text-center text-white font-semibold">STARTER</th>
                  <th className="px-6 py-4 text-center text-white font-semibold bg-orange-500/10">GROEI</th>
                  <th className="px-6 py-4 text-center text-white font-semibold">DOMINANT</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, index) => (
                  <tr key={index} className="border-b border-gray-700/50">
                    <td className="px-6 py-4 text-gray-300">{row.feature}</td>
                    <td className="px-6 py-4 text-center text-gray-300">{row.instapper}</td>
                    <td className="px-6 py-4 text-center text-gray-300">{row.starter}</td>
                    <td className="px-6 py-4 text-center text-gray-300 bg-orange-500/5">{row.groei}</td>
                    <td className="px-6 py-4 text-center text-gray-300">{row.dominant}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
            Platform Flexibiliteit
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ondersteunde Platforms
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            Kies zelf waar je zichtbaar wilt zijn. Verbind één platform of alle acht.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {platforms.map((platform, index) => {
              const Icon = platform.icon;
              return (
                <Card key={index} className="bg-gray-800/50 border-gray-700 hover:border-orange-500/40 transition-all p-6 text-center">
                  <Icon className={`w-12 h-12 mx-auto mb-3 ${platform.color}`} />
                  <p className="text-white font-semibold">{platform.name}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
              Veelgestelde Vragen
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Heb je nog vragen?
            </h2>
            <p className="text-xl text-gray-300">
              We beantwoorden de meest gestelde vragen over onze pakketten
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card
                key={index}
                className="bg-gray-800/50 border-gray-700 hover:border-orange-500/40 transition-all cursor-pointer"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-white mb-2 flex-1">
                      {faq.question}
                    </h3>
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                  {openFaq === index && (
                    <p className="text-gray-300 mt-2">{faq.answer}</p>
                  )}
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
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/80 to-orange-600/80" />
            <CardContent className="p-12 text-center relative z-10">
              <Star className="w-12 h-12 text-white mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Klaar om overal zichtbaar te zijn?
              </h2>
              <p className="text-lg text-white/90 mb-8">
                Start vandaag en laat AI jouw content marketing overnemen
              </p>
              <Link href="/registreren">
                <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100 px-8 h-12 text-lg font-semibold border-0">
                  Start Nu →
                </Button>
              </Link>
              <p className="text-sm text-white/80 mt-4">
                ✅ Maandelijks opzegbaar • ✅ Geen setup kosten • ✅ 30 dagen garantie
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
