'use client';

import PublicNav from '@/components/public-nav';
import PublicFooter from '@/components/public-footer';
import { Cookie, Settings, Shield, BarChart3, Target, Palette } from 'lucide-react';

/**
 * 🍪 Cookiebeleid - Detailed Cookie Policy
 */

export default function CookiebeleidPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <PublicNav />
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-8 md:p-12">
            <div className="flex items-center gap-4 mb-4">
              <Cookie className="w-12 h-12 text-blue-500" />
              <h1 className="text-4xl font-bold text-white">
                Cookiebeleid
              </h1>
            </div>
            <p className="text-gray-400 mb-8">
              Laatst bijgewerkt: 4 december 2025
            </p>

            <div className="prose prose-slate max-w-none text-gray-300 space-y-6">
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                1. Wat zijn cookies?
              </h2>
              <p className="mb-4">
                Cookies zijn kleine tekstbestanden die op uw apparaat (computer, tablet of smartphone) 
                worden geplaatst wanneer u een website bezoekt. Cookies helpen websites om:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>U te herkennen bij terugkerende bezoeken</li>
                <li>Uw voorkeuren te onthouden</li>
                <li>De werking van de website te verbeteren</li>
                <li>Inzicht te krijgen in hoe bezoekers de website gebruiken</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                2. Waarom gebruiken wij cookies?
              </h2>
              <p className="mb-4">
                Writgo Media gebruikt cookies om een optimale gebruikerservaring te bieden, de 
                beveiliging te waarborgen en onze diensten te verbeteren. Wij gebruiken alleen 
                tracking en marketing cookies met uw expliciete toestemming.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                3. Welke cookies gebruiken wij?
              </h2>
              <p className="mb-4">
                Wij gebruiken verschillende soorten cookies op onze website:
              </p>

              {/* Necessary Cookies */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <Shield className="w-8 h-8 text-green-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      3.1 Noodzakelijke Cookies (Altijd actief)
                    </h3>
                    <p className="text-gray-300 mb-3">
                      Deze cookies zijn essentieel voor het functioneren van de website. 
                      Zonder deze cookies werkt de website niet goed. Deze cookies kunnen 
                      niet worden uitgeschakeld.
                    </p>
                    
                    <div className="bg-white/5 rounded-xl p-4 mt-4">
                      <h4 className="text-white font-semibold mb-3">Specifieke cookies:</h4>
                      <div className="space-y-4 text-sm">
                        <div>
                          <p className="text-white font-medium">Authenticatie cookies</p>
                          <p className="text-gray-400">
                            <strong>Naam:</strong> next-auth.session-token<br />
                            <strong>Doel:</strong> Houdt u ingelogd op uw account<br />
                            <strong>Duur:</strong> 30 dagen<br />
                            <strong>Type:</strong> First-party
                          </p>
                        </div>
                        <div>
                          <p className="text-white font-medium">CSRF bescherming</p>
                          <p className="text-gray-400">
                            <strong>Naam:</strong> next-auth.csrf-token<br />
                            <strong>Doel:</strong> Beschermt tegen cross-site request forgery aanvallen<br />
                            <strong>Duur:</strong> Sessie<br />
                            <strong>Type:</strong> First-party
                          </p>
                        </div>
                        <div>
                          <p className="text-white font-medium">Cookie consent</p>
                          <p className="text-gray-400">
                            <strong>Naam:</strong> writgo_cookie_consent<br />
                            <strong>Doel:</strong> Onthoudt uw cookie voorkeuren<br />
                            <strong>Duur:</strong> 1 jaar<br />
                            <strong>Type:</strong> First-party (localStorage)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <BarChart3 className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      3.2 Analytische Cookies (Met uw toestemming)
                    </h3>
                    <p className="text-gray-300 mb-3">
                      Deze cookies helpen ons begrijpen hoe bezoekers de website gebruiken. 
                      Wij gebruiken deze informatie om de website te verbeteren.
                    </p>
                    
                    <div className="bg-white/5 rounded-xl p-4 mt-4">
                      <h4 className="text-white font-semibold mb-3">Specifieke cookies:</h4>
                      <div className="space-y-4 text-sm">
                        <div>
                          <p className="text-white font-medium">Google Analytics</p>
                          <p className="text-gray-400">
                            <strong>Cookies:</strong> _ga, _gid, _gat<br />
                            <strong>Doel:</strong> Analyseert websiteverkeer en gebruikersgedrag<br />
                            <strong>Duur:</strong> _ga: 2 jaar, _gid: 24 uur, _gat: 1 minuut<br />
                            <strong>Type:</strong> Third-party (Google)<br />
                            <strong>Privacy:</strong> IP-anonimisering ingeschakeld
                          </p>
                        </div>
                        <div>
                          <p className="text-white font-medium">Vercel Analytics</p>
                          <p className="text-gray-400">
                            <strong>Naam:</strong> __vercel_analytics_id<br />
                            <strong>Doel:</strong> Privacy-vriendelijke performance analytics<br />
                            <strong>Duur:</strong> 1 jaar<br />
                            <strong>Type:</strong> First-party<br />
                            <strong>Privacy:</strong> Geen persoonlijke data verzameld
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <Target className="w-8 h-8 text-purple-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      3.3 Marketing Cookies (Met uw toestemming)
                    </h3>
                    <p className="text-gray-300 mb-3">
                      Deze cookies worden gebruikt om relevante advertenties te tonen en 
                      marketingcampagnes te meten.
                    </p>
                    
                    <div className="bg-white/5 rounded-xl p-4 mt-4">
                      <h4 className="text-white font-semibold mb-3">Specifieke cookies:</h4>
                      <div className="space-y-4 text-sm">
                        <div>
                          <p className="text-white font-medium">Google Ads</p>
                          <p className="text-gray-400">
                            <strong>Cookies:</strong> _gcl_*, _gcl_au<br />
                            <strong>Doel:</strong> Retargeting en conversie tracking<br />
                            <strong>Duur:</strong> 90 dagen<br />
                            <strong>Type:</strong> Third-party (Google)
                          </p>
                        </div>
                        <div>
                          <p className="text-white font-medium">Facebook Pixel</p>
                          <p className="text-gray-400">
                            <strong>Cookies:</strong> _fbp, fr<br />
                            <strong>Doel:</strong> Social media advertising en conversie tracking<br />
                            <strong>Duur:</strong> 90 dagen<br />
                            <strong>Type:</strong> Third-party (Meta/Facebook)
                          </p>
                        </div>
                      </div>
                      <p className="text-yellow-300 text-sm mt-4">
                        ℹ️ Marketing cookies worden momenteel NIET actief gebruikt, maar zijn 
                        beschikbaar voor toekomstig gebruik.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <Palette className="w-8 h-8 text-orange-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      3.4 Functionele Cookies (Met uw toestemming)
                    </h3>
                    <p className="text-gray-300 mb-3">
                      Deze cookies onthouden uw voorkeuren en personalisatie-instellingen.
                    </p>
                    
                    <div className="bg-white/5 rounded-xl p-4 mt-4">
                      <h4 className="text-white font-semibold mb-3">Specifieke cookies:</h4>
                      <div className="space-y-4 text-sm">
                        <div>
                          <p className="text-white font-medium">Taalvoorkeur</p>
                          <p className="text-gray-400">
                            <strong>Naam:</strong> writgo_language<br />
                            <strong>Doel:</strong> Onthoudt uw taalkeuze (Nederlands/Engels)<br />
                            <strong>Duur:</strong> 1 jaar<br />
                            <strong>Type:</strong> First-party
                          </p>
                        </div>
                        <div>
                          <p className="text-white font-medium">Thema instelling</p>
                          <p className="text-gray-400">
                            <strong>Naam:</strong> theme<br />
                            <strong>Doel:</strong> Onthoudt dark/light mode voorkeur<br />
                            <strong>Duur:</strong> 1 jaar<br />
                            <strong>Type:</strong> First-party (localStorage)
                          </p>
                        </div>
                        <div>
                          <p className="text-white font-medium">Layout voorkeuren</p>
                          <p className="text-gray-400">
                            <strong>Naam:</strong> writgo_layout_prefs<br />
                            <strong>Doel:</strong> Onthoudt dashboard layout en weergave-instellingen<br />
                            <strong>Duur:</strong> 1 jaar<br />
                            <strong>Type:</strong> First-party (localStorage)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                4. Hoe kunt u cookies beheren?
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                4.1 Via onze cookie banner
              </h3>
              <p className="mb-4">
                Wanneer u onze website voor het eerst bezoekt, verschijnt er een cookie banner. 
                U kunt kiezen uit:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  <strong className="text-white">Accepteer Alle:</strong> Alle cookies worden geactiveerd
                </li>
                <li>
                  <strong className="text-white">Alleen Noodzakelijke:</strong> Alleen essentiële cookies
                </li>
                <li>
                  <strong className="text-white">Instellingen:</strong> Kies per categorie welke 
                  cookies u wilt accepteren
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                4.2 Cookie instellingen wijzigen
              </h3>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5 mb-4">
                <div className="flex items-start gap-3">
                  <Settings className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-300 mb-2">
                      U kunt uw cookie voorkeuren op elk moment wijzigen door:
                    </p>
                    <ol className="list-decimal pl-6 space-y-1 text-blue-300">
                      <li>Onderaan elke pagina op "Cookie instellingen" te klikken</li>
                      <li>Of via uw browser instellingen (zie hieronder)</li>
                    </ol>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                4.3 Via uw browser
              </h3>
              <p className="mb-4">
                U kunt cookies ook beheren via uw browser instellingen. Zo gaat u te werk:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <h4 className="text-white font-semibold mb-2">Google Chrome</h4>
                  <p className="text-sm text-gray-400">
                    Instellingen → Privacy en beveiliging → Cookies en andere sitegegevens
                  </p>
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <h4 className="text-white font-semibold mb-2">Mozilla Firefox</h4>
                  <p className="text-sm text-gray-400">
                    Instellingen → Privacy & Beveiliging → Cookies en sitegegevens
                  </p>
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <h4 className="text-white font-semibold mb-2">Safari</h4>
                  <p className="text-sm text-gray-400">
                    Voorkeuren → Privacy → Cookies en websitegegevens
                  </p>
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <h4 className="text-white font-semibold mb-2">Microsoft Edge</h4>
                  <p className="text-sm text-gray-400">
                    Instellingen → Cookies en sitemachtigingen → Cookies beheren
                  </p>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 mb-6">
                <p className="text-yellow-300">
                  ⚠️ <strong className="text-white">Let op:</strong> Als u alle cookies blokkeert, 
                  werken sommige delen van onze website mogelijk niet goed. Noodzakelijke cookies 
                  zijn vereist voor basisfunctionaliteit.
                </p>
              </div>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                5. Third-party cookies
              </h2>
              <p className="mb-4">
                Sommige cookies worden geplaatst door externe diensten die op onze website 
                verschijnen. Wij hebben geen controle over deze cookies. De privacy beleid 
                van deze diensten zijn:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  <strong className="text-white">Google Analytics:</strong>{' '}
                  <a 
                    href="https://policies.google.com/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors underline"
                  >
                    https://policies.google.com/privacy
                  </a>
                </li>
                <li>
                  <strong className="text-white">Google Ads:</strong>{' '}
                  <a 
                    href="https://policies.google.com/technologies/ads" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors underline"
                  >
                    https://policies.google.com/technologies/ads
                  </a>
                </li>
                <li>
                  <strong className="text-white">Facebook:</strong>{' '}
                  <a 
                    href="https://www.facebook.com/privacy/explanation" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors underline"
                  >
                    https://www.facebook.com/privacy/explanation
                  </a>
                </li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                6. Cookie overzicht tabel
              </h2>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm border border-gray-700 rounded-lg overflow-hidden">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-white font-semibold">Cookie Naam</th>
                      <th className="px-4 py-3 text-left text-white font-semibold">Type</th>
                      <th className="px-4 py-3 text-left text-white font-semibold">Duur</th>
                      <th className="px-4 py-3 text-left text-white font-semibold">Doel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    <tr className="bg-gray-900/50">
                      <td className="px-4 py-3 text-gray-300">next-auth.session-token</td>
                      <td className="px-4 py-3 text-green-400">Noodzakelijk</td>
                      <td className="px-4 py-3 text-gray-400">30 dagen</td>
                      <td className="px-4 py-3 text-gray-400">Authenticatie</td>
                    </tr>
                    <tr className="bg-gray-900/30">
                      <td className="px-4 py-3 text-gray-300">writgo_cookie_consent</td>
                      <td className="px-4 py-3 text-green-400">Noodzakelijk</td>
                      <td className="px-4 py-3 text-gray-400">1 jaar</td>
                      <td className="px-4 py-3 text-gray-400">Cookie voorkeuren</td>
                    </tr>
                    <tr className="bg-gray-900/50">
                      <td className="px-4 py-3 text-gray-300">_ga, _gid</td>
                      <td className="px-4 py-3 text-blue-400">Analytisch</td>
                      <td className="px-4 py-3 text-gray-400">2 jaar / 24 uur</td>
                      <td className="px-4 py-3 text-gray-400">Google Analytics</td>
                    </tr>
                    <tr className="bg-gray-900/30">
                      <td className="px-4 py-3 text-gray-300">writgo_language</td>
                      <td className="px-4 py-3 text-orange-400">Functioneel</td>
                      <td className="px-4 py-3 text-gray-400">1 jaar</td>
                      <td className="px-4 py-3 text-gray-400">Taalvoorkeur</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                7. Updates van dit cookiebeleid
              </h2>
              <p className="mb-4">
                Wij kunnen dit cookiebeleid van tijd tot tijd bijwerken om wijzigingen in onze 
                cookies of nieuwe regelgeving te reflecteren. De laatste update staat bovenaan 
                dit document.
              </p>

              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                8. Contact
              </h2>
              <p className="mb-4">
                Voor vragen over dit cookiebeleid of uw cookie voorkeuren:
              </p>
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6 mb-4">
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

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mt-8">
                <p className="text-blue-300">
                  <strong className="text-white">🔒 Uw Privacy:</strong> Wij respecteren uw 
                  privacy en geven u volledige controle over welke cookies wij mogen gebruiken. 
                  Tracking cookies worden alleen gebruikt met uw expliciete toestemming.
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
