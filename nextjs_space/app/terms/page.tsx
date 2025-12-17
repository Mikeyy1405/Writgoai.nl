'use client';

/**
 * 📜 Terms of Service
 */

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-900 shadow-lg rounded-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-slate-700 mb-2">
            Algemene Voorwaarden
          </h1>
          <p className="text-slate-600 mb-8">
            Laatst bijgewerkt: 4 december 2025
          </p>

          <div className="prose prose-slate max-w-none">
            <h2 className="text-2xl font-semibold text-slate-700 mt-8 mb-4">
              1. Acceptatie van voorwaarden
            </h2>
            <p className="text-slate-700 mb-4">
              Door gebruik te maken van Writgo Media ("de Dienst"), gaat u akkoord met deze Algemene Voorwaarden. 
              Als u niet akkoord gaat, mag u de Dienst niet gebruiken.
            </p>

            <h2 className="text-2xl font-semibold text-slate-700 mt-8 mb-4">
              2. Beschrijving van de dienst
            </h2>
            <p className="text-slate-700 mb-4">
              Writgo Media is een AI-aangedreven content automatisering platform dat:
            </p>
            <ul className="list-disc pl-6 mb-4 text-slate-700">
              <li>AI chat en content generatie biedt</li>
              <li>Automatische blog, social media en video content creëert</li>
              <li>Integraties met WordPress en social media platforms faciliteert</li>
              <li>Credit-gebaseerde diensten aanbiedt</li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-700 mt-8 mb-4">
              3. Account registratie
            </h2>
            <p className="text-slate-700 mb-4">
              Om de Dienst te gebruiken, moet u:
            </p>
            <ul className="list-disc pl-6 mb-4 text-slate-700">
              <li>Een account aanmaken met accurate informatie</li>
              <li>Minimaal 16 jaar oud zijn</li>
              <li>Uw inloggegevens vertrouwelijk houden</li>
              <li>Verantwoordelijk zijn voor alle activiteiten onder uw account</li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-700 mt-8 mb-4">
              4. Abonnementen en betalingen
            </h2>
            
            <h3 className="text-xl font-semibold text-slate-600 mt-6 mb-3">
              4.1 Abonnementsplannen
            </h3>
            <p className="text-slate-700 mb-4">
              We bieden verschillende abonnementsplannen:
            </p>
            <ul className="list-disc pl-6 mb-4 text-slate-700">
              <li><strong>Starter</strong> - €29/maand (1.000 credits/maand, ~14 blogs)</li>
              <li><strong>Professional</strong> - €79/maand (3.000 credits/maand, ~42 blogs)</li>
              <li><strong>Enterprise</strong> - €199/maand (10.000 credits/maand, ~142 blogs)</li>
              <li><strong>Managed Service</strong> - Vanaf €499/maand (complete content service)</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-600 mt-6 mb-3">
              4.2 Credit systeem
            </h3>
            <ul className="list-disc pl-6 mb-4 text-slate-700">
              <li>Credits worden gebruikt voor AI generaties</li>
              <li>Abonnement credits vernieuwen maandelijks</li>
              <li>Top-up credits blijven beschikbaar</li>
              <li>Credits zijn niet overdraagbaar of inwisselbaar voor contant geld</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-600 mt-6 mb-3">
              4.3 Betalingen
            </h3>
            <ul className="list-disc pl-6 mb-4 text-slate-700">
              <li>Betalingen worden verwerkt via Stripe</li>
              <li>Abonnementen worden automatisch verlengd</li>
              <li>Prijzen zijn in EUR inclusief BTW</li>
              <li>Wij behouden ons het recht voor prijzen te wijzigen met 30 dagen kennisgeving</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-600 mt-6 mb-3">
              4.4 Opzeggen en terugbetalingen
            </h3>
            <ul className="list-disc pl-6 mb-4 text-slate-700">
              <li>U kunt uw abonnement op elk moment opzeggen</li>
              <li>Opzeggingen zijn effectief aan het einde van de betaalperiode</li>
              <li>Geen terugbetalingen voor gedeeltelijke maanden</li>
              <li>Ongebruikte credits vervallen bij opzegging</li>
              <li>Terugbetalingen alleen bij technische problemen aan onze kant</li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-700 mt-8 mb-4">
              5. Acceptabel gebruik
            </h2>
            <p className="text-slate-700 mb-4">
              U mag de Dienst NIET gebruiken voor:
            </p>
            <ul className="list-disc pl-6 mb-4 text-slate-700">
              <li>Illegale activiteiten</li>
              <li>Spam of phishing</li>
              <li>Haatzaaiende, gewelddadige of discriminerende content</li>
              <li>Inbreuk op intellectueel eigendom van anderen</li>
              <li>Malware, virussen of schadelijke code</li>
              <li>Misleidende of frauduleuze content</li>
              <li>API misbruik of excessive gebruik</li>
              <li>Reverse engineering van onze dienst</li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-700 mt-8 mb-4">
              6. AI gegenereerde content
            </h2>
            <p className="text-slate-700 mb-4">
              Belangrijke opmerkingen over AI content:
            </p>
            <ul className="list-disc pl-6 mb-4 text-slate-700">
              <li>U bent verantwoordelijk voor het controleren van gegenereerde content</li>
              <li>AI kan fouten maken - verifieer altijd feiten</li>
              <li>U heeft de rechten op uw gegenereerde content</li>
              <li>Wij garanderen niet de nauwkeurigheid van AI output</li>
              <li>U moet voldoen aan copyright en intellectueel eigendom wetten</li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-700 mt-8 mb-4">
              7. Intellectueel eigendom
            </h2>
            <p className="text-slate-700 mb-4">
              <strong>Uw content:</strong> U behoudt alle rechten op uw input en gegenereerde content.
            </p>
            <p className="text-slate-700 mb-4">
              <strong>Onze dienst:</strong> Writgo Media, logo's, en alle software zijn ons intellectueel eigendom.
            </p>

            <h2 className="text-2xl font-semibold text-slate-700 mt-8 mb-4">
              8. Service beschikbaarheid
            </h2>
            <ul className="list-disc pl-6 mb-4 text-slate-700">
              <li>Wij streven naar 99% uptime maar garanderen dit niet</li>
              <li>Onderhoud kan de dienst tijdelijk onderbreken</li>
              <li>We zijn niet aansprakelijk voor service onderbrekingen</li>
              <li>Credits worden niet terugbetaald bij downtime</li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-700 mt-8 mb-4">
              9. Aansprakelijkheid
            </h2>
            <p className="text-slate-700 mb-4">
              Writgo Media is niet aansprakelijk voor:
            </p>
            <ul className="list-disc pl-6 mb-4 text-slate-700">
              <li>Indirecte of gevolgschade</li>
              <li>Verlies van data, winst of omzet</li>
              <li>Schade door gebruik van AI gegenereerde content</li>
              <li>Acties van derden (API providers, etc.)</li>
            </ul>
            <p className="text-slate-700 mb-4">
              Maximale aansprakelijkheid beperkt tot het bedrag betaald in de laatste 12 maanden.
            </p>

            <h2 className="text-2xl font-semibold text-slate-700 mt-8 mb-4">
              10. Wijziging van voorwaarden
            </h2>
            <p className="text-slate-700 mb-4">
              Wij behouden ons het recht voor deze voorwaarden te wijzigen. Significante wijzigingen worden 30 dagen van tevoren aangekondigd via email.
            </p>

            <h2 className="text-2xl font-semibold text-slate-700 mt-8 mb-4">
              11. Account opschorting en beëindiging
            </h2>
            <p className="text-slate-700 mb-4">
              Wij kunnen uw account opschorten of beëindigen bij:
            </p>
            <ul className="list-disc pl-6 mb-4 text-slate-700">
              <li>Schending van deze voorwaarden</li>
              <li>Frauduleuze activiteiten</li>
              <li>Non-betaling</li>
              <li>Misbruik van de dienst</li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-700 mt-8 mb-4">
              12. Toepasselijk recht
            </h2>
            <p className="text-slate-700 mb-4">
              Deze voorwaarden worden beheerst door Nederlands recht. Geschillen worden voorgelegd aan de bevoegde rechter in Nederland.
            </p>

            <h2 className="text-2xl font-semibold text-slate-700 mt-8 mb-4">
              13. Contact
            </h2>
            <p className="text-slate-700 mb-4">
              Voor vragen over deze voorwaarden:
            </p>
            <div className="bg-slate-50 p-4 rounded-lg mb-4">
              <p className="text-slate-700 mb-2">
                <strong>Email:</strong>{' '}
                <a href="mailto:info@writgo.nl" className="text-blue-600 hover:underline">
                  info@writgo.nl
                </a>
              </p>
              <p className="text-slate-700 mb-2">
                <strong>Website:</strong>{' '}
                <a href="https://writgo.nl" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  writgo.nl
                </a>
              </p>
              <p className="text-slate-700">
                <strong>Bedrijf:</strong> Writgo Media
              </p>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-8">
              <p className="text-green-800">
                <strong>✅ Fair Use Policy:</strong> Wij geloven in eerlijk gebruik. Bij normaal gebruik heeft u nooit problemen. 
                Alleen bij excessief misbruik grijpen wij in.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
