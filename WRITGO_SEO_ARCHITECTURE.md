# WritGo SEO Optimizer - Architectuur (Correct)

## 🎯 Filosofie: Cloud-First Architecture

**WritGo.nl = Het brein** 🧠
- Alle AI-features draaien op WritGo.nl
- Users hebben WritGo.nl account nodig
- Subscription model (€9.99/mo)
- Centraal beheer van alle WordPress sites

**WritGo Connector Plugin = De handen** 🔌
- Lightweight WordPress plugin
- Communiceert met WritGo.nl API
- Toont UI in WordPress
- Past optimalisaties toe
- Stuurt data naar WritGo.nl

---

## 📊 Data Flow

### 1. **Content Optimalisatie Flow**

```
WordPress Post (draft)
    ↓
User clicks "Optimize with WritGo" in editor
    ↓
Plugin sends content to WritGo.nl API
    ↓
WritGo.nl analyzes with Claude AI
    ↓
Returns: optimized content, SEO suggestions, internal links
    ↓
Plugin shows preview in WordPress sidebar
    ↓
User approves → Plugin applies changes
```

### 2. **Internal Linking Flow**

```
WordPress Site has 100 posts
    ↓
Plugin sends all post data to WritGo.nl
    ↓
WritGo.nl analyzes topic clusters
    ↓
Returns: link suggestions for each post
    ↓
Plugin shows in "Internal Links" dashboard
    ↓
User clicks "Apply Links" → Plugin injects links
```

### 3. **WooCommerce Optimization Flow**

```
Product page in WordPress
    ↓
User clicks "Optimize Product"
    ↓
Plugin sends product data to WritGo.nl
    ↓
WritGo.nl generates SEO description with AI
    ↓
Returns: optimized title, description, meta
    ↓
Plugin updates product fields
```

---

## 🔌 WritGo Connector Plugin (Lightweight)

### Wat de plugin DOET:

**✅ UI Components**
- Gutenberg sidebar panel "WritGo SEO"
- Dashboard page "WritGo → Optimizer"
- Settings page "WritGo → Settings"
- Meta box in classic editor

**✅ API Communication**
- Send content to WritGo.nl
- Receive optimizations
- Authentication with API key
- Error handling

**✅ Data Sync**
- Fetch post data
- Update post content
- Track optimization history
- Store API responses

**✅ Apply Changes**
- Update post title/content
- Insert internal links
- Update meta tags
- Modify product descriptions

### Wat de plugin NIET DOET:

**❌ NO AI Processing**
- Geen Claude API calls
- Geen content rewriting logic
- Geen SEO analysis algoritmes

**❌ NO Heavy Computation**
- Geen topic clustering
- Geen similarity matching
- Geen keyword analysis

**❌ NO Data Storage**
- Minimale database tables
- Alleen cache en sync tracking
- Hoofddata blijft op WritGo.nl

---

## 🌐 WritGo.nl Web App (Brain)

### Nieuwe Features in WritGo.nl:

### 1. **SEO Optimizer Dashboard**

**URL:** `/dashboard/seo-optimizer`

```tsx
// New page: app/dashboard/seo-optimizer/page.tsx

interface SEOOptimizerProps {
  connectedSites: WordPressSite[]
}

Features:
- Overview van alle connected WordPress sites
- SEO scores per site
- Bulk optimization queue
- Recent optimizations history
```

**UI Layout:**
```
╔════════════════════════════════════════════════╗
║  WritGo SEO Optimizer                          ║
╠════════════════════════════════════════════════╣
║                                                 ║
║  📊 Connected WordPress Sites                  ║
║  ┌─────────────────────────────────────────┐  ║
║  │ example.com                              │  ║
║  │ 150 posts | Avg SEO Score: 72           │  ║
║  │ [Optimize All] [View Posts]             │  ║
║  └─────────────────────────────────────────┘  ║
║                                                 ║
║  🎯 Optimization Queue (15 pending)            ║
║  - "Best WordPress Plugins 2024" → Rewrite     ║
║  - "SEO Guide" → Add internal links            ║
║  - Product: "Blue Shirt" → Optimize            ║
║                                                 ║
║  📈 Stats (Last 30 days)                       ║
║  - 450 posts optimized                         ║
║  - 1,200 internal links added                  ║
║  - Avg score improvement: +28 points           ║
║                                                 ║
╚════════════════════════════════════════════════╝
```

### 2. **API Endpoints voor Plugin**

**Basis URL:** `https://writgo.nl/api/seo/`

```typescript
// POST /api/seo/analyze
interface AnalyzeRequest {
  site_id: string
  post_id: number
  title: string
  content: string
  focus_keyword?: string
  current_meta?: {
    title: string
    description: string
  }
}

interface AnalyzeResponse {
  seo_score: number  // 0-100
  readability_score: number
  suggestions: Array<{
    type: 'error' | 'warning' | 'suggestion'
    category: 'keyword' | 'structure' | 'meta' | 'readability'
    message: string
    fix?: string  // Auto-fixable
  }>
  optimizations: {
    meta_title?: string
    meta_description?: string
    improved_content?: string
  }
}
```

```typescript
// POST /api/seo/rewrite
interface RewriteRequest {
  content: string
  style: 'professional' | 'casual' | 'technical'
  focus_keyword: string
  preserve_keywords?: string[]
  target_length?: number
}

interface RewriteResponse {
  original_content: string
  rewritten_content: string
  improvements: string[]
  seo_impact: {
    keyword_density_before: number
    keyword_density_after: number
    readability_before: number
    readability_after: number
  }
}
```

```typescript
// POST /api/seo/internal-links
interface InternalLinksRequest {
  site_id: string
  post_id: number
  content: string
  all_posts: Array<{
    id: number
    title: string
    excerpt: string
    url: string
    topic?: string
  }>
}

interface InternalLinksResponse {
  suggestions: Array<{
    target_post_id: number
    target_title: string
    target_url: string
    anchor_text: string
    position: number  // Character position in content
    relevance_score: number  // 0-100
    reason: string
  }>
  topic_cluster?: {
    pillar_post_id: number
    cluster_posts: number[]
  }
}
```

```typescript
// POST /api/seo/woocommerce/optimize-product
interface ProductOptimizeRequest {
  site_id: string
  product_id: number
  product_data: {
    title: string
    short_description?: string
    description?: string
    category: string
    attributes: Record<string, string>
    price: number
    sku: string
  }
}

interface ProductOptimizeResponse {
  optimized: {
    seo_title: string
    meta_description: string
    description: string
    short_description: string
    focus_keywords: string[]
  }
  schema_markup: object
  seo_score: number
}
```

### 3. **AI Processing Pipeline**

```typescript
// lib/seo-optimizer.ts

export class SEOOptimizer {

  async analyzeContent(content: string, keyword: string) {
    // 1. Keyword analysis
    const keywordDensity = this.calculateKeywordDensity(content, keyword)

    // 2. Readability score
    const readability = this.calculateFleschScore(content)

    // 3. Structure analysis
    const structure = this.analyzeStructure(content)

    // 4. AI suggestions via Claude
    const aiSuggestions = await this.getAISuggestions(content, keyword)

    return {
      score: this.calculateOverallScore({
        keywordDensity,
        readability,
        structure,
        aiSuggestions
      }),
      suggestions: this.compileSuggestions()
    }
  }

  async rewriteContent(content: string, options: RewriteOptions) {
    const prompt = `
      Rewrite this content to improve SEO and readability:

      Content: ${content}
      Focus keyword: ${options.focus_keyword}
      Style: ${options.style}
      Target length: ${options.target_length} words

      Requirements:
      - Maintain keyword density 1-2%
      - Improve Flesch Reading Score
      - Keep factual accuracy
      - Natural, engaging tone
      - Preserve: ${options.preserve_keywords?.join(', ')}
    `

    const rewritten = await this.callClaudeAPI(prompt)
    return rewritten
  }

  async findInternalLinks(content: string, allPosts: Post[]) {
    // 1. Extract main topics from content
    const topics = await this.extractTopics(content)

    // 2. Find related posts using semantic similarity
    const relatedPosts = await this.findRelatedPosts(topics, allPosts)

    // 3. Generate anchor text suggestions
    const suggestions = await this.generateLinkSuggestions(
      content,
      relatedPosts
    )

    // 4. Identify pillar/cluster structure
    const cluster = this.identifyTopicCluster(allPosts)

    return {
      suggestions,
      cluster
    }
  }
}
```

### 4. **Database Schema (WritGo.nl)**

```sql
-- Track connected WordPress sites
CREATE TABLE wordpress_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  site_url VARCHAR(255) NOT NULL,
  site_name VARCHAR(255),
  api_key VARCHAR(255) NOT NULL,
  plan VARCHAR(50) DEFAULT 'free',  -- free, premium, enterprise
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(site_url)
);

-- Cache WordPress posts for analysis
CREATE TABLE wordpress_posts_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES wordpress_sites(id) ON DELETE CASCADE,
  wp_post_id BIGINT NOT NULL,
  title VARCHAR(500),
  content TEXT,
  excerpt TEXT,
  post_url VARCHAR(500),
  post_type VARCHAR(50),
  status VARCHAR(50),
  seo_score INT DEFAULT 0,
  topic_cluster VARCHAR(100),
  last_analyzed_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(site_id, wp_post_id)
);

-- Track optimizations performed
CREATE TABLE seo_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES wordpress_sites(id),
  wp_post_id BIGINT NOT NULL,
  optimization_type VARCHAR(50),  -- rewrite, meta, links, product
  original_data JSONB,
  optimized_data JSONB,
  applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Internal links tracking
CREATE TABLE seo_internal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES wordpress_sites(id),
  source_wp_post_id BIGINT NOT NULL,
  target_wp_post_id BIGINT NOT NULL,
  anchor_text VARCHAR(255),
  relevance_score FLOAT,
  topic_cluster VARCHAR(100),
  auto_generated BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEO analysis history
CREATE TABLE seo_analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES wordpress_sites(id),
  wp_post_id BIGINT NOT NULL,
  seo_score INT,
  readability_score INT,
  keyword_density FLOAT,
  suggestions JSONB,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔐 Authentication & Security

### Plugin → WritGo.nl Authentication

```php
// In WordPress plugin

class WritGo_API {
  private $api_url = 'https://writgo.nl/api';
  private $api_key;

  public function authenticate() {
    // API key stored in wp_options
    $this->api_key = get_option('writgo_api_key');

    // Verify key with WritGo.nl
    $response = wp_remote_post($this->api_url . '/auth/verify', [
      'headers' => [
        'X-WritGo-API-Key' => $this->api_key,
        'X-Site-URL' => get_site_url()
      ]
    ]);

    return json_decode($response['body']);
  }

  public function analyzeContent($post_id) {
    $post = get_post($post_id);

    $response = wp_remote_post($this->api_url . '/seo/analyze', [
      'headers' => [
        'X-WritGo-API-Key' => $this->api_key,
        'Content-Type' => 'application/json'
      ],
      'body' => json_encode([
        'site_id' => $this->getSiteId(),
        'post_id' => $post_id,
        'title' => $post->post_title,
        'content' => $post->post_content,
        'focus_keyword' => get_post_meta($post_id, '_writgo_focus_keyword', true)
      ])
    ]);

    return json_decode($response['body']);
  }
}
```

### API Key Management

**In WritGo.nl dashboard:**
```
Settings → WordPress Sites → Add Site

1. Enter WordPress URL
2. Install WritGo Connector plugin
3. Copy API key from WritGo.nl
4. Paste in plugin settings
5. Click "Connect"
```

---

## 💰 Pricing & Features

### FREE Plan
**Plugin features:**
- ✅ Connect 1 WordPress site
- ✅ Basic SEO analysis (20 posts/month)
- ✅ Manual meta tag editor
- ✅ SEO score display
- ❌ NO AI rewriting
- ❌ NO auto internal links
- ❌ NO WooCommerce optimizer

### PREMIUM Plan (€9.99/mo)
**Plugin features:**
- ✅ Connect 3 WordPress sites
- ✅ Unlimited SEO analysis
- ✅ AI content rewriter (100 requests/month)
- ✅ Auto internal linking
- ✅ AI meta generator
- ✅ WooCommerce optimizer (50 products/month)
- ✅ Bulk optimizer
- ✅ Priority support

### ENTERPRISE Plan (€49/mo)
**Plugin features:**
- ✅ Unlimited WordPress sites
- ✅ Unlimited everything
- ✅ White-label plugin option
- ✅ API access
- ✅ Custom AI model training
- ✅ Dedicated support

---

## 🚀 Implementation Roadmap

### **Phase 1: WritGo.nl Backend** (Week 1-2)

**Tasks:**
- [ ] Create `/api/seo/*` endpoints
- [ ] Build SEO analyzer class
- [ ] Integrate Claude API for rewriting
- [ ] Setup database tables
- [ ] Create dashboard UI

**Files to create:**
```
app/api/seo/analyze/route.ts
app/api/seo/rewrite/route.ts
app/api/seo/internal-links/route.ts
app/api/seo/woocommerce/route.ts
app/dashboard/seo-optimizer/page.tsx
lib/seo-optimizer.ts
lib/internal-linking.ts
```

### **Phase 2: WordPress Plugin MVP** (Week 3-4)

**Tasks:**
- [ ] Create plugin skeleton
- [ ] Build API client class
- [ ] Gutenberg sidebar panel
- [ ] Settings page
- [ ] Basic SEO display

**Plugin files:**
```
writgo-connector/
├── writgo-connector.php
├── includes/
│   ├── class-writgo-seo-api.php
│   └── class-writgo-admin.php
├── admin/
│   ├── js/gutenberg-sidebar.js
│   └── views/settings.php
```

### **Phase 3: AI Features** (Week 5-6)

**Tasks:**
- [ ] Content rewriter UI
- [ ] Meta generator
- [ ] Optimization preview
- [ ] Apply changes functionality

### **Phase 4: Internal Linking** (Week 7-8)

**Tasks:**
- [ ] Link suggestions API
- [ ] Internal links dashboard
- [ ] Auto-inject links
- [ ] Topic clustering display

### **Phase 5: WooCommerce** (Week 9-10)

**Tasks:**
- [ ] Product optimizer API
- [ ] Product edit screen UI
- [ ] Bulk product optimizer
- [ ] Schema markup generator

### **Phase 6: Polish & Launch** (Week 11-12)

**Tasks:**
- [ ] Bulk optimizer
- [ ] Performance optimization
- [ ] Documentation
- [ ] Beta testing
- [ ] WordPress.org submission

---

## 📊 Success Metrics

### WritGo.nl Platform
- **Target:** 500 connected WordPress sites in 6 months
- **Revenue:** €5,000 MRR from SEO optimizer subscriptions
- **API Usage:** 50,000 optimization requests/month

### Plugin Adoption
- **Downloads:** 5,000+ from WordPress.org
- **Active installations:** 1,000+
- **Rating:** 4.5+ stars
- **Conversion:** 20% free → premium

---

## 🎯 Unique Value Proposition

**Waarom WritGo SEO Optimizer vs Yoast/RankMath?**

1. **Cloud-Powered AI** 🧠
   - Yoast/RankMath = Local analysis only
   - WritGo = Cloud AI met Claude for rewriting

2. **Smart Internal Linking** 🔗
   - Competitors = Manual linking
   - WritGo = AI-driven automatic link injection

3. **WooCommerce AI** 🛍️
   - Competitors = Basic product SEO
   - WritGo = AI-generated product descriptions

4. **Centraal Beheer** 🌐
   - Competitors = Per-site management
   - WritGo = Beheer alle sites vanuit 1 dashboard

5. **Continuous Learning** 📈
   - Competitors = Static rules
   - WritGo = AI learns from your content

---

## 🔧 Technical Stack

### WritGo.nl (Backend)
- Next.js 14 App Router
- TypeScript
- Supabase (PostgreSQL)
- Claude AI API
- Edge Functions voor SEO analysis

### WritGo Connector Plugin
- PHP 7.4+
- WordPress 6.0+
- React (Gutenberg)
- REST API client
- Minimal dependencies

---

**Dit is de juiste architectuur! Plugin = thin client, WritGo.nl = brein met alle AI features** 🎯
