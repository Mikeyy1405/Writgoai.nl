# Route Migration Guide

**Last Updated:** 18 December 2025  
**Status:** Active Migration  
**Target:** Simplified Interface Consolidation

---

## 📋 Overview

This document tracks the migration of legacy routes to the new **Simplified Interface** (`(simplified)` route group). All routes are being consolidated to provide a consistent dark-theme experience with unified navigation.

---

## ✅ Completed Migrations

### Blog Routes
| Old Route | New Route | Status | Migration Date |
|-----------|-----------|--------|----------------|
| `/blog` (standalone) | `/blog` (in simplified) | ✅ Complete | Dec 18, 2025 |
| `/blog/[slug]` | `/blog/[slug]` (in simplified) | ✅ Complete | Dec 18, 2025 |

**Changes:**
- ✅ Moved to `(simplified)` route group
- ✅ Dark theme applied
- ✅ API routes created (`/api/simplified/blog`)
- ✅ Added to SimplifiedNavigation
- ✅ Middleware protection added
- ✅ Removed PublicNav dependency

---

## 🔄 Active Redirects

The following redirects are now active in middleware:

| Legacy Route | Redirects To | Status | Added In |
|--------------|--------------|--------|----------|
| `/client-portal/dashboard` | `/dashboard` | ✅ Active | Subtask 1 |
| `/client-portal/content-planner` | `/topical-authority` | ✅ Active | Subtask 1 |
| `/client-portal/content-library` | `/content` | ✅ Active | Subtask 1 |
| `/client-portal/settings` | `/instellingen` | ✅ Active | Subtask 1 |
| `/client-portal/account` | `/account` | ✅ Active | Phase 1 |
| `/dashboard/overzicht` | `/dashboard` | ✅ Active | Subtask 1 |
| `/dashboard/content` | `/content` | ✅ Active | Subtask 1 |
| `/dashboard/instellingen` | `/instellingen` | ✅ Active | Subtask 1 |
| `/dashboard/platforms` | `/platforms` | ✅ Active | Phase 1 |
| `/dashboard/account` | `/account` | ✅ Active | Phase 1 |

---

## 🎯 Current Simplified Routes

These are the canonical routes users should use:

| Route | Purpose | Component | Protection | Phase |
|-------|---------|-----------|------------|-------|
| `/dashboard` | Unified Dashboard | `(simplified)/page.tsx` | ✅ Protected | Phase 1 |
| `/topical-authority` | Content Planning | `(simplified)/topical-authority` | ✅ Protected | Existing |
| `/content` | Content Overview | `(simplified)/content` | ✅ Protected | Existing |
| `/blog` | WritGo Blog | `(simplified)/blog` | ✅ Protected | Subtask 1 |
| `/platforms` | Platform Connections | `(simplified)/platforms` | ✅ Protected | Phase 1 |
| `/performance` | Performance Metrics | `(simplified)/performance` | ✅ Protected | Existing |
| `/account` | Account & Billing | `(simplified)/account` | ✅ Protected | Phase 1 |
| `/instellingen` | Settings | `(simplified)/instellingen` | ✅ Protected | Existing |

---

## ⚠️ Deprecated Routes

These routes show deprecation banners but remain functional:

| Route Group | Status | Deprecation Banner | Removal Target |
|-------------|--------|-------------------|----------------|
| `/client-portal/*` | ⚠️ Deprecated | ✅ Active | Q1 2026 |
| `/admin-portal/*` | ⚠️ Deprecated | ✅ Active | Q1 2026 |

---

## 🚧 Pending Migrations

### High Priority Legacy Routes

Routes to migrate in Phase 2:

1. **Dashboard Routes**
   - `/dashboard/*` (49 routes) → Consolidate into `/dashboard`
   
2. **Content Routes**
   - `/client-portal/content-*` → Merge into `/content`
   
3. **Admin Routes**
   - `/admin/*` (70 routes) → Migrate to admin section in simplified

---

## 📊 Migration Statistics

- **Total Routes:** 248
- **Simplified Routes:** 17 (7% - up from 3%)
- **Deprecated Routes:** ~200 (81%)
- **Active Redirects:** 10 (up from 7)
- **Deprecation Banners:** 2
- **Phase 1 Progress:** 3 core routes migrated ✅

---

## 🔧 Technical Details

### Middleware Configuration

The middleware now:
1. Protects `/blog` routes (requires authentication)
2. Redirects legacy routes to new canonical routes
3. Blocks AI bots
4. Maintains admin access controls

```typescript
// Matcher includes:
'/blog/:path*',              // Protected blog routes
'/dashboard/:path*',         // Dashboard routes
'/topical-authority/:path*', // Content planning
'/content/:path*',           // Content overview
'/instellingen/:path*',      // Settings
```

### API Routes

New API routes created:
- `/api/simplified/blog` - List blog posts
- `/api/simplified/blog/[slug]` - Get single blog post

---

## 👥 User Communication

### Deprecation Banners

Active banners inform users about:
- Route deprecation timeline
- Links to new routes
- Migration benefits

**Locations:**
- Client Portal Layout
- Admin Portal Layout

---

## 📝 Developer Notes

### Adding New Routes

When adding new routes, follow this pattern:

1. **Create in `(simplified)` group**
   ```
   app/(simplified)/[feature]/page.tsx
   ```

2. **Use dark theme styling**
   - `bg-gray-900` backgrounds
   - `text-white` text
   - `border-orange-500` accents

3. **Add to SimplifiedNavigation**
   ```typescript
   { 
     href: '/feature', 
     label: 'Feature', 
     icon: Icon,
     description: 'Description'
   }
   ```

4. **Protect in middleware**
   ```typescript
   '/feature/:path*',
   ```

5. **Create API routes if needed**
   ```
   app/api/simplified/[feature]/route.ts
   ```

### Testing Checklist

When migrating routes:
- [ ] Dark theme applied consistently
- [ ] Navigation links updated
- [ ] Middleware protection added
- [ ] API routes functional
- [ ] Old routes redirect correctly
- [ ] No console errors
- [ ] Responsive design works
- [ ] Authentication works

---

## 🔄 Rollback Plan

If issues arise:

### Quick Rollback
```bash
# Revert git changes
git revert [commit-hash]
git push

# Or restore backup
rm -rf app/(simplified)/blog
mv app/blog.backup app/blog
```

### Partial Rollback
- Disable redirects in middleware
- Keep old and new routes parallel
- Add feature flag for gradual migration

---

## 📞 Support

For migration questions:
- Technical Lead: Development Team
- Documentation: This guide + `writgo_action_plan.md`
- Issues: Create GitHub issue with `migration` label

---

## 📅 Timeline

### Phase 1: Critical Fixes ✅ COMPLETE
- Week 1 (Dec 18-24, 2025)
- Blog migration
- Core redirects
- Deprecation banners

### Phase 2: Legacy Cleanup 🚧 PLANNED
- Week 2-4 (Jan 2026)
- Dashboard consolidation
- Component cleanup
- Full testing

### Phase 3: Final Migration 📋 PLANNED
- Q1 2026
- Remove deprecated routes
- Archive old code
- Final documentation update

---

**Last Updated:** December 18, 2025
