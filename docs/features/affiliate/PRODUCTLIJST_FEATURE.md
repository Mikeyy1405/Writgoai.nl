
# 🛍️ Productlijst Feature voor "Beste" Artikelen

## Overzicht

De Autopilot genereert nu automatisch **professionele productlijsten** met genummerde items, afbeeldingen, voor- en nadelen wanneer het onderwerp begint met "beste" of "top".

## ✨ Features

### Automatische Detectie
- Detecteert "beste [product]" of "top 5 [product]" titels
- Schakelt automatisch naar productlijst mode
- Haalt meer producten op (5 in plaats van 3)

### Professionele Presentatie
Elke product bevat:
1. **Genummerd item** met moderne badge (1, 2, 3, etc.)
2. **Productafbeelding** van Bol.com
3. **Prijs** met prominente weergave
4. **"Bekijk op Bol.com" button** met affiliate link
5. **Omschrijving** (2-3 zinnen)
6. **Voordelen lijst** (✓ groen gekleurd)
7. **Nadelen lijst** (✗ rood gekleurd)

### HTML Structuur
```html
<div style="margin: 40px 0; padding: 30px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 16px; border-left: 6px solid #3b82f6;">
  <!-- Genummerde badge + Productnaam -->
  <div style="display: flex; align-items: center; margin-bottom: 24px;">
    <span style="...badge styling...">1</span>
    <h3>Productnaam</h3>
  </div>
  
  <!-- 2-kolom layout: Afbeelding + Details -->
  <div style="display: grid; grid-template-columns: 280px 1fr; gap: 30px;">
    <!-- Linker kolom: Afbeelding + Button -->
    <div>
      <img src="..." />
      <a href="..." style="...button styling...">Bekijk op Bol.com →</a>
      <p>€99.99</p>
    </div>
    
    <!-- Rechter kolom: Omschrijving + Voor/Nadelen -->
    <div>
      <p>Omschrijving...</p>
      
      <!-- Voor- en Nadelen grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div><!-- Voordelen --></div>
        <div><!-- Nadelen --></div>
      </div>
    </div>
  </div>
</div>
```

## 📂 Gewijzigde Bestanden

### 1. `/app/api/client/autopilot/generate/route.ts`
**Detectie en Data Ophaling:**
```typescript
// Detecteer "beste" of "top" artikelen
const isProductListArticle = /^(beste|top\s*\d*)\s+/i.test(articleIdea.title.trim());

// Haal meer producten op voor productlijsten
const maxProducts = isProductListArticle ? 5 : 3;

// Bewaar volledige product data
let enrichedProducts: any[] = [];
if (isProductListArticle) {
  enrichedProducts = productResult.products;
}

// Geef door aan generateBlog
const htmlContent = await generateBlog(
  articleIdea.title,
  keywords,
  tone,
  brandInfo,
  {
    productList: enrichedProducts.length > 0 ? enrichedProducts : undefined,
    // ... andere opties
  }
);
```

### 2. `/lib/aiml-agent.ts`
**Nieuwe Parameter:**
```typescript
export async function generateBlog(
  topic: string,
  keywords: string[],
  tone: string = 'professioneel',
  brandInfo?: string,
  options?: {
    affiliateLinks?: Array<{...}>;
    productLinks?: Array<{...}>;
    productList?: Array<any>; // 🛍️ NIEUW: Volledige product data
    targetWordCount?: number;
  }
): Promise<string>
```

**Product List Sectie:**
- Voegt gedetailleerde HTML template toe aan AI prompt
- Bevat exacte styling voor professionele weergave
- Instructies voor H2 heading: "De beste [keyword] van 2025"
- Product data met afbeeldingen, prijzen, voor/nadelen
- Plaatsing direct NA intro, voor rest van artikel

## 🎯 Gebruik

### Voorbeelden van Detectie

**✅ Deze titels worden gedetecteerd:**
- "Beste waterfilter voor thuis"
- "Top 5 stofzuigers voor huisdieren"
- "Beste laptops 2025"
- "Top printers onder €200"

**❌ Deze titels worden NIET gedetecteerd:**
- "Waarom een waterfilter belangrijk is"
- "Tips voor printen"
- "Hoe kies je een stofzuiger"

### Automatisch Proces

1. **Autopilot start** → Detecteert "beste waterfilter" titel
2. **Bol.com API** → Zoekt 5 beste waterfilters
3. **AI Analyse** → Genereert voor/nadelen per product
4. **Blog Generator** → Maakt professionele productlijst
5. **Publicatie** → Volledig artikel met productlijst

### Artikel Structuur

```
[INTRO - 1-2 paragrafen]

<h2>De beste waterfilters van 2025</h2>

[PRODUCT 1 - met afbeelding, prijs, voor/nadelen]
[PRODUCT 2 - met afbeelding, prijs, voor/nadelen]
[PRODUCT 3 - met afbeelding, prijs, voor/nadelen]
[PRODUCT 4 - met afbeelding, prijs, voor/nadelen]
[PRODUCT 5 - met afbeelding, prijs, voor/nadelen]

<h2>Koopgids: Waar op letten bij een waterfilter</h2>
[Rest van artikel...]

<h2>Veelgestelde vragen</h2>
[FAQ sectie...]

<h2>Conclusie</h2>
[Afsluiting...]
```

## 🎨 Styling Features

### Badges
- Cirkel met gradient achtergrond (blauw)
- Witte tekst, groot en vetgedrukt
- Schaduw effect voor diepte
- Nummer gecentreerd

### Product Kaarten
- Gradient achtergrond (lichtblauw)
- Afgeronde hoeken (16px)
- Blauw accent aan linkerkant (6px)
- Ruime padding en witruimte

### Buttons
- Gradient blauw
- Vetgedrukte tekst
- Schaduw effect
- Pijl icoon (→)
- Hover effect

### Voor/Nadelen
- Twee kolommen naast elkaar
- Witte achtergrond kaarten
- Groene accent voor voordelen (✓)
- Rode accent voor nadelen (✗)
- Bullet lists voor overzicht

## 🔧 Technische Details

### Product Data
Elke product bevat:
```typescript
{
  title: string;           // Productnaam
  image: {
    url: string;          // Afbeelding URL
    width: number;
    height: number;
  };
  price: number;          // Prijs in euro's
  affiliateUrl: string;   // Link met site_id
  summary: string;        // Korte omschrijving
  pros: string[];         // Voordelen
  cons: string[];         // Nadelen
  rating?: number;        // Optioneel
}
```

### API Flow
```
ArticleIdea → 
  Detect "beste/top" → 
    Bol.com API (5 products) → 
      AI Analysis (pros/cons) → 
        Generate Blog (with productList) → 
          HTML Output
```

## 📊 Voorbeeld Output

### Input
- Titel: "Beste waterfilter voor thuis"
- Project met Bol.com credentials
- Autopilot Research mode

### Output
Een volledig artikel met:
- ✅ Intro over waarom een waterfilter belangrijk is
- ✅ H2: "De beste waterfilters van 2025"
- ✅ 5 producten met afbeeldingen, prijzen, voor/nadelen
- ✅ Koopgids sectie
- ✅ FAQ sectie
- ✅ Conclusie met call-to-action

## 🚀 Voordelen

1. **Professioneel uiterlijk** - Modern design zoals https://productpraat.nl
2. **Affiliate optimalisatie** - Duidelijke call-to-actions met affiliate links
3. **SEO vriendelijk** - Gestructureerde data, headings, keywords
4. **Gebruiksvriendelijk** - Overzichtelijke voor/nadelen lijsten
5. **Automatisch** - Geen handmatig werk nodig

## 📝 Opmerkingen

- Werkt alleen met geldige Bol.com project credentials
- Vereist minimaal 3 producten in zoekresultaat
- AI genereert automatisch voor/nadelen op basis van beschikbare data
- Affiliate ID uit project settings wordt gebruikt voor tracking
- Productlijst wordt altijd NA intro geplaatst

## 🔄 Updates

**Versie 1.0** (Datum: Nu)
- Eerste implementatie
- Automatische detectie "beste" en "top" artikelen
- 5 producten met afbeeldingen
- Voor- en nadelen per product
- Professionele HTML styling
- Volledige integratie met Autopilot

---

✅ **Status**: Geïmplementeerd, getest en gedocumenteerd
🚀 **Deployment**: Ready voor productie
📖 **Documentatie**: Compleet
