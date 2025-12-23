# Content Plan Status System - Visual Guide

## UI Components Overview

### 1. Status Filter in Filter Bar

Located in the filter section alongside Cluster, Type, Priority, and Sort filters:

```
┌─────────────────────────────────────────────────────────────────┐
│ Cluster: [Alle ▼]  Type: [Alle ▼]  Prioriteit: [Alle ▼]        │
│                                                                   │
│ Status: [Alle Statussen ▼]  Sorteer: [Prioriteit ▼]  [🔍]      │
│                                                                   │
│ [Export CSV]                                                      │
└─────────────────────────────────────────────────────────────────┘
```

Status dropdown options:
- Alle Statussen
- 📝 Te doen
- 🔄 In progress
- 👀 Review
- ✅ Gepubliceerd
- 🔁 Update nodig

### 2. Status Statistics Cards

New row of 5 cards showing counts per status:

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 📝     15    │ │ 🔄     3     │ │ 👀     2     │ │ ✅     5     │ │ 🔁     1     │
│ Te doen      │ │ In progress  │ │ Review       │ │ Gepubliceerd │ │ Update nodig │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### 3. Status Badge per Article

Each article card now shows status as the first badge:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [📝 Te doen] [high] [Pillar Page] [WordPress SEO]                        │
│                                                                            │
│ WordPress Robots.txt Optimaliseren: Wat Moet Je Wel en Niet Blokkeren?   │
│                                                                            │
│ Learn how to optimize your WordPress robots.txt file for better SEO...   │
│                                                                            │
│ [robots.txt] [wordpress] [seo] [crawling] [indexing]                     │
│                                                                            │
│                           [Status ▼] [Schrijven] [🗑️]                    │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4. Status Dropdown per Article

Each article has a dropdown to change its status:

```
┌─────────────────────┐
│ 📝 Te doen         │ ← Current status shown
│ 🔄 In progress      │
│ 👀 Review           │
│ ✅ Gepubliceerd     │
│ 🔁 Update nodig     │
└─────────────────────┘
```

### 5. Complete Article Card with All Elements

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [📝 Te doen] [high] [Pillar Page] [WordPress SEO]                                │
│                                                                                    │
│ WordPress Robots.txt Optimaliseren: Wat Moet Je Wel en Niet Blokkeren?           │
│                                                                                    │
│ Een uitgebreide gids over het optimaliseren van je robots.txt bestand voor       │
│ betere WordPress SEO en crawl efficiency.                                         │
│                                                                                    │
│ [robots.txt] [wordpress] [seo] [crawling] [indexing]                             │
│                                                                                    │
│                                   [Status ▼] [Schrijven] [🗑️]                    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Status Colors & Styling

### Status Badge Colors (Tailwind)

1. **📝 Te doen**
   - Background: `bg-gray-800`
   - Text: `text-gray-300`
   - Default state for new articles

2. **🔄 In progress**
   - Background: `bg-blue-900/50`
   - Text: `text-blue-300`
   - Automatically set when clicking "Schrijven"

3. **👀 Review**
   - Background: `bg-yellow-900/50`
   - Text: `text-yellow-300`
   - Indicates article ready for review

4. **✅ Gepubliceerd**
   - Background: `bg-green-900/50`
   - Text: `text-green-300`
   - Set when article is published

5. **🔁 Update nodig**
   - Background: `bg-orange-900/50`
   - Text: `text-orange-300`
   - Indicates article needs updating

## User Workflows

### Workflow 1: New Article Creation

1. Generate content plan → All articles get status "📝 Te doen"
2. Click "Schrijven" → Status changes to "🔄 In progress"
3. Write article in editor
4. Mark as "👀 Review" when ready
5. After review, publish → Status becomes "✅ Gepubliceerd"

### Workflow 2: Updating Existing Content

1. Find published article with status "✅ Gepubliceerd"
2. Change status to "🔁 Update nodig"
3. Filter view to show only "Update nodig" articles
4. Click "Schrijven" → Status becomes "🔄 In progress"
5. Update content
6. Mark as "👀 Review" when ready
7. After review, republish → Status back to "✅ Gepubliceerd"

### Workflow 3: Content Planning & Prioritization

1. **View all "Te doen" articles**
   - Filter: Status = "📝 Te doen"
   - See all articles that haven't been started

2. **Track active work**
   - Filter: Status = "🔄 In progress"
   - See which articles are currently being worked on

3. **Review queue**
   - Filter: Status = "👀 Review"
   - See articles ready for review

4. **Published content**
   - Filter: Status = "✅ Gepubliceerd"
   - See all live articles

5. **Maintenance tasks**
   - Filter: Status = "🔁 Update nodig"
   - See articles that need updating

## Toast Notifications

When status is changed, a success toast appears:

```
                                        ┌─────────────────────┐
                                        │ ✓ Status bijgewerkt │
                                        └─────────────────────┘
                                          ↑ Bottom right corner
```

- Green background
- White text
- Appears for 2 seconds
- Fades out smoothly

## Statistics Dashboard

The main content plan page shows:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Content Plan                             │
│                                                                  │
│  [Select Project ▼]                      [Genereer Content Plan]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐ │
│  │     156     │ │     45      │ │      8      │ │    NL    │ │
│  │   Totaal    │ │   Pillar    │ │  Clusters   │ │   Taal   │ │
│  │  Artikelen  │ │   Pages     │ │             │ │          │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘ │
│                                                                  │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐           │
│  │ 📝 95 │ │ 🔄 12 │ │ 👀 8  │ │ ✅ 35 │ │ 🔁 6  │           │
│  │To Do  │ │ In pr │ │Review │ │Publish│ │Update │           │
│  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘           │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  Filters: [Cluster▼] [Type▼] [Prioriteit▼] [Status▼] [Sort▼] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Article cards listed here...                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Responsive Design

### Mobile View

On mobile devices, the UI adapts:

1. **Filter bar**: Stacks vertically
2. **Statistics**: Grid becomes 2 columns
3. **Article cards**: Full width
4. **Buttons**: Stack vertically within cards

```
Mobile Layout:
┌────────────────────┐
│ Cluster: [Alle ▼] │
│ Type: [Alle ▼]     │
│ Priority: [Alle ▼] │
│ Status: [Alle ▼]   │
│ Sort: [Prior ▼]    │
├────────────────────┤
│ [📝 Te doen]       │
│ [high] [Pillar]    │
│                    │
│ Article Title...   │
│                    │
│ Description...     │
│                    │
│ [Status ▼]         │
│ [Schrijven]        │
│ [🗑️]               │
└────────────────────┘
```

## Keyboard & Accessibility

- All dropdowns are keyboard navigable
- Status changes announced to screen readers
- Color coding supplemented with icons
- Clear visual hierarchy
- High contrast text

## Performance Notes

- Status stats memoized (recalculated only when content plan changes)
- Index map for O(1) lookups (efficient even with 1000+ articles)
- Optimistic UI updates (instant feedback)
- Database saves in background
