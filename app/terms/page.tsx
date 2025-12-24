import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Algemene Voorwaarden - WritGo | AI Content Platform',
  description: 'Algemene voorwaarden voor het gebruik van WritGo, het AI-powered SEO content platform.',
  alternates: {
    canonical: 'https://writgo.nl/terms',
  },
  openGraph: {
    title: 'Algemene Voorwaarden - WritGo',
    description: 'Algemene voorwaarden voor het gebruik van WritGo',
    url: 'https://writgo.nl/terms',
    siteName: 'WritGo',
    locale: 'nl_NL',
    type: 'website',
  },
};

export default function TermsPage() {
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
            Algemene <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">Voorwaarden</span>
          </h1>
          <p className="text-gray-400">Laatst bijgewerkt: 24 december 2024</p>
        </div>

        <div className="prose prose-lg prose-invert max-w-none">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 md:p-12 space-y-8">

            {/* Bedrijfsgegevens */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">1. Bedrijfsgegevens</h2>
              <div className="text-gray-300 leading-relaxed space-y-2">
                <p><strong className="text-white">Bedrijfsnaam:</strong> Writgo Media</p>
                <p><strong className="text-white">Eigenaar:</strong> Mike Schonewille</p>
                <p><strong className="text-white">Email:</strong> <a href="mailto:info@writgo.nl" className="text-orange-500 hover:text-orange-400">info@writgo.nl</a></p>
                <p><strong className="text-white">Website:</strong> <a href="https://writgo.nl" className="text-orange-500 hover:text-orange-400">https://writgo.nl</a></p>
              </div>
            </section>

            {/* Definities */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">2. Definities</h2>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p><strong className="text-white">WritGo:</strong> Het AI-powered SEO content platform, eigendom van Writgo Media.</p>
                <p><strong className="text-white">Gebruiker:</strong> Elke persoon of entiteit die een account aanmaakt op WritGo.</p>
                <p><strong className="text-white">Diensten:</strong> Alle functionaliteiten en services aangeboden via het WritGo platform.</p>
                <p><strong className="text-white">Credits:</strong> De gebruikseenheden waarmee AI-generaties en andere premium functies worden afgerekend.</p>
              </div>
            </section>

            {/* Acceptatie */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">3. Acceptatie van Voorwaarden</h2>
              <p className="text-gray-300 leading-relaxed">
                Door een account aan te maken en gebruik te maken van WritGo, gaat u akkoord met deze algemene voorwaarden. Indien u niet akkoord gaat met deze voorwaarden, dient u geen gebruik te maken van onze diensten.
              </p>
            </section>

            {/* Account en Registratie */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">4. Account en Registratie</h2>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>4.1. U bent verantwoordelijk voor het geheimhouden van uw accountgegevens.</p>
                <p>4.2. U moet minimaal 18 jaar oud zijn om een account aan te maken.</p>
                <p>4.3. U mag slechts één account aanmaken, tenzij uitdrukkelijk toegestaan door WritGo.</p>
                <p>4.4. U bent verantwoordelijk voor alle activiteiten die plaatsvinden onder uw account.</p>
                <p>4.5. Bij registratie ontvangt u 25 gratis credits om de dienst te testen.</p>
              </div>
            </section>

            {/* Credits en Abonnementen */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">5. Credits en Abonnementen</h2>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>5.1. WritGo werkt met een credit-based systeem voor gebruik van AI-functies.</p>
                <p>5.2. Credits zijn geldig gedurende de looptijd van uw abonnement.</p>
                <p>5.3. Ongebruikte credits vervallen aan het einde van de factureringsperiode en worden niet overgedragen.</p>
                <p>5.4. Abonnementen worden automatisch verlengd tenzij u deze annuleert voor de vervaldatum.</p>
                <p>5.5. Prijzen kunnen worden aangepast met een kennisgeving van minimaal 30 dagen.</p>
              </div>
            </section>

            {/* Betaling en Facturering */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">6. Betaling en Facturering</h2>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>6.1. Betalingen worden verwerkt via Stripe, een gerenommeerde payment provider.</p>
                <p>6.2. Alle prijzen zijn in Euro's (EUR) en inclusief BTW waar van toepassing.</p>
                <p>6.3. Facturering vindt maandelijk of jaarlijks plaats, afhankelijk van uw gekozen abonnement.</p>
                <p>6.4. Bij niet-betaling kan uw toegang tot de diensten worden opgeschort.</p>
              </div>
            </section>

            {/* Annulering en Refunds */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">7. Annulering en Refunds</h2>
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-6 space-y-3">
                <p className="text-gray-300 leading-relaxed">
                  <strong className="text-orange-400">7.1. Geen refund beleid:</strong> Gezien de digitale aard van onze diensten en het onmiddellijk toegankelijke karakter van credits en AI-generaties, bieden wij <strong className="text-white">geen refunds</strong> aan na aankoop.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  7.2. U kunt uw abonnement op elk moment annuleren. Na annulering blijft uw account actief tot het einde van de betaalde periode.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  7.3. Na annulering heeft u geen toegang meer tot premium functies, maar blijft uw gegenereerde content toegankelijk.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  7.4. Wij raden u aan om gebruik te maken van de gratis 25 credits om de dienst eerst te testen voordat u een betaald abonnement afsluit.
                </p>
              </div>
            </section>

            {/* Gebruik van Diensten */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">8. Toegestaan en Verboden Gebruik</h2>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p className="text-white font-semibold">Toegestaan gebruik:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Het genereren van SEO-geoptimaliseerde content voor uw websites</li>
                  <li>Het maken van blog artikelen, product reviews en affiliate content</li>
                  <li>Social media content creatie</li>
                  <li>WordPress integratie voor directe publicatie</li>
                </ul>

                <p className="text-white font-semibold mt-6">Verboden gebruik:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Het creëren van illegale, schadelijke of misleidende content</li>
                  <li>Spam of ongewenste communicatie</li>
                  <li>Schending van intellectuele eigendomsrechten van derden</li>
                  <li>Misbruik van het platform voor DDoS of hacking doeleinden</li>
                  <li>Het delen van uw account met anderen zonder toestemming</li>
                  <li>Reverse engineering of het kopiëren van ons platform</li>
                </ul>
              </div>
            </section>

            {/* Intellectueel Eigendom */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">9. Intellectueel Eigendom</h2>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>9.1. WritGo behoudt alle rechten op het platform, de software en de onderliggende technologie.</p>
                <p>9.2. Content gegenereerd via WritGo is eigendom van de gebruiker, mits deze voldoet aan onze voorwaarden.</p>
                <p>9.3. Gebruikers verlenen WritGo een beperkte licentie om gegenereerde content op te slaan en weer te geven voor het functioneren van de dienst.</p>
              </div>
            </section>

            {/* Aansprakelijkheid */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">10. Aansprakelijkheid en Garanties</h2>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>10.1. WritGo wordt geleverd "as is" zonder enige garanties.</p>
                <p>10.2. Wij garanderen geen specifieke resultaten qua SEO rankings of verkeer.</p>
                <p>10.3. WritGo is niet aansprakelijk voor eventuele schade als gevolg van het gebruik van onze diensten.</p>
                <p>10.4. Gebruikers zijn zelf verantwoordelijk voor het controleren en bewerken van AI-gegenereerde content.</p>
                <p>10.5. WritGo is niet aansprakelijk voor downtime, dataverlies of technische problemen.</p>
              </div>
            </section>

            {/* Privacy */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">11. Privacy en Data</h2>
              <p className="text-gray-300 leading-relaxed">
                Voor informatie over hoe wij uw persoonlijke gegevens verwerken, verwijzen wij naar ons <Link href="/privacy" className="text-orange-500 hover:text-orange-400">Privacybeleid</Link>.
              </p>
            </section>

            {/* Wijzigingen */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">12. Wijzigingen in Voorwaarden</h2>
              <p className="text-gray-300 leading-relaxed">
                WritGo behoudt zich het recht voor om deze voorwaarden te allen tijde te wijzigen. Wijzigingen worden van kracht na publicatie op deze pagina. Voortgezet gebruik van de dienst na wijzigingen betekent acceptatie van de nieuwe voorwaarden.
              </p>
            </section>

            {/* Toepasselijk Recht */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">13. Toepasselijk Recht</h2>
              <p className="text-gray-300 leading-relaxed">
                Op deze voorwaarden is Nederlands recht van toepassing. Geschillen zullen worden voorgelegd aan de bevoegde rechter in Nederland.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">14. Contact</h2>
              <p className="text-gray-300 leading-relaxed">
                Voor vragen over deze algemene voorwaarden kunt u contact opnemen via <a href="mailto:info@writgo.nl" className="text-orange-500 hover:text-orange-400">info@writgo.nl</a>.
              </p>
            </section>

          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/register"
            className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 transition-all"
          >
            Start met 25 Gratis Credits
          </Link>
        </div>
      </section>
    </div>
  );
}
