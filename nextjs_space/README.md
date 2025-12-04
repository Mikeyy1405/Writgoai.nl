# Writgo Media - Omnipresence Content Platform

🚀 **Live op: [writgo.nl](https://writgo.nl)**

## 📋 Overzicht

Writgo Media is een volledig AI-powered omnipresence content platform met geavanceerde functies voor:
- 🤖 AI Content Generatie (blogs, artikelen, producten)
- 📊 SEO Planning & Optimalisatie
- 🎥 Video Generatie
- 🔗 Affiliate Integratie (Bol.com)
- 📝 WordPress Publishing
- 💼 **Agency Portal** - Klantbeheer, opdrachten, facturen
- 💳 **Stripe Betalingen** - Automatische factuurverwerking

---

## 🏗️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Authenticatie**: NextAuth.js
- **Betalingen**: Stripe (iDEAL + Credit Card)
- **AI**: Abacus.AI + OpenAI + AIML API
- **Email**: MailerLite
- **Cloud Storage**: AWS S3
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React

---

## 🚀 Installatie

### 1. Clone het project

```bash
git clone https://github.com/Mikeyy1405/Writgoai.nl.git
cd Writgoai.nl
```

### 2. Installeer dependencies

```bash
yarn install
```

### 3. Environment Variables

Kopieer `.env.example` naar `.env`:

```bash
cp .env.example .env
```

Vul de volgende credentials in:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://writgo.nl

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3
AWS_BUCKET_NAME=your-bucket
AWS_FOLDER_PREFIX=writgo/

# Cron
CRON_SECRET=your-cron-secret
```

### 4. Database Setup

```bash
# Genereer Prisma Client
yarn prisma generate

# Run migraties (als nodig)
yarn prisma migrate deploy

# Seed database (optioneel)
yarn prisma db seed
```

### 5. Start Development Server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

---

## 📦 API Secrets (Externe Services)

De volgende API keys worden opgeslagen in `/home/ubuntu/.config/abacusai_auth_secrets.json`:

- **AIML API** - AI modellen voor content generatie
- **OpenAI API** - GPT modellen
- **MailerLite API** - Email notificaties
- **Bol.com API** - Affiliate producten
- **Originality.AI** - Plagiaatcontrole
- **ElevenLabs** - Text-to-speech
- **Runway ML** - Video generatie

---

## 🏢 Agency Portal (Fase 3)

### Features:

#### Admin Dashboard (`/dashboard/agency`)
- ✅ Klantenbeheer met creditoverzicht
- ✅ Opdrachten (Kanban board + lijstweergave)
- ✅ Verzoeken beheer (nieuwe aanvragen)
- ✅ Facturen met Stripe integratie
- ✅ PDF facturen genereren
- ✅ Email notificaties (facturen, betalingen, herinneringen)

#### Client Portal (`/client-portal`)
- ✅ Dashboard met opdrachten/facturen overzicht
- ✅ Nieuw verzoek indienen
- ✅ Mijn opdrachten bekijken
- ✅ Facturen betalen (iDEAL + Credit Card)
- ✅ PDF facturen downloaden

### Stripe Integratie:

1. **Admin Flow**:
   - Maak factuur aan
   - Stuur betaallink via email of kopieer URL
   - Klant betaalt via Stripe Checkout
   - Webhook update factuur status automatisch

2. **Client Flow**:
   - Bekijk onbetaalde facturen
   - Klik "Nu Betalen"
   - Betaal via iDEAL of Credit Card
   - Automatische redirect na betaling

---

## 🔧 Belangrijke Bestanden

### Database Schema
```
prisma/schema.prisma
```

### API Routes
```
app/api/admin/agency/        # Admin agency routes
app/api/client/              # Client routes
app/api/webhooks/stripe/     # Stripe webhook handler
```

### Email Templates
```
lib/email-service.ts         # Email service
lib/notification-helper.ts   # Notificatie functies
```

### PDF Generatie
```
lib/pdf-invoice-generator.tsx  # PDF templates
```

---

## 🌐 Deployment

### Productie URL:
**[writgo.nl](https://writgo.nl)**

### Webhook Configuratie:

1. Ga naar [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Voeg endpoint toe: `https://writgo.nl/api/webhooks/stripe`
3. Selecteer events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Kopieer webhook secret naar `.env`

---

## 👥 Gebruikers

### Admin Account
```
Email: info@writgo.nl
Role: admin
```

### Test Client
```
Email: test@client.nl
Role: client
```

---

## 📚 Documentatie

- [Stripe Integration Guide](STRIPE_INTEGRATION.md)
- [Email Templates](EMAIL_TEMPLATES.md)
- [API Documentation](API_DOCS.md)

---

## 🆘 Support

Voor vragen of problemen:
- Email: info@writgo.nl
- GitHub Issues: [Maak een issue aan](https://github.com/Mikeyy1405/Writgoai.nl/issues)

---

## 📄 Licentie

Private Project - Alle rechten voorbehouden © 2024 WritGo AI
