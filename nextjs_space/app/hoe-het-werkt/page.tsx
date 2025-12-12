'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import PublicNav from '@/components/public-nav';
import PublicFooter from '@/components/public-footer';
import { 
  ShoppingCart, Link as LinkIcon, FileText, Sparkles, Send,
  Linkedin, Instagram, Facebook, Twitter, Video, ArrowRight, Check
} from 'lucide-react';

export default function HoeHetWerktPage() {
  const steps = [
    {
      number: '1',
      title: 'Pakket Kiezen',
      description: 'Selecteer INSTAPPER, STARTER, GROEI of DOMINANT op basis van jouw ambitie en budget.',
      details: [
        'Kies het pakket dat past bij je doelen',
        'Geen verborgen kosten',
        'Maandelijks opzegbaar',
      ],
      icon: ShoppingCart,
      time: '2 minuten',
    },
    {
      number: '2',
      title: 'Social Media Accounts Verbinden',
      description: '🎯 JIJ KIEST welke platforms je verbindt via Getlate.dev. Alleen LinkedIn? Prima. Alle 8? Ook goed.',
      details: [
        'LinkedIn, Instagram, Facebook, TikTok, Twitter/X, Pinterest, GMB, YouTube',
        'Veilige OAuth verbinding',
        'Content automatisch aangepast per platform',
      ],
      icon: LinkIcon,
      time: '5 minuten',
    },
    {
      number: '3',
      title: 'Bedrijfsinfo Invullen',
      description: 'Vul eenmalig je bedrijfsgegevens in: branche, diensten, tone of voice, doelgroep en keywords.',
      details: [
        'Eenmalige vragenlijst',
        'Bepaal je tone of voice',
        'Kies je belangrijkste keywords',
      ],
      icon: FileText,
      time: '15 minuten',
    },
    {
      number: '4',
      title: 'Content Generatie',
      description: 'Onze AI genereert automatisch SEO-geoptimaliseerde content, aangepast per platform.',
      details: [
        '400+ AI modellen',
        'SEO-geoptimaliseerd',
        'Platform-specifieke aanpassingen',
      ],
      icon: Sparkles,
      time: 'Automatisch',
    },
    {
      number: '5',
      title: 'Automatisch Posten',
      description: 'Content wordt automatisch gepubliceerd op alle verbonden platforms. Zonder jouw input.',
      details: [
        'Automatische posting',
        'Optimale tijdstippen',
        'Consistent en professioneel',
      ],
      icon: Send,
      time: 'Automatisch',
    },
  ];

  const platformAdaptations = [
    {
      platform: 'LinkedIn',
      icon: Linkedin,
      style: 'Professioneel & Zakelijk',
      length: 'Langere posts (500-1000 woorden)',
      format: 'Thought leadership, case studies, tips',
      hashtags: '3-5 relevante hashtags',
    },
    {
      platform: 'Instagram',
      icon: Instagram,
      style: 'Visueel & Inspirerend',
      length: 'Kortere captions (150-300 woorden)',
      format: 'Quotes, tips, behind-the-scenes',
      hashtags: '10-15 niche hashtags',
    },
    {
      platform: 'Facebook',
      icon: Facebook,
      style: 'Casual & Gemeenschap',
      length: 'Medium posts (200-500 woorden)',
      format: 'Stories, updates, community engagement',
      hashtags: '2-3 hashtags',
    },
    {
      platform: 'TikTok',
      icon: Video,
      style: 'Trending & Gen-Z Friendly',
      length: 'Zeer kort (30-60 sec videos)',
      format: 'Quick tips, trends, challenges',
      hashtags: '5-8 trending hashtags',
    },
    {
      platform: 'Twitter/X',
      icon: Twitter,
      style: 'Puntig & Actueel',
      length: 'Zeer kort (100-280 karakters)',
      format: 'Quick takes, nieuws, meningen',
      hashtags: '1-2 hashtags',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <PublicNav />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-6xl mx-auto">
          <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
            Volledig Geautomatiseerd
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Hoe Het Werkt
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            5 stappen naar omnipresence - zonder dat jij er iets voor hoeft te doen
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card
                  key={index}
                  className="bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:border-orange-500/40 transition-all duration-300"
                >
                  <CardContent className="p-8 md:p-12">
                    <div className="grid md:grid-cols-[auto,1fr] gap-8 items-start">
                      {/* Number Circle */}
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center text-white text-3xl font-bold mb-4">
                          {step.number}
                        </div>
                        <Badge variant="outline" className="text-orange-400 border-orange-500/30">
                          {step.time}
                        </Badge>
                      </div>

                      {/* Content */}
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <Icon className="w-8 h-8 text-orange-500" />
                          <h3 className="text-2xl sm:text-3xl font-bold text-white">
                            {step.title}
                          </h3>
                        </div>
                        <p className="text-lg text-gray-300 mb-6">
                          {step.description}
                        </p>
                        <ul className="space-y-2">
                          {step.details.map((detail, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-300">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Arrow between steps */}
                    {index < steps.length - 1 && (
                      <div className="flex justify-center mt-8">
                        <ArrowRight className="w-8 h-8 text-orange-500/50 rotate-90" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Adaptation Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
              Platform Adaptatie
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Content Aangepast Per Platform
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Dezelfde boodschap, maar geoptimaliseerd voor elk platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformAdaptations.map((platform, index) => {
              const Icon = platform.icon;
              return (
                <Card
                  key={index}
                  className="bg-gray-800/50 border-gray-700 hover:border-orange-500/40 transition-all"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Icon className="w-8 h-8 text-orange-500" />
                      <h3 className="text-xl font-bold text-white">{platform.platform}</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-400">Stijl:</p>
                        <p className="text-white font-semibold">{platform.style}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Lengte:</p>
                        <p className="text-white">{platform.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Format:</p>
                        <p className="text-white">{platform.format}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Hashtags:</p>
                        <p className="text-white">{platform.hashtags}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Dit alles gebeurt <span className="text-orange-500 font-bold">automatisch</span>. 
              Jij hoeft alleen maar je pakket te kiezen en de onboarding in te vullen. 
              De rest regelt onze AI voor je.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="relative overflow-hidden border-0">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/80 to-orange-600/80" />
            <CardContent className="p-12 text-center relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Klaar om te beginnen?
              </h2>
              <p className="text-lg text-white/90 mb-8">
                Kies je pakket en start vandaag nog met geautomatiseerde omnipresence
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/prijzen">
                  <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100 px-8 h-12 text-lg font-semibold border-0">
                    Bekijk Pakketten
                  </Button>
                </Link>
                <Link href="/registreren">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 h-12 text-lg font-semibold">
                    Start Nu
                  </Button>
                </Link>
              </div>
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
