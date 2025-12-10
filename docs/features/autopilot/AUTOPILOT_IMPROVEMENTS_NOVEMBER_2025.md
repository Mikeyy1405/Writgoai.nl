
# Autopilot Verbeteringen - November 2025

## Overzicht van Nieuwe Functies

Deze update voegt drie belangrijke verbeteringen toe aan het Autopilot systeem:

### 1. 🛍️ Content Optimizer Integratie voor WooCommerce Producten

**Functionaliteit:**
- Automatisch WooCommerce producten ophalen en optimaliseren via Autopilot
- Producten analyseren met AI-gedreven SEO scoring
- Productomschrijvingen automatisch herschrijven volgens brand voice
- Optioneel direct publiceren naar WordPress

**Hoe te gebruiken:**
1. Ga naar **Client Portal → Autopilot**
2. Selecteer een project met WooCommerce configuratie
3. Klik op de nieuwe knop **"Product Optimizer"**
4. Bevestig de actie in de dialoog
5. De Autopilot zal:
   - De laatste 5 WooCommerce producten ophalen
   - Elk product analyseren en een SEO score geven
   - Concrete verbeteringen voorstellen
   - Productomschrijvingen herschrijven
   - Automatisch publiceren als `autoPublish` is ingeschakeld

**API Endpoint:**
- `POST /api/client/autopilot/optimize-products`
- Parameters:
  - `projectId`: Project ID
  - `productsCount`: Aantal producten (standaard 5)
  - `autoPublish`: Direct publiceren naar WordPress (boolean)

**Verbeteringen per product:**
- SEO score (0-100)
- 3-5 concrete verbeteringen
- Geoptimaliseerde productnaam
- Korte omschrijving (120-160 karakters, alleen tekst)
- Lange omschrijving (300-500 woorden, alleen tekst)

---

### 2. 📅 Flexibele Publicatiedagen voor Autopilot Scheduling

**Functionaliteit:**
- Kies specifieke weekdagen voor publicatie (bijv. maandag/woensdag/vrijdag of dinsdag/donderdag)
- Visuele checkbox interface voor dagenselectie
- Realtime preview van geselecteerde dagen
- Ondersteuning voor alle dagen van de week

**Hoe te gebruiken:**
1. Ga naar **Client Portal → Autopilot**
2. Klik op **"Plan Autopilot"** of **"Instellingen"**
3. Selecteer **"Specifieke dagen kiezen"** in de frequentie dropdown
4. Klik op de gewenste dagen in de checkbox interface:
   - Maandag (value: 1)
   - Dinsdag (value: 2)
   - Woensdag (value: 3)
   - Donderdag (value: 4)
   - Vrijdag (value: 5)
   - Zaterdag (value: 6)
   - Zondag (value: 0)
5. Stel de tijd van dag in (bijv. 09:00)
6. Bevestig en plan de Autopilot

**Voorbeelden:**
- **Ma/Wo/Vr publicatie**: Selecteer dagen 1, 3, 5 om 09:00
- **Di/Do publicatie**: Selecteer dagen 2, 4 om 14:00
- **Elke werkdag**: Selecteer dagen 1-5 om 10:00

**Database veld:**
- `AutopilotSchedule.daysOfWeek`: Array van integers (0-6)
- `AutopilotSchedule.frequency`: "custom-days"

---

### 3. 📌 Publicatiedatum Zichtbaar in Klantview

**Functionaliteit:**
- Publicatiedatum wordt prominent getoond bij elk artikel idee
- Volledige datum weergave met weekdag (bijv. "maandag 11 november 2025")
- Visuele styling met kalender icoon en blauwe highlight
- Automatisch sorteren van ideeën op publicatiedatum

**Hoe te gebruiken:**
1. Klanten kunnen nu hun **Project View Dashboard** openen via de access link
2. In het tabblad **"Ideeën"** worden alle geplande artikelen getoond
3. Bij elk artikel met een `scheduledFor` datum verschijnt nu een prominente badge:
   ```
   📅 Publicatiedatum: maandag 11 november 2025
   ```
4. Artikelen worden automatisch gesorteerd op publicatiedatum (vroegste eerst)

**UI Verbeteringen:**
- Blauwe achtergrond badge met border
- Kalender icoon voor duidelijke herkenning
- Nederlandse datumnotatie met volledige weekdag naam
- Alleen zichtbaar bij artikelen met een geplande datum

**Implementatie Details:**
- Bestand: `/app/project-view/[token]/page.tsx`
- Gebruikt `toLocaleDateString('nl-NL')` voor Nederlandse formatting
- Badge alleen getoond wanneer `item.scheduledFor` aanwezig is

---

## Technische Implementatie

### Nieuwe API Route

**Bestand:** `/app/api/client/autopilot/optimize-products/route.ts`

```typescript
POST /api/client/autopilot/optimize-products
Request Body:
{
  "projectId": "string",
  "productsCount": 5,
  "autoPublish": false
}

Response:
{
  "success": true,
  "productsProcessed": 5,
  "results": [
    {
      "productId": "123",
      "productName": "Product naam",
      "status": "published" | "analyzed" | "failed",
      "seoScore": 85,
      "improvements": ["Verbetering 1", "Verbetering 2"],
      "optimizedContent": { ... }
    }
  ]
}
```

### UI Componenten

**Bestand:** `/app/client-portal/autopilot/page.tsx`

- Nieuwe functie `optimizeProducts()` (regel 962-1007)
- Nieuwe "Product Optimizer" knop in de UI (regel 1169-1186)
- Groen kleurenschema voor product optimization acties

**Bestand:** `/app/project-view/[token]/page.tsx`

- Verbeterde artikel weergave met publicatiedatum (regel 448-459)
- Nederlandse datumformattering
- Automatische sortering op `scheduledFor`

---

## Vereisten

### Voor Product Optimizer:
- ✅ WordPress + WooCommerce geïnstalleerd en geconfigureerd
- ✅ WordPress credentials ingesteld in Project settings
- ✅ Minimaal 1 product in WooCommerce store
- ✅ Brand voice en doelgroep instellingen (optioneel maar aanbevolen)

### Voor Publicatiedagen:
- ✅ Project geselecteerd in Autopilot
- ✅ AutopilotSchedule geconfigureerd met `frequency: "custom-days"`
- ✅ Minimaal 1 weekdag geselecteerd in `daysOfWeek` array

### Voor Publicatiedatum Display:
- ✅ ArticleIdea met `scheduledFor` veld ingevuld
- ✅ Project View access link gedeeld met klant
- ✅ Klant ingelogd via access token

---

## Best Practices

### Product Optimizer:
1. **Testtip**: Begin met 1-2 producten om de output te controleren
2. **Brand Voice**: Stel altijd brand voice in voor consistente tone
3. **WordPress Backup**: Maak een backup voor het eerste gebruik
4. **Credit Management**: Product optimalisatie gebruikt AI credits (ca. 100-200 per product)

### Publicatiedagen:
1. **Spreiding**: Kies dagen verspreid over de week voor maximale impact
2. **Consistency**: Gebruik dezelfde dagen/tijden elke week voor herkenbaarheid
3. **Buffer**: Plan minimaal 1 dag van tevoren voor content review

### Publicatiedatum Display:
1. **Planning**: Stel altijd een `scheduledFor` datum in bij nieuwe artikelen
2. **Communicatie**: Deel de Project View link met klanten voor transparantie
3. **Sortering**: Artikelen worden automatisch gesorteerd, vroegste eerst

---

## Compatibiliteit

- ✅ **Next.js**: 14.2.28
- ✅ **TypeScript**: Volledig type-safe
- ✅ **Database**: PostgreSQL met Prisma ORM
- ✅ **WordPress**: REST API v2 + WooCommerce REST API v3
- ✅ **AI Models**: GPT-4o-mini voor analyse en herschrijven

---

## Deployment Status

- ✅ **Build**: Succesvol gecompileerd
- ✅ **Type Checking**: Geen TypeScript errors
- ✅ **Routes**: Alle 159 pagina's gegenereerd
- ✅ **Checkpoint**: Opgeslagen als "Product Optimizer + Publicatiedagen + Datums"
- ✅ **Deployment**: Klaar voor productie op WritgoAI.nl

---

## Credits Gebruik

**Per Product Optimizer run (5 producten):**
- Analyse: ~50 credits (10 per product)
- Herschrijven: ~250 credits (50 per product)
- **Totaal**: ~300 credits per run

**Per Artikel Generatie:**
- Fast mode: ~100-150 credits
- Research mode: ~200-300 credits

---

## Changelog

### v3.2.0 - November 7, 2025

**Toegevoegd:**
- ✅ Product Optimizer functionaliteit in Autopilot
- ✅ Flexibele weekdag selectie voor scheduling
- ✅ Publicatiedatum display in klantview
- ✅ API endpoint `/api/client/autopilot/optimize-products`
- ✅ Nederlandse datumformattering in project-view

**Verbeterd:**
- ✅ Autopilot UI met nieuwe "Product Optimizer" knop
- ✅ Custom-days scheduling interface met checkboxes
- ✅ Artikel weergave in klantview met prominente datum badges
- ✅ Automatische sortering op publicatiedatum

**Bugfixes:**
- ✅ Canvas DOMMatrix error opgelost (vorige update)
- ✅ TypeScript type safety verbeterd

---

## Support

Voor vragen of problemen met deze nieuwe functies:
- Bekijk de gebruikershandleiding in de Knowledge Base
- Contact support via het feedback systeem
- Documentatie: Deze README.md

---

**Getest en gedeployed op:** 7 november 2025  
**Status:** ✅ Productie-ready
