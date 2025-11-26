
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  Search,
  ArrowLeft,
  Zap,
  FileText,
  Video,
  TrendingUp,
  Link2,
  Gift,
  HelpCircle,
  ExternalLink,
  CheckCircle,
  PlayCircle,
  FileCode,
  Globe,
  Star,
  Rocket,
  Wand2,
  Calendar,
  Settings,
  CreditCard,
  MessageSquare,
} from 'lucide-react';

export default function KnowledgeCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const tutorials = [
    {
      id: 'autopilot',
      icon: Zap,
      title: 'Autopilot - Volledig Automatisch',
      description: 'Leer hoe je Autopilot instelt voor volledige automatische content creatie',
      category: 'Featured',
      duration: '10 min',
      difficulty: 'Beginner',
      color: 'purple',
      steps: [
        'Maak een project aan en koppel WordPress',
        'Ga naar Autopilot en selecteer je project',
        'Kies Research modus voor automatische keyword research',
        'Stel interval en aantal artikelen per run in',
        'Activeer Autopilot en laat de AI werken!'
      ]
    },
    {
      id: 'writgo-writer',
      icon: FileText,
      title: 'Writgo Writer - Handmatig Blogs Schrijven',
      description: 'Gebruik de intelligente AI writer met auto-detectie voor perfecte content',
      category: 'Content Creation',
      duration: '8 min',
      difficulty: 'Beginner',
      color: 'orange',
      steps: [
        'Selecteer je project voor affiliate links',
        'Voer je onderwerp of keyword in',
        'De AI detecteert automatisch content type (blog, review, productlijst)',
        'Wacht terwijl de AI content genereert',
        'Bewerk indien nodig en publiceer naar WordPress'
      ]
    },
    {
      id: 'content-optimizer',
      icon: Wand2,
      title: 'Content Optimizer - Verbeter Bestaande Content',
      description: 'Analyseer en optimaliseer je WordPress posts en WooCommerce producten',
      category: 'SEO',
      duration: '12 min',
      difficulty: 'Intermediate',
      color: 'green',
      steps: [
        'Kies een project met WordPress koppeling',
        'Selecteer Posts of Products tab',
        'Klik op Analyseren voor SEO score',
        'Bekijk verbeteringsuggesties',
        'Gebruik "Herschrijven & Direct Updaten" voor automatische optimalisatie'
      ]
    },
    {
      id: 'keyword-research',
      icon: Search,
      title: 'Keyword Research - Vind de Beste Keywords',
      description: 'Uitgebreid keyword onderzoek met concurrent analyse en content planning',
      category: 'Research',
      duration: '15 min',
      difficulty: 'Intermediate',
      color: 'blue',
      steps: [
        'Voer je seed keyword of website URL in',
        'Selecteer concurrent analyse (optioneel)',
        'Bekijk keyword suggesties met zoekvolume',
        'Sorteer op AI score, difficulty of search volume',
        'Voeg keywords toe aan content planning'
      ]
    },
    {
      id: 'affiliate',
      icon: Gift,
      title: 'Affiliate Portal - Verdien Commissie',
      description: 'Activeer je affiliate link en verdien 10% op elke verwijzing',
      category: 'Business',
      duration: '5 min',
      difficulty: 'Beginner',
      color: 'orange',
      steps: [
        'Ga naar Affiliate Portal',
        'Klik op "Genereer Mijn Affiliate Code"',
        'Kopieer je unieke affiliate URL',
        'Deel de link op social media of je website',
        'Track je verdiensten en vraag uitbetaling aan (min. €50)'
      ]
    },
    {
      id: 'wordpress-integration',
      icon: Globe,
      title: 'WordPress Integratie Instellen',
      description: 'Koppel je WordPress website voor directe publicatie',
      category: 'Integration',
      duration: '10 min',
      difficulty: 'Beginner',
      color: 'indigo',
      steps: [
        'Ga naar je Project instellingen',
        'Scroll naar WordPress Koppeling sectie',
        'Voer je WordPress URL in (bijv. https://jouwsite.nl)',
        'Maak Application Password aan in WordPress (Gebruikers → Profiel)',
        'Voer WordPress gebruikersnaam en password in',
        'Test de verbinding - klaar!'
      ]
    },
  ];

  const faqs = [
    {
      category: 'Algemeen',
      questions: [
        {
          q: 'Wat is WritgoAI?',
          a: 'WritgoAI is een complete AI-powered content platform waarmee je automatisch hoogwaardige, SEO-geoptimaliseerde content kunt creëren. Van keyword research tot WordPress publicatie - alles in één platform.'
        },
        {
          q: 'Hoe werkt het credit systeem?',
          a: 'Elke actie in WritgoAI kost een bepaald aantal credits. Een blog genereren kost gemiddeld 15-25 credits. Je ontvangt maandelijks credits op basis van je abonnement en kunt extra credits bijkopen indien nodig.'
        },
        {
          q: 'Kan ik WritgoAI gebruiken zonder WordPress?',
          a: 'Ja absoluut! Je kunt alle content downloaden als Word document of HTML. WordPress integratie is optioneel maar maakt publiceren wel veel makkelijker.'
        }
      ]
    },
    {
      category: 'Autopilot',
      questions: [
        {
          q: 'Hoe werkt de Autopilot feature?',
          a: 'Autopilot is volledig automatisch. Je stelt één keer je planning in (interval, aantal artikelen, content type) en de AI doet de rest: keyword research, content generatie, optimalisatie en zelfs WordPress publicatie.'
        },
        {
          q: 'Wat is het verschil tussen Simple en Research modus?',
          a: 'Simple modus gebruikt vooraf ingevoerde keywords. Research modus doet automatisch keyword research op basis van je website en niche, genereert content ideeën en selecteert de beste onderwerpen.'
        },
        {
          q: 'Kan ik Autopilot pauzeren?',
          a: 'Ja, je kunt Autopilot op elk moment in/uitschakelen per project. De planning blijft behouden voor wanneer je het weer activeert.'
        }
      ]
    },
    {
      category: 'Content Optimizer',
      questions: [
        {
          q: 'Welke content kan ik optimaliseren?',
          a: 'Je kunt zowel WordPress blog posts als WooCommerce producten optimaliseren. De AI analyseert bestaande content en geeft SEO suggesties en kan direct updates doorvoeren.'
        },
        {
          q: 'Overschrijft de optimizer mijn originele content?',
          a: 'Ja, bij "Herschrijven & Direct Updaten" wordt je WordPress post bijgewerkt met de nieuwe content. We raden aan eerst een backup te maken via WordPress.'
        }
      ]
    },
    {
      category: 'Link Building',
      questions: [
        {
          q: 'Hoe werkt automatische link building?',
          a: 'WritgoAI gebruikers die link building activeren kunnen automatisch relevante links naar elkaar plaatsen. De AI zorgt voor relevante matches en plaatst natuurlijke backlinks die je SEO rankings verbeteren.'
        },
        {
          q: 'Hoeveel kost link building?',
          a: 'Elke geplaatste link kost 15 credits. Je ontvangt ook links terug van andere gebruikers, wat zorgt voor een eerlijke uitwisseling.'
        },
        {
          q: 'Kan ik kiezen welke sites naar mij linken?',
          a: 'De AI selecteert automatisch relevante sites op basis van niche en content. Je kunt link building op elk moment in/uitschakelen in je account instellingen.'
        }
      ]
    },
    {
      category: 'Affiliate Program',
      questions: [
        {
          q: 'Hoeveel kan ik verdienen?',
          a: 'Je verdient 10% commissie op alle betalingen van gebruikers die je verwijst, voor altijd! Dus als iemand €20/maand betaalt, verdien jij €2/maand zolang ze abonnee blijven.'
        },
        {
          q: 'Wanneer kan ik uitbetaling aanvragen?',
          a: 'Je kunt uitbetaling aanvragen vanaf €50. Uitbetalingen worden binnen 5-7 werkdagen verwerkt via bankoverschrijving, PayPal of WritgoAI credits.'
        },
        {
          q: 'Hoe track ik mijn verwijzingen?',
          a: 'In het Affiliate Portal zie je real-time statistieken: aantal verwijzingen, conversies, verdiend bedrag en beschikbaar saldo voor uitbetaling.'
        }
      ]
    }
  ];

  const documentation = [
    {
      title: 'API Documentatie',
      description: 'Voor developers die WritgoAI willen integreren',
      icon: FileCode,
      link: '#',
      badge: 'Binnenkort'
    },
    {
      title: 'WordPress Plugin Setup',
      description: 'Stapsgewijze handleiding voor WordPress integratie',
      icon: Globe,
      link: '#',
      badge: 'Beschikbaar'
    },
    {
      title: 'Video Tutorials',
      description: 'Video handleidingen voor alle features',
      icon: Video,
      link: '#',
      badge: 'Nieuw'
    },
    {
      title: 'Changelog',
      description: 'Bekijk alle updates en nieuwe features',
      icon: Rocket,
      link: '#',
      badge: 'Updated'
    }
  ];

  const filteredTutorials = tutorials.filter(tutorial =>
    tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutorial.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const colorClasses = {
    purple: 'from-purple-500/20 to-blue-500/20 border-purple-500/30',
    orange: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    indigo: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/client-portal">
            <Button variant="ghost" className="mb-4 text-gray-300 hover:text-white hover:bg-zinc-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug naar overzicht
            </Button>
          </Link>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg shadow-blue-500/20">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Knowledge Center</h1>
              <p className="text-gray-400 text-lg">Tutorials, documentatie en antwoorden op al je vragen</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Zoek in tutorials, FAQ's en documentatie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-zinc-900/80 border-zinc-800 text-white text-lg focus:border-[#ff6b35] transition-all"
            />
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="tutorials" className="space-y-8">
          <TabsList className="bg-zinc-900/80 border border-zinc-800">
            <TabsTrigger value="tutorials" className="data-[state=active]:bg-[#ff6b35]">
              <PlayCircle className="w-4 h-4 mr-2" />
              Tutorials
            </TabsTrigger>
            <TabsTrigger value="faq" className="data-[state=active]:bg-[#ff6b35]">
              <HelpCircle className="w-4 h-4 mr-2" />
              FAQ's
            </TabsTrigger>
            <TabsTrigger value="docs" className="data-[state=active]:bg-[#ff6b35]">
              <FileCode className="w-4 h-4 mr-2" />
              Documentatie
            </TabsTrigger>
          </TabsList>

          {/* Tutorials Tab */}
          <TabsContent value="tutorials" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTutorials.map((tutorial) => {
                const Icon = tutorial.icon;
                return (
                  <Card key={tutorial.id} className="bg-zinc-900/80 border-2 border-zinc-800 hover:border-[#ff6b35] transition-all group">
                    <CardHeader>
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorClasses[tutorial.color as keyof typeof colorClasses]} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-zinc-800 text-gray-300 text-xs">
                          {tutorial.category}
                        </Badge>
                        <Badge className="bg-zinc-800 text-gray-300 text-xs">
                          {tutorial.duration}
                        </Badge>
                        <Badge className="bg-zinc-800 text-gray-300 text-xs">
                          {tutorial.difficulty}
                        </Badge>
                      </div>

                      <CardTitle className="text-white text-xl">{tutorial.title}</CardTitle>
                      <CardDescription className="text-gray-400">
                        {tutorial.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-300 mb-3">Stappen:</h4>
                        {tutorial.steps.map((step, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm text-gray-400">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredTutorials.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Geen tutorials gevonden voor "{searchQuery}"</p>
              </div>
            )}
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            {filteredFaqs.map((category, idx) => (
              <Card key={idx} className="bg-zinc-900/80 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <HelpCircle className="w-6 h-6 text-[#ff6b35]" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {category.questions.map((item, qIdx) => (
                    <div key={qIdx} className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                      <h4 className="font-semibold text-white mb-2 flex items-start gap-2">
                        <span className="text-[#ff6b35]">Q:</span>
                        {item.q}
                      </h4>
                      <p className="text-gray-400 pl-6">{item.a}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            {filteredFaqs.length === 0 && (
              <div className="text-center py-12">
                <HelpCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Geen FAQ's gevonden voor "{searchQuery}"</p>
              </div>
            )}
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="docs" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {documentation.map((doc, idx) => {
                const Icon = doc.icon;
                return (
                  <Card key={idx} className="bg-zinc-900/80 border-2 border-zinc-800 hover:border-[#ff6b35] transition-all group">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff6b35]/20 to-orange-500/20 border border-[#ff6b35]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon className="w-8 h-8 text-[#ff6b35]" />
                        </div>
                        {doc.badge && (
                          <Badge className="bg-[#ff6b35] text-white">
                            {doc.badge}
                          </Badge>
                        )}
                      </div>
                      
                      <CardTitle className="text-white text-xl">{doc.title}</CardTitle>
                      <CardDescription className="text-gray-400">
                        {doc.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white"
                        disabled={doc.badge === 'Binnenkort'}
                      >
                        {doc.badge === 'Binnenkort' ? 'Binnenkort Beschikbaar' : 'Bekijk Documentatie'}
                        {doc.badge !== 'Binnenkort' && <ExternalLink className="w-4 h-4 ml-2" />}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Contact Support Card */}
        <Card className="mt-12 bg-gradient-to-br from-[#ff6b35]/10 to-orange-600/10 border-2 border-[#ff6b35]/30">
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-16 h-16 text-[#ff6b35] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Vraag niet beantwoord?</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Ons support team staat klaar om je te helpen. Stuur een bericht via de chat of neem contact op via email.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button className="bg-[#ff6b35] hover:bg-[#ff8c42] text-white">
                <MessageSquare className="w-4 h-4 mr-2" />
                Start Chat
              </Button>
              <Button variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
                Email Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
