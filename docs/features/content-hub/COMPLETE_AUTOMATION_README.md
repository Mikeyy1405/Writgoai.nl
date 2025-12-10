
# 🚀 COMPLETE AUTOMATION SYSTEEM

## Overzicht

Dit is de **complete automatiseringsoplossing** voor WritgoAI die ALLES automatiseert:
- ✅ Website artikelen (SEO-geoptimaliseerd)
- ✅ Instagram/Facebook Reels
- ✅ TikTok Reels  
- ✅ YouTube Shorts

Klanten hoeven alleen hun website URL in te voeren en op "START AUTOMATION" te klikken. De rest gaat automatisch.

---

## 🎯 Wat Gebeurt Er?

### Voor Klanten:

1. **Log in** op het client portal
2. Ga naar **"Complete Automation"** in het menu
3. Vul je **website URL** in
4. Stel **content frequentie** in (hoeveel artikelen/reels per week)
5. Klik op **"START AUTOMATION"**

**Het systeem doet nu automatisch:**

✓ **Website Scan**: AI analyseert je website, niche, doelgroep, concurrenten
✓ **90-Dagen Plan**: Genereert complete content kalender  
✓ **Daily Generation**: Elke dag nieuwe content (artikelen + scripts)
✓ **Auto Publicatie**: Direct live naar WordPress en social media

---

## 🏗️ Technische Architectuur

### Nieuwe Bestanden

1. **lib/master-automation.ts**
   - `startCompleteAutomation()` - Hoofdfunctie die alles opzet
   - `generateTodaysContent()` - Dagelijkse content generatie
   - Artikel, reel, en video generatie functies

2. **app/api/automation/start/route.ts**
   - POST: Start automation voor ingelogde klant
   - GET: Haal automation status op

3. **app/api/cron/daily-content-generation/route.ts**
   - CRON endpoint voor dagelijkse content generatie
   - Beveiligd met CRON_SECRET

4. **app/client-portal/automation/page.tsx**
   - Client UI voor automation setup
   - Real-time status monitoring
   - Configuratie van content frequentie

5. **app/api/client-portal/ai-settings/route.ts**
   - Update client AI profile settings
   - Website URL opslag

---

## 📊 Database Models

Gebruikt bestaande models:
- `MasterContentPlan` - 90-dagen content strategie
- `AutoContentStrategy` - Automation instellingen
- `ClientAIProfile` - AI voorkeuren en website scan resultaten
- `PublishedArticle` - Gepubliceerde artikelen tracking
- `GeneratedVideo` - Video scripts en metadata
- `WordPressConfig` - WordPress publicatie credentials

---

## ⚙️ Setup & Configuratie

### 1. Environment Variables

Zorg dat deze variabelen in `.env` staan:

```bash
# AI API
ABACUSAI_API_KEY=your_key_here

# CRON Security
CRON_SECRET=writgo-cron-secret-2025

# Database
DATABASE_URL=your_postgres_url

# WordPress (optioneel, per klant)
# Klanten configureren dit zelf in het portal
```

### 2. CRON Job Setup (Productie)

De automation werkt via een dagelijkse CRON job die de API aanroept.

**Optie A: cron-job.org (Gemakkelijkst)**

1. Ga naar https://cron-job.org
2. Maak een gratis account
3. Create new cron job:
   - **URL**: `https://WritgoAI.nl/api/cron/daily-content-generation`
   - **Schedule**: Every day at 09:00
   - **HTTP method**: GET
   - **Headers**: 
     ```
     Authorization: Bearer writgo-cron-secret-2025
     ```
4. Save & Enable

**Optie B: Server CRON (Linux)**

```bash
# Edit crontab
crontab -e

# Voeg toe (elke dag om 9:00):
0 9 * * * curl -H "Authorization: Bearer writgo-cron-secret-2025" https://WritgoAI.nl/api/cron/daily-content-generation
```

**Optie C: GitHub Actions (Gratis)**

Maak `.github/workflows/daily-content.yml`:

```yaml
name: Daily Content Generation
on:
  schedule:
    - cron: '0 9 * * *'  # Every day at 9 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Content Generation
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://WritgoAI.nl/api/cron/daily-content-generation
```

---

## 🔄 Workflow Diagram

```
1. Klant vult website URL in
         ↓
2. AI scant website (30 sec)
   - Niche analyse
   - Doelgroep identificatie
   - Concurrent research
   - Keyword extractie
         ↓
3. Master Content Plan genereren (60 sec)
   - 90 dagen content kalender
   - Artikelen (2/week × 13 weken = 26)
   - Instagram Reels (3/week × 13 = 39)
   - TikTok Reels (3/week × 13 = 39)
   - YouTube Shorts (3/week × 13 = 39)
         ↓
4. Plan opslaan in database
   - MasterContentPlan record
   - AutoContentStrategy record
   - Autopilot activeren
         ↓
5. DAGELIJKSE CRON JOB (9:00)
   - Check welke content vandaag gepland staat
   - Genereer artikelen met AI
   - Genereer video scripts
   - Publiceer naar WordPress
   - Sla op in database
         ↓
6. ✅ CONTENT LIVE
```

---

## 📝 Content Generatie Details

### Artikelen

- **Lengte**: 1500-3000 woorden (configureerbaar)
- **Format**: HTML met headers, paragrafen, lijsten
- **SEO**: Title, meta description, keywords
- **Publicatie**: Direct naar WordPress via REST API
- **Tracking**: URL, post ID, views in database

### Instagram/Facebook Reels

- **Lengte**: 30-45 seconden
- **Format**: Script met hook, content, CTA
- **Output**: Script opgeslagen, klaar voor video generatie
- **Hashtags**: Automatisch gegenereerd per topic

### TikTok Reels

- **Lengte**: 15-60 seconden
- **Format**: Viral-optimized script
- **Output**: Script + hashtags
- **Stijl**: Energiek, trending, engaging

### YouTube Shorts

- **Lengte**: 50-60 seconden
- **Format**: Informatief script
- **Output**: Script met keyword-optimized title
- **Stijl**: Professioneel maar toegankelijk

---

## 🧪 Testen

### Handmatig Testen (Lokaal)

```bash
# 1. Start dev server
cd nextjs_space
yarn dev

# 2. Login als test klant
# Email: test@client.com
# Password: (zie database)

# 3. Ga naar /client-portal/automation

# 4. Vul website URL in (bijv. https://example.com)

# 5. Klik "Start Automation"
# Wacht 2-3 minuten voor complete setup
```

### API Testen

```bash
# Test automation status
curl http://localhost:3000/api/automation/start \
  -H "Cookie: your-session-cookie"

# Test CRON endpoint (handmatig)
curl http://localhost:3000/api/cron/daily-content-generation \
  -H "Authorization: Bearer writgo-cron-secret-2025"
```

---

## 🐛 Troubleshooting

### Automation start faalt

**Symptoom**: Error bij het starten van automation

**Oplossingen**:
1. Check of `ABACUSAI_API_KEY` in .env staat
2. Verificeer dat klant een AI profiel heeft
3. Check console logs voor specifieke error

### Website scan faalt

**Symptoom**: "Website scan failed" error

**Oplossingen**:
1. Verificeer dat website URL geldig is
2. Check of website bereikbaar is (niet geblokkeerd)
3. Probeer een andere website eerst

### Content wordt niet gegenereerd

**Symptoom**: Geen nieuwe content na CRON job

**Oplossingen**:
1. Check of CRON job daadwerkelijk draait
2. Verificeer CRON_SECRET in environment
3. Check database: is MasterContentPlan status = 'READY'?
4. Kijk naar scheduled dates in masterPlan.seoStrategy JSON

### WordPress publicatie faalt

**Symptoom**: Artikelen worden gegenereerd maar niet gepubliceerd

**Oplossingen**:
1. Klant moet WordPress configureren in portal
2. Verificeer Application Password in WordPress
3. Check WordPressConfig.verified = true in database

---

## 📈 Monitoring

### Database Queries

```sql
-- Check automation status voor alle klanten
SELECT 
  c.name,
  c.email,
  p.autopilotEnabled,
  s.isEnabled as strategyEnabled,
  m.status as planStatus,
  m.totalArticles
FROM "Client" c
LEFT JOIN "ClientAIProfile" p ON p."clientId" = c.id
LEFT JOIN "AutoContentStrategy" s ON s."clientId" = c.id
LEFT JOIN "MasterContentPlan" m ON m."clientId" = c.id
WHERE c."isActive" = true;

-- Check gegenereerde content vandaag
SELECT 
  c.name,
  pa.title,
  pa."publishStatus",
  pa."createdAt"
FROM "PublishedArticle" pa
JOIN "Client" c ON c.id = pa."clientId"
WHERE DATE(pa."createdAt") = CURRENT_DATE
ORDER BY pa."createdAt" DESC;

-- Check scheduled content voor vandaag
SELECT 
  c.name,
  m."seoStrategy"::json->'articles' as articles
FROM "MasterContentPlan" m
JOIN "Client" c ON c.id = m."clientId"
WHERE m.status = 'READY';
```

### Logs

```bash
# Server logs
tail -f logs/automation.log

# CRON job logs
grep "CRON" logs/app.log

# Errors
grep "ERROR" logs/app.log | grep automation
```

---

## 🚀 Productie Checklist

Voordat je automation in productie zet:

- [ ] ABACUSAI_API_KEY is geconfigureerd
- [ ] CRON_SECRET is ingesteld (unieke waarde!)
- [ ] Database schema is up-to-date (yarn prisma migrate deploy)
- [ ] CRON job is geconfigureerd (cron-job.org of alternatief)
- [ ] Test met 1 klant eerst
- [ ] Monitor eerste week dagelijks
- [ ] WordPress credentials van test klant werken
- [ ] Backup van database is actief

---

## 💡 Best Practices

1. **Start Klein**: Begin met 1-2 artikelen/week voor nieuwe klanten
2. **Test Eerst**: Gebruik DRAFT mode totdat content kwaliteit goed is
3. **Monitor Actief**: Check eerste week dagelijks de gegenereerde content
4. **Optimize Profiles**: Hoe beter het AI profiel, hoe beter de content
5. **Backup Alles**: Database backups voor elke major change

---

## 🎓 Voor Ontwikkelaars

### Code Structure

```
lib/
  master-automation.ts          # Kern automation logic
  website-scanner.ts            # Website analyse met AI
  master-content-planner.ts     # 90-dagen planning
  article-generator.ts          # Artikel generatie
  wordpress-publisher.ts        # WordPress integratie

app/api/
  automation/start/            # Start automation endpoint
  cron/daily-content-generation/ # Daily CRON job
  client-portal/ai-settings/   # Client settings API

app/client-portal/
  automation/                  # Client UI voor automation
```

### Extending

**Nieuwe content types toevoegen:**

1. Update `master-content-planner.ts` met nieuw type
2. Voeg generatie functie toe in `master-automation.ts`
3. Update client UI in `automation/page.tsx`
4. Test thoroughly

**Nieuwe platforms:**

1. Maak nieuwe credentials model (bijv. `LinkedInCredentials`)
2. Voeg publishing functie toe
3. Integreer in `generateTodaysContent()`

---

## 📞 Support

Voor vragen of problemen:
- Check de logs eerst
- Review deze README
- Test met handmatige API calls
- Contact: tech@WritgoAI.nl

---

**Status**: ✅ PRODUCTION READY

**Versie**: 1.0

**Laatste Update**: Oktober 2025

