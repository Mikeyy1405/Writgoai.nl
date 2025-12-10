
# 🤖 Automatische Blog Generator

## ✨ Overzicht

De WritgoAI agent kan nu **volledig automatisch blogs genereren** met AI/ML! Geen handmatige stappen, geen vragen - gewoon één commando en de AI doet de rest.

## 🚀 Hoe te gebruiken

### Basis gebruik
```
Schrijf een nieuwe blog voor https://website.nl van 800 woorden
```

### Met affiliate link
```
Schrijf een nieuwe blog voor https://website.nl van 1000 woorden. Gebruik deze affiliate link: https://website.nl/actie
```

### Variaties die werken
- "Maak een blog voor https://..."
- "Genereer een artikel voor https://..."
- "Schrijf een nieuwe blog..."

## 🔄 Volledig Automatische Workflow

De AI agent voert **automatisch** deze 6 stappen uit:

### 📊 Stap 1: Website Scrapen & Analyseren
- Scrapet homepage + alle subpagina's
- Begrijpt wat voor bedrijf het is
- Maakt lijst van bestaande content/blogs
- Identificeert alle interne pagina's
- Analyseert doelgroep, tone of voice, diensten

### 💡 Stap 2: Kies NIEUW Onderwerp
- Bedenkt 7 relevante onderwerpen
- Checkt of elk onderwerp al bestaat
- Kiest beste onderwerp dat NIET op site staat
- Gebruikt web search voor actuele trends
- Focus op:
  - Praktische handleidingen
  - Kosten/prijzen vergelijkingen
  - Tips & tricks
  - Veelgestelde vragen
  - Lokale SEO (indien relevant)

### 📸 Stap 3: Verzamel Afbeeldingen
- Zoekt **6-8 hoogwaardige afbeeldingen**
- ALLEEN van Pexels en Unsplash
- Automatische alt-tekst generatie
- Landscape oriëntatie

### 🔗 Stap 4: Identificeer Interne Links
- Vindt 3-5 relevante pagina's van de website
- Diensten, contact, over ons, andere blogs
- Genereert natuurlijke anchor teksten

### ✍️ Stap 5: Schrijf Blog met AI/ML
- Gebruikt geavanceerde AIML API (GPT-4o)
- Volledig Nederlandse tekst
- Informele tone (je/jij)
- Korte alinea's (max 3-4 zinnen)
- Unieke headings
- SEO geoptimaliseerd

### 💾 Stap 6: Opslaan & Samenvatting
- Slaat blog op als `/home/ubuntu/[onderwerp]_blog.md`
- Geeft complete samenvatting met:
  - Gekozen onderwerp + reden
  - Aantal woorden
  - Aantal afbeeldingen
  - Aantal interne links
  - Checklist

## 📋 Blog Format

```markdown
---
**SEO Title:** [50-60 tekens met zoekwoord]
**Meta Description:** [120-155 tekens met CTA]
---

# [H1 Hoofdtitel]

[Intro 2-3 zinnen]

![Alt-tekst](afbeelding-url)

## [H2 Sectie 1]
[Content met praktische info]
[Interne link naar relevante pagina]

![Alt-tekst](afbeelding-url)

## [H2 Sectie 2]
[Content met tips]

## Veelgestelde vragen

**Vraag 1?**
Antwoord 1.

**Vraag 2?**
Antwoord 2.

## Conclusie
[Samenvattende alinea met CTA]
[Laatste interne links]
```

## ✅ Schrijfregels (automatisch toegepast)

- ✅ Nederlands, informeel (je/jij)
- ✅ Korte alinea's (max 3-4 zinnen)
- ✅ Praktische tips en voorbeelden
- ✅ 3-5 interne links natuurlijk verwerkt
- ✅ Vette tekst voor belangrijke woorden
- ✅ Headings: alleen eerste letter hoofdletter
- ✅ Unieke headings (geen duplicaten)
- ✅ Lokale focus indien relevant
- ✅ 6-8 afbeeldingen van Pexels/Unsplash
- ✅ SEO metadata compleet

## ❌ Wat de AI NIET doet

- ❌ Bestaande onderwerpen gebruiken
- ❌ Vragen stellen aan gebruiker
- ❌ Lange paragrafen
- ❌ "In deze blog..." zinnen
- ❌ Andere afbeelding bronnen dan Pexels/Unsplash
- ❌ Geforceerde links

## 🎯 Gebruik Cases

### 1. Content Marketing Bureau
```
Schrijf een nieuwe blog voor https://contentbureau.nl van 1200 woorden
```

### 2. Lokaal Bedrijf
```
Maak een blog voor https://loodgieter-amsterdam.nl van 800 woorden
```

### 3. E-commerce met Affiliate
```
Schrijf een nieuwe blog voor https://techshop.nl van 1000 woorden. Gebruik deze affiliate link: https://shop.nl/deal
```

### 4. Dienstverlener
```
Genereer een artikel voor https://webdesigner.nl van 900 woorden
```

## 📊 Voorbeeld Output

```
# ✅ Blog Succesvol Gegenereerd!

## 📋 Samenvatting

**Onderwerp:** 10 Tips voor het Kiezen van de Juiste SEO Partner  
**Waarom gekozen:** Helpt doelgroep met belangrijke beslissing, veel zoekvolume  
**Aantal woorden:** 1247 woorden  
**Afbeeldingen:** 8 (van Pexels/Unsplash)  
**Interne links:** 4  
**Status:** ✅ NIEUW onderwerp (staat niet op website)

**Bestand:** `/home/ubuntu/seo-partner-kiezen_blog.md`

## 📊 Checklist

- ✅ Website volledig gescraped
- ✅ Onderwerp is NIEUW (staat niet op site)
- ✅ 8 afbeeldingen van Pexels/Unsplash
- ✅ Alle afbeeldingen hebben alt-tekst
- ✅ 4 interne links natuurlijk verwerkt
- ✅ SEO metadata compleet
- ✅ Headings zijn uniek
- ✅ Woordenaantal correct (±50 woorden)
- ✅ Korte alinea's, praktische waarde
- ✅ Nederlandse taal, informele tone

🎉 **Klaar voor gebruik!**
```

## 🔧 Technische Details

### API Endpoints
- **POST** `/api/ai-agent/generate-blog`
  - Body: `{ websiteUrl, wordCount, affiliateLink? }`
  - Returns: Complete blog + metadata

### Libraries Gebruikt
- `lib/ai-blog-generator.ts` - Hoofdlogica
- `lib/website-scanner.ts` - Website analyse
- AIML API (GPT-4o) - Content generatie
- Pexels API - Afbeeldingen
- Unsplash API - Afbeeldingen

### AI Models
- **Website Analyse**: GPT-4o (diepgaande analyse)
- **Onderwerp Selectie**: GPT-4o (creativiteit)
- **Blog Schrijven**: GPT-4o (lange-form content)

## 🎨 Waar te Gebruiken

1. **WritgoAI Chat** - WritgoAI.nl/client-portal
2. Type je vraag in de chat
3. De AI herkent automatisch blog verzoeken
4. Voortgang wordt real-time getoond
5. Blog wordt opgeslagen en samenvatting getoond

## ⚡ Performance

- **Gemiddelde tijd**: 30-60 seconden
- **Scraping**: 5-10 seconden
- **Onderwerp kiezen**: 5-10 seconden
- **Afbeeldingen**: 5-10 seconden
- **Blog schrijven**: 15-30 seconden
- **Opslaan**: 1 seconde

## 🆘 Troubleshooting

### "Geen website URL gevonden"
➡️ Zorg dat je URL voluit schrijft: `https://website.nl`

### "Blog generatie mislukt"
➡️ Check of website bereikbaar is
➡️ Probeer opnieuw met andere woordenaantal

### "Te weinig afbeeldingen"
➡️ Pexels/Unsplash API rate limits
➡️ Wacht even en probeer opnieuw

## 🚀 Toekomstige Verbeteringen

- [ ] Direct publiceren naar WordPress
- [ ] SEO score berekening
- [ ] Automatische header image generatie
- [ ] Multi-language support
- [ ] Custom writing styles per client
- [ ] Bulk blog generatie (5+ blogs tegelijk)

---

**Gemaakt door WritgoAI** 🤖
*Automatische content generatie op zijn best!*
