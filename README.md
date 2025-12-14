# WritgoAI - AI Content Medewerker Platform

🚀 **Een krachtig AI-aangedreven content en SEO platform voor geautomatiseerde content creatie**

WritgoAI is een professioneel platform dat bedrijven helpt met het automatisch genereren van hoogwaardige, SEO-geoptimaliseerde content. Van strategische contentplannen tot complete blogs, video's en social media posts - alles geautomatiseerd met geavanceerde AI.

## ✅ Status: Production Ready (v2.0)
**Laatste Update:** 14 December 2025  
**Core Workflow:** ✅ 100% Functioneel  
**Deployment:** ✅ Ready for Render.com

**Wat is nieuw in v2.0:**
- ✅ Robuuste WordPress publish met retry logic
- ✅ Enhanced GetLate.dev integratie met graceful fallback
- ✅ Alle cron jobs geheractiveerd en werkend
- ✅ Complete end-to-end workflow getest
- ✅ Render.com deployment configuratie (`render.yaml`)

📖 **Zie [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) voor volledige details**  
🚀 **Zie [DEPLOYMENT.md](DEPLOYMENT.md) voor deployment instructies**

## 🌟 Belangrijkste Features

### Content Generatie
- **Autopilot Mode**: Volledig geautomatiseerde content generatie op schema
- **Blog Generator**: Complete, SEO-geoptimaliseerde blogs met metadata en afbeeldingen
- **Content Hub**: Centraal beheer van al uw gegenereerde content
- **Video Generator**: AI-gegenereerde video's met voice-over en beelden
- **Social Media Suite**: Geautomatiseerde social media posts voor meerdere platformen

### AI & Automatisering
- **Smart Content Planning**: Geautomatiseerde keyword research en contentplannen
- **Multi-Project Support**: Beheer meerdere websites/projecten vanuit één dashboard
- **Intelligent Scheduling**: Automatische planning en publicatie van content
- **Affiliate Integratie**: Automatische product-linking met Bol.com en TradeTracker

### Admin & Client Portals
- **Gescheiden Dashboards**: Admin en client interfaces
- **Credit Management**: Flexibel credit-based pricing systeem
- **WordPress Integratie**: Directe publicatie naar WordPress sites
- **White-label Oplossing**: Fully managed service voor klanten

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js + Supabase Auth
- **Styling**: Tailwind CSS + Radix UI
- **AI**: Claude 4.5 (via AIML API), OpenAI, Custom Models
- **Deployment**: Render.com
- **Image Generation**: Flux, Stable Diffusion, Nano-banana

## 📦 Snelstart

### Vereisten
- Node.js 18+ en npm/yarn
- Supabase account
- AIML API key (voor Claude AI)

### Installatie

```bash
# Clone de repository
git clone https://github.com/your-org/Writgoai.nl.git
cd Writgoai.nl

# Navigeer naar de applicatie folder
cd nextjs_space

# Installeer dependencies
npm install
# of
yarn install

# Kopieer environment variabelen
cp .env.example .env

# Vul .env in met jouw credentials (zie docs/setup/ENV_SETUP_INSTRUCTIES.md)

# Start development server
npm run dev
# of
yarn dev
```

De applicatie is nu beschikbaar op `http://localhost:3000`

## 📁 Project Structuur

```
Writgoai.nl/
├── nextjs_space/           # Hoofdapplicatie (Next.js 14)
│   ├── app/               # Next.js App Router
│   │   ├── api/          # API routes
│   │   ├── admin-portal/ # Admin dashboard
│   │   └── client-portal/# Client dashboard
│   ├── components/        # React componenten
│   ├── lib/              # Utilities en helpers
│   ├── public/           # Static assets
│   └── types/            # TypeScript types
│
├── docs/                  # Documentatie
│   ├── setup/            # Setup & installatie guides
│   ├── features/         # Feature documentatie
│   │   ├── autopilot/   # Autopilot feature
│   │   ├── content-hub/ # Content Hub
│   │   ├── blog-generator/
│   │   ├── video-generator/
│   │   ├── social-media/
│   │   └── affiliate/   # Affiliate systeem
│   ├── admin/           # Admin dashboard docs
│   ├── api/             # API documentatie
│   ├── migrations/      # Database migraties
│   ├── security/        # Security summaries
│   └── archive/         # Oude documentatie
│
├── scripts/              # Utility scripts
├── lib/                  # Gedeelde libraries
├── supabase/            # Supabase configuratie
├── render.yaml          # Render deployment config
└── README.md            # Dit bestand
```

## 📚 Documentatie

Uitgebreide documentatie is beschikbaar in de `docs/` folder:

### Setup & Configuratie
- [Environment Setup](docs/setup/ENV_SETUP_INSTRUCTIES.md) - Complete environment variabelen setup
- [Supabase Quick Start](docs/setup/SUPABASE_QUICK_START.md) - Database setup
- [Render Deployment](docs/setup/RENDER_DEPLOYMENT.md) - Production deployment

### Features
- [Autopilot Documentatie](docs/features/autopilot/) - Automatische content generatie
- [Content Hub Guide](docs/features/content-hub/) - Content management
- [Blog Generator](docs/features/blog-generator/) - Blog creation workflow
- [Video Generator](docs/features/video-generator/) - AI video creation
- [Social Media Suite](docs/features/social-media/) - Social media automation
- [Affiliate Systeem](docs/features/affiliate/) - Product integratie

### Admin & API
- [Admin Dashboard](docs/admin/) - Admin portal documentatie
- [API Documentatie](docs/api/) - API endpoints en integratie

## 🚀 Deployment

De applicatie is geoptimaliseerd voor deployment op Render.com.

### Deployment Checklist
1. ✅ Supabase database geconfigureerd
2. ✅ Environment variabelen ingesteld
3. ✅ `render.yaml` geconfigureerd
4. ✅ Build succesvol (`npm run build`)
5. ✅ Database migraties uitgevoerd

Zie [Render Deployment Guide](docs/setup/RENDER_DEPLOYMENT.md) voor gedetailleerde instructies.

## 🔐 Environment Variabelen

Belangrijkste environment variabelen:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# AI APIs
AIML_API_KEY=your-aiml-key
ABACUSAI_API_KEY=your-abacus-key

# Optioneel
BOLCOM_CLIENT_ID=your-bol-client-id
BOLCOM_CLIENT_SECRET=your-bol-secret
```

Zie [ENV_SETUP_INSTRUCTIES.md](docs/setup/ENV_SETUP_INSTRUCTIES.md) voor alle variabelen.

## 🔧 Development

```bash
# Development server
npm run dev

# Build voor productie
npm run build

# Start productie server
npm run start

# Linting
npm run lint
```

## 🎯 Gebruik

### Voor Admins
1. Log in op `/admin-portal`
2. Beheer clients en projecten
3. Monitor content generatie
4. Beheer credits en facturering

### Voor Clients
1. Log in op `/client-portal`
2. Selecteer project
3. Start content generatie (manueel of autopilot)
4. Beheer gegenereerde content
5. Publiceer naar WordPress

## 📊 Features Roadmap

- ✅ Autopilot mode met scheduling
- ✅ Multi-project support
- ✅ WordPress integratie
- ✅ Affiliate product linking
- ✅ Video generatie
- ✅ Social media posts
- 🔄 Email marketing integratie (in ontwikkeling)
- 🔄 Advanced analytics dashboard
- 📋 Multi-language support (gepland)
- 📋 API voor third-party integraties (gepland)

## 🐛 Troubleshooting

### Common Issues

**Build Errors**
- Check Supabase connection in `.env`
- Clear `.next` cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

**Authentication Issues**
- Verify `NEXTAUTH_SECRET` is set
- Check Supabase auth configuration
- Clear browser cookies

**API Errors**
- Verify API keys zijn geldig
- Check API rate limits
- Review logs in Supabase dashboard

Voor meer hulp, zie de [troubleshooting guides](docs/) in de documentatie.

## 📄 License

Proprietary - WritgoAI Platform

© 2024 WritgoAI. Alle rechten voorbehouden.

## 👥 Support & Contact

Voor vragen, bug reports, of feature requests:
- 📧 Email: support@writgoai.nl
- 📖 Documentatie: Zie `docs/` folder
- 🐛 Issues: GitHub Issues

---

**Gebouwd met ❤️ met Next.js, Claude AI, Supabase en moderne web technologieën**
