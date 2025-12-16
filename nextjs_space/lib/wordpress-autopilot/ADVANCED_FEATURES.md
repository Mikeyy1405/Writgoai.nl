# WordPress Autopilot - Geavanceerde Content Features

## Overzicht

Het WordPress Autopilot systeem is uitgebreid met geavanceerde content features die automatisch hoogwaardige, SEO-geoptimaliseerde content genereren met:

1. **Content Regels & Brand Guidelines**
2. **Content Intent Templates** (Informational, Best-of-List, Review)
3. **Automatische Interne Links**
4. **Affiliate Links Integratie**
5. **Automatische Afbeeldingen**

---

## 1. Content Regels & Brand Guidelines

### Database Schema

```sql
ALTER TABLE "AutopilotSettings" 
ADD COLUMN "contentRules" JSONB,
ADD COLUMN "toneOfVoice" TEXT,
ADD COLUMN "brandGuidelines" TEXT,
ADD COLUMN "targetAudience" TEXT,
ADD COLUMN "writingStyle" TEXT,
ADD COLUMN "dosAndDonts" JSONB;
```

### TypeScript Interface

```typescript
interface AutopilotSettings {
  // ... existing fields
  contentRules?: Record<string, any>;
  toneOfVoice?: string; // 'professioneel', 'casual', 'vriendelijk'
  brandGuidelines?: string;
  targetAudience?: string;
  writingStyle?: string;
  dosAndDonts?: {
    dos: string[];
    donts: string[];
  };
}
```

### API Endpoints

**GET** `/api/admin/wordpress-autopilot/settings?siteId={siteId}`
- Haalt settings op voor een specifieke site

**PUT** `/api/admin/wordpress-autopilot/settings`
```json
{
  "siteId": "site-id",
  "settings": {
    "toneOfVoice": "professioneel en vriendelijk",
    "brandGuidelines": "Gebruik altijd positieve taal. Focus op oplossingen.",
    "targetAudience": "Ondernemers en kleine bedrijven",
    "writingStyle": "Direct en actionable",
    "dosAndDonts": {
      "dos": [
        "Gebruik concrete voorbeelden",
        "Voeg praktische tips toe",
        "Maak het scanbaar met bullets"
      ],
      "donts": [
        "Gebruik geen jargon",
        "Vermijd lange zinnen",
        "Geen negatieve taal"
      ]
    }
  }
}
```

---

## 2. Content Intent Templates

Het systeem detecteert automatisch het type content en gebruikt de juiste template.

### Beschikbare Templates

#### A. Informational Content
**Voor:** Educatieve, uitgebreide artikelen

**Kenmerken:**
- 1500-2500 woorden
- Duidelijke H2/H3 structuur
- Praktische tips en voorbeelden
- FAQ sectie
- Focus op kennisoverdracht

**Detectie:** Default voor algemene topics

#### B. Best-of-List Content
**Voor:** "Top 10 beste...", "5 beste manieren om..."

**Kenmerken:**
- 2000-3500 woorden
- Gerangschikte items (#1, #2, etc.)
- Pros & Cons per item
- Vergelijkingstabel
- Koopadvies

**Detectie:** Titels/keywords met "beste", "top", ranking termen

**Structuur:**
```
1. Inleiding: Waarom deze lijst belangrijk is
2. Selectiecriteria
3. Items 1-10 met:
   - Titel en beschrijving
   - Belangrijkste kenmerken
   - Pros (3-4 punten)
   - Cons (2-3 punten)
   - Geschiktheid
   - Prijs/waarde
4. Vergelijkingstabel (HTML)
5. Koopadvies
```

#### C. Review Content
**Voor:** Product/service reviews

**Kenmerken:**
- 1800-3000 woorden
- Uitgebreide test sectie
- Pros & Cons
- Overall rating (bijv. 4.5/5)
- Vergelijking met alternatieven

**Detectie:** Keywords: "review", "test", "ervaring"

**Structuur:**
```
1. Eerste indruk
2. Wat is [product/service]?
3. Kenmerken en specificaties
4. Uitgebreide test:
   - Gebruiksgemak
   - Prestaties
   - Kwaliteit
   - Prijs-kwaliteit
5. Pros & Cons
6. Vergelijking met alternatieven
7. Voor wie geschikt?
8. Rating en koopadvies
```

#### D. How-To Guide
**Voor:** Stap-voor-stap handleidingen

**Kenmerken:**
- 1200-2000 woorden
- Genummerde stappen
- Benodigdheden lijst
- Tips & best practices
- Veelgemaakte fouten

**Detectie:** Keywords: "hoe", "how to", "handleiding", "stappen"

### Automatische Detectie

```typescript
import { detectContentIntent } from '@/lib/wordpress-autopilot/content-intent-templates';

const intent = detectContentIntent(
  "De 10 Beste WordPress Plugins voor SEO",
  ["beste wordpress plugins", "seo tools", "wordpress seo"]
);
// Returns: "best-of-list"
```

### Custom Prompts

Content regels worden automatisch geïntegreerd in de AI prompts:

```typescript
import { buildContentPrompt } from '@/lib/wordpress-autopilot/content-intent-templates';

const prompt = buildContentPrompt(
  calendarItem,
  template,
  settings,
  'nl'
);
```

---

## 3. Automatische Interne Links

Het systeem analyseert bestaande WordPress content en voegt automatisch relevante interne links toe.

### Features

- **Automatische detectie** van relevante artikelen
- **AI-gegenereerde anchor teksten** (natuurlijk, niet geforceerd)
- **Relevantie scoring** (1-10)
- **Positionering** verspreid door de content

### Database Schema

```sql
ALTER TABLE "ContentCalendarItem"
ADD COLUMN "internalLinks" JSONB DEFAULT '[]';
```

### TypeScript Interface

```typescript
interface InternalLink {
  url: string;
  anchorText: string;
  targetTitle: string;
  position: number; // Character index
  relevanceScore?: number; // 1-10
}
```

### Hoe Het Werkt

1. **Fetch bestaande content** van de WordPress site
2. **AI analyse** voor relevantie matching
3. **Genereer natuurlijke anchor teksten**
4. **Insert op optimale posities** in de content

```typescript
import { findInternalLinks } from '@/lib/wordpress-autopilot/content-enhancers';

const internalLinks = await findInternalLinks(
  siteId,
  content,
  focusKeyword,
  topic,
  5 // max aantal links
);
```

### Voorbeeld Output

```json
[
  {
    "url": "https://example.com/seo-basics",
    "anchorText": "de basis van SEO",
    "targetTitle": "SEO Basics: Complete Gids voor Beginners",
    "relevanceScore": 9,
    "position": 800
  },
  {
    "url": "https://example.com/keyword-research",
    "anchorText": "effectief keyword onderzoek",
    "targetTitle": "Keyword Research: 7 Geavanceerde Technieken",
    "relevanceScore": 8,
    "position": 1600
  }
]
```

---

## 4. Affiliate Links Integratie

Automatische integratie van affiliate links waar relevant.

### Database Schema

```sql
ALTER TABLE "ContentCalendarItem"
ADD COLUMN "affiliateLinks" JSONB DEFAULT '[]';
```

### TypeScript Interface

```typescript
interface AffiliateLink {
  id: string;
  url: string;
  anchorText: string;
  productName: string;
  position: number;
  disclosure?: string;
}
```

### Features

- **Relevantie check** - alleen links die passen bij content
- **Natuurlijke anchor teksten** - geen spam
- **Automatische disclosure** - transparantie
- **Proper attributes** - rel="nofollow noopener sponsored"

### Disclosure Text

Elk affiliate link krijgt automatisch een disclosure:

```html
<p>
  <a href="[url]" rel="nofollow noopener sponsored" target="_blank">
    [anchor text]
  </a>
</p>
<p>
  <em style="font-size: 0.9em; color: #666;">
    Deze link bevat een affiliate link. Als je via deze link een aankoop doet, 
    kunnen wij een commissie verdienen zonder extra kosten voor jou.
  </em>
</p>
```

### Hoe Te Gebruiken

1. **Voeg affiliate links toe** in de database (tabel: `AffiliateLink`)
2. **AI detecteert automatisch** relevante momenten
3. **Links worden ingevoegd** tijdens content generatie

```typescript
import { findAffiliateLinks } from '@/lib/wordpress-autopilot/content-enhancers';

const affiliateLinks = await findAffiliateLinks(
  clientId,
  content,
  topic,
  3 // max aantal links
);
```

---

## 5. Automatische Afbeeldingen

Het systeem genereert automatisch afbeeldingen die de content ondersteunen.

### Database Schema

```sql
ALTER TABLE "ContentCalendarItem"
ADD COLUMN "images" JSONB DEFAULT '[]';
```

### TypeScript Interface

```typescript
interface ContentImage {
  url: string;
  alt: string; // SEO-vriendelijk
  caption?: string;
  position: number;
  source: 'generated' | 'stock' | 'uploaded';
  wordpressMediaId?: number;
}
```

### Features

- **AI bepaalt** welke afbeeldingen nodig zijn
- **SEO-vriendelijke alt teksten**
- **Proper HTML** met `<figure>` en `<figcaption>`
- **Responsive** met max-width: 100%

### HTML Output

```html
<figure style="margin: 2em 0;">
  <img src="[url]" alt="SEO-vriendelijke beschrijving" style="max-width: 100%; height: auto;" />
  <figcaption style="font-size: 0.9em; color: #666; margin-top: 0.5em;">
    Optioneel bijschrift
  </figcaption>
</figure>
```

### Image Generation

```typescript
import { generateContentImages } from '@/lib/wordpress-autopilot/content-enhancers';

const images = await generateContentImages(
  title,
  content,
  topic,
  3 // aantal afbeeldingen
);
```

**Note:** Momenteel placeholder images. Integreer met je AI image generation service voor productie.

---

## 6. Content Enhancement Workflow

Alle features worden gecombineerd in één enhancement flow:

```typescript
import { enhanceContent } from '@/lib/wordpress-autopilot/content-enhancers';

const {
  enhancedContent,
  internalLinks,
  affiliateLinks,
  images
} = await enhanceContent(
  siteId,
  clientId,
  htmlContent,
  title,
  focusKeyword,
  topic,
  includeImages // boolean
);
```

### Output

- **Enhanced HTML** - content met alle links en afbeeldingen
- **Metadata** - arrays met alle toegevoegde elementen
- **Tracking** - voor analytics en rapportage

---

## 7. Content Generatie Flow

### Complete Workflow

```
1. Get calendar item (title, keywords, topic, intent)
   ↓
2. Get autopilot settings (content rules, tone, guidelines)
   ↓
3. Get content template (based on intent)
   ↓
4. Build AI prompt (with rules and template)
   ↓
5. Generate base content (Claude Sonnet 4)
   ↓
6. Enhance content:
   - Find internal links (3-5)
   - Find affiliate links (2-3)
   - Generate images (2-4)
   - Insert into content
   ↓
7. Save to SavedContent
   ↓
8. Update calendar item with metadata
   ↓
9. Publish to WordPress
   ↓
10. Update site stats
```

### Code Example

```typescript
// 1. Get template based on content intent
const template = getContentTemplate(
  item.contentIntent,
  item.contentType
);

// 2. Get settings (content rules)
const settings = await getAutopilotSettings(siteId);

// 3. Build prompt with rules
const prompt = buildContentPrompt(
  item,
  template,
  settings,
  'nl'
);

// 4. Generate content
const response = await chatCompletion({
  messages: [{ role: 'user', content: prompt }],
  model: 'claude-sonnet-4',
  temperature: 0.6,
  max_tokens: 8000,
});

let htmlContent = response.choices[0]?.message?.content || '';

// 5. Enhance content
const enhancement = await enhanceContent(
  siteId,
  clientId,
  htmlContent,
  item.title,
  item.focusKeyword,
  item.topic,
  settings?.includeImages ?? true
);

htmlContent = enhancement.enhancedContent;

// 6. Save with metadata
await updateContentCalendarItem(calendarItemId, {
  status: 'generated',
  contentId: savedContent.id,
  internalLinks: enhancement.internalLinks,
  affiliateLinks: enhancement.affiliateLinks,
  images: enhancement.images,
  metadata: {
    template: template.intent,
    wordCount: htmlContent.split(/\s+/).length,
    enhancementStats: {
      internalLinks: enhancement.internalLinks.length,
      affiliateLinks: enhancement.affiliateLinks.length,
      images: enhancement.images.length,
    },
  },
});
```

---

## 8. Testing

### Test Content Generation

```bash
# Test de nieuwe content generator
curl -X POST http://localhost:3000/api/admin/wordpress-autopilot/generate-content \
  -H "Content-Type: application/json" \
  -d '{
    "calendarItemId": "your-calendar-item-id"
  }'
```

### Test Settings Update

```bash
# Update content regels
curl -X PUT http://localhost:3000/api/admin/wordpress-autopilot/settings \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "your-site-id",
    "settings": {
      "toneOfVoice": "professioneel en vriendelijk",
      "dosAndDonts": {
        "dos": ["Gebruik voorbeelden", "Wees praktisch"],
        "donts": ["Geen jargon", "Geen lange zinnen"]
      }
    }
  }'
```

---

## 9. Migration

Run de database migration:

```bash
# Apply Supabase migration
supabase db push
```

Of via SQL:

```sql
-- Run the migration file
\i supabase/migrations/20241216120000_autopilot_content_features.sql
```

---

## 10. Best Practices

### Content Regels

1. **Specifiek zijn** - Vage regels leiden tot vage content
2. **Voorbeelden geven** - Toon wat je WEL en NIET wilt
3. **Target audience** - Hoe specifieker, hoe beter de match

### Internal Links

1. **Kwaliteit > Kwantiteit** - 3-5 relevante links zijn beter dan 10 slechte
2. **Natuurlijke plaatsing** - Geforceerde links schaden UX
3. **Goede anchor teksten** - Beschrijvend en klikbaar

### Affiliate Links

1. **Relevantie first** - Alleen links die echt waarde toevoegen
2. **Transparantie** - Disclosure is verplicht
3. **Niet overdrijven** - Max 2-3 per artikel

### Afbeeldingen

1. **Contextueel** - Afbeeldingen moeten content ondersteunen
2. **Alt teksten** - Altijd SEO-vriendelijk
3. **Responsive** - Zorg voor goede mobile experience

---

## 11. Troubleshooting

### Content wordt niet gegenereerd
- Check credits
- Verificeer WordPress credentials
- Check logs in console

### Interne links worden niet gevonden
- Zorg dat er bestaande gepubliceerde content is
- Check dat `publishedUrl` veld is ingevuld

### Affiliate links werken niet
- Verifieer dat affiliate links in database staan
- Check relevantie van topic

---

## Files Overzicht

```
lib/wordpress-autopilot/
├── types.ts                          # Updated met nieuwe interfaces
├── content-intent-templates.ts       # NEW: Templates en prompt builder
├── content-enhancers.ts              # NEW: Links en afbeeldingen
├── topical-authority-generator.ts    # Updated: auto-detect intent
├── database.ts                        # Bestaand
└── ADVANCED_FEATURES.md              # Deze documentatie

app/api/admin/wordpress-autopilot/
├── generate-content/route.ts         # Updated: nieuwe generator
└── settings/route.ts                 # NEW: Settings API

supabase/migrations/
└── 20241216120000_autopilot_content_features.sql  # NEW: Schema updates
```

---

## Conclusie

Het WordPress Autopilot systeem is nu volledig uitgerust met geavanceerde content features die automatisch hoogwaardige, SEO-geoptimaliseerde content genereren met:

✅ **Content Regels** - Brand consistency
✅ **Content Intent** - Juiste format per topic
✅ **Interne Links** - SEO boost  
✅ **Affiliate Links** - Monetizatie
✅ **Afbeeldingen** - Visuele appeal

Het systeem is **intelligent**, **flexibel** en **schaalbaar**.
