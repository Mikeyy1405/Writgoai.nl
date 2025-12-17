import Link from 'next/link';
import { 
  Zap, Target, TrendingUp, Clock, Shield, BarChart,
  CheckCircle, ArrowRight, Star, Sparkles
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Sparkles className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold text-white ml-2">Writgo</span>
              <span className="text-orange-500 ml-1">.nl</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-300 hover:text-white transition">
                Features
              </a>
              <a href="#pricing" className="text-slate-300 hover:text-white transition">
                Prijzen
              </a>
              <Link href="/blog" className="text-slate-300 hover:text-white transition">
                Blog
              </Link>
              <a href="#faq" className="text-slate-300 hover:text-white transition">
                FAQ
              </a>
              <Link 
                href="/login" 
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition font-medium"
              >
                Inloggen
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4 text-orange-500 mr-2" />
              <span className="text-orange-500 text-sm font-medium">
                AI-Powered Content Generatie
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Domineer Google Met
              <br />
              <span className="text-orange-500">Topical Authority</span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Genereer automatisch 400-500 SEO-geoptimaliseerde artikelen. 
              Publiceer dagelijks op autopilot. Bouw echte autoriteit op in je niche.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <a 
                href="#pricing"
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-medium transition inline-flex items-center justify-center shadow-lg shadow-orange-500/30"
              >
                Start Nu - Vanaf €97/maand
                <ArrowRight className="ml-2 w-5 h-5" />
              </a>
              
              <Link 
                href="/blog"
                className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition border border-slate-700"
              >
                Bekijk Voorbeelden
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-orange-500 mb-1">450+</div>
                <div className="text-slate-400 text-sm">Artikelen per Map</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-500 mb-1">24/7</div>
                <div className="text-slate-400 text-sm">Autopilot Mode</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-500 mb-1">10+</div>
                <div className="text-slate-400 text-sm">WordPress Sites</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Alles Wat Je Nodig Hebt
            </h2>
            <p className="text-xl text-slate-300">
              Van strategie tot publicatie - volledig geautomatiseerd
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: 'Topical Authority Maps',
                description: 'Genereer automatisch 450 gestructureerde artikelen die je niche volledig dekken. Gebaseerd op bewezen SEO-strategieën.'
              },
              {
                icon: Zap,
                title: 'Autopilot Publishing',
                description: 'Publiceer dagelijks automatisch naar WordPress. Stel in en vergeet het. Jouw content machine draait 24/7.'
              },
              {
                icon: TrendingUp,
                title: 'Google Search Console',
                description: 'Real-time performance tracking. Krijg alerts en AI-powered tips om je rankings te verbeteren.'
              },
              {
                icon: Clock,
                title: 'Bespaar 100+ Uren',
                description: 'Wat normaal maanden duurt, doen wij in minuten. Focus op je business, wij regelen de content.'
              },
              {
                icon: Shield,
                title: 'SEO Geoptimaliseerd',
                description: 'Elke artikel is geoptimaliseerd voor focus keywords, internal links, en leesbare structuur.'
              },
              {
                icon: BarChart,
                title: 'Performance Analytics',
                description: 'Track clicks, impressions, CTR en posities. Zie precies welke content werkt en waarom.'
              }
            ].map((feature, i) => (
              <div 
                key={i}
                className="bg-slate-900 rounded-lg p-8 border border-slate-700 hover:border-orange-500 transition group"
              >
                <div className="bg-orange-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-500/30 transition">
                  <feature.icon className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Hoe Het Werkt
            </h2>
            <p className="text-xl text-slate-300">
              Van nul naar 450 artikelen in 4 simpele stappen
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { 
                step: '1', 
                title: 'Verbind WordPress', 
                desc: 'Koppel je WordPress site in 30 seconden. Geen technische kennis nodig.',
                icon: '🔗'
              },
              { 
                step: '2', 
                title: 'Genereer Map', 
                desc: '450 artikelen automatisch gepland op basis van topical authority.',
                icon: '🗺️'
              },
              { 
                step: '3', 
                title: 'Activeer Autopilot', 
                desc: 'Dagelijks automatisch publiceren. Stel frequentie en tijd in.',
                icon: '🚀'
              },
              { 
                step: '4', 
                title: 'Track & Optimize', 
                desc: 'GSC metrics en AI tips om je rankings te maximaliseren.',
                icon: '📈'
              }
            ].map((item, i) => (
              <div key={i} className="text-center relative">
                {i < 3 && (
                  <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-slate-700"></div>
                )}
                <div className="bg-orange-500 w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4 relative z-10 shadow-lg shadow-orange-500/30">
                  {item.step}
                </div>
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Transparante Prijzen
            </h2>
            <p className="text-xl text-slate-300">
              Kies het pakket dat bij jou past. Geen verborgen kosten.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter */}
            <div className="bg-slate-900 rounded-lg p-8 border border-slate-700">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
                <p className="text-slate-400 mb-6">Perfect om te beginnen</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">€97</span>
                  <span className="text-slate-400">/maand</span>
                </div>
                <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg px-4 py-2 inline-block">
                  <span className="text-orange-500 font-medium">1.000 Credits/maand</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                {[
                  '1 WordPress Site',
                  '1 Topical Authority Map',
                  '50 Artikelen/maand',
                  'Autopilot Publishing',
                  'GSC Integratie',
                  'Email Support'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-orange-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <a 
                href="#contact"
                className="block w-full bg-slate-800 hover:bg-slate-700 text-white text-center px-6 py-3 rounded-lg font-medium transition border border-slate-700"
              >
                Start Starter
              </a>
            </div>

            {/* Professional (Popular) */}
            <div className="bg-slate-900 rounded-lg p-8 border-2 border-orange-500 relative transform scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Meest Populair
              </div>
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Professional</h3>
                <p className="text-slate-400 mb-6">Voor serieuze marketeers</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">€197</span>
                  <span className="text-slate-400">/maand</span>
                </div>
                <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg px-4 py-2 inline-block">
                  <span className="text-orange-500 font-medium">3.000 Credits/maand</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                {[
                  '5 WordPress Sites',
                  '5 Topical Authority Maps',
                  '150 Artikelen/maand',
                  'Autopilot Publishing',
                  'GSC Integratie',
                  'Priority Support',
                  'Content Rewriter',
                  'Performance Alerts'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-orange-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <a 
                href="#contact"
                className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-center px-6 py-3 rounded-lg font-medium transition shadow-lg shadow-orange-500/30"
              >
                Start Professional
              </a>
            </div>

            {/* Enterprise */}
            <div className="bg-slate-900 rounded-lg p-8 border border-slate-700">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
                <p className="text-slate-400 mb-6">Voor agencies & teams</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">€497</span>
                  <span className="text-slate-400">/maand</span>
                </div>
                <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg px-4 py-2 inline-block">
                  <span className="text-orange-500 font-medium">10.000 Credits/maand</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                {[
                  'Onbeperkt WordPress Sites',
                  'Onbeperkt Topical Maps',
                  '500+ Artikelen/maand',
                  'Autopilot Publishing',
                  'GSC Integratie',
                  'Dedicated Support',
                  'White Label Optie',
                  'API Access',
                  'Custom Integraties'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-orange-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <a 
                href="#contact"
                className="block w-full bg-slate-800 hover:bg-slate-700 text-white text-center px-6 py-3 rounded-lg font-medium transition border border-slate-700"
              >
                Start Enterprise
              </a>
            </div>
          </div>
          
          {/* Credits Uitleg */}
          <div className="mt-16 max-w-4xl mx-auto bg-slate-900 rounded-lg p-8 border border-slate-700">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              💳 Hoe Werken Credits?
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500 mb-2">1 Credit</div>
                <div className="text-slate-300 text-sm">= 1 Artikel Genereren</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500 mb-2">10 Credits</div>
                <div className="text-slate-300 text-sm">= 1 Topical Map (450 artikelen)</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500 mb-2">5 Credits</div>
                <div className="text-slate-300 text-sm">= 1 Content Rewrite</div>
              </div>
            </div>
            
            <p className="text-slate-400 text-center mt-6 text-sm">
              Credits vervallen niet en rollen over naar de volgende maand. 
              Extra credits bijkopen mogelijk vanaf €0,10/credit.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Wat Klanten Zeggen
            </h2>
            <p className="text-xl text-slate-300">
              Echte resultaten van echte gebruikers
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Mark van der Berg',
                role: 'SEO Specialist',
                company: 'Gigadier.nl',
                text: 'In 3 maanden van 0 naar 50.000 bezoekers per maand. Writgo heeft ons geholpen om echte topical authority op te bouwen.',
                rating: 5
              },
              {
                name: 'Lisa Jansen',
                role: 'Content Manager',
                company: 'Yogastartgids.nl',
                text: 'De autopilot functie is geweldig. Ik hoef alleen maar te checken en goedkeuren. Bespaart me 20+ uur per week.',
                rating: 5
              },
              {
                name: 'Tom Bakker',
                role: 'Founder',
                company: 'Muzieklesclub.nl',
                text: 'ROI binnen 2 maanden. De GSC integratie geeft me precies de inzichten die ik nodig heb om te optimaliseren.',
                rating: 5
              }
            ].map((testimonial, i) => (
              <div 
                key={i}
                className="bg-slate-900 rounded-lg p-8 border border-slate-700"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-orange-500 fill-orange-500" />
                  ))}
                </div>
                
                <p className="text-slate-300 mb-6 leading-relaxed">
                  &quot;{testimonial.text}&quot;
                </p>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold mr-4">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-medium">{testimonial.name}</div>
                    <div className="text-slate-400 text-sm">{testimonial.role} @ {testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 bg-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Veelgestelde Vragen
            </h2>
          </div>
          
          <div className="space-y-6">
            {[
              {
                q: 'Hoe snel kan ik starten?',
                a: 'Direct na aanmelding kun je je eerste WordPress site koppelen en binnen 10 minuten je eerste topical authority map genereren.'
              },
              {
                q: 'Zijn de artikelen uniek?',
                a: 'Ja, elk artikel is 100% uniek gegenereerd door AI. We gebruiken geavanceerde modellen die originele, leesbare content produceren.'
              },
              {
                q: 'Kan ik de content aanpassen?',
                a: 'Absoluut! Je kunt elk artikel bewerken voordat het wordt gepubliceerd. Of gebruik de autopilot om direct te publiceren.'
              },
              {
                q: 'Wat als ik meer credits nodig heb?',
                a: 'Je kunt altijd extra credits bijkopen voor €0,10 per credit. Of upgrade naar een hoger pakket voor betere value.'
              },
              {
                q: 'Werkt het met elke WordPress site?',
                a: 'Ja, Writgo werkt met elke WordPress site. Je hebt alleen de WordPress URL en API credentials nodig.'
              },
              {
                q: 'Kan ik opzeggen wanneer ik wil?',
                a: 'Ja, geen lange contracten. Je kunt maandelijks opzeggen. Credits die je hebt blijven beschikbaar.'
              }
            ].map((faq, i) => (
              <div 
                key={i}
                className="bg-slate-900 rounded-lg p-6 border border-slate-700"
              >
                <h3 className="text-lg font-bold text-white mb-3">{faq.q}</h3>
                <p className="text-slate-300 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Klaar Om Te Domineren?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Start vandaag nog met het bouwen van je content empire. 
            Eerste 100 credits gratis bij aanmelding.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#pricing"
              className="bg-white hover:bg-slate-100 text-orange-500 px-8 py-4 rounded-lg text-lg font-medium transition inline-flex items-center justify-center shadow-lg"
            >
              Start Nu - Vanaf €97/maand
              <ArrowRight className="ml-2 w-5 h-5" />
            </a>
            
            <Link 
              href="/blog"
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition border-2 border-white/20"
            >
              Bekijk Voorbeelden
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <Sparkles className="w-6 h-6 text-orange-500" />
                <span className="text-xl font-bold text-white ml-2">Writgo.nl</span>
              </div>
              <p className="text-slate-400 text-sm">
                AI-Powered Content Generatie voor WordPress
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-slate-400 hover:text-white text-sm">Features</a></li>
                <li><a href="#pricing" className="text-slate-400 hover:text-white text-sm">Prijzen</a></li>
                <li><Link href="/blog" className="text-slate-400 hover:text-white text-sm">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#faq" className="text-slate-400 hover:text-white text-sm">FAQ</a></li>
                <li><a href="mailto:info@writgo.nl" className="text-slate-400 hover:text-white text-sm">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/(marketing)/privacybeleid" className="text-slate-400 hover:text-white text-sm">Privacy</Link></li>
                <li><Link href="/(marketing)/algemene-voorwaarden" className="text-slate-400 hover:text-white text-sm">Voorwaarden</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 text-center">
            <p className="text-slate-400 text-sm">
              © 2024 Writgo.nl - AI-Powered Content Generation. Alle rechten voorbehouden.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
