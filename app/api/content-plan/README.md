# Content Plan API

**1 centrale route voor alle content plan operaties**

## `/api/content-plan/generate`

De enige content plan route die je nodig hebt.

### Features

✅ **Background job processing** - Lange operaties draaien asynchroon
✅ **Auto-enrichment** - Top 15 artikelen krijgen automatisch comprehensive details
✅ **Progress tracking** - Real-time updates (0-100%)
✅ **Cancellation support** - Jobs kunnen worden geannuleerd
✅ **Database persistence** - Alles wordt opgeslagen in Supabase

### Usage

#### 1. Start nieuwe content plan generatie

```typescript
POST /api/content-plan/generate
{
  "website_url": "https://example.com",
  "project_id": "uuid",
  "user_id": "uuid" // optioneel
}

Response:
{
  "jobId": "uuid",
  "status": "processing"
}
```

#### 2. Check job status

```typescript
GET /api/content-plan/generate?jobId=<uuid>

Response:
{
  "id": "uuid",
  "status": "processing|completed|failed|cancelled",
  "progress": 85,
  "current_step": "📝 Clusters genereren...",
  "niche": "SEO & Marketing",
  "language": "nl",
  "plan": [...],  // artikelen (beschikbaar bij completed)
  "clusters": [...],
  "stats": {
    "totalArticles": 500,
    "enrichedArticles": 15,
    "pillarPages": 10,
    "clusters": 5
  }
}
```

#### 3. Check actieve job voor project

```typescript
GET /api/content-plan/generate?projectId=<uuid>&status=processing

Response: Laatste processing/pending job voor dit project
```

#### 4. Cancel job

```typescript
DELETE /api/content-plan/generate?jobId=<uuid>

Response:
{
  "success": true,
  "message": "Job cancelled"
}
```

### Progress Steps

De job doorloopt deze stappen:

| Progress | Stap |
|----------|------|
| 0-10% | 🌍 Taal detecteren |
| 10-20% | 🔍 Website content analyseren |
| 20-25% | 🎯 Niche detecteren |
| 25-35% | 📊 Pillar topics genereren |
| 35-75% | 📝 Content clusters genereren (parallel) |
| 75-85% | 🔄 Long-tail variaties toevoegen |
| 85-95% | 📊 SEO data ophalen (DataForSEO) |
| 95-97% | 🚫 Verboden woorden filteren |
| **97-99%** | **✨ Top 15 artikelen verrijken** |
| 100% | ✅ Voltooid! |

### Auto-Enrichment

De top 15 **high-priority** en **pillar** artikelen worden automatisch verrijkt met:

- ✅ Complete outline (intro → H2/H3 → conclusie → FAQ)
- ✅ SEO strategie (keywords, PAA questions, semantic keywords)
- ✅ Content angle (hook, unique value, probleem, oplossing)
- ✅ Target persona (level, pain points, goals)
- ✅ Internal linking suggesties
- ✅ Bronnen en statistieken
- ✅ Writing guidelines (tone, word count, reading level)

### Artikel Structuur

#### Basic artikel (de overige ~485 artikelen):
```json
{
  "title": "...",
  "description": "...",
  "keywords": ["..."],
  "contentType": "guide",
  "cluster": "SEO Basics",
  "priority": "medium",
  "searchVolume": 1200,
  "competition": "low"
}
```

#### Enriched artikel (top 15):
```json
{
  "title": "...",
  "seoMetadata": {
    "focusKeyword": "seo voor beginners",
    "secondaryKeywords": ["..."],
    "semanticKeywords": ["..."],
    "longtailVariations": ["..."]
  },
  "keywordStrategy": {
    "peopleAlsoAsk": [
      "Hoe lang duurt SEO?",
      "Wat kost SEO?",
      "..."
    ]
  },
  "outline": {
    "introduction": {
      "hook": "95% van websites krijgt geen traffic...",
      "problem": "...",
      "solution": "..."
    },
    "mainSections": [
      {
        "heading": "Wat is SEO?",
        "subheadings": [
          {
            "level": 3,
            "text": "Definitie van SEO",
            "keywords": ["seo definitie", "wat is seo"],
            "contentHints": ["Leg uit wat SEO is", "Geef voorbeelden"]
          }
        ],
        "keyPoints": ["...", "...", "..."]
      }
    ],
    "faq": [
      {
        "question": "Hoe lang duurt SEO?",
        "answer": "Gemiddeld 3-6 maanden..."
      }
    ]
  },
  "internalLinking": {
    "suggestedLinks": [
      {
        "anchorText": "keyword research",
        "targetTopic": "Keyword Research Gids",
        "placement": "body",
        "reason": "Natuurlijke flow naar volgende stap"
      }
    ]
  },
  "sources": {
    "primarySources": ["Moz Beginner's Guide", "Google Search Central"],
    "statistics": ["93% van traffic komt via search (BrightEdge)"]
  }
}
```

### Error Handling

- ❌ **No website_url** → 400 Bad Request
- ❌ **Job not found** → 404 Not Found
- ❌ **Generation failed** → status: "failed", error message
- ❌ **User cancelled** → status: "cancelled"

### Database

Jobs worden opgeslagen in `content_plan_jobs` table met:
- Real-time status updates
- Progress tracking
- Error logging
- Plan results

Na completion wordt het plan ook opgeslagen in `content_plans` table.

### Performance

- **Total tijd**: ~5-8 minuten voor 500 artikelen
- **Parallel processing**: Clusters worden in batches van 5 gegenereerd
- **Enrichment**: ~300ms per artikel (15 artikelen = ~5 seconden extra)
- **Background**: Draait asynchroon, gebruiker kan wegnavigeren

### Limitations

- Max 2000 artikelen per plan
- Max 15 artikelen worden verrijkt (performance)
- Max 8 minuten total execution time (runtime limit)
- Requires DataForSEO credentials for keyword data (optioneel)
