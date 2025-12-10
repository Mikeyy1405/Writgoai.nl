# WritgoAI Command Center - Implementation Documentation

## Overview
Het nieuwe WritgoAI Command Center is een volledig werkend admin dashboard dat alle bestaande integraties samenbrengt in één overzichtelijk command center.

## Locatie
`nextjs_space/app/admin/page.tsx`

## Features

### 1. Header Section
- ✅ Titel: "WritgoAI Command Center" met emoji
- ✅ Gebruikersnaam rechtsboven (uit session)
- ✅ Settings knop (navigeert naar `/admin/settings`)
- ✅ Laatste sync tijd (met Nederlandse locale)
- ✅ Sync knop voor handmatige refresh

### 2. KPI Cards Row
4 overzichtelijke cards met de belangrijkste metrics:

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 📧 Inbox     │ │ 💰 Financiën │ │ 📝 Content   │ │ 📱 Social    │
│ X nieuw      │ │ €X MRR       │ │ X concepten  │ │ X gepland    │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

**Component**: `CommandCenterKPIs`
- Inbox: Aantal ongelezen emails (placeholder)
- Financiën: MRR uit Moneybird
- Content: Aantal concept artikelen
- Social: Aantal geplande posts (placeholder)

### 3. Main Content Area (2 kolommen: 60/40)

#### Left Column (60%)
**AI Assistant Widget** (`AIAssistantWidget`)
- Chat interface placeholder voor AIML API integratie
- Snelle suggesties voor veelvoorkomende taken
- "Coming soon" bericht voor toekomstige AIML integratie

**Activity Feed** (`ActivityFeed`)
- Real-time updates van alle systemen
- Toont Moneybird betalingen
- Toont nieuwe abonnementen
- Kleurgecodeerde iconen per activiteit type
- Auto-refresh elke 30 seconden

#### Right Column (40%)
**Todo Widget** (`TodoWidget`)
- Dynamisch gegenereerde taken uit dashboard data:
  - Concept facturen versturen
  - Te late facturen opvolgen
  - Openstaande facturen controleren
- Checkbox om taken af te vinken
- Priority indicators (high/medium/low)
- Voltooide taken worden apart getoond

**Quick Actions** (`QuickActionsWidget`)
- Nieuwe blog schrijven → `/admin/blog/editor`
- Factuur versturen → `/admin/financien/facturen`
- Social post plannen → `/admin/content`
- Email beantwoorden → `/admin/emails`

### 4. Integration Widgets (3 kolommen)

#### Moneybird Widget (`MoneybirdWidget`)
API: `/api/financien/dashboard`

Features:
- MRR en ARR display
- Aantal actieve abonnementen
- Waarschuwingen voor te late facturen
- Openstaande facturen overzicht
- Laatste 3 facturen
- Link naar volledige financiën pagina
- Loading states
- Error handling met retry button

#### Social Media Widget (`SocialMediaWidget`)
API: `/api/client/latedev/accounts`

Features:
- Verbonden accounts tonen (met platform emoji's)
- Aantal geplande posts
- Platform detectie (X, Facebook, Instagram, LinkedIn, TikTok)
- Link naar content hub
- Graceful fallback als geen accounts verbonden
- Quick post button

#### Content Widget (`ContentWidget`)
API: `/api/admin/blog/stats`

Features:
- Overzicht van concepten, geplande en gepubliceerde posts
- Laatste 3 artikelen met status badges
- Nieuw artikel schrijven button
- Link naar volledige blog overzicht
- Loading en error states

### 5. Email Inbox Preview (`EmailInboxWidget`)
- "Coming soon" placeholder met mooie UI
- Knop om naar volledige inbox te gaan (`/admin/emails`)
- Voorbereid voor toekomstige email sync integratie

## Technische Implementatie

### API Endpoints
1. ✅ `/api/admin/dashboard-stats` - Algemene dashboard statistieken
2. ✅ `/api/financien/dashboard` - Moneybird financiële data
3. ✅ `/api/client/latedev/accounts` - Social media accounts
4. ✅ `/api/admin/blog/stats` - Content statistieken

### State Management
- React useState voor lokale state
- useEffect voor data fetching en polling
- Ref voor fetch tracking (prevent duplicate calls)
- Auto-refresh elke 30 seconden voor real-time updates

### Error Handling
- Graceful degradation per widget
- Retry buttons op foutmeldingen
- Loading states met spinners
- Fallback UI voor niet-beschikbare data

### Styling
- ✅ Tailwind CSS
- ✅ Dark theme (bg-black/bg-zinc-900)
- ✅ Accent kleur: #FF6B35 (oranje)
- ✅ Responsive design (mobile-first)
- ✅ Lucide icons voor alle iconen
- ✅ Hover states en transitions

### Component Hergebruik
Alle nieuwe componenten zijn in `components/admin/dashboard/`:
- `command-center-kpis.tsx`
- `ai-assistant-widget.tsx`
- `todo-widget.tsx`
- `quick-actions-widget.tsx`
- `moneybird-widget.tsx`
- `social-media-widget.tsx`
- `content-widget.tsx`
- `email-inbox-widget.tsx`

Bestaande componenten hergebruikt:
- `activity-feed.tsx` (bestaand)
- UI components uit `components/ui/*` (Shadcn)

## Data Flow

```
┌─────────────────────┐
│  AdminDashboard     │
│  (page.tsx)         │
└──────────┬──────────┘
           │
           ├──> CommandCenterKPIs (KPI data)
           │
           ├──> AIAssistantWidget (standalone)
           │
           ├──> ActivityFeed (recentActivity)
           │
           ├──> TodoWidget (generated from data)
           │
           ├──> QuickActionsWidget (standalone)
           │
           └──> Integration Widgets:
                ├──> MoneybirdWidget (fetch own data)
                ├──> SocialMediaWidget (fetch own data)
                └──> ContentWidget (fetch own data)
```

## Real-time Updates
- Hoofddata: auto-refresh elke 30 seconden
- Widgets: individuele refresh strategieën
- Activity feed: geüpdatet met hoofddata
- Manual refresh: Sync knop in header

## Future Enhancements
1. **AI Assistant**: AIML API integratie voor chat functionaliteit
2. **Email Inbox**: Volledige email sync en display
3. **Social Media Stats**: Post engagement metrics
4. **Content Analytics**: Views en performance data
5. **Notifications**: Real-time notificaties voor belangrijke events

## Testing Checklist
- [x] Component creatie
- [x] API integraties geconfigureerd
- [x] Error states geïmplementeerd
- [x] Loading states geïmplementeerd
- [x] Auto-refresh functionaliteit
- [ ] Build verificatie
- [ ] Responsive design testen
- [ ] API error scenarios testen
- [ ] Code review
- [ ] Security scan

## Performance Optimizations
- Parallelle widget data fetching
- Graceful degradation bij API fouten
- Geen blocking calls - widgets laden onafhankelijk
- Efficient re-render door component splitting
- Auto-refresh alleen als data geladen is

## Security
- Session-based authenticatie
- Admin role check
- API endpoints beschermd met auth middleware
- Geen sensitive data in frontend code
- Secure API calls met proper error handling
