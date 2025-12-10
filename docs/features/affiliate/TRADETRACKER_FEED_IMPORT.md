
# TradeTracker Feed Import - Implementatie Documentatie

## Overzicht

De TradeTracker feed import functionaliteit stelt gebruikers in staat om productfeeds van TradeTracker te importeren en automatisch de juiste Site ID (affiliate ID) toe te voegen voor commissie tracking.

## Belangrijkste Features

### 1. **Site ID Tracking** 
- Automatische toevoeging van je Site ID aan alle product links
- Ondersteunt zowel deep links als click tracking links
- Zorgt voor correcte commissie tracking

### 2. **Feed Formaten**
- **Deep Links**: `https://merchant.com/endpoint/TradeTracker/?tt=439_12_465504_&r=%2F`
  - Format: `tt={campaignID}_{materialID}_{siteID}_`
  - De site_id wordt automatisch bijgewerkt met jouw ID
  
- **Click Tracking**: `https://tc.tradetracker.net/?c=439&m=465504&u=https://example.com`
  - Format: `c={campaignID}&m={siteID}&u={productURL}`
  - Wordt gebruikt als fallback

### 3. **XML Feed Parsing**
- Ondersteunt TradeTracker XML productfeeds
- Extraheert automatisch:
  - Product naam, beschrijving, prijs
  - Campaign ID en Material ID
  - Productafbeeldingen en categorieën
  - Deep links met tracking parameters

## Implementatie Details

### Database Schema

```prisma
model Project {
  tradeTrackerSiteId      String?   // Site/Affiliate ID voor tracking
  tradeTrackerPassphrase  String?   // API Passphrase (optioneel)
  tradeTrackerCampaignId  String?   // Default Campaign ID
  tradeTrackerEnabled     Boolean   @default(false)
}
```

### API Endpoints

#### POST `/api/client/projects/[id]/tradetracker-feed`
Import TradeTracker productfeed.

**Request Body:**
```json
{
  "feedUrl": "https://example.com/feed.xml",  // Of feedContent
  "feedContent": "<xml>...</xml>",            // Of feedUrl
  "defaultCategory": "Producten"              // Optioneel
}
```

**Response:**
```json
{
  "success": true,
  "imported": 25,
  "total": 30,
  "skipped": 5,
  "message": "25 TradeTracker producten geïmporteerd! 🎉"
}
```

**Validatie:**
- Controleert of project bestaat en eigendom is van user
- Valideert dat `tradeTrackerSiteId` is geconfigureerd
- Checkt voor duplicate links

### Library Functions

**`lib/tradetracker-api.ts`:**

```typescript
// Parse TradeTracker XML feed
parseTradeTrackerFeed(
  feedContent: string,
  siteId: string,
  defaultCampaignId?: string
): Promise<TradeTrackerProduct[]>

// Fetch feed van URL
fetchTradeTrackerFeed(
  feedUrl: string,
  siteId: string,
  defaultCampaignId?: string
): Promise<TradeTrackerProduct[]>

// Genereer affiliate link met site_id
generateTradeTrackerAffiliateLink(
  campaignId: string,
  siteId: string,
  productUrl: string,
  materialId?: string
): string
```

## Gebruikersinstructies

### Stap 1: TradeTracker Credentials Configureren

1. Ga naar je project instellingen
2. Klik op "TradeTracker Integratie" → "Configureren"
3. Voer je credentials in:
   - **Site ID*** (verplicht): Je TradeTracker affiliate/site ID (bijv. 465504)
   - **API Passphrase** (optioneel): Alleen nodig voor SOAP API
   - **Default Campaign ID** (optioneel): Fallback voor link generatie
4. Klik op "Opslaan"

**Waar vind je je Site ID?**
- Login op [affiliate.tradetracker.com](https://affiliate.tradetracker.com)
- Ga naar Account Settings
- Zoek je Site ID / Affiliate ID

### Stap 2: Feed Importeren

1. Ga naar je project → "Affiliate Links" tab
2. Klik op "Feed Importeren"
3. Kies import methode:
   - **Feed URL**: Voer directe URL van productfeed in
   - **Feed Content**: Plak volledige XML inhoud
4. Selecteer format: "TradeTracker XML (met site_id tracking)"
5. Optioneel: Voer standaard categorie in
6. Klik op "Feed Importeren"

### Stap 3: Links Gebruiken

De geïmporteerde links worden automatisch gebruikt:
- ✅ In Writgo Writer (Manual & Autopilot mode)
- ✅ In Content Optimizer
- ✅ In alle andere content generatie tools
- ✅ Site ID is altijd correct voor commissie tracking

## Technische Details

### Deep Link Parsing

Als de productURL al een deep link is:
```
https://merchant.com/endpoint/TradeTracker/?tt=439_12_465504_&r=%2Fproduct
```

Het systeem:
1. Detecteert de `tt` parameter
2. Split de waarde: `[campaignID, materialID, siteID]`
3. Vervangt de oude siteID met jouw Site ID
4. Construeert de nieuwe URL

### Click Tracking Link Generatie

Als de productURL een reguliere URL is:
```
https://merchant.com/product
```

Het systeem:
1. Gebruikt de Campaign ID uit de feed (of default)
2. Gebruikt jouw Site ID
3. Genereert: `https://tc.tradetracker.net/?c=439&m=465504&u=https://merchant.com/product`

### Keyword Generatie

Voor elk geïmporteerd product:
- AI genereert 3-5 relevante Nederlandse keywords
- Gebaseerd op productnaam, beschrijving en categorie
- Gebruikt `gpt-4o-mini` voor snelle, kosteneffectieve generatie
- Fallback: Extract keywords uit productnaam

### Duplicate Detectie

- Controleert op bestaande links met dezelfde URL
- Slaat duplicaten over
- Rapporteert aantal geïmporteerd vs. overgeslagen

## Voorbeelden

### Voorbeeld 1: Deep Link Import

**Input Feed:**
```xml
<products>
  <product>
    <productName>Vakantiehuis Spanje</productName>
    <productURL>https://www.d-reizen.nl/opvakantie/?tt=37700_12_OLD_SITE_ID_&r=%2Fvakantie</productURL>
    <price>499.00</price>
    <category>Reizen</category>
  </product>
</products>
```

**Output (met Site ID 465504):**
```
URL: https://www.d-reizen.nl/opvakantie/?tt=37700_12_465504_&r=%2Fvakantie
Anchor Text: Vakantiehuis Spanje
Category: Reizen
Keywords: vakantiehuis, spanje, reizen, vakantie, huis
```

### Voorbeeld 2: Regular URL Import

**Input Feed:**
```xml
<products>
  <product>
    <productName>Yoga Mat Premium</productName>
    <productURL>https://shop.example.com/yoga-mat</productURL>
    <campaignID>439</campaignID>
    <price>29.99</price>
  </product>
</products>
```

**Output:**
```
URL: https://tc.tradetracker.net/?c=439&m=465504&u=https://shop.example.com/yoga-mat
Anchor Text: Yoga Mat Premium
Category: Sport & Fitness
Keywords: yoga mat, premium, sport, fitness, yogamat
```

## Foutafhandeling

### Veelvoorkomende Fouten

**Fout:** "TradeTracker Site ID is niet geconfigureerd"
**Oplossing:** Configureer eerst je Site ID in project instellingen

**Fout:** "Geen producten gevonden in feed"
**Oplossing:** 
- Controleer of de feed URL correct is
- Valideer dat de XML geldig is
- Probeer feed content direct te plakken

**Fout:** "Failed to fetch TradeTracker feed: HTTP 403/404"
**Oplossing:**
- Controleer of de feed URL publiek toegankelijk is
- Mogelijk heb je API credentials nodig (passphrase)

## Best Practices

### 1. Feed Updates
- Importeer feeds regelmatig (wekelijks/maandelijks)
- Verwijder oude/inactieve producten
- Houd categorieën consistent

### 2. Site ID Validatie
- Test altijd één product link na import
- Verifieer dat commissie tracking werkt
- Controleer in TradeTracker dashboard

### 3. Performance
- Import grote feeds (1000+ producten) in batches
- Gebruik cache voor vaak gebruikte producten
- Monitor API rate limits

### 4. Commissie Optimalisatie
- Gebruik specifieke Campaign IDs voor betere tracking
- Segment producten per categorie
- Monitor welke links het beste converteren

## Toekomstige Verbeteringen

Mogelijke uitbreidingen:
- [ ] Automatische feed synchronisatie (dagelijks/wekelijks)
- [ ] Product voorraad monitoring
- [ ] Prijswijziging alerts
- [ ] Commissie statistieken per product
- [ ] A/B testing voor verschillende link formaten
- [ ] Bulk edit van categorieën
- [ ] Export naar CSV voor analyse

## Support

Voor vragen of problemen:
1. Check deze documentatie
2. Test met één product eerst
3. Valideer Site ID in TradeTracker dashboard
4. Controleer console logs voor details

---

**Laatst bijgewerkt:** November 7, 2025  
**Versie:** 1.0.0
