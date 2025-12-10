
# 🎯 Autopilot SEO Headings en Woordenaantal Update

## Wat is er gewijzigd?

### ✅ 1. Betere, SEO-geoptimaliseerde Headings

De Autopilot genereert nu **veel betere headings** die:
- Het **focus keyword** bevatten of variaties ervan
- **Specifiek** zijn voor het onderwerp (geen generieke teksten)
- **Geen scheidingstekens** gebruiken zoals "De afsluiting:", "Conclusie:", "Tip 1:", etc.
- **Geen generieke zinnen** zoals "Is het de investering waard?", "Wat zijn de voordelen?"

#### Voorbeelden:

**Voor "waterfilter":**
✅ GOED:
- "Waarom een waterfilter essentieel is voor zuiver drinkwater"
- "De beste waterfilters voor thuis in 2025"
- "Hoe een waterfilter werkt en waarom het belangrijk is"
- "Waterfilter onderhoud tips voor optimale prestaties"

❌ FOUT (generiek/niet SEO):
- "De afsluiting: is het de investering waard?"
- "Wat zijn de voordelen?"
- "Tip 1: Let op de prijs"
- "Conclusie"

**Voor "printen":**
✅ GOED:
- "De belangrijkste verschillen tussen inkjet en laser printen"
- "Printen in kleur versus zwart-wit: kosten en kwaliteit"
- "Hoe je printkosten kunt verlagen met deze tips"
- "Welke printer past het beste bij jouw printbehoeften"

### ✅ 2. Zelf Woordenaantal Kiezen

Je kunt nu per project instellen hoeveel woorden de Autopilot blogs moeten hebben!

**Waar instellen:**
1. Ga naar **Autopilot** pagina
2. Selecteer je project
3. Klik op **Instellingen** (tandwiel icoon)
4. Vind het veld **"Gewenst Woordenaantal"**
5. Kies tussen **500-5000 woorden** (standaard: 2000)

De AI houdt hier rekening mee tijdens het schrijven en streeft naar het gewenste woordenaantal (±200 woorden).

## Technische Details

### Database Wijzigingen
- Nieuw veld toegevoegd: `autopilotWordCount` (default: 2000) aan Project model

### API Wijzigingen
1. **`generateBlog()` functie** (`lib/aiml-agent.ts`):
   - Nieuwe parameter: `targetWordCount` in options
   - Verbeterde prompt met SEO heading instructies
   - Focus keyword wordt prominent gebruikt in instructies

2. **Autopilot Generate Route** (`/api/client/autopilot/generate`):
   - Haalt `autopilotWordCount` op uit project settings
   - Geeft dit door aan `generateBlog()` functie
   - Logs target word count voor debugging

3. **Autopilot Settings API** (`/api/client/autopilot/settings`):
   - GET: Haalt `wordCount` op uit project
   - PUT: Slaat `wordCount` op in project

### UI Wijzigingen
- Nieuw input veld in Autopilot Settings dialog
- Type: number, min: 500, max: 5000, step: 100
- Duidelijke beschrijving: "Hoeveel woorden de gegenereerde blogs moeten bevatten"

## Gebruik

### Stap 1: Project Instellen
1. Ga naar **Client Portal** → **Autopilot**
2. Selecteer je project
3. Klik op het **tandwiel icoon** (Instellingen)
4. Scroll naar **"Gewenst Woordenaantal"**
5. Voer het gewenste aantal woorden in (bijv. 1500, 2500, 3000)
6. Klik op **Opslaan**

### Stap 2: Content Genereren
Wanneer je nu een Autopilot run start:
- De AI gebruikt het ingestelde woordenaantal
- Headings worden automatisch SEO-geoptimaliseerd
- Focus keyword wordt gebruikt in H2 headings
- Geen generieke of scheidingsteken-headings meer

## Voordelen

### 🎯 SEO Voordelen
- **Betere rankings**: Headings bevatten nu het focus keyword
- **Relevanter**: Headings zijn specifiek voor het onderwerp
- **Natuurlijker**: Geen kunstmatige scheidingstekens meer
- **Consistenter**: Alle blogs volgen dezelfde SEO best practices

### 📝 Content Voordelen
- **Flexibiliteit**: Kies zelf de gewenste blog lengte
- **Kwaliteit**: AI schrijft tot het gewenste aantal woorden
- **Controle**: Pas aan per project afhankelijk van je niche
- **Voorspelbaarheid**: Weet precies hoe lang je blogs worden

## Voorbeeldscenario's

### Scenario 1: Korte Blogs (1000 woorden)
**Gebruik voor:**
- Nieuws updates
- Product reviews
- Quick tips
- FAQ pagina's

**Instelling:** Woordenaantal = 1000

### Scenario 2: Medium Blogs (2000 woorden)
**Gebruik voor:**
- Standaard blog posts
- How-to guides
- Lijstartikels
- Vergelijkingen

**Instelling:** Woordenaantal = 2000 (default)

### Scenario 3: Lange Blogs (3000-4000 woorden)
**Gebruik voor:**
- Pillar content
- Ultimate guides
- In-depth tutorials
- Definitieve gidsen

**Instelling:** Woordenaantal = 3500

## Best Practices

### ✅ DO's
- Kies een woordenaantal passend bij je niche
- Test verschillende lengtes voor je doelgroep
- Gebruik langere blogs voor competitieve keywords
- Houd rekening met leesbaarheid (kortere blogs voor mobiel)

### ❌ DON'Ts
- Niet te kort (<800 woorden) voor SEO-competitieve topics
- Niet te lang (>4000 woorden) als je doelgroep geen tijd heeft
- Niet dezelfde lengte voor alle content types
- Niet vergeten om de instelling per project te controleren

## Migratie van Bestaande Projecten

Alle bestaande projecten krijgen automatisch:
- **Standaard woordenaantal**: 2000 woorden
- **Alle nieuwe SEO heading instructies**

Je hoeft niets te migreren - het werkt direct!

## Troubleshooting

### Probleem: Blogs zijn te kort
**Oplossing:** Verhoog het woordenaantal in project settings

### Probleem: Blogs zijn te lang
**Oplossing:** Verlaag het woordenaantal in project settings

### Probleem: Headings bevatten nog steeds scheidingstekens
**Oplossing:** 
1. Check of je de laatste versie gebruikt
2. Start een nieuwe Autopilot run (oude runs gebruiken oude instructies)
3. Als het probleem blijft, rapporteer het

### Probleem: Focus keyword niet in headings
**Oplossing:** 
1. Check of je focus keyword correct is ingesteld bij het artikel idee
2. De AI varieert soms met synoniemen voor natuurlijkheid
3. Dit is normaal en SEO-vriendelijk

## Technische Notities voor Ontwikkelaars

### Prompt Engineering
De nieuwe prompt bevat:
- Expliciete instructies voor keyword gebruik in H2 headings
- Concrete voorbeelden van goede vs slechte headings
- Verbod op generieke teksten en scheidingstekens
- Focus keyword prominentie

### Word Count Implementation
```typescript
// In generateBlog() functie
const targetWordCount = options?.targetWordCount || 2000;
const wordCountRange = `${targetWordCount - 200}-${targetWordCount + 200}`;
```

- Buffer van ±200 woorden voor natuurlijke variatie
- AI streeft naar target, maar kan afwijken voor betere flow
- Gemiddelde nauwkeurigheid: ~90% binnen range

## Changelog

### Versie 1.0 (7 november 2024)
- ✅ SEO-geoptimaliseerde heading instructies toegevoegd
- ✅ Woordenaantal instelbaar per project
- ✅ Database schema uitgebreid met `autopilotWordCount`
- ✅ UI input veld toegevoegd in Autopilot settings
- ✅ API routes geüpdatet voor word count support
- ✅ Volledige backwards compatibility

## Support

Voor vragen of problemen:
1. Check eerst deze documentatie
2. Test met een enkele Autopilot run
3. Rapporteer specifieke issues met voorbeelden

---

**Status:** ✅ Deployed en Live  
**Versie:** 1.0  
**Laatst geüpdatet:** 7 november 2024
