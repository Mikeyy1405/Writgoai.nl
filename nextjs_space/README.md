# WritGo AI - Content & SEO Platform

WritGo AI is een complete AI-gedreven content en SEO platform met agency portal, automatische content generatie, en Stripe betalingsintegratie.

## ✨ Features

### 🎯 Core Features
- **AI Content Generator** - Automatische blog en content generatie met SEO optimalisatie
- **Site Planner** - Complete content planning met sitemap integratie
- **Image Generator** - AI-powered afbeeldingen met 11+ modellen (2-18 credits)
- **Video Generator** - Automatische video creatie met scripts en voice-overs
- **Keyword Research** - SEO zoekwoordonderzoek en analyse
- **Social Media Studio** - Social media content planning en publishing

### 🏢 Agency Portal
- **Client Management** - Volledig client management systeem
- **Assignments** - Kanban board voor opdrachten
- **Invoices** - Facturatie met Stripe integratie (iDEAL + credit card)
- **Client Requests** - Request management systeem
- **PDF Generation** - Automatische PDF facturen
- **Email Notifications** - MailerLite integratie voor notificaties

### 💳 Payment & Credits
- **Pay-as-you-go** - Credit-based pricing model
- **Stripe Payments** - Volledige Stripe integratie voor facturen
- **Subscription Credits** - Abonnement credits + top-up credits
- **Unlimited Credits** - Optie voor onbeperkte credits

### 🔗 Integrations
- **WordPress** - Direct publiceren naar WordPress
- **Bol.com** - Affiliate product integratie
- **MailerLite** - Email marketing integratie
- **Stripe** - Betalingen en facturatie
- **Google Search Console** - SEO data integratie

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Yarn package manager

### Installation

```bash
# Clone het project
git clone https://github.com/Mikeyy1405/Writgoai.nl.git
cd Writgoai.nl

# Installeer dependencies
yarn install

# Setup environment variables
cp .env.example .env
# Vul je credentials in .env

# Generate Prisma client
yarn prisma generate

# Run database migrations
yarn prisma migrate deploy

# Start development server
yarn dev
```

De app draait nu op [http://localhost:3000](http://localhost:3000)

## 📝 Environment Variables

Maak een `.env` bestand in de root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://writgoai.nl

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3 (Cloud Storage)
AWS_BUCKET_NAME=your-bucket-name
AWS_FOLDER_PREFIX=writgo/

# Cron Secret
CRON_SECRET=your-cron-secret-here
```

**Note:** API keys voor MailerLite, Bol.com, AIML, en OpenAI worden geladen vanuit `/home/ubuntu/.config/abacusai_auth_secrets.json`

## 🏗️ Project Structure

```
writgoai.nl/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── admin/agency/         # Agency admin endpoints
│   │   ├── client/               # Client portal endpoints
│   │   └── webhooks/stripe/      # Stripe webhook handler
│   ├── dashboard/agency/         # Agency dashboard pages
│   ├── client-portal/            # Client portal pages
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── ui/                       # Shadcn UI components
│   └── ...                       # Custom components
├── lib/                          # Utility libraries
│   ├── email-service.ts          # MailerLite integration
│   ├── pdf-invoice-generator.tsx # PDF generation
│   ├── stripe.ts                 # Stripe client
│   └── ...                       # Other utilities
├── prisma/
│   └── schema.prisma             # Database schema
└── public/                       # Static assets
```

## 🎨 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI + Radix UI
- **Database:** PostgreSQL + Prisma ORM
- **Authentication:** NextAuth.js
- **Payments:** Stripe
- **Email:** MailerLite API
- **PDF:** @react-pdf/renderer
- **AI:** AIML API + OpenAI (fallback)

## 📋 Key API Endpoints

### Agency Admin
- `POST /api/admin/agency/clients` - Create client
- `GET /api/admin/agency/assignments` - List assignments
- `POST /api/admin/agency/invoices` - Create invoice
- `POST /api/admin/agency/invoices/[id]/checkout` - Generate payment link
- `GET /api/admin/agency/invoices/[id]/pdf` - Download PDF invoice

### Client Portal
- `GET /api/client/assignments` - View assignments
- `POST /api/client/requests` - Submit request
- `GET /api/client/invoices` - View invoices
- `POST /api/client/invoices/[id]/pay` - Pay invoice via Stripe

### Webhooks
- `POST /api/webhooks/stripe` - Handle Stripe events
- `POST /api/cron/payment-reminders` - Send payment reminders (cron job)

## 🔐 Authentication

Default admin account:
- **Email:** info@writgo.nl
- **Password:** (zie database seeding)

Test client:
- **Email:** test@writgo.nl
- **Password:** (zie database seeding)

## 💰 Credit System

- **Subscription Credits:** Hernieuwt maandelijks
- **Top-up Credits:** Eenmalige credits
- **Infinity Credits:** Onbeperkte credits optie
- **Credit Costs:**
  - AI Images: 2-18 credits (afhankelijk van model)
  - Blog/Content: 5-50 credits
  - Video: 50-150 credits

## 📦 Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables in Vercel
Voeg alle environment variables toe in Vercel dashboard → Project Settings → Environment Variables

### Database Migrations
```bash
# In Vercel deployment
yarn prisma migrate deploy
```

## 🔧 Development

### Running Tests
```bash
yarn test
```

### Database Management
```bash
# Generate Prisma client
yarn prisma generate

# Run migrations
yarn prisma migrate dev

# Seed database
yarn prisma db seed

# Open Prisma Studio
yarn prisma studio
```

### Build Production
```bash
yarn build
yarn start
```

## 📊 Database Schema

### Key Models
- **Client** - Gebruikers/clients met subscription info
- **Assignment** - Opdrachten voor clients
- **ClientRequest** - Verzoeken van clients
- **Invoice** - Facturen met Stripe integratie
- **InvoiceItem** - Factuurregels
- **Project** - Client projecten met WordPress integratie
- **Content** - Gegenereerde content (blogs, video's, etc.)

## 🎯 Roadmap

### Fase 1 (✅ Voltooid)
- [x] Agency Portal
- [x] Stripe Payments
- [x] PDF Invoices
- [x] Email Notifications

### Fase 2 (Toekomst)
- [ ] Payment Reminders (automatisch)
- [ ] Recurring Payments
- [ ] Advanced Analytics
- [ ] API Access voor clients
- [ ] White-label optie

## 🐛 Known Issues

- Sitemap loader kan falen bij ontoegankelijke websites
- Bol.com API rate limits bij grote volumes
- Image generation kan timeout bij hoge load

## 🤝 Contributing

Dit is een private project. Voor vragen of suggesties, neem contact op met info@writgo.nl.

## 📄 License

Proprietary - All rights reserved

## 📞 Support

- **Website:** [writgoai.nl](https://writgoai.nl)
- **Email:** info@writgo.nl

---

**Built with ❤️ by WritGo AI Team**
