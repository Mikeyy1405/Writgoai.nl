'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import PublicNav from '@/components/public-nav';
import PublicFooter from '@/components/public-footer';
import { 
  FileText, Image as ImageIcon, Video, Globe, Sliders,
  Check, Target, TrendingUp, Search, Users, Sparkles,
  Linkedin, Instagram, Facebook, Twitter, MessageSquare,
  ArrowRight
} from 'lucide-react';

export default function DienstenPage() {
  const services = [
    {
      icon: FileText,
      name: 'SEO Artikelen',
      tagline: 'Domineer Google in jouw regio',
      description: 'SEO-geoptimaliseerde blog artikelen die rankings opbouwen en klanten aantrekken',
      features: [
        'Pillar & Cluster strategie voor topical authority',
        'Lokale SEO keywords voor jouw regio',
        '800-3000 woorden per artikel',
        'Automatisch gepubliceerd op je website',
        'Interne linking strategie',
        'Featured snippets targeting',
      ],
      results: [
        'Rankings binnen 2-3 maanden',
        'Organisch traffic groei',
        'Lokale autoriteit opbouwen',
        'Passieve leadgeneratie',
      ],
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Users,
      name: 'Social Media Posts',
      tagline: '🎯 Op JOUW gekozen platforms',
      description: 'Content voor LinkedIn, Instagram, Facebook, TikTok, Twitter/X, Pinterest, GMB en YouTube',
      features: [
        'JIJ kiest welke platforms je verbindt',
        'Content aangepast per platform (tone, lengte, format)',
        'Automatische posting via Getlate.dev',
        'Visuele graphics & templates',
        'Platform-specifieke hashtags',
        'Engagement-geoptimaliseerde posts',
      ],
      results: [
        'Consistente aanwezigheid op alle platforms',
        'Groei in volgers & engagement',
        'Brand awareness opbouwen',
        'LinkedIn thought leadership',
      ],
      color: 'from-orange-500 to-orange-600',
    },
    {
      icon: Video,
      name: 'Faceless Videos',
      tagline: 'Video content zonder camera',
      description: 'AI-gegenereerde video\'s met Nederlandse voiceover, perfect voor Shorts, Reels & TikTok',
      features: [
        'AI voiceover in Nederlands',
        '30-60 seconden per video',
        'Automatisch subtitles',
        'Stock footage & graphics',
        'Trending formats & hooks',
        'Multi-platform compatible',
      ],
      results: [
        'Viral bereik zonder voor de camera',
        'YouTube Shorts + Instagram Reels',
        'TikTok aanwezigheid',
        'Video content library',
      ],
      color: 'from-purple-500 to-purple-600',
    },
  ];

  const platformFeatures = [
    {
      platform: 'LinkedIn',
      icon: Linkedin,
      tone: 'Professioneel & Zakelijk',
      frequency: '3-4x per week',
      format: 'Thought leadership, case studies, tips',
      ideal: 'B2B dienstverleners, consultants, advocaten',
    },
    {
      platform: 'Instagram',
      icon: Instagram,
      tone: 'Visueel & Inspirerend',
      frequency: '4-5x per week',
      format: 'Quotes, tips, behind-the-scenes, reels',
      ideal: 'Beauty, fitness, lifestyle, creative',
    },
    {
      platform: 'Facebook',
      icon: Facebook,
      tone: 'Casual & Gemeenschap',
      frequency: '3-4x per week',
      format: 'Updates, events, community engagement',
      ideal: 'Lokale dienstverleners, events',
    },
    {
      platform: 'TikTok',
      icon: Video,
      tone: 'Trending & Engaging',
      frequency: '2-3x per week',
      format: 'Quick tips, trends, challenges',
      ideal: 'Jongere doelgroep, viral content',
    },
    {
      platform: 'Twitter/X',
      icon: Twitter,
      tone: 'Kort & Puntig',
      frequency: 'Dagelijks',
      format: 'Quick takes, nieuws, threads',
      ideal: 'Thought leaders, nieuws, tech',
    },
    {
      platform: 'Google My Business',
      icon: Globe,
      tone: 'Lokaal & Actiegericht',
      frequency: 'Wekelijks',
      format: 'Updates, offers, nieuws',
      ideal: 'Alle lokale dienstverleners',
    },
  ];

  const processSteps = [
    {
      step: '1',
      title: 'Onboarding',
      description: 'Vul eenmalig je bedrijfsgegevens, doelgroep, tone of voice en keywords in',
      time: '15 minuten',
    },
    {
      step: '2',
      title: 'Platform Selectie',
      description: 'Verbind de social media platforms waar JIJ zichtbaar wilt zijn',
      time: '5 minuten',
    },
    {
      step: '3',
      title: 'AI Contentgeneratie',
      description: '400+ AI modellen genereren SEO artikelen, social posts en videos',
      time: 'Automatisch',
    },
    {
      step: '4',
      title: 'Review & Aanpassing',
      description: 'Bekijk content 24u vooraf in je dashboard (optioneel)',
      time: 'Optioneel',
    },
    {
      step: '5',
      title: 'Automatisch Publiceren',
      description: 'Content wordt automatisch gepost op alle verbonden platforms',
      time: 'Automatisch',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <PublicNav />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-6xl mx-auto">
          <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
            Onze Diensten
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            100% Autonome Omnipresence Marketing
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-2">
            SEO + Social Media + Video - volledig geautomatiseerd
          </p>
          <p className="text-2xl text-orange-500 font-bold">
            🎯 JIJ KIEST JE PLATFORMS, WIJ DOEN DE REST
          </p>
        </div>
      </section>

      {/* Main Services */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-12">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card
                  key={index}
                  className="bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:border-orange-500/40 transition-all duration-300"
                >
                  <CardContent className="p-8 md:p-12">
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Left Column */}
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`p-4 rounded-xl bg-gradient-to-br ${service.color}`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h2 className="text-3xl font-bold text-white">{service.name}</h2>
                            <p className="text-lg text-gray-400">{service.tagline}</p>
                          </div>
                        </div>
                        <p className="text-xl text-gray-300 mb-6">{service.description}</p>
                        
                        <h3 className="text-xl font-bold text-white mb-4">Wat je krijgt:</h3>
                        <ul className="space-y-2">
                          {service.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-300">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Right Column */}
                      <div>
                        <h3 className="text-xl font-bold text-white mb-4">Verwachte Resultaten:</h3>
                        <div className="space-y-4">
                          {service.results.map((result, idx) => (
                            <Card key={idx} className="bg-gray-900/50 border-gray-700">
                              <CardContent className="p-4 flex items-center gap-3">
                                <TrendingUp className="w-6 h-6 text-orange-500" />
                                <span className="text-gray-300">{result}</span>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Flexibility Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
              Platform Flexibiliteit
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              🎯 JIJ BEPAALT WAAR JE ZICHTBAAR BENT
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-2">
              Verbind alleen LinkedIn? Prima. Alle 8 platforms? Ook goed.
            </p>
            <p className="text-lg text-orange-500 font-semibold">
              Content wordt automatisch aangepast per platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformFeatures.map((platform, index) => {
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
                        <p className="text-sm text-gray-400">Tone:</p>
                        <p className="text-white font-semibold">{platform.tone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Frequentie:</p>
                        <p className="text-white">{platform.frequency}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Format:</p>
                        <p className="text-white">{platform.format}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Ideaal voor:</p>
                        <p className="text-orange-400 text-sm">{platform.ideal}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
              Hoe Het Werkt
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Van Onboarding tot Omnipresence
            </h2>
            <p className="text-xl text-gray-300">
              5 simpele stappen naar volledige automatisering
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {processSteps.map((step, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700 text-center">
                <CardContent className="p-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-300 mb-3">{step.description}</p>
                  <Badge variant="outline" className="text-orange-400 border-orange-500/30 text-xs">
                    {step.time}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <Card className="relative overflow-hidden border-0">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/80 to-orange-600/80" />
            <CardContent className="p-12 text-center relative z-10">
              <Sparkles className="w-12 h-12 text-white mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Klaar voor omnipresence?
              </h2>
              <p className="text-lg text-white/90 mb-8">
                Kies je pakket en laat AI jouw marketing automatiseren op JOUW platforms
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/prijzen">
                  <Button size="lg" className="bg-slate-900 text-orange-600 hover:bg-slate-800/50 px-8 h-12 text-lg font-semibold border-0">
                    Bekijk Pakketten
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/hoe-het-werkt">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-slate-900/10 px-8 h-12 text-lg font-semibold">
                    Hoe Het Werkt
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
