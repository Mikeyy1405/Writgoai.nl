import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacybeleid - WritGo | AI Content Platform',
  description: 'Privacybeleid van WritGo - Hoe wij uw gegevens verzamelen, gebruiken en beschermen.',
  alternates: {
    canonical: 'https://writgo.nl/privacy',
  },
  openGraph: {
    title: 'Privacybeleid - WritGo',
    description: 'Privacybeleid van WritGo - Bescherming van uw persoonlijke gegevens',
    url: 'https://writgo.nl/privacy',
    siteName: 'WritGo',
    locale: 'nl_NL',
    type: 'website',
  },
};

export default function PrivacyPage() {
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

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Privacy<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">beleid</span>
          </h1>
          <p className="text-gray-400">Laatst bijgewerkt: 24 december 2024</p>
        </div>

        <div className="prose prose-lg prose-invert max-w-none">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 md:p-12 space-y-8">

            {/* Introductie */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">1. Introductie</h2>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>
                  WritGo, eigendom van Writgo Media (eigenaar: Mike Schonewille), hecht veel waarde aan de bescherming van uw privacy. In dit privacybeleid leggen wij uit welke persoonlijke gegevens wij verzamelen, hoe wij deze gebruiken en welke rechten u heeft.
                </p>
                <p>
                  Voor vragen over dit privacybeleid kunt u contact opnemen via <a href="mailto:info@writgo.nl" className="text-orange-500 hover:text-orange-400">info@writgo.nl</a>.
                </p>
              </div>
            </section>

            {/* Verantwoordelijke */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">2. Verantwoordelijke voor Gegevensverwerking</h2>
              <div className="text-gray-300 leading-relaxed space-y-2">
                <p><strong className="text-white">Bedrijfsnaam:</strong> Writgo Media</p>
                <p><strong className="text-white">Eigenaar:</strong> Mike Schonewille</p>
                <p><strong className="text-white">Email:</strong> <a href="mailto:info@writgo.nl" className="text-orange-500 hover:text-orange-400">info@writgo.nl</a></p>
                <p><strong className="text-white">Website:</strong> <a href="https://writgo.nl" className="text-orange-500 hover:text-orange-400">https://writgo.nl</a></p>
              </div>
            </section>

            {/* Welke gegevens */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">3. Welke Gegevens Verzamelen Wij?</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">3.1. Accountgegevens</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Naam</li>
                    <li>E-mailadres</li>
                    <li>Wachtwoord (versleuteld opgeslagen)</li>
                    <li>Accountinstellingen en voorkeuren</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">3.2. Betalingsgegevens</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Abonnementsstatus en -type</li>
                    <li>Credits gebruik en geschiedenis</li>
                    <li>Betalingsgegevens (verwerkt via Stripe - wij slaan geen creditcardgegevens op)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">3.3. Gebruiksgegevens</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Gegenereerde content en artikelen</li>
                    <li>WordPress site koppelingen en instellingen</li>
                    <li>Social media account koppelingen</li>
                    <li>AI-generatie logs en statistieken</li>
                    <li>Project- en content planning gegevens</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">3.4. Technische Gegevens</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>IP-adres</li>
                    <li>Browser type en versie</li>
                    <li>Apparaat informatie</li>
                    <li>Cookies en vergelijkbare technologieën</li>
                    <li>Toegangstijden en -duur</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Hoe gebruiken wij gegevens */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">4. Hoe Gebruiken Wij Uw Gegevens?</h2>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p><strong className="text-white">4.1. Het leveren van onze diensten:</strong></p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Account aanmaken en beheren</li>
                  <li>AI content genereren volgens uw specificaties</li>
                  <li>WordPress en social media integraties faciliteren</li>
                  <li>Credits beheren en facturering verwerken</li>
                </ul>

                <p className="mt-4"><strong className="text-white">4.2. Verbetering van onze diensten:</strong></p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Analyse van gebruikspatronen om de dienst te optimaliseren</li>
                  <li>Technische problemen oplossen en bugs fixen</li>
                  <li>Nieuwe features ontwikkelen</li>
                </ul>

                <p className="mt-4"><strong className="text-white">4.3. Communicatie:</strong></p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Account notificaties en updates</li>
                  <li>Technische ondersteuning</li>
                  <li>Belangrijke wijzigingen in diensten of voorwaarden</li>
                  <li>Marketing communicatie (alleen met uw toestemming)</li>
                </ul>
              </div>
            </section>

            {/* Rechtsgrondslag */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">5. Rechtsgrondslag voor Verwerking</h2>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>Wij verwerken uw gegevens op basis van:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Contractuele noodzaak:</strong> Voor het leveren van onze diensten</li>
                  <li><strong className="text-white">Gerechtvaardigd belang:</strong> Voor analyses en verbetering van onze dienst</li>
                  <li><strong className="text-white">Toestemming:</strong> Voor marketing communicatie en cookies</li>
                  <li><strong className="text-white">Wettelijke verplichting:</strong> Voor belasting en administratieve doeleinden</li>
                </ul>
              </div>
            </section>

            {/* Delen van gegevens */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">6. Delen van Gegevens met Derden</h2>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>Wij delen uw gegevens alleen met:</p>

                <div className="space-y-4 mt-4">
                  <div>
                    <p><strong className="text-white">6.1. Service Providers:</strong></p>
                    <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                      <li><strong className="text-orange-400">Supabase:</strong> Database en authenticatie (EU servers)</li>
                      <li><strong className="text-orange-400">Stripe:</strong> Betalingsverwerking</li>
                      <li><strong className="text-orange-400">AIML API:</strong> AI content generatie (Claude & GPT models)</li>
                      <li><strong className="text-orange-400">Vercel:</strong> Hosting en infrastructure</li>
                    </ul>
                  </div>

                  <div>
                    <p><strong className="text-white">6.2. Integraties die u activeert:</strong></p>
                    <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                      <li>WordPress (uw eigen website)</li>
                      <li>Social media platforms (Instagram, Facebook, LinkedIn, etc.)</li>
                      <li>Bol.com affiliate programma</li>
                    </ul>
                  </div>

                  <div>
                    <p><strong className="text-white">6.3. Wettelijke verplichtingen:</strong></p>
                    <p className="ml-4 mt-2">Wij kunnen gegevens delen indien wettelijk verplicht of om onze rechten te beschermen.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Beveiliging */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">7. Beveiliging van Gegevens</h2>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>Wij nemen uw gegevensbeveiliging serieus en implementeren onder andere:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>SSL/TLS encryptie voor alle data overdracht</li>
                  <li>Versleutelde opslag van wachtwoorden (hashing)</li>
                  <li>Beveiligde database met Row Level Security (RLS)</li>
                  <li>Regelmatige security audits en updates</li>
                  <li>Beperkte toegang tot persoonlijke gegevens (only authorized personnel)</li>
                  <li>Twee-factor authenticatie opties</li>
                </ul>
              </div>
            </section>

            {/* Bewaartermijn */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">8. Bewaartermijn</h2>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>Wij bewaren uw gegevens niet langer dan noodzakelijk:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Actieve accounts:</strong> Zolang uw account actief is</li>
                  <li><strong className="text-white">Inactieve accounts:</strong> Tot 1 jaar na laatste activiteit</li>
                  <li><strong className="text-white">Factuurgegevens:</strong> 7 jaar (wettelijke verplichting)</li>
                  <li><strong className="text-white">Content en projecten:</strong> Tot verwijdering door gebruiker of account sluiting</li>
                </ul>
              </div>
            </section>

            {/* Uw rechten */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">9. Uw Privacy Rechten (AVG/GDPR)</h2>
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-6 space-y-3">
                <p className="text-gray-300 leading-relaxed">
                  U heeft de volgende rechten met betrekking tot uw persoonlijke gegevens:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-gray-300">
                  <li><strong className="text-white">Recht op inzage:</strong> U kunt opvragen welke gegevens wij van u hebben</li>
                  <li><strong className="text-white">Recht op correctie:</strong> U kunt onjuiste gegevens laten corrigeren</li>
                  <li><strong className="text-white">Recht op verwijdering:</strong> U kunt verzoeken uw gegevens te verwijderen</li>
                  <li><strong className="text-white">Recht op dataportabiliteit:</strong> U kunt uw gegevens opvragen in een machineleesbaar formaat</li>
                  <li><strong className="text-white">Recht op beperking:</strong> U kunt verzoeken de verwerking te beperken</li>
                  <li><strong className="text-white">Recht van bezwaar:</strong> U kunt bezwaar maken tegen verwerking</li>
                  <li><strong className="text-white">Recht om toestemming in te trekken:</strong> Voor verwerkingen gebaseerd op toestemming</li>
                </ul>
                <p className="text-gray-300 leading-relaxed mt-4">
                  Om deze rechten uit te oefenen, kunt u contact opnemen via <a href="mailto:info@writgo.nl" className="text-orange-500 hover:text-orange-400">info@writgo.nl</a>.
                </p>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">10. Cookies en Tracking</h2>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>WritGo maakt gebruik van cookies voor:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Essentiële cookies:</strong> Voor inloggen en sessie beheer (strikt noodzakelijk)</li>
                  <li><strong className="text-white">Functionele cookies:</strong> Voor opslaan van voorkeuren</li>
                  <li><strong className="text-white">Analytische cookies:</strong> Voor begrip van gebruik (alleen met toestemming)</li>
                </ul>
                <p className="mt-4">
                  U kunt cookies beheren via uw browser instellingen. Let op: het uitschakelen van essentiële cookies kan de functionaliteit beperken.
                </p>
              </div>
            </section>

            {/* Kinderen */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">11. Privacy van Kinderen</h2>
              <p className="text-gray-300 leading-relaxed">
                WritGo is niet bedoeld voor personen onder de 18 jaar. Wij verzamelen bewust geen gegevens van kinderen. Indien u vermoedt dat wij per ongeluk gegevens van een minderjarige hebben verzameld, neem dan contact met ons op.
              </p>
            </section>

            {/* Internationale overdracht */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">12. Internationale Gegevensoverdracht</h2>
              <p className="text-gray-300 leading-relaxed">
                Uw gegevens worden voornamelijk verwerkt binnen de EU. Voor AI-verwerkingen via AIML API kunnen gegevens naar de VS worden overgedragen. Alle service providers bieden passende waarborgen volgens de AVG/GDPR.
              </p>
            </section>

            {/* Wijzigingen */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">13. Wijzigingen in dit Privacybeleid</h2>
              <p className="text-gray-300 leading-relaxed">
                Wij kunnen dit privacybeleid van tijd tot tijd bijwerken. Belangrijke wijzigingen zullen wij communiceren via email of een notificatie op het platform. De datum van de laatste wijziging staat bovenaan deze pagina.
              </p>
            </section>

            {/* Klachten */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">14. Klachten</h2>
              <p className="text-gray-300 leading-relaxed">
                Indien u een klacht heeft over hoe wij uw gegevens verwerken, kunt u contact met ons opnemen via <a href="mailto:info@writgo.nl" className="text-orange-500 hover:text-orange-400">info@writgo.nl</a>.
                U heeft ook het recht om een klacht in te dienen bij de Autoriteit Persoonsgegevens (AP), de Nederlandse toezichthouder voor privacybescherming.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">15. Contact</h2>
              <div className="text-gray-300 leading-relaxed space-y-2">
                <p>Voor vragen over dit privacybeleid of uw gegevens:</p>
                <p><strong className="text-white">Email:</strong> <a href="mailto:info@writgo.nl" className="text-orange-500 hover:text-orange-400">info@writgo.nl</a></p>
                <p><strong className="text-white">Website:</strong> <a href="https://writgo.nl" className="text-orange-500 hover:text-orange-400">https://writgo.nl</a></p>
              </div>
            </section>

          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/register"
            className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 transition-all"
          >
            Veilig Registreren met 25 Gratis Credits
          </Link>
        </div>
      </section>
    </div>
  );
}
