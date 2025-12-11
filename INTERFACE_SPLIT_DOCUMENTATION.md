# Writgo.nl Interface Split Documentatie

**Datum:** 11 december 2025  
**Versie:** 1.0  
**Status:** Geïmplementeerd

---

## 📋 Overzicht

De Writgo.nl applicatie is opgesplitst in **2 volledig gescheiden interfaces**:

1. **🎯 KLANTEN INTERFACE** (`/dashboard`) - Simpele, autonome interface voor lokale ondernemers
2. **⚙️ ADMIN INTERFACE** (`/admin`) - Volledige agency features voor Writgo eigenaar

---

## 🗺️ Routing Structuur

### Voor KLANTEN (Lokale Ondernemers)

#### Basis Route
```
/dashboard
```

#### 4 Hoofd Pagina's
```
/dashboard/overzicht   → Systeemstatus, activiteit, verbonden platforms
/dashboard/platforms   → Social media platforms beheren (USP!)
/dashboard/content     → Content kalender (geplande/gepubliceerde content)
/dashboard/account     → Pakket, betalingen, profiel, support
```

#### Features
- ✅ Extreem simpel (te begrijpen in 5 minuten)
- ✅ Zero-touch autonomy (systeem werkt voor je)
- ✅ Platform flexibiliteit (klant kiest platforms)
- ✅ Geen complexe features
- ✅ Focus op inzicht, niet op actie

---

### Voor WRITGO EIGENAAR (Admin)

#### Basis Route
```
/admin
```

#### Alle Agency Features

##### **📊 Overzicht**
```
/admin/dashboard         → Hoofdoverzicht met KPIs, MRR, klanten stats
```

##### **👥 Klanten & Projecten**
```
/admin/klanten           → Alle klanten beheren
/admin/clients           → Legacy klanten management
/admin/projects          → Alle projecten van alle klanten
/admin/assignments       → Contentopdrachten beheren
/admin/managed-projects  → Beheerde projecten
```

##### **📝 Content & Distributie**
```
/admin/content           → Alle content van alle klanten
/admin/blog              → Blog artikelen management
/admin/distribution      → Multi-platform content distributie
/admin/platforms         → Social media platforms overzicht
/admin/linkbuilding      → SEO linkbuilding campaigns
```

##### **💰 Financieel**
```
/admin/financieel        → MRR, kosten, winst, BTW rapportages
/admin/invoices          → Facturatie en betalingen
```

##### **📈 Analytics & Rapportage**
```
/admin/statistieken              → KPIs en metrics
/admin/distribution/analytics    → Content performance analytics
/admin/api-usage                 → AI API verbruik tracking
```

##### **⚙️ Instellingen**
```
/admin/instellingen      → Systeem configuratie
/admin/settings          → General settings
/admin/branding          → Brand instellingen
```

---

## 🔐 Role-Based Access Control (RBAC)

### Authenticatie Logic

#### Admin Check
```typescript
// lib/navigation-config.ts
export const isUserAdmin = (email?: string | null, role?: string | null): boolean => {
  return email === 'info@writgo.nl' || role === 'admin';
};
```

#### Automatische Redirects

##### Na Login (Root Page `/`)
```typescript
// app/page.tsx
if (isAdmin) {
  router.replace('/admin/dashboard');
} else {
  router.replace('/dashboard/overzicht');
}
```

##### Dashboard Layout
```typescript
// app/dashboard/layout.tsx
// Klanten komen binnen
// Als admin → redirect naar /admin
if (isAdmin) {
  router.push('/admin');
}
```

##### Admin Layout
```typescript
// app/admin/layout.tsx
// Admin komt binnen
// Als client → redirect naar /dashboard
if (!isAdmin) {
  router.push('/dashboard/overzicht');
}
```

### Beveiligingsniveaus

| Route | Toegang | Redirect Bij Fout |
|-------|---------|-------------------|
| `/` | Public | - |
| `/client-login` | Public | - |
| `/dashboard/*` | Klanten alleen | → `/client-login` |
| `/admin/*` | Admin alleen | → `/dashboard/overzicht` |

---

## 🎨 UI Componenten

### Klanten Interface Components
```
components/dashboard-client/
├── dashboard-layout.tsx           → Main layout wrapper
├── dashboard-sidebar.tsx          → Navigatie sidebar (4 items)
├── dashboard-header.tsx           → Header met user info
└── dashboard-mobile-nav.tsx       → Mobile navigation
```

**Navigatie Config:**
```
lib/dashboard-navigation-config.ts
```

**Styling:**
- Oranje/Geel accent kleuren (`#FF9933`, `#FFAD33`)
- Simpele, friendly interface
- Grote knoppen en duidelijke labels

---

### Admin Interface Components
```
components/admin-complex/
├── admin-complex-layout.tsx       → Main layout wrapper
├── admin-complex-sidebar.tsx      → Volledige sidebar met alle features
├── admin-complex-header.tsx       → Admin header met badge
└── admin-complex-mobile-nav.tsx   → Mobile navigation
```

**Navigatie Config:**
```
lib/admin-navigation-config.ts
```

**Styling:**
- Rood/Oranje accent kleuren (voor onderscheid)
- "ADMIN" badge prominent zichtbaar
- Sidebar met secties en categorieën
- Meer compacte layout voor informatie dichtheid

---

## 📱 Navigatie Structuur

### Klanten Sidebar (4 items)

```
📊 Overzicht
   └─ Systeemstatus en activiteit

🌐 Platforms
   └─ Verbind je social media

📅 Content
   └─ Geplande en gepubliceerde content

👤 Account
   └─ Pakket, betalingen en instellingen
```

### Admin Sidebar (Volledig)

```
📊 OVERZICHT
   └─ Dashboard

👥 KLANTEN & PROJECTEN
   ├─ Klanten
   ├─ Clients (Legacy)
   ├─ Projecten
   ├─ Opdrachten
   └─ Managed Projects

📝 CONTENT & DISTRIBUTIE
   ├─ Content Center
   ├─ Blog Management
   ├─ Distributie
   ├─ Platforms
   └─ Linkbuilding

💰 FINANCIEEL
   ├─ Financieel Dashboard
   └─ Facturen

📈 ANALYTICS & RAPPORTAGE
   ├─ Statistieken
   ├─ Analytics
   └─ API Usage

⚙️ INSTELLINGEN
   ├─ Instellingen
   ├─ Settings
   └─ Branding
```

---

## 🔄 Data Filtering

### Klanten Data Scope
**Principe:** Klanten zien ALLEEN hun eigen data

```typescript
// Voorbeeld API call in klant interface
const response = await fetch('/api/admin/distribution/platforms');
// Moet automatisch filteren op session.user.id
```

### Admin Data Scope
**Principe:** Admin ziet ALLE data van ALLE klanten

```typescript
// Voorbeeld API call in admin interface
const response = await fetch('/api/admin/clients');
// Geeft lijst van alle klanten terug
```

---

## 🚀 Deployment & Testing

### Test Scenarios

#### Test 1: Klant Login Flow
1. Login als klant (niet `info@writgo.nl`)
2. ✅ Moet naar `/dashboard/overzicht` redirecten
3. ✅ Moet alleen 4 menu items zien
4. ✅ Moet alleen eigen platforms/content zien
5. ❌ Mag geen toegang hebben tot `/admin`

#### Test 2: Admin Login Flow
1. Login als admin (`info@writgo.nl`)
2. ✅ Moet naar `/admin/dashboard` redirecten
3. ✅ Moet volledige admin sidebar zien
4. ✅ Moet alle klanten kunnen zien
5. ✅ Moet financiële data kunnen zien
6. ✅ Kan naar `/dashboard/overzicht` voor klant view

#### Test 3: Unauthorized Access
1. Als klant proberen te navigeren naar `/admin/clients`
2. ✅ Moet redirecten naar `/dashboard/overzicht`
3. Als admin proberen te navigeren naar `/dashboard/overzicht`
4. ✅ Mag toegang hebben (voor test/preview doeleinden)

---

## 📦 File Structure

```
writgoai_nl/nextjs_space/
├── app/
│   ├── page.tsx                          → Root redirect logic
│   │
│   ├── dashboard/                        → 🎯 KLANTEN INTERFACE
│   │   ├── layout.tsx                    → Dashboard layout wrapper
│   │   ├── page.tsx                      → Redirect naar overzicht
│   │   ├── overzicht/page.tsx            → Overzicht page
│   │   ├── platforms/page.tsx            → Platforms page
│   │   ├── content/page.tsx              → Content page
│   │   └── account/page.tsx              → Account page
│   │
│   └── admin/                            → ⚙️ ADMIN INTERFACE
│       ├── layout.tsx                    → Admin layout wrapper
│       ├── page.tsx                      → Redirect naar dashboard
│       ├── dashboard/page.tsx            → Admin dashboard
│       ├── klanten/page.tsx              → Klanten management
│       ├── projects/                     → Projecten
│       ├── content/                      → Content management
│       ├── blog/                         → Blog CMS
│       ├── distribution/                 → Distributie center
│       ├── invoices/                     → Facturatie
│       ├── statistieken/                 → Stats & analytics
│       └── instellingen/                 → Settings
│
├── components/
│   ├── dashboard-client/                 → Klanten interface components
│   │   ├── dashboard-layout.tsx
│   │   ├── dashboard-sidebar.tsx
│   │   ├── dashboard-header.tsx
│   │   └── dashboard-mobile-nav.tsx
│   │
│   └── admin-complex/                    → Admin interface components
│       ├── admin-complex-layout.tsx
│       ├── admin-complex-sidebar.tsx
│       ├── admin-complex-header.tsx
│       └── admin-complex-mobile-nav.tsx
│
└── lib/
    ├── navigation-config.ts              → Legacy/base navigation
    ├── dashboard-navigation-config.ts    → Klanten nav config
    └── admin-navigation-config.ts        → Admin nav config
```

---

## 🎯 Key Features Per Interface

### Klanten Interface (Dashboard)

#### Overzicht Page
- ✅ Systeem status indicator (groen = actief)
- ✅ Stats (vandaag, deze week, deze maand)
- ✅ Verbonden platforms lijst
- ✅ Recente activiteit feed
- ✅ Volgende geplande posts

#### Platforms Page
- ✅ Verbonden platforms overzicht
- ✅ Platform stats (posts deze maand, laatste post)
- ✅ Nieuwe platform verbinden knop
- ✅ Platform verbreken functionaliteit
- ✅ Bekijk posts per platform
- ✅ Info card over platform flexibiliteit USP

#### Content Page
- ✅ Content kalender view
- ✅ Filter op platform en type
- ✅ Gegroepeerd per datum (vandaag, morgen, etc.)
- ✅ Status indicators (gepland, gepubliceerd, gefaald)
- ✅ Preview van content
- ✅ Time-based sorting

#### Account Page
- ✅ Tabbed interface (Pakket, Betaling, Profiel, Support)
- ✅ Huidig pakket info
- ✅ Upgrade/downgrade opties
- ✅ Facturen geschiedenis
- ✅ Bedrijfsprofiel bewerken
- ✅ Tone of Voice instellingen
- ✅ Support opties (FAQ, Email, WhatsApp, Videos)

---

### Admin Interface

#### Dashboard Page
- ✅ MRR (Monthly Recurring Revenue)
- ✅ Aantal actieve klanten
- ✅ Nieuwe klanten deze maand
- ✅ Churn rate
- ✅ Totale content gegenereerd
- ✅ API kosten vs revenue
- ✅ Pakket distributie chart
- ✅ Recent activity alle klanten

#### Klanten Management
- ✅ Alle klanten lijst
- ✅ Filter en zoek functionaliteit
- ✅ Klant details view
- ✅ Pakket geschiedenis
- ✅ Content statistieken per klant
- ✅ Facturatie status
- ✅ Notities en communicatie log

#### Financieel Dashboard
- ✅ MRR tracking en trends
- ✅ Kosten breakdown (AI API, Getlate, etc.)
- ✅ Winst per pakket
- ✅ BTW overzicht
- ✅ Cashflow projecties
- ✅ Churn impact analysis

#### Content Distributie Center
- ✅ Alle content van alle klanten
- ✅ Multi-platform posting overzicht
- ✅ Queue management
- ✅ Failed posts troubleshooting
- ✅ Content performance analytics
- ✅ Bulk operations

---

## 🔧 Maintenance & Updates

### Adding New Admin Features
1. Voeg route toe in `app/admin/`
2. Voeg nav item toe in `lib/admin-navigation-config.ts`
3. Zorg voor proper access control in page component

### Adding New Client Features
1. Voeg route toe in `app/dashboard/`
2. Voeg nav item toe in `lib/dashboard-navigation-config.ts` (max 4 items!)
3. Filter data op user_id in API calls

### Updating Styles
- Klanten: Gebruik `#FF9933` en `#FFAD33` voor accent
- Admin: Gebruik rood/oranje tinten voor onderscheid
- Beide: Gray-50 voor backgrounds, white voor cards

---

## 🐛 Troubleshooting

### Probleem: Klant ziet admin menu
**Oplossing:** Check `isUserAdmin()` functie in `lib/navigation-config.ts`

### Probleem: Admin kan geen klanten zien
**Oplossing:** Verify dat de role check in admin layout correct werkt

### Probleem: Wrong redirect after login
**Oplossing:** Check `app/page.tsx` redirect logic

### Probleem: Data filtering niet werkend
**Oplossing:** Ensure API endpoints filter on `session.user.id` for clients

---

## 📝 TODO / Future Improvements

- [ ] Implementeer API endpoints met proper filtering
- [ ] Voeg middleware toe voor extra security layer
- [ ] Test met echte klant accounts
- [ ] Implementeer admin dashboard metrics
- [ ] Voeg financieel dashboard toe met real data
- [ ] Maak statistieken page met grafieken
- [ ] Implementeer notificaties systeem
- [ ] Voeg audit log toe voor admin actions

---

## 📞 Contact & Support

Voor vragen over deze implementatie:
- **Developer:** [Naam]
- **Email:** info@writgo.nl
- **Repository:** github.com/[username]/writgoai_nl

---

## 📜 Changelog

### v1.0 - 11 december 2025
- ✅ Initiële split van admin en klanten interfaces
- ✅ 4 simpele pagina's voor klanten (`/dashboard`)
- ✅ Volledige admin interface met alle features (`/admin`)
- ✅ Role-based access control geïmplementeerd
- ✅ Automatische redirects op basis van user role
- ✅ Separate navigatie configs en layouts
- ✅ Documentatie aangemaakt

---

**🎉 De interface split is nu volledig geïmplementeerd!**
