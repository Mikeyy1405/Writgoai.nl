# WritGo API Inventory & Consolidatie Strategie

**Datum:** 18 december 2024  
**Status:** Phase 2.1 - API Analyse

## Executive Summary

WritGo heeft momenteel **596 API routes** verspreid over 37 categorieën. Dit is een zeer complexe API structuur die geleidelijke consolidatie vereist.

## Current API Statistics

| Category | Route Count | Priority |
|----------|------------|----------|
| client | 267 | High - Consolidate core routes |
| admin | 155 | High - Consolidate essentials |
| ai-agent | 27 | Medium - Review integration |
| cron | 23 | Low - Keep as-is |
| **simplified** | **19** | **Active - Expand** |
| financien | 12 | Low - Keep separate module |
| content-hub | 11 | Medium - Evaluate |
| vadoo | 7 | Low - Keep as-is |
| social | 6 | Medium - Consolidate |
| superadmin | 6 | Low - Keep separate |

### Existing Simplified Routes (19)

Huidige simplified API endpoints:
1. `/api/simplified/blog` - Blog listing
2. `/api/simplified/blog/[slug]` - Individual blog post
3. `/api/simplified/content` - Content management
4. `/api/simplified/content-plan` - Content planning
5. `/api/simplified/content-plan/analyze-wordpress` - WordPress analysis
6. `/api/simplified/dashboard/projects` - Dashboard projects
7. `/api/simplified/generate` - Content generation
8. `/api/simplified/generate/quick` - Quick generation
9. `/api/simplified/platforms` - Platform management ✅ (Phase 1)
10. `/api/simplified/projects` - Projects list
11. `/api/simplified/projects/[id]` - Single project
12. `/api/simplified/publish` - Publishing
13. `/api/simplified/publish/wordpress` - WordPress publishing
14. `/api/simplified/rewrite` - Content rewriting
15. `/api/simplified/social-media/generate` - Social media generation
16. `/api/simplified/social-media/history` - Social media history
17. `/api/simplified/social-media/post` - Social media posting
18. `/api/simplified/social-media/settings` - Social media settings
19. `/api/simplified/stats` - Statistics

## Consolidatie Strategie

### Phase 2A: Core API Consolidation (Immediate)

**Target: Add 10-15 nieuwe simplified routes voor core functionaliteit**

#### 1. Account Management (nieuw - Phase 1 added)
- ✅ `/api/simplified/account` - GET/PATCH account info
- ✅ `/api/simplified/account/branding` - GET/POST branding settings

#### 2. Content Overview & Management
- 🔄 `/api/simplified/content-overview` - GET all content across projects
- 🔄 `/api/simplified/content/[id]` - GET/PATCH/DELETE single content
- 🔄 `/api/simplified/content/bulk` - POST bulk operations

#### 3. Platform Integration
- ✅ `/api/simplified/platforms` - Already exists
- 🔄 `/api/simplified/platforms/[id]` - GET/PATCH/DELETE single platform
- 🔄 `/api/simplified/platforms/test` - POST test connection

#### 4. Dashboard & Stats
- ✅ `/api/simplified/stats` - Already exists
- 🔄 `/api/simplified/dashboard/overview` - GET dashboard overview
- 🔄 `/api/simplified/dashboard/recent-activity` - GET recent activity

### Phase 2B: Admin Interface API (High Priority)

**Target: Identificeer en migreer 20-30 essentiële admin routes**

Vanaf de 155 admin routes, focus op:
1. User management (clients, projects)
2. Content moderation
3. System settings
4. Analytics & reporting

### Phase 2C: Component Deduplication (Parallel)

Focus op het identificeren en samenvoegen van:
1. Duplicate API calls in components
2. Redundant data fetching patterns
3. Inconsistent error handling

## API Design Patterns

### Consistent Error Handling

```typescript
// Standard error response format
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "User-friendly message",
    details?: any
  }
}
```

### Standard Success Response

```typescript
{
  success: true,
  data: any,
  meta?: {
    pagination?: {...},
    timestamp: string
  }
}
```

### Request Validation

- All routes must validate input using Zod schemas
- Authentication checks via middleware
- Rate limiting for AI endpoints

## Migration Guidelines

### When to Migrate a Route

✅ Migrate if:
- Used by simplified interface
- Part of core user flow (dashboard, content, platforms)
- Duplicate functionality exists
- Poor error handling
- Inconsistent with API standards

❌ Keep separate if:
- Cron job (internal only)
- Third-party webhook
- Low-level system function
- Module-specific (financien, vadoo)
- Rarely used admin function

### Migration Checklist

For each migrated route:

- [ ] Create new `/api/simplified/[route]/route.ts`
- [ ] Implement consistent error handling
- [ ] Add input validation (Zod)
- [ ] Replace mock data with real queries
- [ ] Add TypeScript types
- [ ] Test endpoint thoroughly
- [ ] Update frontend to use new endpoint
- [ ] Add deprecation notice to old endpoint
- [ ] Add redirect from old to new (if applicable)
- [ ] Update API documentation

## Next Steps

1. ✅ Create API inventory (this document)
2. 🔄 Identify core routes for Phase 2A (next)
3. ⏳ Implement simplified API routes
4. ⏳ Update components to use new routes
5. ⏳ Test and validate all changes

## Metrics

**Current State:**
- Total Routes: 596
- Simplified Routes: 19 (3.2%)
- Legacy Routes: 577 (96.8%)

**Target State (End of Phase 2):**
- Simplified Routes: 40-50 (core functionality covered)
- Consolidated Routes: ~500
- Deprecated Routes: Clearly marked

**Target State (End of Phase 4):**
- Simplified Routes: 80-100 (all core + common features)
- Legacy Routes: Only specialized modules
- Clean separation: Core vs. Modules vs. System

## Notes

- Financien module (12 routes) blijft separaat - specifiek voor Nederlandse boekhouding
- Cron jobs (23 routes) zijn internal-only, geen consolidatie nodig
- Vadoo (7 routes) is third-party integratie, keep as-is
- Focus op client (267) en admin (155) routes voor grootste impact
