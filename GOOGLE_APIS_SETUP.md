# Google APIs Setup Guide

## Overzicht

WritGo gebruikt Google Search Console en Google Analytics 4 voor performance tracking.

## Benodigde Environment Variables

```bash
# Google Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google Analytics 4
GA4_PROPERTY_ID=123456789

# Site URL
NEXT_PUBLIC_SITE_URL=https://writgo.nl
```

## Setup Stappen

### 1. Google Cloud Project Aanmaken

1. Ga naar [Google Cloud Console](https://console.cloud.google.com/)
2. Maak een nieuw project aan (of gebruik bestaand)
3. Noteer het Project ID

### 2. APIs Activeren

Activeer de volgende APIs in je project:

1. **Google Search Console API**
   - Ga naar: APIs & Services → Library
   - Zoek: "Google Search Console API"
   - Klik "Enable"

2. **Google Analytics Data API**
   - Ga naar: APIs & Services → Library
   - Zoek: "Google Analytics Data API"
   - Klik "Enable"

### 3. Service Account Aanmaken

1. Ga naar: IAM & Admin → Service Accounts
2. Klik "Create Service Account"
3. Naam: `writgo-analytics`
4. Role: `Viewer` (of geen role)
5. Klik "Create and Continue"
6. Klik "Done"

### 4. Service Account Key Genereren

1. Klik op de aangemaakte service account
2. Ga naar "Keys" tab
3. Klik "Add Key" → "Create new key"
4. Selecteer "JSON"
5. Download de key file

**Uit de JSON file haal je:**
- `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → `GOOGLE_SERVICE_ACCOUNT_KEY`

### 5. Google Search Console Toegang

1. Ga naar [Google Search Console](https://search.google.com/search-console)
2. Selecteer je property (writgo.nl)
3. Ga naar: Settings → Users and permissions
4. Klik "Add user"
5. Voeg het service account email toe (uit stap 4)
6. Geef "Full" permission
7. Klik "Add"

### 6. Google Analytics 4 Toegang

1. Ga naar [Google Analytics](https://analytics.google.com/)
2. Selecteer je property
3. Ga naar: Admin → Property → Property Access Management
4. Klik "+" (Add users)
5. Voeg het service account email toe
6. Geef "Viewer" role
7. Klik "Add"

**Property ID vinden:**
1. Ga naar: Admin → Property → Property Settings
2. Noteer de "Property ID" (bijv. 123456789)
3. Dit is je `GA4_PROPERTY_ID`

### 7. Environment Variables Instellen

**Lokaal (.env.local):**
```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=writgo-analytics@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
GA4_PROPERTY_ID=123456789
NEXT_PUBLIC_SITE_URL=https://writgo.nl
```

**Render (Production):**
1. Ga naar Render dashboard
2. Selecteer je service
3. Ga naar: Environment
4. Voeg de variables toe (zie boven)
5. **Let op:** Voor `GOOGLE_SERVICE_ACCOUNT_KEY` moet je de hele private key plakken inclusief `\n` voor newlines

### 8. NPM Packages Installeren

```bash
pnpm install googleapis @google-analytics/data
```

## Testen

### Test Search Console API

```bash
curl -X GET "https://writgo.nl/api/analytics/performance?days=28"
```

### Test Analytics Dashboard

Ga naar: `https://writgo.nl/dashboard/analytics`

## Troubleshooting

### "Permission denied" error

**Oplossing:**
- Check of service account toegang heeft tot Search Console
- Check of service account toegang heeft tot GA4
- Wacht 5-10 minuten na het toevoegen van permissions

### "Invalid credentials" error

**Oplossing:**
- Check of `GOOGLE_SERVICE_ACCOUNT_KEY` correct is gekopieerd
- Check of alle `\n` newlines aanwezig zijn
- Test met de JSON file rechtstreeks

### "Property not found" error

**Oplossing:**
- Check of `GA4_PROPERTY_ID` correct is
- Check of het een GA4 property is (niet Universal Analytics)
- Check of service account toegang heeft

### Geen data zichtbaar

**Oplossing:**
- Wacht 24-48 uur na het publiceren van artikelen
- Check of Google Search Console data heeft voor je site
- Check of Google Analytics tracking code actief is

## Cron Jobs

### Automatic Content Refresh

Voeg toe aan `.github/workflows/content-refresh.yml`:

```yaml
name: Content Refresh

on:
  schedule:
    - cron: '0 2 * * 0'  # Every Sunday at 2 AM
  workflow_dispatch:

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Content Refresh
        run: |
          curl -X POST https://writgo.nl/api/cron/content-refresh
```

## Features

### Content Performance Dashboard

- **Top Performing Articles** - Meest succesvolle content
- **Needs Improvement** - Artikelen met ranking opportunity
- **Declining Articles** - Content die refresh nodig heeft
- **Top Keywords** - Best presterende zoekwoorden
- **Traffic Sources** - Waar bezoekers vandaan komen

### Automatic Content Refresh

- Detecteert declining articles
- Detecteert outdated content (>6 maanden)
- Update met recente informatie
- Optimaliseer voor focus keywords
- Voeg "Laatst bijgewerkt" datum toe

## Kosten

**Google APIs zijn GRATIS voor:**
- Search Console API: Unlimited requests
- Analytics Data API: 200,000 requests/day

WritGo gebruikt ~1,000 requests/dag = **€0/maand** 🎉
