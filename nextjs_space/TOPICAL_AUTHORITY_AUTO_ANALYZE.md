# Automatische WordPress Website Analyse & Niche Detectie

## Overzicht

Het Topical Authority systeem kan nu **volledig automatisch** werken zonder handmatige niche input. Het systeem analyseert de WordPress website automatisch en detecteert:

- ✅ **Niche** - Automatisch gedetecteerd via AI
- ✅ **Sub-niches** - 5-10 specifieke gebieden binnen de niche
- ✅ **Primary keywords** - Meest belangrijke keywords
- ✅ **Doelgroep** - Target audience identificatie
- ✅ **Content thema's** - Belangrijkste content topics
- ✅ **Bestaande content** - Alle artikelen via sitemap
- ✅ **Content gaps** - Ontbrekende topics met prioriteit

## 🚀 Nieuwe Flow

### Stap 1: Selecteer WordPress Site
Gebruiker selecteert alleen een WordPress project. Geen handmatige input meer!

### Stap 2: Automatische Analyse (Optioneel - Preview)
```typescript
POST /api/client/topical-authority/analyze-website
{
  "projectId": "abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "niche": "Piano lessen en muziekonderwijs",
    "nicheDescription": "Website gericht op piano lessen voor beginners en gevorderden...",
    "subNiches": [
      "Beginners piano",
      "Klassieke piano",
      "Jazz piano",
      "Piano theorie",
      "Piano techniek"
    ],
    "primaryKeywords": [
      "piano leren",
      "pianolessen",
      "piano spelen",
      "pianomuziek"
    ],
    "targetAudience": "Mensen die piano willen leren spelen, van beginners tot gevorderd",
    "contentThemes": [
      "Piano tutorials",
      "Muziektheorie",
      "Piano technieken",
      "Song tutorials"
    ],
    "existingTopics": [
      "Piano cursus: zo leer je zelf pianospelen",
      "Piano cursus: zo kies je de beste pianolessen"
    ],
    "existingArticleCount": 15,
    "websiteUrl": "https://example.com",
    "language": "nl",
    "contentGaps": [
      {
        "topic": "Geavanceerde piano technieken",
        "description": "Ontbrekende content over gevorderde technieken",
        "priority": 9,
        "estimatedArticles": 30,
        "keywords": ["piano techniek", "gevorderd piano"]
      }
    ]
  }
}
```

### Stap 3: Genereer Topical Authority Map (Automatisch)
```typescript
POST /api/client/topical-authority/generate-map
{
  "projectId": "abc123",
  "autoAnalyze": true,  // Gebruik automatische analyse
  "targetArticles": 450
}
```

**Of met handmatige niche (backwards compatible):**
```typescript
POST /api/client/topical-authority/generate-map
{
  "projectId": "abc123",
  "niche": "Piano lessen",  // Handmatig opgegeven
  "targetArticles": 450
}
```

## 📋 Implementatie Details

### 1. WordPress Website Analyzer Service
**Locatie:** `lib/services/wordpress-website-analyzer.ts`

**Functies:**
- `analyzeWebsite(projectId)` - Hoofdfunctie voor volledige analyse
- `detectNiche(data)` - AI-powered niche detectie
- `extractKeywords(data, niche)` - Primary keywords extractie
- `analyzeContentGaps(niche, subNiches, existingArticles)` - Gap analyse
- `prioritizeTopics(gaps, existingTopics)` - Topic prioritering

### 2. Updated Topical Authority Service
**Locatie:** `lib/services/topical-authority-service.ts`

**Nieuwe features:**
- `niche` parameter is nu **optioneel**
- Automatische website analyse als `niche` niet gegeven is
- `autoAnalyze` flag om analyse te forceren
- Website analyse data wordt gebruikt voor betere pillar generatie
- Metadata wordt opgeslagen in `TopicalAuthorityMap`

### 3. Nieuwe API Routes

#### `/api/client/topical-authority/analyze-website` (NEW)
- **Method:** POST
- **Purpose:** Preview analyse zonder map generatie
- **Input:** `{ projectId }`
- **Output:** Volledige website analyse

#### `/api/client/topical-authority/generate-map` (UPDATED)
- **Method:** POST
- **Purpose:** Genereer volledige topical authority map
- **Input:** `{ projectId, niche?, autoAnalyze?, targetArticles? }`
- **Output:** Complete map met 400-500 artikelen

## 🔄 Workflow Vergelijking

### ❌ OUD (Handmatig)
```
1. Gebruiker: "Mijn niche is: Piano lessen"
2. Systeem: Genereert map voor "Piano lessen"
3. Gebruiker: Checkt of dit klopt
4. Mogelijk: Niche is niet accuraat, opnieuw proberen
```

### ✅ NIEUW (Automatisch)
```
1. Gebruiker: "Selecteer WordPress site"
2. Systeem: Analyseert automatisch website
3. Systeem: "Gedetecteerde niche: Piano lessen en muziekonderwijs"
4. Systeem: "Gevonden: 15 bestaande artikelen"
5. Systeem: "Identificeerde 8 content gaps"
6. Gebruiker: "Genereer map" (1 click)
7. Systeem: Genereert 485 NIEUWE artikelen (filtert bestaande uit)
```

## 🎯 Content Gap Analysis

Het systeem analyseert automatisch welke topics **ontbreken** en prioriteert deze:

**Voorbeeld output:**
```json
{
  "contentGaps": [
    {
      "topic": "Piano voor beginners - basics",
      "priority": 9,
      "estimatedArticles": 40,
      "keywords": ["piano basics", "piano beginners"]
    },
    {
      "topic": "Geavanceerde piano composities",
      "priority": 7,
      "estimatedArticles": 35,
      "keywords": ["piano compositie", "klassieke muziek"]
    }
  ]
}
```

## 💾 Database Schema

De `TopicalAuthorityMap` slaat nu metadata op:
```typescript
{
  niche: "Piano lessen en muziekonderwijs",
  description: "Website gericht op piano lessen...",
  metadata: {
    autoDetected: true,
    subNiches: ["Beginners piano", "Jazz piano"],
    primaryKeywords: ["piano leren", "pianolessen"],
    targetAudience: "Mensen die piano willen leren",
    existingArticlesAnalyzed: 15
  }
}
```

## 🧪 Testing

### Test 1: Analyse alleen (preview)
```bash
curl -X POST https://writgo.nl/api/client/topical-authority/analyze-website \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"projectId": "abc123"}'
```

### Test 2: Directe map generatie (automatisch)
```bash
curl -X POST https://writgo.nl/api/client/topical-authority/generate-map \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "projectId": "abc123",
    "autoAnalyze": true,
    "targetArticles": 450
  }'
```

### Test 3: Map generatie (handmatig - backwards compatible)
```bash
curl -X POST https://writgo.nl/api/client/topical-authority/generate-map \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "projectId": "abc123",
    "niche": "Piano lessen",
    "targetArticles": 450
  }'
```

## 📊 Performance

### Tijdsduur
- **Website analyse:** ~30-60 seconden
- **Map generatie:** ~3-5 minuten (400-500 artikelen)

### API Calls
- **Homepage fetch:** 1 call
- **Sitemap parsing:** 1-5 calls (afhankelijk van sitemap structuur)
- **Article data fetch:** Max 100 artikelen (in batches van 10)
- **AI niche detectie:** 1 call (Claude Sonnet 4)
- **AI keyword extraction:** 1 call
- **AI content gaps:** 1 call
- **Map generation:** 50-100 AI calls (pillars + subtopics + articles)

### Caching
- Sitemap data wordt gecached in `WordPressSitemapCache` (7 dagen)
- DataForSEO data wordt gecached in `DataForSEOCache` (30 dagen)

## 🔒 Error Handling

### Scenario 1: Geen WordPress website
```json
{
  "error": "Project not found or no website URL configured"
}
```

### Scenario 2: Sitemap niet bereikbaar
```
Fallback: Systeem gebruikt alleen homepage data
Warning: "Could not parse sitemap, using homepage only"
```

### Scenario 3: Niche niet detecteerbaar
```json
{
  "error": "Could not auto-detect niche. Please provide niche manually."
}
```

### Scenario 4: Backwards compatibility
Als `niche` is opgegeven, werkt het systeem zoals voorheen (geen breaking changes).

## 🎨 UI Suggesties

### Wizard Flow
```
┌─────────────────────────────────────┐
│ Step 1: Selecteer WordPress Site    │
│ [Dropdown: Kies een project...]     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Step 2: Automatische Analyse...     │
│ ⏳ Website wordt geanalyseerd...    │
│ ⏳ Niche wordt gedetecteerd...      │
│ ⏳ Content wordt gescand...         │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Step 3: Analyse Resultaat            │
│                                      │
│ ✅ Gedetecteerde niche:             │
│    "Piano lessen en muziekonderwijs"│
│                                      │
│ 📊 Bestaande artikelen: 15          │
│ 🎯 Nieuwe artikelen: 485            │
│ 📈 Content gaps: 8                  │
│ 🏆 Pillar topics: 9                 │
│                                      │
│ [< Terug] [Genereer Map >]          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Step 4: Genereren...                 │
│ ⏳ Topical Authority Map wordt      │
│    gegenereerd (dit duurt 3-5 min)  │
│                                      │
│ Progress: 45% (4/9 pillars)         │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Step 5: Klaar! 🎉                   │
│                                      │
│ ✅ 485 artikelen gepland            │
│ ✅ 9 pillar topics                  │
│ ✅ 72 subtopics                     │
│                                      │
│ [Bekijk Map >]                      │
└─────────────────────────────────────┘
```

## 🚀 Voordelen

1. **Geen handmatige input** - Volledig geautomatiseerd
2. **Nauwkeurige niche detectie** - AI analyseert werkelijke content
3. **Content gap analyse** - Focus op ontbrekende topics
4. **Bestaande content filtering** - Geen duplicate voorstellen
5. **Backwards compatible** - Oude flow blijft werken
6. **Preview mode** - Gebruiker kan analyse zien voor generatie
7. **Metadata opslag** - Analyse resultaten worden opgeslagen

## 📝 Documentatie Updates Needed

- [ ] Update UI component voor wizard flow
- [ ] Update API documentatie
- [ ] Add loading states voor lange operaties
- [ ] Add progress indicators
- [ ] Add error handling UI
- [ ] Add success confirmation

## 🔮 Toekomstige Verbeteringen

1. **Competitor analysis** - Analyseer concurrent websites
2. **Trend detection** - Identificeer trending topics
3. **Seasonal planning** - Seizoensgebonden content identificatie
4. **Multi-language support** - Automatische taal detectie en multi-lingual maps
5. **Content scoring** - Score bestaande content voor quality
6. **Update suggestions** - Voorstellen voor content updates
7. **Link opportunity detection** - Identificeer internal linking opportunities
8. **Image suggestions** - Voorgestelde featured images per artikel

## ✅ Checklist

- [x] WordPress Website Analyzer Service
- [x] Updated Topical Authority Service
- [x] New API route: `/api/client/topical-authority/analyze-website`
- [x] Updated API route: `/api/client/topical-authority/generate-map`
- [x] TypeScript types en interfaces
- [x] Error handling
- [x] Logging en debugging
- [x] Build successful
- [ ] UI Implementation
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Documentation updates

---

**Status:** ✅ Backend Implementation Complete
**Next Steps:** UI Implementation & Testing
