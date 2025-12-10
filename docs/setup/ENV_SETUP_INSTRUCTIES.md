# 🔐 WritGo Environment Variables Setup

## ⚠️ KRITIEKE BEVEILIGINGSWAARSCHUWING

**STRIPE KEYS ZIJN GECOMPROMITTEERD!**

De Stripe API keys in dit bestand waren eerder op GitHub gepubliceerd en zijn daarom onveilig. **Je MOET deze vervangen voordat je de app gebruikt!**

## 📋 Setup Stappen

### 1. Vervang Stripe Keys (VERPLICHT!)

#### Stap A: Intrekken oude keys
1. Ga naar [Stripe Dashboard - API Keys](https://dashboard.stripe.com/apikeys)
2. Log in met je Stripe account
3. Klik op de **"⋮"** bij elke key en selecteer **"Roll key"** of **"Revoke"**
4. Bevestig de intrekking

#### Stap B: Genereer nieuwe keys
1. In hetzelfde [Stripe Dashboard - API Keys](https://dashboard.stripe.com/apikeys)
2. Klik op **"Create secret key"**
3. Geef de key een naam (bijv. "WritGo Production")
4. Kopieer de **Secret Key** (begint met `sk_live_...`)
5. Kopieer ook de **Publishable Key** (begint met `pk_live_...`)

#### Stap C: Update .env file
Vervang in `WRITGO_ENV_FILE.env`:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_JE_NIEUWE_KEY_HIER
STRIPE_SECRET_KEY=sk_live_JE_NIEUWE_KEY_HIER
```

---

### 2. Database URL Configureren

#### Voor Render PostgreSQL:
1. Ga naar [Render Dashboard](https://dashboard.render.com)
2. Selecteer je PostgreSQL database
3. Kopieer de **Internal Database URL**
4. Plak in `.env`:
```bash
DATABASE_URL=postgresql://username:password@hostname:5432/database
```

⚠️ **Gebruik altijd de Internal URL (niet External!)** voor betere performance en beveiliging.

---

### 3. Stripe Webhook Configureren

**Dit doe je PAS NA deployment van je app!**

#### Stap 1: Deploy je app eerst
```bash
# Volg de instructies in RENDER_DEPLOYMENT.md
```

#### Stap 2: Configureer webhook in Stripe
1. Ga naar [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Klik **"Add endpoint"**
3. Vul in:
   - **Endpoint URL**: `https://writgoai.nl/api/webhooks/stripe`
   - **Description**: "WritGo Production Payments"
4. Selecteer deze events:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
5. Klik **"Add endpoint"**
6. Kopieer de **Signing secret** (begint met `whsec_...`)

#### Stap 3: Update .env
```bash
STRIPE_WEBHOOK_SECRET=whsec_JE_SIGNING_SECRET_HIER
```

#### Stap 4: Update in Render
1. Ga naar je Render web service
2. **Settings** → **Environment**
3. Voeg toe of update: `STRIPE_WEBHOOK_SECRET`
4. Save changes (app redeploy automatisch)

---

### 4. Environment Variables in Render Toevoegen

#### Methode 1: Via Dashboard (Aanbevolen)
1. Ga naar je web service in Render
2. **Settings** → **Environment**
3. Voeg ALLE variabelen toe uit `WRITGO_ENV_FILE.env`
4. Klik **"Save Changes"**

#### Methode 2: Via Environment Groups
1. Maak een group: **"WritGo Production"**
2. Voeg alle keys toe
3. Link group aan je web service

**Belangrijke variabelen om toe te voegen:**
```bash
DATABASE_URL=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://writgoai.nl
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
AWS_BUCKET_NAME=...
AWS_FOLDER_PREFIX=...
AIML_API_KEY=...
BOL_COM_CLIENT_ID=...
BOL_COM_CLIENT_SECRET=...
MAILERLITE_API_KEY=...
CRON_SECRET=...
NODE_ENV=production
```

---

### 5. Database Migrations Uitvoeren

**NA eerste deployment:**

```bash
# Via Render Shell (in je web service)
npx prisma migrate deploy
npx prisma db seed
```

Of lokaal met productie DATABASE_URL:
```bash
DATABASE_URL="jouw_render_database_url" npx prisma migrate deploy
```

---

### 6. Test Mode vs Live Mode

#### Voor Development/Testing:
Gebruik Stripe **test keys**:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

#### Voor Production:
Gebruik Stripe **live keys**:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
NEXTAUTH_URL=https://writgoai.nl
NODE_ENV=production
```

---

### 7. Cron Job Configureren (Optioneel)

Voor automatische payment reminders:

1. **UptimeRobot** of **EasyCron** account aanmaken
2. Configureer:
   - **URL**: `https://writgoai.nl/api/cron/payment-reminders`
   - **Method**: `POST`
   - **Header**: `Authorization: Bearer <CRON_SECRET>`
   - **Interval**: Dagelijks om 09:00 UTC

---

## ✅ Deployment Checklist

Voordat je live gaat:

- [ ] **Stripe keys vervangen** (oude zijn gecompromitteerd!)
- [ ] **DATABASE_URL** ingesteld op Render Internal URL
- [ ] **NEXTAUTH_URL** ingesteld op productie domein
- [ ] **Stripe webhook** geconfigureerd en secret toegevoegd
- [ ] Alle environment variables toegevoegd in Render
- [ ] Database migrations uitgevoerd
- [ ] Test checkout flow (maak testfactuur)
- [ ] Test webhook (betaal testfactuur)
- [ ] Controleer email notificaties
- [ ] Test admin en client portals

---

## 🔒 Beveiliging Best Practices

### ✅ DO:
- Gebruik `.env` alleen lokaal
- Bewaar `.env` in wachtwoordmanager (1Password, LastPass)
- Gebruik environment variables in Render Dashboard
- Roteer keys regelmatig
- Gebruik test keys voor development
- Monitoor Stripe Dashboard voor verdachte activiteit

### ❌ DON'T:
- Commit `.env` naar Git (staat al in `.gitignore`)
- Deel `.env` via email of Slack
- Gebruik live keys in development
- Hardcode secrets in code
- Laat keys in browser console logs

---

## 🆘 Troubleshooting

### Stripe Error: "Invalid API Key"
**Probleem**: Oude of verkeerde key gebruikt.

**Oplossing**:
1. Controleer of je nieuwe keys hebt gegenereerd
2. Verifieer dat `STRIPE_SECRET_KEY` begint met `sk_live_`
3. Check Render environment variables
4. Redeploy de app

### Database Connection Error
**Probleem**: Verkeerde DATABASE_URL.

**Oplossing**:
1. Gebruik Render **Internal Database URL**
2. Check of database online is
3. Verifieer credentials

### Webhook Failures
**Probleem**: Stripe kan webhook niet bereiken.

**Oplossing**:
1. Check of app draait op juiste URL
2. Verifieer endpoint: `/api/webhooks/stripe`
3. Test webhook in Stripe Dashboard
4. Check logs in Render Dashboard

---

## 📞 Hulp Nodig?

- 📚 [Render Docs](https://render.com/docs)
- 💳 [Stripe Docs](https://stripe.com/docs)
- 🔐 [NextAuth.js Docs](https://next-auth.js.org)

---

**Status**: ✅ Environment setup gereed voor deployment!
