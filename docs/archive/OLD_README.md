# WritGo - AI Content & SEO Platform

🚀 Een krachtig AI-aangedreven content en SEO platform gebouwd met Next.js

## 🌟 Features

### Content Generatie
- **Site Planner**: Genereer complete contentplannen met 100+ pagina's (homepage, pillar pages, clusters, blogs)
- **Content Generator**: Creëer SEO-geoptimaliseerde content met streaming progress tracking
- **Blog Generator**: Schrijf complete blogs met metadata, social media posts en afbeeldingen
- **Auto Content**: Automatische content generatie met project-specifieke integratie

### AI-Modellen
- **Claude 4.5 Sonnet** via AIML API voor content planning en generatie
- **Meerdere Image Models**: Nano-banana, Flux, Stable Diffusion (2-18 credits per afbeelding)
- Streaming responses voor real-time feedback
- Kostenefficiënte model selectie

### SEO & Optimalisatie
- Automatische interne links (contextual integration)
- Bol.com affiliate integratie met dynamische product search
- Meta descriptions, social media tags
- Keyword optimalisatie

### Admin & Client Portals
- Volledig gescheiden admin en client dashboards
- Credit management systeem
- Project management
- Content library met versioning
- User management met rollen

## 🛠️ Tech Stack

- **Framework**: Next.js 14.2.28 (Pages Router)
- **Database**: PostgreSQL met Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS + Radix UI components
- **AI Integration**: AIML API (Claude, image models)
- **API Integratie**: Bol.com Partner API

## 📦 Installatie

```bash
# Clone de repository
git clone <your-repo-url>
cd writgo_planning_app/nextjs_space

# Installeer dependencies
yarn install

# Setup environment variabelen
cp .env.example .env
# Vul .env in met je credentials

# Run database migrations
yarn prisma generate
yarn prisma migrate deploy

# Seed de database (optioneel)
yarn prisma db seed

# Start development server
yarn dev
```

## 🔐 Environment Variabelen

Creëer een `.env` file met de volgende variabelen:

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# AIML API
AIML_API_KEY="your-aiml-key"
AIML_API_BASE_URL="https://api.aimlapi.com/v1"

# Bol.com (optioneel)
BOLCOM_CLIENT_ID="your-client-id"
BOLCOM_CLIENT_SECRET="your-client-secret"

# AWS S3 (file uploads)
AWS_BUCKET_NAME="your-bucket"
AWS_FOLDER_PREFIX="uploads/"
```

## 🚀 Deployment

De app is gedeployed op [writgoai.nl](https://writgoai.nl)

### Deployment Checklist
1. ✅ Database migrations uitgevoerd
2. ✅ Environment variabelen geconfigureerd
3. ✅ Build succesvol (`yarn build`)
4. ✅ Health checks passed

## 📁 Project Structuur

```
writgo_planning_app/
├── nextjs_space/
│   ├── app/                    # Next.js App Directory
│   │   ├── api/               # API routes
│   │   │   ├── admin/         # Admin endpoints
│   │   │   └── client/        # Client endpoints
│   │   ├── admin-portal/      # Admin dashboard pages
│   │   ├── client-portal/     # Client dashboard pages
│   │   └── components/        # Shared components
│   ├── lib/                   # Utility functions
│   │   ├── ai/               # AI integration helpers
│   │   ├── bolcom-api.ts     # Bol.com API client
│   │   ├── credits.ts        # Credit management
│   │   └── smart-image-generator.ts
│   ├── prisma/               # Database schema & migrations
│   └── public/               # Static assets
└── README.md
```

## 🎯 Key Workflows

### 1. Site Planning
1. Client selecteert project en keywords
2. AI genereert 100+ pagina's (homepage, pillars, clusters, blogs)
3. Plan wordt opgeslagen met metadata
4. Client kan plan downloaden als JSON

### 2. Content Generatie
1. Client selecteert project en content type
2. Kiest opties: afbeeldingen, interne links, affiliate links
3. AI genereert content met streaming progress
4. Content wordt opgeslagen in Content Library
5. Klant kan content bewerken en publiceren

### 3. Bol.com Affiliate Integratie
1. System zoekt automatisch relevante producten
2. Gebruikt project credentials voor API calls
3. Fallback naar preferred products bij API failure
4. Producten worden contextual in content geïntegreerd

## 🔧 Development

```bash
# Development server
yarn dev

# Build voor productie
yarn build

# Start productie server
yarn start

# Database commands
yarn prisma studio          # Open database GUI
yarn prisma generate        # Generate Prisma Client
yarn prisma migrate dev     # Create new migration
```

## 📝 Recent Updates

- ✅ Unified Content Specialist & Blog Generator
- ✅ Site Planner met 100+ items garantie
- ✅ Contextual internal links (inline in text)
- ✅ Dynamic Bol.com product search & integration
- ✅ Streaming progress tracking voor alle generators
- ✅ Cost-optimized image generation (nano-banana default)
- ✅ Robust error handling & validation
- ✅ Auto-save functionaliteit
- ✅ Credit deduction tracking

## 🐛 Troubleshooting

### Build Errors
- Check database connection in `.env`
- Run `yarn prisma generate` na schema changes
- Clear `.next` en `.build` cache folders

### API Errors
- Verify AIML API key is valid
- Check Bol.com credentials voor affiliate links
- Review API rate limits

### Image Generation
- Default model: nano-banana (2 credits)
- Validate cost before generation
- Check AWS S3 credentials voor upload

## 📄 License

Proprietary - WritGo Platform

## 👥 Contact

Voor vragen of support, neem contact op via [support email]

---

**Built with ❤️ using Next.js, Claude AI, and modern web technologies**
