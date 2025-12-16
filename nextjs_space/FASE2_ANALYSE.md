# Fase 2: Social Media Routes Consolidatie - Analyse

## Huidige Situatie
**Totaal aantal routes:** 38 social media routes
**Doel:** Consolideren naar 12-15 routes (~65% reductie)

---

## Geïdentificeerde Duplicaties en Overlappingen

### 1. 🔴 Content Generation (9 routes → 2-3 routes)
**Duidelijke duplicaties:**

#### Posts Generation (4 duplicate routes):
- `generate-social-post/route.ts` (421 lines) - POST
- `social-media-posts/generate/route.ts` (368 lines) - POST  
- `social-media-posts/generate-direct/route.ts` (307 lines) - POST
- `social-media/generate-post/route.ts` (169 lines) - POST
- `social/generate/route.ts` (196 lines) - POST

**Probleem:** 5 verschillende endpoints doen allemaal hetzelfde - posts genereren
**Oplossing:** Consolideer naar `api/client/social/generate` met parameters voor type

#### Ideas Generation (2 duplicate routes):
- `social-media-ideas/generate/route.ts` (274 lines) - POST
- `social/generate-ideas/route.ts` (287 lines) - POST

**Probleem:** Twee endpoints voor ideas genereren
**Oplossing:** Merge naar `api/client/social/ideas/generate`

#### Overige:
- `social-media-topics/generate/route.ts` (171 lines) - POST
- `social-media/generate-planning/route.ts` (174 lines) - POST

---

### 2. 🔴 Posts Management (8 routes → 2 routes)
**Duidelijke duplicaties:**

#### List/Create Posts (3 duplicate routes):
- `social-media-posts/route.ts` (162 lines) - GET, DELETE, PATCH
- `social-media/posts/route.ts` (229 lines) - GET, POST, DELETE
- `social/route.ts` (167 lines) - GET, POST

**Probleem:** Drie verschillende base endpoints voor posts
**Oplossing:** Consolideer naar `api/client/social/posts` (RESTful)

#### Single Post CRUD (2 duplicate routes):
- `social-media-posts/[postId]/route.ts` (54 lines) - DELETE
- `social/[id]/route.ts` (165 lines) - GET, PUT, DELETE

**Probleem:** Twee endpoints voor single post operations
**Oplossing:** Consolideer naar `api/client/social/posts/[id]` (RESTful)

#### Overige:
- `social-media-posts/bulk-delete/route.ts` (68 lines) - POST
- `social-media/all-posts/route.ts` (59 lines) - GET
- `social/queue/route.ts` (161 lines) - GET, PUT

---

### 3. 🟡 Scheduling (4 routes → 1-2 routes)
**Overlap:**
- `social-media-posts/schedule/route.ts` (68 lines) - POST
- `social-media/schedules/route.ts` (293 lines) - GET, POST, DELETE, PATCH (meest compleet)
- `social/schedule/route.ts` (172 lines) - GET, POST
- `social/schedule/[id]/route.ts` (142 lines) - PUT, DELETE

**Probleem:** Vier verschillende scheduling endpoints
**Oplossing:** Consolideer naar:
- `api/client/social/schedules` (list/create)
- `api/client/social/schedules/[id]` (update/delete)

---

### 4. 🟡 Publishing (2 routes → 1 route)
**Overlap:**
- `social-media-posts/publish/route.ts` (113 lines) - POST
- `social-media/publish/route.ts` (245 lines) - POST (meer compleet)

**Probleem:** Twee publish endpoints
**Oplossing:** Consolideer naar `api/client/social/publish`

---

### 5. 🟡 Ideas Management (2 routes → 1 route)
**Overlap:**
- `social-media-ideas/route.ts` (163 lines) - GET, DELETE, PATCH
- `social/ideas/route.ts` (222 lines) - GET, POST

**Probleem:** Twee verschillende ideas management endpoints
**Oplossing:** Consolideer naar `api/client/social/ideas` (RESTful)

---

### 6. 🟢 Account Management (5 routes → 2-3 routes)
**Mogelijke consolidatie:**
- `social-media/connect/route.ts` (83 lines) - POST
- `social-media/link-account/route.ts` (174 lines) - POST, DELETE
- `social-media/load-accounts/route.ts` (74 lines) - POST
- `social-media/save-accounts/route.ts` (67 lines) - POST
- `social-media/test-connection/route.ts` (96 lines) - POST

**Oplossing:** Consolideer naar:
- `api/client/social/accounts` (list, save, load)
- `api/client/social/accounts/connect` (connect, test)
- `api/client/social/accounts/[id]` (link/unlink specific account)

---

### 7. 🟢 Configuration (2 routes → 1 route)
- `social-media/config/route.ts` (217 lines) - GET, POST
- `social-media/profile/route.ts` (149 lines) - GET, POST

**Oplossing:** Merge naar `api/client/social/settings` (covers config + profile)

---

### 8. 🟢 Behouden (minimale consolidatie)
- **Analytics:** `social/analytics/route.ts` ✅ Behouden
- **Automation:** 
  - `social-media/auto-setup/route.ts` ✅ Behouden
  - `social-media/autopilot-run/route.ts` ✅ Behouden
- **Team Management:**
  - Beide invite routes kunnen gemerged ✅
- **Topics:** `social-media-topics/route.ts` ✅ Behouden

---

## Samenvatting Duplicaties

| Categorie | Huidige Routes | Duplicaties | Kan naar |
|-----------|---------------|-------------|----------|
| Content Generation | 9 | 7 duplicaties | 3 routes |
| Posts Management | 8 | 5 duplicaties | 2 routes |
| Scheduling | 4 | 3 duplicaties | 2 routes |
| Publishing | 2 | 1 duplicatie | 1 route |
| Ideas Management | 2 | 1 duplicatie | 1 route |
| Account Management | 5 | Overlap | 2-3 routes |
| Configuration | 2 | Overlap | 1 route |
| Analytics | 1 | Geen | 1 route |
| Automation | 2 | Geen | 2 routes |
| Team Management | 2 | Overlap | 1 route |
| Topics | 1 | Geen | 1 route |

**Totaal:** 38 routes → **13-15 routes** (61-66% reductie)

---

## Impact Analyse

### Code Reductie
- **Voor consolidatie:** ~6,500 lines of code verspreid over 38 files
- **Na consolidatie:** ~4,000-4,500 lines (verwacht)
- **Geschatte reductie:** 30-35% code reduction

### Maintenance Burden
- **Voor:** 38 endpoints om te onderhouden
- **Na:** 13-15 endpoints
- **Reductie:** 60-65% minder endpoints

### API Complexity
- **Voor:** Verwarrende structuur met 3+ wegen naar zelfde functionaliteit
- **Na:** Duidelijke RESTful structuur met single source of truth

---

## Volgende Stap
→ Ontwerp nieuwe geconsolideerde structuur (Fase 2.3)
