'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  // Handle password reset redirect from email
  useEffect(() => {
    // Check if we have recovery tokens in the URL hash
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');

      // If this is a password recovery flow, redirect to reset-password page with the hash
      if (type === 'recovery') {
        router.replace('/reset-password' + window.location.hash);
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/">
              <Logo size="sm" />
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/#features" className="text-gray-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="/#pricing" className="text-gray-300 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/blog" className="text-gray-300 hover:text-white transition-colors">
                Blog
              </Link>
              <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
                Login
              </Link>
              <Link
                href="/register"
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 transition-all"
              >
                Start Gratis
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-300 hover:text-white p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800 bg-black/95 backdrop-blur-sm">
            <div className="px-4 py-4 space-y-3">
              <Link
                href="/#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-300 hover:text-white transition-colors py-2"
              >
                Features
              </Link>
              <Link
                href="/#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-300 hover:text-white transition-colors py-2"
              >
                Pricing
              </Link>
              <Link
                href="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-300 hover:text-white transition-colors py-2"
              >
                Blog
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-300 hover:text-white transition-colors py-2"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium text-center hover:shadow-lg hover:shadow-orange-500/50 transition-all"
              >
                Start Gratis
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-20 sm:pb-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full">
            <span className="text-orange-400 text-sm font-medium">
              🎁 Start nu met 25 gratis credits • Geen betaalgegevens nodig
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Automatiseer je WordPress
            <br />
            <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
              met AI Content Generatie
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
            Van keyword naar gepubliceerd artikel in minuten. Bespaar 50+ uur per maand met AI-powered SEO content.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center mb-12 text-gray-300">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>AI Artikelen</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>AI Afbeeldingen</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>SEO Research</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>WordPress Integratie</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#pricing"
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-2xl hover:shadow-orange-500/50 transition-all transform hover:scale-105"
            >
              Bekijk Pakketten →
            </a>
            <a
              href="#features"
              className="bg-gray-800 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-700 transition-all border border-gray-700"
            >
              Bekijk Features
            </a>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-3xl mx-auto">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">2000+</div>
              <div className="text-gray-400">Artikelen gegenereerd</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">10x</div>
              <div className="text-gray-400">Sneller dan handmatig</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">50+</div>
              <div className="text-gray-400">Uur bespaard/maand</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Alles wat je nodig hebt voor SEO Success
            </h2>
            <p className="text-xl text-gray-300 mb-4">
              Krachtige AI-tools om je WordPress content naar het volgende level te tillen
            </p>
            <p className="text-sm text-orange-400">
              Perfect voor bloggers, marketeers en affiliate marketeers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🤖",
                title: "AI Content Generatie",
                desc: "Genereer automatisch hoogwaardige, SEO-geoptimaliseerde artikelen met de nieuwste AI-modellen (GPT-4, Claude).",
                time: "Bespaar 2+ uur per artikel",
              },
              {
                icon: "⚡",
                title: "AutoPilot Mode",
                desc: "Stel een schema in en laat de AI automatisch content schrijven en publiceren. Volledig hands-off.",
                time: "Volledig geautomatiseerd",
              },
              {
                icon: "🎯",
                title: "SEO Optimalisatie",
                desc: "Keyword research, meta descriptions, internal linking - alles automatisch geoptimaliseerd voor Google.",
                time: "Bespaar 30 min per artikel",
              },
              {
                icon: "📝",
                title: "WordPress Integratie",
                desc: "Direct publiceren naar je WordPress site via REST API. Geen plugins nodig.",
                time: "Instant publicatie",
              },
              {
                icon: "📊",
                title: "Content Library",
                desc: "Beheer al je gegenereerde content op één plek. Bewerk, plan en publiceer wanneer je wilt.",
                time: "Overzichtelijk beheer",
              },
              {
                icon: "🔄",
                title: "Content Updates",
                desc: "Update automatisch oude artikelen met nieuwe informatie om je rankings te behouden.",
                time: "Stay relevant",
              },
              {
                icon: "📱",
                title: "Social Media Publishing",
                desc: "Publiceer automatisch je content naar sociale media kanalen. Vergroot je bereik en drive meer traffic.",
                time: "Multi-channel publicatie",
              },
              {
                icon: "🗺️",
                title: "Topical Authority Map",
                desc: "Visualiseer je content strategie en bouw topical authority op. Zie waar je expertise ligt en waar kansen zijn.",
                time: "Strategisch overzicht",
              }
            ].map((feature, i) => (
              <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-orange-500/50 transition-all">
                <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 mb-3">{feature.desc}</p>
                <p className="text-sm text-orange-400">{feature.time}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Gratis Starten Sectie */}
      <section className="py-20 px-4 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-y border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-500/20 rounded-full mb-6">
            <span className="text-4xl">🎁</span>
          </div>
          
          <h2 className="text-4xl font-bold text-white mb-6">
            Probeer Writgo Media Gratis
          </h2>
          
          <p className="text-xl text-gray-300 mb-12">
            Start vandaag met 25 gratis credits. Geen betaalgegevens nodig.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-left">
              <div className="flex items-start">
                <span className="text-green-400 text-2xl mr-3">✓</span>
                <div>
                  <h3 className="text-white font-semibold mb-1">25 Gratis Credits</h3>
                  <p className="text-gray-400 text-sm">Genoeg voor 12+ artikelen om de kwaliteit te testen</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-left">
              <div className="flex items-start">
                <span className="text-green-400 text-2xl mr-3">✓</span>
                <div>
                  <h3 className="text-white font-semibold mb-1">Alle Features</h3>
                  <p className="text-gray-400 text-sm">Volledige toegang tot AI, SEO tools en WordPress integratie</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-left">
              <div className="flex items-start">
                <span className="text-green-400 text-2xl mr-3">✓</span>
                <div>
                  <h3 className="text-white font-semibold mb-1">Geen Betaalgegevens</h3>
                  <p className="text-gray-400 text-sm">Direct starten zonder iDEAL of andere betaling</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-left">
              <div className="flex items-start">
                <span className="text-green-400 text-2xl mr-3">✓</span>
                <div>
                  <h3 className="text-white font-semibold mb-1">Upgrade Wanneer Je Wilt</h3>
                  <p className="text-gray-400 text-sm">Tevreden? Kies dan een pakket dat bij je past</p>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/register"
            className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-white px-12 py-4 rounded-lg font-semibold text-lg hover:shadow-2xl hover:shadow-orange-500/50 transition-all"
          >
            Start Gratis met 25 Credits 🎁
          </Link>
        </div>
      </section>

      {/* Hoe het werkt - 4 stappen */}
      <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Van niche naar gepubliceerd artikel in 4 stappen
            </h2>
            <p className="text-xl text-gray-300">
              Geen keyword research nodig. AI doet het werk voor je.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Stap 1 */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-orange-500/30 transition-all">
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  1
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Koppel je WordPress
                  </h3>
                  <p className="text-gray-300">
                    Verbind je WordPress site in één klik. Geen plugins of ingewikkelde setup nodig.
                  </p>
                </div>
              </div>
            </div>

            {/* Stap 2 */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-orange-500/30 transition-all">
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  2
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Maak een Topical Map
                  </h3>
                  <p className="text-gray-300">
                    AI analyseert je niche en genereert automatisch een complete contentstrategie met alle relevante onderwerpen. <span className="text-orange-400 font-semibold">Geen keyword research nodig!</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Stap 3 */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-orange-500/30 transition-all">
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  3
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Genereer met 1 klik
                  </h3>
                  <p className="text-gray-300">
                    Kies een onderwerp uit je Topical Map en genereer instant een SEO-geoptimaliseerd artikel van 2000+ woorden.
                  </p>
                </div>
              </div>
            </div>

            {/* Stap 4 */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-orange-500/30 transition-all">
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  4
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Bewerk & Publiceer
                  </h3>
                  <p className="text-gray-300">
                    Pas optioneel aan in de ingebouwde editor en publiceer direct naar je WordPress site met 1 klik.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Extra USP highlight */}
          <div className="mt-12 text-center">
            <div className="inline-block bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-xl px-8 py-4">
              <p className="text-lg text-gray-300">
                <span className="text-orange-400 font-bold">💡 Uniek:</span> De Topical Map genereert automatisch alle onderwerpen voor je niche.
                Concurrenten vereisen handmatige keyword invoer - wij niet!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Simpele, Transparante Prijzen
            </h2>
            <p className="text-xl text-gray-300 mb-4">
              Betaal alleen voor wat je gebruikt. Alle features beschikbaar vanaf dag 1.
            </p>
            <p className="text-sm text-orange-400">
              💡 Tip: Start eerst gratis met 25 credits, upgrade later naar een pakket
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-orange-500/30 transition-all">
              <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">€49</span>
                <span className="text-gray-400">/maand</span>
              </div>
              
              <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="text-gray-300 text-sm mb-3">
                  <div className="font-semibold text-white mb-2">📝 Wat je krijgt:</div>
                  <div className="space-y-1">
                    <div>• Tot 50 lange artikelen (2000+ woorden)</div>
                    <div>• Tot 100 korte artikelen (1000 woorden)</div>
                    <div>• AI afbeeldingen inbegrepen</div>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> AI Content Generatie
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> AI Afbeeldingen (Flux Pro)
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> SEO Research & Analyse
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> WordPress Integratie
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> AutoPilot Mode
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> Alle features unlocked
                </li>
              </ul>

              <Link
                href="/register?package=starter"
                className="block w-full bg-gray-800 text-white text-center px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-all"
              >
                Kies Starter
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-2 border-orange-500 rounded-xl p-8 relative md:transform md:scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                🔥 Populair
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">€79</span>
                <span className="text-gray-400">/maand</span>
              </div>
              
              <div className="mb-6 p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                <div className="text-gray-300 text-sm mb-3">
                  <div className="font-semibold text-white mb-2">📝 Wat je krijgt:</div>
                  <div className="space-y-1">
                    <div>• Tot 125 lange artikelen (2000+ woorden)</div>
                    <div>• Tot 250 korte artikelen (1000 woorden)</div>
                    <div>• AI afbeeldingen inbegrepen</div>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> AI Content Generatie
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> AI Afbeeldingen (Flux Pro)
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> SEO Research & Analyse
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> WordPress Integratie
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> AutoPilot Mode
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> Alle features unlocked
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-orange-400">✓</span> <strong>Prioriteit support</strong>
                </li>
              </ul>

              <Link
                href="/register?package=pro"
                className="block w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-center px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 transition-all"
              >
                Kies Pro
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-orange-500/30 transition-all">
              <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">€199</span>
                <span className="text-gray-400">/maand</span>
              </div>
              
              <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="text-gray-300 text-sm mb-3">
                  <div className="font-semibold text-white mb-2">📝 Wat je krijgt:</div>
                  <div className="space-y-1">
                    <div>• Tot 500 lange artikelen (2000+ woorden)</div>
                    <div>• Tot 1000 korte artikelen (1000 woorden)</div>
                    <div>• AI afbeeldingen inbegrepen</div>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> AI Content Generatie
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> AI Afbeeldingen (Flux Pro)
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> SEO Research & Analyse
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> WordPress Integratie
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> AutoPilot Mode
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> Alle features unlocked
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-orange-400">✓</span> <strong>Dedicated support</strong>
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-orange-400">✓</span> <strong>Custom integraties mogelijk</strong>
                </li>
              </ul>

              <Link
                href="/register?package=enterprise"
                className="block w-full bg-gray-800 text-white text-center px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-all"
              >
                Kies Enterprise
              </Link>
            </div>
          </div>

          {/* Transparency Note */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
              <h3 className="text-xl font-semibold text-white mb-4 text-center">
                💎 Waarom Writgo Media?
              </h3>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-orange-400 mb-2">Geen Limieten</div>
                  <div className="text-sm text-gray-400">Alle features beschikbaar in elk pakket vanaf dag 1</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-400 mb-2">Fair & Transparant</div>
                  <div className="text-sm text-gray-400">Betaal alleen voor wat je gebruikt. Geen verborgen kosten.</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-400 mb-2">🇳🇱 Nederlands</div>
                  <div className="text-sm text-gray-400">Volledig Nederlandstalige interface en support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-y border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Klaar om te beginnen?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Begin met 25 gratis credits. Geen betaalgegevens nodig. Upgrade wanneer je tevreden bent.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-white px-12 py-4 rounded-lg font-semibold text-lg hover:shadow-2xl hover:shadow-orange-500/50 transition-all"
            >
              Start Gratis met 25 Credits 🎁
            </Link>
            <a
              href="#pricing"
              className="inline-block bg-gray-800 text-white px-12 py-4 rounded-lg font-semibold text-lg hover:bg-gray-700 transition-all border border-gray-700"
            >
              Bekijk Pakketten
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-900">
        <div className="max-w-7xl mx-auto">
          
          {/* Payment Methods */}
          <div className="mb-8 text-center px-4">
            <p className="text-gray-500 text-sm mb-4">Veilig betalen met</p>
            <div className="flex justify-center overflow-hidden">
              <img
                src="/images/payment-methods.png"
                alt="Betaalmethoden: iDEAL, Visa, Mastercard, PayPal, Bancontact en SOFORT"
                className="max-w-full h-auto object-contain"
                style={{ maxHeight: '60px' }}
              />
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center items-center gap-6 mb-8 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              SSL Beveiligd
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              GDPR Compliant
            </span>
            <span className="flex items-center gap-2">
              🇳🇱 Nederlands Bedrijf
            </span>
          </div>

          {/* Powered by Stripe */}
          <div className="text-center mb-6">
            <span className="text-xs text-gray-600">Powered by </span>
            <svg className="inline h-4" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 01-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 013.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 01-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 01-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 00-4.1-1.06c-.86 0-1.44.25-1.44.93 0 1.85 6.29.97 6.29 5.88z" fill="#635BFF"/>
            </svg>
          </div>

          {/* Copyright */}
          <div className="text-center text-gray-400">
            <p>© 2025 Writgo Media. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
