'use client';

import PublicNav from '@/components/public-nav';
import PublicFooter from '@/components/public-footer';

/**
 * 🔒 Privacy Policy - Writgo Media
 */

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <PublicNav />
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-xl border border-orange-500/20 rounded-3xl p-8 md:p-12">
            <h1 className="text-4xl font-bold text-white mb-2">
              Privacy Policy
            </h1>
            <p className="text-gray-400 mb-8">
              Laatst bijgewerkt: 4 december 2025
            </p>

            <div className="prose prose-slate max-w-none text-gray-300 space-y-6">
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                1. Introductie
              </h2>
              <p className="mb-4">
                Writgo Media ("wij", "ons", "onze") respecteert uw privacy en is toegewijd aan het beschermen van uw persoonlijke gegevens. 
                Dit privacybeleid legt uit hoe wij uw persoonlijke informatie verzamelen, gebruiken, delen en beschermen wanneer u onze dienst gebruikt.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                2. Gegevens die wij verzamelen
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                2.1 Accountinformatie
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Naam en email adres</li>
                <li>Bedrijfsnaam (optioneel)</li>
                <li>Website URL (optioneel)</li>
                <li>Wachtwoord (versleuteld opgeslagen)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                2.2 Gebruiksgegevens
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>AI chat conversaties en gegenereerde content</li>
                <li>Credits gebruik en transacties</li>
                <li>Content automatisering instellingen</li>
                <li>WordPress en social media connecties</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                2.3 Technische gegevens
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>IP-adres</li>
                <li>Browser type en versie</li>
                <li>Tijdzone instellingen</li>
                <li>Apparaat informatie</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                2.4 Betalingsgegevens
              </h3>
              <p className="mb-4">
                Betaalgegevens worden veilig verwerkt door Stripe. Wij slaan geen creditcard informatie op onze servers.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                3. Hoe wij uw gegevens gebruiken
              </h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Het leveren van onze AI diensten</li>
                <li>Verbeteren van gebruikerservaring</li>
                <li>Verwerken van betalingen</li>
                <li>Klantenservice en support</li>
                <li>Verzenden van belangrijke updates</li>
                <li>Beschermen tegen fraude en misbruik</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                4. Gegevensdeling
              </h2>
              <p className="mb-4">
                Wij delen uw gegevens alleen met:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong className="text-white">AI API providers</strong> (AIML API) - voor AI functionaliteit</li>
                <li><strong className="text-white">Stripe</strong> - voor betalingsverwerking</li>
                <li><strong className="text-white">ElevenLabs</strong> - voor voice generatie</li>
              </ul>
              <p className="mb-4">
                Wij verkopen of verhuren uw persoonlijke gegevens <strong className="text-orange-500">nooit</strong> aan derden.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                5. Gegevensbeveiliging
              </h2>
              <p className="mb-4">
                Wij implementeren passende technische en organisatorische maatregelen:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>SSL/HTTPS encryptie voor alle data transfers</li>
                <li>Bcrypt wachtwoord hashing</li>
                <li>Beveiligde database toegang</li>
                <li>Regelmatige security audits</li>
                <li>Rate limiting tegen misbruik</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                6. Uw rechten (GDPR)
              </h2>
              <p className="mb-4">
                Als EU burger heeft u de volgende rechten:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong className="text-white">Recht op inzage</strong> - Vraag een kopie van uw gegevens op</li>
                <li><strong className="text-white">Recht op correctie</strong> - Corrigeer onjuiste gegevens</li>
                <li><strong className="text-white">Recht op verwijdering</strong> - Vraag verwijdering van uw gegevens</li>
                <li><strong className="text-white">Recht op dataportabiliteit</strong> - Ontvang uw gegevens in een machine-leesbaar formaat</li>
                <li><strong className="text-white">Recht van bezwaar</strong> - Bezwaar maken tegen verwerking</li>
              </ul>
              <p className="mb-4">
                U kunt uw gegevens downloaden of verwijderen via uw account instellingen of door contact op te nemen met {' '}
                <a href="mailto:info@writgo.nl" className="text-orange-500 hover:text-orange-400 transition-colors">
                  info@writgo.nl
                </a>
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                7. Cookies
              </h2>
              <p className="mb-4">
                Wij gebruiken essentiële cookies voor:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Authenticatie (sessie cookies)</li>
                <li>Gebruikersvoorkeuren</li>
                <li>Beveiliging</li>
              </ul>
              <p className="mb-4">
                Geen tracking of marketing cookies zonder uw toestemming.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                8. Data retentie
              </h2>
              <p className="mb-4">
                Wij bewaren uw gegevens:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Zolang uw account actief is</li>
                <li>30 dagen na account verwijdering (backup periode)</li>
                <li>Financiële gegevens: 7 jaar (wettelijk verplicht)</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                9. Kinderen
              </h2>
              <p className="mb-4">
                Onze dienst is niet bedoeld voor personen onder de 16 jaar. Wij verzamelen bewust geen gegevens van kinderen.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                10. Wijzigingen in dit beleid
              </h2>
              <p className="mb-4">
                Wij kunnen dit privacybeleid van tijd tot tijd bijwerken. Wij zullen u op de hoogte stellen van significante wijzigingen via email.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                11. Contact
              </h2>
              <p className="mb-4">
                Voor vragen over dit privacybeleid:
              </p>
              <div className="bg-white/5 border border-orange-500/20 rounded-2xl p-6 mb-4 space-y-3">
                <p className="mb-2">
                  <strong className="text-white">Bedrijf:</strong>{' '}
                  <span className="text-orange-500">Writgo Media</span>
                </p>
                <p className="mb-2">
                  <strong className="text-white">Adres:</strong>{' '}
                  Langerakbaan 183-1287, 3544PE Utrecht
                </p>
                <p className="mb-2">
                  <strong className="text-white">KVK:</strong>{' '}
                  96200960
                </p>
                <p className="mb-2">
                  <strong className="text-white">BTW:</strong>{' '}
                  NL867510675B01
                </p>
                <p className="mb-2">
                  <strong className="text-white">Email:</strong>{' '}
                  <a href="mailto:info@writgo.nl" className="text-orange-500 hover:text-orange-400 transition-colors">
                    info@writgo.nl
                  </a>
                </p>
                <p>
                  <strong className="text-white">Website:</strong>{' '}
                  <a href="https://writgo.nl" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-400 transition-colors">
                    https://writgo.nl
                  </a>
                </p>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6 mt-8">
                <p className="text-orange-300">
                  <strong className="text-white">GDPR Compliance:</strong> Writgo Media volgt alle AVG (GDPR) richtlijnen voor de bescherming van persoonlijke gegevens van EU burgers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
