
# Google Search Console OAuth - Troubleshooting Stappen

## Status Analyse

✅ **Wat werkt:**
- OAuth flow start correct
- Google authentication pagina wordt bereikt
- De knop "Google Account Koppelen" werkt

❌ **Wat niet werkt:**
- Tokens worden niet opgeslagen in auth bestand
- OAuth status blijft "Niet Gekoppeld"

## Meest Waarschijnlijke Oorzaak

De **Redirect URI** is niet correct geconfigureerd in Google Cloud Console.

## Oplossing

### Stap 1: Configureer Redirect URI in Google Cloud Console

1. **Open Google Cloud Console:**
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Selecteer je OAuth 2.0 Client ID:**
   - Zoek naar de OAuth client met ID: `977335778451-q16199a0uerkcp9rtu6agfkbvfssc3og.apps.googleusercontent.com`
   - Klik erop om te bewerken

3. **Voeg EXACT deze Redirect URI toe:**
   ```
   https://writgoai.nl/api/client/search-console/oauth
   ```
   
   ⚠️ **BELANGRIJK:**
   - Geen trailing slash `/` aan het einde
   - Gebruik HTTPS (niet HTTP)
   - Gebruik `writgoai.nl` (niet `writgo.nl`)
   - Gebruik `/api/client/search-console/oauth` (exacte pad)

4. **Klik op "OPSLAAN"**

5. **Wacht 1-2 minuten** (Google heeft tijd nodig om de wijziging te propageren)

### Stap 2: Controleer OAuth Consent Screen

1. Ga naar "OAuth-toestemmingsscherm" in Google Cloud Console
2. Controleer of de app op "Testen" of "Gepubliceerd" staat
3. Als "Testen": voeg `info@writgo.nl` toe aan "Testgebruikers"

### Stap 3: Test de OAuth Flow

1. Ga terug naar WritGo: https://writgoai.nl/client-portal/projects/[je-project-id]
2. Scroll naar "Google Search Console" sectie
3. Klik op "Google Account Koppelen"
4. Log in met je Google account (als gevraagd)
5. **Geef toestemming** aan WritGo
6. Je zou nu moeten terugkeren naar WritGo met een succesmelding

### Stap 4: Verifieer de Koppeling

Na terugkeren naar WritGo:
- ✅ OAuth Status zou "Gekoppeld" moeten zijn (groen)
- ✅ Je zou nu je GSC sites moeten zien in een dropdown
- ✅ Je kunt een site selecteren en op "Opslaan" klikken

## Veelvoorkomende Errors

### Error: "redirect_uri_mismatch"

**Symptoom:** Google toont een error pagina met "Error 400: redirect_uri_mismatch"

**Oplossing:**
1. De redirect URI in Google Cloud Console komt niet exact overeen
2. Controleer de URI karakter-voor-karakter:
   ```
   https://writgoai.nl/api/client/search-console/oauth
   ```
3. Zorg dat er geen spaties voor/na staan
4. Wacht 1-2 minuten na het opslaan

### Error: "access_denied"

**Symptoom:** Je wordt teruggestuurd naar WritGo met een error

**Oplossing:**
- Je hebt de toestemming geweigerd
- Probeer opnieuw en klik op "Toestaan"

### Error: "invalid_grant"

**Symptoom:** OAuth flow start maar faalt tijdens token exchange

**Oplossing:**
- De authorization code is verlopen (codes zijn 10 minuten geldig)
- Probeer de volledige flow opnieuw

### Geen error maar ook geen tokens

**Symptoom:** Je wordt teruggestuurd maar OAuth status blijft "Niet Gekoppeld"

**Oplossing:**
1. Check de diagnostics endpoint: https://writgoai.nl/api/client/search-console/diagnostics
2. Controleer of de OAuth consent screen correct is geconfigureerd
3. Check of je email is toegevoegd aan "Testgebruikers"
4. Kijk in de browser console (F12) voor error messages

## Verificatie Checklist

Gebruik deze checklist om te controleren of alles correct is:

- [ ] Redirect URI is exact `https://writgoai.nl/api/client/search-console/oauth`
- [ ] Geen trailing slash in de redirect URI
- [ ] OAuth Consent Screen is geconfigureerd
- [ ] Email adres is toegevoegd aan Testgebruikers (als app in test mode staat)
- [ ] Je hebt gewacht 1-2 minuten na het opslaan van de redirect URI
- [ ] Je hebt toestemming gegeven tijdens de OAuth flow

## Test de Configuratie

### Browser Test:

1. Open: https://writgoai.nl/api/client/search-console/diagnostics
2. Check de output:
   ```json
   {
     "environment": {
       "hasClientId": true,
       "hasClientSecret": true,
       "redirectUri": "https://writgoai.nl/api/client/search-console/oauth"
     },
     "authFile": {
       "hasAccessToken": true,  // <-- Deze moet TRUE zijn na succesvolle koppeling
       "hasRefreshToken": true  // <-- Deze moet TRUE zijn na succesvolle koppeling
     }
   }
   ```

### Console Test:

1. Open browser console (F12)
2. Ga naar de Network tab
3. Filter op "search-console"
4. Klik op "Google Account Koppelen"
5. Kijk naar de requests en responses
6. Zoek naar errors

## Support Informatie

Als je nog steeds problemen hebt na het volgen van deze stappen:

**Wat te delen:**
1. Screenshot van de Redirect URIs sectie in Google Cloud Console
2. Output van: https://writgoai.nl/api/client/search-console/diagnostics
3. Screenshot van eventuele error messages
4. Browser console logs (F12 → Console tab)

**Verwachte Werkende Configuratie:**
- Client ID: `977335778451-q16199a0uerkcp9rtu6agfkbvfssc3og.apps.googleusercontent.com`
- Redirect URI: `https://writgoai.nl/api/client/search-console/oauth`
- Scopes: `https://www.googleapis.com/auth/webmasters.readonly`

---

**Laatst bijgewerkt:** 19 november 2025
