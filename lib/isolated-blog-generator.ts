
/**
 * Isolated Blog Generator
 * Volledig onafhankelijk systeem voor SEO blog generatie
 */

import { chatCompletion } from './aiml-api';
import { MODEL_CATEGORIES } from './smart-model-router';
import { getBannedWordsInstructions, detectBannedWords, removeBannedWords, isContentValid } from './banned-words';
import { loadWordPressSitemap, findRelevantInternalLinks, type SitemapData } from './sitemap-loader';
import { addYouTubeToContent } from './youtube-search';
import { integrateAffiliateLinksWithAI } from './affiliate-link-parser';
import { generateSmartImage } from './smart-image-generator';

export interface BlogGenerationOptions {
  topic: string;
  projectId?: string; // 🎨 Voor image model selection & cost optimization
  keywords?: string[];
  length?: number;
  tone?: 'professional' | 'casual' | 'friendly' | string; // Support custom tone of voice
  customToneOfVoice?: string; // Detailed custom tone of voice instructions
  customInstructions?: string; // Additional custom instructions (SEO, style, etc.)
  includeSEO?: boolean;
  includeImages?: boolean;
  includeYouTube?: boolean; // YouTube video embed optie
  includeFAQ?: boolean; // FAQ sectie toevoegen
  includeDirectAnswer?: boolean; // Direct antwoord met dikgedrukte tekst
  generateFeaturedImage?: boolean; // Generate 16:9 featured image
  includeQuotes?: boolean; // Blockquotes toevoegen (default: true)
  includeTables?: boolean; // Tabellen toevoegen (default: true)
  targetAudience?: string;
  sitemapUrl?: string; // URL voor interne links
  wordpressApiUrl?: string; // WordPress REST API URL
  projectContext?: {
    name: string;
    url?: string;
    description?: string;
    targetKeywords?: string[];
  };
  // Affiliate link integration
  includeAffiliateLinks?: boolean; // Automatisch affiliate links toevoegen
  affiliateLinks?: Array<{
    url: string;
    anchorText: string;
    keywords: string[];
    category?: string;
    description?: string;
  }>;
  affiliateLinkStrategy?: 'natural' | 'aggressive' | 'subtle'; // Hoe agressief links plaatsen
  maxAffiliateLinks?: number; // Maximum aantal affiliate links (default: 8)
}

export interface BlogGenerationResult {
  title: string;
  content: string;
  metaDescription: string;
  keywords: string[];
  readingTime: number;
  seoScore: number;
  suggestions: string[];
  research?: string[];
  featuredImageUrl?: string; // 16:9 featured image
  seoMetadata?: {
    seoTitle: string;
    metaDescription: string;
    focusKeyword: string;
    extraKeywords: string[];
    lsiKeywords: string[]; // Minimaal 20 LSI keywords
  };
  socialMediaPost?: {
    text: string; // Social media post tekst
    imageUrl: string; // Social media afbeelding (1:1 vierkant)
    hashtags: string[]; // Relevante hashtags
  };
}

/**
 * Generate tone of voice instructions based on custom settings
 */
function getToneOfVoiceInstructions(options: BlogGenerationOptions): string {
  // If custom tone of voice is provided, use it
  if (options.customToneOfVoice) {
    return `
TONE OF VOICE (CUSTOM):
${options.customToneOfVoice}

Volg deze instructies nauwkeurig bij het schrijven van de content. Dit is de stem van het merk.
`;
  }
  
  // Otherwise use default tone
  const toneMap: Record<string, string> = {
    professional: 'Professioneel en zakelijk, maar toegankelijk. Gebruik "u" of "je" afhankelijk van de context.',
    casual: 'Casual en vriendelijk. Gebruik "je/jij" en schrijf alsof je een vriend adviseert.',
    friendly: 'Vriendelijk en warm. Persoonlijk en toegankelijk, maar wel professioneel.',
  };
  
  const toneInstructions = toneMap[options.tone || 'professional'] || toneMap.professional;
  
  return `TONE: ${toneInstructions}`;
}

/**
 * Genereer een SEO-geoptimaliseerde blog
 * Deze functie is volledig geïsoleerd en kan niet andere tools beïnvloeden
 */
export async function generateSEOBlog(
  options: BlogGenerationOptions,
  onProgress?: (step: string, progress: number) => void
): Promise<BlogGenerationResult> {
  
  try {
    // STAP 0: Laad sitemap EERST als beschikbaar
    let sitemapData: SitemapData | null = null;
    let relevantLinks: Array<{ title: string; url: string; relevance: number }> = [];
    
    if (options.sitemapUrl) {
      try {
        onProgress?.('📋 Sitemap laden...', 5);
        console.log('🔍 Sitemap laden van:', options.sitemapUrl);
        
        sitemapData = await loadWordPressSitemap(
          options.sitemapUrl,
          options.wordpressApiUrl
        );
        
        console.log(`✅ Sitemap geladen: ${sitemapData.totalPages} pagina's gevonden`);
        
        // Zoek relevante interne links voor dit onderwerp (MEER LINKS)
        relevantLinks = findRelevantInternalLinks(sitemapData, options.topic, 10);
        console.log(`🔗 ${relevantLinks.length} relevante interne links gevonden:`, 
          relevantLinks.map(l => l.title));
        
        onProgress?.('✅ Sitemap geladen', 8);
      } catch (error) {
        console.error('⚠️ Sitemap laden mislukt:', error);
        // Doorgaan zonder sitemap - niet blokkeren
      }
    }
    
    onProgress?.('🔍 Web research starten...', 10);
    
    // STAP 1: Web Research (ALTIJD met web search model)
    const researchPrompt = `
Je bent een expert SEO researcher. Zoek actuele informatie over: ${options.topic}

${options.keywords ? `Focus op deze keywords: ${options.keywords.join(', ')}` : ''}
${options.projectContext ? `Context: ${options.projectContext.description}` : ''}

Geef een uitgebreid overzicht met:
1. Actuele trends en statistieken
2. Veelgestelde vragen
3. Belangrijke feiten
4. Relevante bronnen
5. Gerelateerde onderwerpen

Formaat: Gestructureerd overzicht in het Nederlands
`;

    const researchResponse = await chatCompletion({
      messages: [{ role: 'user', content: researchPrompt }],
      model: MODEL_CATEGORIES.WEB_SEARCH.primary, // gpt-4o-search-preview
      temperature: 0.3,
      max_tokens: 4000
    });
    
    const research = researchResponse.choices[0]?.message?.content || '';
    onProgress?.('✅ Research voltooid', 30);
    
    // STAP 2: SEO Metadata EERST genereren (zodat we focus keyword & LSI keywords kennen)
    onProgress?.('🎯 SEO strategie bepalen...', 40);
    
    const preliminarySeoMetadata = await generateSEOMetadata({
      topic: options.topic,
      content: research, // Gebruik research voor initiële metadata
      keywords: options.keywords || []
    });
    
    const focusKeyword = preliminarySeoMetadata.focusKeyword;
    const lsiKeywords = preliminarySeoMetadata.lsiKeywords;
    
    console.log(`🎯 Focus Keyword: "${focusKeyword}"`);
    console.log(`📊 ${lsiKeywords.length} LSI Keywords: ${lsiKeywords.slice(0, 10).join(', ')}...`);
    
    onProgress?.('✅ SEO strategie klaar', 45);
    
    // STAP 3: Blog structuur maken (met focus keyword)
    onProgress?.('📝 Blog structuur maken...', 50);
    
    const toneInstructions = getToneOfVoiceInstructions(options);
    
    const structurePrompt = `
Op basis van deze research, maak een gedetailleerde blog structuur:

RESEARCH:
${research}

TOPIC: ${options.topic}
LENGTE: ${options.length || 1000} woorden
${toneInstructions}
${options.targetAudience ? `DOELGROEP: ${options.targetAudience}` : ''}
${options.customInstructions ? `\nEXTRA INSTRUCTIES:\n${options.customInstructions}` : ''}

Maak een structuur met:
- Pakkende titel (met keyword)
- Inleiding
- 5-7 secties met H2 headers
- Relevante afsluitende sectie (GEEN "Conclusie", maar specifiek voor het onderwerp)
- Meta description (155 karakters)

🔴🔴🔴 SUPER BELANGRIJK - NEDERLANDSE HOOFDLETTERS 🔴🔴🔴
⚠️⚠️⚠️ DIT IS EEN HARDE EIS - NEGEREN LEIDT TOT AFKEURING ⚠️⚠️⚠️

NEDERLANDSE HOOFDLETTERREGEL (VERPLICHT):
- ALLEEN de allereerste letter van een titel/heading is een hoofdletter
- ALLE andere woorden beginnen met een kleine letter
- Dit geldt voor: H1, H2, H3, FAQ vragen, en alle andere titels
- Dit is NIET zoals Engels waar elk woord een hoofdletter krijgt!

✅ CORRECT (Nederlandse stijl):
- "Jouw reis naar diepe ontspanning begint nu"
- "Hoe werkt kunstmatige intelligentie in marketing?"
- "De voordelen van AI voor kleine bedrijven"
- "Wat zijn de beste tips voor gezond leven?"
- "Waarom je deze producten moet overwegen"

❌ ABSOLUUT FOUT (Engelse stijl - NIET GEBRUIKEN):
- "Jouw Reis Naar Diepe Ontspanning Begint Nu"
- "Hoe Werkt Kunstmatige Intelligentie In Marketing?"
- "De Voordelen Van AI Voor Kleine Bedrijven"
- "Wat Zijn De Beste Tips Voor Gezond Leven?"
- "Waarom Je Deze Producten Moet Overwegen"

BELANGRIJKE REGELS:
- ❌ GEEN headings zoals "Conclusie", "Afsluiting", "Call to Action", "Samenvatting"
- ✅ Gebruik specifieke headings die bij het onderwerp passen
- ✅ Laatste sectie moet natuurlijk aansluiten bij de inhoud
- ✅ ALLE headings moeten Nederlandse schrijfwijze hebben (alleen eerste letter hoofdletter)
- ⚠️ Controleer ELKE titel voordat je deze gebruikt - geen enkele uitzondering toegestaan

Geef alleen de structuur in JSON formaat:
{
  "title": "...",
  "metaDescription": "...",
  "sections": [
    {"heading": "...", "keyPoints": ["...", "..."]}
  ]
}
`;
    
    const structureResponse = await chatCompletion({
      messages: [{ role: 'user', content: structurePrompt }],
      model: MODEL_CATEGORIES.SEO_WRITING.primary, // claude-4.5-sonnet
      temperature: 0.7,
      max_tokens: 2000
    });
    
    const structureText = structureResponse.choices[0]?.message?.content || '{}';
    let structure;
    try {
      // Extract JSON from markdown if needed
      const jsonMatch = structureText.match(/\{[\s\S]*\}/);
      structure = JSON.parse(jsonMatch ? jsonMatch[0] : structureText);
    } catch (e) {
      // Fallback structure
      structure = {
        title: options.topic,
        metaDescription: `Alles over ${options.topic}`,
        sections: [
          { heading: 'Inleiding', keyPoints: [] },
          { heading: 'Wat is belangrijk?', keyPoints: [] },
          { heading: 'Conclusie', keyPoints: [] }
        ]
      };
    }
    
    onProgress?.('✅ Structuur klaar', 60);
    
    // STAP 4: Volledige blog schrijven (met focus keyword & LSI keywords)
    onProgress?.('✍️ Blog schrijven...', 60);
    
    const writingPrompt = `
Je bent een expert SEO content writer die artikelen schrijft die 100% menselijk scoren in Originality AI.

STRUCTUUR:
${JSON.stringify(structure, null, 2)}

RESEARCH:
${research}

🎯 FOCUS KEYWORD (VERPLICHT):
"${focusKeyword}"

Dit keyword MOET minimaal 5-8 keer natuurlijk verwerkt worden in de content:
- ❌ NIET in een H1 (H1 staat alleen in de WordPress titel, niet in content body)
- 1-2x in de introductie (eerste 150 woorden)
- 3-5x verspreid door de rest van de content (in verschillende secties)
- Mag wel in H2/H3 headings waar passend
- ALTIJD natuurlijk en contextbewust - NOOIT geforceerd of herhalend

📊 LSI KEYWORDS (VERPLICHT - minimaal 15 van deze ${lsiKeywords.length} keywords gebruiken):
${lsiKeywords.slice(0, 25).map((kw, i) => `${i + 1}. ${kw}`).join('\n')}

Deze semantische keywords MOETEN verwerkt worden door de hele tekst om topical relevance te verhogen:
- Minimaal 15 van deze keywords gebruiken
- Verspreid door verschillende secties
- Natuurlijk en contextbewust inpassen
- Synoniemen en variaties zijn ook toegestaan

${options.includeDirectAnswer ? `
🎯 DIRECT ANTWOORD (VERPLICHT):
Voeg direct na de introductie een beknopt, direct antwoord toe op de hoofdvraag:

<p><strong>Kort antwoord op de hoofdvraag in 2-3 zinnen met dikgedrukte tekst.</strong></p>

LET OP: 
- GEEN box, heading of speciale styling
- Alleen een <p> met <strong> voor het dikgedrukte antwoord
- Het moet een beknopt, direct antwoord geven op de hoofdvraag
- Gewoon als onderdeel van de normale tekst flow
` : ''}

${options.includeFAQ ? `
❓ FAQ SECTIE (VERPLICHT):
Voeg aan het einde van het artikel (voor de conclusie) een professionele FAQ Accordion sectie toe met 5-7 veelgestelde vragen:

<!-- wp:heading -->
<h2 class="wp-block-heading">Veelgestelde vragen</h2>
<!-- /wp:heading -->

<!-- wp:generateblocks/container {"uniqueId":"faq-accordion","isDynamic":false,"blockVersion":4} -->
<div class="gb-container gb-container-faq-accordion">

<!-- wp:generateblocks/container {"uniqueId":"faq-item-1","isDynamic":false,"blockVersion":4} -->
<details class="gb-container gb-container-faq-item-1" style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
  <summary style="font-weight: bold; cursor: pointer; color: #ff6b35; font-size: 18px;">Vraag 1 hier (zonder ❓ emoticon)</summary>
  <div style="margin-top: 10px; padding-left: 10px;">
    <p>Antwoord op vraag 1 in 2-4 zinnen.</p>
  </div>
</details>
<!-- /wp:generateblocks/container -->

<!-- wp:generateblocks/container {"uniqueId":"faq-item-2","isDynamic":false,"blockVersion":4} -->
<details class="gb-container gb-container-faq-item-2" style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
  <summary style="font-weight: bold; cursor: pointer; color: #ff6b35; font-size: 18px;">Vraag 2 hier (zonder ❓ emoticon)</summary>
  <div style="margin-top: 10px; padding-left: 10px;">
    <p>Antwoord op vraag 2 in 2-4 zinnen.</p>
  </div>
</details>
<!-- /wp:generateblocks/container -->

[... voeg nog 3-5 FAQ items toe met dezelfde structuur ...]

</div>
<!-- /wp:generateblocks/container -->

BELANGRIJK VOOR FAQ's:
- Gebruik ALTIJD <details> en <summary> tags voor een werkende Accordion
- GEEN ❓ emoticons of andere emoji's in de vragen
- Elke vraag moet relevant zijn voor het onderwerp
- Antwoorden in 2-4 zinnen
- Focus keyword of LSI keywords bevatten waar mogelijk
- Minimaal 5, maximaal 7 FAQ items
` : ''}

ARTIKEL STRUCTUUR (VERPLICHT):
- ❌ GEEN H1 in de content - de H1 wordt automatisch de WordPress titel
- Begin DIRECT met de introductie paragraaf (geen H1 boven de intro)
- Intro: 3-4 zinnen met variërende lengtes, noem het keyword
- H2 en/of H3 titels: elk met een menselijke, doorlopende alinea (schrijf in normale zinsvorm)
- Afsluitende alinea: 4-5 zinnen
- ❌ NOOIT twee headings direct achter elkaar - ALTIJD een paragraaf ertussen
- ❌ De H1 titel staat ALLEEN in de WordPress post title, NIET in de content body

🔴🔴🔴 SUPER BELANGRIJK - NEDERLANDSE HOOFDLETTERS 🔴🔴🔴
⚠️⚠️⚠️ DIT IS EEN HARDE EIS - NEGEREN LEIDT TOT AFKEURING ⚠️⚠️⚠️

NEDERLANDSE HOOFDLETTERREGEL (VERPLICHT):
- ALLEEN de allereerste letter van een titel/heading is een hoofdletter
- ALLE andere woorden beginnen met een kleine letter
- Dit is NIET zoals Engels waar elk woord een hoofdletter krijgt!

✅ CORRECT (Nederlandse stijl - altijd zo schrijven):
- "Jouw reis naar diepe ontspanning begint nu"
- "Hoe werkt kunstmatige intelligentie in marketing?"
- "De voordelen van AI voor kleine bedrijven"
- "Wat zijn de beste tips voor gezond leven?"
- "Waarom je deze producten moet overwegen"
- "Alles wat je moet weten over dit onderwerp"

❌ ABSOLUUT FOUT (Engelse stijl - NOOIT gebruiken):
- "Jouw Reis Naar Diepe Ontspanning Begint Nu"
- "Hoe Werkt Kunstmatige Intelligentie In Marketing?"
- "De Voordelen Van AI Voor Kleine Bedrijven"
- "Wat Zijn De Beste Tips Voor Gezond Leven?"
- "Waarom Je Deze Producten Moet Overwegen"

Dit geldt ZONDER UITZONDERING voor:
- De hoofdtitel van het artikel (H1)
- ALLE H2 headings
- ALLE H3 headings
- FAQ vragen
- Alle andere koppen in de tekst
- Zelfs product- of merknamen volgen deze regel (tenzij het een acroniem is zoals AI of SEO)

SCHRIJFSTIJL VOOR 100% HUMAN SCORE - UNIVERSELE AI-TEKST HUMANISATIE:

🔴 1. VERVANG FORMELE WOORDEN (70% van gevonden woorden):
❌→✅ "uiteraard" → "natuurlijk", "zeker"
❌→✅ "optimaal" → "goed", "fijn", "prima"
❌→✅ "diverse" → "verschillende", "een aantal"
❌→✅ "tevens" → "ook", "daarnaast"
❌→✅ "dient te" → "moet", "kan"
❌→✅ "teneinde" → "om", "zodat"
❌→✅ "alsmede" → "en"
❌→✅ "ten behoeve van" → "voor"
❌→✅ "gedurende" → "tijdens"
❌→✅ "ontdekken" → "zien", "vinden"

🔴 2. VERMIJD AI-PATRONEN (0 toegestaan):
❌ NOOIT: Opsommingen met "en...en...en" → Varieer met punten
❌ NOOIT: Perfecte lijstjes van 3 → Maak lijsten van 2, 4 of onregelmatig
❌ NOOIT: "Of het nu...is" constructies → Begin direct met onderwerp
❌ NOOIT: Vraag gevolgd door eigen antwoord → Alleen vraag ÓF statement
❌ NOOIT: "Perfect voor" patronen → Gebruik "Fijn voor" / "Geschikt voor"

🔴 3. NATUURLIJKHEID TOEVOEGEN (verplicht):
✅ Imperfecties: Voeg 1-2 per alinea toe: "hoewel", "soms", "meestal", "vaak", "eigenlijk"
✅ Persoonlijke voornaamwoorden: MINIMAAL 2x per alinea → "je", "we", "ons", "jouw", "onze"
✅ Milde twijfel: Gebruik "misschien", "waarschijnlijk", "vaak" i.p.v. absoluut
✅ Concrete details: 1 concreet voorbeeld/nummer per sectie
✅ Verzacht absolute woorden: "altijd"→"meestal", "nooit"→"zelden", "iedereen"→"de meeste mensen"

🔴 4. ZINSSTRUCTUUR REGELS (verplicht):
✅ Lengte verdeling:
   - 40% KORTE zinnen (5-12 woorden)
   - 40% MIDDEL zinnen (13-20 woorden)
   - 20% LANGE zinnen (21-30 woorden)
✅ Begin variatie: MAX 2 opeenvolgende zinnen met zelfde beginwoord
✅ Alinea ritme: Wissel korte (2-3 zinnen) en langere (4-6 zinnen) alinea's af

🔴 5. CONVERSATIONELE TOON (verplicht):
✅ Gebruik 'je/jij' vorm consequent (minimaal 2x per 100 woorden)
✅ Spreektaal en informele wendingen
✅ Natuurlijke overgangen: 'daarnaast', 'bovendien', 'ook', 'daarom'
✅ Emotionele woorden die betrokkenheid tonen
✅ Concrete voorbeelden en scenario's (GEEN mensen zoals "Stel Jan voor...")

📊 MEETBARE CRITERIA (automatische validatie):
- Formele woorden: <5% van totaal
- Persoonlijke voornaamwoorden: >2 per 100 woorden
- Opeenvolgende zelfde beginwoorden: <3
- AI-patronen: 0 gedetecteerd
- Zinslengte StdDev: >5

OPMAAK ELEMENTEN:
✅ Voeg minimaal 2-3 opsommingslijsten toe met <ul><li> voor leesbaarheid (VERPLICHT)
${options.includeQuotes !== false ? '✅ Voeg waar relevant blockquotes toe met <blockquote> voor belangrijke citaten of tips' : '❌ Geen blockquotes gebruiken'}
✅ Gebruik <strong> voor belangrijke punten (max 2-3 per paragraaf) (VERPLICHT)
✅ Gebruik <em> voor subtiele nadruk waar passend
${options.includeTables !== false ? '✅ Voeg waar mogelijk een tabel toe met <table> voor data/vergelijkingen (optioneel, alleen als het echt waarde toevoegt)' : '❌ Geen tabellen gebruiken'}

⚠️ BELANGRIJK - GEEN DUBBELE CONTENT:
❌ Als je een <ul> lijst maakt, schrijf dan NIET dezelfde punten ook als losse paragrafen
❌ Als je een <blockquote> gebruikt, schrijf dan NIET dezelfde tekst ook buiten de quote
❌ Elke informatie moet maar 1 keer voorkomen in het artikel
❌ Gebruik <ul> voor lijsten OF schrijf het als paragraaf, maar NOOIT beide

VERBODEN ELEMENTEN:
❌ Geen vaktermen of clichés
❌ Geen formele/stijve taal
❌ Geen overmatig gebruik van bijvoeglijke naamwoorden
❌ Keyword max 1 keer in headings
❌ Niet meer dan één keyword per alinea
❌ Geen voorbeelden van mensen (geen "Stel je voor dat Jan...")
❌ NOOIT headings zoals "Conclusie", "Afsluiting", "Call to Action", "Samenvatting"

SEO EISEN & LENGTE VEREISTE:
🔴🔴🔴 KRITIEK - STRIKT WOORDENAANTAL 🔴🔴🔴
⚠️⚠️⚠️ OVERSCHRIJDING = AUTOMATISCHE AFWIJZING ⚠️⚠️⚠️

ABSOLUTE LENGTE LIMIET:
- Target: ${options.length || 1000} woorden
- MAXIMALE limiet: ${(options.length || 1000) + 30} woorden - NOOIT OVERSCHRIJDEN!
- Acceptabele range: ${Math.max(50, (options.length || 1000) - 50)} tot ${(options.length || 1000) + 30} woorden

🚨 HARDE STOP REGEL:
- Wanneer je ${(options.length || 1000) + 20} woorden bereikt: STOP DIRECT
- Schrijf GEEN conclusie als dit de limiet overschrijdt
- Eindig MIDDEN in een sectie als dat nodig is om binnen limiet te blijven
- ELKE zin moet tellen - GEEN opvulling, GEEN herhalingen

⚠️ KRITIEKE INSTRUCTIES:
1. Houd tijdens het schrijven VOORTDUREND het woordaantal bij
2. Bij ${(options.length || 1000) - 50} woorden: Begin af te ronden
3. Bij ${(options.length || 1000)} woorden: Maak laatste sectie kort
4. Bij ${(options.length || 1000) + 20} woorden: STOP ONMIDDELLIJK
5. GEEN lange introducties of uitweidingen
6. GEEN onnodige voorbeelden of herhalingen

💡 SCHRIJFTIP: Wees direct, bondig en waardevol. Elke zin moet essentieel zijn.

🚨 FATALE FOUT: Als je artikel meer dan ${(options.length || 1000) + 30} woorden bevat, wordt het volledig AFGEWEZEN en moet je opnieuw beginnen.

${toneInstructions}
${options.customInstructions ? `\nEXTRA INSTRUCTIES:\n${options.customInstructions}\n` : ''}
- Keywords natuurlijk verwerken (max 1x per alinea)
- Links en keywords verspreiden door verschillende alinea's
${relevantLinks.length > 0 ? `
INTERNE LINKS - NATUURLIJKE INTEGRATIE (GEBRUIK ALLEEN DEZE EXACTE LINKS):
${relevantLinks.map((link, i) => `${i + 1}. <a href="${link.url}">${link.title}</a>`).join('\n')}

🎯 KRITIEKE REGELS VOOR NATUURLIJKE LINK INTEGRATIE:
- Integreer zoveel mogelijk links (minimaal 60%) op een NATUURLIJKE manier
- GEBRUIK ALLEEN DE EXACTE URLs HIERBOVEN - verzin geen andere links
- VERPLICHT: Plaats links BINNEN lopende zinnen - NOOIT als aparte zin of tussenzin!
- Vervang een RELEVANT DEEL van een bestaande zin met de link
- De zin moet vloeiend lezen met de link erin verwerkt
- Spread links door verschillende secties (begin, midden, eind)
- Gebruik natuurlijke ankertekst gebaseerd op context (2-6 woorden)

🚫 ABSOLUUT VERBODEN - LINKS IN HEADINGS:
- NOOIT links plaatsen in H1, H2, H3, H4, H5, H6 tags
- NOOIT links plaatsen in FAQ vragen (summary tags)
- NOOIT links plaatsen in koppen of titels van welke aard dan ook
- Links mogen ALLEEN in normale tekst paragrafen (<p> tags)

✅ CORRECTE VOORBEELDEN (link geïntegreerd IN normale tekst):
- "De beste waterzuiveraars zijn vaak <a href="/url">compact en effectief</a> voor dagelijks gebruik."
- "Bij het kiezen van een <a href="/url">waterfilter systeem</a> zijn er verschillende factoren."
- "Deze aanpak werkt uitstekend met <a href="/url">moderne filtermethoden</a> die we eerder bespraken."

❌ FOUT - NOOIT DOEN (aparte/tussenzinnen OF in headings):
- "Lees meer over waterfilters in dit artikel." ❌
- "Voor meer informatie, bekijk deze pagina over filters." ❌
- "Bekijk ook onze gids over waterfilters." ❌
- "<h2>De beste <a href="/url">waterzuiveraars</a> voor thuis</h2>" ❌❌❌ ABSOLUUT VERBODEN
- "<h3>Kies een <a href="/url">effectief systeem</a></h3>" ❌❌❌ ABSOLUUT VERBODEN

💡 PROCES: Schrijf eerst de zin volledig → Kies relevant tekstfragment → Vervang met link → Check of het natuurlijk leest → CONTROLEER: is de link NIET in een heading?
` : options.sitemapUrl ? `
INTERNE LINKS:
- Geen relevante interne links gevonden in de sitemap voor dit onderwerp
- Ga door zonder interne links
` : ''}
${options.projectContext?.url ? `- Vermeld waar relevant: ${options.projectContext.url}` : ''}

${getBannedWordsInstructions()}

AFBEELDINGEN & MEDIA (BELANGRIJK):
- Voeg PRECIES 2 hoogwaardige, context-relevante afbeeldingen toe:
  1. IMAGE_PLACEHOLDER_1: Plaats deze VROEG in het artikel (na de intro/eerste sectie) - dit wordt de uitgelichte afbeelding
  2. IMAGE_PLACEHOLDER_2: Plaats deze HALVERWEGE het artikel bij een belangrijke sectie
- Format: <img src="IMAGE_PLACEHOLDER_X" alt="Gedetailleerde, SEO-geoptimaliseerde beschrijving van de afbeelding (minimaal 10 woorden)" />
- NIET MEER DAN 2 AFBEELDINGEN TOEVOEGEN - dit is voor kostenoptimalisatie
- Gebruik specifieke, uitgebreide alt teksten voor SEO (minimaal 10-15 woorden per alt tekst)
- Alt teksten moeten de afbeelding EN de context beschrijven
- Afbeeldingen moeten DIRECT relevant zijn voor de tekst eromheen en de kernboodschap ondersteunen

BELANGRIJK:
- Schrijf zoals een mens schrijft: natuurlijk, gevarieerd, persoonlijk
- Gebruik korte EN lange zinnen door elkaar
- Begin alinea's op verschillende manieren
- Maak het leesbaar en toegankelijk (B1-niveau)
- GEEN AI-achtige patronen of herhalingen

Formaat: Markdown met headers, paragrafen, en lijsten.
`;
    
    // Bereken max_tokens op basis van gewenste woordaantal
    // 1 woord ≈ 1.3 tokens, plus beperkte ruimte voor HTML markup (x2.0)
    // CONSERVATIEVE schatting om overschrijding te voorkomen
    const targetWords = options.length || 1000;
    const maxTokens = Math.min(8000, Math.ceil((targetWords + 30) * 1.3 * 2.0)); // Strikter dan voorheen
    
    console.log(`🎯 Woordaantal doel: ${targetWords} woorden (max ${targetWords + 30}), max_tokens: ${maxTokens}`);
    
    const contentResponse = await chatCompletion({
      messages: [{ role: 'user', content: writingPrompt }],
      model: MODEL_CATEGORIES.SEO_WRITING.primary, // claude-4.5-sonnet
      temperature: 0.8,
      max_tokens: maxTokens
    });
    
    let content = contentResponse.choices[0]?.message?.content || '';
    
    // Woordaantal check en automatisch inkorten indien nodig
    let actualWordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const maxAllowedWords = targetWords + 30; // STRICTER: max 30 woorden boven target (was 50)
    
    console.log(`📊 Gegenereerd: ${actualWordCount} woorden, doel: ${targetWords} woorden, STRIKTE max: ${maxAllowedWords} woorden`);
    
    if (actualWordCount > maxAllowedWords) {
      console.warn(`⚠️ Artikel te lang (${actualWordCount} woorden), STRIKTE inkorten naar ${maxAllowedWords} woorden...`);
      
      // Splits content in zinnen
      const sentences = content.split(/(?<=[.!?])\s+/);
      let trimmedContent = '';
      let currentWordCount = 0;
      
      for (const sentence of sentences) {
        const sentenceWords = sentence.split(/\s+/).filter(w => w.length > 0).length;
        if (currentWordCount + sentenceWords <= maxAllowedWords) {
          trimmedContent += sentence + ' ';
          currentWordCount += sentenceWords;
        } else {
          break;
        }
      }
      
      content = trimmedContent.trim();
      actualWordCount = content.split(/\s+/).filter(w => w.length > 0).length;
      console.log(`✅ Artikel ingekort naar ${actualWordCount} woorden (max was ${maxAllowedWords})`);
    } else {
      console.log(`✅ Artikel binnen limiet: ${actualWordCount} woorden (max ${maxAllowedWords})`);
    }
    
    // STAP 3.5: Verboden woorden check en filter
    const validation = isContentValid(content);
    if (!validation.valid) {
      console.warn('⚠️ Verboden woorden gevonden:', validation.bannedWords);
      console.log('🔄 Automatisch filteren van verboden woorden...');
      content = removeBannedWords(content);
      
      // Dubbele check
      const revalidation = isContentValid(content);
      if (!revalidation.valid) {
        console.error('❌ Verboden woorden konden niet volledig verwijderd worden:', revalidation.bannedWords);
      }
    }
    
    onProgress?.('✅ Blog geschreven', 70);
    
    // STAP 3.6: Vervang IMAGE_PLACEHOLDER met Smart Image Generation (Stable Diffusion/Flux Pro/GPT Image of gratis stock)
    if (options.includeImages) {
      onProgress?.('🖼️ Afbeeldingen genereren...', 72);
      try {
        content = await replaceImagePlaceholdersWithSmartImages(content, options.topic, focusKeyword, options.projectId);
        console.log('✅ Afbeeldingen gegenereerd en geplaatst');
      } catch (error) {
        console.warn('⚠️ Afbeeldingen konden niet volledig gegenereerd worden:', error);
        // Continue without images if generation fails
      }
    }
    
    onProgress?.('✅ Afbeeldingen klaar', 75);
    
    // STAP 5: Voeg YouTube video toe (optioneel)
    if (options.includeYouTube) {
      onProgress?.('🎥 YouTube video zoeken...', 78);
      try {
        content = await addYouTubeToContent(content, options.topic);
        console.log('✅ YouTube video verwerkt');
      } catch (error) {
        console.warn('⚠️ YouTube video kon niet toegevoegd worden:', error);
        // Geen error throwen, gewoon doorgaan zonder video
      }
    }
    onProgress?.('✅ Media verwerkt', 80);
    
    // STAP 6: Genereer Featured Image (optioneel - 16:9) - met blog content context
    let featuredImageUrl: string | undefined;
    if (options.generateFeaturedImage) {
      onProgress?.('🎨 Featured image genereren...', 85);
      try {
        // Pass the blog content to generateFeaturedImage for better context
        featuredImageUrl = await generateFeaturedImage(options.topic, focusKeyword, content);
        console.log('✅ Featured image gegenereerd met content context:', featuredImageUrl);
      } catch (error) {
        console.warn('⚠️ Featured image kon niet gegenereerd worden:', error);
        // Geen error throwen, gewoon doorgaan zonder featured image
      }
    }
    onProgress?.('✅ Featured image klaar', 88);
    
    // STAP 7: Finaliseer SEO Metadata (met definitieve content)
    onProgress?.('📊 SEO analyse...', 90);
    
    const finalSeoMetadata = await generateSEOMetadata({
      topic: options.topic,
      content,
      keywords: options.keywords || []
    });
    
    onProgress?.('✅ SEO metadata klaar', 93);
    
    // STAP 4: SEO analyse
    onProgress?.('📊 SEO analyse...', 95);
    
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // 200 woorden per minuut
    
    // Simpele SEO score
    let seoScore = 50;
    if (content.includes(options.topic)) seoScore += 10;
    if (wordCount >= (options.length || 1000)) seoScore += 10;
    if (content.match(/##/g)?.length >= 3) seoScore += 10;
    if (structure.metaDescription.length <= 160) seoScore += 10;
    if (content.length > 500) seoScore += 10;
    
    // STAP 9: Integreer affiliate links als beschikbaar
    if (options.includeAffiliateLinks && options.affiliateLinks && options.affiliateLinks.length > 0) {
      try {
        onProgress?.('🔗 Affiliate links integreren...', 95);
        console.log(`🔗 Integrating ${options.affiliateLinks.length} affiliate links...`);
        
        const enhancedContent = await integrateAffiliateLinksWithAI(
          content,
          options.affiliateLinks,
          {
            maxLinks: options.maxAffiliateLinks || 8,
            strategy: options.affiliateLinkStrategy || 'natural'
          }
        );
        
        // Update content with affiliate links
        content = enhancedContent;
        
        console.log('✅ Affiliate links successfully integrated');
      } catch (affiliateError) {
        console.error('❌ Affiliate link integration failed:', affiliateError);
        // Continue without affiliate links if integration fails
      }
    }
    
    // STAP 10: Genereer Social Media Post (optioneel maar automatisch)
    let socialMediaPost;
    try {
      onProgress?.('📱 Social media post genereren...', 97);
      socialMediaPost = await generateSocialMediaPost(
        options.topic,
        finalSeoMetadata.focusKeyword,
        structure.title,
        content,
        structure.metaDescription
      );
      console.log('✅ Social media post gegenereerd');
    } catch (error) {
      console.warn('⚠️ Social media post kon niet gegenereerd worden:', error);
      // Continue without social media post if it fails
    }
    onProgress?.('✅ Social media post klaar', 99);
    
    onProgress?.('✅ Klaar!', 100);
    
    return {
      title: structure.title,
      content,
      metaDescription: structure.metaDescription,
      keywords: options.keywords || [options.topic],
      readingTime,
      seoScore: Math.min(seoScore, 100),
      suggestions: [
        seoScore < 80 ? 'Overweeg om meer keywords toe te voegen' : '',
        readingTime < 3 ? 'Blog is mogelijk te kort voor goede SEO' : '',
        content.match(/##/g)?.length < 3 ? 'Voeg meer subheaders toe' : ''
      ].filter(Boolean),
      research: [research],
      featuredImageUrl, // Featured image URL (16:9)
      seoMetadata: finalSeoMetadata,
      socialMediaPost // Social media post met tekst, afbeelding en hashtags
    };
    
  } catch (error: any) {
    console.error('Blog generation error:', error);
    throw new Error(`Blog generatie mislukt: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Genereer SEO Metadata voor een blog
 */
async function generateSEOMetadata(params: {
  topic: string;
  content: string;
  keywords: string[];
}): Promise<{
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  extraKeywords: string[];
  lsiKeywords: string[];
}> {
  try {
    const metadataPrompt = `
Je bent een SEO expert. Analyseer de volgende blog en genereer professionele SEO metadata.

ONDERWERP: ${params.topic}
OPGEGEVEN KEYWORDS: ${params.keywords.join(', ')}

BLOG CONTENT:
${params.content.substring(0, 3000)}... [Blog content]

OPDRACHT - Genereer EXACTE SEO metadata:

1. **SEO Titel** (EXACT 55-60 tekens):
   - Moet het focus keyword bevatten
   - Moet pakkend en klikwaardig zijn
   - Optimaal voor Google search results
   
2. **Meta Omschrijving** (EXACT 150-155 tekens):
   - Moet het focus keyword bevatten
   - Moet een call-to-action bevatten
   - Moet overtuigend zijn om te klikken
   - Gebruik actieve taal
   
3. **Focus Keyword**:
   - Het belangrijkste zoekwoord voor dit artikel
   - Meestal 1-3 woorden
   - Dit keyword MOET prominent aanwezig zijn in de content
   
4. **Extra Keywords** (8-12 keywords):
   - Gerelateerde zoekwoorden die in het artikel gebruikt zijn
   - Variaties van het focus keyword
   - Long-tail keywords
   - Synoniemen en gerelateerde termen
   
5. **LSI Keywords** (MINIMAAL 20-25 keywords):
   - Semantisch gerelateerde keywords (Latent Semantic Indexing)
   - Keywords die zoekmachines verwachten bij dit onderwerp
   - Zoals SurferSEO en Yoast SEO analyseren
   - Deze keywords verhogen topical relevance en E-E-A-T score
   - Bijvoorbeeld: als focus keyword "digital marketing" is, dan LSI keywords: 
     "online advertising, content strategy, SEO optimization, social media management, 
     email campaigns, brand awareness, customer engagement, conversion rate, 
     analytics tracking, marketing automation, lead generation, customer journey,
     brand positioning, content marketing, influencer marketing, video marketing,
     marketing funnel, ROI optimization, audience targeting, marketing analytics"

FORMAAT - Geef ALLEEN JSON terug:
{
  "seoTitle": "[EXACT 55-60 tekens]",
  "metaDescription": "[EXACT 150-155 tekens]",
  "focusKeyword": "[hoofdkeyword]",
  "extraKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"],
  "lsiKeywords": ["lsi1", "lsi2", "lsi3", "lsi4", "lsi5", "lsi6", "lsi7", "lsi8", "lsi9", "lsi10", "lsi11", "lsi12", "lsi13", "lsi14", "lsi15", "lsi16", "lsi17", "lsi18", "lsi19", "lsi20", "lsi21", "lsi22", "lsi23", "lsi24", "lsi25"]
}

BELANGRIJK:
- Zorg dat de lengtes EXACT kloppen
- Gebruik het focus keyword in ZOWEL titel als description
- LSI keywords moeten semantisch relevant zijn
- Geen markdown, ALLEEN pure JSON
`;

    // Try with retry logic for better reliability
    let metadataResponse;
    let attempt = 1;
    const maxAttempts = 2;

    while (attempt <= maxAttempts) {
      try {
        console.log(`🔄 Metadata generation attempt ${attempt}/${maxAttempts}`);
        
        metadataResponse = await chatCompletion({
          messages: [
            {
              role: 'system',
              content: 'Je bent een SEO expert die perfecte metadata genereert. Je geeft ALLEEN JSON terug, geen extra tekst.'
            },
            {
              role: 'user',
              content: metadataPrompt
            }
          ],
          model: MODEL_CATEGORIES.SEO_WRITING.primary, // claude-4.5-sonnet or gemini-2.5-pro
          temperature: 0.3,
          max_tokens: 2000 // Increased from 1000 to 2000 to prevent truncation
        });

        const finishReason = metadataResponse.choices[0]?.finish_reason;
        if (finishReason === 'length') {
          console.warn(`⚠️ Response truncated (finish_reason: length) on attempt ${attempt}`);
          if (attempt < maxAttempts) {
            attempt++;
            console.log('⏳ Retrying with full token allocation...');
            await new Promise(resolve => setTimeout(resolve, 500));
            continue; // Retry
          }
        }
        
        // Success - break retry loop
        console.log(`✅ Metadata response received successfully`);
        break;
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error);
        if (attempt < maxAttempts) {
          attempt++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        } else {
          throw error; // Re-throw on final attempt
        }
      }
    }

    const metadataText = metadataResponse?.choices[0]?.message?.content || '{}';
    console.log(`📊 Metadata response length: ${metadataText.length} chars`);
    
    // Extract JSON with improved parsing
    let metadata;
    try {
      // Remove markdown code blocks if present
      let jsonText = metadataText.trim();
      jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Try to extract JSON object
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      
      metadata = JSON.parse(jsonText);
      console.log('✅ Metadata JSON parsed successfully');
    } catch (e) {
      console.warn('⚠️ Failed to parse metadata JSON:', e);
      console.log('📄 Raw response (first 300 chars):', metadataText.substring(0, 300));
      
      // Fallback metadata
      metadata = {
        seoTitle: params.topic,
        metaDescription: `Ontdek alles over ${params.topic}. Lees onze complete gids met tips en beste praktijken.`,
        focusKeyword: params.keywords[0] || params.topic,
        extraKeywords: params.keywords.slice(0, 8),
        lsiKeywords: []
      };
    }

    // Validate and fix SEO Title
    if (!metadata.seoTitle || metadata.seoTitle.length < 30) {
      console.warn(`⚠️ SEO Title too short or missing (${metadata.seoTitle?.length || 0} chars) - using topic`);
      metadata.seoTitle = params.topic;
    }
    // Keep full length - Google indexes the full title even if it truncates in display
    
    // Validate and fix Meta Description
    if (!metadata.metaDescription || metadata.metaDescription.length < 120) {
      console.warn(`⚠️ Meta Description too short (${metadata.metaDescription?.length || 0} chars) - generating fallback`);
      metadata.metaDescription = `Ontdek alles over ${params.topic}. Lees onze complete gids met tips en beste praktijken.`;
    }
    
    // Ensure description is 150-155 chars for optimal display
    if (metadata.metaDescription.length > 155) {
      console.warn(`⚠️ Meta Description too long (${metadata.metaDescription.length} chars) - truncating to 155`);
      metadata.metaDescription = metadata.metaDescription.substring(0, 152) + '...';
    } else if (metadata.metaDescription.length < 150) {
      // Pad if needed to reach optimal length
      const padding = ' Lees meer in dit artikel.';
      if (metadata.metaDescription.length + padding.length <= 155) {
        metadata.metaDescription += padding;
      }
    }

    // Validate focus keyword
    if (!metadata.focusKeyword) {
      console.warn(`⚠️ No focus keyword - using first keyword or topic`);
      metadata.focusKeyword = params.keywords[0] || params.topic;
    }

    // Validate extra keywords
    if (!metadata.extraKeywords || metadata.extraKeywords.length < 5) {
      console.warn(`⚠️ Not enough extra keywords (${metadata.extraKeywords?.length || 0}) - using provided keywords`);
      metadata.extraKeywords = params.keywords.slice(0, 10);
    }

    // Ensure we have at least 20 LSI keywords for proper SEO
    if (!metadata.lsiKeywords || metadata.lsiKeywords.length < 15) {
      console.warn(`⚠️ Only ${metadata.lsiKeywords?.length || 0} LSI keywords found - generating more`);
      
      const basicLSI = [
        ...(metadata.lsiKeywords || []),
        params.topic.toLowerCase(),
        metadata.focusKeyword.toLowerCase(),
        ...params.keywords.map(k => k.toLowerCase()),
      ];
      
      // Add semantic variations and related terms
      const semanticTerms = [
        `${params.topic} tips`,
        `${params.topic} gids`,
        `beste ${params.topic}`,
        `${params.topic} voorbeelden`,
        `${params.topic} vergelijking`,
        'tips en tricks',
        'complete gids',
        'beste praktijken',
        'hoe werkt',
        'wat is',
        'waarom belangrijk',
        'voordelen',
        'nadelen',
        'alternatieven',
        'review',
        'ervaringen',
        'aanbevolen',
        'top',
        'meest populaire',
        'voor beginners',
        'expert tips'
      ];
      
      for (const term of semanticTerms) {
        if (basicLSI.length >= 25) break;
        const lowerTerm = term.toLowerCase();
        if (!basicLSI.includes(lowerTerm)) {
          basicLSI.push(lowerTerm);
        }
      }
      
      metadata.lsiKeywords = basicLSI.slice(0, 25); // Cap at 25
    }

    console.log(`✅ SEO Metadata validated:
   - Title: "${metadata.seoTitle}" (${metadata.seoTitle.length} chars)
   - Description: "${metadata.metaDescription.substring(0, 50)}..." (${metadata.metaDescription.length} chars)
   - Focus: "${metadata.focusKeyword}"
   - Extra keywords: ${metadata.extraKeywords?.length || 0}
   - LSI keywords: ${metadata.lsiKeywords?.length || 0}`);

    return metadata;
  } catch (error) {
    console.error('❌ SEO metadata generation failed:', error);
    // Return fallback metadata
    return {
      seoTitle: params.topic, // VOLLEDIG BEWAREN - GEEN AFKAPPING
      metaDescription: `Lees alles over ${params.topic}. Ontdek tips, tricks en meer.`,
      focusKeyword: params.keywords[0] || params.topic,
      extraKeywords: params.keywords.slice(0, 5),
      lsiKeywords: []
    };
  }
}

/**
 * Extract key context from HTML content for better image generation
 */
function extractImageContext(htmlContent: string, maxLength: number = 500): string {
  try {
    // Remove HTML tags
    const textContent = htmlContent
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Get first significant paragraph (skip short intro lines)
    const paragraphs = textContent.split(/\n+/).filter(p => p.length > 50);
    const context = paragraphs.slice(0, 2).join(' ');
    
    // Truncate to maxLength while keeping complete sentences
    if (context.length <= maxLength) {
      return context;
    }
    
    const truncated = context.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastQuestion = truncated.lastIndexOf('?');
    const lastExclamation = truncated.lastIndexOf('!');
    const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);
    
    if (lastSentenceEnd > 0) {
      return truncated.substring(0, lastSentenceEnd + 1);
    }
    
    return truncated + '...';
  } catch (error) {
    console.warn('⚠️ Error extracting image context:', error);
    return '';
  }
}

/**
 * Extract context around an image placeholder for better prompt generation
 */
function extractContextAroundImage(content: string, imageMatch: RegExpMatchArray): string {
  try {
    const imagePosition = imageMatch.index || 0;
    
    // Extract 500 characters before and after the image for context
    const contextBefore = content.substring(Math.max(0, imagePosition - 500), imagePosition);
    const contextAfter = content.substring(imagePosition + imageMatch[0].length, imagePosition + imageMatch[0].length + 500);
    
    // Clean HTML tags from context to get plain text
    const cleanText = (html: string) => {
      return html
        .replace(/<[^>]+>/g, ' ')  // Remove HTML tags
        .replace(/\s+/g, ' ')        // Normalize whitespace
        .trim();
    };
    
    const textBefore = cleanText(contextBefore);
    const textAfter = cleanText(contextAfter);
    
    // Combine and return context
    const fullContext = `${textBefore} ${textAfter}`.trim();
    
    // Limit to 400 characters for the prompt
    return fullContext.substring(0, 400);
  } catch (error) {
    console.warn('⚠️ Error extracting image context:', error);
    return '';
  }
}

/**
 * 🎨 Vervang IMAGE_PLACEHOLDER met Smart Image Generation
 * - Featured image (1e): AI-generated (Stable Diffusion/Flux Pro/GPT Image)
 * - Mid-text image (2e): Gratis stock (Pixabay/Pexels) OF AI (indien geen match)
 */
async function replaceImagePlaceholdersWithSmartImages(
  content: string,
  topic: string,
  focusKeyword: string,
  projectId?: string
): Promise<string> {
  try {
    // Find all IMAGE_PLACEHOLDER instances
    const placeholderRegex = /<img[^>]*src="IMAGE_PLACEHOLDER_(\d+)"[^>]*alt="([^"]*)"[^>]*\/?>/g;
    const matches = Array.from(content.matchAll(placeholderRegex));
    
    if (matches.length === 0) {
      console.log('⚠️ Geen IMAGE_PLACEHOLDER gevonden in content');
      return content;
    }
    
    console.log(`🖼️ ${matches.length} afbeeldingen gevonden, genereren met Smart Image Generator...`);
    
    // COST OPTIMIZATION: Limit to maximum 2 images (1 featured + 1 mid-text)
    const imagesToGenerate = matches.slice(0, 2);
    if (matches.length > 2) {
      console.log(`⚠️ Limiting image generation to 2 (found ${matches.length}) for cost optimization`);
    }
    
    // Generate images for each placeholder (max 2)
    let updatedContent = content;
    
    // First, remove all placeholders beyond the first 2
    if (matches.length > 2) {
      for (let i = 2; i < matches.length; i++) {
        updatedContent = updatedContent.replace(matches[i][0], '');
      }
    }
    
    let totalCost = 0;
    
    for (let i = 0; i < imagesToGenerate.length; i++) {
      const match = imagesToGenerate[i];
      const fullMatch = match[0];
      const placeholderNum = match[1];
      const altText = match[2];
      const imageType = i === 0 ? 'featured' : 'mid-text';  // 1e = featured, 2e = mid-text
      
      try {
        // 🔍 NIEUW: Extract context around the image for better prompt
        const imageContext = extractContextAroundImage(content, match);
        
        // Build a DETAILED prompt with context
        let imagePrompt = '';
        
        if (imageContext && imageContext.length > 50) {
          // Use rich context to create a specific prompt
          imagePrompt = `Professional photorealistic image for blog article.

TOPIC: ${topic}
KEYWORD: ${focusKeyword}
IMAGE DESCRIPTION: ${altText}

ARTICLE CONTEXT: ${imageContext}

Create a highly specific, professional photograph that accurately represents the subject matter based on the context above. 
Style: Modern, photorealistic, magazine-quality, high resolution, excellent lighting, sharp focus.
IMPORTANT: NO TEXT, NO WATERMARKS, NO LOGOS in the image.`;
        } else {
          // Fallback to basic prompt if no context available
          imagePrompt = `Professional photorealistic image: ${altText}. 
Topic: ${topic}. Keyword: ${focusKeyword}. 
Style: Modern, photorealistic, magazine-quality, high resolution, vibrant colors, professional lighting.
NO TEXT, NO WATERMARKS, NO LOGOS.`;
        }

        console.log(`🎨 Generating ${imageType} with enriched context prompt...`);

        // 🎯 Use Smart Image Generator
        const result = await generateSmartImage({
          prompt: imagePrompt,
          projectId,
          type: imageType as 'featured' | 'mid-text',
          width: 1920,
          height: 1080,
        });

        if (result.success && result.imageUrl) {
          // Replace placeholder with actual image
          const attributionText = result.attribution ? `\n<!-- ${result.attribution} -->` : '';
          const costText = result.cost > 0 ? ` data-cost="${result.cost}"` : '';
          const newImgTag = `<img src="${result.imageUrl}" alt="${altText}" loading="lazy" style="width: 100%; height: auto; border-radius: 8px; margin: 20px 0;"${costText} />${attributionText}`;
          updatedContent = updatedContent.replace(fullMatch, newImgTag);
          
          totalCost += result.cost;
          
          const costInfo = result.cost === 0 ? '(GRATIS! 🎉)' : `(${result.cost} credits)`;
          console.log(`✅ ${imageType} afbeelding gegenereerd: ${altText.substring(0, 50)}... ${costInfo}`);
        } else {
          console.error(`❌ Failed to generate ${imageType} image:`, result.error);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (imageError) {
        console.error(`❌ Failed to generate image ${placeholderNum}:`, imageError);
        // Keep placeholder if generation fails
      }
    }
    
    console.log(`💰 Total image cost: ${totalCost} credits (was ${imagesToGenerate.length * 18} with GPT Image)`);
    
    return updatedContent;
    
  } catch (error) {
    console.error('❌ Error replacing image placeholders:', error);
    return content; // Return original content if replacement fails
  }
}

/**
 * Genereer een hoge kwaliteit afbeelding met Flux Pro
 */
async function generateFluxImage(
  prompt: string,
  width: number = 1920,
  height: number = 1080
): Promise<string> {
  try {
    console.log(`🎨 Flux Pro afbeelding genereren: ${prompt.substring(0, 100)}...`);
    
    // Map requested size to supported GPT Image sizes: 1024x1024, 1024x1536, 1536x1024
    let size = '1024x1024'; // Default square
    if (width > height) {
      // Landscape - use 1536x1024
      size = '1536x1024';
    } else if (height > width) {
      // Portrait - use 1024x1536
      size = '1024x1536';
    }
    
    // Use AIML API's image generation endpoint with Flux Pro
    const response = await fetch(`https://api.aimlapi.com/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'flux-pro',  // Flux Pro: $0.05 - beste kwaliteit
        prompt: prompt,
        size: size,
        quality: 'high', // highest quality
        n: 1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Flux Pro API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const imageUrl = result.images?.[0]?.url || result.data?.[0]?.url;
    
    if (!imageUrl) {
      throw new Error('No image URL returned from GPT Image API');
    }

    console.log('✅ GPT Image afbeelding gegenereerd:', imageUrl);
    return imageUrl;
    
  } catch (error) {
    console.error('❌ GPT Image generation failed:', error);
    throw error;
  }
}

/**
 * Genereer een 16:9 Featured Image voor het artikel met verbeterde context
 */
async function generateFeaturedImage(
  topic: string, 
  focusKeyword: string, 
  blogContent?: string
): Promise<string> {
  try {
    console.log(`🎨 Featured image genereren voor: ${topic}`);
    
    // Extract context from blog content if available
    let contentContext = '';
    if (blogContent) {
      contentContext = extractImageContext(blogContent, 400);
      console.log('📝 Content context extracted:', contentContext.substring(0, 100) + '...');
    }
    
    // Build a rich, contextual prompt for better image generation
    let imagePrompt = `Professional, high-quality, photorealistic featured image for blog article.

TOPIC: ${topic}
KEYWORD: ${focusKeyword}`;

    if (contentContext) {
      imagePrompt += `

CONTEXT: ${contentContext}

Create a visually stunning image that represents the key concepts from this article.`;
    }

    imagePrompt += `

STYLE: Modern, professional, photorealistic, magazine-quality, high resolution, vibrant colors, sharp focus, excellent lighting, suitable for blog header.

NO TEXT, NO WATERMARKS, NO LOGOS.

16:9 landscape format.`;

    // Use Flux Pro for high-quality generation
    const imageUrl = await generateFluxImage(imagePrompt, 1920, 1080);
    
    console.log('✅ Featured image gegenereerd:', imageUrl);
    return imageUrl;
    
  } catch (error) {
    console.error('❌ Featured image generation failed:', error);
    // Fallback to a neutral placeholder
    return `https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=1920&h=1080&fit=crop`;
  }
}

/**
 * Genereer Social Media Post met tekst, afbeelding en hashtags
 */
async function generateSocialMediaPost(
  topic: string,
  focusKeyword: string,
  blogTitle: string,
  blogContent: string,
  metaDescription: string
): Promise<{
  text: string;
  imageUrl: string;
  hashtags: string[];
}> {
  try {
    console.log('📱 Social media post genereren...');
    
    // Extract key content for social media post
    const contentContext = extractImageContext(blogContent, 300);
    
    // Generate social media post text
    const socialTextPrompt = `
Je bent een social media expert die pakkende posts maakt voor LinkedIn, Facebook en Instagram.

BLOG ARTIKEL:
Titel: ${blogTitle}
Onderwerp: ${topic}
Focus keyword: ${focusKeyword}
Meta: ${metaDescription}

KORTE INHOUD:
${contentContext}

TAAK:
Maak een pakkende social media post (150-200 woorden) die:
1. Aandacht trekt in de eerste zin (hook)
2. De kernwaarde van het artikel duidelijk maakt
3. Geschikt is voor LinkedIn, Facebook én Instagram
4. Een call-to-action bevat ("Lees meer op..." of "Ontdek...")
5. Professioneel maar toegankelijk is
6. Emotie en nieuwsgierigheid opwekt
7. GEEN hashtags bevat (die komen apart)

STRUCTUUR:
- Hook (1 pakkende zin)
- Waarde propositie (2-3 zinnen over wat de lezer leert)
- Call-to-action (lees het volledige artikel)

Schrijf in een persoonlijke, conversationele stijl. Gebruik emoji's spaarzaam (max 2-3).

Geef alleen de post tekst, geen extra uitleg.
`;

    const textResponse = await chatCompletion({
      messages: [{ role: 'user', content: socialTextPrompt }],
      model: MODEL_CATEGORIES.SEO_WRITING.primary,
      temperature: 0.7,
      max_tokens: 500
    });

    const socialText = textResponse.choices[0]?.message?.content?.trim() || '';

    // Generate hashtags
    const hashtagPrompt = `
Genereer 8-12 relevante hashtags voor deze social media post over: ${topic}

Focus keyword: ${focusKeyword}

Geef een mix van:
- Populaire hashtags (hoge reach)
- Niche hashtags (specifiek publiek)
- Branded hashtags (indien relevant)

FORMAAT (alleen JSON):
{
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", ...]
}
`;

    const hashtagResponse = await chatCompletion({
      messages: [{ role: 'user', content: hashtagPrompt }],
      model: MODEL_CATEGORIES.SEO_WRITING.primary,
      temperature: 0.5,
      max_tokens: 300
    });

    let hashtags: string[] = [];
    try {
      const hashtagText = hashtagResponse.choices[0]?.message?.content || '{}';
      const jsonMatch = hashtagText.match(/\{[\s\S]*\}/);
      const hashtagData = JSON.parse(jsonMatch ? jsonMatch[0] : hashtagText);
      hashtags = hashtagData.hashtags || [];
    } catch (e) {
      console.warn('⚠️ Failed to parse hashtags, using defaults');
      hashtags = ['#blog', '#content', '#marketing'];
    }

    // Generate social media image (1:1 square format)
    console.log('🎨 Social media afbeelding genereren...');
    
    const socialImagePrompt = `Create a professional, eye-catching social media image.

TOPIC: ${topic}
KEYWORD: ${focusKeyword}
ARTICLE TITLE: ${blogTitle}

CONTENT CONTEXT:
${contentContext}

STYLE REQUIREMENTS:
- Modern, professional, high-quality
- Suitable for LinkedIn, Facebook, Instagram
- Aspect ratio: 1:1 (square format, 1080x1080px)
- Visually appealing and attention-grabbing
- No text overlays (will be added separately)
- Vibrant colors that stand out in social feeds
- Relevant to the article content
- Should make people want to learn more

Create a unique, contextually relevant image that represents the article's message and catches attention in social media feeds.`;

    const imageResponse = await fetch(`https://api.aimlapi.com/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'stable-diffusion-3',  // Cost-optimized: $0.037 vs $0.18 for GPT-image-1
        prompt: socialImagePrompt,
        size: '1024x1024', // 1:1 square aspect ratio for social media
        style: 'vivid', // levendige kleuren voor social media
        quality: 'hd',
        n: 1
      }),
    });

    if (!imageResponse.ok) {
      throw new Error(`Social media image generation failed: ${imageResponse.statusText}`);
    }

    const imageResult = await imageResponse.json();
    const imageUrl = imageResult.data?.[0]?.url || imageResult.choices?.[0]?.message?.content;
    
    if (!imageUrl) {
      throw new Error('No image URL returned from API');
    }

    console.log('✅ Social media post gegenereerd');
    
    return {
      text: socialText,
      imageUrl,
      hashtags
    };

  } catch (error) {
    console.error('❌ Social media post generation failed:', error);
    // Return fallback
    return {
      text: `🚀 Nieuw artikel: ${topic}\n\nOntdek alles over ${focusKeyword} in ons laatste artikel.\n\n👉 Lees meer via de link!`,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Nickelodeon_2023_logo_%28outline%29.svg/1200px-Nickelodeon_2023_logo_%28outline%29.svg.png',
      hashtags: ['#blog', '#content', '#marketing']
    };
  }
}
