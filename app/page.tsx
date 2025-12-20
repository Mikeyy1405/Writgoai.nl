import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
              <span className="text-xl font-bold text-white">WritGo AI</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-slate-300 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/50 transition-all"
              >
                Start Gratis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <span className="text-blue-400 text-sm font-medium">
              🤖 AI-Powered WordPress SEO Agent
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Automatisch SEO Content
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              voor je WordPress
            </span>
          </h1>
          
          <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto">
            Laat AI automatisch hoogwaardige, SEO-geoptimaliseerde content schrijven en publiceren naar je WordPress website. Bespaar uren werk en rank hoger in Google.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-105"
            >
              Start Gratis Trial →
            </Link>
            <a
              href="#features"
              className="bg-slate-800 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-slate-700 transition-all border border-slate-600"
            >
              Bekijk Features
            </a>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-white mb-2">10,000+</div>
              <div className="text-slate-400">Artikelen Gegenereerd</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">95%</div>
              <div className="text-slate-400">Tijd Bespaard</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">4.9/5</div>
              <div className="text-slate-400">Klanttevredenheid</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Alles wat je nodig hebt voor SEO Success
            </h2>
            <p className="text-xl text-slate-300">
              Krachtige AI-tools om je WordPress content naar het volgende level te tillen
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🤖",
                title: "AI Content Generatie",
                desc: "Genereer automatisch hoogwaardige, SEO-geoptimaliseerde artikelen met de nieuwste AI-modellen (GPT-4, Claude).",
                color: "blue"
              },
              {
                icon: "⚡",
                title: "AutoPilot Mode",
                desc: "Stel een schema in en laat de AI automatisch content schrijven en publiceren. Volledig hands-off.",
                color: "purple"
              },
              {
                icon: "🎯",
                title: "SEO Optimalisatie",
                desc: "Keyword research, meta descriptions, internal linking - alles automatisch geoptimaliseerd voor Google.",
                color: "green"
              },
              {
                icon: "📝",
                title: "WordPress Integratie",
                desc: "Direct publiceren naar je WordPress site via REST API. Geen plugins nodig.",
                color: "yellow"
              },
              {
                icon: "📊",
                title: "Content Library",
                desc: "Beheer al je gegenereerde content op één plek. Bewerk, plan en publiceer wanneer je wilt.",
                color: "pink"
              },
              {
                icon: "🔄",
                title: "Content Updates",
                desc: "Update automatisch oude artikelen met nieuwe informatie om je rankings te behouden.",
                color: "cyan"
              }
            ].map((feature, i) => (
              <div key={i} className={`bg-slate-900/50 border border-slate-700 rounded-xl p-8 hover:border-${feature.color}-500/50 transition-all`}>
                <div className={`w-12 h-12 bg-${feature.color}-500/10 rounded-lg flex items-center justify-center mb-4`}>
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Simpele, Transparante Prijzen
            </h2>
            <p className="text-xl text-slate-300">
              Kies het plan dat bij jou past. Altijd opzegbaar.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">€49</span>
                <span className="text-slate-400">/maand</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-slate-300">
                  <span className="mr-2">✓</span> 50 artikelen/maand
                </li>
                <li className="flex items-center text-slate-300">
                  <span className="mr-2">✓</span> 1 WordPress site
                </li>
                <li className="flex items-center text-slate-300">
                  <span className="mr-2">✓</span> SEO optimalisatie
                </li>
                <li className="flex items-center text-slate-300">
                  <span className="mr-2">✓</span> Email support
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full bg-slate-700 text-white text-center px-6 py-3 rounded-lg font-medium hover:bg-slate-600 transition-all"
              >
                Start Gratis
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500 rounded-xl p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Meest Populair
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">€99</span>
                <span className="text-slate-400">/maand</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-slate-300">
                  <span className="mr-2">✓</span> 200 artikelen/maand
                </li>
                <li className="flex items-center text-slate-300">
                  <span className="mr-2">✓</span> 5 WordPress sites
                </li>
                <li className="flex items-center text-slate-300">
                  <span className="mr-2">✓</span> AutoPilot mode
                </li>
                <li className="flex items-center text-slate-300">
                  <span className="mr-2">✓</span> Priority support
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/50 transition-all"
              >
                Start Gratis
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">€299</span>
                <span className="text-slate-400">/maand</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-slate-300">
                  <span className="mr-2">✓</span> Unlimited artikelen
                </li>
                <li className="flex items-center text-slate-300">
                  <span className="mr-2">✓</span> Unlimited sites
                </li>
                <li className="flex items-center text-slate-300">
                  <span className="mr-2">✓</span> White-label optie
                </li>
                <li className="flex items-center text-slate-300">
                  <span className="mr-2">✓</span> Dedicated support
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full bg-slate-700 text-white text-center px-6 py-3 rounded-lg font-medium hover:bg-slate-600 transition-all"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-y border-slate-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Klaar om te starten?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Begin vandaag nog met automatische content generatie. Geen creditcard nodig voor de trial.
          </p>
          <Link
            href="/register"
            className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-12 py-4 rounded-lg font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-105"
          >
            Start Gratis Trial →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto text-center text-slate-400">
          <p>© 2025 WritGo AI. Alle rechten voorbehouden.</p>
        </div>
      </footer>
    </div>
  );
}
