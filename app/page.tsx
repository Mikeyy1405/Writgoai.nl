'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg"></div>
              <span className="text-xl font-bold text-white">WritGo AI</span>
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
      <section className="pt-32 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full">
            <span className="text-orange-400 text-sm font-medium">
              🚀 14 dagen gratis proberen • Geen setup nodig
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Van Keyword naar Artikel
            <br />
            <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
              in Minuten
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
            Automatiseer je WordPress content met AI. Betaal alleen voor wat je gebruikt. Alle features beschikbaar vanaf dag 1.
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
          <div className="mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-white mb-2">2000+</div>
              <div className="text-gray-400">Artikelen Gegenereerd</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">10x</div>
              <div className="text-gray-400">Sneller dan Handmatig</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">50+</div>
              <div className="text-gray-400">Uur Bespaard per Maand</div>
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

      {/* Hoe het werkt Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Van Keyword naar Artikel in 3 Stappen
            </h2>
            <p className="text-xl text-gray-300">
              Binnen minuten staat je SEO-geoptimaliseerde artikel live
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Koppel je WordPress
              </h3>
              <p className="text-gray-400">
                Verbind je WordPress site in één klik. Geen plugins of ingewikkelde setup nodig.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Voer je Keyword in
              </h3>
              <p className="text-gray-400">
                Geef het onderwerp of keyword op waar je over wilt schrijven. De AI doet de rest.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Klik op Genereren
              </h3>
              <p className="text-gray-400">
                Binnen minuten is je artikel klaar en automatisch gepubliceerd op je WordPress site.
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
              Kies het Pakket dat bij je Past
            </h2>
            <p className="text-xl text-gray-300 mb-2">
              Alle features beschikbaar in elk pakket. Betaal alleen voor je credits.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-orange-500/30 transition-all">
              <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
              <div className="mb-4">
                <span className="text-5xl font-bold text-white">€49</span>
                <span className="text-gray-400">/maand</span>
              </div>
              <div className="mb-6 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="text-3xl font-bold text-orange-400 mb-1">100 Credits</div>
                <div className="text-sm text-gray-400">Per maand</div>
              </div>
              
              <div className="mb-6 text-sm text-gray-300">
                <div className="font-semibold text-white mb-2">Wat kun je maken:</div>
                <div className="space-y-1">
                  <div>• Tot 50 lange artikelen (2000+ woorden)</div>
                  <div>• Tot 100 korte artikelen (1000 woorden)</div>
                </div>
              </div>

              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> AI afbeeldingen met Flux Pro
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> WordPress auto-publicatie
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> SEO optimalisatie
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> AutoPilot scheduling
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
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-2 border-orange-500 rounded-xl p-8 relative transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                🔥 Populair
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <div className="mb-4">
                <span className="text-5xl font-bold text-white">€79</span>
                <span className="text-gray-400">/maand</span>
              </div>
              <div className="mb-6 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                <div className="text-3xl font-bold text-orange-400 mb-1">250 Credits</div>
                <div className="text-sm text-gray-400">Per maand</div>
              </div>
              
              <div className="mb-6 text-sm text-gray-300">
                <div className="font-semibold text-white mb-2">Wat kun je maken:</div>
                <div className="space-y-1">
                  <div>• Tot 125 lange artikelen</div>
                  <div>• Tot 250 korte artikelen</div>
                </div>
              </div>

              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> AI afbeeldingen met Flux Pro
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> WordPress auto-publicatie
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> SEO optimalisatie
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> AutoPilot scheduling
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> Alle features unlocked
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-orange-400">⭐</span> Prioriteit support
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
              <div className="mb-4">
                <span className="text-5xl font-bold text-white">€199</span>
                <span className="text-gray-400">/maand</span>
              </div>
              <div className="mb-6 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="text-3xl font-bold text-orange-400 mb-1">1000 Credits</div>
                <div className="text-sm text-gray-400">Per maand</div>
              </div>
              
              <div className="mb-6 text-sm text-gray-300">
                <div className="font-semibold text-white mb-2">Wat kun je maken:</div>
                <div className="space-y-1">
                  <div>• Tot 500 lange artikelen</div>
                  <div>• Tot 1000 korte artikelen</div>
                </div>
              </div>

              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> AI afbeeldingen met Flux Pro
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> WordPress auto-publicatie
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> SEO optimalisatie
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> AutoPilot scheduling
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> Alle features unlocked
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-orange-400">⭐</span> Dedicated support
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-orange-400">⭐</span> Custom integraties mogelijk
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
                💎 Waarom WritGo AI?
              </h3>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-orange-400 mb-2">Geen Limieten</div>
                  <div className="text-sm text-gray-400">Alle features in elk pakket vanaf dag 1</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-400 mb-2">Fair & Transparant</div>
                  <div className="text-sm text-gray-400">Betaal alleen voor wat je gebruikt. Geen verborgen kosten.</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-400 mb-2">Nederlands & Support</div>
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
            Begin vandaag met automatische content generatie. Betaal alleen voor wat je gebruikt.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#pricing"
              className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-white px-12 py-4 rounded-lg font-semibold text-lg hover:shadow-2xl hover:shadow-orange-500/50 transition-all transform hover:scale-105"
            >
              Bekijk Pakketten →
            </a>
            <Link
              href="/register"
              className="inline-block bg-gray-800 text-white px-12 py-4 rounded-lg font-semibold text-lg hover:bg-gray-700 transition-all border border-gray-700"
            >
              Registreer Gratis
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-900">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>© 2025 WritGo AI. Alle rechten voorbehouden.</p>
        </div>
      </footer>
    </div>
  );
}
