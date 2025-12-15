# Google OAuth 2.0 Setup voor WritgoAI

## ⚠️ BELANGRIJK: Correcte URLs

De screenshot die je stuurde heeft **VERKEERDE URLs**. Gebruik onderstaande configuratie!

---

## 📋 Stap-voor-Stap Instructies

### Stap 1: Google Cloud Console

1. Ga naar: https://console.cloud.google.com/apis/credentials
2. Klik op je OAuth 2.0 Client ID: **"Writgo Media"**

### Stap 2: Vul Deze Exact In

#### Name:
```
Writgo Media
```

#### Authorized JavaScript origins:
```
https://writgo.nl
```

#### ✅ Authorized redirect URIs (CORRECTE URL!):
```
https://writgo.nl/api/integrations/google-search-console/callback
```

**❌ NIET:** `https://writgo.nl/api/client/search-console/oauth`  
**✅ WEL:** `https://writgo.nl/api/integrations/google-search-console/callback`

---

### Stap 3: Enable Search Console API

1. Ga naar: https://console.cloud.google.com/apis/library
2. Zoek naar: "Google Search Console API"
3. Klik op "ENABLE" (als nog niet enabled)

---

### Stap 4: Kopieer Credentials

1. Klik op "Save" in de OAuth client configuratie
2. Kopieer de **Client ID**
3. Kopieer de **Client Secret**

---

### Stap 5: Render.com Environment Variables

1. Ga naar: https://dashboard.render.com
2. Selecteer je **WritgoAI** service
3. Ga naar **"Environment"** tab
4. Voeg deze variabelen toe (of update ze):

```env
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GOOGLE_REDIRECT_URI=https://writgo.nl/api/integrations/google-search-console/callback
```

5. Klik op **"Save Changes"**
6. ⏳ De service wordt automatisch herstart (duurt ~2-3 minuten)

---

### Stap 6: Test de Integratie

1. Wacht tot Render klaar is met deployen
2. Ga naar: https://writgo.nl/settings
3. Scroll naar de sectie **"Google Search Console"**
4. Klik op **"Connect Google Search Console"** knop
5. Je wordt doorgestuurd naar Google
6. ✅ Autoriseer je Google account (kies het account met muzieklesclub.nl)
7. Selecteer de website(s) die je wilt monitoren
8. Je wordt teruggeleid naar de settings pagina met success bericht

---

## ✅ Controle Checklist

- [ ] Google Cloud Console: OAuth client "Writgo Media" bestaat
- [ ] Redirect URI is **exact**: `https://writgo.nl/api/integrations/google-search-console/callback`
- [ ] JavaScript origins is: `https://writgo.nl`
- [ ] Search Console API is enabled
- [ ] Render.com environment variables zijn ingesteld
- [ ] Service is gedeployed en draait
- [ ] Test de connectie via https://writgo.nl/settings

---

## 🐛 Troubleshooting

### Probleem: "redirect_uri_mismatch" error

**Oorzaak:** De redirect URI in Google Cloud Console komt niet overeen met `GOOGLE_REDIRECT_URI`

**Oplossing:**
1. Check Google Cloud Console redirect URIs
2. Check Render.com `GOOGLE_REDIRECT_URI` environment variable
3. Beide moeten **exact** zijn: `https://writgo.nl/api/integrations/google-search-console/callback`

### Probleem: "Access blocked: This app's request is invalid"

**Oorzaak:** Search Console API is niet enabled

**Oplossing:**
1. Ga naar: https://console.cloud.google.com/apis/library
2. Zoek naar "Google Search Console API"
3. Klik op "ENABLE"
4. Wacht 5 minuten en probeer opnieuw

### Probleem: "Client not found" na OAuth

**Oorzaak:** Je bent ingelogd met een email die niet in de database staat

**Oplossing:**
1. Check of je ingelogd bent met `info@writgo.nl`
2. Check of deze email bestaat in de `Client` tabel van de database

### Probleem: Data verschijnt niet op dashboard

**Oorzaak:** Dashboard is nog niet geüpdatet om GSC data te tonen

**Oplossing:**
- Dit wordt gefixed in de volgende update
- Je kunt wel al de connectie maken zodat data wordt opgeslagen

---

## 📊 Wat Wordt Er Opgeslagen?

Na succesvolle connectie worden deze data opgeslagen in de database:

1. **Access Token** (encrypted) → `googleSearchConsoleToken`
2. **Refresh Token** (encrypted) → `googleSearchConsoleRefreshToken`
3. **Connected Sites** → `googleSearchConsoleSites` (JSON array)

Deze data wordt gebruikt om:
- Search analytics op te halen (clicks, impressions, CTR)
- Top queries en pages te tonen
- Performance over tijd te tracken
- Content gaps te identificeren

---

## 🔐 Security Notes

- Tokens worden **encrypted** opgeslagen in de database
- OAuth flow gebruikt **offline access** voor refresh tokens
- De app vraagt alleen **readonly** permissions (+ writable voor site verification)
- Tokens kunnen op elk moment worden ingetrokken via Google Account Settings

---

## 📞 Support

Als je er niet uitkomt, stuur dan:
1. Screenshot van Google Cloud Console OAuth configuratie
2. Screenshot van Render.com environment variables (verberg secrets!)
3. Error message (als er een is)

