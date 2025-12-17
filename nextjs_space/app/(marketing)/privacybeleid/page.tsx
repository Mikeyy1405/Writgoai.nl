'use client';

import PublicNav from '@/components/public-nav';
import PublicFooter from '@/components/public-footer';

/**
 * 🔒 Privacybeleid - AVG/GDPR Compliant
 */

export default function PrivacybeleidPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <PublicNav />
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900/5 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-8 md:p-12">
            <h1 className="text-4xl font-bold text-white mb-2">
              Privacybeleid (AVG/GDPR)
            </h1>
            <p className="text-gray-400 mb-8">
              Laatst bijgewerkt: 4 december 2025
            </p>

            <div className="prose prose-slate max-w-none text-gray-300 space-y-6">
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                1. Wie zijn wij?
              </h2>
              <div className="bg-slate-900/5 border border-blue-500/20 rounded-2xl p-6 mb-4">
                <p className="mb-2">
                  <strong className="text-white">Bedrijfsnaam:</strong>{' '}
                  <span className="text-blue-400">Writgo Media</span>
                </p>
                <p className="mb-2">
                  <strong className="text-white">Adres:</strong>{' '}
                  Langerakbaan 183-1287, 3544PE Utrecht, Nederland
                </p>
                <p className="mb-2">
                  <strong className="text-white">KVK-nummer:</strong>{' '}
                  96200960
                </p>
                <p className="mb-2">
                  <strong className="text-white">BTW-nummer:</strong>{' '}
                  NL867510675B01
                </p>
                <p className="mb-2">
                  <strong className="text-white">Email:</strong>{' '}
                  <a href="mailto:info@writgo.nl" className="text-blue-400 hover:text-blue-300 transition-colors">
                    info@writgo.nl
                  </a>
                </p>
                <p>
                  <strong className="text-white">Website:</strong>{' '}
                  <a href="https://writgo.nl" className="text-blue-400 hover:text-blue-300 transition-colors">
                    https://writgo.nl
                  </a>
                </p>
              </div>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                2. Welke gegevens verzamelen wij?
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                2.1 Accountinformatie
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Naam (voor- en achternaam)</li>
                <li>E-mailadres</li>
                <li>Bedrijfsnaam (optioneel)</li>
                <li>Website URL (optioneel)</li>
                <li>Wachtwoord (versleuteld met bcrypt hashing)</li>
                <li>Accounttype en abonnementsinformatie</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                2.2 Gebruiksgegevens
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>AI chat conversaties en prompts</li>
                <li>Gegenereerde content (blogs, social media posts, etc.)</li>
                <li>Credits gebruik en transactiegeschiedenis</li>
                <li>Content automatisering instellingen en configuraties</li>
                <li>WordPress en social media platform connecties</li>
                <li>Projecten en content plannen</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                2.3 Technische gegevens
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>IP-adres</li>
                <li>Browser type en versie</li>
                <li>Besturingssysteem</li>
                <li>Tijdzone en taalkeuze</li>
                <li>Apparaat informatie (desktop/mobiel/tablet)</li>
                <li>Pagina's die u bezoekt en acties die u onderneemt</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                2.4 Betalingsgegevens
              </h3>
              <p className="mb-4">
                Betaalgegevens worden direct en veilig verwerkt door{' '}
                <strong className="text-white">Stripe</strong>. Wij slaan geen creditcard informatie 
                of volledige betaalgegevens op onze servers. Alleen transactie-ID's en basis 
                betalingsstatus worden bewaard voor administratieve doeleinden.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                3. Waarom verzamelen wij deze gegevens? (Rechtsgrond)
              </h2>
              <p className="mb-4">
                Wij verwerken uw persoonsgegevens op basis van de volgende rechtsgronden:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  <strong className="text-white">Uitvoering overeenkomst:</strong> Voor het leveren 
                  van onze AI diensten en content automatisering platform
                </li>
                <li>
                  <strong className="text-white">Gerechtvaardigd belang:</strong> Voor het verbeteren 
                  van onze diensten, beveiliging en fraudepreventie
                </li>
                <li>
                  <strong className="text-white">Wettelijke verplichting:</strong> Voor belasting- en 
                  boekhoudkundige doeleinden
                </li>
                <li>
                  <strong className="text-white">Toestemming:</strong> Voor marketing communicatie en 
                  optionele cookies (alleen na expliciete toestemming)
                </li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                4. Hoe lang bewaren wij uw gegevens?
              </h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  <strong className="text-white">Accountgegevens:</strong> Zolang uw account actief is
                </li>
                <li>
                  <strong className="text-white">Content en conversaties:</strong> Zolang uw account actief is
                </li>
                <li>
                  <strong className="text-white">Backup periode:</strong> 30 dagen na account verwijdering
                </li>
                <li>
                  <strong className="text-white">Financiële gegevens:</strong> 7 jaar (wettelijk verplicht)
                </li>
                <li>
                  <strong className="text-white">Log bestanden:</strong> Maximaal 90 dagen
                </li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                5. Met wie delen wij uw gegevens?
              </h2>
              <p className="mb-4">
                Wij delen uw gegevens alleen met betrouwbare verwerkers die ons helpen 
                onze diensten te leveren:
              </p>
              
              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                Verwerkers en hun doel:
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  <strong className="text-white">AIML API:</strong> Voor AI tekstgeneratie en chat functionaliteit
                </li>
                <li>
                  <strong className="text-white">Stripe:</strong> Voor veilige betalingsverwerking
                </li>
                <li>
                  <strong className="text-white">ElevenLabs:</strong> Voor AI voice generatie (indien gebruikt)
                </li>
                <li>
                  <strong className="text-white">Vercel:</strong> Voor hosting en website analytics
                </li>
                <li>
                  <strong className="text-white">Supabase:</strong> Voor database hosting
                </li>
              </ul>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 my-6">
                <p className="text-blue-300">
                  <strong className="text-white">⚠️ Belangrijk:</strong> Wij verkopen of verhuren 
                  uw persoonlijke gegevens <strong className="text-white">NOOIT</strong> aan derden 
                  voor marketing of andere doeleinden.
                </p>
              </div>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                6. Jouw rechten onder de AVG (GDPR)
              </h2>
              <p className="mb-4">
                Als EU burger heeft u de volgende rechten met betrekking tot uw persoonsgegevens:
              </p>
              
              <div className="space-y-4">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    ✅ Recht op inzage
                  </h4>
                  <p className="text-gray-400">
                    U kunt een kopie opvragen van alle persoonsgegevens die wij van u bewaren.
                  </p>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    ✏️ Recht op correctie
                  </h4>
                  <p className="text-gray-400">
                    U kunt onjuiste of onvolledige gegevens laten corrigeren.
                  </p>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    🗑️ Recht op verwijdering (Recht om vergeten te worden)
                  </h4>
                  <p className="text-gray-400">
                    U kunt verzoeken om verwijdering van uw persoonsgegevens, tenzij wij deze 
                    moeten bewaren voor wettelijke verplichtingen.
                  </p>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    📦 Recht op dataportabiliteit
                  </h4>
                  <p className="text-gray-400">
                    U kunt uw gegevens in een gestructureerd, gangbaar en machine-leesbaar 
                    formaat ontvangen.
                  </p>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    ⛔ Recht van bezwaar
                  </h4>
                  <p className="text-gray-400">
                    U kunt bezwaar maken tegen de verwerking van uw persoonsgegevens.
                  </p>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    🔒 Recht op beperking van verwerking
                  </h4>
                  <p className="text-gray-400">
                    U kunt verzoeken om beperking van de verwerking van uw gegevens.
                  </p>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    🚫 Recht om toestemming in te trekken
                  </h4>
                  <p className="text-gray-400">
                    Voor verwerkingen op basis van toestemming kunt u deze op elk moment intrekken.
                  </p>
                </div>
              </div>

              <p className="my-6">
                Om deze rechten uit te oefenen, kunt u contact met ons opnemen via{' '}
                <a href="mailto:info@writgo.nl" className="text-blue-400 hover:text-blue-300 transition-colors">
                  info@writgo.nl
                </a>. Wij zullen uw verzoek binnen 1 maand behandelen.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                7. Cookies
              </h2>
              <p className="mb-4">
                Wij gebruiken verschillende soorten cookies op onze website. Voor uitgebreide 
                informatie over cookies, zie ons{' '}
                <a href="/cookiebeleid" className="text-blue-400 hover:text-blue-300 transition-colors underline">
                  Cookiebeleid
                </a>.
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  <strong className="text-white">Noodzakelijke cookies:</strong> Essentieel voor 
                  het functioneren van de website (authenticatie, beveiliging)
                </li>
                <li>
                  <strong className="text-white">Analytische cookies:</strong> Alleen met uw 
                  toestemming (Google Analytics, Vercel Analytics)
                </li>
                <li>
                  <strong className="text-white">Marketing cookies:</strong> Alleen met uw 
                  toestemming (retargeting, advertenties)
                </li>
                <li>
                  <strong className="text-white">Functionele cookies:</strong> Voor uw voorkeuren 
                  zoals taal en thema
                </li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                8. Beveiliging van uw gegevens
              </h2>
              <p className="mb-4">
                Wij nemen de beveiliging van uw gegevens zeer serieus en implementeren 
                passende technische en organisatorische maatregelen:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  <strong className="text-white">Encryptie:</strong> SSL/HTTPS voor alle 
                  datatransfers, wachtwoorden worden gehashed met bcrypt
                </li>
                <li>
                  <strong className="text-white">Toegangscontrole:</strong> Beveiligde database 
                  toegang met strikte permissies
                </li>
                <li>
                  <strong className="text-white">Monitoring:</strong> Regelmatige security audits 
                  en vulnerability scans
                </li>
                <li>
                  <strong className="text-white">Rate limiting:</strong> Bescherming tegen 
                  brute force aanvallen en API misbruik
                </li>
                <li>
                  <strong className="text-white">Backups:</strong> Regelmatige encrypted backups 
                  van alle data
                </li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                9. Internationale gegevensoverdracht
              </h2>
              <p className="mb-4">
                Sommige van onze verwerkers kunnen gegevens verwerken buiten de Europese Economische 
                Ruimte (EER). In dat geval zorgen wij ervoor dat:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>De verwerker voldoet aan het EU-US Data Privacy Framework, of</li>
                <li>Er zijn standaard contractuele clausules (SCC's) afgesloten, of</li>
                <li>Er zijn andere passende waarborgen aanwezig</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                10. Wijzigingen in dit privacybeleid
              </h2>
              <p className="mb-4">
                Wij kunnen dit privacybeleid van tijd tot tijd bijwerken om wijzigingen in onze 
                diensten of wettelijke vereisten te reflecteren. Bij significante wijzigingen 
                zullen wij u hiervan op de hoogte stellen via:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>E-mail naar uw geregistreerde e-mailadres</li>
                <li>Een melding op de website</li>
                <li>Een update van de "Laatst bijgewerkt" datum bovenaan dit document</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                11. Klacht indienen bij toezichthouder
              </h2>
              <p className="mb-4">
                Als u niet tevreden bent met hoe wij uw gegevens verwerken, heeft u het recht 
                om een klacht in te dienen bij de Nederlandse toezichthouder:
              </p>
              <div className="bg-slate-900/5 border border-blue-500/20 rounded-2xl p-6 mb-4">
                <p className="mb-2">
                  <strong className="text-white">Autoriteit Persoonsgegevens</strong>
                </p>
                <p className="mb-2">
                  Postbus 93374<br />
                  2509 AJ Den Haag
                </p>
                <p className="mb-2">
                  Telefoon: <a href="tel:+31703888500" className="text-blue-400 hover:text-blue-300">
                    +31 (0)70 888 85 00
                  </a>
                </p>
                <p>
                  Website: <a 
                    href="https://autoriteitpersoonsgegevens.nl" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    https://autoriteitpersoonsgegevens.nl
                  </a>
                </p>
              </div>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                12. Contact voor privacy vragen
              </h2>
              <p className="mb-4">
                Voor vragen over dit privacybeleid of uw persoonsgegevens kunt u contact met ons opnemen:
              </p>
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6 mb-4">
                <p className="mb-2">
                  <strong className="text-white">E-mail:</strong>{' '}
                  <a href="mailto:info@writgo.nl" className="text-blue-400 hover:text-blue-300 transition-colors">
                    info@writgo.nl
                  </a>
                </p>
                <p className="mb-2">
                  <strong className="text-white">Schriftelijk:</strong><br />
                  Writgo Media<br />
                  t.a.v. Privacy<br />
                  Langerakbaan 183-1287<br />
                  3544PE Utrecht
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mt-8">
                <p className="text-blue-300">
                  <strong className="text-white">✅ AVG/GDPR Compliant:</strong> Writgo Media 
                  voldoet volledig aan de eisen van de Algemene Verordening Gegevensbescherming 
                  (AVG) en General Data Protection Regulation (GDPR) voor de bescherming van 
                  persoonsgegevens van EU burgers.
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
