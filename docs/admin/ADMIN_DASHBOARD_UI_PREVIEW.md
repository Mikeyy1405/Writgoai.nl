# Admin Dashboard UI Preview 🎨

## Dashboard Layout Overzicht

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Admin Dashboard                                      [Naar Portal →]       │
│ WritGo Management Overzicht                                                │
└────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ 👥 Klanten      │ 💰 Omzet        │ 📝 Content      │ 🎫 Credits      │
│                 │                 │                 │                 │
│     45          │   €2,450        │    127          │   15,000        │
│                 │                 │                 │                 │
│ +5 deze week    │ +€450 maand     │ +23 maand       │ gebruikt        │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘

┌──────────────────────────────────┬──────────────────────────────────────┐
│ ⚡ Snelle Acties                 │ 📝 Mijn Notities      [Opslaan]     │
│                                  │ Laatst opgeslagen: 15:30:45         │
│ [👤 + Nieuwe Klant         →]   │ ┌────────────────────────────────┐  │
│                                  │ │ - Factuur sturen naar klant X │  │
│ [📦 + Nieuwe Opdracht      →]   │ │ - Content Hub bug fixen       │  │
│                                  │ │ - Nieuwe feature bespreken    │  │
│ [📧 Berichten              (3)]  │ │                               │  │
│                                  │ │                               │  │
└──────────────────────────────────┴──────────────────────────────────────┘
                                     │ 127 / 5000 karakters          │  │
                                     └────────────────────────────────┘  │
                                                                          │
┌─────────────────────────────────────────────────────────────────────────┐
│ 🕐 Recente Activiteit                                                   │
│                                                                         │
│  ●  • Nieuwe klant: Jan de Vries              2 min geleden            │
│      nieuwe_klant                                                       │
│                                                                         │
│  ●  • Opdracht voltooid: Blog schrijven       1 uur geleden            │
│      order_completed                                                    │
│                                                                         │
│  ●  • Betaling ontvangen: €79                 3 uur geleden            │
│      payment_received                                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Color Scheme 🎨

### Background Colors
```
Primary Background:   bg-gray-950  (#0a0a0a)
Card Background:      bg-gray-900  (#111111)
Hover State:          bg-gray-800  (#1a1a1a)
Input Background:     bg-gray-950  (#0a0a0a)
```

### Text Colors
```
Primary Text:         text-white     (#ffffff)
Secondary Text:       text-gray-400  (#9ca3af)
Muted Text:          text-gray-500  (#6b7280)
```

### Accent Colors
```
Blue (Primary):       bg-blue-600    (#2563eb) → Links, buttons
Green (Success):      text-green-400 (#4ade80) → Positive metrics
Yellow (Warning):     text-yellow-400 (#facc15) → Revenue
Purple (Content):     text-purple-500 (#a855f7) → Content stats
Orange (Alert):       bg-orange-500  (#f97316) → Badge counts
```

### Icon Colors
```
Users:        text-blue-500    (#3b82f6)
Revenue:      text-yellow-500  (#eab308)
Content:      text-purple-500  (#a855f7)
Credits:      text-green-500   (#22c55e)
Activity:     text-blue-400    (#60a5fa)
```

## Responsive Breakpoints 📱

### Mobile (< 640px)
```
┌────────────────────────┐
│ [☰] Admin Dashboard    │
├────────────────────────┤
│ 👥 Klanten             │
│ 45                     │
│ +5 deze week           │
├────────────────────────┤
│ 💰 Omzet               │
│ €2,450                 │
│ +€450 maand            │
├────────────────────────┤
│ ... (stacked cards)    │
└────────────────────────┘
```

### Tablet (640px - 1024px)
```
┌──────────────┬──────────────┐
│ 👥 Klanten   │ 💰 Omzet     │
│ 45           │ €2,450       │
│ +5 week      │ +€450 maand  │
├──────────────┼──────────────┤
│ 📝 Content   │ 🎫 Credits   │
│ 127          │ 15,000       │
│ +23 maand    │ gebruikt     │
└──────────────┴──────────────┘
```

### Desktop (> 1024px)
```
4-column grid for stats
2-column grid for actions & notes
Full width for activity
```

## Component Details 🔍

### Stats Card

```
┌──────────────────────────────────┐
│ Icon (40x40)  Text               │
│ 👥            👥 Klanten          │
│                                  │
│               45                 │  ← Large number (text-3xl)
│                                  │
│               +5 deze week       │  ← Trend (text-xs, green)
└──────────────────────────────────┘
```

**Specifications**:
- Card: `bg-gray-900 border-gray-800`
- Padding: `p-6` (24px)
- Main number: `text-3xl font-bold` (30px)
- Trend text: `text-xs text-green-400` (12px)
- Icon: `w-10 h-10` (40x40px)
- Gap between elements: `gap-2`

### Quick Actions Card

```
┌──────────────────────────────────┐
│ ⚡ Snelle Acties                 │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 👤 + Nieuwe Klant        →  │ │  ← Button
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ 📦 + Nieuwe Opdracht     →  │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ 📧 Berichten             (3)│ │  ← Badge
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

**Button Specifications**:
- Width: `w-full` (100%)
- Height: Auto with `py-2.5` (10px padding)
- Background: `bg-blue-600 hover:bg-blue-700`
- Text: `text-white font-medium`
- Icon size: `w-4 h-4` (16x16px)
- Border radius: `rounded-lg`
- Spacing: `gap-2` between buttons

### Personal Notes Card

```
┌────────────────────────────────────────┐
│ 📝 Mijn Notities         [💾 Opslaan] │  ← Header with button
│ ✓ Laatst opgeslagen: 15:30:45         │  ← Timestamp
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │                                    │ │
│ │  [Textarea Content]                │ │  ← min-h-[150px]
│ │                                    │ │
│ └────────────────────────────────────┘ │
│ 127 / 5000 karakters                   │  ← Character count
└────────────────────────────────────────┘
```

**Textarea Specifications**:
- Min height: `min-h-[150px]` (150px)
- Background: `bg-gray-950` (darker than card)
- Border: `border-gray-700`
- Text: `text-white`
- Resize: `resize-none` (disabled)
- Max length: 5000 characters
- Font: Default system font
- Padding: `p-3` (12px)

**Save Button**:
- Size: `size="sm"` (small)
- Background: `bg-green-600 hover:bg-green-700`
- Icon: Save icon `w-4 h-4` (16x16px)
- Loading state: Spinner icon while saving

### Recent Activity Card

```
┌────────────────────────────────────────────────────┐
│ 🕐 Recente Activiteit                              │
│                                                    │
│ ┌────────────────────────────────────────────────┐│
│ │ ● [Icon]  • Nieuwe klant: Jan...  2 min geleden││
│ │           nieuwe_klant                          ││
│ └────────────────────────────────────────────────┘│
│ ┌────────────────────────────────────────────────┐│
│ │ ● [Icon]  • Opdracht voltooid...  1 uur geleden││
│ │           order_completed                       ││
│ └────────────────────────────────────────────────┘│
│ ... (max 5 items)                                 │
└────────────────────────────────────────────────────┘
```

**Activity Item Specifications**:
- Background: `bg-gray-950 hover:bg-gray-800`
- Padding: `p-3` (12px)
- Border radius: `rounded-lg`
- Icon: Circle avatar `w-8 h-8` (32x32px)
- Icon background: `bg-blue-500/20`
- Icon color: `text-blue-400`
- Text: `text-sm` (14px)
- Timestamp: `text-xs text-gray-500` (12px)
- Gap: `gap-3` between icon and text

## Typography Scale 📝

```
Hero/Page Title:    text-3xl md:text-4xl  (30px/36px)
Card Title:         text-xl               (20px)
Main Numbers:       text-3xl              (30px)
Button Text:        text-sm               (14px)
Body Text:          text-sm               (14px)
Small Text:         text-xs               (12px)
Trend/Meta:         text-xs               (12px)
```

## Spacing System 🎯

```
Container:          p-4 md:p-6 lg:p-8     (16/24/32px)
Card Padding:       p-6                   (24px)
Card Gap:           gap-4 md:gap-6        (16/24px)
Element Gap:        gap-2 or gap-3        (8/12px)
Section Gap:        space-y-6             (24px)
```

## Animation & Interactions 🎭

### Hover Effects
```
Cards:              hover:bg-gray-800 transition-colors
Buttons:            hover:bg-blue-700 transition-all
Links:              hover:text-blue-300
Activity Items:     hover:bg-gray-800 transition-colors
```

### Loading States
```
Dashboard:          Loader2 spinning icon
Save Button:        Spinner replaces save icon
Disabled:           opacity-50 cursor-not-allowed
```

### Toast Notifications
```
Success:            Green background, checkmark icon
Error:              Red background, X icon
Position:           Bottom right
Duration:           3-5 seconds
```

## Accessibility ♿

### Color Contrast
- Primary text on dark bg: 15.8:1 (AAA)
- Secondary text on dark bg: 7.3:1 (AA)
- Button text on blue: 8.1:1 (AAA)

### Interactive Elements
- All buttons have hover states
- Focus states with outline
- Keyboard navigation supported
- Screen reader friendly labels

### ARIA Labels
```html
<button aria-label="Opslaan notities">
<textarea aria-label="Persoonlijke notities">
<div role="status" aria-live="polite"> // For save feedback
```

## Icon Library 📦

Using **Lucide React** icons:
```typescript
import {
  Users,       // 👥 Klanten
  DollarSign,  // 💰 Omzet
  FileText,    // 📝 Content
  TrendingUp,  // 🎫 Credits
  Activity,    // 🕐 Activity
  Save,        // 💾 Save
  UserPlus,    // + User
  Package,     // 📦 Package
  Mail,        // 📧 Mail
  StickyNote,  // 📝 Notes
  CheckCircle, // ✓ Check
  Loader2,     // ⟳ Loading
  ArrowRight,  // → Arrow
} from 'lucide-react';
```

## Edge Cases 🔍

### Empty States
```
No Activity:
┌────────────────────────────────────┐
│ 🕐 Recente Activiteit              │
│                                    │
│       📭                           │
│       Geen recente activiteit      │
│                                    │
└────────────────────────────────────┘
```

### Loading State
```
┌────────────────────────────────────┐
│                                    │
│           ⟳ Loading...             │
│                                    │
└────────────────────────────────────┘
```

### Error State
```
┌────────────────────────────────────┐
│           ⚠️                       │
│       Fout bij laden               │
│       [Opnieuw proberen]           │
└────────────────────────────────────┘
```

## Performance Optimizations ⚡

1. **Lazy Loading**: Stats fetched after auth check
2. **Debounced Auto-save**: 5 second delay
3. **Memoized Callbacks**: useCallback for save function
4. **Optimistic Updates**: UI updates before API response
5. **Conditional Rendering**: Hide empty sections

## Browser Support 🌐

- ✅ Chrome/Edge (last 2 versions)
- ✅ Firefox (last 2 versions)
- ✅ Safari (last 2 versions)
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android)

## Print Styles 🖨️

Dashboard is optimized for screen viewing only.
Print functionality can be added in future updates.

---

**Last Updated**: December 2025
**Design System**: Tailwind CSS v3.3.3
**Component Library**: shadcn/ui
**Icons**: Lucide React
