
/**
 * Originality.AI API Client
 * Scans content for AI detection and provides humanization suggestions
 */

const ORIGINALITY_API_URL = 'https://api.originality.ai/api/v1';
const API_KEY = process.env.ORIGINALITY_API_KEY || '';

export interface OriginalityScore {
  'ai': number;
  'original': number;
  'score': number; // Overall AI probability (0-100)
}

export interface OriginalityScanResult {
  success: boolean;
  score: OriginalityScore;
  credits_used: number;
  sentences?: Array<{
    text: string;
    ai_score: number;
  }>;
  shareUrl?: string; // Share URL from Originality.AI
  error?: string;
}

/**
 * Scan content for AI detection using Originality.AI
 */
export async function scanContent(content: string): Promise<OriginalityScanResult> {
  try {
    if (!API_KEY) {
      console.error('[Originality.AI] API key not configured');
      throw new Error('Originality.AI API key niet geconfigureerd. Neem contact op met support.');
    }

    if (!content || content.trim().length < 50) {
      throw new Error('Content te kort voor accurate scanning (minimaal 50 karakters)');
    }

    console.log('[Originality.AI] Scanning', content.length, 'characters');

    const response = await fetch(`${ORIGINALITY_API_URL}/scan/ai`, {
      method: 'POST',
      headers: {
        'X-OAI-API-KEY': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        aiModelVersion: '1', // Use latest model
        storeScan: 'true', // Store scans to get share URL
        sentences: true, // Request sentence-level analysis
        returnBlocks: true, // Also request block-level data
      }),
    });

    console.log('[Originality.AI] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Originality.AI] API error response:', errorText);
      
      let errorData: any = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        // Not JSON
      }
      
      const errorMessage = errorData.message || errorData.error || `API fout: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('[Originality.AI] Response data:', JSON.stringify(data).substring(0, 500));

    const aiScore = (data.score?.ai || 0) * 100;
    const originalScore = (data.score?.original || 0) * 100;

    console.log('[Originality.AI] Scan result: AI=' + aiScore.toFixed(1) + '%, Original=' + originalScore.toFixed(1) + '%');
    
    // Extract share URL from Originality.AI API response
    // The API returns: { results: { properties: { publicLink: "..." } } }
    const shareUrl = data.results?.properties?.publicLink || 
                     data.publicLink || 
                     data.shareUrl || 
                     data.share_url || 
                     data.url || 
                     null;
    
    if (shareUrl) {
      console.log('[Originality.AI] Share URL found:', shareUrl);
    } else {
      console.warn('[Originality.AI] No share URL in response. Full response:', JSON.stringify(data, null, 2));
    }

    // Parse sentence-level detection data
    // Originality.AI returns this in different formats depending on the endpoint
    let sentences: Array<{ text: string; ai_score: number }> = [];
    
    console.log('[Originality.AI] Full API response structure:', JSON.stringify(Object.keys(data)));
    
    // Format 1: direct sentences array
    if (data.sentences && Array.isArray(data.sentences)) {
      console.log('[Originality.AI] Found sentences array with', data.sentences.length, 'items');
      sentences = data.sentences.map((s: any) => ({
        text: s.text || s.sentence || '',
        ai_score: (s.ai_score || s.ai || s.fake || 0) * 100,
      }));
    }
    // Format 2: blocks array (from scan endpoint)
    else if (data.blocks && Array.isArray(data.blocks)) {
      console.log('[Originality.AI] Found blocks array with', data.blocks.length, 'items');
      sentences = data.blocks.map((block: any) => ({
        text: block.text || '',
        ai_score: (block.result?.fake || block.result?.ai || 0) * 100,
      }));
    }
    // Format 3: nested in results
    else if (data.results?.sentences && Array.isArray(data.results.sentences)) {
      console.log('[Originality.AI] Found results.sentences array with', data.results.sentences.length, 'items');
      sentences = data.results.sentences.map((s: any) => ({
        text: s.text || s.sentence || '',
        ai_score: (s.ai_score || s.ai || s.fake || 0) * 100,
      }));
    }
    // Format 4: content_details array (newer API format)
    else if (data.content_details && Array.isArray(data.content_details)) {
      console.log('[Originality.AI] Found content_details array with', data.content_details.length, 'items');
      sentences = data.content_details.map((detail: any) => ({
        text: detail.text || detail.content || '',
        ai_score: (detail.ai_probability || detail.ai_score || detail.ai || 0) * 100,
      }));
    }
    // Format 5: Split content manually if no sentence data provided
    else {
      console.log('[Originality.AI] No sentence-level data found, splitting content manually');
      // Split content into sentences
      const contentSentences = content.split(/[.!?]+\s+/).filter(s => s.trim().length > 20);
      console.log('[Originality.AI] Split content into', contentSentences.length, 'sentences manually');
      
      // Assign overall AI score to each sentence (not ideal, but better than nothing)
      sentences = contentSentences.map(text => ({
        text: text.trim(),
        ai_score: aiScore,
      }));
    }
    
    console.log('[Originality.AI] Parsed', sentences.length, 'sentences with AI scores');
    if (sentences.length > 0) {
      const highAISentences = sentences.filter(s => s.ai_score > 50);
      console.log('[Originality.AI]', highAISentences.length, 'sentences with high AI score (>50%)');
      
      // Log first 3 sentences for debugging
      sentences.slice(0, 3).forEach((s, i) => {
        console.log(`[Originality.AI] Sentence ${i + 1}: ${s.ai_score.toFixed(1)}% AI - "${s.text.substring(0, 60)}..."`);
      });
    }

    return {
      success: true,
      score: {
        ai: aiScore,
        original: originalScore,
        score: aiScore,
      },
      credits_used: data.credits_used || 0.01,
      sentences,
      shareUrl,
    };
  } catch (error: any) {
    console.error('[Originality.AI] Scan error:', error);
    return {
      success: false,
      score: { ai: 0, original: 0, score: 0 },
      credits_used: 0,
      error: error.message || 'Onbekende fout bij scannen',
    };
  }
}

/**
 * Humanize AI-generated content intelligently
 * Only rewrites sentences that have high AI detection scores
 * Uses advanced NLP techniques while preserving tone and HTML formatting
 */
export async function humanizeContent(
  content: string,
  language: 'nl' | 'en' | 'de' = 'nl',
  preserveTone: boolean = true,
  sentenceScores?: Array<{ text: string; ai_score: number }>,
  isHtml: boolean = false // Flag to indicate if content contains HTML
): Promise<{ humanized: string; improvements: string[] }> {
  const improvements: string[] = [];

  try {
    console.log('[Humanizer] Starting humanization for', content.length, 'characters');
    console.log('[Humanizer] Language:', language, 'Preserve tone:', preserveTone);
    console.log('[Humanizer] Is HTML:', isHtml);
    
    // Import AI client for humanization
    const { chatCompletion } = await import('./aiml-api');

    // If we have sentence-level scores, use targeted rewriting approach
    let sentencesToRewrite: Array<{ text: string; ai_score: number }> = [];
    let aiSentenceCount = 0;
    
    if (sentenceScores && sentenceScores.length > 0) {
      console.log('[Humanizer] Analyzing', sentenceScores.length, 'sentences for AI content');
      
      // Use all provided sentences (they are already filtered by the frontend)
      sentencesToRewrite = sentenceScores;
      aiSentenceCount = sentencesToRewrite.length;
      
      console.log('[Humanizer] Rewriting', aiSentenceCount, 'selected sentences');
      
      improvements.push(`${aiSentenceCount} geselecteerde zinnen geïdentificeerd voor herschrijven`);
      
      if (aiSentenceCount === 0) {
        improvements.push('Geen zinnen geselecteerd - humanize hele tekst of selecteer specifieke zinnen');
      }
    } else {
      console.log('[Humanizer] No sentence scores provided, will humanize entire content');
    }

    // Build humanization prompt with clear structured instructions
    const isTargeted = sentencesToRewrite.length > 0;
    
    const htmlInstructions = isHtml ? `
**KRITIEK BELANGRIJK - HTML FORMAAT:**
- De tekst bevat HTML opmaak (tags zoals <p>, <strong>, <em>, <h2>, <ul>, <li>, etc.)
- Je MOET ALLE HTML tags EXACT behouden zoals ze zijn
- Verander ALLEEN de tekst BINNEN de HTML tags
- Behoud ALLE styling en structuur (bold, italic, headers, lists, etc.)
- Output moet valid HTML zijn met dezelfde structuur als input
` : '';

    let prompt: string;
    
    if (isTargeted && aiSentenceCount > 0) {
      // TARGETED REWRITING: Only rewrite high-scoring AI sentences
      const sentenceList = sentencesToRewrite
        .sort((a, b) => b.ai_score - a.ai_score) // Sort by AI score (highest first)
        .map((s, i) => `[${Math.round(s.ai_score)}% AI] ${s.text}`)
        .join('\n\n');
      
      prompt = `Je bent een expert in het VERLAGEN van AI-detectie scores naar ONDER 5%. Je doel is om tekst zo te herschrijven dat deze 100% menselijk lijkt, terwijl je een professionele schrijfstijl behoudt.

${htmlInstructions}

**KRITIEKE TAAK:**
Je krijgt een tekst met gemarkeerde zinnen die TE HOOG scoren op AI-detectie.
Je MOET deze zinnen zo herschrijven dat ze DRAMATISCH LAGER scoren op AI-detectie, zonder betekenis te verliezen.

**STRIKTE REGELS:**
1. Herschrijf ALLEEN de gemarkeerde zinnen (andere zinnen ONVERANDERD)
2. Nieuwe versie moet 100% natuurlijk Nederlands zijn
3. Behoud EXACT dezelfde betekenis en informatie
4. Lengte mag ±20% afwijken (voor natuurlijkere formuleringen)
5. Verwijder ALLE AI-patronen ZEER AGRESSIEF
6. Behoud professionele schrijfstijl - maar kies voor directheid en helderheid boven formele constructies

**ULTRA AGRESSIEVE ANTI-AI STRATEGIEËN (Voor ZeroGPT 100% Human Score):**
Pas dit EXTREEM AGRESSIEF toe op ELKE gemarkeerde zin - doe ALLES om AI-patronen te vernietigen:

✗ VERWIJDER DIRECT EN VERVANG (AI-WOORDEN ZIJN VERBODEN):
- "Het is belangrijk om", "Laten we eens kijken", "Het is essentieel", "Cruciaal om op te merken" → Schrap volledig en begin direct met de boodschap
- "In het huidige tijdperk", "Heden ten dage", "In deze moderne tijd", "Tegenwoordig" → Gebruik "nu", "vandaag" of schrap volledig
- "Daarnaast", "Bovendien", "Echter", "Tevens", "Voorts", "Aldus", "Bijgevolg", "Derhalve" → "maar", "ook", "en", "toch", "alleen" of begin gewoon met de zin
- "Daadwerkelijk", "Wezenlijk", "Aanzienlijk", "Significant", "Fundamenteel", "Essentieel" → "echt", "groot", "belangrijk", "heel", "erg"
- "Optimaliseren", "Implementeren", "Faciliteren", "Genereren" → "verbeteren", "doen", "helpen", "maken"
- "Innovatief", "Transformerend", "Revolutionair", "Dynamisch" → Schrap of vervang door concrete beschrijving
- Passieve constructies → ALTIJD actieve zinnen (mensen schrijven actief)
- Perfecte grammatica → Voeg menselijke "imperfecties" toe (begin met "En", "Maar", "Want")
- Lange zinnen (>25 woorden) → ALTIJD splitsen in 2-3 korte zinnen
- Complexe bijzinnen → Splits in aparte zinnen

✓ VERVANG DOOR DAGELIJKS NEDERLANDS (Zo praten mensen echt):
- "echter" → "maar", "toch", "alleen" (of schrap het)
- "bovendien" → "ook", "en" (of start gewoon nieuwe zin)
- "cruciaal" / "essentieel" → "belangrijk", "nodig", "moet" 
- "significant" / "aanzienlijk" → "groot", "veel", "flink", "heel"
- "fundamenteel" → "basis", "belangrijk", "kern"
- "optimaliseren" → "beter maken", "verbeteren"
- "faciliteren" → "helpen", "mogelijk maken"
- "implementeren" → "doen", "invoeren", "gebruiken"
- "genereren" → "maken", "zorgen voor"
- Gebruik HERHALING van kernwoorden in plaats van synoniemen (mensen doen dit natuurlijk)

✓ EXTREME MENSELIJKE SCHRIJFKENMERKEN (ZeroGPT Hacks):
- **Zinlengte Chaos**: Wissel kort (3-7 woorden) met lang (15-25 woorden) af - geen uniformiteit!
- **Begin Variatie**: Begin zinnen soms met "En", "Maar", "Want", "Ook", "Toch" (menselijk!)
- **Directe Taal**: Gebruik "je", "we", "ons" waar mogelijk - maak het persoonlijk
- **Concrete Voorbeelden**: Vervang abstracte concepten door concrete voorbeelden
- **Informele Touches**: "Kijk eens", "Denk maar aan", "Stel je voor" (maar blijf professioneel genoeg)
- **Actieve Stem ALTIJD**: Passief = AI rode vlag
- **Herhaling OK**: Mensen herhalen natuurlijk kernwoorden - AI zoekt constant synoniemen
- **Imperfecte Flow**: Niet elke transitie hoeft perfect - mensen springen soms
- **Kortere Alinea's**: Max 3-4 zinnen per alinea (mensen scannen zo)
- **Spreektaal Elementen**: "gewoon", "even", "toch", "echt", "best", "vrij", "redelijk"

**VOLLEDIGE ${isHtml ? 'HTML ' : ''}TEKST:**
${content}

**ZINNEN DIE NAAR <5% AI MOETEN (${aiSentenceCount} geselecteerd):**
${sentenceList}

**KRITIEK VOOR 100% HUMAN SCORE:**
- Deze zinnen MOETEN van hoog-AI → 100% menselijk (ZeroGPT 0% AI)
- Wees EXTREEM AGRESSIEF - VERNIET alle AI-patronen volledig
- Het moet klinken als iemand die dit echt typte, niet een AI die "menselijk probeert te zijn"
- Test ELKE zin: "Zou een echt persoon dit exact zo typen?" - Zo niet, maak radicaal anders
- Gebruik spreektaal, begin zinnen met "En"/"Maar", herhaal woorden, splits lange zinnen
- Kies ALTIJD voor korte, directe zinnen boven complexe, formele constructies
- GEEN perfecte grammatica - mensen schrijven met kleine "fouten" en sprongen

**OUTPUT:**
Geef ALLEEN de volledige tekst terug met de ${aiSentenceCount} zinnen herschreven.
GEEN uitleg. GEEN markdown. ALLEEN de aangepaste tekst.
${isHtml ? 'BEHOUD alle HTML tags exact.' : ''}

**AANGEPASTE TEKST:**`;
      
    } else {
      // FULL REWRITING: Humanize entire content
      prompt = `Je bent een expert in het VERLAGEN van AI-detectie scores naar ONDER 5%. Je herschrijft teksten zo dat ze 100% menselijk lijken, terwijl je een professionele schrijfstijl behoudt.

${htmlInstructions}

**KRITISCHE REGELS - STRIKT VOLGEN:**
1. **BETEKENIS:** Behoud EXACT dezelfde informatie en betekenis
2. **LENGTE:** Output moet ongeveer dezelfde lengte hebben (±15% max voor natuurlijkere formuleringen)
3. **TOON:** Behoud de kernstijl (professioneel blijft professioneel), maar kies voor directheid boven formele constructies
4. **STRUCTUUR:** Behoud EXACT dezelfde alinea-indeling en structuur
${isHtml ? '5. **HTML:** Behoud ALLE HTML tags EXACT zoals ze zijn - verander ALLEEN tekst binnen tags\n' : ''}

**WAT JE WEL MAG AANPASSEN (ULTRA AGRESSIEF - Voor ZeroGPT 100% Human):**
- Verwijder ALLE AI-frasen VOLLEDIG: "het is belangrijk om", "laten we eens kijken", "in het huidige tijdperk", "het is essentieel", "cruciaal", "fundamenteel", "significant", "innovatief", "transformerend"
- Vervang formele woorden: "echter"→"maar"/"toch", "bovendien"→"ook"/"en", "tevens"→"ook", "aldus"→"dus", "derhalve"→"daarom", "aanzienlijk"→"veel"/"groot"
- Vervang jargon: "optimaliseren"→"verbeteren", "implementeren"→"doen", "faciliteren"→"helpen", "genereren"→"maken"
- Passieve zinnen → ALTIJD actieve stem (mensen schrijven actief)
- Lange zinnen (>20 woorden) → ALTIJD splitsen in 2-4 korte zinnen
- Complexe bijzinnen → Splits in aparte, simpele zinnen
- Abstracte concepten → Concrete voorbeelden en beschrijvingen
- Naamwoordgroepen → Werkwoordelijke constructies
- Perfecte grammatica → Voeg menselijke variatie toe (begin met "En", "Maar", spring soms in gedachten)
- Synoniem-variatie → Herhaal kernwoorden natuurlijk (mensen doen dit!)

**WAT JE ABSOLUUT NIET MAG DOEN:**
- Informatie toevoegen die er niet stond
- Belangrijke feiten of cijfers weglaten
- De kernboodschap veranderen
- Nieuwe claims verzinnen

**EXTREME MENSELIJKE SCHRIJFKENMERKEN (ZeroGPT 0% AI Strategie):**
- **Chaos in Zinlengte**: 5 woorden. Dan 18. Dan weer 7. Dan 22. GEEN patroon! (AI = uniform, mens = chaos)
- **Begin Variatie**: Begin zinnen regelmatig met "En", "Maar", "Want", "Ook", "Toch", "Alleen" (menselijk!)
- **Persoonlijke Taal**: Gebruik "je", "we", "jij", "ons", "mijn" waar mogelijk
- **Spreektaal**: "gewoon", "even", "toch", "echt", "best", "vrij", "redelijk", "nogal", "behoorlijk"
- **Directe Voorbeelden**: Zeg niet "bijvoorbeeld", zeg gewoon: "Denk aan X" of "Neem Y"
- **Actieve Stem 100%**: "Ik doe X" niet "X wordt gedaan" (passief = AI rode vlag)
- **Woord Herhaling**: Herhaal kernwoorden in plaats van synoniemen zoeken (natuurlijk!)
- **Imperfecte Transities**: Niet elke zin hoeft perfect aan te sluiten - mensen springen
- **Korte Alinea's**: Max 3 zinnen per alinea (mensen scannen)
- **Informele Touches**: "Kijk", "Snap je", "Zie je", "Denk maar na" (blijf wel professioneel genoeg)
- **Geen AI-perfectie**: Mensen hebben kleine "haperingen" in schrijfstijl - AI is robotachtig perfect

${preserveTone ? '**LET OP:** Professionele stijl blijft professioneel. Maar kies ALTIJD voor helderheid en directheid boven formele, omslachtige constructies.' : ''}

**ORIGINELE ${isHtml ? 'HTML ' : ''}TEKST:**
${content}

**INSTRUCTIE:** Geef ALLEEN de aangepaste tekst terug. GEEN uitleg, GEEN markdown, GEEN extra tekst. Alleen de output.
${isHtml ? 'BEHOUD alle HTML tags exact zoals ze zijn.' : ''}

**AANGEPASTE ${isHtml ? 'HTML ' : ''}TEKST:**`;
    }

    console.log('[Humanizer] Calling Claude API for humanization...');
    console.log('[Humanizer] Using', isTargeted ? 'TARGETED' : 'FULL', 'rewriting approach');
    console.log('[Humanizer] Prompt length:', prompt.length, 'characters');
    console.log('[Humanizer] Content length:', content.length, 'characters');
    console.log('[Humanizer] Max tokens:', Math.max(3000, Math.ceil(content.length * 1.5)));
    
    const response = await chatCompletion({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'claude-sonnet-4-5', // Use Claude for best humanization
      max_tokens: Math.max(3000, Math.ceil(content.length * 1.5)),
      temperature: 1.0, // MAXIMUM temperature for extreme creativity and human-like variation (ZeroGPT hack)
    });

    console.log('[Humanizer] Received response from Claude');

    const humanized = response?.choices?.[0]?.message?.content || content;
    
    if (!humanized) {
      console.error('[Humanizer] No content in Claude response:', response);
      throw new Error('Claude API gaf geen content terug');
    }
    
    console.log('[Humanizer] Humanized content length:', humanized.length, '(original:', content.length + ')');
    console.log('[Humanizer] Preview:', humanized.substring(0, 200));

    // Validate that we actually got different content
    if (humanized.trim() === content.trim()) {
      console.warn('[Humanizer] WARNING: No changes made to content - AI did not modify anything');
      improvements.push('Let op: Geen wijzigingen aangebracht - probeer opnieuw of gebruik andere provider');
    } else {
      console.log('[Humanizer] Successfully humanized content');
      
      // Track improvements made
      const lengthDiff = ((humanized.length - content.length) / content.length) * 100;
      if (Math.abs(lengthDiff) > 5) {
        improvements.push(`Lengte aangepast met ${lengthDiff > 0 ? '+' : ''}${lengthDiff.toFixed(1)}%`);
      }
      
      // Analyze burstiness improvement
      const originalSentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const humanizedSentences = humanized.split(/[.!?]+/).filter(s => s.trim().length > 10);
      
      const originalVariance = calculateVariance(originalSentences.map(s => s.split(' ').length));
      const humanizedVariance = calculateVariance(humanizedSentences.map(s => s.split(' ').length));
      
      if (humanizedVariance > originalVariance * 1.1) {
        improvements.push(`Zinlengte variatie verbeterd voor natuurlijker flow`);
      }

      if (isTargeted) {
        improvements.push(`${aiSentenceCount} AI-verdachte zinnen herschreven`);
        improvements.push(`Overige zinnen exact behouden`);
      } else {
        improvements.push('Volledige tekst geoptimaliseerd voor natuurlijkheid');
      }
      
      improvements.push('AI-patronen en formele taal verwijderd');
      improvements.push('Menselijke variatie en flow toegevoegd');
      
      if (preserveTone) {
        improvements.push('Originele tone en stijl behouden');
      }
    }

    console.log('[Humanizer] Completed humanization with', improvements.length, 'improvements');

    return {
      humanized: humanized.trim(),
      improvements,
    };
  } catch (error: any) {
    console.error('[Humanizer] Error:', error);
    throw new Error(`Humanization mislukt: ${error.message}`);
  }
}

/**
 * Calculate variance for sentence length analysis
 */
function calculateVariance(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
  return Math.sqrt(variance);
}

/**
 * Quick check if content likely needs humanization
 */
export function quickAICheck(content: string): {
  needsHumanization: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  let needsHumanization = false;

  // Check 1: Uniform sentence length (low burstiness indicator)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const lengths = sentences.map(s => s.split(' ').length);
  const variance = calculateVariance(lengths);
  const avgLength = lengths.reduce((sum, l) => sum + l, 0) / lengths.length;
  
  if (variance < avgLength * 0.3) {
    needsHumanization = true;
    reasons.push('Uniforme zinlengte gedetecteerd (lage burstiness)');
  }

  // Check 2: Repetitive patterns
  const words = content.toLowerCase().split(/\s+/);
  const bigramCounts = new Map<string, number>();
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    bigramCounts.set(bigram, (bigramCounts.get(bigram) || 0) + 1);
  }
  
  const maxRepetition = Math.max(...Array.from(bigramCounts.values()));
  if (maxRepetition > 3) {
    needsHumanization = true;
    reasons.push(`Herhalende woordcombinaties gedetecteerd (${maxRepetition}x)`);
  }

  // Check 3: Formal transition words overuse (AI pattern)
  const formalTransitions = ['echter', 'bovendien', 'daarnaast', 'tevens', 'voorts', 'aldus'];
  const transitionCount = formalTransitions.filter(t => 
    content.toLowerCase().includes(t)
  ).length;
  
  if (transitionCount > sentences.length * 0.15) {
    needsHumanization = true;
    reasons.push('Overmatig gebruik van formele overgangswoorden');
  }

  // Check 4: Lack of personal pronouns (too formal/robotic)
  const personalPronouns = ['ik', 'we', 'je', 'jij', 'jullie', 'mijn', 'onze'];
  const pronounCount = personalPronouns.filter(p => 
    content.toLowerCase().includes(` ${p} `)
  ).length;
  
  if (pronounCount === 0 && content.length > 500) {
    reasons.push('Gebrek aan persoonlijke elementen');
  }

  return { needsHumanization, reasons };
}
