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
              🚀 Vanaf €0.49 per artikel • 87% winstmarge
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            AI Content op Credits
            <br />
            <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
              Transparant & Winstgevend
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
            Betaal alleen voor wat je gebruikt. Geen limiet op features, alleen op credits. Alle tools beschikbaar vanaf dag 1.
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
              <div className="text-4xl font-bold text-white mb-2">€0.20</div>
              <div className="text-gray-400">Per Credit (Enterprise)</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">87%</div>
              <div className="text-gray-400">Winstmarge</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">100%</div>
              <div className="text-gray-400">Features Toegang</div>
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
            <p className="text-xl text-gray-300">
              Krachtige AI-tools om je WordPress content naar het volgende level te tillen
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🤖",
                title: "AI Content Generatie",
                desc: "Genereer automatisch hoogwaardige, SEO-geoptimaliseerde artikelen met de nieuwste AI-modellen (GPT-4, Claude).",
              },
              {
                icon: "⚡",
                title: "AutoPilot Mode",
                desc: "Stel een schema in en laat de AI automatisch content schrijven en publiceren. Volledig hands-off.",
              },
              {
                icon: "🎯",
                title: "SEO Optimalisatie",
                desc: "Keyword research, meta descriptions, internal linking - alles automatisch geoptimaliseerd voor Google.",
              },
              {
                icon: "📝",
                title: "WordPress Integratie",
                desc: "Direct publiceren naar je WordPress site via REST API. Geen plugins nodig.",
              },
              {
                icon: "📊",
                title: "Content Library",
                desc: "Beheer al je gegenereerde content op één plek. Bewerk, plan en publiceer wanneer je wilt.",
              },
              {
                icon: "🔄",
                title: "Content Updates",
                desc: "Update automatisch oude artikelen met nieuwe informatie om je rankings te behouden.",
              }
            ].map((feature, i) => (
              <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-orange-500/50 transition-all">
                <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Credit-Based Pricing met Hoge Marges
            </h2>
            <p className="text-xl text-gray-300 mb-2">
              Betaal alleen voor wat je gebruikt. Alle features beschikbaar vanaf dag 1.
            </p>
            <p className="text-sm text-gray-400">
              Geen whitelabel nonsense. Geen API limiet gedoe. Alleen credits.
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
                <div className="text-sm text-gray-400">€0.49 per credit</div>
              </div>
              
              <div className="mb-6 text-sm text-gray-300">
                <div className="font-semibold text-white mb-2">Wat kun je maken:</div>
                <div className="space-y-1">
                  <div>• 50 artikelen (2 credits)</div>
                  <div>• 100 korte artikelen</div>
                  <div>• 25 artikelen + afbeeldingen</div>
                </div>
              </div>

              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> Volledige toegang tot alle features
                </li>
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
              </ul>

              <div className="mb-4 text-xs text-gray-500 text-center">
                87% winstmarge • ~€6.20 API costs
              </div>

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
                <div className="text-sm text-gray-400">€0.32 per credit</div>
              </div>
              
              <div className="mb-6 text-sm text-gray-300">
                <div className="font-semibold text-white mb-2">Wat kun je maken:</div>
                <div className="space-y-1">
                  <div>• 125 artikelen (2 credits)</div>
                  <div>• 250 korte artikelen</div>
                  <div>• 62 artikelen + afbeeldingen</div>
                </div>
              </div>

              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> Volledige toegang tot alle features
                </li>
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
              </ul>

              <div className="mb-4 text-xs text-gray-500 text-center">
                80% winstmarge • ~€15.50 API costs
              </div>

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
                <div className="text-sm text-gray-400">€0.20 per credit</div>
              </div>
              
              <div className="mb-6 text-sm text-gray-300">
                <div className="font-semibold text-white mb-2">Wat kun je maken:</div>
                <div className="space-y-1">
                  <div>• 500 artikelen (2 credits)</div>
                  <div>• 1000 korte artikelen</div>
                  <div>• 250 artikelen + afbeeldingen</div>
                </div>
              </div>

              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center text-gray-300">
                  <span className="mr-2 text-green-400">✓</span> Volledige toegang tot alle features
                </li>
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
              </ul>

              <div className="mb-4 text-xs text-gray-500 text-center">
                69% winstmarge • ~€62.00 API costs
              </div>

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
                💎 Volledige Transparantie
              </h3>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-orange-400 mb-2">Geen Limieten</div>
                  <div className="text-sm text-gray-400">Alle features beschikbaar in elk pakket</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-400 mb-2">Hoge Marges</div>
                  <div className="text-sm text-gray-400">69-87% winst op subscriptions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-400 mb-2">Fair Pricing</div>
                  <div className="text-sm text-gray-400">API costs: €0.031-€0.145 per actie</div>
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
            Betaal alleen voor wat je gebruikt. Alle features direct beschikbaar. Start met 100 credits voor slechts €49/maand.
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
