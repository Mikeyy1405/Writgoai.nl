# WritGo Topical Authority System - Technisch Ontwerp

## 🎯 Systeem Overzicht

Een volledig geautomatiseerd content discovery en publishing systeem dat **topical authority** opbouwt zonder RSS feeds, met focus op **Google SEO Updates**, **AI & SEO**, en **WordPress SEO**.

---

## 🏗️ Architectuur

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   CONTENT DISCOVERY ENGINE                   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Google       │  │ Search       │  │ AI Topic     │     │
│  │ Trends API   │  │ Console API  │  │ Generator    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  TOPIC CLASSIFICATION ENGINE                 │
│                                                              │
│  Classify → Score → Filter → Prioritize                     │
│  (5 Topics)  (0-1000)  (>200)  (Daily Limits)              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   KEYWORD CLUSTERING ENGINE                  │
│                                                              │
│  Semantic Grouping → Pillar Detection → Cluster Mapping     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    CONTENT GENERATION ENGINE                 │
│                                                              │
│  Research → Generate → Optimize → Format (AI Overview)      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  INTELLIGENT SCHEDULING ENGINE               │
│                                                              │
│  Topic Balance → Time Optimization → Queue Management       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   INTERNAL LINKING ENGINE                    │
│                                                              │
│  Pillar ↔ Cluster Links → Semantic Similarity → Optimize    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    PERFORMANCE TRACKING                      │
│                                                              │
│  Rankings → AI Overview → Authority Score → Optimization    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### 1. Topics Table
```sql
CREATE TABLE writgo_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- "Google SEO Updates"
  slug TEXT UNIQUE NOT NULL, -- "google-seo-updates"
  description TEXT,
  priority INTEGER NOT NULL, -- 1-5 (1 = highest)
  target_percentage INTEGER NOT NULL, -- 40 = 40% of content
  color TEXT, -- For UI visualization
  icon TEXT, -- Emoji or icon name
  pillar_page_id UUID REFERENCES articles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default topics
INSERT INTO writgo_topics (name, slug, priority, target_percentage, color, icon) VALUES
  ('Google SEO Updates', 'google-seo-updates', 1, 40, '#4285F4', '🔍'),
  ('AI & SEO', 'ai-seo', 2, 30, '#EA4335', '🤖'),
  ('WordPress SEO', 'wordpress-seo', 3, 20, '#21759B', '📝'),
  ('Content Marketing', 'content-marketing', 4, 10, '#34A853', '💡'),
  ('Local SEO', 'local-seo', 5, 0, '#FBBC04', '📍');
```

### 2. Keyword Clusters Table
```sql
CREATE TABLE writgo_keyword_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES writgo_topics(id) ON DELETE CASCADE,
  cluster_name TEXT NOT NULL,
  pillar_keyword TEXT NOT NULL,
  keywords JSONB NOT NULL DEFAULT '[]', -- Array of related keywords
  search_volume INTEGER DEFAULT 0,
  difficulty INTEGER DEFAULT 0, -- 0-100
  content_type TEXT NOT NULL CHECK (content_type IN ('pillar', 'cluster', 'supporting')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  article_count INTEGER DEFAULT 0, -- How many articles in this cluster
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_keyword_clusters_topic ON writgo_keyword_clusters(topic_id);
CREATE INDEX idx_keyword_clusters_type ON writgo_keyword_clusters(content_type);
```

### 3. Content Calendar Table
```sql
CREATE TABLE writgo_content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES writgo_topics(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES writgo_keyword_clusters(id) ON DELETE SET NULL,
  planned_date DATE NOT NULL,
  planned_time TIME DEFAULT '09:00:00',
  content_type TEXT NOT NULL CHECK (content_type IN ('pillar', 'cluster', 'supporting')),
  title TEXT,
  focus_keyword TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'generating', 'queued', 'published', 'skipped')),
  priority_score INTEGER DEFAULT 0, -- 0-1000
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_content_calendar_date ON writgo_content_calendar(planned_date);
CREATE INDEX idx_content_calendar_status ON writgo_content_calendar(status);
CREATE INDEX idx_content_calendar_topic ON writgo_content_calendar(topic_id);
```

### 4. Topical Authority Metrics Table
```sql
CREATE TABLE writgo_topical_authority_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES writgo_topics(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  authority_score DECIMAL(5,2) DEFAULT 0, -- 0-100
  article_count INTEGER DEFAULT 0,
  pillar_count INTEGER DEFAULT 0,
  cluster_count INTEGER DEFAULT 0,
  ai_overview_count INTEGER DEFAULT 0, -- How many AI Overview appearances
  avg_ranking DECIMAL(5,2) DEFAULT 0,
  total_traffic INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  avg_ctr DECIMAL(5,4) DEFAULT 0,
  internal_links_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(topic_id, date)
);

CREATE INDEX idx_authority_metrics_topic_date ON writgo_topical_authority_metrics(topic_id, date);
```

### 5. Content Opportunities (Updated)
```sql
-- Add new columns to existing table
ALTER TABLE writgo_content_opportunities 
  ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES writgo_topics(id),
  ADD COLUMN IF NOT EXISTS cluster_id UUID REFERENCES writgo_keyword_clusters(id),
  ADD COLUMN IF NOT EXISTS content_type TEXT CHECK (content_type IN ('pillar', 'cluster', 'supporting')),
  ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS relevance_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS freshness_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS authority_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discovery_source TEXT; -- 'trends', 'gsc', 'ai', 'keyword_research'

CREATE INDEX idx_opportunities_topic ON writgo_content_opportunities(topic_id);
CREATE INDEX idx_opportunities_score ON writgo_content_opportunities(priority_score);
```

### 6. Internal Links Table
```sql
CREATE TABLE writgo_internal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  target_article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  anchor_text TEXT NOT NULL,
  link_type TEXT CHECK (link_type IN ('pillar_to_cluster', 'cluster_to_pillar', 'cluster_to_cluster', 'supporting')),
  semantic_score DECIMAL(5,4) DEFAULT 0, -- 0-1, how semantically related
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_article_id, target_article_id, anchor_text)
);

CREATE INDEX idx_internal_links_source ON writgo_internal_links(source_article_id);
CREATE INDEX idx_internal_links_target ON writgo_internal_links(target_article_id);
```

---

## 🔌 API Endpoints

### Content Discovery

#### 1. Discover Topics from Trends
```typescript
POST /api/writgo/discover/trends
Body: {
  topics: string[], // ["google seo", "ai seo", "wordpress seo"]
  timeframe: string, // "now 7-d", "today 1-m"
  geo: string // "NL"
}
Response: {
  opportunities: [{
    title: string,
    query: string,
    traffic: number,
    related_queries: string[],
    suggested_topic_id: string
  }]
}
```

#### 2. Discover from Search Console
```typescript
POST /api/writgo/discover/gsc
Body: {
  days: number, // 28
  min_impressions: number // 100
}
Response: {
  opportunities: [{
    query: string,
    impressions: number,
    clicks: number,
    position: number,
    ctr: number,
    suggested_topic_id: string,
    content_gap: boolean // true if we don't have content for this
  }]
}
```

#### 3. AI-Powered Topic Generation
```typescript
POST /api/writgo/discover/ai-topics
Body: {
  topic_id: string,
  count: number // 10
}
Response: {
  topics: [{
    title: string,
    description: string,
    keywords: string[],
    content_type: "pillar" | "cluster" | "supporting",
    reasoning: string
  }]
}
```

### Topic Classification & Scoring

#### 4. Classify Opportunity
```typescript
POST /api/writgo/classify-opportunity
Body: {
  title: string,
  description?: string,
  keywords?: string[]
}
Response: {
  topic_id: string,
  topic_name: string,
  confidence: number, // 0-1
  content_type: "pillar" | "cluster" | "supporting",
  reasoning: string
}
```

#### 5. Score Opportunity
```typescript
POST /api/writgo/score-opportunity
Body: {
  opportunity_id: string
}
Response: {
  priority_score: number, // 0-1000
  breakdown: {
    priority: number, // 1-10
    relevance: number, // 1-10
    freshness: number, // 1-10
    authority_potential: number // 1-10
  },
  should_generate: boolean,
  reasoning: string
}
```

### Keyword Clustering

#### 6. Generate Keyword Cluster
```typescript
POST /api/writgo/keywords/cluster
Body: {
  topic_id: string,
  seed_keyword: string
}
Response: {
  cluster: {
    cluster_name: string,
    pillar_keyword: string,
    keywords: string[],
    search_volume: number,
    difficulty: number,
    content_type: "pillar" | "cluster" | "supporting"
  }
}
```

#### 7. Expand Cluster
```typescript
POST /api/writgo/keywords/expand
Body: {
  cluster_id: string
}
Response: {
  new_keywords: string[],
  related_clusters: string[]
}
```

### Content Planning

#### 8. Generate Content Calendar
```typescript
POST /api/writgo/plan/calendar
Body: {
  start_date: string, // "2024-01-01"
  days: number, // 30
  articles_per_day: number // 2-3
}
Response: {
  calendar: [{
    date: string,
    topic_id: string,
    topic_name: string,
    content_type: string,
    title: string,
    focus_keyword: string,
    priority_score: number
  }]
}
```

#### 9. Check Daily Limits
```typescript
GET /api/writgo/plan/daily-limits?date=2024-01-01
Response: {
  limits: [{
    topic_id: string,
    topic_name: string,
    max_per_day: number,
    generated_today: number,
    remaining: number
  }],
  total_max: number,
  total_generated: number
}
```

### Content Generation

#### 10. Generate Article (Enhanced)
```typescript
POST /api/writgo/generate/article
Body: {
  opportunity_id?: string,
  topic_id: string,
  cluster_id?: string,
  content_type: "pillar" | "cluster" | "supporting",
  focus_keyword: string,
  title?: string
}
Response: {
  article: {
    title: string,
    content: string, // HTML with AI Overview optimization
    excerpt: string,
    focus_keyword: string,
    word_count: number,
    internal_links: [{
      target_article_id: string,
      anchor_text: string
    }],
    schema_markup: object, // FAQ/HowTo schema
    scheduled_for: string
  }
}
```

### Internal Linking

#### 11. Optimize Internal Links
```typescript
POST /api/writgo/links/optimize
Body: {
  article_id: string
}
Response: {
  suggestions: [{
    target_article_id: string,
    target_title: string,
    anchor_text: string,
    semantic_score: number,
    link_type: string,
    reasoning: string
  }]
}
```

#### 12. Get Link Graph
```typescript
GET /api/writgo/links/graph?topic_id=xxx
Response: {
  nodes: [{
    id: string,
    title: string,
    type: "pillar" | "cluster" | "supporting",
    article_count: number
  }],
  edges: [{
    source: string,
    target: string,
    weight: number
  }]
}
```

### Performance Tracking

#### 13. Track Topical Authority
```typescript
POST /api/writgo/track/authority
Body: {
  topic_id?: string // If null, track all topics
}
Response: {
  metrics: [{
    topic_id: string,
    topic_name: string,
    authority_score: number,
    article_count: number,
    ai_overview_count: number,
    avg_ranking: number,
    total_traffic: number,
    trend: "up" | "down" | "stable"
  }]
}
```

#### 14. Get AI Overview Performance
```typescript
GET /api/writgo/track/ai-overview
Response: {
  total_appearances: number,
  by_topic: [{
    topic_id: string,
    topic_name: string,
    count: number,
    queries: string[]
  }],
  recent_wins: [{
    article_id: string,
    title: string,
    query: string,
    detected_at: string
  }]
}
```

---

## 🤖 AI Prompts & Logic

### Topic Classification Prompt
```
You are a content strategist for WritGo.nl, a Dutch SEO blog.

Classify this content opportunity into one of these topics:
1. Google SEO Updates (Google algorithm updates, Search Console features, ranking factors)
2. AI & SEO (ChatGPT, AI tools, AI-powered SEO, future of AI in search)
3. WordPress SEO (Yoast, technical WP SEO, speed optimization, schema)
4. Content Marketing (SEO copywriting, content strategy, link building, E-E-A-T)
5. Local SEO (Google Business Profile, local rankings, citations)

Title: {title}
Description: {description}
Keywords: {keywords}

Respond in JSON:
{
  "topic_id": "google-seo-updates",
  "confidence": 0.95,
  "content_type": "cluster",
  "reasoning": "This is about a recent Google Core Update announcement"
}
```

### Opportunity Scoring Logic
```typescript
function scoreOpportunity(opp: Opportunity): number {
  // Priority (1-10)
  const priority = calculatePriority(opp.source, opp.keywords);
  
  // Relevance (1-10)
  const relevance = calculateRelevance(opp.topic_id, opp.keywords);
  
  // Freshness (1-10)
  const freshness = calculateFreshness(opp.detected_at);
  
  // Authority Potential (1-10)
  const authority = calculateAuthority(opp.content_type, opp.search_volume);
  
  return priority * relevance * freshness * authority;
}

function calculatePriority(source: string, keywords: string[]): number {
  if (keywords.some(k => k.includes('google') && k.includes('update'))) return 10;
  if (keywords.some(k => k.includes('chatgpt') || k.includes('ai'))) return 9;
  if (source === 'google_official') return 10;
  if (source === 'trends' && traffic > 10000) return 8;
  return 5;
}

function calculateRelevance(topicId: string, keywords: string[]): number {
  // Use semantic similarity or keyword matching
  // Perfect match with pillar topic = 10
  // Related to cluster = 8
  // Supporting content = 5
  // Off-topic = 1
}

function calculateFreshness(detectedAt: Date): number {
  const hoursAgo = (Date.now() - detectedAt.getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 24) return 10;
  if (hoursAgo < 72) return 8;
  if (hoursAgo < 168) return 5;
  return 2;
}

function calculateAuthority(contentType: string, searchVolume: number): number {
  if (contentType === 'pillar' && searchVolume > 5000) return 10;
  if (contentType === 'cluster' && searchVolume > 1000) return 8;
  if (contentType === 'supporting' && searchVolume > 100) return 5;
  return 3;
}
```

### Content Calendar Generation Logic
```typescript
function generateContentCalendar(startDate: Date, days: number): CalendarEntry[] {
  const calendar: CalendarEntry[] = [];
  const topics = getTopics(); // Get all 5 topics
  
  for (let day = 0; day < days; day++) {
    const date = addDays(startDate, day);
    const dayOfWeek = date.getDay();
    
    // Weekend: 1 evergreen article
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      calendar.push({
        date,
        topic_id: selectTopicByPercentage(topics),
        content_type: 'supporting',
        priority_score: 300
      });
      continue;
    }
    
    // Weekdays: 2-3 articles
    const articlesPerDay = 2 + (Math.random() > 0.5 ? 1 : 0);
    
    for (let i = 0; i < articlesPerDay; i++) {
      const topic = selectTopicByPercentage(topics);
      const contentType = selectContentType(topic, calendar);
      
      calendar.push({
        date,
        topic_id: topic.id,
        content_type: contentType,
        priority_score: calculatePriorityScore(topic, contentType)
      });
    }
  }
  
  return balanceTopics(calendar, topics);
}

function selectTopicByPercentage(topics: Topic[]): Topic {
  // Weighted random selection based on target_percentage
  const rand = Math.random() * 100;
  let cumulative = 0;
  
  for (const topic of topics) {
    cumulative += topic.target_percentage;
    if (rand <= cumulative) return topic;
  }
  
  return topics[0]; // Fallback
}

function selectContentType(topic: Topic, calendar: CalendarEntry[]): ContentType {
  const topicArticles = calendar.filter(e => e.topic_id === topic.id);
  const pillarCount = topicArticles.filter(e => e.content_type === 'pillar').length;
  const clusterCount = topicArticles.filter(e => e.content_type === 'cluster').length;
  
  // Need pillar page first
  if (pillarCount === 0) return 'pillar';
  
  // Need clusters (5-10 per pillar)
  if (clusterCount < 10) return 'cluster';
  
  // Supporting content
  return 'supporting';
}
```

---

## 🎨 Dashboard UI Updates

### New Sections

#### 1. Topic Overview Cards
```tsx
<div className="grid grid-cols-5 gap-4">
  {topics.map(topic => (
    <TopicCard
      key={topic.id}
      name={topic.name}
      icon={topic.icon}
      color={topic.color}
      authorityScore={topic.authority_score}
      articleCount={topic.article_count}
      targetPercentage={topic.target_percentage}
      currentPercentage={topic.current_percentage}
    />
  ))}
</div>
```

#### 2. Content Calendar View
```tsx
<ContentCalendar
  entries={calendarEntries}
  onDateClick={handleDateClick}
  onGenerateMonth={handleGenerateMonth}
/>
```

#### 3. Keyword Cluster Visualization
```tsx
<KeywordClusterGraph
  clusters={clusters}
  onClusterClick={handleClusterClick}
/>
```

#### 4. Link Graph Visualization
```tsx
<InternalLinkGraph
  nodes={articles}
  edges={links}
  onNodeClick={handleArticleClick}
/>
```

#### 5. Authority Metrics Dashboard
```tsx
<AuthorityMetrics
  topicId={selectedTopic}
  metrics={metrics}
  trend={trend}
/>
```

---

## 🚀 Implementation Priority

### Week 1: Foundation
- ✅ Database migrations
- ✅ Topic classification system
- ✅ Opportunity scoring
- ✅ Daily limits

### Week 2: Discovery
- ✅ Google Trends integration
- ✅ GSC integration
- ✅ AI topic generator
- ✅ Keyword clustering

### Week 3: Planning & Generation
- ✅ Content calendar
- ✅ Enhanced article generation
- ✅ AI Overview optimization
- ✅ Internal linking

### Week 4: Tracking & UI
- ✅ Performance tracking
- ✅ Dashboard updates
- ✅ Testing
- ✅ Documentation

---

## 📊 Success Metrics

**Immediate (Week 1):**
- ✅ 0 RSS feeds active
- ✅ 100% opportunities classified by topic
- ✅ Daily limits enforced

**Short-term (Month 1):**
- ✅ 60-90 articles/month (down from 400)
- ✅ 100% topic-focused content
- ✅ Pillar/cluster structure established

**Long-term (Month 6):**
- ✅ Authority score > 80/100 per topic
- ✅ 50+ AI Overview appearances
- ✅ Avg position < 10 for pillar keywords
- ✅ 2+ pages per session

---

Dit is het complete technische ontwerp voor het nieuwe Topical Authority systeem!
