
'use client';

import PublicNav from '@/components/public-nav';
import PublicFooter from '@/components/public-footer';
import { Mail, MessageSquare, Phone } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <PublicNav />
      
      <main className="container mx-auto px-4 py-24 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Contact
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            We helpen je graag verder met je vragen
          </p>
          <p className="text-lg text-orange-400 font-semibold">
            💬 Geen sales calls - wij doen het anders
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 text-center">
            <Mail className="h-10 w-10 text-[#ff6b35] mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Email</h3>
            <a href="mailto:info@WritgoAI.nl" className="text-gray-300 hover:text-[#ff6b35] transition-colors">
              info@WritgoAI.nl
            </a>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 text-center">
            <MessageSquare className="h-10 w-10 text-[#ff6b35] mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Chat</h3>
            <p className="text-gray-300">
              Direct antwoord via support chat
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 text-center">
            <Phone className="h-10 w-10 text-[#ff6b35] mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Support</h3>
            <p className="text-gray-300">
              24/7 bereikbaar via dashboard
            </p>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Stuur ons een bericht</h2>
          
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Naam
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff6b35]"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff6b35]"
                required
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                Onderwerp
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff6b35]"
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                Bericht
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff6b35]"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#ff6b35] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#ff5722] transition-colors"
            >
              Verstuur bericht
            </button>
          </form>

          <p className="text-sm text-gray-400 mt-6 text-center">
            We reageren meestal binnen 24 uur op werkdagen
          </p>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
