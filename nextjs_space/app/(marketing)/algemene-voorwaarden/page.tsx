'use client';

import PublicNav from '@/components/public-nav';
import PublicFooter from '@/components/public-footer';

/**
 * 📜 Algemene Voorwaarden - WritgoAI
 */

export default function AlgemeneVoorwaardenPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <PublicNav />
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-8 md:p-12">
            <h1 className="text-4xl font-bold text-white mb-2">
              Algemene Voorwaarden
            </h1>
            <p className="text-gray-400 mb-8">
              Laatst bijgewerkt: 4 december 2025
            </p>

            <div className="prose prose-slate max-w-none text-gray-300 space-y-6">
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                1. Definities
              </h2>
              <p className="mb-4">
                In deze Algemene Voorwaarden worden de volgende termen met een hoofdletter gebruikt:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  <strong className="text-white">Writgo Media / Wij / Ons:</strong> Writgo Media, 
                  KVK 96200960, gevestigd te Langerakbaan 183-1287, 3544PE Utrecht
                </li>
                <li>
                  <strong className="text-white">Gebruiker / U:</strong> Elke natuurlijke of 
                  rechtspersoon die gebruik maakt van de Dienst
                </li>
                <li>
                  <strong className="text-white">Dienst:</strong> Het Writgo Media platform inclusief 
                  alle functionaliteiten en services
                </li>
                <li>
                  <strong className="text-white">Content:</strong> Alle door AI gegenereerde tekst, 
                  afbeeldingen, video's en andere media
                </li>
                <li>
                  <strong className="text-white">Credits:</strong> Virtuele eenheden gebruikt voor 
                  het uitvoeren van AI-taken
                </li>
                <li>
                  <strong className="text-white">Abonnement:</strong> Een terugkerende maandelijkse 
                  dienstverlening tegen betaling
                </li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                2. Toepasselijkheid
              </h2>
              <p className="mb-4">
                2.1 Deze Algemene Voorwaarden zijn van toepassing op alle aanbiedingen, overeenkomsten 
                en diensten van Writgo Media.
              </p>
              <p className="mb-4">
                2.2 Door gebruik te maken van de Dienst, gaat u akkoord met deze Algemene Voorwaarden. 
                Als u niet akkoord gaat, mag u de Dienst niet gebruiken.
              </p>
              <p className="mb-4">
                2.3 Eventuele afwijkingen van deze voorwaarden zijn alleen geldig indien deze 
                uitdrukkelijk schriftelijk zijn overeengekomen.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                3. Aanbod en totstandkoming overeenkomst
              </h2>
              <p className="mb-4">
                3.1 Alle aanbiedingen op de website zijn vrijblijvend. Writgo Media behoudt zich het 
                recht voor om prijzen, functionaliteiten en voorwaarden te wijzigen.
              </p>
              <p className="mb-4">
                3.2 Een overeenkomst komt tot stand op het moment dat u een account aanmaakt of 
                een abonnement afsluit.
              </p>
              <p className="mb-4">
                3.3 Writgo Media behoudt zich het recht voor om aanmeldingen te weigeren zonder 
                opgave van redenen.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                4. Beschrijving van de dienst
              </h2>
              <p className="mb-4">
                Writgo Media is een AI-aangedreven content automatisering platform dat de volgende 
                diensten biedt:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>AI chat en conversatie functionaliteit</li>
                <li>Automatische generatie van blogs, artikelen en SEO content</li>
                <li>Social media content creatie en planning</li>
                <li>Video content generatie</li>
                <li>WooCommerce product beschrijvingen</li>
                <li>WordPress integratie en automatische publicatie</li>
                <li>Content research en keyword onderzoek</li>
                <li>Affiliate marketing integraties</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                5. Account registratie en gebruik
              </h2>
              <p className="mb-4">
                5.1 Om de Dienst te gebruiken moet u:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Minimaal 16 jaar oud zijn</li>
                <li>Een account aanmaken met accurate en volledige informatie</li>
                <li>Uw inloggegevens vertrouwelijk houden</li>
                <li>Uw account niet delen met anderen</li>
              </ul>
              <p className="mb-4">
                5.2 U bent verantwoordelijk voor alle activiteiten die onder uw account plaatsvinden.
              </p>
              <p className="mb-4">
                5.3 Bij vermoedens van ongeautoriseerd gebruik moet u ons onmiddellijk op de hoogte stellen.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                6. Prijzen en betaling
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                6.1 Abonnementen en prijzen
              </h3>
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 mb-4">
                <p className="mb-3 text-white font-semibold">Beschikbare abonnementen:</p>
                <ul className="space-y-2 text-gray-300">
                  <li>• <strong className="text-white">Gratis:</strong> Beperkte credits voor testen</li>
                  <li>• <strong className="text-white">Starter:</strong> €29/maand (1.000 credits/maand, ~14 blogs)</li>
                  <li>• <strong className="text-white">Professional:</strong> €79/maand (3.000 credits/maand, ~42 blogs)</li>
                  <li>• <strong className="text-white">Enterprise:</strong> €199/maand (10.000 credits/maand, ~142 blogs)</li>
                  <li>• <strong className="text-white">Managed Service:</strong> Vanaf €499/maand (complete content service)</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                6.2 Credit systeem
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Credits worden gebruikt voor AI generaties en content creatie</li>
                <li>Abonnement credits vernieuwen automatisch elke maand</li>
                <li>Extra credits kunnen apart worden aangekocht (top-up)</li>
                <li>Top-up credits blijven beschikbaar en verlopen niet</li>
                <li>Abonnement credits die niet gebruikt zijn, vervallen aan het einde van de maand</li>
                <li>Credits zijn niet overdraagbaar, niet inwisselbaar voor geld en niet restitueerbaar</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                6.3 Betalingen
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Alle prijzen zijn in Euro's (EUR) en inclusief BTW</li>
                <li>Betalingen worden veilig verwerkt via Stripe</li>
                <li>Abonnementen worden automatisch maandelijks verlengd</li>
                <li>De eerste betaling vindt plaats bij het afsluiten van het abonnement</li>
                <li>Bij non-betaling kan uw account worden opgeschort</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                6.4 Prijswijzigingen
              </h3>
              <p className="mb-4">
                Wij behouden ons het recht voor om prijzen te wijzigen. Bestaande klanten worden 
                minimaal 30 dagen van tevoren op de hoogte gesteld van prijswijzigingen. De nieuwe 
                prijzen gaan in bij de eerstvolgende verlenging na de kennisgeving.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                7. Levering van diensten
              </h2>
              <p className="mb-4">
                7.1 De Dienst wordt digitaal geleverd en is direct beschikbaar na registratie 
                en betaling.
              </p>
              <p className="mb-4">
                7.2 Wij streven naar een uptime van minimaal 99%, maar kunnen dit niet garanderen.
              </p>
              <p className="mb-4">
                7.3 Onderhoudswerkzaamheden kunnen de dienst tijdelijk onderbreken. Waar mogelijk 
                kondigen wij dit van tevoren aan.
              </p>
              <p className="mb-4">
                7.4 AI gegenereerde content wordt direct geleverd. Wij garanderen geen specifieke 
                kwaliteit of nauwkeurigheid van de output.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                8. Opzegging en terugbetaling
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                8.1 Opzegging door gebruiker
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>U kunt uw abonnement op elk moment opzeggen via uw account instellingen</li>
                <li>Opzeggingen zijn effectief aan het einde van de lopende betaalperiode</li>
                <li>Na opzegging blijft uw account toegankelijk tot het einde van de betaalde periode</li>
                <li>Ongebruikte credits vervallen bij opzegging</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                8.2 Terugbetalingsbeleid
              </h3>
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-4">
                <p className="text-red-300">
                  <strong className="text-white">⚠️ GEEN REFUNDS:</strong> Vanwege de digitale 
                  aard van onze diensten en directe levering bieden wij <strong>GEEN terugbetalingen</strong> 
                  aan voor:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-1 text-red-300">
                  <li>Abonnementen (geen terugbetaling voor gedeeltelijke maanden)</li>
                  <li>Aangekochte credits (top-ups)</li>
                  <li>Ongebruikte credits bij opzegging</li>
                </ul>
              </div>
              <p className="mb-4">
                8.3 <strong className="text-white">Uitzonderingen:</strong> Terugbetalingen worden 
                alleen overwogen bij technische problemen aan onze kant die het gebruik van de 
                dienst volledig onmogelijk maken.
              </p>
              <p className="mb-4">
                8.4 Voor meer informatie, zie ons{' '}
                <a href="/terugbetalingsbeleid" className="text-blue-400 hover:text-blue-300 transition-colors underline">
                  Terugbetalingsbeleid
                </a>.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                9. Acceptabel gebruik
              </h2>
              <p className="mb-4">
                U mag de Dienst NIET gebruiken voor:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Illegale activiteiten of content</li>
                <li>Spam, phishing of misleidende praktijken</li>
                <li>Haatzaaiende, gewelddadige of discriminerende content</li>
                <li>Inbreuk op intellectueel eigendom van anderen</li>
                <li>Malware, virussen of andere schadelijke code</li>
                <li>Misbruik van API's of excessive gebruik</li>
                <li>Reverse engineering van onze software</li>
                <li>Content die bedoeld is om te misleiden of te manipuleren</li>
                <li>Schending van privacy van anderen</li>
                <li>Pornografische of expliciet seksuele content</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                10. AI gegenereerde content
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                10.1 Verantwoordelijkheid
              </h3>
              <p className="mb-4">
                U bent volledig verantwoordelijk voor:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Het controleren en verifiëren van AI gegenereerde content</li>
                <li>Het naleven van copyright en intellectueel eigendom wetten</li>
                <li>De juistheid en volledigheid van gepubliceerde content</li>
                <li>Het gebruik van content in overeenstemming met toepasselijke wetgeving</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                10.2 Geen garanties
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>AI kan fouten maken - verifieer altijd belangrijke feiten</li>
                <li>Wij garanderen niet de nauwkeurigheid, volledigheid of actualiteit van AI output</li>
                <li>Wij zijn niet aansprakelijk voor consequenties van het gebruik van gegenereerde content</li>
                <li>Content kan gelijkenis vertonen met bestaande werken</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                10.3 Eigendomsrechten
              </h3>
              <p className="mb-4">
                U behoudt alle rechten op de door u ingevoerde prompts en de gegenereerde content. 
                Wij claimen geen eigendom over uw content.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                11. Intellectueel eigendom
              </h2>
              <p className="mb-4">
                11.1 <strong className="text-white">Ons eigendom:</strong> Writgo Media, het logo, 
                alle software, code, design en functionaliteiten zijn en blijven ons intellectueel 
                eigendom.
              </p>
              <p className="mb-4">
                11.2 <strong className="text-white">Uw content:</strong> U behoudt alle rechten 
                op uw input en gegenereerde content.
              </p>
              <p className="mb-4">
                11.3 <strong className="text-white">Licentie:</strong> U krijgt een beperkte, 
                niet-exclusieve, niet-overdraagbare licentie om de Dienst te gebruiken volgens 
                deze voorwaarden.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                12. Aansprakelijkheid
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                12.1 Beperking van aansprakelijkheid
              </h3>
              <p className="mb-4">
                Writgo Media is niet aansprakelijk voor:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Indirecte schade, gevolgschade of gederfde winst</li>
                <li>Verlies van data, omzet of goodwill</li>
                <li>Schade door gebruik van AI gegenereerde content</li>
                <li>Service onderbrekingen of downtime</li>
                <li>Acties van derden (API providers, hosting, etc.)</li>
                <li>Verlies of ongeautoriseerd gebruik van inloggegevens</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                12.2 Maximale aansprakelijkheid
              </h3>
              <p className="mb-4">
                In alle gevallen is onze totale aansprakelijkheid beperkt tot het bedrag dat u 
                in de laatste 12 maanden aan ons heeft betaald, met een maximum van €1.000.
              </p>

              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                12.3 Vrijwaring
              </h3>
              <p className="mb-4">
                U vrijwaart WritgoAI van alle claims, schade en kosten die voortvloeien uit uw 
                gebruik van de Dienst of schending van deze voorwaarden.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                13. Overmacht
              </h2>
              <p className="mb-4">
                Writgo Media is niet aansprakelijk voor het niet nakomen van verplichtingen als gevolg 
                van overmacht, inclusief maar niet beperkt tot:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Storingen bij derden (hosting, API providers, betalingsproviders)</li>
                <li>Internet storingen of cyberaanvallen</li>
                <li>Natuurrampen of calamiteiten</li>
                <li>Overheidsmaatregelen of wetswijzigingen</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                14. Account opschorting en beëindiging
              </h2>
              <p className="mb-4">
                14.1 Wij kunnen uw account direct opschorten of beëindigen bij:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Schending van deze Algemene Voorwaarden</li>
                <li>Frauduleuze activiteiten of misbruik</li>
                <li>Non-betaling</li>
                <li>Illegaal of onethisch gebruik</li>
                <li>Excessief gebruik dat andere gebruikers schaadt</li>
              </ul>
              <p className="mb-4">
                14.2 Bij beëindiging vervalt uw toegang tot de Dienst en alle ongebruikte credits.
              </p>
              <p className="mb-4">
                14.3 Wij kunnen uw data na 30 dagen permanent verwijderen.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                15. Klachten
              </h2>
              <p className="mb-4">
                15.1 Klachten over de Dienst kunnen worden ingediend via{' '}
                <a href="mailto:info@writgo.nl" className="text-blue-400 hover:text-blue-300 transition-colors">
                  info@writgo.nl
                </a>
              </p>
              <p className="mb-4">
                15.2 Wij streven ernaar om klachten binnen 14 dagen te behandelen.
              </p>
              <p className="mb-4">
                15.3 Als wij er niet uitkomen, kunnen geschillen worden voorgelegd aan een 
                erkende geschillencommissie of de rechter.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                16. Wijzigingen van voorwaarden
              </h2>
              <p className="mb-4">
                16.1 Wij behouden ons het recht voor deze voorwaarden te wijzigen.
              </p>
              <p className="mb-4">
                16.2 Significante wijzigingen worden minimaal 30 dagen van tevoren aangekondigd via:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>E-mail naar uw geregistreerde e-mailadres</li>
                <li>Een melding op de website</li>
              </ul>
              <p className="mb-4">
                16.3 Door de Dienst te blijven gebruiken na de ingangsdatum van de nieuwe voorwaarden, 
                gaat u akkoord met deze wijzigingen.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                17. Toepasselijk recht en bevoegde rechter
              </h2>
              <p className="mb-4">
                17.1 Op deze voorwaarden is Nederlands recht van toepassing.
              </p>
              <p className="mb-4">
                17.2 Geschillen worden bij uitsluiting voorgelegd aan de bevoegde rechter in het 
                arrondissement waarin Writgo Media is gevestigd (Utrecht), tenzij de wet dwingend 
                anders voorschrijft.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                18. Slotbepalingen
              </h2>
              <p className="mb-4">
                18.1 Als een bepaling van deze voorwaarden nietig of vernietigbaar blijkt te zijn, 
                blijven de overige bepalingen volledig van kracht.
              </p>
              <p className="mb-4">
                18.2 Writgo Media mag rechten en verplichtingen uit deze overeenkomst overdragen aan 
                derden.
              </p>
              <p className="mb-4">
                18.3 Deze voorwaarden vormen de volledige overeenkomst tussen u en Writgo Media.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                19. Contact
              </h2>
              <p className="mb-4">
                Voor vragen over deze Algemene Voorwaarden:
              </p>
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6 mb-4">
                <p className="mb-2">
                  <strong className="text-white">Bedrijf:</strong>{' '}
                  <span className="text-blue-400">Writgo Media</span>
                </p>
                <p className="mb-2">
                  <strong className="text-white">KVK:</strong> 96200960
                </p>
                <p className="mb-2">
                  <strong className="text-white">BTW:</strong> NL867510675B01
                </p>
                <p className="mb-2">
                  <strong className="text-white">E-mail:</strong>{' '}
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

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mt-8">
                <p className="text-blue-300">
                  <strong className="text-white">✅ Fair Use Policy:</strong> Wij geloven in 
                  eerlijk en transparant gebruik. Bij normaal gebruik heeft u nooit problemen. 
                  Alleen bij evident misbruik of fraude grijpen wij in.
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
