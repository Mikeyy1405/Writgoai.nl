# Fase 4: Projects Route Analyse

## 📊 Huidige Structuur (21 Routes)

### 1. **Project CRUD Operations** (2 routes)
- `/api/client/projects` - GET, POST
  - GET: Alle projecten ophalen (inclusief collaborator projecten)
  - POST: Nieuw project aanmaken
- `/api/client/projects/[id]` - GET, PUT, PATCH, DELETE
  - GET: Project details ophalen
  - PUT/PATCH: Project updaten
  - DELETE: Project verwijderen

### 2. **Affiliate Links Management** (5 routes)
- `/api/client/projects/[id]/affiliate-feed` - POST
  - POST: Affiliate feed importeren
- `/api/client/projects/[id]/affiliate-links` - GET, POST, PATCH, DELETE
  - GET: Alle affiliate links ophalen
  - POST: Nieuwe affiliate link toevoegen
  - PATCH: Affiliate link updaten
  - DELETE: Affiliate link verwijderen
- `/api/client/projects/[id]/affiliate-links/bulk` - POST
  - POST: Bulk import van affiliate links (met AI titel generatie)
- `/api/client/projects/[id]/bolcom/test` - POST
  - POST: Test Bol.com credentials
- `/api/client/projects/[id]/tradetracker-feed` - POST
  - POST: Import TradeTracker productfeed

### 3. **Content Strategy & Research** (3 routes)
- `/api/client/projects/[id]/content-analysis` - GET, POST, PATCH
  - GET: Haal content analysis op
  - POST: Genereer nieuwe content analysis
  - PATCH: Update content analysis
- `/api/client/projects/[id]/content-strategy` - GET, POST, PATCH
  - GET: Haal content strategy op
  - POST: Genereer nieuwe content strategy
  - PATCH: Update content strategy
- `/api/client/projects/[id]/keyword-research` - GET, POST, PATCH
  - GET: Haal keyword research op
  - POST: Genereer nieuwe keyword research
  - PATCH: Update keyword research

### 4. **Knowledge Base** (2 routes)
- `/api/client/projects/[id]/knowledge` - GET, POST
  - GET: Knowledge base items ophalen
  - POST: Nieuwe knowledge item toevoegen
- `/api/client/projects/[id]/knowledge/[knowledgeId]` - PUT, DELETE
  - PUT: Knowledge item bijwerken
  - DELETE: Knowledge item verwijderen

### 5. **WordPress Integration** (3 routes)
- `/api/client/projects/[id]/wordpress` - PUT, DELETE
  - PUT: WordPress instellingen opslaan
  - DELETE: WordPress verbinding verwijderen
- `/api/client/projects/[id]/wordpress/test` - POST
  - POST: Test WordPress verbinding
- `/api/client/projects/[id]/auto-create-content-hub` - POST
  - POST: Auto-create ContentHubSite from WordPress config

### 6. **Sitemap & Scanning** (3 routes)
- `/api/client/projects/[id]/sitemap` - GET
  - GET: Sitemap URLs laden voor project
- `/api/client/projects/[id]/[projectId]/load-sitemap` - GET, POST
  - GET/POST: Load sitemap for scanning
- `/api/client/projects/[id]/rescan` - POST
  - POST: Re-scan website voor updates

### 7. **Collaborators** (1 route)
- `/api/client/projects/[id]/collaborators` - GET, POST, DELETE
  - GET: Alle collaborators ophalen
  - POST: Nieuwe collaborator toevoegen
  - DELETE: Collaborator verwijderen

### 8. **WooCommerce** (1 route)
- `/api/client/projects/woocommerce-settings` - GET, POST
  - GET: WooCommerce instellingen ophalen
  - POST: WooCommerce instellingen opslaan

### 9. **Deprecated** (1 route)
- `/api/client/projects/transfer-management` - POST (deprecated)
  - Deze functionaliteit is verwijderd - gebruik nu collaborators

---

## 🔍 Consolidatie Analyse

### Identified Issues:
1. **Inconsistent Nesting**: `woocommerce-settings` staat op root niveau ipv onder `[id]/`
2. **Duplicate Sitemap Logic**: 2 verschillende sitemap routes
3. **Scattered Affiliate Routes**: 5 verschillende routes voor affiliate functionaliteit
4. **Content Research Fragmentation**: 3 aparte routes met identieke patronen (GET/POST/PATCH)
5. **Test Routes**: Separate test routes kunnen worden samengevoegd met main routes
6. **Deprecated Route**: `transfer-management` kan worden verwijderd

### Consolidation Opportunities:

#### 1. **Affiliate Routes** (5 → 2 routes)
**Current:**
- affiliate-feed (POST)
- affiliate-links (GET, POST, PATCH, DELETE)
- affiliate-links/bulk (POST)
- bolcom/test (POST)
- tradetracker-feed (POST)

**Proposed:**
- `/projects/[id]/affiliate-links` - GET, POST, PATCH, DELETE
  - POST with `?bulk=true` voor bulk import
  - POST with `?source=bolcom|tradetracker` voor feed imports
- `/projects/[id]/affiliate-links/[linkId]` - GET, PATCH, DELETE
- Test functionaliteit integreren in main route met `?test=true`

#### 2. **Content Research Routes** (3 → 1 route)
**Current:**
- content-analysis (GET, POST, PATCH)
- content-strategy (GET, POST, PATCH)
- keyword-research (GET, POST, PATCH)

**Proposed:**
- `/projects/[id]/research` - GET
  - GET with `?type=analysis|strategy|keywords` or GET all
- `/projects/[id]/research/[type]` - POST, PATCH
  - Where type = analysis | strategy | keywords

#### 3. **Sitemap Routes** (3 → 1 route)
**Current:**
- sitemap (GET)
- [projectId]/load-sitemap (GET, POST)
- rescan (POST)

**Proposed:**
- `/projects/[id]/sitemap` - GET, POST
  - GET: Load sitemap
  - POST: Rescan/reload sitemap
  - POST with `?action=scan` voor rescan

#### 4. **WordPress Routes** (3 → 1 route)
**Current:**
- wordpress (PUT, DELETE)
- wordpress/test (POST)
- auto-create-content-hub (POST)

**Proposed:**
- `/projects/[id]/integrations/wordpress` - GET, PUT, DELETE, POST
  - GET: Get settings
  - PUT: Update settings
  - DELETE: Remove connection
  - POST with `?action=test` voor testing
  - POST with `?action=create-hub` voor content hub creation

#### 5. **WooCommerce Route** (1 route - move location)
**Current:**
- `/projects/woocommerce-settings` (GET, POST)

**Proposed:**
- `/projects/[id]/integrations/woocommerce` - GET, PUT
  - Consistent met WordPress integration pattern

#### 6. **Knowledge Base** (Already RESTful - Keep)
- `/projects/[id]/knowledge` - GET, POST
- `/projects/[id]/knowledge/[knowledgeId]` - PUT, DELETE

#### 7. **Collaborators** (Already RESTful - Keep)
- `/projects/[id]/collaborators` - GET, POST, DELETE

#### 8. **Project CRUD** (Already RESTful - Keep)
- `/projects` - GET, POST
- `/projects/[id]` - GET, PUT, PATCH, DELETE

---

## 🎯 Proposed New Structure (11 Routes - 48% Reduction)

### Core Routes (2)
1. `/api/client/projects` - GET, POST
2. `/api/client/projects/[id]` - GET, PUT, PATCH, DELETE

### Resource Routes (9)
3. `/api/client/projects/[id]/collaborators` - GET, POST, DELETE
4. `/api/client/projects/[id]/knowledge` - GET, POST
5. `/api/client/projects/[id]/knowledge/[knowledgeId]` - PUT, DELETE
6. `/api/client/projects/[id]/affiliate-links` - GET, POST
7. `/api/client/projects/[id]/affiliate-links/[linkId]` - PATCH, DELETE
8. `/api/client/projects/[id]/research/[type]` - GET, POST, PATCH
9. `/api/client/projects/[id]/sitemap` - GET, POST
10. `/api/client/projects/[id]/integrations/wordpress` - GET, PUT, POST, DELETE
11. `/api/client/projects/[id]/integrations/woocommerce` - GET, PUT

---

## 📈 Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Total Routes | 21 | 11 | -48% |
| Affiliate Routes | 5 | 2 | -60% |
| Content Research Routes | 3 | 1 | -67% |
| Sitemap Routes | 3 | 1 | -67% |
| WordPress Routes | 3 | 1 | -67% |
| Integration Routes | 4 | 2 | -50% |

**Total Reduction: 10 routes (48%)**

---

## ✅ Benefits

1. **RESTful Design**: Consistent HTTP method usage
2. **Logical Grouping**: Related functionality grouped under `/integrations/` and `/research/`
3. **Reduced Complexity**: Fewer routes to maintain and document
4. **Better DX**: More intuitive API structure
5. **Easier Testing**: Fewer endpoints to test
6. **Query Parameters**: Use of query params for variations instead of separate routes

---

## 🚀 Implementation Plan

### Phase 1: Create New Consolidated Routes
1. Create `/integrations/wordpress` route
2. Create `/integrations/woocommerce` route
3. Create `/research/[type]` route
4. Update `/affiliate-links` route with query param support
5. Update `/sitemap` route with action support

### Phase 2: Migrate Logic
1. Move logic from old routes to new consolidated routes
2. Ensure all HTTP methods are properly handled
3. Add query parameter handling
4. Maintain backwards compatibility where needed

### Phase 3: Update Frontend
1. Find all frontend calls to old routes
2. Update to new route structure
3. Update with new query parameters

### Phase 4: Testing & Cleanup
1. Test all functionality
2. Remove deprecated routes
3. Update documentation
4. Build verification

### Phase 5: Deployment
1. Commit changes
2. Push to GitHub
3. Create deployment report
