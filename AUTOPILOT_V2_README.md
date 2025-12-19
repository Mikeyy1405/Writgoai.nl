# 🤖 WordPress AI Agent AutoPilot V2

## Overzicht

De WordPress AI Agent AutoPilot is een volledig autonoom content generatie systeem dat automatisch high-quality artikelen creëert, publiceert en optimaliseert voor meerdere WordPress websites. Het systeem combineert de kracht van drie AI services:

- **Claude Sonnet 4.5** (via AIML API) - Voor het schrijven van SEO-geoptimaliseerde content
- **Perplexity API** - Voor real-time research en trending topics
- **Flux Pro** - Voor professionele AI-gegenereerde featured images

## ✨ Features

### 1. Autonomous Content Generation
- **Automatic Research**: Perplexity API haalt actuele informatie, statistieken en trends op
- **AI Writing**: Claude Sonnet 4.5 schrijft professionele, SEO-geoptimaliseerde artikelen
- **Image Generation**: Flux Pro genereert custom featured images
- **WordPress Publishing**: Automatische publicatie naar WordPress met Gutenberg support

### 2. Content Optimizer
- **SEO Analysis**: Analyseert bestaande WordPress content voor SEO opportuniteiten
- **Automatic Rewrites**: Herschrijft content met AI voor betere SEO scores
- **FAQ Addition**: Voegt automatisch FAQ secties toe voor featured snippets
- **Fresh Information**: Update content met actuele statistieken en trends

### 3. Scheduling & Automation
- **Recurring Jobs**: Schedule content generation (daily, weekly, monthly)
- **Cron Integration**: Automatic execution via Vercel cron jobs
- **Multi-Site Support**: Manage multiple WordPress websites
- **Credit Management**: Automatic credit deduction and tracking

## 🏗️ Architectuur

### Core AI Services

**lib/ai-services/claude-writer.ts**
- Claude Sonnet 4.5 integration via AIML API
- SEO-geoptimaliseerde content generatie
- Verschillende tones of voice (professional, casual, friendly, expert)
- Markdown en HTML output
- FAQ sections voor featured snippets

**lib/ai-services/perplexity-research.ts**
- Perplexity API integration voor real-time research
- Trending topics discovery
- Competitor analysis
- Statistics gathering met sources
- 24-hour caching voor efficiency

**lib/ai-services/flux-image-generator.ts**
- Flux Pro image generation via AIML API
- Smart prompt generation op basis van artikel context
- AWS S3 upload voor image hosting
- Multiple aspect ratios (16:9, 1:1, 4:3)
- Retry logic voor reliability

### AutoPilot Engine

**lib/autopilot/autopilot-orchestrator.ts**
- Main orchestration engine
- Coordinates: Research → Writing → Image Gen → Publishing
- Progress tracking en status updates
- Error handling en retry logic
- Email notifications

**lib/autopilot/content-optimizer.ts**
- Analyzes WordPress posts voor SEO issues
- Generates improvement suggestions
- Rewrites content met Claude AI
- Updates WordPress posts
- Logs optimization history

### API Endpoints

```
POST /api/client/autopilot/start
- Start een nieuwe AutoPilot job
- Body: { articleIdeaId, frequency }

GET /api/client/autopilot/status/[jobId]
- Haal job status en progress op
- Real-time updates

POST /api/client/content-optimizer/analyze
- Analyze WordPress posts voor optimalisatie
- Body: { projectId, postId? }

POST /api/client/content-optimizer/optimize
- Optimize een WordPress post
- Body: { projectId, postId, improvements?, includeFAQ }

GET /api/cron/autopilot-runner
- Cron job die scheduled artikel ideas verwerkt
- Runs every hour (0 * * * *)
```

### Database Schema

```prisma
model ArticleIdea {
  // ... existing fields
  
  // AutoPilot scheduling
  isScheduledForAutopilot Boolean @default(false)
  autopilotFrequency     String? // 'once' | 'daily' | 'weekly' | 'monthly'
  autopilotNextRun       DateTime?
  autopilotLastRun       DateTime?
  autopilotRunCount      Int @default(0)
  
  // Research data (cached)
  perplexityResearch     Json?
  researchedAt           DateTime?
}

model AutoPilotJob {
  id              String @id @default(cuid())
  clientId        String
  projectId       String
  articleIdeaId   String
  status          String // pending, researching, writing, etc.
  progress        Float
  currentStep     String?
  contentId       String?
  wordpressPostId Int?
  wordpressUrl    String?
  error           String?
  startedAt       DateTime
  completedAt     DateTime?
}

model ContentOptimizationLog {
  id               String @id @default(cuid())
  projectId        String
  wordpressPostId  Int
  originalSeoScore Float
  newSeoScore      Float
  improvements     String[]
  optimizedAt      DateTime
}
```

## 🚀 Gebruik

### AutoPilot Starten

#### Via API
```typescript
const response = await fetch('/api/client/autopilot/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    articleIdeaId: 'article-123',
    frequency: 'daily', // 'once', 'daily', 'weekly', 'monthly'
  }),
});

const { jobId } = await response.json();
```

#### Via Dashboard
1. Ga naar `/client-portal/autopilot`
2. Selecteer een ArticleIdea
3. Kies frequency (once, daily, weekly, monthly)
4. Klik op "Start AutoPilot"
5. Volg de progress in real-time

### Content Optimizer Gebruiken

#### Analyze Posts
```typescript
const response = await fetch('/api/client/content-optimizer/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'project-123',
  }),
});

const { posts } = await response.json();
// posts: [{ id, title, seoScore, issues, canOptimize }]
```

#### Optimize Post
```typescript
const response = await fetch('/api/client/content-optimizer/optimize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'project-123',
    postId: 456,
    improvements: 'Add more statistics and update for 2025',
    includeFAQ: true,
  }),
});

const { result } = await response.json();
```

## ⚙️ Configuratie

### Environment Variables

```bash
# AIML API (voor Claude & Flux)
AIML_API_KEY=your-aiml-api-key

# Perplexity API
PERPLEXITY_API_KEY=your-perplexity-api-key

# AWS S3 voor images
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_BUCKET_NAME=writgo-content-images
AWS_REGION=eu-west-1

# Cron secret
CRON_SECRET=your-cron-secret
```

### Vercel Cron Configuration

```json
{
  "crons": [
    {
      "path": "/api/cron/autopilot-runner",
      "schedule": "0 * * * *"
    }
  ]
}
```

### WordPress Setup

Voor elk project:
1. Installeer WordPress Application Passwords plugin (of gebruik WordPress 5.6+)
2. Genereer een Application Password
3. Voeg credentials toe aan het Project in de database:
   - wordpressUrl
   - wordpressUsername  
   - wordpressPassword (Application Password)

## 💰 Credits

AutoPilot gebruikt credits voor:
- **Research** (15 credits): Perplexity API research
- **Writing** (70 credits): Claude Sonnet 4.5 artikel schrijven
- **Image** (18 credits): Flux Pro featured image
- **Total per artikel**: ~103 credits

Content Optimizer gebruikt:
- **Research** (15 credits): Fresh information gathering
- **Rewrite** (50 credits): Content herschrijven (70% van nieuw artikel)
- **Total per optimization**: ~65 credits

## 🔒 Security

- All API keys zijn server-side only
- WordPress credentials encrypted in database
- Cron jobs protected met secret token
- Rate limiting op AI API calls
- Input validation en sanitization

## 📊 Monitoring

### Job Status Tracking
- Real-time progress updates (0-100%)
- Current step description
- ETA calculation
- Error logging

### Logs
Alle AutoPilot executions worden gelogd:
- Start time, completion time
- Success/failure status
- Credits used
- Generated content IDs
- WordPress URLs

## 🛠️ Troubleshooting

### Job blijft hangen
- Check database voor job status
- Verify API keys zijn correct
- Check error logs in job.error field
- Gebruik cleanup endpoint om stuck jobs te resetten

### WordPress publicatie faalt
- Verify WordPress credentials
- Check WordPress Application Password
- Test WordPress API endpoint manually
- Check WordPress REST API is enabled

### Images worden niet gegenereerd
- Verify AWS S3 credentials
- Check S3 bucket permissions (public-read)
- Verify AIML API key
- Check Flux Pro API quota

### Research data niet actueel
- Perplexity research wordt 24 uur gecached
- Force nieuwe research door cache te verwijderen:
  ```sql
  UPDATE "ArticleIdea" 
  SET "perplexityResearch" = NULL, "researchedAt" = NULL 
  WHERE id = 'article-id';
  ```

## 📚 Verdere Documentatie

- [API Documentation](./API_DOCUMENTATION.md)
- [Database Schema](./prisma/schema.prisma)
- [AIML API Docs](https://docs.aimlapi.com/)
- [Perplexity API Docs](https://docs.perplexity.ai/)

## 🎯 Future Improvements

- [ ] Multiple language support (Engels, Duits, Frans)
- [ ] Advanced scheduling (specific dates, times)
- [ ] A/B testing voor titles
- [ ] Automatic internal linking suggestions
- [ ] Social media post generation from articles
- [ ] Video script generation
- [ ] Podcast episode generation
- [ ] Newsletter integration
- [ ] Analytics integration (Google Analytics, Search Console)
- [ ] Performance optimization monitoring
