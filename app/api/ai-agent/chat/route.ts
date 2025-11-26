
/**
 * 🤖 WritgoAI DeepAgent - Native AIML Tool Calling API
 * 
 * Echte autonomous AI agent met computer access - precies zoals Abacus DeepAgent
 * - Native AIML tool calling (AI beslist zelf welke tools te gebruiken)
 * - Computer access (Bash Terminal, file operations, web search)
 * - Autonomous (geen vaste layouts, AI doet alles zelf)
 * - Simpel (geen complexe orchestration layers)
 */

// ⏱️ BELANGRIJKE CONFIGURATIE voor lange AI processen
// Review artikelen met verplichte web research kunnen 5+ minuten duren
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minuten timeout (was 60s standaard)
export const dynamic = 'force-dynamic'; // Altijd server-side rendering

import { NextRequest, NextResponse } from 'next/server';
import { DEEPAGENT_TOOLS, executeToolCall } from '@/lib/deepagent-tools';
import { hasEnoughCredits, deductCredits, calculateCreditCost } from '@/lib/credits';
import { withRateLimit } from '@/lib/rate-limiter';
import { validateInput, chatMessageSchema } from '@/lib/validation';
import { logAIGeneration, logError } from '@/lib/logger';
import { chatCompletion } from '@/lib/aiml-api';
import { getBannedWordsInstructions } from '@/lib/banned-words';

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

/**
 * 🧠 SLIMME MODEL ROUTING - Zoals ChatLLM RouteLLM
 * Kiest automatisch het beste AI model op basis van:
 * - Taak complexiteit (simpel → goedkoop, complex → premium)
 * - Conversatie lengte (korte chat → snel, lange thread → consistent)
 * - Content type (blog → creatief, code → logisch, research → diep)
 * - Kosten optimalisatie (90% besparingen mogelijk!)
 * 
 * Modellen database: https://docs.aimlapi.com/api-references/text-models-llm
 */
function selectOptimalModel(message: string, history: any[] = []): {
  model: string;
  reasoning: string;
  tier: 'budget' | 'balanced' | 'premium';
} {
  const msg = message.toLowerCase();
  const contextSize = history.length;
  const messageLength = message.length;
  
  // ═══════════════════════════════════════════════════════
  // 🎯 MODEL TIERS - Prijs/Kwaliteit Balance
  // ═══════════════════════════════════════════════════════
  
  const MODELS = {
    // 💎 PREMIUM - Beste kwaliteit, duur (complexe taken)
    premium: {
      primary: 'gpt-4o',                    // OpenAI GPT-4o - beste alles-in-één, STABIEL
      fallbacks: [
        'claude-sonnet-4-5',       // Anthropic - beste voor lange content
        'gemini-2.0-flash-exp',             // Google - Snelste Gemini
        'deepseek-chat',                    // DeepSeek - beste reasoning/prijs
      ]
    },
    
    // ⚖️ BALANCED - Goed genoeg, betaalbaar (meeste taken)
    balanced: {
      primary: 'gpt-4o-mini',               // OpenAI - Goede budget optie, STABIEL
      fallbacks: [
        'gemini-2.0-flash-exp',             // Google - Snelste + 1M context
        'deepseek-chat',                    // DeepSeek - Multi-taak
        'gpt-4o',                           // OpenAI - Premium fallback
      ]
    },
    
    // 💰 BUDGET - Snel en goedkoop (simpele vragen)
    budget: {
      primary: 'gpt-4o-mini',               // OpenAI - Snel en goedkoop, STABIEL
      fallbacks: [
        'gemini-2.0-flash-exp',             // Google - Ultra compact en snel
        'gpt-3.5-turbo',                    // OpenAI - Legacy maar betrouwbaar
        'deepseek-chat',                    // DeepSeek - Snel
      ]
    }
  };
  
  // ═══════════════════════════════════════════════════════
  // 🔍 TASK TYPE DETECTION - Wat wil de gebruiker?
  // ═══════════════════════════════════════════════════════
  
  // 🔴 PREMIUM TASKS - Vereisen beste modellen
  const premiumIndicators = {
    longContent: [
      'schrijf een blog', 'maak een artikel', 'write a blog', 'create article',
      'uitgebreide tekst', 'lange content', 'long form content',
      'seo blog', 'seo artikel', 'seo content'
    ],
    reasoning: [
      'analyseer', 'analyze', 'onderzoek', 'research',
      'leg uit waarom', 'explain why', 'redeneer', 'reason',
      'vergelijk', 'compare', 'evalueer', 'evaluate'
    ],
    creative: [
      'creatief', 'creative', 'origineel', 'unique',
      'bedenk', 'brainstorm', 'innovatief', 'innovative'
    ],
    technical: [
      'code schrijven', 'write code', 'programmeer', 'program',
      'debug', 'fix code', 'refactor', 'optimize code'
    ],
    strategy: [
      'strategie', 'strategy', 'planning', 'plan maken',
      'roadmap', 'stappenplan', 'actionable plan'
    ]
  };
  
  // 🟡 BALANCED TASKS - Standaard conversaties
  const balancedIndicators = {
    conversation: [
      'help me', 'help mij', 'kun je', 'can you',
      'hoe werkt', 'how does', 'wat is', 'what is',
      'leg uit', 'explain', 'vertel over', 'tell me about'
    ],
    quickContent: [
      'maak een post', 'create post', 'social media',
      'tweet', 'instagram caption', 'linkedin post',
      'korte tekst', 'short text', 'quick summary'
    ]
  };
  
  // 🟢 BUDGET TASKS - Simpele vragen
  const budgetIndicators = {
    simple: [
      'hoi', 'hello', 'hi', 'hey',
      'wat is', 'what is', 'wie is', 'who is',
      'wanneer', 'when', 'waar', 'where',
      'hoe laat', 'what time'
    ],
    factual: [
      'definitie', 'definition', 'betekenis', 'meaning',
      'kort antwoord', 'short answer', 'ja of nee', 'yes or no'
    ]
  };
  
  // ═══════════════════════════════════════════════════════
  // 🎯 INTELLIGENTE MODEL SELECTIE
  // ═══════════════════════════════════════════════════════
  
  // Check 1: Lange conversatie = consistentie belangrijk
  if (contextSize > 8) {
    return {
      model: MODELS.premium.primary,
      reasoning: `Lange conversatie (${contextSize} messages) - Premium model voor consistentie`,
      tier: 'premium'
    };
  }
  
  // Check 2: Zeer lange input = complex begrip nodig
  if (messageLength > 1000) {
    return {
      model: MODELS.premium.primary,
      reasoning: `Zeer lange input (${messageLength} chars) - Premium model voor diep begrip`,
      tier: 'premium'
    };
  }
  
  // Check 3: Premium task indicators
  for (const [category, indicators] of Object.entries(premiumIndicators)) {
    if (indicators.some(ind => msg.includes(ind))) {
      return {
        model: MODELS.premium.primary,
        reasoning: `Premium taak gedetecteerd (${category}) - Beste model voor kwaliteit`,
        tier: 'premium'
      };
    }
  }
  
  // Check 4: Budget task indicators
  for (const [category, indicators] of Object.entries(budgetIndicators)) {
    if (indicators.some(ind => msg.includes(ind))) {
      return {
        model: MODELS.budget.primary,
        reasoning: `Simpele vraag (${category}) - Budget model voor snelheid`,
        tier: 'budget'
      };
    }
  }
  
  // Check 5: Balanced task indicators
  for (const [category, indicators] of Object.entries(balancedIndicators)) {
    if (indicators.some(ind => msg.includes(ind))) {
      return {
        model: MODELS.balanced.primary,
        reasoning: `Standaard taak (${category}) - Balanced model voor efficiëntie`,
        tier: 'balanced'
      };
    }
  }
  
  // Check 6: Medium input length
  if (messageLength > 200) {
    return {
      model: MODELS.balanced.primary,
      reasoning: `Medium input (${messageLength} chars) - Balanced model geschikt`,
      tier: 'balanced'
    };
  }
  
  // Default: Use balanced model (beste prijs/kwaliteit verhouding)
  return {
    model: MODELS.balanced.primary,
    reasoning: 'Standaard query - Balanced model voor efficiëntie',
    tier: 'balanced'
  };
}

// Helper to send streaming updates
function createStreamUpdate(type: string, data: any) {
  return `data: ${JSON.stringify({ type, ...data })}\n\n`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, clientId, conversationHistory = [], stream = true, projectContext, toolMode, files = [], language = 'nl' } = body;

    // 🛡️ Rate limiting - Max 100 berichten per 15 min per user
    if (clientId) {
      const rateLimitResult = await withRateLimit(request, 'chat', clientId);
      if (rateLimitResult) return rateLimitResult;
    }

    console.log('🤖 DeepAgent request:', { 
      message: message ? message.substring(0, 100) : 'NO MESSAGE', 
      clientId,
      historyLength: conversationHistory?.length || 0,
      streamEnabled: stream
    });

    // 🛡️ Input validation
    const validation = validateInput(chatMessageSchema, {
      message,
      conversationId: body.conversationId,
    });

    if (!validation.success) {
      console.error('❌ Validation failed:', validation.error);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Validate conversationHistory is array
    const history = Array.isArray(conversationHistory) ? conversationHistory : [];
    
    console.log('✅ Valid request:', { messageLength: message.length, historyCount: history.length });

    // 🧠 MULTI-MODEL INTELLIGENCE SYSTEM
    // Detecteer taak type op basis van toolMode en message
    let taskType: any = 'chat';
    let complexity: 'simple' | 'medium' | 'complex' = 'medium';
    
    if (toolMode === 'blog') {
      taskType = message.toLowerCase().includes('research') || message.toLowerCase().includes('onderzoek') 
        ? 'blog_research' 
        : 'blog_writing';
      complexity = 'complex';
    } else if (toolMode === 'video') {
      taskType = 'video_script';
      complexity = 'medium';
    } else if (toolMode === 'social') {
      taskType = 'social_media';
      complexity = 'simple';
    } else if (toolMode === 'keyword') {
      taskType = 'keyword_research';
      complexity = 'medium';
    } else if (toolMode === 'code') {
      taskType = 'code_generation';
      complexity = 'medium';
    } else {
      // Auto-detect based on message content
      const msg = message.toLowerCase();
      if (msg.includes('blog') || msg.includes('artikel')) {
        taskType = 'blog_writing';
        complexity = 'complex';
      } else if (msg.includes('code') || msg.includes('programmeer')) {
        taskType = 'code_generation';
      } else if (msg.includes('strategie') || msg.includes('plan')) {
        taskType = 'strategic_planning';
        complexity = 'complex';
      } else if (msg.includes('zoek') || msg.includes('search') || msg.includes('wat is') || msg.includes('wie is') || msg.includes('waar is') || msg.includes('wanneer') || msg.includes('hoe')) {
        taskType = 'web_search';
        complexity = 'medium';
      }
    }
    
    // Selecteer multi-model strategie
    const { selectOptimalModelForTask } = await import('@/lib/aiml-api');
    const modelStrategy = selectOptimalModelForTask(taskType, complexity, 'balanced');
    const model = modelStrategy.primary.model;
    
    console.log(`🎯 Multi-Model Intelligence:`, {
      task: taskType,
      complexity,
      primaryModel: model,
      reason: modelStrategy.primary.reason,
      tier: modelStrategy.primary.tier,
      toolSpecific: Object.keys(modelStrategy.toolSpecific || {})
    });

    // 💳 Credit Check (met juiste model cost)
    if (clientId) {
      const creditCost = calculateCreditCost('chat', model);
      const hasCredits = await hasEnoughCredits(clientId, creditCost);
      
      if (!hasCredits) {
        return NextResponse.json(
          { 
            error: 'Insufficient credits',
            message: 'Je hebt niet genoeg credits. Koop nieuwe credits om door te gaan.',
            requiredCredits: creditCost
          },
          { status: 402 }
        );
      }
    }

    // 📝 SEO BLOG WORKFLOW DETECTION - Automatisch uitvoeren zonder zichtbare prompt
    let enhancedMessage = message;
    
    // 📎 FILE UPLOAD SUPPORT - Voeg file info toe aan bericht
    let hasImages = false;
    const imageFiles: any[] = [];
    
    if (files && files.length > 0) {
      enhancedMessage += `\n\n📎 **Geüploade bestanden:**\n`;
      files.forEach((file: any, index: number) => {
        enhancedMessage += `${index + 1}. ${file.name} (${file.type})\n`;
        
        // Check if it's an image
        if (file.type && file.type.startsWith('image/')) {
          hasImages = true;
          imageFiles.push(file);
        }
        
        // Voeg file data toe voor analyse
        if (file.content) {
          // Als het een tekst bestand is, voeg de content direct toe
          if (file.type.includes('text') || file.name.endsWith('.txt')) {
            enhancedMessage += `\nInhoud:\n${file.content.substring(0, 1000)}...\n`;
          }
        }
      });
      
      // Voor images, gebruik vision analysis
      if (hasImages) {
        enhancedMessage += `\n🖼️ Er zijn ${imageFiles.length} afbeelding(en) geüpload. Deze worden geanalyseerd met AI vision.`;
      }
      
      enhancedMessage += `\n💡 Analyseer deze bestanden en beantwoord de vraag op basis van de content.`;
    }

    // Build tool-specific context
    let toolSpecificContext = '';
    
    if (toolMode === 'blog') {
      toolSpecificContext = `
🎯 ACTIVE TOOL: SEO Blog Writing
De gebruiker heeft de Blog Generator tool gekozen. Focus op:
- SEO-geoptimaliseerde content met web research
- Professionele blog structuur met koppen
- Keyword optimalisatie en interne links
`;
    } else if (toolMode === 'video') {
      toolSpecificContext = `
🎯 ACTIVE TOOL: Video Generator
De gebruiker heeft de Video Generator tool gekozen. Focus op:
- Video scripts voor TikTok/Reels/YouTube
- Visuele storytelling en video concepten
- Engagement-gerichte video content
`;
    } else if (toolMode === 'social') {
      toolSpecificContext = `
🎯 ACTIVE TOOL: Social Media Posts
De gebruiker heeft de Social Media tool gekozen. Focus op:
- Engaging posts voor Instagram/LinkedIn/Facebook
- Platform-specifieke optimalisatie
- Hashtags en engagement strategieën
`;
    } else if (toolMode === 'keyword') {
      toolSpecificContext = `
🎯 ACTIVE TOOL: Keyword Research
De gebruiker heeft de Keyword Research tool gekozen. Focus op:
- Long-tail keyword opportunities
- Search volume en competitie analyse
- Content strategie aanbevelingen
`;
    } else if (toolMode === 'code') {
      toolSpecificContext = `
🎯 ACTIVE TOOL: Code Generator
De gebruiker heeft de Code Generator tool gekozen. Focus op:
- Professionele HTML/CSS/JavaScript code
- Responsive en moderne design
- Clean, gestructureerde code met comments
`;
    }

    // System prompt voor DeepAgent - DIRECT EN EFFICIENT
    const systemMessage: Message = {
      role: 'system',
      content: `Je bent WritgoAI - een snelle, slimme AI assistent die meedenkt.

${projectContext ? `📌 PROJECT: ${projectContext.name} | ${projectContext.websiteUrl}
` : ''}${toolSpecificContext}

🎯 BASISPRINCIPE: Vraag ALTIJD om details bij creatieve verzoeken!

═══════════════════════════════════════════════════════════
🎨 CREATIEVE VERZOEKEN - EERST VERDUIDELIJKEN
═══════════════════════════════════════════════════════════
Bij verzoeken om afbeeldingen, video's of creatieve content:
**ALTIJD EERST VRAGEN OM DETAILS!**

Voorbeelden:
• "Maak een afbeelding van een hond"
  → Vraag: Welke stijl? (realistisch/cartoon/3D) Welk ras? Wat doet de hond? Welk formaat (vierkant/horizontaal/verticaal)?
  
• "Genereer een video over [onderwerp]"
  → Vraag: Welke stijl? Welke toon (professioneel/casual)? Hoe lang? Met welke stem? Met muziek?
  
• "Schrijf een blog over [onderwerp]"
  → Vraag: Hoe lang (500/1000/1500+ woorden)? Welke toon? SEO geoptimaliseerd? Met afbeelding?

**NOOIT direct genereren zonder deze details!**

═══════════════════════════════════════════════════════════
✅ 90% VAN VRAGEN - DIRECT ANTWOORDEN
═══════════════════════════════════════════════════════════
GEEN planning, GEEN lange uitleg, DIRECT antwoord geven!

Voorbeelden die DIRECT beantwoord moeten:
• "Hoe werkt WordPress?" → Directe uitleg (100-200 woorden)
• "Wat is SEO?" → Direct antwoord met praktische tips
• "Wanneer posten op Instagram?" → Direct antwoord met tijden
• "Wat zijn goede keywords?" → Direct lijst met tips
• "Leg [onderwerp] uit" → Directe heldere uitleg
• Algemene vragen over marketing/social media/websites

➡️ **GEWOON ANTWOORDEN - GEEN GEDOE!**

🎯 REGEL: GEWONE VRAGEN = DIRECT ANTWOORD

═══════════════════════════════════════════════════════════
✅ 90% VAN VRAGEN - DIRECT ANTWOORDEN
═══════════════════════════════════════════════════════════
GEEN planning, GEEN lange uitleg, DIRECT antwoord geven!

Voorbeelden die DIRECT beantwoord moeten:
• "Hoe werkt WordPress?" → Directe uitleg (100-200 woorden)
• "Wat is SEO?" → Direct antwoord met praktische tips
• "Wanneer posten op Instagram?" → Direct antwoord met tijden
• "Wat zijn goede keywords?" → Direct lijst met tips
• "Leg [onderwerp] uit" → Directe heldere uitleg
• Algemene vragen over marketing/social media/websites

➡️ **GEWOON ANTWOORDEN - GEEN GEDOE!**

═══════════════════════════════════════════════════════════
✍️ ALLEEN VOOR BLOGS - VOORSTEL MAKEN
═══════════════════════════════════════════════════════════
**ALLEEN** bij expliciet blog verzoek:
• "Schrijf een blog over [onderwerp]"
• "Maak een SEO artikel over [onderwerp]"
• "Genereer content over [onderwerp]"

➡️ DAN pas voorstel maken:
📝 **Onderwerp:** [onderwerp]
📊 **Lengte:** 1000 woorden (of anders aangegeven)
🎯 **Focus:** SEO geoptimaliseerd
✅ "Akkoord?"

Na goedkeuring: gebruik generate_blog tool

═══════════════════════════════════════════════════════════
🛠️ TOOLS - Gebruik alleen als echt nodig
═══════════════════════════════════════════════════════════
• **generate_blog** - Alleen NA expliciete blog aanvraag + goedkeuring
• **web_search** - Voor actuele/real-time info (zie hieronder)
• **generate_video** - Voor video verzoeken (NA voorstel)

⚠️ WEB SEARCH - WANNEER WEL/NIET GEBRUIKEN:

✅ **WEL WEB SEARCH voor:**
• Actueel nieuws & gebeurtenissen (storm Melissa, verkiezingen, etc.)
• Huidige prijzen & aanbiedingen
• Weersvoorspellingen & actuele temperatuur
• Trending topics op social media
• Recente sportresultaten
• Actuele verkeerssituatie
• Nieuwe producten/releases
• Live koersen (crypto, aandelen)
• Recente statistieken & cijfers
• "Wat gebeurt er vandaag/nu..."

❌ **GEEN WEB SEARCH voor:**
• Algemene kennis: "Hoeveel weegt een banaan?"
• Definities: "Wat is SEO?"
• Uitleg: "Hoe werkt WordPress?"
• Tips & trucs: "Beste tijden Instagram posten"
• Historische feiten: "Wanneer werd Nederland onafhankelijk?"
• Algemene vragen die geen actuele data nodig hebben

💡 **VUISTREGEL:**
Als de vraag ACTUELE/REAL-TIME informatie vereist → web_search
Als je het antwoord al weet zonder actuele data → direct antwoorden

═══════════════════════════════════════════════════════════
📋 GEDRAGSREGELS
═══════════════════════════════════════════════════════════
✅ WEL:
• Direct antwoorden zonder gedoe
• Kort en krachtig (100-250 woorden)
• Vriendelijk en professioneel
• Actie gerichte tips

❌ NIET:
• Planning maken voor simpele vragen
• Lange introductie of context
• "Laat me even nadenken..." 
• Tools voor algemene vragen

═══════════════════════════════════════════════════════════
${getBannedWordsInstructions()}
═══════════════════════════════════════════════════════════

Gebruik directe Markdown formatting.

Model: ${model}`,
    };

    // Build messages array - Filter en valideer alle messages
    const validHistory = history
      .filter((msg: any) => {
        // Basis validatie: moet een role hebben
        if (!msg || !msg.role || typeof msg.role !== 'string') {
          console.warn('⚠️ Invalid message skipped - no role:', msg);
          return false;
        }
        
        // BELANGRIJKE FIX: Tool response messages moeten content hebben
        // MAAR als content null/undefined is, dan fixen we dit later
        if (msg.role === 'tool') {
          // Accepteer tool messages zelfs zonder content (we fixen het later)
          return true;
        }
        
        // Assistant messages met tool_calls mogen geen content hebben
        if (msg.role === 'assistant' && msg.tool_calls && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
          return true;
        }
        
        // Alle andere messages (user, assistant zonder tool_calls) moeten content hebben
        if (msg.role === 'user' || msg.role === 'assistant') {
          return msg.content && typeof msg.content === 'string' && msg.content.trim() !== '';
        }
        
        return false;
      })
      .map((msg: any) => {
        // Build proper message object
        const cleanMsg: any = {
          role: msg.role,
        };
        
        // KRITIEKE FIX: content mag NOOIT null of undefined zijn!
        // AIML API accepteert ALLEEN:
        // - Voor tool messages: non-empty string content
        // - Voor assistant messages met tool_calls: GEEN content property of null
        // - Voor alle andere: non-empty string content
        
        if (msg.role === 'tool') {
          // Tool messages MOETEN altijd content hebben
          if (msg.content && typeof msg.content === 'string' && msg.content.trim() !== '') {
            cleanMsg.content = msg.content.trim();
          } else {
            // FALLBACK: als tool geen content heeft, geef default message
            cleanMsg.content = 'Tool execution completed';
          }
          
          // Tool messages moeten ook tool_call_id hebben
          if (msg.tool_call_id) {
            cleanMsg.tool_call_id = msg.tool_call_id;
          }
        } else if (msg.role === 'assistant' && msg.tool_calls && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
          // Assistant messages met tool_calls: OMIT content field (AIML doesn't accept null)
          // Don't set content at all
          cleanMsg.tool_calls = msg.tool_calls;
        } else {
          // Alle andere messages: content moet een non-empty string zijn
          if (msg.content && typeof msg.content === 'string' && msg.content.trim() !== '') {
            cleanMsg.content = msg.content.trim();
          } else {
            // Fallback voor veiligheid
            cleanMsg.content = '...';
          }
        }
        
        return cleanMsg;
      });
    
    console.log(`✅ Filtered history: ${validHistory.length} valid messages`);

    // Build user message - with vision support for images
    let userMessage: any = {
      role: 'user',
    };
    
    if (hasImages && imageFiles.length > 0) {
      // Vision message format with images
      const content: any[] = [
        {
          type: 'text',
          text: enhancedMessage
        }
      ];
      
      // Add all image URLs
      for (const img of imageFiles) {
        if (img.url) {
          content.push({
            type: 'image_url',
            image_url: {
              url: img.url,
              detail: 'high'
            }
          });
        }
      }
      
      userMessage.content = content;
      
      console.log(`🖼️ Added ${imageFiles.length} images to vision analysis`);
    } else {
      // Regular text message
      userMessage.content = enhancedMessage;
    }
    
    const messages: Message[] = [
      systemMessage,
      ...validHistory,
      userMessage,
    ];

    // 🌊 Streaming Response
    if (stream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          // 🔥 GLOBALE HEARTBEAT - Houdt HTTP/2 connectie ALTIJD levend
          // Dit voorkomt ERR_QUIC_PROTOCOL_ERROR tijdens AI denktijd tussen tools
          let globalHeartbeatInterval: NodeJS.Timeout | null = null;
          let globalHeartbeatCount = 0;
          
          const startGlobalHeartbeat = () => {
            if (globalHeartbeatInterval) return; // Al actief
            globalHeartbeatInterval = setInterval(() => {
              globalHeartbeatCount++;
              try {
                const elapsed = globalHeartbeatCount * 5;
                let heartbeatMsg = `🤖 AI is bezig... (${elapsed}s)`;
                
                // Voeg extra context toe op basis van hoe lang het duurt
                if (elapsed > 30 && elapsed <= 60) {
                  heartbeatMsg = `🤖 AI verwerkt complexe taak... (${elapsed}s) - Even geduld`;
                } else if (elapsed > 60 && elapsed <= 120) {
                  heartbeatMsg = `⏳ Grondig onderzoek aan de gang... (${elapsed}s) - Bijna klaar`;
                } else if (elapsed > 120) {
                  heartbeatMsg = `🔬 Uitgebreide analyse... (${elapsed}s) - Laatste stappen`;
                }
                
                controller.enqueue(encoder.encode(createStreamUpdate('heartbeat', {
                  message: heartbeatMsg,
                  elapsed: elapsed,
                  global: true
                })));
              } catch (e) {
                // Ignore errors if stream is closed
              }
            }, 5000); // Elke 5 seconden (sneller dan 10s voor robuustere connectie)
          };
          
          const stopGlobalHeartbeat = () => {
            if (globalHeartbeatInterval) {
              clearInterval(globalHeartbeatInterval);
              globalHeartbeatInterval = null;
            }
          };
          
          try {
            // Start globale heartbeat meteen bij start van request
            startGlobalHeartbeat();
            
            // Send initial status
            controller.enqueue(encoder.encode(createStreamUpdate('status', { 
              message: '🤖 DeepAgent wordt geactiveerd...',
              step: 0
            })));

            // Track tool calls and iterations
            // VERLAAGD naar 12 voor snellere performance
            const maxIterations = 12;
            let iteration = 0;
            let continueLoop = true;
            const toolExecutionLog: Array<{tool: string; args: any; result: string}> = [];
            
            // 🎯 MODEL TRACKING - Houdt bij welke modellen gebruikt zijn
            const modelsUsed: Array<{
              step: number;
              phase: string;
              model: string;
              reason: string;
              tier: string;
            }> = [];
            
            // Track primary model
            modelsUsed.push({
              step: 0,
              phase: 'initialization',
              model: model,
              reason: modelStrategy.primary.reason,
              tier: modelStrategy.primary.tier
            });

            while (continueLoop && iteration < maxIterations) {
              iteration++;
              console.log(`🔄 Iteration ${iteration}/${maxIterations}`);
              
              // Bereken voortgang percentage
              const progress = Math.round((iteration / maxIterations) * 100);
              
              // Bepaal wat er gebeurt op basis van iteration number
              let statusMessage = '';
              if (iteration === 1) {
                statusMessage = '🧠 AI analyseert je vraag...';
              } else if (iteration < 4) {
                statusMessage = '🔍 Verzamel informatie...';
              } else if (iteration < 8) {
                statusMessage = '⚙️ Genereer content...';
              } else {
                statusMessage = '✨ Finaliseer resultaat...';
              }

              controller.enqueue(encoder.encode(createStreamUpdate('status', {
                message: statusMessage,
                step: iteration,
                progress: progress,
                maxSteps: maxIterations
              })));

              // Prepare clean messages for AIML API
              // BELANGRIJK: AIML API is strikt over message format
              const cleanMessages = messages.map(msg => {
                const clean: any = { role: msg.role };
                
                // Content handling per role type
                if (msg.role === 'tool') {
                  // Tool messages MOETEN string content hebben
                  clean.content = (msg.content && typeof msg.content === 'string' && msg.content.trim()) 
                    ? msg.content.trim() 
                    : 'Tool execution completed';
                  if (msg.tool_call_id) clean.tool_call_id = msg.tool_call_id;
                } else if (msg.role === 'assistant' && msg.tool_calls && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
                  // Assistant met tool_calls: OMIT content field (AIML doesn't accept null)
                  // Don't set content at all
                  clean.tool_calls = msg.tool_calls;
                } else {
                  // Alle andere messages: string content required
                  clean.content = (msg.content && typeof msg.content === 'string' && msg.content.trim())
                    ? msg.content.trim()
                    : '...';
                }
                
                return clean;
              });

              // Call AI API with proper format conversion
              let data;
              try {
                data = await chatCompletion({
                  model,
                  messages: cleanMessages,
                  tools: DEEPAGENT_TOOLS,
                  tool_choice: 'auto',
                  temperature: 0.7,
                  max_tokens: model.includes('gemini') ? 8000 : 4000,
                });
              } catch (error: any) {
                console.error('❌ AIML API Error:', {
                  error: error.message,
                  model: model,
                  messages: cleanMessages.length,
                  tools: DEEPAGENT_TOOLS.length
                });
                stopGlobalHeartbeat();
                controller.enqueue(encoder.encode(createStreamUpdate('error', {
                  message: 'Er ging iets mis met de AI. Probeer het opnieuw.',
                  details: error.message
                })));
                controller.close();
                return;
              }

              const choice = data.choices[0];
              const assistantMessage = choice.message;

              messages.push(assistantMessage);

              // Check for tool calls
              if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
                // Execute tools with progress updates
                for (const toolCall of assistantMessage.tool_calls) {
                  const { id, function: func } = toolCall;
                  const toolName = func.name;
                  const args = JSON.parse(func.arguments);

                  // Send tool execution status with appropriate icon and message
                  let statusMessage = '';
                  let icon = '🔧';
                  
                  switch(toolName) {
                    case 'web_search':
                      icon = '🔍';
                      statusMessage = `Zoeken op internet naar: "${args.query || args.queries?.[0] || 'informatie'}"...`;
                      break;
                    case 'scan_website':
                      icon = '🌐';
                      statusMessage = `Website scannen: ${args.url}...`;
                      break;
                    case 'generate_blog':
                      icon = '✍️';
                      statusMessage = `Blog genereren over: "${args.topic}"...`;
                      break;
                    case 'generate_image':
                      icon = '🎨';
                      statusMessage = `Afbeelding genereren: "${args.description.substring(0, 50)}..."`;
                      break;
                    case 'generate_video':
                      icon = '🎬';
                      statusMessage = `Video genereren: "${args.topic}"...`;
                      break;
                    case 'bash_command':
                      icon = '💻';
                      statusMessage = `Terminal command uitvoeren...`;
                      break;
                    case 'read_file':
                      icon = '📖';
                      statusMessage = `Bestand lezen: ${args.path}`;
                      break;
                    case 'write_file':
                      icon = '📝';
                      statusMessage = `Bestand schrijven: ${args.path}`;
                      break;
                    default:
                      statusMessage = `${toolName} uitvoeren...`;
                  }

                  controller.enqueue(encoder.encode(createStreamUpdate('tool_start', {
                    tool: toolName,
                    message: `${icon} ${statusMessage}`,
                    args: args
                  })));

                  try {
                    // 🔥 HEARTBEAT SYSTEM - houdt HTTP/2 connection levend tijdens lange tool executions
                    // Zonder dit krijg je ERR_HTTP2_PROTOCOL_ERROR na ~60s
                    let heartbeatInterval: NodeJS.Timeout | null = null;
                    let heartbeatCount = 0;
                    
                    // Start heartbeat voor tools die >30 seconden kunnen duren
                    const longRunningTools = ['generate_video', 'generate_blog', 'generate_linkbuilding_article', 'generate_image', 'web_search', 'research_topic', 'browse_website', 'scan_website'];
                    if (longRunningTools.includes(toolName)) {
                      heartbeatInterval = setInterval(() => {
                        heartbeatCount++;
                        const elapsed = heartbeatCount * 10;
                        
                        // Tool-specifieke voortgangsberichten
                        let progressMsg = statusMessage;
                        if (elapsed > 20 && elapsed <= 40) {
                          progressMsg = `${statusMessage} - Verwerking bezig`;
                        } else if (elapsed > 40 && elapsed <= 60) {
                          progressMsg = `${statusMessage} - Bijna klaar`;
                        } else if (elapsed > 60) {
                          progressMsg = `${statusMessage} - Laatste details`;
                        }
                        
                        controller.enqueue(encoder.encode(createStreamUpdate('heartbeat', {
                          tool: toolName,
                          message: `⏳ ${icon} ${progressMsg} (${elapsed}s)`,
                          elapsed: elapsed
                        })));
                      }, 10000); // Elke 10 seconden een update
                    }
                    
                    const result = await executeToolCall(toolName, args, clientId);
                    
                    // Stop heartbeat
                    if (heartbeatInterval) {
                      clearInterval(heartbeatInterval);
                    }
                    
                    toolExecutionLog.push({ tool: toolName, args, result: result.substring(0, 500) });

                    messages.push({
                      role: 'tool',
                      tool_call_id: id,
                      content: result,
                    });

                    controller.enqueue(encoder.encode(createStreamUpdate('tool_complete', {
                      tool: toolName,
                      message: `✅ ${toolName} voltooid`,
                      preview: result.substring(0, 200)
                    })));
                    
                    // 🎨 IMAGE GENERATION SUPPORT - Stuur images naar frontend
                    if (toolName === 'generate_image' && result.includes('http')) {
                      // Extract image URLs from result
                      const imageUrls = result.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/gi) || [];
                      if (imageUrls.length > 0) {
                        controller.enqueue(encoder.encode(createStreamUpdate('image_generated', {
                          images: imageUrls,
                          tool: toolName,
                          args: args
                        })));
                      }
                    }
                  } catch (error: any) {
                    messages.push({
                      role: 'tool',
                      tool_call_id: id,
                      content: `Error: ${error.message}`,
                    });

                    controller.enqueue(encoder.encode(createStreamUpdate('tool_error', {
                      tool: toolName,
                      message: `⚠️ ${toolName} mislukt: ${error.message}`
                    })));
                  }
                }
                continue;
              }

              // If no tool calls, send final response with WORD-BY-WORD STREAMING
              if (assistantMessage.content) {
                // Deduct credits
                if (clientId) {
                  const creditCost = calculateCreditCost('chat', model);
                  await deductCredits(
                    clientId,
                    creditCost,
                    `DeepAgent Chat (${model}) - Tools: ${toolExecutionLog.map(t => t.tool).join(', ')}`,
                    { model }
                  );
                }
                
                // Send model transparency info
                controller.enqueue(encoder.encode(createStreamUpdate('models_used', {
                  models: modelsUsed,
                  primary: {
                    model: model,
                    reason: modelStrategy.primary.reason,
                    tier: modelStrategy.primary.tier,
                    category: modelStrategy.primary.category
                  },
                  toolSpecific: modelStrategy.toolSpecific
                })));

                // 💬 WORD-BY-WORD STREAMING zoals ChatGPT
                const words = assistantMessage.content.split(' ');
                let streamedContent = '';
                
                controller.enqueue(encoder.encode(createStreamUpdate('streaming_start', {
                  message: '💬 Antwoord genereren...',
                  totalWords: words.length,
                })));
                
                // Stream woord voor woord met natuurlijke timing
                for (let i = 0; i < words.length; i++) {
                  const word = words[i];
                  streamedContent += (i > 0 ? ' ' : '') + word;
                  
                  // Send het woord
                  controller.enqueue(encoder.encode(createStreamUpdate('word', {
                    word: word,
                    content: streamedContent,
                    progress: Math.round(((i + 1) / words.length) * 100),
                  })));
                  
                  // Natuurlijke delay: korter voor korte woorden, langer voor lange woorden
                  // Gemiddeld ~50ms per woord voor natuurlijk gevoel
                  const delay = Math.min(20 + word.length * 3, 100);
                  await new Promise(resolve => setTimeout(resolve, delay));
                }

                // Send complete bericht
                controller.enqueue(encoder.encode(createStreamUpdate('complete', {
                  message: assistantMessage.content,
                  toolsUsed: toolExecutionLog,
                  iterations: iteration,
                  model,
                  modelReasoning: modelStrategy.primary.reason,
                  modelInfo: {
                    primary: {
                      model: model,
                      reason: modelStrategy.primary.reason,
                      tier: modelStrategy.primary.tier,
                      category: modelStrategy.primary.category
                    }
                  }
                })));
                
                stopGlobalHeartbeat();
                controller.close();
                return;
              } else {
                // No content in response - this is an error
                // Send a fallback message so the frontend doesn't hang
                console.warn('⚠️ AI returned empty response after tools');
                
                // Deduct credits anyway (API was called)
                if (clientId) {
                  const creditCost = calculateCreditCost('chat', model);
                  await deductCredits(
                    clientId,
                    creditCost,
                    `DeepAgent Chat (${model}) - Empty response`,
                    { model }
                  );
                }
                
                controller.enqueue(encoder.encode(createStreamUpdate('complete', {
                  message: 'Sorry, ik kon geen antwoord genereren. Probeer je vraag anders te formuleren.',
                  toolsUsed: toolExecutionLog,
                  iterations: iteration,
                  model,
                  modelReasoning: modelStrategy.primary.reason
                })));
                
                stopGlobalHeartbeat();
                controller.close();
                return;
              }

              continueLoop = false;
            }

            if (iteration >= maxIterations) {
              controller.enqueue(encoder.encode(createStreamUpdate('error', {
                message: 'Maximum aantal stappen bereikt. Probeer de vraag anders te formuleren.'
              })));
            }

            // Stop globale heartbeat voor we afsluiten
            stopGlobalHeartbeat();
            controller.close();
          } catch (error: any) {
            // Stop globale heartbeat ook bij error
            stopGlobalHeartbeat();
            controller.enqueue(encoder.encode(createStreamUpdate('error', {
              message: 'Er ging iets mis. Probeer het opnieuw.',
              details: error.message
            })));
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // 📦 Non-streaming fallback (legacy)
    // VERLAAGD naar 12 voor snellere performance
    const maxIterations = 12; // Prevent infinite loops
    let iteration = 0;
    let continueLoop = true;
    const toolExecutionLog: Array<{tool: string; args: any; result: string}> = [];

    while (continueLoop && iteration < maxIterations) {
      iteration++;
      console.log(`🔄 Iteration ${iteration}/${maxIterations}`);

      // Prepare clean messages for AIML API
      // BELANGRIJK: AIML API is strikt over message format
      const cleanMessages = messages.map(msg => {
        const clean: any = { role: msg.role };
        
        // Content handling per role type
        if (msg.role === 'tool') {
          // Tool messages MOETEN string content hebben
          clean.content = (msg.content && typeof msg.content === 'string' && msg.content.trim()) 
            ? msg.content.trim() 
            : 'Tool execution completed';
          if (msg.tool_call_id) clean.tool_call_id = msg.tool_call_id;
        } else if (msg.role === 'assistant' && msg.tool_calls && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
          // Assistant met tool_calls: OMIT content field (AIML doesn't accept null)
          // Don't set content at all
          clean.tool_calls = msg.tool_calls;
        } else {
          // Alle andere messages: string content required
          clean.content = (msg.content && typeof msg.content === 'string' && msg.content.trim())
            ? msg.content.trim()
            : '...';
        }
        
        return clean;
      });

      console.log('📤 Sending to AIML:', {
        messageCount: cleanMessages.length,
        lastMessage: cleanMessages[cleanMessages.length - 1]?.content?.substring(0, 100),
        model,
        toolsCount: DEEPAGENT_TOOLS.length,
        firstTool: DEEPAGENT_TOOLS[0]?.function?.name,
      });

      // Call AIML API with native tool calling (met geselecteerd model) and proper format conversion
      let data;
      try {
        data = await chatCompletion({
          model, // 🧠 Gebruikt automatisch geselecteerd model
          messages: cleanMessages,
          tools: DEEPAGENT_TOOLS,
          tool_choice: 'auto', // Let AI decide when to use tools
          temperature: 0.7,
          max_tokens: model.includes('gemini') ? 8000 : 4000, // Gemini heeft hogere token limit
        });
      } catch (error: any) {
        console.error('❌ AIML API error:', error.message);
        
        // Specifieke foutmeldingen op basis van error type
        let userMessage = 'Sorry, er ging iets fout. Probeer het opnieuw.';
        const errorMessage = error.message || '';
        
        if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
          userMessage = 'De AI is momenteel druk bezet. Wacht even en probeer het opnieuw.';
        } else if (errorMessage.includes('503') || errorMessage.includes('504') || errorMessage.includes('unavailable')) {
          userMessage = 'De AI server reageert niet. Probeer het over een paar seconden opnieuw.';
        } else if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
          userMessage = 'Je vraag was te complex. Probeer het in kleinere stappen.';
        } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          userMessage = 'De vraag duurde te lang. Probeer een simpelere vraag of splits het op in delen.';
        }
        
        return NextResponse.json(
          { 
            error: 'AI API fout',
            details: errorMessage,
            message: userMessage,
            debug: {
              model,
              messageCount: cleanMessages.length,
            }
          },
          { status: 500 }
        );
      }
      
      if (!data.choices || !data.choices[0]) {
        console.error('❌ Invalid AI response:', data);
        return NextResponse.json(
          { 
            error: 'Invalid AI response',
            message: 'De AI gaf geen geldig antwoord. Probeer het opnieuw.',
          },
          { status: 500 }
        );
      }

      const choice = data.choices[0];
      const assistantMessage = choice.message;

      console.log('🤖 AI response:', {
        hasContent: !!assistantMessage.content,
        hasToolCalls: !!assistantMessage.tool_calls,
        finishReason: choice.finish_reason,
      });

      // Add assistant message to history
      messages.push(assistantMessage);

      // Check if AI wants to use tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log(`🔧 AI wants to use ${assistantMessage.tool_calls.length} tools`);

        // Execute all tool calls
        for (const toolCall of assistantMessage.tool_calls) {
          const { id, function: func } = toolCall;
          const toolName = func.name;
          const args = JSON.parse(func.arguments);

          console.log(`🔧 Executing: ${toolName}`, args);

          try {
            const result = await executeToolCall(toolName, args, clientId);
            
            toolExecutionLog.push({ tool: toolName, args, result: result.substring(0, 500) });

            // Add tool result to messages
            messages.push({
              role: 'tool',
              tool_call_id: id,
              content: result,
            });

            console.log(`✅ Tool ${toolName} succeeded`);
          } catch (error: any) {
            console.error(`❌ Tool ${toolName} failed:`, error);
            
            // Add error to messages so AI knows it failed
            messages.push({
              role: 'tool',
              tool_call_id: id,
              content: `Error: ${error.message}`,
            });
          }
        }

        // Continue loop to let AI process tool results
        continue;
      }

      // If no tool calls, we're done
      if (assistantMessage.content) {
        console.log('✅ AI provided final answer');
        
        // 💳 Deduct credits (met juist model)
        if (clientId) {
          const creditCost = calculateCreditCost('chat', model);
          await deductCredits(
            clientId,
            creditCost,
            `DeepAgent Chat (${model}) - ${iteration} iterations - Tools: ${toolExecutionLog.map(t => t.tool).join(', ')}`,
            {
              model,
              tokensUsed: Math.round((message.length + assistantMessage.content.length) / 4),
            }
          );
          console.log(`💳 Deducted ${creditCost} credits for ${model}`);
        }

        // Return final response (inclusief model info)
        return NextResponse.json({
          success: true,
          message: assistantMessage.content,
          toolsUsed: toolExecutionLog.map(t => ({ tool: t.tool, args: t.args })),
          iterations: iteration,
          modelInfo: {
            primary: {
              model: model,
              reason: modelStrategy.primary.reason,
              tier: modelStrategy.primary.tier,
              category: modelStrategy.primary.category
            },
            toolSpecific: modelStrategy.toolSpecific
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        // No content - return fallback message
        console.warn('⚠️ AI returned empty response');
        
        // 💳 Deduct credits anyway (API was called)
        if (clientId) {
          const creditCost = calculateCreditCost('chat', model);
          await deductCredits(
            clientId,
            creditCost,
            `DeepAgent Chat (${model}) - Empty response`,
            { model }
          );
        }
        
        return NextResponse.json({
          success: true,
          message: 'Sorry, ik kon geen antwoord genereren. Probeer je vraag anders te formuleren.',
          toolsUsed: toolExecutionLog.map(t => ({ tool: t.tool, args: t.args })),
          iterations: iteration,
          modelInfo: {
            primary: {
              model: model,
              reason: modelStrategy.primary.reason,
              tier: modelStrategy.primary.tier,
              category: modelStrategy.primary.category
            }
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Safety: if we get here without content or tool calls, break
      console.warn('⚠️ No content or tool calls, breaking loop');
      continueLoop = false;
    }

    // If we hit max iterations
    if (iteration >= maxIterations) {
      console.error('❌ Max iterations reached');
      return NextResponse.json(
        { error: 'Max iterations reached. The AI got stuck in a loop.' },
        { status: 500 }
      );
    }

    // Fallback error
    return NextResponse.json(
      { error: 'AI did not provide a response' },
      { status: 500 }
    );

  } catch (error: any) {
    console.error('❌ Chat API error:', error);
    
    // Specifieke foutmeldingen
    let userMessage = 'Er ging iets mis. Probeer het opnieuw.';
    const errorMsg = error.message?.toLowerCase() || '';
    
    if (errorMsg.includes('timeout') || errorMsg.includes('etimedout') || errorMsg.includes('timed out')) {
      userMessage = '⏱️ De AI reageert te traag. Probeer het over een paar seconden opnieuw, of stel een kortere vraag.';
    } else if (errorMsg.includes('econnrefused') || errorMsg.includes('enotfound') || errorMsg.includes('eai_again')) {
      userMessage = '🌐 Kan geen verbinding maken met de AI server. Check je internetverbinding en probeer het opnieuw.';
    } else if (errorMsg.includes('fetch failed') || errorMsg.includes('network')) {
      userMessage = '📡 Netwerkfout - geen verbinding met de AI. Probeer het over een paar seconden opnieuw.';
    } else if (errorMsg.includes('insufficient_quota') || errorMsg.includes('quota')) {
      userMessage = '💳 API quota bereikt. Neem contact op met support.';
    } else if (errorMsg.includes('rate limit') || errorMsg.includes('too many requests')) {
      userMessage = '⏳ Te veel verzoeken. Wacht even en probeer het opnieuw.';
    } else if (errorMsg.includes('invalid') && errorMsg.includes('model')) {
      userMessage = '⚙️ Het geselecteerde AI model is niet beschikbaar. Probeer een ander model.';
    }
    
    return NextResponse.json(
      {
        error: 'DeepAgent fout',
        details: error.message,
        message: userMessage,
      },
      { status: 500 }
    );
  }
}

// Health check
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    service: 'WritgoAI DeepAgent - Native AIML Tool Calling',
    features: [
      'Native AIML tool calling',
      'Computer access (bash, files, web)',
      'Autonomous decision making',
      'No fixed layouts - AI does everything',
    ],
    availableTools: DEEPAGENT_TOOLS.map(t => t.function.name),
    timestamp: new Date().toISOString(),
  });
}
