
# Google Search Console OAuth Setup Instructies

## Probleem
Het Google account wordt niet gekoppeld na het klikken op "Google Account Koppelen".

## Oplossing

### Stap 1: Configureer de Redirect URI in Google Cloud Console

1. **Ga naar Google Cloud Console**
   - Open: https://console.cloud.google.com/apis/credentials
   - Log in met je Google account

2. **Selecteer het juiste project**
   - Zorg ervoor dat je het project selecteert waarin je OAuth credentials zijn aangemaakt

3. **Klik op je OAuth 2.0 Client ID**
   - Zoek naar het OAuth 2.0 Client ID in de lijst
   - Klik erop om de instellingen te openen

4. **Voeg de Redirect URI toe**
   - Scroll naar "Geautoriseerde doorverwijzings-URI's"
   - Klik op "URI TOEVOEGEN"
   - Voeg EXACT deze URI toe: `https://writgoai.nl/api/client/search-console/oauth`
   - Klik op "OPSLAAN"

5. **Controleer de OAuth Consent Screen**
   - Ga naar "OAuth-toestemmingsscherm" in het menu
   - Controleer of de app is ingesteld voor "Testen" of "Gepubliceerd"
   - Als de app in test mode staat, voeg je eigen email adres toe aan "Testgebruikers"

### Stap 2: Verifieer de configuratie

1. **Wacht 1-2 minuten** na het opslaan van de redirect URI (Google heeft even nodig om de wijzigingen te propageren)

2. **Test de OAuth flow**
   - Ga naar WritGo Project Settings
   - Klik op "Google Account Koppelen"
   - Je wordt nu naar Google gestuurd
   - Geef toestemming aan WritGo
   - Je wordt teruggestuurd naar WritGo

3. **Controleer de status**
   - Na terugkeren zou je een groen vinkje moeten zien bij "OAuth Status: Gekoppeld"
   - Je zou nu je GSC sites moeten zien in de dropdown

## Debugging

### Diagnostics Endpoint

Je kunt de OAuth status controleren via:
```
https://writgoai.nl/api/client/search-console/diagnostics
```

Dit endpoint toont:
- Of de environment variables correct zijn ingesteld
- Of er OAuth tokens aanwezig zijn
- De verwachte redirect URI

### Console Logs

Als het nog steeds niet werkt, check de console logs:

1. **In de browser console** (F12 → Console tab):
   - Kijk of er error messages zijn na het klikken op "Google Account Koppelen"

2. **In de server logs** (als je toegang hebt):
   - Zoek naar regels die beginnen met:
     - `🔐 Processing OAuth callback...`
     - `🔑 Exchanging code for tokens...`
     - `✅ OAuth tokens saved successfully`
     - `❌ Token exchange failed:`

### Veelvoorkomende problemen

1. **"redirect_uri_mismatch" error**
   - De redirect URI in Google Cloud Console komt niet overeen
   - Controleer of je EXACT `https://writgoai.nl/api/client/search-console/oauth` hebt gebruikt
   - Let op: geen trailing slash `/` aan het einde!

2. **"access_denied" error**
   - Je hebt de toestemming geweigerd
   - Probeer opnieuw en klik op "Toestaan"

3. **"invalid_grant" error**
   - De authorization code is verlopen
   - Probeer opnieuw (codes zijn maar 10 minuten geldig)

4. **Geen error maar ook geen tokens**
   - Check of de OAuth consent screen correct is geconfigureerd
   - Check of je email adres is toegevoegd aan "Testgebruikers" (als de app in test mode staat)

## Support

Als je nog steeds problemen hebt:
1. Check de diagnostics endpoint
2. Stuur screenshots van:
   - De Google Cloud Console OAuth Client configuratie
   - De diagnostics endpoint output
   - Eventuele error messages in de browser console

---

**Laatst bijgewerkt**: 19 november 2025
