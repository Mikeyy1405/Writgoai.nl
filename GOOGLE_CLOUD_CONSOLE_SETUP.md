
# Google Cloud Console Setup voor GSC Integratie

## ⚠️ KRITIEK - Volg deze stappen EXACT

De Google Search Console integratie werkt niet totdat je de redirect URI hebt geconfigureerd in Google Cloud Console.

## Wat is het probleem?

Je OAuth credentials zijn wel geconfigureerd (Client ID en Secret), maar **de redirect URI ontbreekt**. Zonder deze URI kan Google je niet terugsturen naar WritGoAI na authenticatie.

## Stap-voor-Stap Oplossing

### Stap 1: Open Google Cloud Console

1. Ga naar: **https://console.cloud.google.com/apis/credentials**
2. Log in met je Google account (gebruik het account waarmee je de OAuth credentials hebt aangemaakt)

### Stap 2: Selecteer het juiste project

- Zoek naar het project waar je OAuth credentials in staan
- De Client ID die je gebruikt is: `977335778451-q16199a0uerkcp9rtu6agfkbvfssc3og.apps.googleusercontent.com`

### Stap 3: Bewerk de OAuth 2.0 Client

1. Klik op de **potlood icon** (✏️) naast je OAuth 2.0 Client ID
2. Of klik op de **naam** van de OAuth client om de details te openen

### Stap 4: Voeg de Redirect URI toe

1. Scroll naar de sectie **"Geautoriseerde doorverwijzings-URI's"** (Authorized redirect URIs)
2. Klik op **"URI TOEVOEGEN"** of **"ADD URI"**
3. Plak EXACT deze URI (let op hoofdletters/kleine letters):

```
https://writgoai.nl/api/client/search-console/oauth
```

⚠️ **BELANGRIJK:**
- Geen spatie voor of na de URI
- Geen trailing slash `/` aan het einde
- Gebruik `writgoai.nl` (niet `writgo.nl`)
- Gebruik `https://` (niet `http://`)
- Het pad is `/api/client/search-console/oauth` (exact deze spelling)

4. Klik op **"OPSLAAN"** of **"SAVE"**

### Stap 5: OAuth Consent Screen Configureren

1. Ga naar **"OAuth-toestemmingsscherm"** of **"OAuth consent screen"** in het linkermenu
2. Controleer of de app is ingesteld op:
   - **Status**: "Testen" (Testing) of "Gepubliceerd" (Published)
   - **Scopes**: Minimaal `https://www.googleapis.com/auth/webmasters.readonly`

3. Als de app in **"Testen"** mode staat:
   - Scroll naar **"Testgebruikers"** of **"Test users"**
   - Klik op **"TESTGEBRUIKERS TOEVOEGEN"** of **"ADD USERS"**
   - Voeg je email adres toe: `info@writgo.nl` (of het account waarmee je wilt inloggen)
   - Klik op **"OPSLAAN"**

### Stap 6: Wacht op Propagatie

- **WACHT 1-2 MINUTEN** na het opslaan
- Google heeft tijd nodig om de wijzigingen door te voeren
- Probeer NIET direct na het opslaan - dit zal falen!

### Stap 7: Test de OAuth Flow

1. Ga naar: **https://writgoai.nl/client-portal/projects/[je-project-id]**
2. Scroll naar de **"Google Search Console"** sectie
3. Klik op **"Google Account Koppelen"**
4. Je wordt doorgestuurd naar Google
5. **Selecteer je account** (info@writgo.nl)
6. **Geef toestemming** door op "Toestaan" te klikken
7. Je wordt teruggestuurd naar WritGoAI

### Stap 8: Verifieer de Koppeling

Na terugkeren naar WritGoAI:

✅ **OAuth Status** zou **"Gekoppeld"** moeten zijn (groen vinkje)
✅ Je zou een **dropdown** moeten zien met je GSC sites
✅ Je kunt een **site selecteren** uit de dropdown
✅ Je kunt op **"Opslaan"** klikken om de configuratie op te slaan

## Verificatie Checklist

Voordat je de OAuth flow probeert:

- [ ] Redirect URI is exact `https://writgoai.nl/api/client/search-console/oauth`
- [ ] Geen extra spaties of trailing slash in de URI
- [ ] OAuth Consent Screen is geconfigureerd
- [ ] Email adres is toegevoegd aan Testgebruikers (bij test mode)
- [ ] Je hebt 1-2 minuten gewacht na het opslaan
- [ ] Browser cache is geleegd (optioneel maar helpt)

## Diagnostics

Test de configuratie via dit endpoint:
```
https://writgoai.nl/api/client/search-console/diagnostics
```

**Verwachte output NA succesvolle koppeling:**
```json
{
  "environment": {
    "hasClientId": true,
    "hasClientSecret": true,
    "redirectUri": "https://writgoai.nl/api/client/search-console/oauth"
  },
  "authFile": {
    "status": "found",
    "hasAccessToken": true,    ← Deze moet TRUE zijn
    "hasRefreshToken": true,   ← Deze moet TRUE zijn
    "tokenDetails": {
      "expiresAt": "2024-11-20T10:00:00Z"
    }
  },
  "instructions": "OAuth is succesvol gekoppeld!"
}
```

## Veelvoorkomende Errors

### Error 400: redirect_uri_mismatch

**Oorzaak:** De redirect URI in Google Cloud Console komt niet EXACT overeen

**Oplossing:**
1. Check de URI karakter-voor-karakter in Google Cloud Console
2. Zorg dat er geen spaties voor/na staan
3. Controleer de hoofdletters/kleine letters
4. Verwijder eventuele trailing slash
5. Sla op en wacht 1-2 minuten

### access_denied

**Oorzaak:** Je hebt de toestemming geweigerd tijdens de OAuth flow

**Oplossing:**
- Probeer opnieuw en klik op "Toestaan" in plaats van "Annuleren"

### invalid_grant

**Oorzaak:** De authorization code is verlopen (codes zijn 10 minuten geldig)

**Oplossing:**
- Start de hele OAuth flow opnieuw vanaf het begin

### Geen error maar ook geen tokens

**Oorzaak:** OAuth consent screen configuratie of testgebruikers lijst

**Oplossing:**
1. Check of je email is toegevoegd aan Testgebruikers
2. Controleer of de app niet is blocked
3. Check of de scopes correct zijn ingesteld
4. Kijk in de browser console (F12) voor errors

## Browser Console Debugging

Open de browser console (F12) en zoek naar:

**Tijdens OAuth flow:**
- Errors in de Console tab
- Network tab → Filter op "oauth" of "search-console"
- Kijk naar de request/response details

**Logs om naar te zoeken:**
- `🔐 Processing OAuth callback...`
- `🔑 Exchanging code for tokens...`
- `✅ OAuth tokens saved successfully`
- `❌ Token exchange failed:`

## Support Informatie

Als het nog steeds niet werkt na deze stappen:

**Deel deze informatie:**
1. Screenshot van de "Geautoriseerde doorverwijzings-URI's" sectie in Google Cloud Console
2. Screenshot van de OAuth Consent Screen instellingen
3. Output van: https://i.ytimg.com/vi/KkvI0X-w6dE/maxresdefault.jpg
4. Screenshots van eventuele error messages tijdens de OAuth flow
5. Browser console logs (F12 → Console tab)

**Let op:** Verberg gevoelige informatie zoals Client Secret voor je screenshots deelt!

---

**Gemaakt op:** 19 november 2025
**Voor project:** WritGoAI.nl GSC Integratie
