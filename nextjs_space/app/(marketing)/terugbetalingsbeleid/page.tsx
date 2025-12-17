'use client';

import PublicNav from '@/components/public-nav';
import PublicFooter from '@/components/public-footer';
import { XCircle, AlertTriangle, Mail } from 'lucide-react';

/**
 * 💰 Terugbetalingsbeleid - Geen Refunds Policy
 */

export default function TerugbetalingsbeleidPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <PublicNav />
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900/5 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-8 md:p-12">
            <h1 className="text-4xl font-bold text-white mb-2">
              Terugbetalingsbeleid
            </h1>
            <p className="text-gray-400 mb-8">
              Laatst bijgewerkt: 4 december 2025
            </p>

            {/* Warning Banner */}
            <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <XCircle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    GEEN TERUGBETALINGEN
                  </h2>
                  <p className="text-red-300 leading-relaxed">
                    Writgo Media biedt <strong className="text-white">GEEN terugbetalingen</strong> aan 
                    voor abonnementen, aangekochte credits of diensten. Lees dit beleid zorgvuldig 
                    door voordat u een aankoop doet.
                  </p>
                </div>
              </div>
            </div>

            <div className="prose prose-slate max-w-none text-gray-300 space-y-6">
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                1. Algemeen terugbetalingsbeleid
              </h2>
              <p className="mb-4">
                Writgo Media hanteert een <strong className="text-white">strikt geen-terugbetalingsbeleid</strong> voor 
                alle diensten en producten. Dit beleid is van toepassing op:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Alle abonnementen (Starter, Pro, Business)</li>
                <li>Aangekochte credits (top-ups)</li>
                <li>Maandelijkse abonnementskosten</li>
                <li>Extra diensten en features</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                2. Waarom geen terugbetalingen?
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                2.1 Digitale diensten - Directe levering
              </h3>
              <p className="mb-4">
                Writgo Media levert digitale diensten die onmiddellijk toegankelijk en bruikbaar zijn 
                na aankoop. Zodra u:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Een abonnement activeert</li>
                <li>Credits ontvangt</li>
                <li>AI generaties uitvoert</li>
                <li>Content creëert</li>
              </ul>
              <p className="mb-4">
                ...zijn deze diensten al geleverd en geconsumeerd. Het is technisch en praktisch 
                onmogelijk om geleverde digitale diensten "terug te nemen".
              </p>

              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                2.2 Operationele kosten
              </h3>
              <p className="mb-4">
                Voor elke AI generatie maken wij reële kosten bij externe AI dienstverleners. 
                Deze kosten worden door ons betaald zodra u onze dienst gebruikt, 
                ongeacht of u tevreden bent met het resultaat.
              </p>

              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                2.3 Gratis trial beschikbaar
              </h3>
              <p className="mb-4">
                Wij bieden een <strong className="text-white">gratis account</strong> met beperkte 
                credits zodat u onze dienst kunt testen voordat u een betaald abonnement afsluit. 
                U heeft dus de mogelijkheid om de dienst uit te proberen zonder financieel risico.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                3. Abonnementen
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                3.1 Automatische verlenging
              </h3>
              <p className="mb-4">
                Alle abonnementen worden automatisch maandelijks verlengd. U wordt vooraf geïnformeerd 
                over verlengingen via email.
              </p>

              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                3.2 Opzeggen mogelijk
              </h3>
              <p className="mb-4">
                U kunt uw abonnement op elk moment opzeggen via uw account instellingen. 
                Belangrijke punten:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  <strong className="text-white">Opzegging is effectief:</strong> Aan het einde 
                  van de lopende betaalperiode
                </li>
                <li>
                  <strong className="text-white">Geen terugbetaling:</strong> De resterende dagen 
                  van de lopende maand worden NIET terugbetaald
                </li>
                <li>
                  <strong className="text-white">Toegang blijft:</strong> U behoudt toegang tot 
                  alle functies tot het einde van de betaalde periode
                </li>
                <li>
                  <strong className="text-white">Credits vervallen:</strong> Ongebruikte 
                  abonnement-credits vervallen bij het einde van het abonnement
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                3.3 Geen pro-rata terugbetalingen
              </h3>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-300">
                    Als u halverwege de maand opzegt, krijgt u <strong className="text-white">GEEN terugbetaling</strong> 
                    voor de resterende dagen. U blijft wel toegang houden tot alle functies tot het 
                    einde van de betaalde periode.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                4. Credits
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                4.1 Twee soorten credits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Abonnement Credits
                  </h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Vernieuwen elke maand</li>
                    <li>• Vervallen einde maand</li>
                    <li>• Niet restitueerbaar</li>
                  </ul>
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Top-up Credits
                  </h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Extra aangekocht</li>
                    <li>• Verlopen niet</li>
                    <li>• Niet restitueerbaar</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                4.2 Credits zijn niet restitueerbaar
              </h3>
              <p className="mb-4">
                Credits zijn virtuele eenheden die direct kunnen worden gebruikt. Zodra credits 
                zijn toegevoegd aan uw account:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Kunnen ze niet worden terugbetaald</li>
                <li>Kunnen ze niet worden overgedragen naar andere accounts</li>
                <li>Kunnen ze niet worden ingewisseld voor contant geld</li>
                <li>Zijn ze alleen bruikbaar binnen het WritgoAI platform</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                5. Uitzonderingen
              </h2>
              <p className="mb-4">
                In zeer uitzonderlijke gevallen kunnen wij een terugbetaling overwegen:
              </p>
              
              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                5.1 Technische problemen aan onze kant
              </h3>
              <p className="mb-4">
                Als er een ernstige technische storing is aan onze kant die:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Het gebruik van de dienst volledig onmogelijk maakt</li>
                <li>Langer dan 7 dagen duurt</li>
                <li>Niet oplosbaar is</li>
                <li>Door ons is veroorzaakt (niet door externe partijen)</li>
              </ul>
              <p className="mb-4">
                Dan kunnen wij een <strong className="text-white">gedeeltelijke terugbetaling</strong> overwegen 
                voor de periode dat de dienst niet beschikbaar was.
              </p>

              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                5.2 Dubbele betalingen
              </h3>
              <p className="mb-4">
                Bij accidentele dubbele betalingen door technische fouten zullen wij de dubbele 
                betaling terugstorten.
              </p>

              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                5.3 Niet-levering
              </h3>
              <p className="mb-4">
                Als u betaalt maar geen toegang krijgt tot uw abonnement of credits, nemen wij 
                dit natuurlijk in behandeling en lossen we het op (door levering of terugbetaling).
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                6. Wat GEEN reden is voor terugbetaling
              </h2>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
                <p className="text-white font-semibold mb-3">
                  De volgende redenen zijn NIET geldig voor een terugbetaling:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-red-300">
                  <li>
                    <strong className="text-white">"De AI output is niet goed genoeg"</strong> - 
                    AI is niet perfect, output varieert. Dit is inherent aan AI technologie.
                  </li>
                  <li>
                    <strong className="text-white">"Ik heb de credits niet gebruikt"</strong> - 
                    Credits zijn beschikbaar gesteld, niet gebruiken is uw keuze.
                  </li>
                  <li>
                    <strong className="text-white">"Ik vergat op te zeggen"</strong> - 
                    Automatische verlenging is duidelijk gecommuniceerd.
                  </li>
                  <li>
                    <strong className="text-white">"Het werkt niet zoals ik dacht"</strong> - 
                    Gebruik de gratis trial om de dienst te testen.
                  </li>
                  <li>
                    <strong className="text-white">"Ik heb het niet nodig"</strong> - 
                    Overweeg dit voordat u een abonnement afsluit.
                  </li>
                  <li>
                    <strong className="text-white">"Technisch probleem bij derde partij"</strong> - 
                    Storingen bij hosting, API providers, etc. vallen buiten onze controle.
                  </li>
                </ul>
              </div>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                7. Alternatieve oplossingen
              </h2>
              <p className="mb-4">
                Als u niet tevreden bent met de dienst, overwegen wij graag alternatieve oplossingen:
              </p>
              
              <div className="space-y-4">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    🎓 Training & Support
                  </h4>
                  <p className="text-gray-400">
                    Wij bieden uitgebreide documentatie, tutorials en persoonlijke support om u 
                    te helpen het maximale uit ons platform te halen.
                  </p>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    ⬇️ Downgrade
                  </h4>
                  <p className="text-gray-400">
                    Als uw huidige abonnement te duur is, kunt u downgraden naar een lager plan 
                    bij de volgende verlenging.
                  </p>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    ⏸️ Opzeggen
                  </h4>
                  <p className="text-gray-400">
                    U kunt uw abonnement altijd opzeggen. U behoudt toegang tot het einde van 
                    de betaalde periode.
                  </p>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    💬 Gesprek
                  </h4>
                  <p className="text-gray-400">
                    Neem contact met ons op om te bespreken hoe wij u beter kunnen helpen. 
                    Wij staan altijd open voor feedback en suggesties.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                8. Chargeback waarschuwing
              </h2>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold mb-2">
                      Onterechte chargebacks
                    </p>
                    <p className="text-red-300">
                      Als u een chargeback aanvraagt bij uw bank terwijl de dienst correct is 
                      geleverd, beschouwen wij dit als fraude. Dit kan resulteren in:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1 text-red-300">
                      <li>Onmiddellijke beëindiging van uw account</li>
                      <li>Blokkering van toekomstige registraties</li>
                      <li>Mogelijke juridische stappen</li>
                    </ul>
                    <p className="text-yellow-300 mt-3">
                      Neem <strong>eerst</strong> contact met ons op voordat u een chargeback aanvraagt.
                    </p>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                9. Tips om teleurstelling te voorkomen
              </h2>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
                <ul className="space-y-3 text-blue-300">
                  <li className="flex items-start gap-2">
                    <span className="text-2xl">1️⃣</span>
                    <span>
                      <strong className="text-white">Test eerst gratis:</strong> Gebruik het 
                      gratis account om de dienst uit te proberen
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-2xl">2️⃣</span>
                    <span>
                      <strong className="text-white">Start klein:</strong> Begin met het Starter 
                      plan voordat u naar Pro of Business gaat
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-2xl">3️⃣</span>
                    <span>
                      <strong className="text-white">Lees documentatie:</strong> Zorg dat u 
                      begrijpt wat de dienst wel en niet kan
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-2xl">4️⃣</span>
                    <span>
                      <strong className="text-white">Stel vragen:</strong> Neem contact op 
                      voordat u een abonnement afsluit als u twijfelt
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-2xl">5️⃣</span>
                    <span>
                      <strong className="text-white">Plan opzegging:</strong> Zet een herinnering 
                      als u maar 1 maand wilt gebruiken
                    </span>
                  </li>
                </ul>
              </div>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                10. Contact
              </h2>
              <p className="mb-4">
                Voor vragen over dit terugbetalingsbeleid of uw account:
              </p>
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6 mb-4">
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-white font-semibold mb-2">
                      Neem contact met ons op
                    </p>
                    <p className="mb-2">
                      <strong className="text-white">E-mail:</strong>{' '}
                      <a href="mailto:info@writgo.nl" className="text-blue-400 hover:text-blue-300 transition-colors">
                        info@writgo.nl
                      </a>
                    </p>
                    <p className="mb-2">
                      <strong className="text-white">Bedrijf:</strong> Writgo Media
                    </p>
                    <p>
                      <strong className="text-white">Website:</strong>{' '}
                      <a href="https://writgo.nl" className="text-blue-400 hover:text-blue-300 transition-colors">
                        https://writgo.nl
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 mt-8">
                <p className="text-green-300">
                  <strong className="text-white">💚 Klanttevredenheid:</strong> Hoewel wij geen 
                  terugbetalingen aanbieden, streven wij altijd naar 100% klanttevredenheid. 
                  Neem contact op als u problemen ervaart - wij helpen u graag!
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
