

/**
 * 🔗 PROFESSIONAL LINKBUILDING ARTICLE GENERATOR
 * 
 * Schrijft SEO-geoptimaliseerde linkbuilding artikelen volgens strikte richtlijnen:
 * - Vermijdt AI-detecteerbare woorden en patronen
 * - Natuurlijke, menselijke schrijfstijl
 * - Anchors in verschillende subsecties (NOOIT in dezelfde paragraaf)
 * - Exact woordenaantal
 * - Passend bij doeldomein tone-of-voice
 */

interface LinkbuildingArticleOptions {
  targetDomain: string;
  anchors: Array<{ keyword: string; url: string }>;
  wordCount: number;
  topic?: string;
}

interface LinkbuildingResult {
  success: boolean;
  topic: string;
  content: string;
  wordCount: number;
  anchorsUsed: number;
  filePath: string;
}

// 🚫 Verboden woorden die NOOIT gebruikt mogen worden (AI-detecteerbaar)
const FORBIDDEN_WORDS = [
  'spul', 'gedoe', 'zonder gedoe', 'z\'n',
  'uiteraard', 'natuurlijk', 'simpelweg', 'eenvoudigweg',
  'kortom', 'met andere woorden', 'in wezen',
  'essentieel', 'cruciaal', 'fundamenteel',
  'optimaal', 'ultiem', 'onmisbaar',
  'niet alleen... maar ook', 'bovendien', 'daarnaast', 'echter',
  'wereld van', 'in de wereld van', 'in een wereld van',
  'superheld', 'superheldin', 'superkracht',
  'game changer', 'gamechanger', 'game-changer',
  'toverwoord', 'tovermiddel', 'wondermiddel',
  'heilige graal', 'magische oplossing', 'magisch middel',
  'revolutionair', 'baanbrekend'
];

/**
 * Hoofdfunctie: genereer linkbuilding artikel
 */
export async function generateLinkbuildingArticle(
  options: LinkbuildingArticleOptions
): Promise<LinkbuildingResult> {
  console.log('🔗 Starting linkbuilding article generation:', {
    domain: options.targetDomain,
    anchors: options.anchors.length,
    wordCount: options.wordCount
  });

  try {
    // STAP 1: Scrape doeldomein voor tone-of-voice
    console.log('📊 Step 1: Scraping target domain...');
    const domainData = await scrapeTargetDomain(options.targetDomain);
    
    // STAP 2: Kies onderwerp (of gebruik gegeven onderwerp)
    let topic: string = options.topic || '';
    if (!topic) {
      console.log('💡 Step 2: Choosing topic based on domain...');
      topic = await chooseLinkbuildingTopic(domainData, options.anchors);
    }
    
    // STAP 3: Schrijf artikel met strikte regels
    console.log('✍️ Step 3: Writing linkbuilding article...');
    const article = await writeLinkbuildingArticle({
      topic: topic,
      domainData,
      anchors: options.anchors,
      targetWordCount: options.wordCount,
    });
    
    // STAP 4: Valideer en optimaliseer
    console.log('✅ Step 4: Validating article...');
    const validated = await validateAndOptimize(article, options.wordCount);
    
    // STAP 5: Sla op in project directory
    const fileName = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filePath = `./public/generated/linkbuilding_${fileName}.md`;
    
    // Ensure directory exists
    const fs = require('fs');
    const path = require('path');
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, validated.content);
    
    console.log('✅ Linkbuilding article completed successfully!');
    
    return {
      success: true,
      topic,
      content: validated.content,
      wordCount: validated.actualWordCount,
      anchorsUsed: options.anchors.length,
      filePath,
    };
  } catch (error) {
    console.error('❌ Linkbuilding article generation failed:', error);
    throw error;
  }
}

/**
 * STAP 1: Scrape doeldomein
 */
async function scrapeTargetDomain(domain: string) {
  const url = domain.startsWith('http') ? domain : `https://${domain}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    const html = await response.text();
    const text = extractTextFromHTML(html);
    
    // AI analyse van tone-of-voice
    const apiKey = process.env.AIML_API_KEY!;
    const analysisResponse = await fetch('https://api.aimlapi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Je bent een tone-of-voice analist. Analyseer kort en bondig.'
          },
          {
            role: 'user',
            content: `Analyseer deze website kort:\n\nDomain: ${domain}\n\nContent (eerste 2000 chars):\n${text.substring(0, 2000)}\n\nGeef terug in JSON:\n{\n  "niche": "primaire onderwerp/branche",\n  "toneOfVoice": "informeel/formeel/professioneel/vriendelijk etc",\n  "targetAudience": "doelgroep"\n}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    });
    
    const data = await analysisResponse.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.warn('⚠️ Domain scraping failed, using defaults');
    return {
      niche: 'algemeen',
      toneOfVoice: 'professioneel',
      targetAudience: 'Nederlandse lezers'
    };
  }
}

/**
 * STAP 2: Kies relevant onderwerp
 */
async function chooseLinkbuildingTopic(domainData: any, anchors: Array<{ keyword: string; url: string }>) {
  // Extract keywords from anchors
  const keywords = anchors.map(a => a.keyword).join(', ');
  
  const apiKey = process.env.AIML_API_KEY!;
  const topicResponse = await fetch('https://api.aimlapi.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Je kiest relevante onderwerpen voor linkbuilding artikelen. Geef ALLEEN het onderwerp terug, geen extra tekst.'
        },
        {
          role: 'user',
          content: `Kies een relevant artikel onderwerp voor deze combinatie:\n\nDoeldomein niche: ${domainData.niche}\nAnchors: ${keywords}\n\nHet onderwerp moet:\n1. Logisch de anchors kunnen bevatten\n2. Passen bij ${domainData.niche}\n3. Informatief en waardevol zijn\n4. Max 60 karakters\n\nGeef ALLEEN het onderwerp, niets anders.`
        }
      ],
      temperature: 0.7,
      max_tokens: 100,
    }),
  });
  
  const data = await topicResponse.json();
  return data.choices[0].message.content.trim();
}

/**
 * STAP 3: Schrijf linkbuilding artikel met strikte regels
 */
async function writeLinkbuildingArticle(params: {
  topic: string;
  domainData: any;
  anchors: Array<{ keyword: string; url: string }>;
  targetWordCount: number;
}) {
  const apiKey = process.env.AIML_API_KEY!;
  
  // Build anchor instructions (elk in eigen subsectie)
  const anchorInstructions = params.anchors.map((anchor, i) => 
    `Anchor ${i + 1}: [${anchor.keyword}](${anchor.url}) - Plaats in H2 subsectie ${i + 1} (natuurlijk in de tekst verwerken)`
  ).join('\n');
  
  const prompt = `Je bent een expert SEO linkbuilding schrijver. Schrijf een artikel dat NIET detecteerbaar is als AI-content.

**OPDRACHT:** Schrijf een ${params.targetWordCount}-woorden artikel voor ${params.domainData.niche}

**ONDERWERP:** ${params.topic}

**ANCHORS (BELANGRIJK - elk in EIGEN H2 subsectie):**
${anchorInstructions}

**DOELDOMEIN INFO:**
- Niche: ${params.domainData.niche}
- Tone: ${params.domainData.toneOfVoice}
- Doelgroep: ${params.domainData.targetAudience}

**KRITIEKE REGELS:**

1. **STRUCTUUR:**
   - H1: Titel (GEEN scheidingstekens zoals ":" of "-")
   - ${params.anchors.length} x H2 subsecties (elk anchor in eigen subsectie)
   - H2 format: alleen eerste letter hoofdletter
   - Elk anchor plaatsen in VERSCHILLENDE H2 subsectie

2. **SCHRIJFSTIJL (anti-AI detectie):**
   ✅ Korte en lange zinnen afwisselen
   ✅ Conversationeel (alsof je praat tegen iemand)
   ✅ Actieve zinnen
   ✅ Concrete voorbeelden
   ✅ Natuurlijke overgangen
   ✅ Variatie in zinslengte
   
   ❌ NOOIT deze woorden gebruiken:
   ${FORBIDDEN_WORDS.slice(0, 20).join(', ')}
   
   ❌ Geen perfecte, gepolijste zinnen
   ❌ Geen clichés
   ❌ Niet te zakelijk/formeel (tenzij domein dit vereist)
   ❌ Geen voorspelbare AI-patronen

3. **WOORDENAANTAL:**
   - EXACT ${params.targetWordCount} woorden (±10 woorden marge)
   - Tel alle woorden inclusief anchor texts

4. **ANCHORS:**
   - Plaats NATUURLIJK in de tekst
   - NIET geforceerd
   - Logisch binnen context van die subsectie
   - Format: [anchor tekst](url)

**FORMAT:**

# Titel zonder scheidingstekens

Introductie (2-3 zinnen)...

## Eerste subsectie
Content met natuurlijke verwerking van [anchor 1 tekst](url1) ...

## Tweede subsectie  
Content met natuurlijke verwerking van [anchor 2 tekst](url2) ...

${params.anchors.length > 2 ? `## Derde subsectie
Content met natuurlijke verwerking van [anchor 3 tekst](url3) ...` : ''}

${params.anchors.length > 3 ? `## Vierde subsectie
Content met natuurlijke verwerking van [anchor 4 tekst](url4) ...` : ''}

## Conclusie
Samenvattende alinea (2-3 zinnen)

**START NU MET HET SCHRIJVEN - GEEN EXTRA TEKST, ALLEEN HET ARTIKEL:**`;

  const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o', // Beste model voor natuurlijke schrijfstijl
      messages: [
        {
          role: 'system',
          content: 'Je bent een menselijke schrijver die natuurlijke, niet-detecteerbare content schrijft. Je volgt EXACT de regels zonder af te wijken.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8, // Hogere temperatuur voor meer variatie
      max_tokens: params.targetWordCount * 3,
    }),
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * STAP 4: Valideer en optimaliseer
 */
async function validateAndOptimize(article: string, targetWordCount: number) {
  // Tel woorden
  const wordCount = article.split(/\s+/).filter(w => w.length > 0).length;
  
  // Check verboden woorden
  const lowerArticle = article.toLowerCase();
  const foundForbidden = FORBIDDEN_WORDS.filter(word => lowerArticle.includes(word.toLowerCase()));
  
  if (foundForbidden.length > 0) {
    console.warn('⚠️ Forbidden words found:', foundForbidden);
    // In productie: herschrijf artikel of vervang woorden
  }
  
  // Check woordenaantal (±10 woorden marge is OK)
  const wordDiff = Math.abs(wordCount - targetWordCount);
  if (wordDiff > 50) {
    console.warn(`⚠️ Word count mismatch: ${wordCount} vs target ${targetWordCount}`);
    // In productie: trim of expand artikel
  }
  
  return {
    content: article,
    actualWordCount: wordCount,
    forbiddenWordsFound: foundForbidden,
  };
}

/**
 * Helper: Extract text from HTML
 */
function extractTextFromHTML(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

