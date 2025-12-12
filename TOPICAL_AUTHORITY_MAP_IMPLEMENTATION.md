# Topical Authority Map Generator - Implementatie Documentatie

## 📋 Overzicht

De Topical Authority Map Generator is een geavanceerde feature die WritGo.nl klanten in staat stelt om grote, gestructureerde content strategieën te genereren met 100-500 artikelen in een pillar/cluster architectuur.

**Status:** ✅ VOLTOOID
**Versie:** 1.0.0
**Datum:** December 12, 2025

## 🎯 Features

### 1. Topical Authority Map Structuur
- **Pillar Pages:** Hoofdonderwerpen (2000-3000 woorden)
- **Cluster Artikelen:** Ondersteunende content (1000-1500 woorden)
- **Ratio Configuratie:** 1:5, 1:8, 1:10, 1:12 (pillar:cluster)
- **Schaal:** 50-500 artikelen per map

### 2. AI-Gestuurde Generatie
- Volledige keyword coverage analyse
- SEO-geoptimaliseerde titels en content
- Logische content hiërarchie
- Automatische interne linking suggesties
- Content type diversiteit

### 3. Batch Processing Systeem
- Achtergrond processing met queue
- Real-time progress tracking
- Pause/Resume functionaliteit
- Error handling & retry logic
- ETA berekening

### 4. Advanced UI
- Tree view voor pillar/cluster visualisatie
- Table view voor overzicht
- Real-time progress updates
- Mobile-responsive design
- Statistieken dashboard

## 📁 Bestandsstructuur

```
writgoai_app/
├── supabase/migrations/
│   └── 20251212_topical_authority_map_tables.sql  # Database schema
├── nextjs_space/
│   ├── lib/
│   │   ├── prisma-shim.ts                         # +3 nieuwe tabel mappings
│   │   └── topical-authority-ai-service.ts        # AI service voor map generatie
│   ├── app/api/admin/blog/topical-map/
│   │   ├── generate/route.ts                      # POST - Genereer map structuur
│   │   ├── list/route.ts                          # GET - Lijst van maps
│   │   ├── [id]/
│   │   │   ├── route.ts                           # GET/DELETE - Map details
│   │   │   ├── start-generation/route.ts          # POST - Start batch generatie
│   │   │   ├── progress/route.ts                  # GET - Progress tracking
│   │   │   └── pause/route.ts                     # POST - Pause generatie
│   ├── components/blog/
│   │   └── TopicalAuthorityMapGenerator.tsx       # Hoofdcomponent
│   └── app/admin/blog/
│       └── page.tsx                               # +Integratie in blog management
```

## 🗄️ Database Schema

### TopicalAuthorityMap
```sql
- id (TEXT, PRIMARY KEY)
- clientId (TEXT, FK -> Client)
- name (TEXT)
- niche (TEXT)
- targetAudience (TEXT)
- language (TEXT, default: 'nl')
- tone (TEXT, default: 'professioneel')
- keywords (TEXT[])
- totalArticles (INTEGER)         -- 50-500
- pillarCount (INTEGER)
- clusterCount (INTEGER)
- pillarClusterRatio (TEXT)       -- e.g., "1:10"
- status (TEXT)                   -- planning, generating, completed, failed, paused
- generationProgress (INTEGER)    -- 0-100%
- articlesGenerated (INTEGER)
- articlesFailed (INTEGER)
- currentBatchId (TEXT)
- createdAt (TIMESTAMPTZ)
- updatedAt (TIMESTAMPTZ)
- completedAt (TIMESTAMPTZ)
```

### TopicalMapArticle
```sql
- id (TEXT, PRIMARY KEY)
- mapId (TEXT, FK -> TopicalAuthorityMap)
- title (TEXT)
- description (TEXT)
- type (TEXT)                     -- 'pillar' or 'cluster'
- parentId (TEXT, FK -> TopicalMapArticle)  -- Voor clusters
- primaryKeyword (TEXT)
- secondaryKeywords (TEXT[])
- contentType (TEXT)
- wordCount (INTEGER)
- difficultyLevel (TEXT)          -- beginner, intermediate, advanced
- internalLinks (TEXT[])
- status (TEXT)                   -- pending, generating, generated, published, failed
- blogPostId (TEXT, FK -> BlogPost)
- scheduledDate (TIMESTAMPTZ)
- priority (INTEGER)
- order (INTEGER)
- errorMessage (TEXT)
- retryCount (INTEGER)
- createdAt (TIMESTAMPTZ)
- updatedAt (TIMESTAMPTZ)
- generatedAt (TIMESTAMPTZ)
```

### BatchJob
```sql
- id (TEXT, PRIMARY KEY)
- mapId (TEXT, FK -> TopicalAuthorityMap)
- type (TEXT)                     -- 'article_generation'
- status (TEXT)                   -- queued, processing, completed, failed, paused
- totalItems (INTEGER)
- completedItems (INTEGER)
- failedItems (INTEGER)
- progressPercentage (INTEGER)    -- 0-100
- etaMinutes (INTEGER)
- startedAt (TIMESTAMPTZ)
- completedAt (TIMESTAMPTZ)
- pausedAt (TIMESTAMPTZ)
- errorLog (JSONB)
- batchSize (INTEGER)             -- Artikelen per batch (default: 20)
- currentBatch (INTEGER)
- totalBatches (INTEGER)
- createdAt (TIMESTAMPTZ)
- updatedAt (TIMESTAMPTZ)
```

## 🚀 Installatie & Setup

### 1. Database Migratie

**Voer uit in Supabase SQL Editor:**

```bash
# 1. Open Supabase Dashboard
# 2. Ga naar SQL Editor
# 3. Plak de inhoud van:
/home/ubuntu/writgoai_app/supabase/migrations/20251212_topical_authority_map_tables.sql

# 4. Voer uit
```

**Verificatie:**
```sql
-- Check of tabellen bestaan
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('TopicalAuthorityMap', 'TopicalMapArticle', 'BatchJob');

-- Should return 3 rows
```

### 2. Code Deployment

```bash
cd /home/ubuntu/writgoai_app

# Check status
git status

# Add nieuwe bestanden
git add .

# Commit
git commit -m "feat: Add Topical Authority Map Generator with batch system

- Add database schema for TopicalAuthorityMap, TopicalMapArticle, BatchJob
- Implement AI service for topical authority map generation
- Add API endpoints for map generation and batch processing
- Create TopicalAuthorityMapGenerator UI component
- Integrate into blog management page
- Support 100-500 article generation with pillar/cluster structure
- Real-time progress tracking with pause/resume
- Tree view and table view for map visualization"

# Push
git push origin main
```

## 📖 Gebruiksinstructies

### Voor Klanten

1. **Toegang**
   - Ga naar Admin Dashboard → Blog Management
   - Klik op "🔥 Topical Authority Map" knop

2. **Configuratie**
   - **Map Naam:** Geef je map een herkenbare naam
   - **Aantal Artikelen:** Kies tussen 50-500 artikelen
   - **Pillar/Cluster Ratio:** Standaard 1:10 (aanbevolen)
   - **Niche:** Bijvoorbeeld "yoga", "marketing", "gezondheid"
   - **Doelgroep:** Bijvoorbeeld "beginners", "professionals"
   - **Taal:** Nederlands, Engels, Duits, Frans
   - **Tone:** Professioneel, Casual, Informatief, etc.
   - **Keywords (optioneel):** Hoofdkeywords gescheiden door komma's

3. **Map Genereren**
   - Klik op "Genereer Topical Authority Map"
   - Wacht 1-2 minuten terwijl AI de structuur genereert
   - Review de gegenereerde pillar pages en cluster artikelen

4. **Preview Bekijken**
   - **Tree View:** Hierarchische weergave van pillar → clusters
   - **Table View:** Overzicht in tabel vorm
   - Bekijk statistieken (totaal, pillars, clusters, keywords)
   - Geschatte publicatie tijd bij 3x/week

5. **Batch Generatie Starten**
   - Klik op "Start Batch Generatie"
   - Bevestig (kan uren duren!)
   - Real-time progress tracking
   - Optie om te pauzeren indien nodig

6. **Progress Volgen**
   - Voortgangsbalk met percentage
   - Aantal gegenereerde artikelen
   - Aantal mislukte artikelen
   - Geschatte resterende tijd
   - Je kunt de pagina sluiten - generatie gaat door

7. **Voltooiing**
   - Notificatie bij voltooiing
   - Alle artikelen beschikbaar als draft
   - Bekijk, bewerk en publiceer via blog management

## 🔧 API Endpoints

### 1. Generate Map Structure
```http
POST /api/admin/blog/topical-map/generate

Body:
{
  "name": "Complete Yoga Authority Map 2025",
  "niche": "yoga",
  "targetAudience": "beginners",
  "language": "nl",
  "tone": "informatief",
  "keywords": "yoga oefeningen, meditatie, mindfulness",
  "totalArticles": 100,
  "pillarClusterRatio": "1:10"
}

Response:
{
  "success": true,
  "map": {
    "id": "uuid",
    "name": "Complete Yoga Authority Map 2025",
    "totalArticles": 100,
    "pillarCount": 9,
    "clusterCount": 91,
    "estimatedTimeWeeks": 33,
    "keywordCoverage": 450
  },
  "articles": [...]
}
```

### 2. List All Maps
```http
GET /api/admin/blog/topical-map/list

Response:
{
  "success": true,
  "maps": [
    {
      "id": "uuid",
      "name": "Map Name",
      "niche": "yoga",
      "totalArticles": 100,
      "status": "completed",
      "generationProgress": 100,
      "stats": {
        "total": 100,
        "pending": 0,
        "generated": 95,
        "published": 5,
        "failed": 0
      }
    }
  ]
}
```

### 3. Get Map Details
```http
GET /api/admin/blog/topical-map/:id

Response:
{
  "success": true,
  "map": { ... },
  "articles": [ ... ],
  "currentBatch": { ... }
}
```

### 4. Start Batch Generation
```http
POST /api/admin/blog/topical-map/:id/start-generation

Body:
{
  "batchSize": 20,
  "selectedArticleIds": [] // optional, empty = all pending
}

Response:
{
  "success": true,
  "message": "Batch generation started",
  "batchJob": {
    "id": "uuid",
    "totalItems": 100,
    "totalBatches": 5,
    "batchSize": 20
  }
}
```

### 5. Get Progress
```http
GET /api/admin/blog/topical-map/:id/progress

Response:
{
  "success": true,
  "mapStatus": "generating",
  "progress": {
    "percentage": 45,
    "articlesGenerated": 45,
    "articlesFailed": 2,
    "totalArticles": 100,
    "etaMinutes": 55
  },
  "articleStats": { ... },
  "batchJob": { ... },
  "isGenerating": true,
  "canResume": false,
  "canStart": false
}
```

### 6. Pause Generation
```http
POST /api/admin/blog/topical-map/:id/pause

Response:
{
  "success": true,
  "message": "Generation paused. Current batch will complete."
}
```

### 7. Delete Map
```http
DELETE /api/admin/blog/topical-map/:id

Response:
{
  "success": true,
  "message": "Map deleted successfully"
}
```

## 🧪 Testing Checklist

### Pre-Deployment Tests
- [✅] Database migratie succesvol uitgevoerd
- [✅] Next.js build zonder errors
- [✅] TypeScript types correct
- [✅] Alle imports resolved

### Functionele Tests
- [ ] Map generatie met 50 artikelen (klein test)
- [ ] Tree view correcte hierarchie
- [ ] Table view alle artikelen zichtbaar
- [ ] Batch generatie start correct
- [ ] Progress tracking updates elke 3 seconden
- [ ] Pause functionaliteit werkt
- [ ] Error handling bij AI failures
- [ ] Blog posts worden correct aangemaakt
- [ ] Pillar → Cluster linking correct

### Performance Tests
- [ ] 100 artikelen generatie compleet
- [ ] 200 artikelen generatie compleet (optioneel)
- [ ] Memory usage acceptabel tijdens batch
- [ ] Database queries geoptimaliseerd

### UI/UX Tests
- [ ] Mobile responsive design
- [ ] Loading states correct
- [ ] Error messages duidelijk
- [ ] Success feedback aanwezig
- [ ] Navigation logisch

## ⚠️ Bekende Beperkingen

1. **Rate Limiting**
   - AI API heeft rate limits
   - Batch size: max 20 artikelen parallel
   - Delay tussen batches: 2 seconden

2. **Timeout Considerations**
   - API timeout: 5 minuten (maxDuration: 300)
   - Zeer grote maps (400-500) kunnen meerdere uren duren

3. **Background Processing**
   - Momenteel in-memory processing
   - **Productie:** Gebruik Bull/BullMQ voor robuuste queue

4. **Browser Requirements**
   - SSE (Server-Sent Events) support nodig
   - Modern browser (Chrome, Firefox, Safari, Edge)

5. **Concurrent Generation**
   - Max 1 actieve batch per map tegelijk
   - Multiple maps kunnen parallel

## 🔮 Toekomstige Verbeteringen

### Short-term (Fase 2)
- [ ] Email notificaties bij voltooiing
- [ ] Export naar CSV/JSON
- [ ] Template library voor populaire niches
- [ ] Bulk edit functionaliteit voor artikelen
- [ ] Internal linking automation

### Mid-term (Fase 3)
- [ ] Migratie naar Bull/BullMQ voor productie
- [ ] Redis cache voor AI responses
- [ ] Scheduled publishing automation
- [ ] A/B testing voor titels
- [ ] SEO score calculator per artikel

### Long-term (Fase 4)
- [ ] Multi-language generation in één keer
- [ ] Competitor analysis integratie
- [ ] Keyword research tools integratie
- [ ] Auto-update content strategie (AI refactoring)
- [ ] Analytics dashboard voor published maps

## 🐛 Troubleshooting

### Map generatie mislukt
**Symptoom:** Error bij genereren map structuur
**Oplossing:**
1. Check AI API credits
2. Verify database connectie
3. Check logs: `/api/admin/blog/topical-map/generate`
4. Reduce totalArticles voor test (50)

### Batch generatie stopt
**Symptoom:** Progress stopt met updaten
**Oplossing:**
1. Check background processing logs
2. Verify database schrijfrechten
3. Check `BatchJob.status` in database
4. Restart generatie met pending artikelen

### UI updates niet
**Symptoom:** Progress bar beweegt niet
**Oplossing:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Check console voor JavaScript errors
3. Verify SSE connection
4. Check polling interval (3 seconds)

### Artikelen hebben geen content
**Symptoom:** BlogPost aangemaakt maar content leeg
**Oplossing:**
1. Check `TopicalMapArticle.errorMessage`
2. Verify AI service response
3. Check token limits (max_tokens: 8000)
4. Retry failed artikelen

## 📊 Metrics & Monitoring

### Key Metrics
- Gemiddelde generatie tijd per artikel
- Success rate batch processing
- AI API response times
- Database query performance
- Error rate per component

### Logging Locations
- **API Logs:** Browser console + Server console
- **Background Processing:** Server console
- **Database Errors:** `BatchJob.errorLog` (JSONB)
- **Article Errors:** `TopicalMapArticle.errorMessage`

## 👥 Support & Contact

**Vragen over implementatie:**
- Email: dev@writgo.nl
- Documentation: `/home/ubuntu/writgoai_app/TOPICAL_AUTHORITY_MAP_IMPLEMENTATION.md`

**Bug Reports:**
- GitHub Issues
- Direct via development team

---

**Laatste Update:** December 12, 2025
**Versie:** 1.0.0
**Status:** ✅ Production Ready (na testing)
