# Affiliate Opportunity Discovery System - Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        USER GENERATES ARTICLE                            │
│  (via /dashboard/content-plan or /dashboard/writer or background job)   │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   ARTICLE GENERATION ROUTES                              │
│                                                                           │
│  • app/api/generate/article-background/route.ts                         │
│  • app/api/writgo/generate-article-v2/route.ts                          │
│  • app/api/writgo/generate-content/route.ts                             │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ 1. Article saved to DB
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   AUTOMATIC TRIGGER (NON-BLOCKING)                       │
│                                                                           │
│  POST /api/affiliate/discover                                           │
│  {                                                                       │
│    project_id: "uuid",                                                  │
│    article_id: "uuid",                                                  │
│    content: "Article HTML/text",                                        │
│    auto_research: true                                                  │
│  }                                                                       │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    PRODUCT DETECTION (AI)                                │
│                   lib/affiliate-discovery.ts                             │
│                                                                           │
│  detectProducts(content)                                                │
│    ├─> Uses Claude AI (BEST_MODELS.CONTENT)                            │
│    ├─> Analyzes content for products/brands                            │
│    ├─> Extracts: product_name, brand_name, context                     │
│    ├─> Calculates confidence score (0-1)                               │
│    └─> Returns: ProductMention[]                                        │
│                                                                           │
│  For each detected product:                                             │
│    ├─> extractContext() - Get surrounding text                         │
│    ├─> determineLocation() - Find section in article                   │
│    └─> scoreOpportunity() - Calculate relevance score                  │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ 2. Products detected
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  CREATE OPPORTUNITIES IN DB                              │
│                                                                           │
│  INSERT INTO affiliate_opportunities                                    │
│  {                                                                       │
│    project_id, article_id,                                              │
│    product_name, brand_name,                                            │
│    mentioned_at: "Introductie",                                         │
│    context: "...iPhone 15 Pro offers...",                               │
│    status: "discovered",                                                │
│    metadata: { confidence, score }                                      │
│  }                                                                       │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ 3. If auto_research = true
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│               AFFILIATE RESEARCH (PERPLEXITY AI)                         │
│                  lib/affiliate-research.ts                               │
│                                                                           │
│  researchAffiliatePrograms(product, brand)                              │
│    ├─> Check 24-hour cache first                                       │
│    ├─> Check rate limit (60/min)                                       │
│    ├─> Use Perplexity Pro Sonar model                                  │
│    ├─> Search for affiliate programs                                   │
│    ├─> Focus: NL/EU networks (Awin, Tradedoubler, Daisycon)           │
│    ├─> Extract: network, commission, cookie, signup URL                │
│    ├─> Cache results for 24 hours                                      │
│    └─> Returns: AffiliateProgram[]                                      │
│                                                                           │
│  Prompt to Perplexity:                                                  │
│    "Zoek affiliate programma's voor {product}                           │
│     Focus op Nederlandse/Europese netwerken                             │
│     Geef terug: network, commission, cookie, signup URL"                │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ 4. Programs found
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  UPDATE OPPORTUNITIES WITH PROGRAMS                      │
│                                                                           │
│  UPDATE affiliate_opportunities                                         │
│  SET                                                                     │
│    affiliate_programs = [                                               │
│      {                                                                   │
│        network: "Awin",                                                 │
│        type: "affiliate_network",                                       │
│        signup_url: "https://...",                                       │
│        commission: "5%",                                                │
│        cookie_duration: "30 days"                                       │
│      }                                                                   │
│    ],                                                                    │
│    research_completed = true,                                           │
│    status = "researching"                                               │
│  WHERE id = opportunity_id                                              │
└─────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

   ┌──────────────┐
   │  Dashboard   │
   │  /dashboard  │
   └──────┬───────┘
          │
          │ Click "Affiliate Opportunities" card
          │ Shows count of new opportunities
          ▼
   ┌─────────────────────────────────────┐
   │  Affiliate Opportunities Page       │
   │  /dashboard/affiliate-opportunities │
   ├─────────────────────────────────────┤
   │  • Stats Cards (by status)          │
   │  • Filter Buttons                   │
   │  • Opportunity Cards                │
   │    ├─ Product/Brand info            │
   │    ├─ Article context               │
   │    ├─ Location in article           │
   │    ├─ Found programs                │
   │    └─ Action buttons                │
   └──────────────┬──────────────────────┘
                  │
                  │ User actions:
                  ▼
   ┌──────────────────────────────────────┐
   │  PATCH /api/affiliate/opportunities  │
   │                                      │
   │  Actions:                            │
   │  • Research More                     │
   │    └─> POST /api/affiliate/research  │
   │  • Sign Up                           │
   │    └─> status = "signed_up"          │
   │  • Mark Active                       │
   │    └─> status = "active"             │
   │  • Dismiss                           │
   │    └─> status = "dismissed"          │
   └──────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                      PROJECT SETTINGS FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

   ┌───────────────────┐
   │  Project Settings │
   │  Modal            │
   └─────────┬─────────┘
             │
             │ Click "Affiliate Discovery" tab
             ▼
   ┌─────────────────────────────────────┐
   │  Affiliate Settings                 │
   ├─────────────────────────────────────┤
   │  Toggle: Auto-detect products ✓     │
   │  Toggle: Auto-research ✓            │
   │                                     │
   │  Blacklist:                         │
   │    [Facebook] [Google Ads] [+]      │
   │                                     │
   │  Whitelist (optional):              │
   │    [Apple] [Samsung] [+]            │
   │                                     │
   │  [Save Settings]                    │
   └─────────────────────────────────────┘
             │
             │ Saved to project metadata
             ▼
   Used in future article generations


┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                                        │
└─────────────────────────────────────────────────────────────────────────┘

Article Content (HTML/Text)
     │
     ├─> AI Detection (Claude) ─────────────┐
     │                                       │
     ├─> Products Detected                  │
     │   • product_name                      │
     │   • brand_name                        │
     │   • context                           │
     │   • confidence                        │
     │                                       │
     ├─> Opportunity Created ────────────────┤
     │   DB: affiliate_opportunities         │
     │   status: "discovered"                │
     │                                       │
     ├─> Research Triggered ─────────────────┤
     │   Perplexity Pro Sonar               │
     │   • Search web                        │
     │   • Find programs                     │
     │   • Cache results (24h)               │
     │                                       │
     ├─> Programs Found ─────────────────────┤
     │   • network                           │
     │   • commission                        │
     │   • cookie_duration                   │
     │   • signup_url                        │
     │                                       │
     └─> Opportunity Updated ────────────────┘
         status: "researching"
         affiliate_programs: [...]


┌─────────────────────────────────────────────────────────────────────────┐
│                      STATUS WORKFLOW                                     │
└─────────────────────────────────────────────────────────────────────────┘

discovered ──[Research]──> researching ──[Sign Up]──> signed_up ──[Activate]──> active
    │                           │                          │
    └───────[Dismiss]───────────┴─────[Dismiss]───────────┴────> dismissed


┌─────────────────────────────────────────────────────────────────────────┐
│                    CACHING & RATE LIMITING                               │
└─────────────────────────────────────────────────────────────────────────┘

Research Cache (In-Memory Map)
├─ Key: "product_brand" (lowercase)
├─ Value: { data, timestamp }
├─ TTL: 24 hours
└─ Benefits: Reduce API costs, faster responses

Rate Limiting (In-Memory Map)
├─ Key: "global" or user identifier
├─ Value: { count, resetTime }
├─ Limit: 60 requests per minute
└─ Benefits: Protect API quota, prevent abuse


┌─────────────────────────────────────────────────────────────────────────┐
│                      DATABASE SCHEMA                                     │
└─────────────────────────────────────────────────────────────────────────┘

affiliate_opportunities
├─ id (UUID, PK)
├─ project_id (UUID, FK -> projects)
├─ article_id (UUID, FK -> articles)
├─ product_name (TEXT, NOT NULL)
├─ brand_name (TEXT)
├─ mentioned_at (TEXT)  -- "Introductie", "Hoofdstuk 2"
├─ context (TEXT)       -- Surrounding text
├─ affiliate_programs (JSONB)  -- Array of programs
├─ status (TEXT)        -- discovered, researching, signed_up, active, dismissed
├─ research_completed (BOOLEAN)
├─ discovered_at (TIMESTAMP)
├─ updated_at (TIMESTAMP)
└─ metadata (JSONB)     -- Extensible data

Indexes:
├─ idx_affiliate_opps_project (project_id)
├─ idx_affiliate_opps_article (article_id)
├─ idx_affiliate_opps_status (status)
└─ idx_affiliate_opps_discovered_at (discovered_at DESC)


┌─────────────────────────────────────────────────────────────────────────┐
│                      ERROR HANDLING                                      │
└─────────────────────────────────────────────────────────────────────────┘

All affiliate operations are NON-BLOCKING:
├─ Article generation never fails due to affiliate errors
├─ Try-catch blocks around all affiliate calls
├─ Console logging for debugging
├─ Graceful degradation (empty results on error)
└─ User sees notification but article is saved

Example:
try {
  await discoverAffiliates();
} catch (error) {
  console.error('Affiliate discovery failed (non-blocking):', error);
  // Continue with article generation
}


┌─────────────────────────────────────────────────────────────────────────┐
│                      SECURITY MEASURES                                   │
└─────────────────────────────────────────────────────────────────────────┘

Authentication:
├─ All API endpoints check user authentication
└─ Redirect to /login if not authenticated

Authorization:
├─ Verify project ownership before access
├─ Check user_id matches project.user_id
└─ Return 403 Forbidden if unauthorized

Input Validation:
├─ Required field checks (project_id, content, etc.)
├─ Status enum validation
└─ Return 400 Bad Request if invalid

SQL Injection Protection:
├─ Use Supabase parameterized queries
├─ No raw SQL concatenation
└─ ORM-style query building


┌─────────────────────────────────────────────────────────────────────────┐
│                      PERFORMANCE OPTIMIZATIONS                           │
└─────────────────────────────────────────────────────────────────────────┘

Database:
├─ 4 indexes for fast queries
├─ JSONB for flexible program storage
└─ Cascading deletes for cleanup

Caching:
├─ 24-hour research cache
├─ Prevents duplicate API calls
└─ In-memory for speed

Rate Limiting:
├─ 60 requests/minute cap
├─ Protects Perplexity quota
└─ In-memory tracking

Non-Blocking:
├─ Async/await patterns
├─ Fire-and-forget for discoveries
└─ No blocking article generation
