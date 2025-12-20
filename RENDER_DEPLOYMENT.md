# 🚀 Render Deployment Guide - WritGo AI

## ✅ Repository Opgeschoond

De volgende cleanup is uitgevoerd:

### Verwijderde Items:
- ✅ **8 deprecated/duplicate cron jobs** verwijderd
- ✅ **96+ test/utility scripts** verplaatst naar `scripts/archive/`
- ✅ Alleen essentiële config files behouden in root

### Behouden Cron Jobs (9 actief):
1. `autopilot-scheduler` - Controleert welke projecten moeten draaien
2. `autopilot-projects` - Genereert content voor projecten
3. `autopilot-runner` - Algemene autopilot runner
4. `auto-regenerate-plan` - Regenereert content plannen
5. `social-media-autopilot` - Social media posts
6. `linkbuilding-auto` - Linkbuilding artikelen
7. `sync-gsc-data` - Google Search Console sync
8. `payment-reminders` - Betalingsherinneringen
9. `publish-scheduled-social-posts` - Publiceert geplande posts

---

## 📋 Stap 1: Database Opzetten

### Optie A: Render PostgreSQL (Aanbevolen)

1. Ga naar [Render Dashboard](https://dashboard.render.com)
2. Klik op "New +" → "PostgreSQL"
3. Configureer:
   - **Name**: `writgoai-db`
   - **Database**: `writgoai`
   - **User**: `writgoai_user`
   - **Region**: Frankfurt (of dichtstbijzijnde)
   - **Plan**: Starter ($7/maand) of Free (beperkt)
4. Klik "Create Database"
5. Kopieer de **Internal Database URL** (begint met `postgresql://`)

### Optie B: Supabase (Gratis tier beschikbaar)

1. Ga naar [Supabase](https://supabase.com)
2. Maak nieuw project aan
3. Kopieer de **Connection String** uit Settings → Database

---

## 📋 Stap 2: Web Service Deployen

### Via Render Dashboard:

1. Ga naar [Render Dashboard](https://dashboard.render.com)
2. Klik "New +" → "Web Service"
3. Connect je GitHub repository: `Mikeyy1405/Writgoai.nl`
4. Configureer:

**Basic Settings:**
- **Name**: `writgoai`
- **Region**: Frankfurt
- **Branch**: `main` (of je hoofdbranch)
- **Root Directory**: (leeg laten)
- **Runtime**: Node
- **Build Command**: 
  ```bash
  yarn install && yarn prisma generate && yarn build
  ```
- **Start Command**: 
  ```bash
  yarn start
  ```

**Advanced Settings:**
- **Node Version**: `18.17.0`
- **Plan**: Starter ($7/maand) of Free (met beperkingen)

---

## 🔐 Stap 3: Environment Variables Instellen

Klik op "Environment" tab en voeg deze variabelen toe:

### Verplicht (Database & Auth):
```env
DATABASE_URL=<jouw-database-url-van-stap-1>
NEXTAUTH_SECRET=<genereer-random-string-32-chars>
NEXTAUTH_URL=https://writgoai.onrender.com
NODE_ENV=production
```

**Tip voor NEXTAUTH_SECRET genereren:**
```bash
openssl rand -base64 32
```

### Verplicht (AI APIs):
```env
AIML_API_KEY=<jouw-aiml-api-key>
PERPLEXITY_API_KEY=<jouw-perplexity-key>
```

**Waar krijg je deze keys:**
- AIML API: https://aimlapi.com (voor Claude/GPT)
- Perplexity: https://www.perplexity.ai/settings/api

### Optioneel (Stripe Betalingen):
```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Optioneel (AWS S3 voor afbeeldingen):
```env
AWS_BUCKET_NAME=jouw-bucket
AWS_ACCESS_KEY_ID=jouw-key
AWS_SECRET_ACCESS_KEY=jouw-secret
AWS_REGION=eu-west-1
AWS_FOLDER_PREFIX=writgo/
```

### Automatisch (Cron beveiliging):
```env
CRON_SECRET=<render-genereert-automatisch>
```

---

## 📋 Stap 4: Deploy Starten

1. Klik "Create Web Service"
2. Render begint automatisch met bouwen
3. Wacht 5-10 minuten voor eerste deploy
4. Check de logs voor errors

**Veelvoorkomende build errors:**
- ❌ `Prisma generate failed` → Check DATABASE_URL
- ❌ `Module not found` → Run `yarn install` opnieuw
- ❌ `Build timeout` → Upgrade naar betaald plan

---

## ⏰ Stap 5: Cron Jobs Configureren

Render ondersteunt **geen** cron jobs in het gratis plan. Je hebt 2 opties:

### Optie A: Upgrade naar Render Cron (Aanbevolen)

1. Upgrade naar **Starter plan** ($7/maand)
2. Ga naar je Web Service → "Cron Jobs" tab
3. Voeg deze jobs toe:

| Job Name | Path | Schedule | Beschrijving |
|----------|------|----------|--------------|
| Autopilot Scheduler | `/api/cron/autopilot-scheduler` | `*/15 * * * *` | Elke 15 min |
| Autopilot Projects | `/api/cron/autopilot-projects` | `0 9 * * *` | Dagelijks 9:00 |
| Social Media | `/api/cron/social-media-autopilot` | `0 10 * * *` | Dagelijks 10:00 |
| Linkbuilding | `/api/cron/linkbuilding-auto` | `0 3 * * *` | Dagelijks 3:00 |
| GSC Sync | `/api/cron/sync-gsc-data` | `0 2 * * *` | Dagelijks 2:00 |
| Autopilot Runner | `/api/cron/autopilot-runner` | `0 * * * *` | Elk uur |

**Headers voor elke cron job:**
```
Authorization: Bearer <jouw-CRON_SECRET>
```

### Optie B: Externe Cron Service (Gratis)

Gebruik [cron-job.org](https://cron-job.org) of [EasyCron](https://www.easycron.com):

1. Maak account aan
2. Voeg jobs toe met deze URLs:
   ```
   https://writgoai.onrender.com/api/cron/autopilot-projects
   ```
3. Voeg header toe:
   ```
   Authorization: Bearer <jouw-CRON_SECRET>
   ```

---

## 📋 Stap 6: Database Migraties Uitvoeren

Na eerste deployment:

1. Ga naar Render Dashboard → je Web Service
2. Klik op "Shell" tab (of gebruik Render CLI)
3. Run:
   ```bash
   yarn prisma migrate deploy
   ```

**Of via Render CLI:**
```bash
render shell writgoai
yarn prisma migrate deploy
```

---

## 📋 Stap 7: WordPress Configureren

1. Log in op je WritGo AI applicatie
2. Ga naar Settings → WordPress
3. Voeg je WordPress site toe:
   - **URL**: `https://jouwwebsite.nl`
   - **Username**: je WordPress admin username
   - **Application Password**: [Hoe maak je dit aan?](#wordpress-application-password)

### WordPress Application Password Aanmaken:

1. Log in op WordPress admin
2. Ga naar **Users → Profile**
3. Scroll naar "Application Passwords"
4. Vul naam in: `WritGo AI`
5. Klik "Add New Application Password"
6. **Kopieer de gegenereerde password** (bijv. `xxxx xxxx xxxx xxxx`)
7. Plak in WritGo AI (zonder spaties: `xxxxxxxxxxxxxxxx`)

---

## 🧪 Stap 8: Testen

### Test 1: Applicatie Bereikbaar
```bash
curl https://writgoai.onrender.com
```

### Test 2: Database Connectie
```bash
curl https://writgoai.onrender.com/api/health
```

### Test 3: WordPress Connectie
1. Log in op WritGo AI
2. Ga naar Projects
3. Klik "Test Connection"

### Test 4: Cron Job (handmatig)
```bash
curl -X POST https://writgoai.onrender.com/api/cron/autopilot-projects \
  -H "Authorization: Bearer <jouw-CRON_SECRET>"
```

---

## 🔧 Troubleshooting

### Build faalt met "Out of Memory"
**Oplossing:** Upgrade naar betaald plan of optimaliseer build:
```json
// next.config.js
module.exports = {
  experimental: {
    workerThreads: false,
    cpus: 1
  }
}
```

### "Prisma Client not generated"
**Oplossing:**
```bash
# In Render Shell
yarn prisma generate
```

### Cron jobs draaien niet
**Oplossing:**
1. Check CRON_SECRET in environment variables
2. Verify Authorization header in cron job config
3. Check logs: Render Dashboard → Logs

### WordPress publicatie faalt
**Oplossing:**
1. Check WordPress REST API: `https://jouwsite.nl/wp-json/`
2. Verify Application Password (niet je normale password!)
3. Check WordPress user heeft "Editor" of "Administrator" rol

### Database connectie timeout
**Oplossing:**
1. Check DATABASE_URL is correct
2. Verify database is in dezelfde regio als web service
3. Check database is niet suspended (free tier)

---

## 📊 Monitoring & Logs

### Logs Bekijken:
1. Ga naar Render Dashboard
2. Selecteer je Web Service
3. Klik "Logs" tab
4. Filter op errors: `level:error`

### Performance Monitoring:
- **Metrics**: Render Dashboard → Metrics tab
- **Alerts**: Stel email alerts in voor downtime

### Database Monitoring:
- **Connections**: Check active connections in database dashboard
- **Size**: Monitor database groei (free tier: 1GB limit)

---

## 🚀 Post-Deployment Checklist

- [ ] Applicatie is bereikbaar via HTTPS
- [ ] Database migraties zijn uitgevoerd
- [ ] Environment variables zijn ingesteld
- [ ] WordPress connectie werkt
- [ ] Cron jobs zijn geconfigureerd (indien betaald plan)
- [ ] Test content generatie werkt
- [ ] Stripe webhook geconfigureerd (indien gebruikt)
- [ ] Custom domain toegevoegd (optioneel)
- [ ] SSL certificaat actief
- [ ] Error monitoring ingesteld

---

## 🎯 Volgende Stappen

1. **Custom Domain Toevoegen:**
   - Render Dashboard → Settings → Custom Domain
   - Voeg `writgoai.nl` toe
   - Update DNS records bij je domain provider

2. **SSL Certificaat:**
   - Render genereert automatisch Let's Encrypt certificaat
   - Wacht 5-10 minuten na domain toevoegen

3. **Monitoring Instellen:**
   - Sentry voor error tracking
   - LogRocket voor session replay
   - Uptime monitoring (UptimeRobot)

4. **Backups Instellen:**
   - Database backups: Render doet dit automatisch (betaald plan)
   - Code backups: GitHub is je backup

---

## 💰 Kosten Overzicht

| Service | Plan | Prijs/maand |
|---------|------|-------------|
| Render Web Service | Starter | $7 |
| Render PostgreSQL | Starter | $7 |
| **Totaal** | | **$14** |

**Gratis alternatief:**
- Render Web Service: Free (met beperkingen)
- Supabase Database: Free (1GB limit)
- Externe cron service: Free
- **Totaal: $0** (met beperkingen)

---

## 📞 Support

- **Render Docs**: https://render.com/docs
- **WritGo AI Issues**: https://github.com/Mikeyy1405/Writgoai.nl/issues
- **Discord Community**: (voeg link toe indien beschikbaar)

---

## ✅ Deployment Succesvol!

Je WordPress AI SEO Agent draait nu op Render! 🎉

**Volgende stap:** Configureer je eerste project en activeer AutoPilot.
