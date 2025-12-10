# WritgoAI Command Center - Visual Guide

## Dashboard Layout Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🚀 WritgoAI Command Center                            [Sync] [Settings]   │
│  Welkom terug, Admin! Hier is je overzicht voor vandaag.                   │
│  Laatst bijgewerkt: 2 minuten geleden                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  KPI CARDS ROW                                                               │
├──────────────────┬──────────────────┬──────────────────┬───────────────────┤
│  📧 Inbox        │  💰 Financiën    │  📝 Content      │  📱 Social        │
│  0 nieuw         │  €5.420 MRR      │  3 concepten     │  0 gepland        │
└──────────────────┴──────────────────┴──────────────────┴───────────────────┘

┌─────────────────────────────────────────────┬───────────────────────────────┐
│  LEFT COLUMN (60%)                          │  RIGHT COLUMN (40%)           │
├─────────────────────────────────────────────┼───────────────────────────────┤
│  ┌────────────────────────────────────────┐ │  ┌──────────────────────────┐│
│  │ ✨ AI Assistent                        │ │  │ ✅ Vandaag Te Doen       ││
│  │                                         │ │  │                          ││
│  │ [Input: Vraag je AI assistent...]  [→] │ │  │ ☐ 3 concept facturen     ││
│  │                                         │ │  │    versturen             ││
│  │ Snelle suggesties:                      │ │  │ ☐ 1 te late factuur      ││
│  │ [Genereer blog] [Stuur factuur]        │ │  │    opvolgen              ││
│  │ [Plan social]   [Bekijk facturen]      │ │  │ ☐ Openstaande facturen   ││
│  │                                         │ │  │    controleren           ││
│  │ 🚀 AI Assistent komt binnenkort        │ │  └──────────────────────────┘│
│  └────────────────────────────────────────┘ │                               │
│                                              │  ┌──────────────────────────┐│
│  ┌────────────────────────────────────────┐ │  │ ⚡ Snelle Acties         ││
│  │ 🕐 Recente Activiteit                  │ │  │                          ││
│  │                                         │ │  │ [📝 Blog] [💰 Factuur]  ││
│  │ ✓ Factuur #2024-045 betaald           │ │  │ [📅 Post] [📧 Email]     ││
│  │   - €1.250 • Klant ABC • 5 min geleden │ │  │                          ││
│  │                                         │ │  └──────────────────────────┘│
│  │ 💳 Nieuw abonnement gestart           │ │                               │
│  │   - €250/mnd • Klant XYZ • 15 min      │ │                               │
│  │                                         │ │                               │
│  │ ✓ Factuur #2024-044 betaald           │ │                               │
│  │   - €850 • Klant DEF • 1 uur geleden   │ │                               │
│  └────────────────────────────────────────┘ │                               │
└─────────────────────────────────────────────┴───────────────────────────────┘

┌───────────────────────────┬───────────────────────────┬───────────────────────┐
│ 💰 Financiën (Moneybird)  │ 📱 Social Media (Late.dev)│ 📝 Content Hub        │
├───────────────────────────┼───────────────────────────┼───────────────────────┤
│ MRR: €5.420               │ Verbonden accounts:       │ Stats:                │
│ ARR: €65.040              │ 𝕏 @writgoai              │ [3] Concepten         │
│ Abonnementen: 12          │ 📘 WritgoAI              │ [0] Gepland           │
│                           │ 📷 writgoai              │ [45] Gepubliceerd     │
│ ⚠️ 1 te late factuur     │                           │                       │
│ €450 te laat              │ Gepland: 0 posts          │ Recent:               │
│                           │ Accounts: 3               │ • SEO Tips 2024       │
│ Recent:                   │                           │ • Content Marketing   │
│ • Klant A - €1.250 [paid] │ [Plan nieuwe post]        │ • AI Trends           │
│ • Klant B - €850 [paid]   │                           │                       │
│ • Klant C - €450 [late]   │                           │ [Nieuw artikel]       │
│                           │                           │ [Bekijk alles]        │
│ [Bekijk financiën]        │                           │                       │
└───────────────────────────┴───────────────────────────┴───────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  📧 Email Inbox                                                    [→]      │
├─────────────────────────────────────────────────────────────────────────────┤
│                               📧                                             │
│                     Email Inbox Coming Soon                                  │
│                                                                              │
│     Binnenkort kun je hier al je emails beheren en beantwoorden             │
│                    vanuit het dashboard.                                     │
│                                                                              │
│                     [Ga naar Email Beheer]                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Color Scheme

### Primary Colors
- **Background**: `bg-black` / `bg-zinc-900` - Dark theme
- **Cards**: `bg-zinc-900` with `border-zinc-800`
- **Hover**: `border-zinc-700`
- **Text Primary**: `text-white`
- **Text Secondary**: `text-zinc-400`
- **Text Tertiary**: `text-zinc-500` / `text-zinc-600`

### Accent Colors
- **Primary Accent**: `#FF6B35` (Orange) - Used for primary actions, highlights
- **Success**: `text-green-400` / `bg-green-500/20` - Positive states
- **Warning**: `text-yellow-400` / `bg-yellow-500/20` - Warnings
- **Error**: `text-red-400` / `bg-red-500/20` - Errors
- **Info**: `text-blue-400` / `bg-blue-500/20` - Information
- **Purple**: `text-purple-400` / `bg-purple-500/20` - Special features

### Status Colors
**Invoice States:**
- Paid: `text-green-400`
- Late: `text-red-400`
- Open: `text-yellow-400`
- Draft: `text-zinc-400`

**Priority Colors:**
- High: `text-red-400`
- Medium: `text-yellow-400`
- Low: `text-green-400`

## Responsive Breakpoints

### Mobile (< 640px)
- Single column layout
- Stacked KPI cards (1 column)
- Full-width widgets
- Hidden secondary information
- Burger menu for navigation

### Tablet (640px - 1024px)
- Two column KPI cards
- Main content single column
- Integration widgets 1-2 columns
- Visible key information

### Desktop (> 1024px)
- Four column KPI cards
- Main content 60/40 split (left/right)
- Integration widgets 3 columns
- Full information display
- Side-by-side layouts

## Interactive Elements

### Buttons
**Primary Actions:**
```css
bg-[#FF6B35] hover:bg-[#FF8555]
```

**Secondary Actions:**
```css
bg-zinc-800 hover:bg-zinc-700
```

**Ghost Buttons:**
```css
variant="ghost" text-zinc-400 hover:text-white
```

### Cards
**Hover Effect:**
```css
hover:border-zinc-700 transition-colors
```

**Interactive Card:**
```css
hover:bg-zinc-800 transition-colors cursor-pointer
```

### Loading States
- Spinner: `animate-spin text-[#FF6B35]`
- Skeleton: `bg-zinc-950 rounded-lg`

### Error States
- Alert icon: `text-red-400`
- Background: `bg-red-500/10 border-red-500/30`
- Retry button: Primary orange button

## Widget States

### Loading
```
┌─────────────────────┐
│ Widget Title        │
├─────────────────────┤
│                     │
│       ⟳ Loading     │
│                     │
└─────────────────────┘
```

### Error
```
┌─────────────────────┐
│ Widget Title        │
├─────────────────────┤
│        ⚠️           │
│   Error message     │
│   [Retry Button]    │
└─────────────────────┘
```

### Empty State
```
┌─────────────────────┐
│ Widget Title        │
├─────────────────────┤
│        📭           │
│  No data available  │
│   [Action Button]   │
└─────────────────────┘
```

### Success State
```
┌─────────────────────┐
│ Widget Title    [→] │
├─────────────────────┤
│ ✓ Data item 1       │
│ ✓ Data item 2       │
│ ✓ Data item 3       │
│ [View More]         │
└─────────────────────┘
```

## Animation & Transitions

### Hover Transitions
- Duration: `transition-colors`
- Cards: Scale not used, only color changes
- Buttons: Background color fade

### Loading Spinner
- Animation: `animate-spin`
- Color: `text-[#FF6B35]`
- Size: `w-6 h-6` or `w-8 h-8`

### Fade In
- Used for: Widget content loading
- Subtle appearance of data

### Auto-refresh
- Silent in background
- Only updates "Last updated" timestamp
- No visual interruption to user

## Iconography

### Emoji Usage
- Header: 🚀 (Rocket for Command Center)
- KPI Cards: 📧 💰 📝 📱
- Sections: ✨ ⚡ 🕐
- Platforms: 𝕏 📘 📷 💼 🎵

### Lucide Icons
- Navigation: `ExternalLink`
- Actions: `RefreshCw`, `Settings`, `Send`
- Status: `CheckCircle`, `AlertCircle`, `Clock`
- Content: `FileText`, `Mail`, `Calendar`
- Finance: `Euro`, `TrendingUp`
- UI: `Loader2`, `Square`, `CheckSquare`

## Best Practices

### Component Structure
1. Import statements
2. TypeScript interfaces
3. Component definition
4. State management
5. Effects and handlers
6. Conditional renders (loading, error, empty)
7. Main render (success state)

### Data Fetching
- Individual widget fetching
- Graceful error handling
- Loading states
- Retry mechanisms
- No blocking operations

### User Experience
- Instant visual feedback
- Clear error messages
- Retry options always available
- Progressive enhancement
- Accessibility considered
