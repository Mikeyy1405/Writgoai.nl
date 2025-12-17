# WritGo - Drastische Vereenvoudiging Analyse

## Huidige Situatie
- **243 pagina's** in de applicatie
- **566 API routes**
- **8 menu items** in simplified versie
- Complex met veel onnodige features

## Gebruiker Wensen
De gebruiker wil **ÉÉN DING**: Elke dag content maken voor al hun sites met een goed overzicht.

### Kern Functionaliteit (HOUDEN):
1. ✅ **WordPress sites toevoegen en beheren**
2. ✅ **Content genereren met AI**
3. ✅ **Content publiceren naar WordPress**
4. ✅ **Overzicht van alle content en sites**

### Wat WEG KAN (VERWIJDEREN):
- ❌ Social Media functionaliteit
- ❌ Video automation
- ❌ Email marketing
- ❌ Agency features (invoices, clients)
- ❌ Advanced analytics dashboards
- ❌ Content kalender (te complex)
- ❌ Blog advanced features
- ❌ Search Console integratie (te complex, kan later)
- ❌ Multiple platforms (focus alleen op WordPress)
- ❌ WooCommerce features
- ❌ Affiliate links management (te complex)
- ❌ Content automation (autopilot - te complex)
- ❌ Video generator
- ❌ Complexe project management features

## Nieuwe Vereenvoudigde Structuur

### ÉÉN Unified Dashboard (`/`)
Met 3 secties in één scherm:

#### A. Sites Sectie (links of top)
- Lijst van WordPress sites
- "+" knop om site toe te voegen
- Status indicator (actief/inactief)
- Minimaal formulier:
  - Site naam
  - WordPress URL
  - Gebruikersnaam
  - Application Password
- Automatische WordPress test

#### B. Content Generator (midden)
- **Simpel formulier:**
  - Selecteer site (dropdown)
  - Onderwerp/topic (input veld)
  - "Genereer Content" knop
- Real-time preview van gegenereerde content
- "Publiceer naar WordPress" knop

#### C. Content Overzicht (rechts of bottom)
- Tabel met alle recente content:
  - Titel
  - Site
  - Datum
  - Status (concept/gepubliceerd)
- Simpele filters
- Zoekfunctie

### Menu Items (MAXIMAAL 3):
1. 🏠 **Dashboard** - Het hoofdscherm met alles
2. ⚙️ **Instellingen** - Account en basis instellingen
3. (optioneel) 📊 **Content** - Uitgebreider contentoverzicht

## Te Verwijderen Routes/Pagina's

### Frontend Routes (verwijderen):
- `/dashboard/*` (oude complex dashboard)
- `/client-portal/*` (complexe portal)
- `/social-media/*`
- `/video-automation/*`
- `/video-generator/*`
- `/email-marketing/*`
- `/content-automation/*`
- `/agency/*`
- `/publish/*` (merge in dashboard)
- `/stats/*` (te complex, basis stats in dashboard)

### API Routes (verwijderen/consolideren):
- `/api/client/social/*`
- `/api/client/video/*`
- `/api/client/woocommerce/*`
- `/api/client/email/*`
- `/api/client/affiliate-links/*`
- `/api/admin/*` (admin functionaliteit niet nodig voor client)
- `/api/integrations/*` (behalve WordPress)
- Alle complexe content automation routes

### API Routes (HOUDEN en vereenvoudigen):
- `/api/simplified/projects` - Site management
- `/api/simplified/generate/quick` - Content generatie
- `/api/simplified/publish/wordpress` - Publiceren
- `/api/simplified/stats` - Basis stats voor overzicht

## Implementatie Plan

### Stap 1: Nieuw Unified Dashboard maken
- Maak `/app/(simplified)/dashboard/page.tsx`
- Implementeer 3 secties in één view
- Geen navigatie tussen pagina's nodig
- Alles op één scherm

### Stap 2: Vereenvoudigde Navigatie
Vervang huidige 8 items door:
```typescript
const menuItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/content', label: 'Content Overzicht', icon: FileText },
  { href: '/instellingen', label: 'Instellingen', icon: Settings },
];
```

### Stap 3: Routes Cleanup
- Verwijder alle onnodige pagina's
- Behoud alleen:
  - `/` (unified dashboard)
  - `/content` (optioneel uitgebreid overzicht)
  - `/instellingen` (account settings)

### Stap 4: API Cleanup
- Verwijder alle onnodige API routes
- Behoud alleen essentiële routes voor:
  - Project CRUD
  - Content generatie
  - WordPress publicatie
  - Basis stats

### Stap 5: Component Cleanup
- Verwijder complexe componenten
- Maak simpele, single-purpose componenten
- Focus op duidelijkheid en snelheid

## Verwachte Resultaten
- ✅ Van 243 pagina's naar **3 pagina's**
- ✅ Van 8 menu items naar **3 menu items**
- ✅ Van 566 API routes naar **~20 essentiële routes**
- ✅ Content maken in **< 30 seconden**
- ✅ Geen complexiteit, gewoon: **sites beheren → content maken → publiceren**
- ✅ Alles op één scherm, geen navigatie nodig

## Success Metrics
- Gebruiker kan binnen 30 seconden content genereren
- Alles wat ze nodig hebben is op één scherm zichtbaar
- Geen verwarring over waar iets staat
- Snelle laadtijden (< 1 seconde)
- Intuïtieve interface zonder uitleg
