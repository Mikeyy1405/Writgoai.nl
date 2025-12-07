# Content Hub - Visual Guide

## Page Structure

### Before (Redirect Page)
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                   ⟳ Loading spinner                 │
│                                                     │
│         "Doorverwijzen naar projecten..."           │
│                                                     │
│                (Auto-redirects to projects)         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### After (Full Content Hub Page)
```
┌─────────────────────────────────────────────────────┐
│  ✨ Content Hub                                     │
│  Selecteer een project om content te plannen        │
│                                                     │
│  Selecteer Project                                  │
│  ┌─────────────────────────────────────────────┐  │
│  │  🌐  computerstartgids.nl          ▼        │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │  🌐 computerstartgids.nl                      │ │
│  │  Algemene Content                             │ │
│  │                                               │ │
│  │  [Autoriteit] [Bestaand] [Te Schrijven] [...] │ │
│  ├───────────────────────────────────────────────┤ │
│  │  📝 Alle Artikelen | ⏱️ Te Schrijven | ...    │ │
│  │                                               │ │
│  │  [Content lijst / Topical Map / etc.]         │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Navigation Changes

### Sidebar - Before
```
┌─────────────────────────┐
│ Overzicht               │
├─────────────────────────┤
│ 📊 Dashboard            │
└─────────────────────────┘
```

### Sidebar - After
```
┌─────────────────────────┐
│ Overzicht               │
├─────────────────────────┤
│ 📊 Dashboard            │
│ ✨ Content Hub  [Nieuw] │ ← NEW
│ 🌐 Projecten            │ ← NEW
└─────────────────────────┘
```

## User Workflows

### Workflow 1: Via Standalone Content Hub (NEW)
```
Sidebar → Content Hub
    ↓
Auto-select Primary Project
    ↓
View/Edit Content Planning
    ↓
[Optional] Switch to Different Project
    ↓
Continue Content Planning
```

### Workflow 2: Via Project Detail (Still Available)
```
Sidebar → Projecten
    ↓
Select a Project
    ↓
Click "Content Planning" Tab
    ↓
View/Edit Content Planning
```

## Component Architecture

```
ContentHubPage
├── Header
│   ├── Sparkles Icon
│   └── Title + Description
├── ProjectSelector
│   ├── Dropdown Button
│   ├── Project List
│   │   ├── Project 1 (Primary)
│   │   ├── Project 2
│   │   └── Project 3
│   └── "Geen project gebruiken"
└── Content Area
    ├── [If Project Selected]
    │   └── ProjectContentHub
    │       ├── Site Overview Card
    │       │   ├── WordPress URL
    │       │   ├── Niche
    │       │   ├── Stats (Autoriteit, Bestaand, etc.)
    │       │   └── Sync Button
    │       └── Content Tabs
    │           ├── Alle Artikelen
    │           ├── Te Schrijven
    │           ├── Voltooid
    │           ├── 🗺️ Topical Map
    │           ├── 📚 Bibliotheek
    │           └── 🤖 Autopilot
    └── [If No Project]
        └── Empty State Card
            ├── Info Icon
            ├── "Geen project geselecteerd"
            └── Help Text
```

## Data Flow

```
User Selects Project
        ↓
ProjectSelector onChange
        ↓
handleProjectChange(projectId, project)
        ↓
Update State:
  - selectedProject
  - selectedProjectId
        ↓
ProjectContentHub Renders
        ↓
Fetch ContentHubSite via API
  /api/content-hub/connect-wordpress
        ↓
Load Project Data:
  - Site info
  - Knowledge Base entries
  - Affiliate Links
  - WordPress integration
  - GSC integration
        ↓
Display Content Hub Functionality
```

## Project Data Integration

The selected project automatically provides:

```
Selected Project
├── Basic Info
│   ├── id
│   ├── name
│   ├── websiteUrl
│   ├── description
│   ├── language
│   └── niche
├── Knowledge Base
│   └── All entries for this project
├── Affiliate Links
│   └── All links for this project
└── Integrations
    ├── WordPress
    │   ├── URL
    │   ├── Credentials
    │   └── Connection Status
    └── Google Search Console
        ├── Site URL
        ├── OAuth Status
        └── Analytics Data
```

## Features Available in Content Hub

### 1. Topical Map View
- Generate topical map for project niche
- View cluster structure
- Plan content strategy
- See keyword opportunities

### 2. Bibliotheek (Library)
- Browse all content in progress
- View completed articles
- Track writing status
- Edit article metadata

### 3. Autopilot Settings
- Configure automatic content generation
- Set frequency and rules
- Enable/disable autopilot
- View generation history

### 4. WordPress Posts List
- View all WordPress posts
- Sync existing posts
- Publish new content
- Edit post details

## Benefits Summary

### For Users
✅ **Single Place** for all content planning
✅ **Quick Access** via sidebar navigation
✅ **Project Switching** without page navigation
✅ **Full Functionality** - all features available
✅ **Familiar Interface** - reuses existing components

### For Developers
✅ **Component Reuse** - no new components needed
✅ **Minimal Changes** - only 2 files modified
✅ **Type Safety** - full TypeScript support
✅ **No Breaking Changes** - backward compatible
✅ **Easy Maintenance** - follows existing patterns

## Mobile Responsive

The page is fully responsive:

### Desktop (>1024px)
- Full layout with sidebar
- All content visible
- Multi-column stats
- Full tab labels

### Tablet (768px - 1024px)
- Sidebar toggleable
- Adjusted spacing
- 2-column stats
- Full functionality

### Mobile (<768px)
- Hamburger menu
- Vertical layout
- Single column stats
- Icon-based tabs
- Touch-optimized

---

**Implementation Status:** ✅ Complete
**Ready for Deployment:** ✅ Yes
**Runtime Testing Required:** Manual testing in production/staging environment
