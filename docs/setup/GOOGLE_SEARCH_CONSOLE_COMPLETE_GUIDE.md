
# 🚀 Google Search Console Integratie - Complete Setup Guide

## 📋 Overzicht
Deze guide helpt je om Google Search Console (GSC) te koppelen aan WritgoAI, zodat je:
- **Bestaande content** kunt analyseren
- **Performance data** kunt zien (clicks, impressions, rankings)
- **Content gaps** kunt identificeren
- **Verbeter suggesties** kunt krijgen

---

## ⚡ Snelle Start (5 minuten)

### Stap 1: Open Google Cloud Console
1. Ga naar: https://console.cloud.google.com/apis/credentials
2. Log in met je Google account (bij voorkeur het account dat je website beheert)

### Stap 2: Selecteer of Maak een Project
1. Klik op de project dropdown bovenaan de pagina
2. **Optie A - Bestaand Project**: 
   - Zoek naar project met Client ID: `977335778451-q16199a0uerkcp9rtu6agfkbvfssc3og`
   - Dit is het WritgoAI project
3. **Optie B - Nieuw Project**: 
   - Klik "New Project"
   - Naam: "WritgoAI GSC Integration"
   - Klik "Create"

### Stap 3: Configureer OAuth 2.0 Client
1. In de credentials pagina, klik op een OAuth 2.0 Client ID
2. Klik op "Edit" (potlood icoon)
3. **KRITIEK**: Voeg deze Redirect URI toe:
   ```
   https://writgoai.nl/api/client/search-console/oauth
   ```
   ⚠️ **Let op**: 
   - Geen spaties
   - Geen trailing slash (/)
   - Exacte URL: `https://writgoai.nl/api/client/search-console/oauth`

4. Klik "Save"

### Stap 4: Configureer OAuth Consent Screen
1. Klik op "OAuth consent screen" in het menu links
2. Kies "External" en klik "Create"
3. Vul in:
   - **App name**: WritgoAI
   - **User support email**: info@writgo.nl
   - **Developer contact**: info@writgo.nl
4. Klik "Save and Continue"
5. **Scopes**: Klik "Add or Remove Scopes"
   - Zoek: `webmasters.readonly`
   - Selecteer: `https://www.googleapis.com/auth/webmasters.readonly`
   - Klik "Update" en "Save and Continue"
6. **Test Users**: 
   - Voeg je eigen email toe
   - Voeg `info@writgo.nl` toe
7. Klik "Save and Continue"

### Stap 5: Koppel GSC in WritgoAI
1. Ga naar: https://writgoai.nl/client-portal
2. Selecteer je project
3. Klik op "Settings" tab
4. Zoek "Google Search Console" sectie
5. Klik "Koppel Google Search Console"
6. Je wordt doorgestuurd naar Google
7. Geef toestemming voor "Read-only access to Search Console"
8. Je wordt teruggestuurd naar WritgoAI
9. ✅ Status moet zijn: "Gekoppeld"

### Stap 6: Selecteer je Website
1. In dezelfde Settings pagina
2. Selecteer je website uit de dropdown
3. Klik "Opslaan"

---

## 🎯 Content Mapping Gebruiken

### Waar te vinden?
1. Ga naar: **Client Portal** → **Topical Content Planner**
2. Selecteer je topical map
3. Scroll naar beneden naar **"Bestaande Content Analyse"**

### Wat zie je?
- **Alle Pagina's**: Overzicht van al je content
- **Top Performers**: Content die het goed doet (>100 clicks of Top 10 ranking)
- **Moet Verbeterd**: Content met veel impressions maar weinig clicks (kans!)
- **Lage Zichtbaarheid**: Content die nauwelijks wordt gezien

### Per Pagina Zie Je:
- ✅ **Index Status**: Of Google de pagina heeft geïndexeerd
- 🖱️ **Clicks**: Aantal keer dat mensen hebben geklikt
- 👁️ **Impressions**: Aantal keer dat de pagina in zoekresultaten is getoond
- 📈 **CTR**: Click-Through Rate (clicks / impressions)
- 🎯 **Positie**: Gemiddelde positie in zoekresultaten
- 🔑 **Top Keywords**: Waar de pagina voor rankt

---

## 🔍 Veelvoorkomende Problemen

### ❌ "Redirect URI Mismatch"
**Oorzaak**: De redirect URI in Google Cloud Console komt niet overeen.

**Oplossing**:
1. Check exact: `https://writgoai.nl/api/client/search-console/oauth`
2. Geen spaties voor of na de URL
3. Geen trailing slash
4. Gebruik `https://` (niet `http://`)

### ❌ "Access Denied"
**Oorzaak**: Je hebt de toestemming geweigerd of je account heeft geen toegang.

**Oplossing**:
1. Ga naar: https://myaccount.google.com/permissions
2. Zoek "WritgoAI"
3. Klik "Remove Access"
4. Probeer opnieuw te koppelen vanuit WritgoAI
5. Accepteer alle toestemmingen

### ❌ "Geen Sites Gevonden"
**Oorzaak**: Je Google account heeft geen Search Console properties.

**Oplossing**:
1. Ga naar: https://search.google.com/search-console
2. Log in met hetzelfde account
3. Voeg je website toe als property
4. Verifieer je eigendom
5. Wacht 24-48 uur voor data
6. Probeer opnieuw te koppelen in WritgoAI

### ❌ "Geen Content Gevonden"
**Oorzaak**: Je website heeft nog geen traffic of GSC heeft nog geen data.

**Oplossing**:
1. Wacht minimaal 48 uur na verificatie
2. Check dat je website traffic heeft
3. Controleer dat robots.txt crawling toestaat
4. Check Google Search Console dashboard zelf

---

## 🛠️ Diagnostics & Testing

### Test OAuth Flow
1. Ga naar: https://writgoai.nl/api/test-gsc-oauth
2. Klik "Start OAuth Flow Nu"
3. Geef toestemming
4. Check of je terugkomt op WritgoAI

### Check Connection Status
1. Ga naar: https://writgoai.nl/api/client/search-console/diagnostics
2. Check de JSON output:
   ```json
   {
     "environment": {
       "clientId": "977...",
       "hasClientSecret": true,
       "redirectUri": "https://writgoai.nl/api/..."
     },
     "authFile": {
       "exists": true,
       "hasAccessToken": true,
       "hasRefreshToken": true
     }
   }
   ```

### Verificatie Checklist
- [ ] Redirect URI is exact correct in Google Cloud Console
- [ ] OAuth consent screen is geconfigureerd
- [ ] Test user is toegevoegd (je eigen email)
- [ ] WritgoAI shows "Gekoppeld" status
- [ ] Website is geselecteerd in dropdown
- [ ] Je kunt content zien in de Content Planner

---

## 🎓 Hoe Data te Interpreteren

### 🌟 Top Performers (Houd ze goed!)
- **Kenmerken**: >100 clicks OF Top 10 positie
- **Actie**: Regelmatig updaten met nieuwe info
- **Doel**: Positie behouden en CTR verhogen

### ⚠️ Moet Verbeterd (Grootste Kansen!)
- **Kenmerken**: >100 impressions, <10 clicks, positie >20
- **Betekenis**: Mensen zien je content maar klikken niet
- **Actie**: 
  - Verbeter de title tag (maak aanlokkelijker)
  - Optimaliseer meta description
  - Voeg rich snippets toe
  - Update content met betere info

### 📉 Lage Zichtbaarheid (Nieuwe Content of Probleem)
- **Kenmerken**: <50 impressions
- **Betekenis**: Google toont je content nauwelijks
- **Acties**:
  - Check indexatie status
  - Voeg interne links toe
  - Verbeter content kwaliteit
  - Target betere keywords

---

## 📞 Support

### Meer Hulp Nodig?
1. **Email**: info@writgo.nl
2. **Include**:
   - Screenshot van error
   - Output van diagnostics endpoint
   - Browser console logs
   - Je email adres

### Resources
- Google Cloud Console: https://console.cloud.google.com
- Google Search Console: https://search.google.com/search-console
- WritgoAI Settings: https://writgoai.nl/client-portal/settings

---

## ✅ Success Checklist

Gebruik deze checklist om te verifiëren dat alles werkt:

- [ ] Google Cloud project aangemaakt/geselecteerd
- [ ] Redirect URI toegevoegd: `https://writgoai.nl/api/client/search-console/oauth`
- [ ] OAuth consent screen geconfigureerd
- [ ] Scopes toegevoegd: `webmasters.readonly`
- [ ] Test user toegevoegd (je eigen email)
- [ ] OAuth flow getest via WritgoAI
- [ ] Status in WritgoAI toont "Gekoppeld"
- [ ] Website geselecteerd in dropdown
- [ ] Content Planner toont je pagina's
- [ ] Data is actueel (laatste 90 dagen)
- [ ] Kan clicks, impressions en rankings zien

---

🎉 **Gefeliciteerd!** Als alle checkboxes zijn aangevinkt, is je Google Search Console integratie compleet en kun je je content data analyseren in WritgoAI!
