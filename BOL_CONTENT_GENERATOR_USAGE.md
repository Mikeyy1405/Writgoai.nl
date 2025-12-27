# Bol.com Content Generator - Gebruikshandleiding

## Overzicht

De Bol.com Content Generator maakt uitgebreide productartikelen in het formaat van het Kérastase voorbeeld. Dit genereert professionele productreviews met specificaties, voor- en nadelen, koopgids, FAQ en meer.

## Functies

- ✅ Automatische product search via Bol.com API
- ✅ AI-gegenereerde productreviews met specificaties
- ✅ Voor- en nadelen per product
- ✅ Uitgebreide koopgids
- ✅ FAQ sectie met veelgestelde vragen
- ✅ Automatische affiliate links
- ✅ Volledig geformatteerde HTML output
- ✅ SEO-geoptimaliseerde content

## Artikel Structuur

Het gegenereerde artikel bevat:

1. **Introductie** (150-200 woorden)
   - Waarom het product belangrijk is
   - Preview van de content

2. **Topkeuze Highlight**
   - Prominente presentatie van het best beoordeelde product
   - Directe link naar Bol.com

3. **Product Reviews** (5-10 producten)
   - Ranking (#1, #2, etc.)
   - Productafbeelding
   - Prijs en rating
   - Specificaties (inhoud, geschikt voor, effecten, textuur)
   - Praktische ervaring
   - ✅ Pluspunten (4+ items)
   - ❌ Minpunten (2+ items)
   - 🏆 Ons oordeel
   - Affiliate link naar Bol.com

4. **Complete Koopgids**
   - Hoe kies je het juiste product
   - Belangrijke factoren
   - Praktische scenario's
   - Prijs-kwaliteit vergelijking
   - Tips voor optimaal gebruik

5. **FAQ Sectie**
   - 6-8 veelgestelde vragen
   - Met directe antwoorden

6. **Conclusie**
   - Samenvatting
   - Aanbeveling topkeuze
   - Call-to-action

7. **Disclaimer**
   - Affiliate link disclosure

## API Gebruik

### Endpoint

```
POST /api/generate/bol-article
```

### Request Body

```json
{
  "project_id": "your-project-id",
  "search_query": "Kérastase shampoo",
  "product_category": "Kérastase shampoos",
  "product_count": 5
}
```

### Parameters

| Parameter | Type | Required | Beschrijving |
|-----------|------|----------|--------------|
| `project_id` | string | Ja | Het project ID met Bol.com configuratie |
| `search_query` | string | Ja | Zoekterm voor Bol.com producten (bijv. "Kérastase shampoo") |
| `product_category` | string | Ja | Categorie naam voor in de tekst (bijv. "Kérastase shampoos") |
| `product_count` | number | Nee | Aantal producten (3-10, standaard: 5) |

### Response

```json
{
  "success": true,
  "article": {
    "title": "Beste Kérastase shampoos van 2025: Top 5 Getest & Vergeleken",
    "content": "<html content>",
    "excerpt": "Ontdek de beste...",
    "meta_title": "...",
    "meta_description": "...",
    "word_count": 3500
  },
  "metadata": {
    "search_query": "Kérastase shampoo",
    "product_category": "Kérastase shampoos",
    "product_count": 5,
    "generated_at": "2025-01-15T10:30:00Z"
  }
}
```

## Voorbeelden

### Voorbeeld 1: Kérastase Shampoos

```bash
curl -X POST https://writgo.nl/api/generate/bol-article \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "123",
    "search_query": "Kérastase shampoo",
    "product_category": "Kérastase shampoos",
    "product_count": 5
  }'
```

### Voorbeeld 2: Elektrische Tandenborstels

```bash
curl -X POST https://writgo.nl/api/generate/bol-article \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "123",
    "search_query": "elektrische tandenborstel",
    "product_category": "elektrische tandenborstels",
    "product_count": 7
  }'
```

### Voorbeeld 3: Koffiezetapparaten

```bash
curl -X POST https://writgo.nl/api/generate/bol-article \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "123",
    "search_query": "koffiezetapparaat",
    "product_category": "koffiezetapparaten",
    "product_count": 5
  }'
```

## Configuratie

### Vereiste Bol.com Instellingen

Om deze generator te gebruiken moet je project geconfigureerd zijn met:

1. **Bol.com API Credentials**
   - Client ID
   - Client Secret
   - Ga naar: Project Settings > Affiliates > Bol.com

2. **Bol.com Site Code**
   - Voor het genereren van affiliate links
   - Verkrijgbaar via Bol.com Partner Programma

### Database Setup

De configuratie wordt opgeslagen in de `project_affiliates` tabel:

```sql
{
  project_id: "your-project-id",
  platform: "bol.com",
  is_active: true,
  client_id: "your-client-id",
  client_secret: "your-client-secret",
  site_code: "your-site-code"
}
```

## Best Practices

### Zoektermen

- Gebruik specifieke merknamen voor betere resultaten
- Gebruik meervoud voor categorieën ("shampoos" niet "shampoo")
- Test verschillende varianten om de beste producten te vinden

### Product Count

- **3-4 producten**: Voor niche producten of korte vergelijkingen
- **5 producten**: Standaard, goede balans (aanbevolen)
- **7-10 producten**: Voor uitgebreide categorie overzichten

### Content Kwaliteit

De generator:
- Gebruikt AI voor unieke, menselijke reviews
- Haalt echte productdata van Bol.com
- Genereert SEO-geoptimaliseerde content
- Voegt automatisch affiliate links toe
- Maakt visueel aantrekkelijke HTML

## Error Handling

### Veelvoorkomende Errors

| Error | Oorzaak | Oplossing |
|-------|---------|-----------|
| `Bol.com affiliate not configured` | Geen API credentials | Voeg Bol.com credentials toe in project settings |
| `No products found` | Geen zoekresultaten | Probeer andere zoektermen |
| `product_count must be between 3 and 10` | Ongeldige waarde | Gebruik 3-10 voor product_count |
| `Bol.com API authentication failed` | Verkeerde credentials | Controleer client_id en client_secret |

## Technische Details

### Implementatie

- **Generator**: `/lib/bol-content-generator.ts`
- **API Route**: `/app/api/generate/bol-article/route.ts`
- **Bol Client**: `/lib/bol-client.ts`

### Tijdsduur

- Gemiddeld: 30-60 seconden per artikel
- Afhankelijk van aantal producten en AI response tijd
- Max timeout: 5 minuten (300 seconden)

### Output

- Gemiddeld: 2500-4000 woorden
- Volledig geformatteerde HTML
- Klaar voor publicatie
- SEO metadata inbegrepen

## Support

Voor vragen of problemen:
- Check de API response voor error details
- Controleer Bol.com API credentials
- Verifieer dat producten beschikbaar zijn voor zoekterm
- Test met verschillende zoektermen

## Changelog

### Versie 1.0 (Januari 2025)
- Initiële release
- Kérastase format implementatie
- Uitgebreide productreviews
- Koopgids en FAQ generatie
- Volledige Bol.com integratie
