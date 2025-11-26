
'use client';

import { Users, Target, Zap, Award, Heart, Rocket } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PublicNav from '@/components/public-nav';
import PublicFooter from '@/components/public-footer';

export default function OverOnsPage() {
  const values = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Innovatie',
      description: 'We blijven vooroplopen met de nieuwste AI-technologieën',
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Kwaliteit',
      description: 'Alleen de beste content voor jouw doelgroep',
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Resultaat',
      description: 'Meetbare groei in traffic en conversies',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Samenwerking',
      description: 'Jouw succes is ons succes',
    },
  ];

  const stats = [
    { value: '10.000+', label: 'Artikelen gegenereerd' },
    { value: '500+', label: 'Tevreden klanten' },
    { value: '99%', label: 'Klanttevredenheid' },
    { value: '24/7', label: 'Beschikbaar' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <PublicNav />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
            <Award className="w-4 h-4 text-orange-500" />
            <span className="text-orange-500 font-semibold text-sm">
              #1 AI Content Platform Nederland
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Wij zijn{' '}
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              Writgo Media
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            De toonaangevende AI-gedreven content automatisering platform dat ondernemers 
            en marketeers helpt om hun online aanwezigheid te maximaliseren met 
            hoogwaardige, SEO-geoptimaliseerde content.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-orange-500/20 p-8 sm:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                  Onze Missie
                </h2>
                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                  Bij Writgo Media geloven we dat content creatie niet moeilijk hoeft te zijn. 
                  Onze missie is om geavanceerde AI-technologie toegankelijk te maken voor 
                  iedereen, zodat jij je kunt focussen op wat echt belangrijk is: het 
                  groeien van je business.
                </p>
                <p className="text-gray-300 text-lg leading-relaxed">
                  We combineren state-of-the-art AI met deep learning modellen om content 
                  te genereren die niet alleen SEO-vriendelijk is, maar ook authentiek en 
                  waardevol voor je doelgroep.
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 opacity-20 blur-3xl rounded-full" />
                <div className="relative bg-gray-900/80 border border-orange-500/30 rounded-2xl p-8">
                  <Rocket className="w-16 h-16 text-orange-500 mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Waarom Writgo Media?
                  </h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2">✓</span>
                      <span>100% Nederlands geoptimaliseerde content</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2">✓</span>
                      <span>SEO-proof artikelen van 2500+ woorden</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2">✓</span>
                      <span>Directe WordPress integratie</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2">✓</span>
                      <span>AI-gegenereerde afbeeldingen</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2">✓</span>
                      <span>Automatische content planning</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Onze Kernwaarden
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Deze principes vormen de basis van alles wat we doen
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card
                key={index}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-orange-500/20 p-6 hover:border-orange-500/40 transition-all hover:scale-105"
              >
                <div className="text-orange-500 mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{value.title}</h3>
                <p className="text-gray-300">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-gradient-to-br from-orange-900/20 to-gray-900/50 border-orange-500/30 p-8 sm:p-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
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

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Klaar om je content strategie te automatiseren?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Sluit je aan bij honderden tevreden klanten en ervaar de kracht van AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/inloggen">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-lg px-8 py-6">
                Start Nu Gratis
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-orange-500 text-orange-500 hover:bg-orange-500/10 font-semibold text-lg px-8 py-6"
              >
                Neem Contact Op
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
