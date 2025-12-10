
# Autopilot Kwaliteitsverbeteringen

**Datum**: 7 november 2025  
**Versie**: 3.0

## Overzicht

Deze update bevat cruciale kwaliteitsverbeteringen voor de Autopilot functionaliteit, met focus op:
1. **TradeTracker Integratie** - Nieuwe affiliate network ondersteuning
2. **Verbeterde Content Kwaliteit** - Strengere handhaving van banned words en schrijfregels
3. **Betere Heading Structuur** - Voorkomen van dubbele punten en betere SEO optimalisatie
4. **Slimmere Afbeelding Plaatsing** - Voorkomen van dubbele afbeeldingen achter elkaar
5. **Relevantere Affiliate Links** - Betere filtering en selectie van producten

---

## 1. TradeTracker Affiliate Integratie

### Nieuwe Features
- **TradeTracker API wrapper** toegevoegd voor affiliate integratie
- Ondersteuning voor product feeds van duizenden adverteerders
- AI-powered product selectie voor relevantere links
- Automatische affiliate link generatie met tracking

### Implementatie Details

#### Nieuw Bestand: `lib/tradetracker-api.ts`

```typescript
// TradeTracker credentials
export interface TradeTrackerCredentials {
  customerId: string;      // TradeTracker customer/affiliate ID
  passphrase: string;      // API passphrase/token
  locale?: string;         // Locale (default: nl_NL)
  sandbox?: boolean;       // Gebruik sandbox environment
}

// Product search met AI filtering
export async function findRelevantTradeTrackerProducts(
  query: string,
  credentials: TradeTrackerCredentials,
  options?: {
    maxProducts?: number;
    category?: string;
    priceRange?: { min?: number; max?: number };
  }
): Promise<TradeTrackerProduct[]>

// Generate affiliate link
export function generateTradeTrackerAffiliateLink(
  campaignId: string,
  siteId: string,
  productUrl: string,
  materialId?: string
): string
```

### Gebruik

```typescript
import {
  findRelevantTradeTrackerProducts,
  generateTradeTrackerAffiliateLink,
  type TradeTrackerCredentials
} from './lib/tradetracker-api';

const credentials: TradeTrackerCredentials = {
  customerId: 'YOUR_CUSTOMER_ID',
  passphrase: 'YOUR_PASSPHRASE',
};

// Zoek relevante producten
const products = await findRelevantTradeTrackerProducts(
  'beste laptops 2025',
  credentials,
  { maxProducts: 5 }
);

// Genereer affiliate link
const affiliateLink = generateTradeTrackerAffiliateLink(
  '12345', // campaign ID
  'YOUR_SITE_ID',
  'https://example.com/product',
  '67890' // optional material ID
);
```

### API Documentatie
- **WSDL**: http://ws.tradetracker.com/soap/affiliate?wsdl
- **Handleiding**: https://docs.affiliateheld.nl/api-koppelingen/koppelen-met-tradetracker/

---

## 2. Verbeterde Banned Words Enforcement

### Updates in `lib/banned-words.ts`

**Nieuwe verboden woorden toegevoegd:**
- `in een wereld vol`
- `in een wereld vol keuzes`
- `cruciale` (naast `cruciaal`)
- `vielleicht` (Duitse woorden)
- `perhaps`, `maybe` (Engelse woorden)

### Strengere Instructies

De `getBannedWordsInstructions()` functie is uitgebreid met:
- Expliciete vermelding van **ALLEEN NEDERLANDS** - geen Duitse of Engelse woorden
- Duidelijkere alternatieven voor elk verboden woord
- Strengere waarschuwingen over AI-detecteerbare patronen

### Implementatie in AI Prompts

**In `lib/aiml-agent.ts`:**

```typescript
import { getBannedWordsInstructions, BANNED_WORDS } from './banned-words';

// In generateBlog functie:
🔴 KRITIEKE TAALREGELS (VERPLICHT):
1. ⚠️ Schrijf ALLEEN in het NEDERLANDS - GEEN enkele Duitse, Engelse of andere woorden!
2. ⚠️ GEEN woorden zoals "vielleicht", "perhaps", "maybe" - gebruik ALLEEN Nederlandse alternatieven
3. ⚠️ Controleer ELKE zin op taalfouten voordat je verder gaat
4. ⚠️ Maak ELKE zin af - GEEN afgebroken zinnen zoals "de wereld ," zonder vervolg
5. ⚠️ GEEN komma's aan het einde van zinnen zonder dat de zin compleet is

${getBannedWordsInstructions()}
```

---

## 3. Verbeterde Heading Structuur

### Nieuwe Regels voor Headings

**❌ VERBODEN: Dubbele punten in headings**

```typescript
// FOUT ❌
<h2>De cruciale vraag: hoe werken vergelijkingssites eigenlijk?</h2>
<h2>De afsluiting: is het de investering waard?</h2>
<h2>Tip 1: let op de prijs</h2>

// CORRECT ✅
<h2>Hoe werken vergelijkingssites eigenlijk</h2>
<h2>Is deze investering de moeite waard</h2>
<h2>Let goed op de prijs voordat je koopt</h2>
```

### Implementatie in `lib/aiml-agent.ts`

```typescript
2. DUBBELE PUNTEN IN HEADINGS (VERBODEN):
   ⚠️ GEBRUIK NOOIT dubbele punten (:) in H2 of H3 headings!
   ⚠️ Dubbele punten maken headings minder natuurlijk en SEO-vriendelijk
   
   ✅ CORRECT: "Hoe werken vergelijkingssites eigenlijk"
   ✅ CORRECT: "De beste manieren om geld te besparen"
   ✅ CORRECT: "Wat je moet weten voor je koopt"
   ❌ FOUT: "De cruciale vraag: hoe werken vergelijkingssites eigenlijk?"
   ❌ FOUT: "De afsluiting: is het de investering waard?"
   ❌ FOUT: "Tip 1: let op de prijs"
```

### SEO Voordelen
- Natuurlijkere headings die beter lezen
- Betere keyword integratie zonder onderbreking
- Hogere klik-through rate in search results
- Verbeterde gebruikerservaring

---

## 4. Slimmere Afbeelding Plaatsing

### Probleem
Soms werden 2 afbeeldingen direct achter elkaar geplaatst, wat de leesbaarheid verstoort.

### Oplossing

**Nieuwe instructies in `lib/aiml-agent.ts`:**

```typescript
⚠️ BELANGRIJK VOOR AFBEELDINGEN:
- Begin met [IMAGE-2] voor de eerste afbeelding IN de content
- [IMAGE-1] wordt ALLEEN gebruikt als featured/uitgelichte afbeelding en verschijnt NIET in de content
- Gebruik [IMAGE-2], [IMAGE-3], [IMAGE-4], etc. voor afbeeldingen in het artikel
- Plaats NOOIT [IMAGE-1] in de content zelf!
- ⚠️ NOOIT 2 afbeeldingen direct achter elkaar plaatsen! Plaats altijd minstens 2-3 paragrafen tekst tussen elke afbeelding
- ⚠️ Verdeel afbeeldingen gelijkmatig over het artikel - niet allemaal aan het begin of einde
```

### Best Practices
1. **Featured image** ([IMAGE-1]): Wordt automatisch als header afbeelding gebruikt
2. **Content images** ([IMAGE-2], [IMAGE-3], etc.): Verspreid door het artikel
3. **Minimale afstand**: 2-3 paragrafen (≈300-500 woorden) tussen afbeeldingen
4. **Gelijkmatige verdeling**: Door het hele artikel, niet geclusterd

---

## 5. Relevantere Affiliate Link Selectie

### Probleem
- Affiliate links waren soms totaal niet relevant aan het onderwerp
- Te veel boeken als affiliate links, zelfs voor fysieke producten
- Gebrek aan diversiteit in producttypen

### Oplossing

**Updates in `lib/bolcom-product-finder.ts`:**

```typescript
const batchAnalysisPrompt = `
⚠️ BELANGRIJK: 
- Selecteer ALLEEN producten die DIRECT RELEVANT zijn voor "${request.query}"
- Filter producten die NIET passen (bijv. boeken als er om fysieke producten wordt gevraagd)
- Zorg voor DIVERSITEIT in producttypen - niet alleen één categorie
- Geef lagere scores (1-3) aan irrelevante producten

Geef voor ELK product in JSON formaat:
{
  "products": [
    {
      "productNumber": 1,
      "relevant": true, (false als product niet relevant is)
      "relevanceReason": "Dit product past goed omdat...",
      "pros": ["voordeel 1", "voordeel 2", "voordeel 3"],
      "cons": ["nadeel 1", "nadeel 2"],
      "summary": "Korte samenvatting...",
      "overallScore": 8.5 (1-10, lage score voor irrelevante producten)
    }
  ]
}
`;

// Filter irrelevante producten
if (analysis.relevant === false || analysis.overallScore < 4) {
  console.log(`Skipping irrelevant product: ${product.title}`);
  continue;
}
```

### Verbeteringen
1. **AI-based relevantie filtering** - Producten worden beoordeeld op relevantie
2. **Diversiteit check** - Zorgt voor variatie in producttypen
3. **Score threshold** - Producten onder score 4/10 worden uitgefilterd
4. **Transparantie** - Logging van waarom producten worden overgeslagen

### Voorbeelden

**Query: "beste waterfilter 2025"**

❌ **FOUT (voor fix):**
- "Boek: Alles over water en filters" (irrelevant - boek)
- "Water: Een biografie" (irrelevant - boek)
- "Glazen waterkan" (enigszins relevant, maar niet een filter)

✅ **CORRECT (na fix):**
- "BRITA Marella waterfilter" (direct relevant)
- "BWT AQA Drink Pure" (direct relevant)
- "Berkey Light waterzuiveringssysteem" (direct relevant)

---

## Database Schema

Geen database changes nodig voor deze update - alle verbeteringen zijn in de applicatielogica.

---

## API Changes

### Nieuwe Export

```typescript
// lib/tradetracker-api.ts
export {
  type TradeTrackerCredentials,
  type TradeTrackerProduct,
  type TradeTrackerCampaign,
  type TradeTrackerSearchResult,
  findRelevantTradeTrackerProducts,
  generateTradeTrackerAffiliateLink,
  searchTradeTrackerProducts,
  getTradeTrackerCampaigns,
  getTradeTrackerFeed,
  hasTradeTrackerCredentials,
};
```

---

## Testing

### Test Cases

1. **Banned Words**
   - Controleer of "cruciale", "vielleicht", "in een wereld vol" worden vermeden
   - Verifieer Nederlandse alternatieven worden gebruikt

2. **Headings**
   - Geen dubbele punten in H2/H3 headings
   - Focus keyword in minimaal 2 headings
   - Nederlandse hoofdlettergebruik (alleen eerste letter)

3. **Afbeeldingen**
   - Geen 2 afbeeldingen direct achter elkaar
   - [IMAGE-1] alleen als featured image
   - Gelijkmatige verdeling door artikel

4. **Affiliate Links**
   - Relevante producten voor onderwerp
   - Diversiteit in producttypen
   - Geen irrelevante boeken voor fysieke producten

### Test Autopilot Article

```bash
# Start autopilot run
curl -X POST http://localhost:3000/api/client/autopilot/run-now \
  -H "Content-Type: application/json" \
  -d '{"projectId": "YOUR_PROJECT_ID"}'

# Monitor resultaten in database:
# - Check articleContent voor banned words
# - Inspecteer headings op dubbele punten
# - Verifieer image spacing
# - Controleer affiliate link relevantie
```

---

## Deployment Checklist

- [x] TradeTracker API integratie toegevoegd
- [x] Banned words lijst uitgebreid
- [x] Heading rules verscherpt
- [x] Afbeelding spacing rules toegevoegd
- [x] Affiliate link relevantie filtering geïmplementeerd
- [x] Documentatie voltooid
- [ ] Tests uitgevoerd
- [ ] Deployed naar productie

---

## Troubleshooting

### Probleem: Duitse/Engelse woorden verschijnen nog steeds

**Oplossing**: 
- Controleer of `getBannedWordsInstructions()` correct wordt aangeroepen
- Verifieer AI model (gebruik Claude 4.5 voor beste Nederlandse output)
- Check of banned words lijst correct is geïmporteerd

### Probleem: Dubbele punten in headings

**Oplossing**:
- AI model kan tijd nodig hebben om nieuwe rules te leren
- Gebruik system prompt check: "Heb je de heading rules begrepen?"
- Overweeg post-processing regex cleanup als laatste resort

### Probleem: Irrelevante affiliate links blijven verschijnen

**Oplossing**:
- Verhoog score threshold van 4 naar 5 of 6
- Voeg specifieke product category filters toe
- Check of AI model correct JSON teruggeeft met `relevant` flag

### Probleem: TradeTracker integratie werkt niet

**Oplossing**:
- Verifieer credentials (customerId en passphrase)
- Check SOAP endpoint bereikbaarheid
- Voor productie: implementeer volledige SOAP client met xml2js

---

## Volgende Stappen

1. **TradeTracker SOAP Implementation**
   - Volledige SOAP client implementatie met xml2js
   - Real-time product feed synchronisatie
   - Campaign management integratie

2. **Advanced Content Quality**
   - AI-based content scoring na generatie
   - Automatische banned words cleanup
   - Post-generation quality checks

3. **Enhanced Affiliate Intelligence**
   - Machine learning voor product relevantie
   - User behavior tracking voor conversie optimalisatie
   - Dynamic commission optimization

---

## Credits

**Ontwikkeld door**: WritgoAI Development Team  
**Contact**: support@writgo.ai  
**Documentatie versie**: 3.0  
**Laatste update**: 7 november 2025
