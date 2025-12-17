'use client';

import { useSession } from 'next-auth/react';
import { User, Mail, Info } from 'lucide-react';

/**
 * INSTELLINGEN PAGINA
 * 
 * Simpele instellingen pagina met:
 * - Account informatie
 * - Basis voorkeuren
 * - Geen complexe features
 */

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-orange-500 mb-2">
            ⚙️ Instellingen
          </h1>
          <p className="text-gray-400">Beheer je account en voorkeuren</p>
        </div>

        {/* Account Info */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-orange-500" />
            Account Informatie
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Naam
              </label>
              <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white">
                {session?.user?.name || 'Niet ingesteld'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                E-mailadres
              </label>
              <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                {session?.user?.email || 'Niet ingesteld'}
              </div>
            </div>
          </div>
        </div>

        {/* WritGo Info */}
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-orange-500" />
            Over WritGo
          </h2>
          
          <div className="space-y-3 text-gray-300">
            <p className="flex items-start gap-2">
              <span className="text-2xl flex-shrink-0">✨</span>
              <span><strong>WritGo AI</strong> helpt je elke dag content te maken voor al je WordPress sites.</span>
            </p>
            
            <div className="border-t border-orange-500/20 pt-3 mt-3">
              <p className="text-sm text-gray-400 mb-2 font-semibold">Wat WritGo doet:</p>
              <ul className="text-sm text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span>📝</span>
                  <span><strong>Content Genereren:</strong> 1500 woorden, 100% menselijk scorend, SEO geoptimaliseerd</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>🖼️</span>
                  <span><strong>Afbeeldingen:</strong> Automatische Flux Pro afbeeldingen bij elk artikel</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>🔗</span>
                  <span><strong>Interne Links:</strong> Automatisch relevante interne links toevoegen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>🚀</span>
                  <span><strong>Publiceren:</strong> Direct naar WordPress met één klik</span>
                </li>
              </ul>
            </div>

            <div className="border-t border-orange-500/20 pt-3 mt-3">
              <p className="text-sm text-gray-400 mb-2 font-semibold">Writgo Regels:</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Geen verboden woorden zoals "duiken in" of "cruciale"</li>
                <li>• E-E-A-T optimalisatie voor Google rankings</li>
                <li>• Natuurlijke, menselijke schrijfstijl</li>
                <li>• Focus op waarde voor de lezer</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">💬 Hulp Nodig?</h2>
          
          <div className="space-y-3 text-gray-300">
            <p className="text-sm">
              Heb je vragen of loop je ergens tegenaan? We helpen je graag!
            </p>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm font-semibold mb-2">📧 Contact</p>
              <p className="text-sm text-gray-400">
                Stuur een email naar <a href="mailto:support@writgo.nl" className="text-orange-400 hover:text-orange-300 underline">support@writgo.nl</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
