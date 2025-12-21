# WritGo Autopilot Analyse - Huidige Staat

## 📋 Huidige Implementatie

### Database Schema

**Tabellen:**
1. `writgo_autopilot_config` - Configuratie instellingen
2. `writgo_content_triggers` - RSS feeds en triggers
3. `writgo_content_opportunities` - Gedetecteerde content kansen
4. `writgo_content_queue` - Geplande artikelen
5. `writgo_activity_logs` - Activiteit logging
6. `writgo_research_cache` - Research cache
7. `articles` - Gepubliceerde artikelen

### Huidige Workflow

```
RSS Feeds → Content Opportunities → Generate Article → Queue → Publish
```

**Probleem**: Volledig afhankelijk van RSS feeds, geen intelligente topical authority strategie.

---

## 🎯 Topical Authority Strategie (uit TOPICAL_AUTHORITY_STRATEGY.md)

### Core Principes

**Van**: 400 artikelen/maand (random topics)  
**Naar**: 60-90 artikelen/maand (gefocust op 3-5 topics)

### Prioriteit Topics

1. **Google SEO Updates** (Priority 1) - 40% van content
2. **AI & SEO** (Priority 2) - 30% van content  
3. **WordPress SEO** (Priority 3) - 20% van content
4. **Content Marketing** (Priority 4) - 10% van content
5. **Local SEO** (Priority 5) - Optioneel

### Content Structuur

**Pillar Page Model:**
```
PILLAR PAGE (5000+ woorden)
├─ Cluster Article 1 (2500-3000 woorden)
├─ Cluster Article 2 (2500-3000 woorden)
├─ Cluster Article 3 (2500-3000 woorden)
└─ Supporting Content (1500-2000 woorden)
```

### Opportunity Scoring Systeem

**Score = Priority × Relevance × Freshness × Authority Potential**

- **Priority** (1-10): Hoe belangrijk is het onderwerp?
- **Relevance** (1-10): Past het bij onze pillar topics?
- **Freshness** (1-10): Hoe recent is het?
- **Authority Potential** (1-10): Kan dit een pillar/cluster worden?

**Minimum Score**: 200/1000

---

## ❌ Wat Ontbreekt in Huidige Implementatie

### 1. Geen Topical Authority Logica
- Geen topic classificatie
- Geen pillar/cluster structuur
- Geen opportunity scoring
- Geen daily limits per topic

### 2. RSS Afhankelijkheid
- Volledig afhankelijk van externe RSS feeds
- Geen proactieve content discovery
- Geen keyword research integratie
- Geen trending topic detection

### 3. Geen Intelligente Planning
- Geen content calendar logica
- Geen topic balancing
- Geen internal linking strategie
- Geen content refresh systeem

### 4. Geen AI Overview Optimization
- Geen featured snippet formatting
- Geen FAQ schema generatie
- Geen structured data
- Geen semantic richness

### 5. Geen Performance Tracking
- Geen topical authority metrics
- Geen AI Overview tracking
- Geen cluster performance analysis
- Geen automatic optimization

---

## ✅ Wat Moet Worden Gebouwd

### 1. Intelligent Content Discovery Systeem

**Bronnen (zonder RSS):**
- Google Trends API - Trending topics
- Google Search Console API - Performance data & queries
- Keyword research - Related keywords & questions
- Competitor analysis - Gap analysis
- AI-powered topic generation - Proactieve suggesties

### 2. Topical Authority Engine

**Componenten:**
- Topic classifier (5 main topics)
- Opportunity scorer (Priority × Relevance × Freshness × Authority)
- Pillar/Cluster detector
- Daily limit enforcer
- Content calendar generator

### 3. Keyword Clustering Systeem

**Features:**
- Semantic keyword grouping
- Pillar keyword identification
- Cluster keyword mapping
- Search intent analysis
- Keyword difficulty scoring

### 4. Intelligent Scheduling Systeem

**Logic:**
- Topic balancing (40% Google, 30% AI, 20% WordPress, 10% Marketing)
- Optimal publishing times
- Content type rotation (Pillar → Cluster → Supporting)
- Seasonal content planning
- Event-based triggers (Google updates, AI releases)

### 5. Internal Linking Engine

**Features:**
- Automatic pillar ↔ cluster linking
- Related content suggestions
- Orphan page detection
- Link graph visualization
- Anchor text optimization

### 6. AI Overview Optimization

**Features:**
- Featured snippet formatting
- FAQ schema generation
- How-to schema generation
- List/table formatting
- Direct answer extraction

### 7. Performance Tracking & Optimization

**Metrics:**
- Topical authority score per topic
- AI Overview appearances
- Keyword rankings per cluster
- Internal link effectiveness
- Content refresh recommendations

---

## 🏗️ Nieuwe Architectuur

### Database Schema Uitbreidingen

**Nieuwe Tabellen:**
```sql
-- Topic classificatie
CREATE TABLE writgo_topics (
  id UUID PRIMARY KEY,
  name TEXT, -- "Google SEO Updates"
  slug TEXT, -- "google-seo-updates"
  priority INTEGER, -- 1-5
  target_percentage INTEGER, -- 40 voor Google SEO
  pillar_page_id UUID REFERENCES articles(id)
);

-- Keyword clusters
CREATE TABLE writgo_keyword_clusters (
  id UUID PRIMARY KEY,
  topic_id UUID REFERENCES writgo_topics(id),
  cluster_name TEXT,
  pillar_keyword TEXT,
  keywords JSONB, -- Array van related keywords
  search_volume INTEGER,
  difficulty INTEGER,
  content_type TEXT -- "pillar", "cluster", "supporting"
);

-- Content planning
CREATE TABLE writgo_content_calendar (
  id UUID PRIMARY KEY,
  topic_id UUID REFERENCES writgo_topics(id),
  cluster_id UUID REFERENCES writgo_keyword_clusters(id),
  planned_date DATE,
  content_type TEXT,
  status TEXT,
  priority_score INTEGER
);

-- Performance tracking
CREATE TABLE writgo_topical_authority_metrics (
  id UUID PRIMARY KEY,
  topic_id UUID REFERENCES writgo_topics(id),
  date DATE,
  authority_score DECIMAL,
  ai_overview_count INTEGER,
  avg_ranking DECIMAL,
  total_traffic INTEGER
);
```

### API Routes Uitbreidingen

**Nieuwe Endpoints:**
```
/api/writgo/discover-topics        - Discover trending topics
/api/writgo/classify-opportunity   - Classify opportunity by topic
/api/writgo/score-opportunity      - Score opportunity
/api/writgo/generate-keywords      - Generate keyword clusters
/api/writgo/plan-content           - Generate content calendar
/api/writgo/optimize-linking       - Optimize internal links
/api/writgo/track-authority        - Track topical authority
```

---

## 🚀 Implementatie Plan

### Phase 1: Foundation (Dag 1-2)
1. ✅ Database schema uitbreiden
2. ✅ Topic classificatie systeem
3. ✅ Opportunity scoring engine
4. ✅ Daily limits implementeren

### Phase 2: Content Discovery (Dag 3-4)
1. ✅ Google Trends integratie
2. ✅ GSC API integratie
3. ✅ Keyword research systeem
4. ✅ AI-powered topic generator

### Phase 3: Intelligent Planning (Dag 5-6)
1. ✅ Content calendar generator
2. ✅ Topic balancing logica
3. ✅ Scheduling optimizer
4. ✅ Content type rotation

### Phase 4: Optimization (Dag 7)
1. ✅ Internal linking engine
2. ✅ AI Overview optimization
3. ✅ Performance tracking
4. ✅ Dashboard updates

---

## 🎯 Success Criteria

**Na Implementatie:**
- ✅ 0 RSS feeds nodig
- ✅ 60-90 artikelen/maand (was 400)
- ✅ 100% topic-gefocust (was random)
- ✅ Automatische pillar/cluster structuur
- ✅ Daily limits per topic
- ✅ AI Overview optimization
- ✅ Performance tracking

**KPIs (6 maanden):**
- Rank in AI Overview voor 50+ queries
- Topical authority score > 80/100
- Gemiddelde positie < 10 voor pillar keywords
- 2+ pagina's per sessie (internal linking)
- < 50% bounce rate

---

## 📊 Huidige vs Nieuwe Workflow

### Huidig (RSS-based):
```
RSS Feed → Detect → Generate → Queue → Publish
```
**Probleem**: Random topics, geen strategie, spam-achtig

### Nieuw (Topical Authority):
```
Discover Topics (Trends/GSC/Keywords)
  ↓
Classify by Topic (5 main topics)
  ↓
Score Opportunity (Priority × Relevance × Freshness × Authority)
  ↓
Check Daily Limits (per topic)
  ↓
Generate Keyword Cluster
  ↓
Determine Content Type (Pillar/Cluster/Supporting)
  ↓
Generate Content (AI Overview optimized)
  ↓
Optimize Internal Links
  ↓
Schedule (Topic balanced)
  ↓
Publish & Track Performance
```

**Voordeel**: Strategisch, gefocust, authority-building

---

## 💡 Innovaties

### 1. Zero RSS Dependency
Gebruik Google's eigen data (Trends, GSC) + AI voor content discovery.

### 2. Self-Learning Systeem
Track wat werkt, optimize automatisch.

### 3. Proactive Content Planning
Anticipeer op Google updates, AI releases, seasonal trends.

### 4. Semantic Content Web
Automatische internal linking based on semantic similarity.

### 5. AI Overview First
Optimize specifiek voor Google's AI Overview feature.

---

## 🔧 Technische Stack

**Backend:**
- Next.js API Routes (bestaand)
- Supabase (bestaand)
- Google APIs (Trends, GSC, Analytics)
- OpenAI API (topic generation, classification)
- Anthropic Claude (content generation)

**Frontend:**
- React (bestaand)
- TailwindCSS (bestaand)
- Recharts (nieuwe: voor visualisaties)
- React Flow (nieuwe: voor link graph)

**External Services:**
- Google Trends API
- Google Search Console API
- Google Analytics API
- Keyword research APIs (optioneel)

---

## 📝 Volgende Stappen

1. **Review met gebruiker** - Bevestig strategie
2. **Database migratie** - Nieuwe tabellen aanmaken
3. **API development** - Nieuwe endpoints bouwen
4. **Frontend updates** - Dashboard verbeteren
5. **Testing** - Grondig testen
6. **Deployment** - Live zetten
7. **Monitoring** - Performance tracking

**Geschatte tijd**: 7 dagen voor volledige implementatie
