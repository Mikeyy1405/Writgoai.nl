# Content Pipeline Redesign - Documentatie

## 📋 Overzicht

Complete herstructurering van de content management UI van verwarrende multi-optie structuur naar duidelijke, gestroomlijnde pipelines voor blog en social media content.

## 🎯 Probleem

**Voor:**
- 5 verschillende opties voor content creatie (verwarrend):
  - Website Topical Map
  - AI Contentplan
  - Topical Authority Map
  - AI Genereren
  - Nieuw Artikel
- Geen duidelijke workflow
- Gebruikers weten niet waar te beginnen
- Geen overzicht van voortgang

**Na:**
- 2 duidelijke pipelines met 3 stappen elk
- Visuele flow van planning → generatie → publicatie
- Real-time status tracking
- Geïntegreerde autopilot functionaliteit

## 🏗️ Architectuur

### Pipeline Structuur

#### **Blog Content Pipeline** 📝

```
┌─────────────────────────────────────────────────┐
│  📝 BLOG CONTENT PIPELINE                       │
├─────────────────────────────────────────────────┤
│                                                 │
│  ① Topical Authority Map                       │
│     └─> [Start Planning] ────────────┐         │
│     📊 Geplande Artikelen: 500        ↓         │
│                                       ●         │
│  ② Batch Generatie                   ●         │
│     └─> Status: 47/500 (9%) ─────────┤         │
│     ⏱️ Gegenereerd: 47/500            ↓         │
│                                       ●         │
│  ③ Autopilot Publicatie              ●         │
│     └─> [●] Aan  | 3x per week       │         │
│     📈 Gepubliceerd: 25               ↓         │
│                                       ●         │
│  ✅ Live op WordPress                 ●         │
└─────────────────────────────────────────────────┘
```

#### **Social Media Pipeline** 📱

```
┌─────────────────────────────────────────────────┐
│  📱 SOCIAL MEDIA PIPELINE                       │
├─────────────────────────────────────────────────┤
│                                                 │
│  ① Social Media Strategie                      │
│     └─> [Start Planning] ────────────┐         │
│     📊 Geplande Posts: 300            ↓         │
│                                       ●         │
│  ② Batch Generatie                   ●         │
│     └─> Status: 150/300 (50%) ───────┤         │
│     ⏱️ Gegenereerd: 150/300           ↓         │
│                                       ●         │
│  ③ Autopilot Posting                 ●         │
│     └─> [●] Aan  | Dagelijks         │         │
│     📈 Gepost: 75                     ↓         │
│                                       ●         │
│  ✅ Live op Social Media              ●         │
└─────────────────────────────────────────────────┘
```

## 📂 Bestandsstructuur

### Nieuwe Components

```
components/
├── pipeline/
│   └── PipelineStep.tsx          # Visuele pipeline step component
└── autopilot/
    └── AutopilotToggle.tsx       # Autopilot configuratie component
```

### Herstructureerde Pagina's

```
app/admin/blog/page.tsx           # Volledig vernieuwd met pipelines
```

### API Endpoints

```
app/api/admin/
├── blog/
│   ├── pipeline/
│   │   └── status/route.ts       # Blog pipeline status
│   └── autopilot/
│       ├── toggle/route.ts       # Enable/disable autopilot
│       └── config/route.ts       # Get/update config
└── social/
    ├── pipeline/
    │   └── status/route.ts       # Social pipeline status
    └── autopilot/
        ├── toggle/route.ts       # Enable/disable autopilot
        └── config/route.ts       # Get/update config
```

### Database Schema

```
supabase/migrations/
└── 20251212_social_media_pipeline.sql
```

## 🗄️ Database Schema

### SocialMediaStrategy

```sql
CREATE TABLE "SocialMediaStrategy" (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  name TEXT NOT NULL,
  niche TEXT NOT NULL,
  targetAudience TEXT NOT NULL,
  totalPosts INTEGER DEFAULT 100,
  platforms JSONB NOT NULL,        -- ["linkedin", "instagram", ...]
  period TEXT DEFAULT '3-months',
  postingFrequency JSONB DEFAULT '{}',
  contentTypes TEXT[],
  tone TEXT DEFAULT 'professional',
  language TEXT DEFAULT 'NL',
  status TEXT DEFAULT 'planning',
  progress INTEGER DEFAULT 0,
  autopilotEnabled BOOLEAN DEFAULT FALSE,
  autopilotConfig JSONB,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### SocialMediaPost

```sql
CREATE TABLE "SocialMediaPost" (
  id TEXT PRIMARY KEY,
  strategyId TEXT NOT NULL,
  platform TEXT NOT NULL,          -- linkedin, instagram, etc.
  title TEXT,
  content TEXT NOT NULL,
  hashtags TEXT[],
  mediaUrls TEXT[],
  scheduledDate TIMESTAMP,
  status TEXT DEFAULT 'pending',
  externalPostId TEXT,             -- Later.com/Buffer ID
  engagement JSONB DEFAULT '{}',
  createdAt TIMESTAMP DEFAULT NOW(),
  publishedAt TIMESTAMP
);
```

### AutopilotConfig

```sql
CREATE TABLE "AutopilotConfig" (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  type TEXT NOT NULL,              -- 'blog' | 'social'
  planId TEXT NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  frequency TEXT DEFAULT '3x-week',
  time TEXT DEFAULT '09:00',
  weekdays INTEGER[],
  maxPerDay INTEGER DEFAULT 1,
  autoPublish BOOLEAN DEFAULT TRUE,
  lastRun TIMESTAMP,
  nextRun TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(type, planId)
);
```

## 🔧 Component API

### PipelineStep

```tsx
<PipelineStep
  number={1}
  title="Topical Authority Map"
  description="Genereer 100-500 artikel strategie"
  action="Start Planning"
  onClick={() => setView('topical-map')}
  status="completed" // idle | active | completed | paused
  stats={[
    { label: 'Geplande Artikelen', value: 500 }
  ]}
  showConnector={true}
/>
```

### AutopilotToggle

```tsx
<AutopilotToggle
  type="blog"  // 'blog' | 'social'
  planId={blogPipeline.planId}
  onConfigChange={(config) => {
    setBlogPipeline({
      ...blogPipeline,
      autopilotEnabled: config.enabled
    });
  }}
/>
```

## 🚀 API Endpoints

### Blog Pipeline Status

**GET** `/api/admin/blog/pipeline/status`

**Response:**
```json
{
  "hasActivePlan": true,
  "planId": "uuid-xxx",
  "plannedArticles": 500,
  "generatedArticles": 47,
  "publishedArticles": 25,
  "generationProgress": 9,
  "generationStatus": "active",
  "autopilotEnabled": true
}
```

### Social Pipeline Status

**GET** `/api/admin/social/pipeline/status`

**Response:**
```json
{
  "hasActivePlan": true,
  "planId": "uuid-xxx",
  "plannedPosts": 300,
  "generatedPosts": 150,
  "postedPosts": 75,
  "generationProgress": 50,
  "generationStatus": "completed",
  "autopilotEnabled": true
}
```

### Autopilot Toggle

**POST** `/api/admin/blog/autopilot/toggle`

**Request:**
```json
{
  "planId": "uuid-xxx",
  "enabled": true,
  "config": {
    "frequency": "3x-week",
    "time": "09:00",
    "weekdays": [1, 3, 5],
    "maxPerDay": 1,
    "autoPublish": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "config": { ... }
}
```

### Autopilot Config

**GET** `/api/admin/blog/autopilot/config?planId=uuid-xxx`

**Response:**
```json
{
  "config": {
    "enabled": true,
    "frequency": "3x-week",
    "time": "09:00",
    "weekdays": [1, 3, 5],
    "maxPerDay": 1,
    "autoPublish": true
  }
}
```

**PUT** `/api/admin/blog/autopilot/config`

**Request:**
```json
{
  "planId": "uuid-xxx",
  "config": {
    "frequency": "daily",
    "time": "10:00",
    "weekdays": [1,2,3,4,5],
    "maxPerDay": 2,
    "autoPublish": false
  }
}
```

## 🎨 UI/UX Verbeteringen

### Voor vs Na

| Aspect | Voor | Na |
|--------|------|-----|
| **Acties** | 5 losse opties | 2 duidelijke pipelines |
| **Flow** | Onduidelijk | Stap 1 → 2 → 3 |
| **Status** | Geen overzicht | Real-time progress |
| **Autopilot** | Aparte pagina | Geïntegreerd in stap 3 |
| **Visueel** | Statische buttons | Animaties & status icons |

### Design System

**Kleuren:**
- Blog Pipeline: Orange/Amber gradient
- Social Pipeline: Blue/Purple gradient
- Status Idle: Gray
- Status Active: Orange (animated)
- Status Completed: Green
- Status Paused: Yellow

**Icons:**
- Blog: `FileText`
- Social: `MessageSquare`
- Planning: `TrendingUp`
- Generatie: `Loader2` (animated)
- Autopilot: `Zap`
- Voltooid: `CheckCircle2`

## 📱 Responsive Design

- Mobile: Stack verticaal met grote touch targets
- Tablet: 2-kolom grid voor pipelines
- Desktop: Side-by-side pipelines met full details

## 🔄 Workflow

### Blog Content Workflow

1. **Planning:** Gebruiker klikt "Start Planning" → TopicalAuthorityMapGenerator
2. **Generatie:** Systeem start batch generatie in achtergrond
3. **Publicatie:** Autopilot publiceert volgens schema naar WordPress

### Social Media Workflow

1. **Planning:** Gebruiker klikt "Start Planning" → SocialMediaStrategyGenerator
2. **Generatie:** Systeem genereert posts voor alle platforms
3. **Posting:** Autopilot post volgens schema via Later.com/Buffer

## 🧪 Testing

### Component Tests

```bash
# PipelineStep component
npm test components/pipeline/PipelineStep.test.tsx

# AutopilotToggle component
npm test components/autopilot/AutopilotToggle.test.tsx
```

### API Tests

```bash
# Blog pipeline endpoints
curl http://localhost:3000/api/admin/blog/pipeline/status

# Social pipeline endpoints
curl http://localhost:3000/api/admin/social/pipeline/status
```

## 📊 Metrics & Analytics

### Tracking

- Pipeline completion rate
- Autopilot usage percentage
- Average generation time per article/post
- Publish success rate
- User engagement with pipelines

## 🚧 Toekomstige Uitbreidingen

### Fase 2: Social Media Generator

- SocialMediaStrategyGenerator component
- Platform-specifieke content optimalisatie
- Later.com/Buffer integratie
- Multi-platform posting

### Fase 3: Analytics Dashboard

- Pipeline performance metrics
- Content performance tracking
- ROI berekeningen
- A/B testing voor content

### Fase 4: AI Optimalisatie

- Auto-pauzeren bij lage performance
- Content quality scoring
- SEO ranking tracking
- Automatic content improvements

## 🐛 Known Issues

1. Social Media Pipeline komt in volgende release
2. Autopilot werkt alleen voor bestaande plans
3. Batch generatie progress real-time via polling (geen websockets)

## 📝 Changelog

### v2.0.0 - Pipeline Redesign (12-12-2024)

**Added:**
- PipelineStep component voor visuele workflow
- AutopilotToggle component met settings
- Blog pipeline status API
- Social pipeline status API (placeholder)
- Autopilot config/toggle endpoints
- Database schema voor social media
- AutopilotConfig table

**Changed:**
- Volledig herstructureerde blog management pagina
- Verwijderde verwarrende multi-optie interface
- Geïntegreerde autopilot in pipeline flow

**Removed:**
- "Website Topical Map" quick action
- "AI Contentplan" als aparte optie
- "AI Genereren" als standalone feature

## 👥 Team & Credits

- **Design:** Vereenvoudigde UX voor duidelijke workflow
- **Development:** Full-stack implementatie met Next.js, TypeScript, Supabase
- **Database:** PostgreSQL schema met RLS policies

## 🔗 Gerelateerde Documentatie

- [TOPICAL_AUTHORITY_MAP_IMPLEMENTATION.md](./TOPICAL_AUTHORITY_MAP_IMPLEMENTATION.md)
- [blog_management_redesign.md](./blog_management_redesign.md)
- [WRITGO_BUSINESSPLAN_DEFINITIEF_2025-2026.md](../Uploads/WRITGO_BUSINESSPLAN_DEFINITIEF_2025-2026.md)

---

**Status:** ✅ Implementatie Compleet  
**Laatste Update:** 12 december 2024  
**Versie:** 2.0.0
