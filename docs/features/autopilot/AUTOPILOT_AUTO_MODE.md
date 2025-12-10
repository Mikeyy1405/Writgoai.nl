
# Autopilot Auto Mode - Volledig Automatische Content Generatie

## 📋 Overzicht

De Autopilot is nu volledig automatisch! Alle instellingen worden automatisch bepaald op basis van concurrentieanalyse in Google. Geen handmatige configuratie meer nodig - alleen selecteren en starten.

## 🔧 Wat is Veranderd?

### UI Vereenvoudiging
- ✅ **Model selector verwijderd** - Gebruikt altijd Claude Sonnet 4.5 voor hoogwaardige SEO content
- ✅ **Tone of voice selector verwijderd** - Gebruikt automatisch de tone of voice uit projectinstellingen
- ✅ **Lengte selector verwijderd** - Bepaalt automatisch de optimale lengte op basis van top 10 Google concurrenten
- ✅ **Link display type geforceerd** - Gebruikt ALLEEN textuele anchor links (geen product boxes) om layoutproblemen te voorkomen

### Automatische Instellingen

#### 1. AI Model
- **Vast:** Claude Sonnet 4.5
- **Waarom:** Beste balans tussen kwaliteit en snelheid voor SEO-geoptimaliseerde content

#### 2. Artikel Lengte
- **Bron:** Automatische analyse van top 10 Google resultaten voor het keyword
- **Logica:** Match of overtref de gemiddelde lengte van concurrenten
- **Fallback:** 1500 woorden als concurrent data niet beschikbaar is

#### 3. Tone of Voice
- **Bron:** Automatisch uit client/project tone of voice instellingen
- **Fallback:** Professional tone als geen custom tone is ingesteld

#### 4. Link Display Type
- **Vast:** Text-only (textuele anchor links)
- **Waarom:** Product boxes kunnen layout issues veroorzaken in WordPress themes
- **Effect:** Bol.com producten worden toegevoegd als nette contextuele tekstlinks

#### 5. SEO Elementen
**Automatisch ingeschakeld:**
- ✅ FAQ sectie (Schema.org markup)
- ✅ Direct Answer box voor featured snippets
- ✅ Featured image generatie (16:9)
- ✅ Internal links van sitemap (als beschikbaar)
- ✅ Keyword optimalisatie
- ✅ Meta description
- ✅ Schema markup

## 🚀 Hoe het Werkt

### Generatie Pipeline

1. **Keyword Research** - Analyseert search volume en difficulty
2. **Competitor Analysis** - Scrapet top 10 Google resultaten
3. **Content Structure** - Bepaalt H2/H3 structuur op basis van concurrenten
4. **Length Optimization** - Past doellengte aan op basis van concurrent gemiddeldes
5. **Content Generation** - Schrijft met Claude Sonnet 4.5
6. **SEO Enhancement** - Voegt FAQ, direct answer, internal links toe
7. **Product Integration** - Voegt contextuele Bol.com links toe (als enabled)
8. **WordPress Publishing** - Publiceert direct naar WordPress (als enabled)

## 💡 Gebruikerservaring

### Voor de Gebruiker
1. Selecteer een project
2. Vink artikelen aan die gegenereerd moeten worden
3. Optioneel: Toggle Bol.com producten / afbeeldingen
4. Klik "Nu starten" of "Plan Autopilot"
5. De rest gaat automatisch!

## 🔗 Link Display - Text-Only

### Waarom Text-Only?

Product boxes kunnen problemen veroorzaken met:
- WordPress theme layouts
- Responsive design
- Custom CSS conflicten
- Core Web Vitals (CLS)

### Voordelen
- ✅ Geen layout conflicts
- ✅ Betere mobile experience
- ✅ Snellere pagina laadtijd
- ✅ Natuurlijkere content flow
- ✅ Werkt met alle WordPress themes

## 📊 Credit Kosten

Zelfde als Writgo Writer:
- **Blog Post:** 50 credits
- Inclusief: competitor analysis, keyword research, image search, product finding

## 🎯 Resultaat

De Autopilot is nu:
- **Simpeler:** Geen verwarrende instellingen meer
- **Slimmer:** Automatische optimalisatie per keyword
- **Betrouwbaarder:** Consistente kwaliteit
- **Veiliger:** Geen layout issues door text-only links
- **Beter voor SEO:** Altijd matched of overtreft concurrenten
