# Topical Authority System - Complete Gids

## 📖 Overzicht

Het Topical Authority systeem is een professionele content planning tool die automatisch complete content strategieën genereert met 400-500 gestructureerde artikelen voor dominate topical authority in elke niche.

### ✨ Key Features

- **Automatische Map Generatie**: Genereer complete topical authority maps met 400-500 artikelen
- **Pillar-Cluster Model**: Gestructureerde hiërarchie (Pillars → Subtopics → Articles)
- **DataForSEO Integratie**: Real-time keyword metrics (search volume, difficulty, CPC)
- **WordPress Sitemap Parser**: Analyseer bestaande content voor content gaps
- **Slimme Internal Links**: Automatische suggesties voor interne linking
- **Priority Scoring**: Intelligente prioritering van artikelen
- **Content Scheduler**: Plan en schedule artikel publicatie
- **Visual Dashboard**: Overzichtelijk dashboard met voortgang tracking

---

## 🏗️ Architectuur

### Database Schema

#### TopicalAuthorityMap
Hoofd tabel voor topical authority maps (1 per project/niche).

```sql
CREATE TABLE "TopicalAuthorityMap" (
  "id" TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "niche" TEXT NOT NULL,
  "description" TEXT,
  "totalArticlesTarget" INTEGER DEFAULT 400,
  "totalArticlesPlanned" INTEGER DEFAULT 0,
  "totalArticlesGenerated" INTEGER DEFAULT 0,
  "totalArticlesPublished" INTEGER DEFAULT 0,
  "status" TEXT DEFAULT 'draft', -- draft, active, completed
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now()
);
```

#### PillarTopic
Core pillar topics (5-10 per map).

```sql
CREATE TABLE "PillarTopic" (
  "id" TEXT PRIMARY KEY,
  "mapId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "keywords" TEXT[],
  "searchVolume" INTEGER DEFAULT 0,
  "difficulty" INTEGER DEFAULT 50,
  "priority" INTEGER DEFAULT 5, -- 1-10
  "order" INTEGER NOT NULL,
  "status" TEXT DEFAULT 'planned'
);
```

#### Subtopic
Subtopics die pillars ondersteunen (40-50 per pillar).

```sql
CREATE TABLE "Subtopic" (
  "id" TEXT PRIMARY KEY,
  "pillarId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "keywords" TEXT[],
  "searchVolume" INTEGER DEFAULT 0,
  "difficulty" INTEGER DEFAULT 50,
  "priority" INTEGER DEFAULT 5,
  "order" INTEGER NOT NULL,
  "status" TEXT DEFAULT 'planned'
);
```

#### PlannedArticle
Individuele artikelen (8-10 per subtopic = 400-500 totaal).

```sql
CREATE TABLE "PlannedArticle" (
  "id" TEXT PRIMARY KEY,
  "subtopicId" TEXT,
  "pillarId" TEXT,
  "mapId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "keywords" TEXT[],
  "focusKeyword" TEXT,
  "contentType" TEXT DEFAULT 'cluster', -- pillar, cluster, supporting
  "articleType" TEXT DEFAULT 'blog-post', -- blog-post, how-to, guide, listicle, review, comparison
  "priority" INTEGER DEFAULT 5,
  "wordCountTarget" INTEGER DEFAULT 1500,
  "searchIntent" TEXT DEFAULT 'informational',
  "status" TEXT DEFAULT 'planned', -- planned, generating, generated, published
  "scheduledDate" TIMESTAMP,
  "dataForSEO" JSONB DEFAULT '{}',
  "internalLinks" JSONB DEFAULT '[]',
  "savedContentId" TEXT,
  "publishedUrl" TEXT
);
```

---

## 🚀 Usage

### 1. Setup Database

Voer de migration uit:

```bash
cd nextjs_space
# Voer migration uit via Supabase
```

### 2. Configureer DataForSEO (Optioneel)

Voor keyword metrics, stel DataForSEO API credentials in:

```env
# .env.local
DATAFORSEO_LOGIN=your_login
DATAFORSEO_PASSWORD=your_password
```

### 3. Genereer een Topical Authority Map

#### Via UI:
1. Ga naar `/client-portal/topical-authority`
2. Klik op "Nieuwe Map"
3. Vul de wizard in:
   - **Niche**: b.v. "WordPress SEO"
   - **Beschrijving**: Extra context
   - **Aantal Artikelen**: 400-500 (aanbevolen)
   - **Opties**: DataForSEO, WordPress analyse
4. Klik op "Genereer Map"

#### Via API:
```typescript
const response = await fetch('/api/client/topical-authority/generate-map', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'project-id',
    niche: 'WordPress SEO',
    description: 'Complete SEO gids voor WordPress websites',
    targetArticles: 450,
    useDataForSEO: true,
    analyzeExistingContent: true,
    location: 'Netherlands',
    language: 'nl',
  }),
});
```

### 4. Bekijk de Map

Na generatie kun je de map bekijken:

```typescript
// Haal alle maps op voor een project
const maps = await fetch('/api/client/topical-authority/maps?projectId=project-id');

// Haal een specifieke map op
const map = await fetch('/api/client/topical-authority/map/map-id');
```

### 5. Genereer Artikelen

#### Vanuit Dashboard:
1. Open de map details (`/client-portal/topical-authority/[mapId]`)
2. Expand een pillar en subtopic
3. Klik op "Genereer" bij een artikel
4. Je wordt doorgestuurd naar de content generator met pre-filled data

#### Via API:
```typescript
const response = await fetch('/api/client/topical-authority/generate-article', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    articleId: 'article-id',
  }),
});

// Response bevat artikel data voor generatie
const { title, keywords, focusKeyword, internalLinks, dataForSEO } = response.data;
```

---

## 🔧 Services & Libraries

### 1. TopicalAuthorityService (`lib/services/topical-authority-service.ts`)

Core service voor map generatie en management.

```typescript
import { TopicalAuthorityService } from '@/lib/services/topical-authority-service';

// Genereer complete map
const result = await TopicalAuthorityService.generateMap({
  projectId: 'project-id',
  clientId: 'client-id',
  niche: 'WordPress SEO',
  targetArticles: 450,
  useDataForSEO: true,
  analyzeExistingContent: true,
});

// Haal map op
const map = await TopicalAuthorityService.getMap('map-id');

// Haal artikelen op voor generatie (gesorteerd op prioriteit)
const articles = await TopicalAuthorityService.getArticlesForGeneration('map-id', 10);

// Update artikel status
await TopicalAuthorityService.updateArticleStatus('article-id', 'generated', {
  savedContentId: 'content-id',
  publishedUrl: 'https://...',
  generatedAt: new Date(),
});
```

### 2. DataForSEO API (`lib/dataforseo-api.ts`)

Keyword research en SERP analysis.

```typescript
import { DataForSEO } from '@/lib/dataforseo-api';

// Check of DataForSEO geconfigureerd is
const isConfigured = DataForSEO.isConfigured();

// Haal keyword data op (met caching)
const keywordData = await DataForSEO.getKeywordData('wordpress seo', 'Netherlands', 'nl');
// Returns: { searchVolume, difficulty, cpc, competition, competitionLevel }

// Batch keyword data (tot 100 keywords)
const batchData = await DataForSEO.getBatchKeywordData({
  keywords: ['wordpress seo', 'seo plugin', 'yoast seo'],
  location: 'Netherlands',
  language: 'nl',
});

// Related keywords en questions
const related = await DataForSEO.getRelatedKeywords('wordpress seo');
// Returns: { relatedKeywords: [...], questions: [...] }

// SERP analysis
const serpData = await DataForSEO.getSerpData('wordpress seo');
// Returns: { topResults, serpFeatures, peopleAlsoAsk, relatedSearches }

// Competition analysis
const competition = await DataForSEO.getCompetitionAnalysis('wordpress seo');
// Returns: { topCompetitors, averageDifficulty, quickWins }

// Find quick wins (low difficulty + high volume)
const quickWins = await DataForSEO.findQuickWins([...keywords]);
```

### 3. WordPress Sitemap Parser (`lib/wordpress-sitemap-parser.ts`)

Parse WordPress sitemaps voor content gap analysis en internal links.

```typescript
import { WordPressSitemapParser } from '@/lib/wordpress-sitemap-parser';

// Parse sitemap
const result = await WordPressSitemapParser.parse('https://example.com');
// Returns: { totalUrls, articles, categories, lastScanned }

// Cache sitemap data
await WordPressSitemapParser.cache('project-id', result.articles);

// Haal cached data op
const cached = await WordPressSitemapParser.getCached('project-id');

// Find internal links voor een nieuw artikel
const internalLinks = await WordPressSitemapParser.findInternalLinks(
  'project-id',
  'WordPress SEO Tips for 2024',
  ['wordpress', 'seo', 'tips'],
  'Optional article content snippet...'
);
// Returns: [{ url, title, anchorText, relevanceScore, context }]

// Find related articles (keyword-based)
const related = await WordPressSitemapParser.findRelatedArticles(
  'project-id',
  ['wordpress', 'seo'],
  ['SEO', 'WordPress'],
  10
);
```

---

## 📊 Map Generation Process

### Stap 1: Pillar Topics Generatie (5-10 pillars)

```
Input: Niche ("WordPress SEO")
↓
AI Analysis (Claude Sonnet 4)
↓
Output: 
  - "SEO Basics" (pillar)
  - "Technical SEO" (pillar)
  - "Content Optimization" (pillar)
  - "Link Building" (pillar)
  - "Local SEO" (pillar)
```

### Stap 2: Subtopics Generatie (40-50 per pillar)

```
Input: Pillar ("SEO Basics")
↓
AI Analysis
↓
Output:
  - "On-Page SEO Techniques" (subtopic)
  - "Meta Tags Optimization" (subtopic)
  - "URL Structure Best Practices" (subtopic)
  - ... (40-50 subtopics total)
```

### Stap 3: Articles Generatie (8-10 per subtopic)

```
Input: Subtopic ("On-Page SEO Techniques")
↓
AI Analysis
↓
Output:
  - "How to Optimize Page Titles for SEO" (article)
  - "The Complete Guide to Header Tags (H1-H6)" (article)
  - "Image Alt Text: Best Practices for SEO" (article)
  - ... (8-10 articles per subtopic)
```

### Stap 4: DataForSEO Enrichment (optioneel)

Voor elk artikel:
```
Focus Keyword: "wordpress seo meta tags"
↓
DataForSEO API Call
↓
Metrics:
  - Search Volume: 1,200
  - Difficulty: 45
  - CPC: €1.20
  - Competition: 0.6 (medium)
```

### Stap 5: Internal Links Suggestions

Voor elk artikel:
```
Article: "How to Optimize Page Titles"
↓
WordPress Sitemap Analysis
↓
Suggested Links:
  - "SEO Title Tag Length" (rel. score: 92)
  - "WordPress Yoast Plugin Guide" (rel. score: 85)
  - "Meta Description Best Practices" (rel. score: 78)
```

---

## 🎨 UI Components

### Dashboard (`/client-portal/topical-authority`)

- **Map Grid**: Overzicht van alle maps met progress bars
- **Create Wizard**: Modal voor nieuwe map creation
- **Stats**: Target, Planned, Generated, Published counts

### Map Detail (`/client-portal/topical-authority/[mapId]`)

- **Map Header**: Niche, beschrijving, overall progress
- **Pillar Tree**: Expandable tree structure
  - Pillar Topics (level 1)
  - Subtopics (level 2)
  - Articles (level 3)
- **Article Actions**: 
  - "Genereer" button (planned articles)
  - "Bekijk" link (published articles)

---

## 🔗 API Routes

### Map Generation

```
POST /api/client/topical-authority/generate-map
Body: { projectId, niche, description, targetArticles, useDataForSEO, analyzeExistingContent }
Response: { success, data: { mapId, pillars, totalArticles, estimatedTimeToComplete } }
```

### Map Retrieval

```
GET /api/client/topical-authority/maps?projectId=xxx
Response: { success, data: [maps] }

GET /api/client/topical-authority/map/[mapId]
Response: { success, data: { map with pillars, subtopics, articles } }
```

### Article Management

```
GET /api/client/topical-authority/articles?mapId=xxx&limit=10
Response: { success, data: [articles with internal link suggestions] }

POST /api/client/topical-authority/generate-article
Body: { articleId }
Response: { success, data: { article data for generation } }
```

### WordPress Integration

```
POST /api/client/topical-authority/wordpress-sitemap
Body: { projectId, websiteUrl }
Response: { success, data: { totalUrls, articlesCached, categories } }
```

### DataForSEO Integration

```
POST /api/client/topical-authority/dataforseo/keywords
Body: { keywords: [], location, language }
Response: { success, data: [keyword data] }

POST /api/client/topical-authority/dataforseo/serp
Body: { keyword, location, language }
Response: { success, data: { serpData } }
```

---

## 📈 Best Practices

### 1. Niche Selection

✅ **Goed**: "WordPress SEO for E-commerce"
❌ **Slecht**: "SEO" (te breed)

✅ **Goed**: "Piano Leren voor Beginners"
❌ **Slecht**: "Muziek" (te breed)

### 2. Target Articles

- **100-200**: Small niche (basic authority)
- **400-500**: Medium niche (strong authority) ⭐ Aanbevolen
- **800-1000**: Large niche (complete domination)

### 3. Content Types Distribution

- **Pillar Content** (2%): 3000-5000 woorden, comprehensive guides
- **Cluster Content** (70%): 1500-2500 woorden, focused articles
- **Supporting Content** (28%): 800-1500 woorden, specific topics

### 4. Priority Scoring

Artikelen worden automatisch gescoord op:
- **Keyword Metrics**: Search volume, difficulty, CPC
- **Competition**: Number of competitors, domain ratings
- **Content Gaps**: Existing content analysis
- **Search Intent**: Match met doelgroep fase

Sorteer altijd op priority bij generatie!

### 5. Internal Linking Strategy

- **Minimum**: 5-10 interne links per artikel
- **Structuur**: 
  - Link naar pillar page
  - Link naar related subtopics
  - Link naar supporting articles
- **Anchor Texts**: Natuurlijke, contextual anchor texts

### 6. Publishing Schedule

Voor 450 artikelen:
- **Dagelijks (1 artikel/dag)**: 15 maanden
- **5 per week**: 18 maanden
- **3 per week**: 30 maanden

Consistentie is belangrijker dan snelheid!

---

## 🐛 Troubleshooting

### DataForSEO Niet Geconfigureerd

**Symptom**: Keyword metrics ontbreken (search volume = 0, difficulty = 50)

**Solution**: 
1. Check `.env.local` voor `DATAFORSEO_LOGIN` en `DATAFORSEO_PASSWORD`
2. Verify credentials op https://app.dataforseo.com/
3. Restart Next.js server

### WordPress Sitemap Parse Error

**Symptom**: "No sitemap found at any standard location"

**Solution**:
1. Check of WordPress site een sitemap heeft:
   - `/sitemap.xml`
   - `/sitemap_index.xml`
   - `/wp-sitemap.xml`
2. Voor Yoast SEO: Enable XML sitemaps in settings
3. Voor RankMath: Enable sitemap module
4. Check robots.txt voor sitemap URL

### Map Generatie Te Lang Duurt

**Symptom**: Request timeout na 30+ seconden

**Solution**:
1. Reduce `targetArticles` (start met 200-300)
2. Disable `analyzeExistingContent` voor eerste test
3. Disable `useDataForSEO` voor snellere generatie
4. Check AI API rate limits

### Duplicate Articles

**Symptom**: Artikelen met vergelijkbare titels

**Solution**:
1. AI temperature is te hoog (verlaag naar 0.6-0.7)
2. Niche te smal (overweeg breder onderwerp)
3. Regenereer specifieke subtopic met nieuwe prompt

---

## 🧪 Testing

### Unit Tests

```bash
# Test DataForSEO API
npm test lib/dataforseo-api.test.ts

# Test WordPress Sitemap Parser
npm test lib/wordpress-sitemap-parser.test.ts

# Test Topical Authority Service
npm test lib/services/topical-authority-service.test.ts
```

### Integration Tests

```bash
# Test complete map generation flow
npm test integration/topical-authority-flow.test.ts
```

### Manual Testing Checklist

- [ ] Create nieuwe map via UI
- [ ] Verify pillars gegenereerd (5-10)
- [ ] Verify subtopics per pillar (40-50)
- [ ] Verify articles per subtopic (8-10)
- [ ] Check DataForSEO metrics (if enabled)
- [ ] Verify internal link suggestions
- [ ] Test article generation via UI
- [ ] Check WordPress sitemap parsing

---

## 📚 References

### Research Links

1. [DOK Online - Topical Authority Guide](https://dokonline.nl/seo/topical-authority/)
2. [Surfer SEO - Topical Authority Template](https://surferseo.com/blog/topical-authority-template/)
3. [Shopify - Building Topical Authority](https://www.shopify.com/blog/topical-authority)

### Related Documentation

- [Content Plan Service](./lib/services/content-plan-service.ts)
- [AI Utils](./lib/ai-utils.ts)
- [Database Schema](./supabase/migrations/20241217000000_topical_authority.sql)

---

## 🎯 Roadmap

### Phase 1: Core System ✅
- [x] Database schema
- [x] Map generation service
- [x] DataForSEO integration
- [x] WordPress sitemap parser
- [x] API routes
- [x] UI dashboard

### Phase 2: Enhanced Features (Toekomst)
- [ ] Auto-scheduling met calendar view
- [ ] Bulk article generation
- [ ] Auto-pilot mode (dagelijkse publicatie)
- [ ] Topic trend analysis
- [ ] Competitor content gap analysis
- [ ] AI-powered keyword clustering
- [ ] Visual map editor (drag & drop)
- [ ] Export to CSV/Excel

### Phase 3: Advanced Analytics (Toekomst)
- [ ] Google Search Console integration
- [ ] Traffic analysis per pillar/subtopic
- [ ] ROI tracking
- [ ] Topical authority score
- [ ] Rank tracking per article
- [ ] Internal link health monitoring

---

## 🤝 Contributing

Voor vragen of improvements:

1. Check [GitHub Issues](https://github.com/writgoai/issues)
2. Create nieuwe issue met label `topical-authority`
3. Submit PR met duidelijke beschrijving

---

## 📝 Changelog

### v1.0.0 (2024-12-17)
- ✨ Initial release
- ✨ Complete topical authority map generation
- ✨ DataForSEO integration
- ✨ WordPress sitemap parsing
- ✨ Visual dashboard
- ✨ API routes
- ✨ Internal link suggestions

---

**Made with ❤️ for WritGo.nl**
