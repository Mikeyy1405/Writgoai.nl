# Topical Authority System - Implementatie Gids

## 🎯 Overzicht

Het Topical Authority systeem is een volledig geautomatiseerd content discovery en publishing platform dat **zonder RSS feeds** werkt. Het gebruikt **AI (Perplexity via AIML API)** voor intelligente content discovery en genereert SEO-geoptimaliseerde artikelen met AI Overview optimization.

---

## ✅ Wat is Geïmplementeerd

### 1. Database Schema (5 nieuwe tabellen)

**Tabellen:**
- `writgo_topics` - 5 hoofdtopics (Google SEO, AI & SEO, WordPress, Content Marketing, Local SEO)
- `writgo_keyword_clusters` - Keyword clustering per topic
- `writgo_content_calendar` - Intelligente content planning
- `writgo_topical_authority_metrics` - Performance tracking
- `writgo_internal_links` - Internal linking tussen artikelen

**Updates:**
- `writgo_content_opportunities` - Nieuwe kolommen voor topic classificatie en scoring
- `articles` - Nieuwe kolommen voor topical authority tracking

### 2. AI-Powered Content Discovery

**Bestand:** `lib/ai-discovery.ts`

**Functies:**
- `discoverTrendingTopics()` - Ontdek trending topics met Perplexity
- `discoverContentGaps()` - Identificeer content gaps per topic
- `classifyOpportunity()` - Classificeer content in topics
- `scoreOpportunity()` - Score opportunities (0-1000)
- `generateKeywordCluster()` - Genereer keyword clusters

**API Endpoints:**
- `POST /api/writgo/discover/ai-topics` - AI topic discovery
- `POST /api/writgo/classify-and-score` - Classificeer en score opportunities
- `GET /api/writgo/classify-and-score/batch` - Batch processing

### 3. Content Planning & Scheduling

**Bestand:** `lib/content-planner.ts`

**Functies:**
- `generateContentCalendar()` - Genereer balanced content calendar
- `checkDailyLimits()` - Check daily generation limits per topic
- `selectTopicByPercentage()` - Topic selectie o.b.v. target percentages
- `selectContentType()` - Bepaal pillar/cluster/supporting type

**API Endpoints:**
- `POST /api/writgo/plan/calendar` - Genereer content calendar
- `GET /api/writgo/plan/calendar` - Haal bestaande calendar op
- `GET /api/writgo/plan/daily-limits` - Check daily limits

### 4. Enhanced Article Generation

**Bestand:** `lib/ai-article-generator.ts`

**Features:**
- AI Overview optimization (direct answers, FAQ, structured data)
- Automatische internal linking naar gerelateerde artikelen
- Schema markup (FAQ, HowTo)
- Content type specifieke lengtes (Pillar: 5000w, Cluster: 2500w, Supporting: 1500w)
- Meta description generation

**API Endpoints:**
- `POST /api/writgo/generate-article-v2` - Genereer artikel met topical authority

### 5. Dashboard UI Updates

**Components:**
- `TopicsOverview.tsx` - Visueel overzicht van alle topics met metrics

**Updates:**
- Autopilot dashboard toont nu Topics Overview bovenaan

### 6. API Endpoints

**Topics:**
- `GET /api/writgo/topics` - Haal alle topics op
- `GET /api/writgo/topics/[topicId]/metrics` - Haal metrics per topic op

---

## 🚀 Hoe Te Gebruiken

### Stap 1: Database Migratie

1. Ga naar Supabase SQL Editor:
   👉 https://supabase.com/dashboard/project/utursgxvfhhfheeoewfn/sql

2. Kopieer en plak de SQL uit:
   `supabase_topical_authority_migration.sql`

3. Voer uit - dit creëert alle tabellen en insert de 5 default topics

### Stap 2: Environment Variables

Zorg dat deze variabelen zijn ingesteld in Render:

```env
AIML_API_KEY=your_aiml_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Stap 3: Deploy

```bash
git add .
git commit -m "feat: Implement Topical Authority system with AI-powered content discovery"
git push origin main
```

Render zal automatisch deployen.

### Stap 4: Eerste Content Discovery

1. Ga naar WritGo Autopilot dashboard
2. Klik op "AI Discovery" (nieuwe knop)
3. Het systeem ontdekt automatisch trending topics
4. Opportunities worden geclassificeerd en gescoord
5. Content calendar wordt gegenereerd

---

## 🤖 Automatische Workflow

### Dagelijks (via Cron Job)

```
09:00 - AI Discovery draait
  ↓
  Ontdekt 10-20 nieuwe trending topics
  ↓
  Classificeert in 5 hoofdtopics
  ↓
  Scored opportunities (0-1000)
  ↓
  Filtert beste opportunities (score > 200)
  ↓
12:00 - Content Generation draait
  ↓
  Check daily limits per topic
  ↓
  Genereer 2-3 artikelen (balanced over topics)
  ↓
  Voeg internal links toe
  ↓
  Optimaliseer voor AI Overview
  ↓
  Voeg toe aan queue met scheduled time
  ↓
15:00 - Auto-publish draait
  ↓
  Publiceert geplande artikelen
  ↓
  Update metrics
  ↓
  Track performance
```

### Wekelijks

```
Maandag 00:00 - Content Calendar Generation
  ↓
  Genereer calendar voor komende week
  ↓
  Balance topics (40% Google, 30% AI, 20% WordPress, 10% Content Marketing)
  ↓
  Bepaal content types (Pillar → Cluster → Supporting)
  ↓
  Optimaliseer publishing times
```

---

## 📊 Content Strategy

### Topic Distribution

| Topic | Priority | Target % | Articles/Month |
|-------|----------|----------|----------------|
| Google SEO Updates | 1 | 40% | 24-36 |
| AI & SEO | 2 | 30% | 18-27 |
| WordPress SEO | 3 | 20% | 12-18 |
| Content Marketing | 4 | 10% | 6-9 |
| Local SEO | 5 | 0% | 0 (optioneel) |

**Totaal:** 60-90 artikelen/maand (was 400)

### Content Types

**Pillar Page (5000+ woorden):**
- 1 per topic
- Dekt het hele onderwerp
- Hub voor internal linking
- Hoogste priority

**Cluster Article (2500-3000 woorden):**
- 5-10 per pillar
- Diepgaand subtopic
- Links naar pillar
- Medium priority

**Supporting Content (1500-2000 woorden):**
- Specifieke vragen
- How-to guides
- Quick wins
- Lower priority

### Opportunity Scoring

**Formula:** `Priority × Relevance × Freshness × Authority`

**Factors:**
- **Priority (1-10):** Topic priority + keyword importance
- **Relevance (1-10):** Match met topic + content type
- **Freshness (1-10):** Hoe recent (< 24h = 10, > 7d = 2)
- **Authority (1-10):** Potential voor authority building

**Minimum Score:** 200/1000

**Example:**
```
Topic: Google SEO Updates (Priority 10)
Content Type: Cluster (Relevance 8)
Detected: 12 hours ago (Freshness 10)
High search volume (Authority 9)

Score = 10 × 8 × 10 × 9 = 7200 ✅ GENERATE
```

---

## 🎨 Dashboard Features

### Topics Overview

Visuele kaarten per topic met:
- Authority score (0-100)
- Artikel count (Pillar / Cluster / Total)
- Target vs Current percentage
- Color-coded status

### Content Calendar

- Kalender view van geplande content
- Filter op topic, content type, datum
- Drag & drop voor reschedule
- Bulk actions

### Performance Metrics

- Topical authority score per topic
- AI Overview appearances
- Keyword rankings per cluster
- Internal link effectiveness
- Traffic per topic

---

## 🔧 Configuratie

### Daily Limits

Aanpassen in `lib/content-planner.ts`:

```typescript
const totalMax = 3; // Max 3 articles per day
```

### Topic Percentages

Aanpassen in database:

```sql
UPDATE writgo_topics 
SET target_percentage = 50 
WHERE slug = 'google-seo-updates';
```

### Content Type Word Counts

Aanpassen in `lib/ai-article-generator.ts`:

```typescript
const wordCounts = {
  pillar: 5000,
  cluster: 2500,
  supporting: 1500
};
```

---

## 📈 Success Metrics

### Immediate (Week 1)
- ✅ 0 RSS feeds active
- ✅ 100% opportunities classified by topic
- ✅ Daily limits enforced
- ✅ AI-powered discovery working

### Short-term (Month 1)
- ✅ 60-90 articles/month (down from 400)
- ✅ 100% topic-focused content
- ✅ Pillar/cluster structure established
- ✅ Internal linking active

### Long-term (Month 6)
- ✅ Authority score > 80/100 per topic
- ✅ 50+ AI Overview appearances
- ✅ Avg position < 10 for pillar keywords
- ✅ 2+ pages per session (internal linking)
- ✅ < 50% bounce rate

---

## 🐛 Troubleshooting

### AI Discovery niet werkend

**Check:**
1. AIML_API_KEY is correct ingesteld
2. Perplexity model is beschikbaar
3. Rate limits niet overschreden

**Fix:**
```bash
# Check API key
curl https://api.aimlapi.com/v1/models \
  -H "Authorization: Bearer $AIML_API_KEY"
```

### Opportunities niet geclassificeerd

**Check:**
1. Database migratie succesvol
2. Topics tabel heeft 5 entries
3. API endpoint werkt

**Fix:**
```bash
# Run batch classification
curl -X GET https://writgo.nl/api/writgo/classify-and-score/batch
```

### Content calendar leeg

**Check:**
1. Topics hebben target_percentage > 0
2. Daily limits niet bereikt
3. Calendar generation API werkt

**Fix:**
```bash
# Generate calendar manually
curl -X POST https://writgo.nl/api/writgo/plan/calendar \
  -H "Content-Type: application/json" \
  -d '{"days": 30, "articlesPerDay": 2}'
```

---

## 📝 Volgende Stappen

### Fase 1: Testing (Week 1)
- [ ] Test AI discovery met verschillende topics
- [ ] Verifieer classificatie accuracy
- [ ] Check content calendar generation
- [ ] Test article generation met alle content types

### Fase 2: Optimization (Week 2-4)
- [ ] Fine-tune opportunity scoring
- [ ] Optimize AI prompts voor betere artikelen
- [ ] Verbeter internal linking algoritme
- [ ] A/B test publishing times

### Fase 3: Scaling (Month 2-3)
- [ ] Voeg DataForSEO API toe voor keyword data
- [ ] Implementeer automatic content refresh
- [ ] Voeg competitor analysis toe
- [ ] Implementeer automatic image generation

### Fase 4: Advanced Features (Month 4-6)
- [ ] AI-powered content optimization
- [ ] Automatic A/B testing
- [ ] Predictive analytics
- [ ] Multi-language support

---

## 🎓 Best Practices

### Content Quality

1. **Altijd review voor publish:**
   - Check facts en bronnen
   - Verifieer internal links
   - Test schema markup
   - Preview op mobile

2. **Optimize voor AI Overview:**
   - Direct answer bovenaan
   - Gebruik bullet points
   - Voeg FAQ toe
   - Structured data

3. **Internal Linking:**
   - Minimaal 3-5 links per artikel
   - Link naar pillar pages
   - Gebruik relevante anchor text
   - Vermijd over-optimization

### Performance Monitoring

1. **Wekelijks checken:**
   - Authority scores per topic
   - Content distribution (target vs actual)
   - AI Overview appearances
   - Top performing articles

2. **Maandelijks analyseren:**
   - Traffic trends per topic
   - Keyword rankings
   - Internal link effectiveness
   - Conversion rates

3. **Kwartaal optimaliseren:**
   - Update pillar pages
   - Refresh underperforming content
   - Adjust topic percentages
   - Expand successful clusters

---

## 🤝 Support

Voor vragen of problemen:
1. Check deze documentatie
2. Check `autopilot-analysis.md` voor strategie details
3. Check `topical-authority-system-design.md` voor technisch design
4. Open een issue op GitHub

---

**Versie:** 1.0.0  
**Laatste Update:** December 2024  
**Auteur:** Manus AI Agent
