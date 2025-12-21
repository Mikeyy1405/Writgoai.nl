import { Metadata } from 'next';
import Link from 'next/link';
import AuthorBox from '@/components/AuthorBox';
import { MIKE_SCHONEWILLE } from '@/lib/author-profile';

export const metadata: Metadata = {
  title: 'Over Ons - WritGo | AI-Powered SEO Content Platform',
  description: 'Leer meer over WritGo en oprichter Mike Schonewille. 10+ jaar ervaring in SEO, 50+ succesvolle affiliate websites, en nu de toekomst van AI-powered content.',
  alternates: {
    canonical: 'https://writgo.nl/over-ons',
  },
  openGraph: {
    title: 'Over WritGo - AI-Powered SEO Content Platform',
    description: 'Ontdek het verhaal achter WritGo en oprichter Mike Schonewille',
    url: 'https://writgo.nl/over-ons',
    siteName: 'WritGo',
    locale: 'nl_NL',
    type: 'website',
  },
};

export default function OverOnsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="text-orange-600 hover:text-orange-700 inline-block">
            ← Terug naar home
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Over <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">WritGo</span>
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
            Van 10 jaar hands-on SEO ervaring naar de toekomst van AI-powered content generatie
          </p>
        </div>

        {/* Story Section */}
        <div className="prose prose-lg prose-invert max-w-none mb-16">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-white mb-6">Ons Verhaal</h2>
            
            <p className="text-gray-300 leading-relaxed mb-6">
              WritGo is geboren uit een simpele frustratie: <strong className="text-white">waarom duurt het zo lang om goede SEO content te maken?</strong>
            </p>

            <p className="text-gray-300 leading-relaxed mb-6">
              Na 10 jaar van het bouwen en optimaliseren van meer dan 50 affiliate websites, wist oprichter Mike Schonewille precies wat er nodig was voor succesvolle SEO. Maar het proces was altijd hetzelfde: uren research, schrijven, optimaliseren, en publiceren. En dat voor elk artikel.
            </p>

            <p className="text-gray-300 leading-relaxed mb-6">
              Toen AI-technologie zoals GPT-4 en Claude mainstream werd, zag Mike de kans: <strong className="text-white">wat als we AI konden trainen om content te schrijven zoals een SEO-expert dat zou doen?</strong>
            </p>

            <p className="text-gray-300 leading-relaxed mb-6">
              Het resultaat is WritGo: een platform dat 10 jaar SEO-expertise combineert met cutting-edge AI om automatisch hoogwaardige, SEO-geoptimaliseerde content te genereren die echt rankt in Google.
            </p>

            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-6 my-8">
              <h3 className="text-xl font-bold text-orange-400 mb-3">Onze Missie</h3>
              <p className="text-gray-300 leading-relaxed mb-0">
                WritGo maakt professionele SEO toegankelijk voor iedereen. Of je nu een startup bent die net begint, of een gevestigd bedrijf dat wil schalen - wij geloven dat iedereen toegang moet hebben tot content die rankt.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-orange-500 mb-2">10+</div>
            <div className="text-gray-400 text-sm">Jaar Ervaring</div>
          </div>
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-orange-500 mb-2">50+</div>
            <div className="text-gray-400 text-sm">Affiliate Sites</div>
          </div>
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-orange-500 mb-2">1000+</div>
            <div className="text-gray-400 text-sm">Artikelen Gerankt</div>
          </div>
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-orange-500 mb-2">24/7</div>
            <div className="text-gray-400 text-sm">AI AutoPilot</div>
          </div>
        </div>

        {/* Founder Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Oprichter</h2>
          <AuthorBox author={MIKE_SCHONEWILLE} showFull={true} />
        </div>

        {/* Values Section */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 md:p-12 mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Onze Waarden</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Kwaliteit Eerst</h3>
              <p className="text-gray-400 leading-relaxed">
                Geen spam, geen low-quality content. Alleen artikelen die je trots bent om te publiceren.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Snelheid</h3>
              <p className="text-gray-400 leading-relaxed">
                Van idee naar gepubliceerd artikel in minuten, niet dagen. Schaal je content zonder extra team.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Innovatie</h3>
              <p className="text-gray-400 leading-relaxed">
                We blijven voorop lopen met de nieuwste AI-technologie en SEO best practices.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Klaar om te beginnen?
          </h2>
          <p className="text-orange-100 mb-8 text-lg">
            Sluit je aan bij honderden bedrijven die hun content al automatiseren met WritGo
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-block bg-white text-orange-600 px-8 py-4 rounded-lg font-semibold hover:bg-orange-50 transition-colors text-lg"
            >
              Start Gratis →
            </Link>
            <Link
              href="/contact"
              className="inline-block bg-orange-700 text-white px-8 py-4 rounded-lg font-semibold hover:bg-orange-800 transition-colors text-lg"
            >
              Neem Contact Op
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
