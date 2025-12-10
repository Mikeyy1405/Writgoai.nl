# Admin Dashboard 2.0 - Visual Guide

## Dashboard Layout Preview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  WritGo Admin Dashboard                          [Sync] [Settings]          │
│  Welkom terug! Hier is je overzicht voor vandaag.                          │
│  Laatst bijgewerkt: 2 minuten geleden                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────┬────────────┬────────────┬────────────┬────────────┬────────────┐
│ 👥         │ 💰         │ 📈         │ 🧾         │ ⚠️          │ 🎫         │
│ Klanten    │ MRR        │ Omzet      │ Openstaand │ Te Laat    │ Credits    │
│ 45         │ €3,850     │ €4,250     │ €1,200     │ €350       │ 15,234     │
│ +3 ↑       │ +12% ↑     │ vs €3,800  │ openstaand │ te laat    │ gebruikt   │
│            │ ARR: €46k  │ +11.8% ↑   │ facturen   │ facturen   │            │
└────────────┴────────────┴────────────┴────────────┴────────────┴────────────┘

┌──────────────────────────────────────────────┬─────────────────────────────┐
│ 📊 Omzet & Uitgaven                         │ 📅 Vandaag                  │
│                                              │                             │
│     ╱ ▁▂▃▄▅▆▇█ ▇▆▅▄▃▂▁                      │ • 2 facturen te versturen  │
│   ╱▁                                          │                             │
│  ╱▁                                           │ • ⚠️ 1 factuur te laat     │
│ ▁▁                                            │                             │
│ jan feb mrt apr mei jun jul aug sep okt nov  │ • €450 omzet vandaag       │
│                                              │                             │
│ ━━━ Omzet (€4,250)  ┅┅┅ Uitgaven (€1,200)  │ • 23 content gegenereerd   │
└──────────────────────────────────────────────┴─────────────────────────────┘

┌──────────────────────────────────────────────┬─────────────────────────────┐
│ 🕐 Recente Activiteit                       │ 🏆 Top 5 Klanten            │
│                                              │                             │
│ ✅ Factuur betaald - €299                   │ 1. 👑 Bedrijf X    €2,500  │
│    Klant ABC - 2 min geleden                │    ████████████████         │
│                                              │    5 facturen               │
│ 💳 Nieuw abonnement - €79                   │                             │
│    Klant XYZ - 1 uur geleden                │ 2. Bedrijf Y       €1,800  │
│                                              │    ██████████               │
│ ✅ Factuur betaald - €150                   │                             │
│    Klant DEF - 3 uur geleden                │ 3. Bedrijf Z       €1,200  │
│                                              │    ████████                 │
│ 👤 Nieuwe klant                             │                             │
│    Jan de Vries - 5 uur geleden             │ 4. Bedrijf W       €950    │
│                                              │    ██████                   │
│ ✅ Factuur betaald - €399                   │                             │
│    Klant GHI - 1 dag geleden                │ 5. Bedrijf V       €750    │
│                                              │    █████                    │
└──────────────────────────────────────────────┴─────────────────────────────┘

┌──────────────────────────────────────────────┬─────────────────────────────┐
│ 📈 Klanten Groei                            │ 🧾 Factuur Status           │
│                                              │                             │
│  50 ●━━━━●━━━━●━━━━●━━━━●━━━━●            │        ████                 │
│     │                                        │      ██    ██               │
│  40 │                                        │    ██  65%  ██             │
│     │        ┅┅┅┅●┅┅┅┅●┅┅┅┅                 │   ██  Betaald ██           │
│  30 │      ┅┅                                │  ██            ██          │
│     │    ┅┅                                  │   ██  10%   ██ 25%        │
│  20 │  ┅┅                                    │    ██ Late ██ Open        │
│     ●┅┅                                      │      ████████              │
│  10 │                                        │                             │
│     │                                        │ ● Betaald (65%)            │
│   0 └─────────────────────────────────      │ ● Open (25%)               │
│     jan feb mrt apr mei jun jul aug sep     │ ● Te laat (10%)            │
│                                              │                             │
│     ━━━ Totaal  ┅┅┅ Nieuw                  │                             │
└──────────────────────────────────────────────┴─────────────────────────────┘
```

## Color Scheme

### Primary Colors
- **WritGo Orange**: `#FF6B35` - Primary brand color
- **Orange Hover**: `#FF8555` - Hover states

### Background Colors
- **Black**: `#000000` - Main background
- **Dark Gray 900**: `#18181b` - Card backgrounds
- **Dark Gray 800**: `#27272a` - Hover states
- **Dark Gray 700**: `#3f3f46` - Borders

### Text Colors
- **White**: `#ffffff` - Primary text
- **Gray 400**: `#9ca3af` - Secondary text
- **Gray 500**: `#6b7280` - Tertiary text
- **Gray 600**: `#52525b` - Muted text

### Status Colors
- **Success (Green)**: `#10b981` - Positive indicators, paid invoices
- **Info (Blue)**: `#3b82f6` - Information, total clients
- **Warning (Yellow)**: `#eab308` - Warnings, outstanding invoices
- **Danger (Red)**: `#ef4444` - Errors, overdue invoices
- **Purple**: `#a855f7` - Credits, special features

## Component Breakdown

### 1. KPI Cards (6x Cards)

```
┌──────────────┐
│ 💰          │ ← Icon with colored background
│ MRR         │ ← Label (gray)
│ €3,850      │ ← Value (white, bold, large)
│ ARR: €46k   │ ← Subtitle (gray)
│ +12% ↑      │ ← Trend (green if up, red if down)
└──────────────┘
```

**Features**:
- Colored icon backgrounds (20% opacity)
- Large, bold value display
- Trend indicators with arrows
- Responsive grid (1/2/3/6 columns)

### 2. Revenue Chart (Area Chart)

```
     Revenue Line (Orange solid)
     ╱ ▁▂▃▄▅▆▇█ ▇▆▅▄▃▂▁
   ╱▁
  ╱▁                    Expenses Line (Red dashed)
 ▁▁

X-axis: Months (jan, feb, mrt, ...)
Y-axis: Amounts (€0k, €1k, €2k, ...)
```

**Features**:
- Gradient fill under lines
- Interactive tooltips
- Legend with line styles
- Grid background

### 3. Client Growth Chart (Line Chart)

```
Total Line (Blue solid)
  ●━━━━●━━━━●━━━━●
  
New Line (Green dashed)
    ┅┅┅┅●┅┅┅┅●┅┅┅┅

X-axis: Months
Y-axis: Number of clients
```

**Features**:
- Dual lines for comparison
- Data points visible
- Different line styles
- Legend

### 4. Invoice Status Chart (Donut)

```
        ████
      ██    ██
    ██  65%  ██      Green = Betaald
   ██  Betaald ██
  ██            ██   Blue = Open
   ██  10%   ██ 25% Red = Te laat
    ██ Late ██ Open  Gray = Concept
      ████████
```

**Features**:
- Inner radius for donut effect
- Percentage labels
- Color-coded segments
- Interactive tooltips
- Legend with percentages

### 5. Activity Feed

```
┌────────────────────────────────┐
│ ✅ Factuur betaald - €299     │ ← Icon, description, amount
│    Klant ABC                   │ ← Client name
│    2 minuten geleden           │ ← Timestamp
├────────────────────────────────┤
│ 💳 Nieuw abonnement - €79     │
│    Klant XYZ                   │
│    1 uur geleden               │
└────────────────────────────────┘
```

**Features**:
- Scrollable list
- Icons per activity type
- Relative timestamps
- Client names
- Amounts highlighted

### 6. Top Clients

```
┌────────────────────────────────┐
│ 1. 👑 Bedrijf X    €2,500     │ ← Rank, crown for #1
│    ████████████████             │ ← Progress bar
│    5 facturen                   │ ← Invoice count
├────────────────────────────────┤
│ 2. Bedrijf Y       €1,800     │
│    ██████████                   │
│    3 facturen                   │
└────────────────────────────────┘
```

**Features**:
- Ranked list 1-5
- Golden crown for #1
- Gradient progress bars
- Total revenue and invoice count
- Email on hover

### 7. Today Widget

```
┌────────────────────────────────┐
│ 📄 Facturen te versturen      │ ← Icon + label
│    2                           │ ← Count (large)
├────────────────────────────────┤
│ ⚠️ Facturen te laat           │
│    1                           │ ← Red highlight
├────────────────────────────────┤
│ 💰 Omzet vandaag              │
│    €450                        │
├────────────────────────────────┤
│ ✨ Content gegenereerd        │
│    23                          │
└────────────────────────────────┘
```

**Features**:
- Quick action items
- Color-coded icons
- Large count display
- Red highlight for alerts

## Responsive Behavior

### Desktop (> 1024px)
```
┌─ KPIs: 6 columns ──────────────────────────┐
├─ Row 1: Chart (2/3) + Widget (1/3) ────────┤
├─ Row 2: Activity (1/2) + Clients (1/2) ────┤
└─ Row 3: Growth (1/2) + Status (1/2) ───────┘
```

### Tablet (640px - 1024px)
```
┌─ KPIs: 3 columns ──────────────────────────┐
├─ Row 1: Chart (2/3) + Widget (1/3) ────────┤
├─ Row 2: Activity (1/2) + Clients (1/2) ────┤
└─ Row 3: Growth (1/2) + Status (1/2) ───────┘
```

### Mobile (< 640px)
```
┌─ KPIs: 2 columns ──────┐
├─ Chart: Full width ────┤
├─ Widget: Full width ───┤
├─ Activity: Full width ─┤
├─ Clients: Full width ──┤
├─ Growth: Full width ───┤
└─ Status: Full width ───┘
```

## Interaction States

### Loading State
```
┌─────────────────────────────┐
│                             │
│    ⟳ Dashboard laden...    │
│                             │
└─────────────────────────────┘
```

### Error State
```
┌─────────────────────────────┐
│        ⚠️                   │
│   Fout bij laden            │
│   [Error message]           │
│   [Opnieuw proberen]        │
└─────────────────────────────┘
```

### Syncing State
```
Header: [⟳ Sync] ← Spinning icon
        └─ Disabled during sync
```

## Icon Legend

- 👥 **Users** - Klanten
- 💰 **Euro** - MRR/Financiën
- 📈 **Trending Up** - Omzet/Groei
- 🧾 **File Text** - Facturen/Documenten
- ⚠️ **Alert Triangle** - Waarschuwingen
- 🎫 **Coins** - Credits
- ✅ **Check Circle** - Betaald/Succesvol
- 💳 **Credit Card** - Abonnementen
- 👤 **User Plus** - Nieuwe klant
- 🕐 **Clock** - Tijd/Activiteit
- 🏆 **Trophy** - Top performers
- 👑 **Crown** - #1 positie
- 📅 **Calendar** - Vandaag/Planning
- 📄 **Document** - Concepten
- ✨ **Sparkles** - Content/Creatie

## Data Flow Visualization

```
User Request
     │
     ▼
┌─────────────┐
│ Admin Page  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Authentication      │
│ Check (NextAuth)    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ API Route           │
│ /dashboard-stats    │
└──────┬──────────────┘
       │
       ├────────────────┐
       │                │
       ▼                ▼
┌──────────────┐  ┌──────────────┐
│ Moneybird    │  │ Supabase     │
│ API          │  │ Database     │
└──────┬───────┘  └──────┬───────┘
       │                 │
       └────────┬────────┘
                │
                ▼
        ┌───────────────┐
        │ Process Data  │
        │ Calculate KPIs│
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │ JSON Response │
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │ Render        │
        │ Components    │
        └───────────────┘
```

## Performance Metrics

### Target Load Times
- **Initial Page Load**: < 2s
- **API Response**: < 5s (typical), < 30s (worst case)
- **Chart Render**: < 500ms
- **Sync Refresh**: < 10s

### Data Volume
- **Sales Invoices**: ~100-500 records
- **Subscriptions**: ~20-100 records
- **Contacts**: ~50-200 records
- **Database Clients**: ~50-200 records

### Memory Usage
- **Initial Load**: ~50MB
- **With All Data**: ~100MB
- **Charts Rendered**: +20MB per chart

## Browser Compatibility

### Fully Supported
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Limited Support
- ⚠️ IE 11 (no Recharts support)
- ⚠️ Safari < 14 (limited CSS support)

## Accessibility

### Keyboard Navigation
- Tab order follows visual hierarchy
- All interactive elements focusable
- Escape key closes modals

### Screen Readers
- Semantic HTML structure
- ARIA labels on charts
- Alt text on icons
- Status announcements

### Color Contrast
- All text meets WCAG AA standards
- Chart colors distinguishable
- Status colors have text labels

---

**Visual Guide Version**: 1.0  
**Last Updated**: 2025-12-09  
**For**: Admin Dashboard 2.0
