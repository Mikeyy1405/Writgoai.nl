# WordPress Content Autopilot Systeem

Volledig geautomatiseerd content generatie systeem voor WordPress met AI-powered topical authority.

## Features

### 1. WordPress Onboarding Flow
- Eenvoudig formulier om WordPress site toe te voegen
- Automatische verbinding testen
- Site niche/topic detectie
- Autopilot configuratie

### 2. Topical Authority Content Generator
- AI analyseert de WordPress site en niche
- Genereert een content strategie voor topical authority
- Creëert een content calendar met relevante topics
- Automatische keyword research en topic clustering
- Genereert en post content automatisch volgens schema

### 3. Content & Performance Dashboard
- Overzicht van alle verbonden WordPress sites
- Lijst van alle gepubliceerde content met metrics
- Performance metrics (views, rankings, engagement)
- Topical authority coverage

### 4. AI Content Updater
- Lijst van bestaande WordPress content
- AI analyseert content en suggereert verbeteringen
- One-click update functionaliteit
- SEO optimalisatie
- Content verrijking

### 5. Autopilot Engine (Backend)
- Scheduled task die automatisch draait (cron job)
- Genereert content op basis van strategie
- Post automatisch naar WordPress
- Tracked performance

## API Routes

### Setup
- `POST /api/admin/wordpress-autopilot/setup` - WordPress site toevoegen

### Sites Management
- `GET /api/admin/wordpress-autopilot/sites` - Lijst van sites
- `DELETE /api/admin/wordpress-autopilot/sites?siteId=xxx` - Site verwijderen

### Content Strategy
- `POST /api/admin/wordpress-autopilot/generate-strategy` - Content strategie genereren

### Content Generation
- `POST /api/admin/wordpress-autopilot/generate-content` - Content genereren en posten
- `GET /api/admin/wordpress-autopilot/content?siteId=xxx` - Alle content ophalen

### Performance
- `GET /api/admin/wordpress-autopilot/performance?siteId=xxx` - Performance metrics

### Content Updates
- `POST /api/admin/wordpress-autopilot/update-content` - Content updaten met AI
  - Body: `{ contentId: string, action: 'analyze' | 'update' }`

### Autopilot Controls
- `POST /api/admin/wordpress-autopilot/start` - Autopilot starten
- `POST /api/admin/wordpress-autopilot/stop` - Autopilot stoppen

### Cron Job
- `POST /api/cron/wordpress-autopilot-scheduler` - Automatische content generatie
  - Should run: Every 1 hour
  - Vercel Cron: `0 * * * *`

## Database Schema

De volgende tabellen zijn vereist:

### WordPressAutopilotSite
```typescript
{
  id: string;
  clientId: string;
  name: string;
  siteUrl: string;
  username: string;
  applicationPassword: string;
  niche?: string;
  language?: 'nl' | 'en' | 'de' | 'fr' | 'es';
  postingFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  contentTypes: string[];
  status: 'active' | 'paused' | 'error';
  lastPostDate?: Date;
  nextPostDate?: Date;
  totalPosts: number;
  averageViews?: number;
  topicalAuthorityScore?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### ContentStrategy
```typescript
{
  id: string;
  siteId: string;
  niche: string;
  mainTopics: string[];
  subtopics: Record<string, string[]>;
  keywordClusters: KeywordCluster[];
  contentCalendar: ContentCalendarItem[];
  topicalAuthorityGoal: number;
  currentCoverage: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### ContentCalendarItem
```typescript
{
  id: string;
  siteId: string;
  strategyId: string;
  title: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  contentType: 'article' | 'listicle' | 'how-to' | 'review' | 'guide';
  topic: string;
  subtopic?: string;
  scheduledDate: Date;
  status: 'scheduled' | 'generating' | 'generated' | 'published' | 'failed';
  contentId?: string;
  wordpressPostId?: number;
  publishedUrl?: string;
  generatedAt?: Date;
  publishedAt?: Date;
  error?: string;
}
```

### AutopilotSettings
```typescript
{
  siteId: string;
  enabled: boolean;
  postingFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  preferredPostingTime?: string;
  contentLength: 'short' | 'medium' | 'long' | 'auto';
  includeImages: boolean;
  includeFAQ: boolean;
  includeYouTube: boolean;
  autoPublish: boolean;
  notifications: {
    onPublish: boolean;
    onError: boolean;
    email?: string;
  };
}
```

## Frontend Pages

### Setup Flow
- `/admin/wordpress-autopilot/setup` - WordPress site onboarding

### Dashboard
- `/admin/wordpress-autopilot/dashboard` - Main dashboard met:
  - Sites lijst
  - Content overzicht
  - Performance metrics
  - Topical authority score

### Content Updater
- `/admin/wordpress-autopilot/content-updater` - Content analyse en updates

## Usage

### 1. Setup een nieuwe WordPress site
```bash
Navigeer naar: /admin/wordpress-autopilot/setup
```

### 2. AI genereert automatisch:
- Niche detectie
- Topical authority strategie
- Keyword clusters
- Content calendar

### 3. Content wordt automatisch gegenereerd en gepubliceerd
Door de cron job die elk uur draait.

### 4. Monitor performance
```bash
Navigeer naar: /admin/wordpress-autopilot/dashboard
```

### 5. Update bestaande content
```bash
Navigeer naar: /admin/wordpress-autopilot/content-updater
```

## Vercel Cron Configuration

Voeg toe aan `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/wordpress-autopilot-scheduler",
      "schedule": "0 * * * *"
    }
  ]
}
```

## Environment Variables

Geen extra environment variables nodig. Gebruikt bestaande:
- `CRON_SECRET` - Voor cron job authenticatie
- Database credentials (Supabase/Prisma)
- AI API keys (OpenAI, Claude)

## Credits Costs

- Content generatie: 50 credits (CREDIT_COSTS.BLOG_POST)
- Content update: 25 credits
- Strategy generatie: Gebruikt AI tokens maar geen directe credits

## Integration

Gebruikt bestaande systemen:
- `@/lib/wordpress-publisher` - WordPress publishing
- `@/lib/aiml-agent` - Content generatie (Claude Sonnet 4)
- `@/lib/credits` - Credit management
- `@/lib/db` - Database (Supabase + Prisma shim)
