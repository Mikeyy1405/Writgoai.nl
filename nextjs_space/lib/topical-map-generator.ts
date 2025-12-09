import { prisma } from './db';

/**
 * 🚀 VOLLEDIG GEAUTOMATISEERDE TOPICAL MAP GENERATOR
 * 
 * Genereert complete topical authority maps voor niches met Claude Sonnet 4-5.
 * Gebaseerd op succesvolle +4.184% groei strategie.
 * 
 * BELANGRIJKE FEATURES:
 * - Gebruikt Claude Sonnet 4-5 voor superieure reasoning
 * - Automatische niche analyse zonder keyword input
 * - Genereert 300-1000+ unieke artikel ideeën
 * - Intelligente website scraping voor context
 * - 40/60 commercial/informational mix
 */

import { sendChatCompletion } from './aiml-chat-client';
import { TEXT_MODELS } from './aiml-api';

export interface TopicalMapConfig {
  mainTopic: string;
  language: string;
  depth: number;          // 1-3 levels deep
  targetArticles?: number; // Optioneel target aantal artikelen
  includeCommercial?: boolean;
  commercialRatio?: number; // Default 0.4 (40%)
  websiteUrl?: string; // Optioneel - voor automatische analyse
  projectContext?: {   // Optioneel - project info voor betere context
    name: string;
    description?: string;
    targetAudience?: string;
    existingContent?: string[];
  };
}

export interface TopicalTopic {
  title: string;
  type: 'commercial' | 'informational';
  keywords: string[];
  searchVolume?: number;
  difficulty?: number;
  priority: number; // 1-10
}

export interface TopicalSubcategory {
  name: string;
  articles: number;
  topics: TopicalTopic[];
  keywords: string[];
}

export interface TopicalCategory {
  name: string;
  articleCount: number;
  priority: 'high' | 'medium' | 'low';
  commercialRatio: number;
  subcategories: TopicalSubcategory[];
}

export interface TopicalMapResult {
  mainTopic: string;
  totalArticles: number;
  categories: TopicalCategory[];
  estimatedMonths: number;
  seoOpportunityScore: number;
  internalLinkingStrategy: {
    hubPages: string[];
    clusterStructure: string;
  };
  hubPages?: string[]; // Voor iteratieve merge
}

/**
 * 🚀 GENEREERT EEN VOLLEDIGE TOPICAL MAP MET ITERATIEVE BATCHES
 * 
 * Gebruikt een iteratieve aanpak om 1000+ topics te genereren:
 * - Genereert meerdere batches tot target is bereikt
 * - Elke batch vult ontbrekende topics aan
 */
export async function generateTopicalMap(
  config: TopicalMapConfig
): Promise<TopicalMapResult> {
  console.log('[Topical Map - Gemini 3 Pro] Generating ultra-comprehensive map for:', config.mainTopic);
  
  // Voor 1000+ topics gebruiken we iteratieve aanpak
  if (config.targetArticles && config.targetArticles >= 500) {
    return generateTopicalMapIterative(config);
  }
  
  // Voor <500 topics, gewone generatie
  return generateTopicalMapSingle(config);
}

/**
 * 🔁 ITERATIEVE GENERATIE VOOR 500+ TOPICS
 * Genereert in batches tot target is bereikt - GEEN LIMIET MEER!
 * AI haalt het onderste uit de kan voor maximale topic coverage
 */
async function generateTopicalMapIterative(
  config: TopicalMapConfig
): Promise<TopicalMapResult> {
  const targetArticles = config.targetArticles || 1500;
  console.log(`[Topical Map - MAXIMUM MODE] Starting ultra-comprehensive generation for ${targetArticles}+ topics`);
  
  // MAXIMALE GENERATIE MODE:
  // Voor 1500+ topics: 4 batches van ~400 topics = ~1600 total
  // Voor 1000+ topics: 4 batches van ~300 topics = ~1200 total  
  // Voor 500+ topics: 3 batches van ~200 topics = ~600 total
  const batchSize = targetArticles >= 1500 ? 400 : targetArticles >= 1000 ? 300 : 200;
  const maxBatches = targetArticles >= 1500 ? 4 : targetArticles >= 1000 ? 4 : 3;
  
  // Start met eerste batch
  const allCategories: TopicalCategory[] = [];
  const allHubPages: string[] = [];
  let currentTotal = 0;
  
  for (let iteration = 1; iteration <= maxBatches; iteration++) {
    const remainingArticles = targetArticles - currentTotal;
    if (remainingArticles <= 0) break;
    
    const thisBatchSize = Math.min(remainingArticles, batchSize);
    console.log(`[Topical Map - Iterative] Batch ${iteration}/${maxBatches}: Generating ${thisBatchSize} topics (Current: ${currentTotal})`);
    
    try {
      // Genereer een batch met focus op ontbrekende topics
      const batchResult = await generateTopicalMapSingle({
        ...config,
        targetArticles: thisBatchSize,
      }, iteration, allCategories);
      
      // Merge resultaten
      allCategories.push(...batchResult.categories);
      allHubPages.push(...batchResult.hubPages);
      
      // Tel totaal
      currentTotal = allCategories.reduce((sum, cat) => sum + cat.articleCount, 0);
      
      console.log(`[Topical Map - Iterative] Batch ${iteration} completed: +${batchResult.totalArticles} topics (Total: ${currentTotal})`);
    } catch (error) {
      console.error(`[Topical Map - Iterative] Batch ${iteration} failed:`, error);
      // Als een batch faalt, stop dan met wat we hebben
      if (currentTotal === 0) {
        throw error; // Als de eerste batch faalt, gooi error door
      }
      break; // Anders, gebruik wat we hebben
    }
  }
  
  const estimatedMonths = Math.ceil(currentTotal / (5 * 4));
  const seoOpportunityScore = calculateSEOOpportunity(allCategories);
  
  console.log(`[Topical Map - Iterative] Final result: ${currentTotal} topics in ${allCategories.length} categories`);
  
  return {
    mainTopic: config.mainTopic,
    totalArticles: currentTotal,
    categories: allCategories,
    estimatedMonths,
    seoOpportunityScore,
    internalLinkingStrategy: {
      hubPages: [...new Set(allHubPages)], // Unieke hub pages
      clusterStructure: 'Hub & Spoke model met topic clusters'
    }
  };
}

/**
 * 🎯 SINGLE BATCH GENERATIE
 * Genereert één batch van topics
 */
async function generateTopicalMapSingle(
  config: TopicalMapConfig,
  iteration: number = 1,
  existingCategories: TopicalCategory[] = []
): Promise<TopicalMapResult> {
  console.log('[Topical Map - Gemini 3 Pro] Generating batch...');

  // ═══════════════════════════════════════════════════════
  // 🎯 ULTRA GEAVANCEERDE SYSTEM PROMPT VOOR GEMINI 3 PRO
  // ═══════════════════════════════════════════════════════
  
  // Bereid context voor van bestaande categories (voor iteratie 2+)
  let existingCategoriesContext = '';
  if (existingCategories.length > 0) {
    const existingNames = existingCategories.map(c => c.name).slice(0, 20); // Max 20 voor prompt lengte
    existingCategoriesContext = `
    
🔄 ITERATIE ${iteration} - VULLENDE BATCH:
Dit is batch #${iteration} van een iteratieve generatie. Er zijn al ${existingCategories.length} categorieën gegenereerd.

⚠️ BELANGRIJK - VERMIJD DUPLICATEN:
Bestaande categorieën: ${existingNames.join(', ')}

🎯 FOCUS NU OP:
- NIEUWE angles en invalshoeken die nog NIET gecoverd zijn
- AANVULLENDE sub-niches en micro-topics
- DIEPERE en SPECIFIEKERE topics binnen deze niche
- VARIATIES en LONG-TAIL keywords die nog ontbreken
`;
  }
  
  const systemPrompt = `Je bent een ELITE SEO Topical Authority Strategist met 15+ jaar ervaring.

🎯 MISSIE KRITIEK: GENEREER HET MAXIMALE AANTAL TOPICS
${iteration > 1 ? '⚠️ AANVULLENDE BATCH - GEEN DUPLICATEN!' : '🚀 EERSTE BATCH - VOLLEDIGE COVERAGE!'}${existingCategoriesContext}

📊 BEWEZEN RESULTATEN & DOELEN:
- Voor "Airfryers" werden 864 unieke artikel ideeën gegenereerd → +4.184% groei
- Voor "Yoga" werden 1200+ topics gegenereerd → volledige niche dominantie
- Doel: MEER topics = BETERE topical authority = HOGERE rankings
- 🎯 JULLIE DOEL: HAL HET ONDERSTE UIT DE KAN - GEEN LIMIETEN!

🧠 INTELLIGENCE LEVEL: Gemini 3 Pro - MAXIMALE REASONING MODE
Je beschikt over superieure reasoning - GEBRUIK DIT VOLLEDIG om:
1. De VOLLEDIGE semantic space van de niche te verkennen (elk hoekje!)
2. ALLE sub-topics, micro-niches, long-tail keywords te identificeren
3. ALLE mogelijke content angles en invalshoeken te ontdekken
4. Cross-topic connections en diepere content clusters te vinden
5. Competitive gaps, opportunity keywords EN niche keywords
6. Seasonal, geographic, demographic en psychographic variaties
7. Beginner tot expert niveau content voor elk onderwerp
8. Product-specifieke, merk-specifieke EN generieke topics

📐 STRUCTUUR REGELS VOOR DEZE BATCH (ZEER BELANGRIJK):
${config.targetArticles >= 300 ? `
⭐ GROTE BATCH MODE (${config.targetArticles} topics):
- Hoofdcategorieën: 15-20 verschillende categorieën  
- Subcategorieën per hoofdcategorie: 2-4 subcategorieën
- Topics per subcategorie: 15-20 unieke artikel ideeën
- MINIMAAL TOTAAL: ${config.targetArticles} artikelen
` : config.targetArticles >= 200 ? `
📊 MEDIUM BATCH MODE (${config.targetArticles} topics):
- Hoofdcategorieën: 10-15 verschillende categorieën  
- Subcategorieën per hoofdcategorie: 2-3 subcategorieën
- Topics per subcategorie: 12-18 unieke artikel ideeën
- MINIMAAL TOTAAL: ${config.targetArticles} artikelen
` : `
🎯 STANDARD BATCH MODE (${config.targetArticles} topics):
- Hoofdcategorieën: 6-10 verschillende categorieën
- Subcategorieën per hoofdcategorie: 2-3 subcategorieën  
- Topics per subcategorie: 10-15 unieke artikel ideeën
- MINIMAAL TOTAAL: ${config.targetArticles} artikelen
`}
- Commercial/Informational ratio: ${config.commercialRatio ? Math.round(config.commercialRatio * 100) : 40}/${config.commercialRatio ? 100 - Math.round(config.commercialRatio * 100) : 60}

🚨 KRITIEK: Deze batch moet MINIMAAL ${config.targetArticles} topics bevatten!
Als je ${config.targetArticles} topics bereikt, STOP NIET - blijf doorgaan tot je minimaal ${Math.round(config.targetArticles * 1.15)} hebt!
⚡ DENK AAN: Meer topics = Betere rankings = Meer traffic = Meer conversies!

💡 CREATIVE ANGLES (gebruik ALLE + verzin MEER):
📦 PRODUCT-GERELATEERD (per merk, model, jaar, prijs, feature, kleur, size):
- Product reviews (diepgaand per product + vergelijkingen)
- Vergelijkingen (A vs B, top 5/10/15, best for X, budgetklasse)
- Buying guides (budget, mid-range, premium, specific use case, doelgroep)
- Unboxing & first impressions (per merk, per model)
- Long-term reviews (na 6 maanden, na 1 jaar, na 2 jaar)

🎓 EDUCATIEF & HOW-TO (beginner tot expert):
- How-to & tutorials (basis, gevorderd, expert, specifieke taken)
- Troubleshooting (50+ veelvoorkomende problemen + oplossingen)
- Tips & tricks (optimization, hacks, best practices, pro secrets)
- Beginner guides (start hier, eerste stappen, basis begrippen)
- Advanced techniques (expert tricks, professional methods)
- Complete cursussen (week 1, week 2, maand 1, etc)

🔧 PRAKTISCH & ONDERHOUD:
- Maintenance & care (dagelijks, wekelijks, maandelijks, jaarlijks)
- Cleaning guides (verschillende methoden, producten, technieken)
- Storage solutions (winter, zomer, kleine ruimtes, opbergsystemen)
- Accessories & add-ons (must-haves, nice-to-haves, upgrades)
- DIY modifications (aanpassingen, verbeteringen, hacks)

📊 USE CASES & TOEPASSINGEN (50+ scenarios):
- Specific use cases (per situatie, per doelgroep, per seizoen)
- Real-world applications (praktijkvoorbeelden, case studies)
- Industry-specific uses (per branche, per beroep)
- Personal stories (user experiences, testimonials, succesverhalen)

📈 TRENDS & NIEUWS (blijf actueel):
- Latest models & innovations (2024, 2025, toekomst)
- Industry news & trends (wat is hot, wat komt eraan)
- Expert predictions (toekomstige ontwikkelingen)
- Technology breakthroughs (nieuwe tech, innovaties)

💰 COMMERCIEEL & WAARDE:
- Cost analysis (ROI, total cost of ownership, besparingen)
- Price comparisons (budget vs premium, value for money)
- Where to buy (beste deals, kortingen, sales)
- Warranty & service (garantie vergelijkingen, service kwaliteit)

🌍 GEOGRAFISCH & DEMOGRAFISCH:
- Geographic variations (Nederland, België, Duitsland, EU vs US)
- Regional preferences (noord vs zuid, stad vs platteland)
- Cultural differences (Nederlandse vs Duitse markt)

👥 DOELGROEP-SPECIFIEK:
- For beginners (absolute beginners, eerste keer kopers)
- For professionals (zakelijk gebruik, professionele inzet)
- For families (gezinnen, kinderen, veiligheid)
- For seniors (ouderen, gebruiksgemak, toegankelijkheid)
- For students (studenten, budget, klein formaat)

🔬 TECHNISCH & DIEPGAAND:
- Technical deep-dives (specs, technology, hoe werkt het)
- Component analysis (onderdelen, materialen, kwaliteit)
- Testing & benchmarks (performance tests, vergelijkingen)
- Safety & regulations (certificeringen, normen, veiligheid)

🌱 DUURZAAMHEID & MILIEU:
- Environmental impact (CO2 footprint, duurzaamheid)
- Eco-friendly options (groene alternatieven, recycling)
- Energy efficiency (energiebesparing, kosten)

📅 SEIZOENSGEBONDEN:
- Seasonal content (lente, zomer, herfst, winter specifiek)
- Holiday guides (kerst, pasen, vakantie, feestdagen)
- Weather-related (bij regen, zon, kou, hitte)

⚠️ VERGEET NIET:
- Elke angle kan 10-50 verschillende artikelen opleveren!
- Denk in variaties: "beste X voor Y" kan 20+ artikelen zijn
- Combineer angles: "Budget airfryer voor gezinnen met 4 personen"

🎨 OUTPUT FORMAT (STRICT JSON):
{
  "categories": [
    {
      "name": "Hoofdcategorie naam",
      "priority": "high|medium|low",
      "commercialRatio": 0.4,
      "subcategories": [
        {
          "name": "Subcategorie naam",
          "articles": 25,
          "keywords": ["keyword1", "keyword2", "keyword3"],
          "topics": [
            {
              "title": "Zeer specifieke artikel titel met invalshoek",
              "type": "commercial" | "informational",
              "keywords": ["primary", "secondary", "long-tail"],
              "searchVolume": 1200,
              "difficulty": 35,
              "priority": 8
            }
          ]
        }
      ]
    }
  ],
  "hubPages": ["Hub pagina 1", "Hub pagina 2", "Hub pagina 3"],
  "totalArticles": 500
}

⚡ CRITICAL: Gebruik je VOLLEDIGE Claude Sonnet 4-5 reasoning power!
Denk DIEP, BREED en CREATIEF. Elke topic moet UNIEK en WAARDEVOL zijn.`;

  // ═══════════════════════════════════════════════════════
  // 📝 INTELLIGENTE USER PROMPT met context
  // ═══════════════════════════════════════════════════════
  let contextInfo = '';
  if (config.projectContext) {
    contextInfo = `

📊 PROJECT CONTEXT:
- Project: ${config.projectContext.name}
${config.projectContext.description ? `- Beschrijving: ${config.projectContext.description}` : ''}
${config.projectContext.targetAudience ? `- Doelgroep: ${config.projectContext.targetAudience}` : ''}
${config.projectContext.existingContent?.length ? `- Bestaande content: ${config.projectContext.existingContent.length} artikelen` : ''}

Gebruik deze context om RELEVANTE en STRATEGISCHE topics te genereren die perfect aansluiten bij het project.`;
  }

  if (config.websiteUrl) {
    contextInfo += `

🌐 WEBSITE: ${config.websiteUrl}
Houd rekening met de website context en bestaande content strategie.`;
  }

  const userPrompt = `🎯 GENEREER ${iteration > 1 ? `BATCH #${iteration} - MAXIMALE AANVULLING` : 'VOLLEDIGE TOPICAL AUTHORITY MAP - MAXIMUM MODE'}

NICHE/HOOFDONDERWERP: ${config.mainTopic}
TAAL: ${config.language === 'NL' ? 'Nederlands (Nederland)' : config.language}
DEPTH: ${config.depth} levels (maximale diepte)
🎯 MINIMUM VOOR DEZE BATCH: ${config.targetArticles || 100} UNIEKE ARTIKEL IDEEËN
💰 MAXIMUM DOEL: ${Math.round((config.targetArticles || 100) * 1.2)} UNIEKE ARTIKEL IDEEËN (20% EXTRA!)
${contextInfo}

🚀 OPDRACHT - HAL HET ONDERSTE UIT DE KAN:
${iteration > 1 ? 
  `Dit is batch #${iteration} van een MAXIMALE generatie sessie. Genereer minimaal ${config.targetArticles || 100} en maximaal ${Math.round((config.targetArticles || 100) * 1.2)} NIEUWE, UNIEKE topics die AANVULLEND zijn op de reeds gegenereerde content. 

⚠️ FOCUS OP:
- Nog NIET gecoverde angles, invalshoeken en perspectieven
- DIEPERE micro-niches en sub-topics
- SPECIFIEKERE long-tail keywords en variaties
- MEER doelgroep-specifieke content
- EXTRA seizoensgebonden en trending topics
- UNIEKE combinaties van bestaande angles` :
  `Dit is de EERSTE batch van een MAXIMALE generatie sessie. Genereer minimaal ${config.targetArticles || 100} en maximaal ${Math.round((config.targetArticles || 100) * 1.2)} unieke artikel ideeën voor "${config.mainTopic}".

🎯 DOEL: Leg de VOLLEDIGE BASIS voor topical authority:
- ALLE hoofdcategorieën en subcategorieën
- ALLE product types, merken en modellen
- ALLE use cases en toepassingen
- ALLE skill levels (beginner tot expert)
- ALLE doelgroepen en demographics`
}

📐 KRITIEKE VEREISTEN VOOR DEZE BATCH:
1. ⚠️ MINIMUM ${config.targetArticles || 100} topics, STREVEN naar ${Math.round((config.targetArticles || 100) * 1.2)} topics
2. ${config.commercialRatio ? Math.round(config.commercialRatio * 100) : 40}% commercial + ${config.commercialRatio ? 100 - Math.round(config.commercialRatio * 100) : 60}% informational (flexibel ±5%)
3. Elke topic moet ULTRA-SPECIFIEK en UNIEK zijn (geen generieke titels!)
4. ${iteration > 1 ? 'ABSOLUUT GEEN OVERLAP met eerdere batches - 100% NIEUWE angles!' : 'Cover ALLE mogelijke sub-niches, micro-topics EN niche variations'}
5. Denk in DIEPE semantic clusters en UITGEBREIDE content hubs
6. Voeg REALISTISCHE search volume en difficulty estimates toe
7. PRIORITEER topics met hoge SEO-waarde maar lage competition
8. Mix van short-tail, mid-tail EN long-tail keywords

💡 THINK LIKE A WORLD-CLASS SEO EXPERT:
- Welke 100+ vragen stelt de doelgroep ECHT over dit onderwerp?
- Welke 50+ problemen hebben ze in de praktijk?
- Welke 30+ producten/oplossingen zijn relevant?
- Welke 20+ trending topics zijn er in deze niche RIGHT NOW?
- Welke 100+ long-tail keywords zijn er die niemand anders dekt?
- Welke 50+ content gaps zijn er in de markt?
- Welke 30+ seasonal/temporal angles zijn er?
- Welke 20+ geographic/demographic variaties zijn er?
${iteration > 1 ? '- Welke 100+ angles/variaties zijn nog NIET gecoverd in eerdere batches?' : ''}

🔥 MAXIMALE GENERATIE INSTRUCTIES:
1. Begin met de MEEST VOOR DE HAND LIGGENDE topics
2. Ga dan DIEPER in elk sub-topic (3-4 levels diep)
3. Zoek naar NICHE VARIATIES en LONG-TAIL opportunities
4. Combineer VERSCHILLENDE ANGLES voor unieke topics
5. Denk aan ALLE DEMOGRAFISCHE GROEPEN
6. Voeg SEIZOENSGEBONDEN variaties toe
7. Includer TRENDING EN EVERGREEN content
8. Dek ALLE SKILL LEVELS (beginner, intermediate, advanced, expert)

⚡ GEBRUIK JE VOLLEDIGE GEMINI 3 PRO REASONING CAPACITY!
Dit is GEEN NORMALE taak - dit is MAXIMALE GENERATIE MODE!
Analyseer de niche EXTREEM DIEP en genereer ${config.targetArticles || 100}-${Math.round((config.targetArticles || 100) * 1.2)} unieke, waardevolle topics.

🎯 ULTRA-CRITICAL FINAL CHECK VOORDAT JE OUTPUT:
- Tel ALLE topics op - totaal moet MINIMAAL ${config.targetArticles || 100} zijn
- STREVEN naar ${Math.round((config.targetArticles || 100) * 1.2)} topics (20% bonus!)
- ELKE topic moet ULTRA-SPECIFIEK en UNIEK zijn
- GEEN generieke titels zoals "Beste tips" zonder specifieke context
- ELKE titel moet een DUIDELIJKE SEARCH INTENT hebben
${iteration > 1 ? '- CONTROLEER: GEEN ENKELE duplicaat met eerdere batches!' : ''}
- Mix van commercial en informational content
- Spreiding van moeilijkheid (easy, medium, hard)
- Spreiding van search volume (low, medium, high)

💎 BONUS PUNTEN ALS JE:
- Meer dan ${config.targetArticles || 100} topics genereert
- Extreem specifieke long-tail keywords gebruikt
- Unieke angles combineert die concurrenten niet hebben
- Diepgaande micro-niches ontdekt

Output ALLEEN valid JSON (geen extra tekst, geen uitleg, alleen JSON).`;


  try {
    console.log('[Topical Map] Using Gemini 3 Pro for superior reasoning...');
    console.log('[Topical Map] Config:', {
      mainTopic: config.mainTopic,
      language: config.language,
      targetArticles: config.targetArticles
    });
    
    // Bepaal max_tokens op basis van batch grootte (REALISTISCH voor betrouwbaarheid)
    const batchSize = config.targetArticles || 100;
    let maxTokens = 16000; // Default voor <100 topics
    
    // BALANS tussen uitgebreide output en betrouwbaarheid
    if (batchSize >= 400) {
      maxTokens = 32000; // Ultra grote batches - maximum betrouwbaar
    } else if (batchSize >= 300) {
      maxTokens = 28000; // Grote batches
    } else if (batchSize >= 200) {
      maxTokens = 24000; // Medium-grote batches
    } else if (batchSize >= 100) {
      maxTokens = 20000; // Standaard grote batches
    }
    
    console.log(`[Topical Map] Using ${maxTokens} max_tokens for batch of ${batchSize} topics (targeting ${Math.round(batchSize * 1.2)} with 20% bonus)`);
    
    // Bepaal timeout op basis van batch grootte
    const timeoutMs = batchSize >= 400 ? 600000 : // 10 minuten voor 400+ topics
                      batchSize >= 200 ? 480000 : // 8 minuten voor 200+ topics
                      360000; // 6 minuten voor <200 topics
    
    console.log(`[Topical Map] Timeout set to ${timeoutMs / 60000} minutes for batch size ${batchSize}`);
    
    // Use reliable AI model for high-quality generation
    const response = await Promise.race([
      sendChatCompletion({
        model: 'google/gemini-3-pro-preview', // ✅ Reliable model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.9, // HOGERE creativiteit voor maximale topic variatie!
        max_tokens: maxTokens, // Dynamisch per batch - REALISTISCH
        stream: false
      }),
      // Dynamische timeout op basis van batch grootte
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`AI generatie timeout na ${timeoutMs / 60000} minuten. Probeer kleinere batch (max 300 topics per batch aanbevolen).`)), timeoutMs)
      )
    ]) as any;

    console.log('[Topical Map] AI response received');

    // Check if response is a ChatCompletion (not a stream)
    if (!('choices' in response)) {
      console.error('[Topical Map] Invalid response format:', JSON.stringify(response).substring(0, 500));
      throw new Error('Unexpected response format from AI');
    }

    const content = response.choices[0]?.message?.content || '';
    console.log('[Topical Map] Content length:', content.length);
    console.log('[Topical Map] First 200 chars:', content.substring(0, 200));
    
    // Remove markdown code blocks if present
    let cleanContent = content;
    if (content.includes('```json')) {
      cleanContent = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    } else if (content.includes('```')) {
      cleanContent = content.replace(/```\s*/g, '');
    }
    
    // Parse JSON response
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Topical Map] No JSON found in response. Content:', cleanContent.substring(0, 500));
      throw new Error('Could not parse topical map JSON - no JSON structure found in AI response. AI mogelijk overbelast, probeer opnieuw.');
    }

    console.log('[Topical Map] Parsing JSON... (length:', jsonMatch[0].length, ')');
    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('[Topical Map] JSON parse error:', parseError);
      console.error('[Topical Map] Failed JSON:', jsonMatch[0].substring(0, 500));
      throw new Error('AI retourneerde ongeldige JSON structuur. Probeer opnieuw.');
    }
    console.log('[Topical Map] JSON parsed successfully, categories:', parsed.categories?.length || 0);
    
    // Valideer de structuur
    if (!parsed.categories || !Array.isArray(parsed.categories) || parsed.categories.length === 0) {
      console.error('[Topical Map] Invalid or empty categories array');
      throw new Error('AI retourneerde geen valide categories structuur');
    }

    // Validate that categories have subcategories
    const validCategories = parsed.categories.filter((cat: any) => 
      cat.subcategories && Array.isArray(cat.subcategories) && cat.subcategories.length > 0
    );

    if (validCategories.length === 0) {
      console.error('[Topical Map] No categories with valid subcategories');
      throw new Error('AI retourneerde geen valide subcategories');
    }

    console.log('[Topical Map] Valid categories:', validCategories.length);
    
    // Calculate statistics
    const totalArticles = parsed.totalArticles || 
      validCategories.reduce((sum: number, cat: any) => {
        return sum + (cat.subcategories || []).reduce((subSum: number, sub: any) => 
          subSum + (sub.articles || sub.topics?.length || 0), 0
        );
      }, 0);

    const estimatedMonths = Math.ceil(totalArticles / (5 * 4)); // 5 artikelen per week
    const seoOpportunityScore = calculateSEOOpportunity(parsed.categories);

    const result: TopicalMapResult = {
      mainTopic: config.mainTopic,
      totalArticles,
      categories: validCategories.map((cat: any) => ({
        name: cat.name,
        articleCount: (cat.subcategories || []).reduce((sum: number, sub: any) => 
          sum + (sub.articles || sub.topics?.length || 0), 0
        ),
        priority: cat.priority || 'medium',
        commercialRatio: cat.commercialRatio || config.commercialRatio || 0.4,
        subcategories: cat.subcategories
      })),
      estimatedMonths,
      seoOpportunityScore,
      internalLinkingStrategy: {
        hubPages: parsed.hubPages || [],
        clusterStructure: 'Hub & Spoke model met topic clusters'
      },
      // Voeg hubPages toe als property voor iteratieve merge
      hubPages: parsed.hubPages || []
    };

    console.log('[Topical Map] Generated:', {
      totalArticles: result.totalArticles,
      categories: result.categories.length,
      opportunity: result.seoOpportunityScore
    });

    return result;

  } catch (error) {
    console.error('[Topical Map] Generation error:', error);
    throw new Error(`Failed to generate topical map: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Berekent SEO opportunity score (0-10)
 */
function calculateSEOOpportunity(categories: any[]): number {
  // Factoren:
  // - Aantal categories (meer = beter)
  // - Balans tussen commercial/informational
  // - Diepte van subcategories
  
  const categoryScore = Math.min(categories.length / 10, 1) * 3;
  const depthScore = categories.some(c => c.subcategories?.length > 5) ? 3 : 2;
  const coverageScore = categories.length > 8 ? 4 : 3;
  
  return Math.round((categoryScore + depthScore + coverageScore) * 10) / 10;
}

/**
 * Identificeert nog niet gecoverde topics in een topical map
 */
export async function findUncoveredTopics(
  topicalMapId: string,
  prisma: any
): Promise<any[]> {
  const topicalMap = await prisma.topicalMap.findUnique({
    where: { id: topicalMapId },
    include: {
      categories: {
        include: {
          topics: {
            where: { isCompleted: false }
          }
        }
      }
    }
  });

  if (!topicalMap) {
    throw new Error('Topical map not found');
  }

  // Verzamel alle niet-gecoverde topics
  const uncovered: any[] = [];
  for (const category of topicalMap.categories) {
    uncovered.push(...category.topics);
  }

  return uncovered;
}

/**
 * Prioriteert topics op basis van SEO opportunity
 */
export function prioritizeTopics(
  topics: any[],
  mode: 'seo' | 'completion' | 'balanced' = 'balanced'
): any[] {
  return topics.sort((a, b) => {
    if (mode === 'seo') {
      // Sort op search volume / difficulty ratio
      const scoreA = (a.searchVolume || 100) / (a.difficulty || 50);
      const scoreB = (b.searchVolume || 100) / (b.difficulty || 50);
      return scoreB - scoreA;
    } else if (mode === 'completion') {
      // Sort op cluster completion (finish one cluster first)
      return a.categoryId === b.categoryId ? b.priority - a.priority : 0;
    } else {
      // Balanced: mix van SEO + priority
      const scoreA = a.priority + ((a.searchVolume || 100) / 100);
      const scoreB = b.priority + ((b.searchVolume || 100) / 100);
      return scoreB - scoreA;
    }
  });
}
