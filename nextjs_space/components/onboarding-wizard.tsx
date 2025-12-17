
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Sparkles,
  TrendingUp,
  FileText,
  Search,
  Settings,
  Zap,
  CheckCircle2,
  ArrowRight,
  Play,
  Youtube,
  MessageSquare,
  CreditCard,
  Globe,
  Link2,
  Star,
  Gift,
  Rocket
} from 'lucide-react';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingWizard({ isOpen, onClose }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: '🎉 Welkom bij WritgoAI!',
      description: 'Het meest complete AI content platform',
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-[#ff6b35] via-orange-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-orange-500/30 rotate-3 hover:rotate-0 transition-transform">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Welkom bij WritgoAI!
            </h3>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg">
              Het complete AI-platform voor automatische content creatie. Van keyword research tot WordPress publicatie - allemaal op één plek.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <Card className="p-4 text-center border-purple-500/50 bg-gradient-to-br from-purple-900/40 to-blue-900/40 text-white hover:scale-105 transition-transform">
              <Zap className="w-10 h-10 text-purple-400 mx-auto mb-3" />
              <h4 className="font-bold mb-1 text-white">Autopilot</h4>
              <p className="text-sm text-slate-300">
                Volledig automatisch
              </p>
            </Card>
            <Card className="p-4 text-center border-orange-500/50 bg-gradient-to-br from-orange-900/40 to-red-900/40 text-white hover:scale-105 transition-transform">
              <FileText className="w-10 h-10 text-orange-400 mx-auto mb-3" />
              <h4 className="font-bold mb-1 text-white">AI Writer</h4>
              <p className="text-sm text-slate-300">
                SEO content in minuten
              </p>
            </Card>
            <Card className="p-4 text-center border-green-500/50 bg-gradient-to-br from-green-900/40 to-emerald-900/40 text-white hover:scale-105 transition-transform">
              <TrendingUp className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <h4 className="font-bold mb-1 text-white">Optimizer</h4>
              <p className="text-sm text-slate-300">
                Verbeter bestaande content
              </p>
            </Card>
            <Card className="p-4 text-center border-blue-500/50 bg-gradient-to-br from-blue-900/40 to-cyan-900/40 text-white hover:scale-105 transition-transform">
              <Search className="w-10 h-10 text-blue-400 mx-auto mb-3" />
              <h4 className="font-bold mb-1 text-white">Research</h4>
              <p className="text-sm text-slate-300">
                Keyword opportuniteiten
              </p>
            </Card>
          </div>
        </div>
      ),
    },
    {
      title: '⚡ Belangrijkste Features',
      description: 'Wat je allemaal kunt doen',
      content: (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold mb-6 text-center">Alles wat je nodig hebt voor content creatie</h3>
          
          <div className="space-y-3">
            <FeatureItem
              icon={<Zap className="w-6 h-6 text-purple-500" />}
              title="🚀 Autopilot (NIEUW!)"
              description="Volledig automatische content creatie. Plan je content kalender en laat de AI alles doen: research, schrijven, optimaliseren én publiceren."
            />
            <FeatureItem
              icon={<Sparkles className="w-6 h-6 text-orange-500" />}
              title="Writgo Writer - AI Blogschrijver"
              description="Intelligente content writer met auto-detectie. Herkent automatisch of je een productlijst, review of normale blog wilt en past de structuur daarop aan."
            />
            <FeatureItem
              icon={<TrendingUp className="w-6 h-6 text-green-500" />}
              title="Content Optimizer (NIEUW!)"
              description="Analyseer en verbeter bestaande WordPress posts en WooCommerce producten met AI. Inclusief SEO analyse en één-klik updates."
            />
            <FeatureItem
              icon={<Search className="w-6 h-6 text-blue-500" />}
              title="Keyword Research"
              description="Uitgebreid keyword onderzoek met concurrent analyse, zoekvolume data en content planning. Vind precies waar je publiek naar zoekt."
            />
            <FeatureItem
              icon={<Link2 className="w-6 h-6 text-cyan-500" />}
              title="Link Building (NIEUW!)"
              description="Automatische link building tussen WritgoAI gebruikers. Opt-in systeem om je SEO rankings te verbeteren met relevante backlinks."
            />
            <FeatureItem
              icon={<Star className="w-6 h-6 text-amber-500" />}
              title="Affiliate Portal (NIEUW!)"
              description="Verdien 10% commissie op elke verwijzing, voor altijd! Krijg je eigen unieke affiliate link en track je verdiensten real-time."
            />
            <FeatureItem
              icon={<Globe className="w-6 h-6 text-indigo-500" />}
              title="WordPress & WooCommerce"
              description="Naadloze integratie met WordPress. Publiceer blogs direct of update WooCommerce producten met één klik. Inclusief afbeeldingen en perfecte opmaak."
            />
            <FeatureItem
              icon={<Youtube className="w-6 h-6 text-red-500" />}
              title="Video Generator"
              description="Genereer automatisch video's met AI voice-over, beeldmateriaal en ondertiteling voor social media marketing."
            />
          </div>
        </div>
      ),
    },
    {
      title: '🚀 Quick Start Guide',
      description: 'Begin direct met content creëren',
      content: (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold mb-6 text-center">Kies je eigen weg</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="p-6 bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-2 border-purple-500/50 text-white">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/30 flex items-center justify-center mb-4 mx-auto">
                <Rocket className="w-8 h-8 text-purple-300" />
              </div>
              <h4 className="font-bold text-xl mb-2 text-center">Autopilot Modus</h4>
              <p className="text-sm text-slate-200 text-center mb-4">
                Voor wie alles automatisch wil. Stel één keer in en laat de AI werken.
              </p>
              <Badge className="w-full justify-center bg-purple-500 text-white">
                Aanbevolen voor beginners
              </Badge>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-orange-900/40 to-red-900/40 border-2 border-orange-500/50 text-white">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/30 flex items-center justify-center mb-4 mx-auto">
                <FileText className="w-8 h-8 text-orange-300" />
              </div>
              <h4 className="font-bold text-xl mb-2 text-center">Handmatige Modus</h4>
              <p className="text-sm text-slate-200 text-center mb-4">
                Voor wie volledige controle wil. Kies zelf je onderwerpen en schrijfstijl.
              </p>
              <Badge className="w-full justify-center bg-orange-500 text-white">
                Voor gevorderde gebruikers
              </Badge>
            </Card>
          </div>

          <div className="space-y-4">
            <StepCard
              number="1"
              title="Maak je eerste Project aan"
              description="Begin met het aanmaken van een project voor je website. Koppel WordPress voor automatische publicatie."
              action="Ga naar Projecten"
              link="/client-portal/projects"
              icon={<Globe className="w-6 h-6" />}
              color="blue"
            />
            
            <StepCard
              number="2"
              title="Autopilot of Handmatig"
              description="Kies Autopilot voor volledig automatisch, of Writgo Writer voor handmatige controle per artikel."
              action="Bekijk alle Tools"
              link="/client-portal"
              icon={<Zap className="w-6 h-6" />}
              color="orange"
            />
            
            <StepCard
              number="3"
              title="Verdien commissie"
              description="Activeer je affiliate link en verdien 10% op elke gebruiker die je verwijst. Voor altijd!"
              action="Ga naar Affiliate Portal"
              link="/client-portal/affiliate"
              icon={<Gift className="w-6 h-6" />}
              color="green"
            />
          </div>

          <Card className="p-4 bg-slate-800 border-blue-400 text-white mt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Play className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1 text-white">💡 Pro Tip</h4>
                <p className="text-sm text-slate-200">
                  Begin met het Autopilot systeem - het doet al het werk voor je! Eenmaal ingesteld genereert het automatisch content op basis van jouw planning.
                </p>
              </div>
            </div>
          </Card>
        </div>
      ),
    },
    {
      title: '💳 Credits & Prijzen',
      description: 'Zo werkt het credit systeem',
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-bold mb-4">Credits Uitleg</h3>
          
          <Card className="p-4 bg-slate-800 border-blue-400 text-white">
            <div className="flex items-center gap-3 mb-3">
              <CreditCard className="w-8 h-8 text-blue-400" />
              <div>
                <h4 className="font-semibold text-white">Hoe werken credits?</h4>
                <p className="text-sm text-slate-300">Elke actie kost credits</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-200">• Blog genereren (gemiddeld)</span>
                <Badge variant="secondary" className="bg-blue-600 text-white">15-25 credits</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-200">• Keyword research</span>
                <Badge variant="secondary" className="bg-blue-600 text-white">10-15 credits</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-200">• Content research</span>
                <Badge variant="secondary" className="bg-blue-600 text-white">8-12 credits</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-200">• Afbeelding genereren</span>
                <Badge variant="secondary" className="bg-blue-600 text-white">3-5 credits</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-200">• AI Chat bericht</span>
                <Badge variant="secondary" className="bg-blue-600 text-white">1-3 credits</Badge>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Card className="p-4 text-center border-2 border-blue-400 bg-slate-800 text-white">
              <Badge className="mb-2 bg-blue-600">Basis</Badge>
              <div className="text-2xl font-bold mb-1 text-white">1000</div>
              <div className="text-xs text-slate-300 mb-3">credits/maand</div>
              <div className="text-xs space-y-1 text-slate-200">
                <div>✓ Volledige toegang tot alle features</div>
                <div>✓ Alle AI modellen beschikbaar</div>
                <div>✓ Alle tools & WordPress integratie</div>
              </div>
            </Card>
            
            <Card className="p-4 text-center border-2 border-orange-400 bg-slate-800 text-white">
              <Badge className="mb-2 bg-orange-600">Professional</Badge>
              <div className="text-2xl font-bold mb-1 text-white">3000</div>
              <div className="text-xs text-slate-300 mb-3">credits/maand</div>
              <div className="text-xs space-y-1 text-slate-200">
                <div>✓ Volledige toegang tot alle features</div>
                <div>✓ Alle AI modellen beschikbaar</div>
                <div>✓ Alle tools & WordPress integratie</div>
              </div>
            </Card>
          </div>

          <Card className="p-3 bg-slate-800 border-orange-400 mt-4 text-white">
            <p className="text-sm text-slate-200">
              <strong className="text-orange-400">💡 Tip:</strong> Credits worden automatisch iedere maand bijgevuld. 
              Extra credits kopen kan altijd in je account instellingen.
            </p>
          </Card>
        </div>
      ),
    },
    {
      title: '💎 Mijn Account & Credits',
      description: 'Beheer je account en credits',
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-bold mb-4">Account en Credits beheren</h3>
          
          <Card className="p-4 bg-slate-800 border-blue-400 text-white">
            <div className="flex items-start gap-3 mb-3">
              <CreditCard className="w-8 h-8 text-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-2">Credits Bijhouden</h4>
                <ul className="text-sm text-slate-200 space-y-2">
                  <li>• Je credit saldo is altijd zichtbaar rechtsboven in het dashboard</li>
                  <li>• Ga naar "Account" om je volledige credit geschiedenis te bekijken</li>
                  <li>• Credits worden automatisch bijgevuld aan het begin van elke maand</li>
                  <li>• Ongebruikte credits vervallen aan het einde van de maand</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-slate-800 border-orange-400 text-white">
            <div className="flex items-start gap-3 mb-3">
              <Sparkles className="w-8 h-8 text-orange-400 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-2">Extra Credits Kopen</h4>
                <ul className="text-sm text-slate-200 space-y-2">
                  <li>• Ga naar "Account" en klik op "Credits Bijkopen"</li>
                  <li>• Kies het aantal credits dat je nodig hebt</li>
                  <li>• Betaal veilig met Stripe (creditcard of iDEAL)</li>
                  <li>• Credits zijn direct beschikbaar na betaling</li>
                  <li>• Bijgekochte credits vervallen niet!</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-slate-800 border-green-400 text-white">
            <div className="flex items-start gap-3 mb-3">
              <Settings className="w-8 h-8 text-green-400 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-2">Abonnement Beheren</h4>
                <ul className="text-sm text-slate-200 space-y-2">
                  <li>• Bekijk je huidige pakket in "Account"</li>
                  <li>• Upgrade naar Professional voor meer credits</li>
                  <li>• Downgrade of annuleer je abonnement via Stripe</li>
                  <li>• Facturen zijn zichtbaar onder "Facturen" in je account</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-slate-800 border-purple-400 mt-4 text-white">
            <p className="text-sm text-slate-200">
              <strong className="text-purple-400">💡 Tip:</strong> Houd je credits in de gaten via het dashboard. 
              Je ontvangt een melding wanneer je minder dan 20 credits over hebt.
            </p>
          </Card>
        </div>
      ),
    },
    {
      title: '🔗 Integraties',
      description: 'Verbind WritgoAI met je tools',
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-bold mb-4">Integraties instellen</h3>
          
          <Card className="p-4 bg-slate-800 border-blue-400 text-white">
            <div className="flex items-start gap-3 mb-3">
              <Globe className="w-8 h-8 text-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-2">WordPress Integratie</h4>
                <ul className="text-sm text-slate-200 space-y-2 mb-3">
                  <li><strong className="text-blue-300">Stap 1:</strong> Ga naar Account → WordPress Instellingen</li>
                  <li><strong className="text-blue-300">Stap 2:</strong> Vul je WordPress URL in (bijv. https://jouwsite.nl)</li>
                  <li><strong className="text-blue-300">Stap 3:</strong> Maak een Application Password aan in WordPress (Gebruikers → Profiel)</li>
                  <li><strong className="text-blue-300">Stap 4:</strong> Voer je WordPress gebruikersnaam en application password in</li>
                  <li><strong className="text-blue-300">Stap 5:</strong> Test de verbinding en je bent klaar!</li>
                </ul>
                <p className="text-xs text-slate-300">Na het instellen kun je direct vanuit WritgoAI naar WordPress publiceren, inclusief afbeeldingen en opmaak.</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-slate-800 border-orange-400 text-white">
            <div className="flex items-start gap-3 mb-3">
              <TrendingUp className="w-8 h-8 text-orange-400 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-2">Bol.com Affiliate Integratie</h4>
                <ul className="text-sm text-slate-200 space-y-2 mb-3">
                  <li><strong className="text-orange-300">Stap 1:</strong> Meld je aan voor het Bol.com Partner Programma</li>
                  <li><strong className="text-orange-300">Stap 2:</strong> Vraag API toegang aan bij Bol.com</li>
                  <li><strong className="text-orange-300">Stap 3:</strong> Ga naar Account → Affiliate Instellingen</li>
                  <li><strong className="text-orange-300">Stap 4:</strong> Voer je Bol.com Client ID en Client Secret in</li>
                  <li><strong className="text-orange-300">Stap 5:</strong> Selecteer producten tijdens het genereren van content!</li>
                </ul>
                <p className="text-xs text-slate-300">Met deze integratie kun je automatisch affiliate productboxen toevoegen aan je content en commissie verdienen.</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-slate-800 border-green-400 text-white">
            <div className="flex items-start gap-3 mb-3">
              <Youtube className="w-8 h-8 text-green-400 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-2">Social Media Integraties (Binnenkort)</h4>
                <p className="text-sm text-slate-200 mb-2">
                  We werken aan integraties voor automatische publicatie naar:
                </p>
                <ul className="text-sm text-slate-200 space-y-1">
                  <li>• Facebook & Instagram</li>
                  <li>• LinkedIn</li>
                  <li>• Twitter/X</li>
                  <li>• TikTok</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-slate-800 border-purple-400 mt-4 text-white">
            <p className="text-sm text-slate-200">
              <strong className="text-purple-400">💡 Tip:</strong> Begin met de WordPress integratie - dit maakt publiceren 10x sneller! 
              Daarna kun je affiliate links toevoegen om je content te monetiseren.
            </p>
          </Card>
        </div>
      ),
    },
    {
      title: '✅ Je bent klaar!',
      description: 'Veel succes met content creëren',
      content: (
        <div className="space-y-6 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          
          <div>
            <h3 className="text-2xl font-bold mb-2">Je bent helemaal klaar!</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Je kunt nu beginnen met het creëren van geweldige content. 
              Heb je hulp nodig? Bekijk het Knowledge Center voor tutorials en FAQ.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <a href="/client-portal/knowledge-center">
              <Card className="p-4 text-left hover:shadow-lg transition-shadow cursor-pointer border-blue-400 bg-slate-800 text-white h-full">
                <BookOpen className="w-8 h-8 text-blue-400 mb-3" />
                <h4 className="font-semibold mb-1 text-white">Knowledge Center</h4>
                <p className="text-sm text-slate-300">
                  Tutorials, handleidingen en FAQ
                </p>
                <Button variant="link" className="p-0 h-auto mt-2 text-blue-400">
                  Bekijk nu <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Card>
            </a>

            <a href="/client-portal">
              <Card className="p-4 text-left hover:shadow-lg transition-shadow cursor-pointer border-orange-400 bg-slate-800 text-white h-full">
                <Zap className="w-8 h-8 text-orange-400 mb-3" />
                <h4 className="font-semibold mb-1 text-white">Start met creëren</h4>
                <p className="text-sm text-slate-300">
                  Begin direct met je eerste blog
                </p>
                <Button variant="link" className="p-0 h-auto mt-2 text-orange-400">
                  Naar Dashboard <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Card>
            </a>
          </div>

          <Card className="p-4 bg-slate-800 border-purple-400 text-white">
            <p className="text-sm text-slate-200">
              <strong className="text-purple-400">🎯 Nog vragen?</strong> Stuur een bericht via de chat of bekijk 
              de veelgestelde vragen in het Knowledge Center. We helpen je graag!
            </p>
          </Card>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    try {
      // Mark onboarding as completed in database
      await fetch('/api/client/complete-onboarding', {
        method: 'POST',
      });
      
      // Also set in localStorage as backup
      localStorage.setItem('onboardingCompleted', 'true');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge variant="secondary">
                Stap {currentStep + 1} van {steps.length}
              </Badge>
            </div>
            {steps[currentStep].title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center">
            {steps[currentStep].description}
          </p>
        </DialogHeader>

        <div className="py-6">
          {steps[currentStep].content}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
          <div
            className="bg-gradient-to-r from-blue-600 to-orange-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            Vorige
          </Button>

          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-blue-600'
                    : index < currentStep
                    ? 'bg-blue-300'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext}>
              Volgende <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleFinish} className="bg-gradient-to-r from-blue-600 to-orange-600">
              Start met WritgoAI <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        <button
          onClick={handleFinish}
          className="text-xs text-muted-foreground hover:text-foreground underline mx-auto block mt-2"
        >
          Onboarding overslaan
        </button>
      </DialogContent>
    </Dialog>
  );
}

// Helper Components
function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-sm mb-1 text-white">{title}</h4>
        <p className="text-xs text-slate-300">{description}</p>
      </div>
      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  action,
  link,
  icon,
  color,
}: {
  number: string;
  title: string;
  description: string;
  action: string;
  link?: string;
  icon: React.ReactNode;
  color: 'blue' | 'orange' | 'green';
}) {
  const colorClasses = {
    blue: 'bg-slate-800 text-blue-400 border-blue-400',
    orange: 'bg-slate-800 text-orange-400 border-orange-400',
    green: 'bg-slate-800 text-green-400 border-green-400',
  };

  const numberColorClasses = {
    blue: 'bg-blue-600 text-white',
    orange: 'bg-orange-600 text-white',
    green: 'bg-green-600 text-white',
  };

  const linkColorClasses = {
    blue: 'text-blue-400',
    orange: 'text-orange-400',
    green: 'text-green-400',
  };

  const content = (
    <Card className={`p-4 ${colorClasses[color]} text-white`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-full ${numberColorClasses[color]} flex items-center justify-center font-bold text-lg flex-shrink-0`}>
          {number}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {icon}
            <h4 className="font-semibold text-white">{title}</h4>
          </div>
          <p className="text-sm text-slate-200 mb-2">{description}</p>
          <Button variant="link" className={`p-0 h-auto text-xs ${linkColorClasses[color]}`}>
            {action} <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );

  return link ? <a href={link}>{content}</a> : content;
}
