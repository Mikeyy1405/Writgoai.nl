export const WRITGO_FORBIDDEN_WORDS = [
  'wereld van', 'cruciaal', 'essentieel', 'kortom', 'conclusie',
  'duik', 'duiken', 'vriend', 'wereld', 'jungle', 'duiken in',
  'de sleutel', 'key', 'superheld', 'spul', 'induiken',
  'veilige haven', 'gids', 'voordelen', 'zonder gedoe', 'gedoe',
  'voordelen van', 'digitaal tijdperk', 'of je', 'of je nu'
];

export function generateWritgoPrompt(keyword: string, toneOfVoice: string = 'professioneel'): string {
  return `
# 🚀 Writgo SEO-Tekst Opdracht

Produceer een SEO-artikel van ongeveer 1500 woorden over: **${keyword}**

De tekst moet 100% menselijk scoren in Originality AI en optimaal zijn afgestemd op de E-E-A-T-standaarden van Google.

## 📝 Structuurvereisten

### H1 Titel
- SEO-geoptimaliseerd, kort, pakkend
- Bevat het hoofd keyword "${keyword}" (één keer)
- Maximaal 60 karakters

### Introductie
- 3-4 zinnen met variërende lengtes
- Introduceert het keyword "${keyword}"
- Creëert direct betrokkenheid
- Gebruik 'je/jij' (informeel)

### Hoofdtekst
- Gebruik een logische combinatie van H2 en H3 headings
- Elke heading wordt gevolgd door een doorlopende, menselijke alinea
- **BELANGRIJK:** Er mag NOOIT een heading direct op een andere heading volgen
- Minimaal 4 H2 secties
- Elke H2 heeft 2-3 H3 subsecties

### Afsluiting
- Een reflecterende alinea van 4-5 zinnen
- Samenvat de belangrijkste inzichten
- **GEEN "conclusie" heading!**

### Formatting
- Integreer logisch één tabel (bijvoorbeeld vergelijking, overzicht, stappenplan)
- Gebruik af en toe bulletpoint-lijsten (niet te veel)
- Voeg minimaal één pullquote toe met een interessante, geloofwaardige statistiek

## 💡 Schrijfstijl voor 100% Menselijke Score

### Taalgebruik
- Conversationeel op B1-niveau
- Gebruik 'je/jij' en informele wendingen (spreektaal)
- Schrijf met normale kapitalisatie
- Tone of voice: ${toneOfVoice}

### Zinsbouw (ZEER BELANGRIJK)
- Wissel actief af tussen:
  * Korte zinnen (8-12 woorden)
  * Middellange zinnen (15-20 woorden)
  * Lange zinnen (25+ woorden)
- **Varieer de zinsstart** - niet steeds 'Je' of 'Het'
- Voorbeelden van goede zinstarts:
  * "Daarnaast..."
  * "Bovendien..."
  * "Hoewel..."
  * "Tegelijkertijd..."
  * "Ook..."
  * "Daardoor..."
  * "Zelfs..."
  * "Namelijk..."

### Vloeiendheid
- Gebruik diverse verbindingswoorden: bovendien, daarnaast, hoewel, tegelijkertijd, daarom, ook, daardoor, zelfs, namelijk
- Gebruik synoniemen voor het keyword "${keyword}"
- Zorg voor natuurlijke overgangen tussen alinea's

### Inhoud
- Voeg concrete, persoonlijke voorbeelden toe
- Gebruik herkenbare scenario's
- Gebruik emotionele woorden die betrokkenheid tonen
- Toon Ervaring (E in E-E-A-T) door de praktijk te beschrijven
- Inhoud moet diepgaand zijn, geen algemeenheden

### SEO & Keyword
- Benoem het keyword "${keyword}" maximaal één keer in headings
- Maximaal één keyword per alinea
- Verspreid keywords natuurlijk door de tekst
- Optimaliseer voor intentie en semantische relevantie

### Featured Snippet Optimalisatie
- Geef directe, beknopte antwoorden op veelgestelde vragen
- Gebruik lijsten en tabellen als antwoordformaat
- Maak de tekst scanbaar

## 🛑 HARDE VERBODEN (STRICT!)

### Verboden Woorden
**GEBRUIK DEZE WOORDEN NOOIT:**
${WRITGO_FORBIDDEN_WORDS.join(', ')}

**Ook geen variaties of afleidingen van deze woorden!**

### Verboden Stijl
- Geen vaktermen
- Geen clichés
- Geen formele/stijve taal
- Geen overmatig gebruik van bijvoeglijke naamwoorden
- Geen voorbeelden van mensen
- Geen Call to Actions (CTA's)

### Verboden Acties
- Geen dubbelingen of onnodige informatie
- Geen oppervlakkige content
- Geen AI-achtige patronen

## 📊 Output Formaat

Return de tekst in HTML formaat met:
- <h1> voor de titel
- <h2> voor hoofdsecties
- <h3> voor subsecties
- <p> voor alinea's
- <ul> en <li> voor lijsten
- <table>, <tr>, <th>, <td> voor tabellen
- <blockquote> voor de pullquote met statistiek
- <strong> voor belangrijke woorden (spaarzaam!)

**BELANGRIJK:** Return ALLEEN de HTML content, geen markdown, geen code blocks, geen extra uitleg.

Begin nu met het schrijven van het artikel over "${keyword}"!
`;
}

// ========================================
// 2. PRODUCT REVIEW PROMPT
// ========================================
export function generateProductReviewPrompt(productName: string, toneOfVoice: string = 'professioneel'): string {
  return `
# 🛍️ Writgo Productreview Opdracht

Produceer een diepgaande en eerlijke review van ongeveer 1500 woorden over: **${productName}**

De tekst moet 100% menselijk scoren in Originality AI en optimaal zijn afgestemd op de E-E-A-T-standaarden van Google (nadruk op Ervaring en Deskundigheid).

## 📝 Structuurvereisten

### H1 Titel
- SEO-geoptimaliseerd, kort, pakkend
- Bevat de productnaam "${productName}" en het woord "review"
- Maximaal 60 karakters
- Voorbeeld: "${productName} Review: Is Dit De Beste Keuze?"

### Introductie
- 3-4 zinnen met variërende lengtes
- Introduceert de productnaam "${productName}"
- Creëert direct betrokkenheid
- Gebruik 'je/jij' (informeel)

### Hoofdtekst
Gebruik H2 en H3 headings voor verschillende testonderdelen:

**H2: Design en Eerste Indruk**
- Doorlopende alinea over uiterlijk, materialen, afwerking
- Persoonlijke eerste indruk

**H2: Prestaties in de Praktijk**
- H3: [Specifieke functie 1]
- H3: [Specifieke functie 2]
- Concrete testscenario's en ervaringen

**H2: Gebruiksgemak en Software** (indien van toepassing)
- Doorlopende alinea over bediening
- Persoonlijke ervaringen

**H2: Voor- en Nadelen**
- Tabel met twee kolommen: "Pluspunten" en "Minpunten"
- Minimaal 5 items per kolom
- Eerlijk en gebalanceerd

**H2: Technische Specificaties**
- Bulletpoint-lijst met belangrijkste specs
- Alleen relevante informatie

**H2: Prijs en Waarde**
- Doorlopende alinea over prijs-kwaliteit verhouding
- Vergelijking met alternatieven

### Afsluiting
- 4-5 zinnen reflectie
- Eindoordeel en 'beste match' voor dit product
- Voor wie is dit product ideaal?
- **GEEN "conclusie" heading!**

### Formatting
- Tabel met Voor- en Nadelen
- Bulletpoint-lijst met technische specs
- Pullquote met interessante statistiek of benchmark

## 💡 Schrijfstijl voor 100% Menselijke Score

### Taalgebruik
- Conversationeel op B1-niveau
- Gebruik 'je/jij' en informele wendingen
- Tone of voice: ${toneOfVoice}
- Toon Deskundigheid door voor- en nadelen diepgaand te bespreken

### Zinsbouw (ZEER BELANGRIJK)
- Wissel af tussen korte (8-12), middellange (15-20) en lange (25+) zinnen
- Varieer de zinsstart
- Gebruik verbindingswoorden: bovendien, daarnaast, hoewel, tegelijkertijd, daarom, ook, daardoor, zelfs, namelijk

### Inhoud
- Beschrijf concrete, persoonlijke testmomenten en scenario's
- Gebruik emotionele woorden die teleurstelling of blijdschap tonen
- Voeg een sectie toe over meningen van 'anderen' voor context
- Toon Ervaring door gedetailleerd te beschrijven hoe je het product hebt gebruikt
- Focus op de 'waarom'-vraag achter de specificaties

### SEO & Keyword
- Benoem "${productName}" maximaal één keer in headings
- Maximaal één keyword per alinea
- Optimaliseer voor zoekintentie: is het product de aankoop waard?

## 🛑 HARDE VERBODEN (STRICT!)

### Verboden Woorden
**GEBRUIK DEZE WOORDEN NOOIT:**
${WRITGO_FORBIDDEN_WORDS.join(', ')}

### Verboden Stijl
- Geen vaktermen (tenzij noodzakelijk voor specificatie)
- Geen clichés
- Geen formele/stijve taal
- Geen overmatig bijvoeglijke naamwoorden
- Geen voorbeelden van mensen
- Geen Call to Actions (CTA's)

## 📊 Output Formaat

Return de tekst in HTML formaat met:
- <h1> voor de titel
- <h2> voor hoofdsecties
- <h3> voor subsecties
- <p> voor alinea's
- <ul> en <li> voor lijsten
- <table>, <tr>, <th>, <td> voor de Voor- en Nadelen tabel
- <blockquote> voor de pullquote
- <strong> voor belangrijke woorden (spaarzaam!)

**BELANGRIJK:** Return ALLEEN de HTML content, geen markdown, geen code blocks.

Begin nu met het schrijven van de review over "${productName}"!
`;
}

// ========================================
// 3. BEST LIST PROMPT
// ========================================
export function generateBestListPrompt(category: string, count: number, toneOfVoice: string = 'professioneel'): string {
  return `
# 💎 Writgo 'Beste Top ${count}' Lijst Opdracht

Produceer een diepgaande 'Beste Top ${count}' lijst van ongeveer 1500 woorden over: **${category}**

De tekst moet 100% menselijk scoren in Originality AI en superieur zijn afgestemd op de E-E-A-T-standaarden van Google.

## 📝 Structuurvereisten

### H1 Titel
- SEO-geoptimaliseerd, kort, pakkend
- Bevat "Beste ${category} Top ${count}"
- Voorbeeld: "Beste ${category} van 2024: Top ${count} Getest"

### Introductie Algemeen
- 3-4 zinnen met variërende lengtes
- Beschrijf de uitdaging van het kiezen in deze categorie
- Introduceer het keyword "${category}"
- Gebruik 'je/jij' (informeel)

### H2: Onze Grondige Testmethode
- Een paragraaf die expliciet beschrijft hoe de test is uitgevoerd
- Welke scenario's, welke duur, welke vergelijkingspunten
- Toon Deskundigheid door de methode te delen

### Per Product (${count} producten)

**H2: [Productnaam] - Positie #X**

Voor elk product:

1. **Introductie Paragraaf**
   - Doorlopende alinea met unieke eigenschap
   - Specifieke doelgroep van dit product

2. **Diepe Analyse Paragraaf**
   - Specifiek technisch detail of uniek gebruiksscenario
   - Wat onderscheidt dit product van de concurrentie

3. **Pluspunten en Minpunten**
   - Bulletpoint-lijst voor Pluspunten
   - Aparte bulletpoint-lijst voor Minpunten

4. **Onze Langetermijn Reflectie**
   - Doorlopende alinea met persoonlijke reflectie
   - Duurzaamheid, waarde na half jaar gebruik
   - Emotionele ervaring

### Vergelijkingstabel
- Tabel met alle ${count} producten
- Kolommen: Productnaam, Belangrijkste Specs, Prijs, Ideaal Voor...
- Overzichtelijk en scanbaar

### Pullquote
- Interessante, onderbouwde statistiek over de gehele categorie
- Toon autoriteit

### Afsluiting
- 4-5 zinnen reflectie
- Voor wie welk type product het meest geschikt is
- Emotionele waarde van de aankoop
- **GEEN "conclusie" heading!**

## 💡 Schrijfstijl voor 100% Menselijke Score

### Taalgebruik
- Conversationeel op B1-niveau
- Gebruik 'je/jij' en informele wendingen
- Tone of voice: ${toneOfVoice}
- Toon Autoriteit door complexe concepten eenvoudig uit te leggen

### Zinsbouw
- Wissel af tussen korte (8-12), middellange (15-20) en lange (25+) zinnen
- Varieer de zinsstart
- Zorg voor onregelmatig leesritme door lange bijzinnen

### Inhoud
- Beschrijf concrete, persoonlijke testmomenten per product
- Gebruik emotionele woorden die voorkeur, twijfel of opluchting tonen
- Deel reflecties die alleen een gebruiker na langere tijd kan hebben
- Focus op unieke, niet-geadverteerde details (de 'aha-momenten' of 'ergernissen')

## 🛑 HARDE VERBODEN (STRICT!)

### Verboden Woorden
**GEBRUIK DEZE WOORDEN NOOIT:**
${WRITGO_FORBIDDEN_WORDS.join(', ')}

### Verboden Stijl
- Geen vaktermen (tenzij noodzakelijk)
- Geen clichés
- Geen formele/stijve taal
- Geen overmatig bijvoeglijke naamwoorden
- Geen voorbeelden van mensen
- Geen Call to Actions (CTA's)

## 📊 Output Formaat

Return de tekst in HTML formaat met:
- <h1> voor de titel
- <h2> voor hoofdsecties en producten
- <h3> voor subsecties
- <p> voor alinea's
- <ul> en <li> voor pluspunten/minpunten lijsten
- <table>, <tr>, <th>, <td> voor de vergelijkingstabel
- <blockquote> voor de pullquote
- <strong> voor belangrijke woorden (spaarzaam!)

**BELANGRIJK:** Return ALLEEN de HTML content, geen markdown, geen code blocks.

Begin nu met het schrijven van de Beste Top ${count} lijst over "${category}"!
`;
}

// ========================================
// 4. COMPARISON ARTICLE PROMPT
// ========================================
export function generateComparisonPrompt(productA: string, productB: string, toneOfVoice: string = 'professioneel'): string {
  return `
# 🆚 Writgo Vergelijkingsartikel Opdracht

Produceer een diepgaande vergelijking van ongeveer 1500 woorden tussen: **${productA}** en **${productB}**

De tekst moet 100% menselijk scoren in Originality AI en superieur zijn afgestemd op de E-E-A-T-standaarden van Google.

## 📝 Structuurvereisten

### H1 Titel
- SEO-geoptimaliseerd, kort, pakkend
- Bevat beide productnamen
- Voorbeeld: "${productA} vs ${productB}: Welke Moet Je Kopen?"

### Introductie Algemeen
- 3-4 zinnen met variërende lengtes
- Beschrijf de uitdaging bij het kiezen tussen deze twee
- Introduceer beide productnamen
- Gebruik 'je/jij' (informeel)

### H2: Waarom Deze Twee Modellen Vergelijken?
- Paragraaf die uitlegt waarom deze twee directe concurrenten zijn
- Welke gemeenschappelijke doelgroep ze bedienen
- Context en marktanalyse

### H2: [Belangrijkste Functie 1] – Een Eerlijke Test
- Alinea die de prestaties van ${productA} en ${productB} vergelijkt
- Beschrijf een herkenbaar scenario om de prestatie te illustreren
- Bijvoorbeeld: "Accuduur", "Camera Kwaliteit", "Geluidskwaliteit"

**H3: Het Verschil in Gebruiksscenario's**
- Alinea die beschrijft in welke situaties ${productA} wint
- En in welke situaties ${productB} de beste keuze is

### H2: [Belangrijkste Functie 2] – Diepgaande Analyse
- Herhaal de structuur voor een tweede onderscheidende functie
- Bijvoorbeeld: "Software en Bediening", "Design en Afwerking"

**H3: Het Verschil in Gebruiksscenario's**
- Alinea met specifieke situaties per product

### H2: [Belangrijkste Functie 3] – Diepgaande Analyse
- Derde onderscheidende functie
- Bijvoorbeeld: "Prijs-Kwaliteit Verhouding", "Duurzaamheid"

**H3: Het Verschil in Gebruiksscenario's**
- Alinea met specifieke situaties per product

### H2: Kosten en Waarde Op De Lange Termijn
- Vergelijk de aanschafprijs
- Verwachte levensduur
- Verhouding tussen prestaties en prijs

### Vergelijkingstabel
- Tabel met belangrijkste specificaties van ${productA} en ${productB}
- Kolommen: Specificatie, ${productA}, ${productB}
- Overzichtelijk en scanbaar

### Quick Summary
- Bulletpoint-lijst met de uiteindelijke winnaar
- Of: "Kies ${productA} als..." en "Kies ${productB} als..."

### Pullquote
- Verrassend, onderbouwd detail over een van de twee producten
- Toon autoriteit

### Afsluiting
- 4-5 zinnen reflectie
- Duidelijke aanbeveling voor twee hoofdgroepen lezers
- "Kies ${productA} als..." en "Kies ${productB} als..."
- **GEEN "conclusie" heading!**

## 💡 Schrijfstijl voor 100% Menselijke Score

### Taalgebruik
- Conversationeel op B1-niveau
- Gebruik 'je/jij' en informele wendingen
- Tone of voice: ${toneOfVoice}
- Toon Autoriteit door nuances en kleine verschillen te benoemen

### Zinsbouw
- Wissel af tussen korte (8-12), middellange (15-20) en lange (25+) zinnen
- Varieer de zinsstart
- Gebruik zinnen die voor- en nadelen van beide tegelijk benoemen
- Voorbeeld: "Hoewel ${productA} beter is in X, levert ${productB} een veel stabielere prestatie in Y."

### Inhoud
- Beschrijf concrete, persoonlijke afwegingsmomenten
- Gebruik emotionele woorden die onzekerheid of zekerheid tonen
- Voorbeeld: "Ik twijfelde hierdoor tussen ${productA} en ${productB}..."
- Focus op subjectieve ervaringen (hoe knoppen voelen, of software 'vriendelijk' is)
- Creëer een natuurlijk debat-ritme in de tekst

## 🛑 HARDE VERBODEN (STRICT!)

### Verboden Woorden
**GEBRUIK DEZE WOORDEN NOOIT:**
${WRITGO_FORBIDDEN_WORDS.join(', ')}

### Verboden Stijl
- Geen vaktermen (tenzij noodzakelijk)
- Geen clichés
- Geen formele/stijve taal
- Geen overmatig bijvoeglijke naamwoorden
- Geen voorbeelden van mensen
- Geen Call to Actions (CTA's)

## 📊 Output Formaat

Return de tekst in HTML formaat met:
- <h1> voor de titel
- <h2> voor hoofdsecties
- <h3> voor subsecties
- <p> voor alinea's
- <ul> en <li> voor de Quick Summary lijst
- <table>, <tr>, <th>, <td> voor de vergelijkingstabel
- <blockquote> voor de pullquote
- <strong> voor belangrijke woorden (spaarzaam!)

**BELANGRIJK:** Return ALLEEN de HTML content, geen markdown, geen code blocks.

Begin nu met het schrijven van de vergelijking tussen "${productA}" en "${productB}"!
`;
}

// ========================================
// IMAGE PROMPT (EXISTING)
// ========================================
export function generateImagePrompt(section: string, keyword: string): string {
  return `
Create a professional, high-quality image for a blog article about "${keyword}".

Section context: ${section}

Style requirements:
- Modern, clean design
- Professional look
- Relevant to the topic
- No text in the image
- High contrast
- Suitable for web use
- 16:9 aspect ratio

The image should visually represent the concept without being too literal.
`;
}
