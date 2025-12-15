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
