
# Content Types Integratie - Keyword Research → Blog Generator

## Overzicht
Volledige integratie tussen de Keyword Research & Content Planning tool en de Blog Generator, met ondersteuning voor verschillende content types en pre-filling van formuliervelden.

## Wijzigingen

### 1. Content Research Pagina (`/client-portal/content-research`)

#### Nieuwe Features:
- **"Terug naar overzicht" knop** - Rechtsboven in de header voor snelle navigatie terug naar het client portal overzicht
- **"Nu Schrijven" knop** - Bij elk content idee voor directe overgang naar de blog generator

#### URL Parameters die worden doorgegeven:
```
/client-portal/blog-generator?
  from=research
  &title=[artikel titel]
  &keyword=[hoofd keyword]
  &keywords=[secundaire keywords, komma-gescheiden]
  &contentType=[guide|listicle|howto|review|comparison|news|opinion|commercial]
  &priority=[high|medium|low]
  &searchIntent=[informational|transactional|commercial|navigational]
  &projectId=[project ID indien beschikbaar]
```

### 2. Blog Generator Pagina (`/client-portal/blog-generator`)

#### Pre-filling Functionaliteit:
Wanneer de gebruiker vanaf keyword research komt (`from=research`):
- **Topic** wordt automatisch ingevuld met de artikel titel
- **Keywords** worden automatisch ingevuld (hoofd + secundaire keywords)
- **Content Type** wordt automatisch geselecteerd op basis van mapping
- **Project ID** wordt automatisch geselecteerd indien beschikbaar
- **Succes melding** verschijnt na het laden

#### Content Type Mapping:
| Keyword Research Type | Blog Generator Type | Extra Instellingen |
|-----------------------|---------------------|-------------------|
| guide | blog | - |
| listicle | top-list | - |
| howto | blog | - |
| review | product-review | - |
| comparison | product-review | reviewType: 'comparison' |
| news | blog | - |
| opinion | blog | - |
| commercial | product-review | - |

### 3. API Route Verbeteringen (`/api/ai-agent/generate-blog`)

#### Specifieke Content Type Instructies:

**LISTICLE Format:**
- Titel moet aantal items bevatten (bijv. "Top 5 beste...")
- Elk item heeft: `<h2>#[nummer] [Item naam]</h2>` + 2-3 alinea's uitleg
- Genummerde structuur met gelijkwaardige items
- Afbeelding per item

**HOW-TO Format:**
- Titel begint met "Hoe..." of "How to..."
- Structuur: Intro → Benodigdheden → Stap-voor-stap → Tips → Conclusie
- Actiegerichte, sequentiële stappen
- Waarschuwingen in `<blockquote>`

**GUIDE Format:**
- Uitgebreide, diepgaande content
- Structuur: Basis → Gevorderd → Fouten → Best Practices
- Educatief en informatief
- Gebruik van voorbeelden en scenario's

#### Verboden Woorden
Alle prompts bevatten strikte instructies om verboden woorden te vermijden:
- Clichés zoals "wereld van", "cruciaal", "essentieel"
- AI-achtige formuleringen
- Overdreven superlatieve
- Zie `lib/banned-words.ts` voor volledige lijst

### 4. Blog Stijl Richtlijnen

**Voor 100% Human Score:**
✅ Conversationeel op B1-niveau (toegankelijk)
✅ 'je/jij' vorm met persoonlijke voorbeelden
✅ Gevarieerde zinslengtes (kort, middel, lang)
✅ Natuurlijke overgangen en spreektaal
✅ Concrete voorbeelden zonder mensen
✅ Emotionele woorden die betrokkenheid tonen

**Hoofdletters in Titels:**
✅ GOED: "Hoe werkt kunstmatige intelligentie in marketing?"
❌ FOUT: "Hoe Werkt Kunstmatige Intelligentie In Marketing?"

**Opmaak Elementen:**
- Minimaal 2-3 opsommingslijsten (`<ul><li>`)
- Blockquotes voor belangrijke tips (`<blockquote>`)
- Strong tags voor belangrijke punten (max 2-3 per paragraaf)
- Tables voor data/vergelijkingen waar relevant
- Afbeeldingen logisch verspreid door de tekst

## Technische Details

### Frontend
- **React hooks**: `useEffect` voor URL parameter parsing
- **URL parsing**: `URLSearchParams` voor query string handling
- **Navigation**: Next.js `Link` component voor client-side routing
- **State management**: Pre-filling van alle relevante form states

### Backend
- **Content type detectie**: Automatische detectie via topic analysis
- **Dynamic prompts**: Context-aware instructies per content type
- **Banned words**: Strikte filtering en validatie
- **SEO optimalisatie**: Geïntegreerd in alle content types

### Database
Geen database wijzigingen vereist - alle functionaliteit is frontend/backend logica.

## User Flow

1. **Keyword Research**
   - Gebruiker voert URL/keyword in
   - Systeem genereert 30-50 content ideeën met types
   - Elk idee heeft "Nu Schrijven" knop

2. **Navigatie naar Blog Generator**
   - Gebruiker klikt "Nu Schrijven"
   - Browser navigeert met URL parameters
   - Form wordt automatisch ingevuld

3. **Content Generatie**
   - Gebruiker past aan indien nodig
   - Klikt "Genereer Content"
   - Systeem gebruikt juiste prompt voor content type
   - Content wordt gegenereerd met verboden woorden filter

## Testing

Getest op WritgoAI.nl met:
- ✅ URL parameter parsing en pre-filling
- ✅ Content type mapping (alle 8 types)
- ✅ "Terug naar overzicht" knop werkt
- ✅ "Nu Schrijven" knop werkt per content idee
- ✅ Listicle format instructies
- ✅ How-to format instructies
- ✅ Guide format instructies
- ✅ Verboden woorden filter actief

## Live op WritgoAI.nl

Alle wijzigingen zijn live en beschikbaar op:
- **Content Research**: https://WritgoAI.nl/client-portal/content-research
- **Blog Generator**: https://WritgoAI.nl/client-portal/blog-generator

## Volgende Stappen

Mogelijke toekomstige verbeteringen:
- [ ] Opslaan van draft content vanuit keyword research
- [ ] Bulkgeneratie van meerdere content ideeën tegelijk
- [ ] Template opslaan per content type
- [ ] Automatisch publiceren naar WordPress
- [ ] A/B testing van verschillende content types

## Credits Gebruik

Geen extra credits - gebruikt dezelfde BLOG_POST cost (50 credits) als normale blog generatie.

---

**Gedocumenteerd op**: 1 november 2024
**Status**: ✅ Live op productie
**Versie**: 1.0.0
