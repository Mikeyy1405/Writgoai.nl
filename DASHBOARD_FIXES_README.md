# Dashboard Fixes & Google OAuth Setup

## 📋 Overzicht

Dit document beschrijft de fixes voor:
1. **Google OAuth configuratie** - Correcte redirect URIs
2. **Dashboard "0 actieve websites"** - Debug en oplossing
3. **Google Search Console data op dashboard** - Nieuwe features

---

## 🔧 Wat is Er Gefixed?

### 1. Google OAuth Setup Documentatie

**Probleem:** De screenshot toonde een verkeerde redirect URI: `https://community-assets.home-assistant.io/original/3X/5/a/5a8a173bf61da2ebbfc0e0f63fc2445b4513a164.png`

**Oplossing:** Correcte redirect URI is: `https://writgo.nl/api/integrations/google-search-console/callback`

**Zie:** `GOOGLE_OAUTH_SETUP.md` voor complete stap-voor-stap instructies.

### 2. Dashboard Google Search Console Integratie

**Nieuw:** Dashboard toont nu Google Search Console data als je verbonden bent:
- Totaal clicks en impressions
- Gemiddelde CTR en positie
- Top 5 zoekwoorden (laatste 30 dagen)
- Verbonden website URL

**Als niet verbonden:** Banner met call-to-action om te verbinden.

### 3. Debug Script

**Nieuw:** Script om dashboard data te debuggen en problemen te identificeren.

**Locatie:** `nextjs_space/scripts/debug-dashboard.ts`

---

## 🐛 Debug: "0 Actieve Websites" Probleem

### Waarom staat er "0 actieve websites"?

Er zijn drie mogelijke oorzaken:

#### 1. Geen projecten in database
```sql
-- Check of er projecten zijn
SELECT * FROM "Project" WHERE "clientId" = 'YOUR_CLIENT_ID';
```

**Oplossing:** Maak een nieuw project aan via https://writgo.nl/projects

#### 2. Projecten zijn inactief (`isActive = false`)
```sql
-- Check of projecten actief zijn
SELECT name, "isActive", "websiteUrl" FROM "Project" 
WHERE "clientId" = 'YOUR_CLIENT_ID';
```

**Oplossing:** Activeer projecten:
```sql
UPDATE "Project" 
SET "isActive" = true 
WHERE "clientId" = 'YOUR_CLIENT_ID';
```

#### 3. Verkeerde `clientId`

**Oplossing:** Check dat de email in de database overeenkomt met de inlog:
```sql
SELECT id, email, name FROM "Client" WHERE email = 'info@writgo.nl';
```

---

## 🚀 Hoe Te Debuggen

### Stap 1: Run Debug Script

```bash
cd /home/ubuntu/writgoai_repo/nextjs_space

# Install dependencies (als nog niet gedaan)
npm install

# Run debug script
npx ts-node -r tsconfig-paths/register scripts/debug-dashboard.ts
```

### Stap 2: Bekijk Output

Het script toont:
- ✅ Client informatie
- ✅ Google Search Console status
- ✅ Alle projecten (actief + inactief)
- ✅ Saved content statistieken
- ✅ Dashboard stats samenvatting
- ⚠️  Diagnose van problemen
- 💡 Oplossingen

### Stap 3: Los Problemen Op

Volg de suggesties in de diagnose sectie.

---

## 📊 Dashboard Features

### Huidige Stats Cards

1. **Actieve Projecten** - Aantal actieve WordPress projecten
2. **Content deze maand** - Artikelen gegenereerd deze maand
3. **Gepubliceerd** - Totaal gepubliceerde artikelen
4. **Success Rate** - % gepubliceerd / gegenereerd

### Nieuw: Google Search Console Sectie

#### Als Verbonden:
- **Totaal Clicks** - Clicks laatste 30 dagen
- **Impressies** - Impressions laatste 30 dagen
- **Gemiddelde CTR** - Click-through rate
- **Gemiddelde Positie** - Ranking in Google
- **Top 5 Zoekwoorden** - Met clicks en impressions

#### Als Niet Verbonden:
- Banner met uitleg over voordelen
- "Nu Verbinden" knop → /settings

---

## 🔐 Google OAuth Setup

### Stap-voor-Stap

Zie `GOOGLE_OAUTH_SETUP.md` voor complete instructies.

### Snelle Checklist

- [ ] Google Cloud Console: OAuth client "Writgo Media"
- [ ] Redirect URI: `https://writgo.nl/api/integrations/google-search-console/callback`
- [ ] JavaScript origins: `https://writgo.nl`
- [ ] Search Console API enabled
- [ ] Render.com environment variables:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URI`

### Test Connectie

1. Deploy naar Render (push naar GitHub)
2. Ga naar https://writgo.nl/settings
3. Klik "Verbind met Google Search Console"
4. Autoriseer Google account
5. Selecteer website (muzieklesclub.nl)
6. Check dashboard voor GSC data

---

## 🧪 Lokaal Testen

### Start Development Server

```bash
cd /home/ubuntu/writgoai_repo/nextjs_space
npm run dev
```

### Test Dashboard

1. Ga naar http://localhost:3000
2. Login met `info@writgo.nl`
3. Check "Actieve Projecten" getal
4. Check of GSC sectie verschijnt (als verbonden)

### Test Google OAuth

**⚠️ Let Op:** OAuth werkt alleen in productie (https://writgo.nl) omdat de redirect URI zo is geconfigureerd.

Voor lokaal testen:
1. Voeg toe aan Google OAuth: `http://localhost:3000/api/integrations/google-search-console/callback`
2. Update `.env.local`: `GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google-search-console/callback`

---

## 📁 Bestanden Gewijzigd

### Nieuw
- `GOOGLE_OAUTH_SETUP.md` - OAuth setup instructies
- `DASHBOARD_FIXES_README.md` - Dit document
- `nextjs_space/scripts/debug-dashboard.ts` - Debug script

### Gewijzigd
- `nextjs_space/app/page.tsx` - Enhanced dashboard met GSC data

### Bestaande (geen wijzigingen)
- `nextjs_space/app/settings/page.tsx` - Settings pagina (werkt al goed)
- `nextjs_space/lib/google-search-console.ts` - GSC library (werkt al goed)
- `nextjs_space/app/api/integrations/google-search-console/*` - API routes (werken al goed)

---

## 🚢 Deployment

### Git Workflow

```bash
cd /home/ubuntu/writgoai_repo

# Check status
git status

# Add changes
git add .

# Commit
git commit -m "Fix: Google OAuth setup + Enhanced dashboard met GSC data"

# Push
git push origin main
```

### Render.com Auto-Deploy

- Render detecteert automatisch de push
- Deployment duurt ~2-3 minuten
- Check logs: https://dashboard.render.com

### Post-Deploy Checklist

1. ✅ Wacht tot deployment klaar is
2. ✅ Check https://writgo.nl/
3. ✅ Login met `info@writgo.nl`
4. ✅ Check dashboard stats
5. ✅ Ga naar /settings
6. ✅ Test Google Search Console connectie
7. ✅ Check dashboard voor GSC sectie

---

## 🐛 Troubleshooting

### Dashboard Toont Nog Steeds "0 Actieve Websites"

1. Run debug script (zie boven)
2. Check output voor diagnose
3. Volg suggesties uit script

### Google Search Console Verbinding Mislukt

1. Check `GOOGLE_OAUTH_SETUP.md` voor correcte configuratie
2. Verify redirect URI in Google Cloud Console
3. Verify environment variables in Render
4. Check browser console voor errors

### Dashboard Toont Geen GSC Data

1. Check of je verbonden bent via /settings
2. Check browser console voor API errors
3. Check Render logs: `GET /api/integrations/google-search-console/stats`
4. Verify tokens zijn opgeslagen in database:
   ```sql
   SELECT 
     "googleSearchConsoleToken" IS NOT NULL AS has_token,
     "googleSearchConsoleRefreshToken" IS NOT NULL AS has_refresh_token,
     "googleSearchConsoleSites"
   FROM "Client" 
   WHERE email = 'info@writgo.nl';
   ```

---

## 📞 Support

Als je er niet uitkomt:

1. Run debug script en stuur output
2. Screenshot van dashboard
3. Screenshot van Google Cloud Console OAuth configuratie
4. Screenshot van Render environment variables (verberg secrets!)
5. Error messages uit browser console en Render logs

---

## ✅ Success Criteria

Dashboard is gefixed als:

- ✅ "Actieve Projecten" toont correct aantal (bijv. 1 voor muzieklesclub.nl)
- ✅ Google Search Console sectie verschijnt als verbonden
- ✅ GSC data wordt getoond (clicks, impressions, top queries)
- ✅ "Nu Verbinden" banner verschijnt als niet verbonden
- ✅ OAuth flow werkt zonder errors
- ✅ Na verbinden: redirect naar /settings met success message
- ✅ Dashboard ververst en toont GSC data

---

## 🎯 Next Steps

Na deze fixes:

1. ✅ Test de complete flow
2. ✅ Documenteer eventuele extra bevindingen
3. ✅ Monitor Render logs voor errors
4. ✅ Feedback van gebruiker (muzieklesclub.nl eigenaar)
5. ✅ Eventueel: meerdere websites ondersteunen (site selector)

