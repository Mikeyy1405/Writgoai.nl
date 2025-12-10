# WritGo Deployment op Render

## 🔧 Fixes Toegepast

De volgende problemen zijn opgelost:

1. ✅ **Package-lock.json verwijderd** - Conflict met Yarn opgelost
2. ✅ **render.yaml toegevoegd** - Juiste build configuratie
3. ✅ **.gitignore bijgewerkt** - package-lock.json uitgesloten

## 📋 Deployment Stappen

### Stap 1: Push naar GitHub

De wijzigingen zijn lokaal gecommit. Push ze naar GitHub:

```bash
cd /path/to/writgo_planning_app
git push origin github-export
```

Of merge de `github-export` branch naar `main`:

```bash
git checkout main
git merge github-export
git push origin main
```

### Stap 2: Render Configuratie

Ga naar [Render Dashboard](https://dashboard.render.com) en:

#### Optie A: Gebruik render.yaml (Aanbevolen)

1. Klik op **"New"** → **"Blueprint"**
2. Selecteer je GitHub repository: `Mikeyy1405/Writgoai.nl`
3. Render detecteert automatisch de `render.yaml`
4. Klik op **"Apply"**

#### Optie B: Handmatige Web Service

1. Klik op **"New"** → **"Web Service"**
2. Verbind je GitHub repository: `Mikeyy1405/Writgoai.nl`
3. Configureer als volgt:

**Build & Deploy Settings:**
```
Name:                writgoai
Region:              Frankfurt (EU)
Branch:              main (of github-export)
Root Directory:      nextjs_space
Runtime:             Node
Build Command:       yarn install && yarn prisma generate && yarn build
Start Command:       yarn start
Node Version:        22.16.0
```

### Stap 3: Environment Variables

Voeg in Render Dashboard alle environment variables toe (Settings → Environment):

```bash
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=https://jouw-app.onrender.com
NEXTAUTH_SECRET=...

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3
AWS_BUCKET_NAME=...
AWS_FOLDER_PREFIX=...

# Cron
CRON_SECRET=...

# API Keys (optioneel, als je deze gebruikt)
AIML_API_KEY=...
BOL_COM_CLIENT_ID=...
BOL_COM_CLIENT_SECRET=...
```

**⚠️ Belangrijk:**
- Gebruik je **productie database URL** (niet localhost)
- `NEXTAUTH_URL` moet je Render URL zijn (bijv. `https://writgoai.onrender.com`)
- Voor Stripe webhook: configureer deze in Stripe Dashboard naar `https://jouw-app.onrender.com/api/webhooks/stripe`

### Stap 4: Database Setup

Als je een nieuwe database gebruikt:

```bash
# In Render Shell of lokaal met productie DATABASE_URL
npx prisma migrate deploy
npx prisma db seed
```

### Stap 5: Custom Domain (Optioneel)

Voor `writgoai.nl`:

1. Ga naar je web service → **Settings** → **Custom Domains**
2. Voeg toe: `writgoai.nl` en `www.writgoai.nl`
3. Configureer bij je domain registrar:

```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     writgoai.onrender.com
```

## 🐛 Troubleshooting

### Build Fails: "next: not found"

**Oorzaak:** Dependencies niet correct geïnstalleerd

**Oplossing:**
- Zorg dat `Root Directory` is ingesteld op `nextjs_space`
- Check dat build command `yarn install` bevat
- Verifieer dat `package.json` bestaat in `nextjs_space/`

### Database Connection Error

**Oorzaak:** Verkeerde `DATABASE_URL` of database niet toegankelijk

**Oplossing:**
- Check dat `DATABASE_URL` correct is in Environment Variables
- Als je Render Postgres gebruikt, gebruik de **Internal Database URL**
- Verifieer dat database migrations zijn uitgevoerd

### Prisma Client Error

**Oorzaak:** Prisma client niet gegenereerd

**Oplossing:**
- Zorg dat build command `yarn prisma generate` bevat
- Check of `@prisma/client` en `prisma` in `package.json` staan

### Stripe Webhook Failures

**Oorzaak:** Webhook secret niet correct of URL onjuist

**Oplossing:**
1. Ga naar [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Voeg endpoint toe: `https://jouw-app.onrender.com/api/webhooks/stripe`
3. Selecteer events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Kopieer **Signing Secret** en voeg toe als `STRIPE_WEBHOOK_SECRET`

## 📊 Deployment Monitoring

### Logs Bekijken

```bash
# Real-time logs in Render Dashboard
→ Je service → Logs tab
```

### Health Check

Render voert automatisch health checks uit op:
- Path: `/` (homepage)
- Interval: 30 seconden
- Timeout: 10 seconden

### Metrics

Bekijk in Render Dashboard:
- CPU Usage
- Memory Usage
- Request Rate
- Response Time

## 🚀 Production Checklist

Voordat je live gaat:

- [ ] Alle environment variables zijn ingesteld
- [ ] Database migrations zijn uitgevoerd
- [ ] Stripe webhooks zijn geconfigureerd
- [ ] Custom domain is gekoppeld (indien van toepassing)
- [ ] SSL certificaat is actief (automatisch via Render)
- [ ] Test alle belangrijke flows:
  - [ ] Inloggen/Registreren
  - [ ] Content genereren
  - [ ] Facturen betalen (test mode)
  - [ ] Admin dashboard
  - [ ] Client portal

## 💡 Tips

1. **Free Tier Beperkingen:**
   - Service slaapt na 15 minuten inactiviteit
   - Eerste request kan 30+ seconden duren (cold start)
   - Upgrade naar Starter ($7/maand) voor always-on

2. **Auto-Deploy:**
   - Render deploy automatisch bij elke push naar `main`
   - Disable dit in Settings → Build & Deploy als je handmatige controle wilt

3. **Preview Environments:**
   - Maak preview deploys voor pull requests
   - Handig voor feature testing

4. **Backup Strategy:**
   - Render maakt automatisch database backups (Postgres)
   - Exporteer regelmatig eigen backups

## 📞 Support

Probleem niet opgelost?

- 📧 Render Support: support@render.com
- 📚 [Render Docs](https://render.com/docs)
- 💬 [Render Community](https://community.render.com)

---

**Deployment Status:** ✅ Configuratie voltooid, klaar voor GitHub push en Render deployment
