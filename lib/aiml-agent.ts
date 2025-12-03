/**
 * WritgoAI AIML API AI Agent met Intelligente Model Routing
 * Toegang tot 300+ AI modellen met automatische model selectie zoals RouteLLM
 * 
 * Setup volgens officiële AIML API documentatie:
 * https://docs.aimlapi.com/quickstart/setting-up
 */

import OpenAI from 'openai';
import { getBannedWordsInstructions, BANNED_WORDS } from './banned-words';

// AIML API configuratie volgens officiële docs
const AIML_API_KEY = process.env.AIML_API_KEY || '';
const AIML_API_BASE = 'https://api.aimlapi.com/v1';

// OpenAI SDK client met AIML base URL (volgens AIML docs)
const aimlClient = new OpenAI({
  apiKey: AIML_API_KEY,
  baseURL: AIML_API_BASE,
});

// 🎯 COMPLETE MODEL DATABASE - Alle AIML Text/Chat Models
// Bron: https://docs.aimlapi.com/api-references/text-models-llm
// Import smart model router
import { MODEL_CATEGORIES, selectModel, detectTaskType } from './smart-model-router';

export const AVAILABLE_MODELS = {
  // ═══════════════════════════════════════════════════════
  // 🚀 OPENAI MODELLEN
  // ═══════════════════════════════════════════════════════
  GPT_5: 'gpt-5',                           // 🔥 NIEUWSTE - 400K context
  GPT_4O: 'claude-sonnet-4-5-20250929',                         // Beste alles-in-één - 128K context
  GPT_4O_MINI: 'claude-sonnet-4-5-20250929',              // Beste budget OpenAI
  GPT_4_TURBO: 'gpt-4-turbo',              // Sneller dan GPT-4 - 128K context
  GPT_4: 'gpt-4',                           // Classic GPT-4
  GPT_35_TURBO: 'gpt-3.5-turbo',           // Legacy budget
  O1: 'o1',                                 // Advanced reasoning
  O1_MINI: 'o1-mini',                       // Specialist reasoning - 128K context
  O1_PREVIEW: 'o1-preview',                 // Advanced reasoning preview
  O3_MINI: 'o3-mini',                       // Compact reasoning
  
  // ═══════════════════════════════════════════════════════
  // 🧠 ANTHROPIC CLAUDE MODELLEN
  // ═══════════════════════════════════════════════════════
  CLAUDE_35_SONNET: 'claude-sonnet-4-5',   // Top kwaliteit - 200K context
  CLAUDE_35_OPUS: 'claude-3-5-opus-20250514',       // Meest intelligent - 200K context
  CLAUDE_35_HAIKU: 'claude-3-5-haiku-20241022',     // Snelste Claude 3.5
  CLAUDE_3_OPUS: 'claude-3-opus-20240229',          // Legacy premium
  CLAUDE_3_SONNET: 'claude-3-sonnet-20240229',      // Balanced
  CLAUDE_3_HAIKU: 'claude-3-haiku-20240307',        // Budget Claude
  
  // ═══════════════════════════════════════════════════════
  // 🌟 GOOGLE GEMINI MODELLEN
  // ═══════════════════════════════════════════════════════
  GEMINI_25_PRO: 'gemini-2.5-pro',                  // 🔥 NIEUWSTE - 1M context!
  GEMINI_25_FLASH: 'gemini-2.5-flash',              // Snelste Gemini 2.5
  GEMINI_2_FLASH_THINKING: 'gemini-2.0-flash-thinking-exp-01-21', // Reasoning
  GEMINI_2_FLASH: 'gemini-2.0-flash-exp',           // Snelste Gemini 2
  GEMINI_15_PRO: 'gemini-1.5-pro',                  // Solide keuze
  GEMINI_15_FLASH: 'gemini-1.5-flash',              // Budget Gemini
  GEMINI_15_FLASH_8B: 'gemini-1.5-flash-8b',        // Ultra compact
  
  // ═══════════════════════════════════════════════════════
  // 🤖 DEEPSEEK MODELLEN - Excellent reasoning
  // ═══════════════════════════════════════════════════════
  DEEPSEEK_R1: 'deepseek-r1',                       // 🔥 HOT - Beste reasoning/prijs
  DEEPSEEK_V3: 'deepseek-v3',                       // Multi-taak
  DEEPSEEK_CHAT: 'deepseek-chat',                   // Algemene chat
  
  // ═══════════════════════════════════════════════════════
  // 🦙 META LLAMA MODELLEN - Open source
  // ═══════════════════════════════════════════════════════
  LLAMA_4_SCOUT: 'llama-4-scout',                   // 🔥 NIEUWSTE Llama 4
  LLAMA_32_90B_VISION: 'llama-3.2-90b-vision-instruct',
  LLAMA_32_11B_VISION: 'llama-3.2-11b-vision-instruct',
  LLAMA_32_3B: 'llama-3.2-3b-instruct',
  LLAMA_32_1B: 'llama-3.2-1b-instruct',
  LLAMA_31_405B: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
  LLAMA_31_70B: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
  LLAMA_31_8B: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
  
  // ═══════════════════════════════════════════════════════
  // 🔮 XAI GROK MODELLEN
  // ═══════════════════════════════════════════════════════
  GROK_4: 'grok-4',                                 // Premium Grok
  GROK_VISION_BETA: 'grok-vision-beta',             // Met vision
  GROK_2: 'grok-2-1212',                            // Grok 2
  GROK_2_VISION: 'grok-2-vision-1212',              // Grok 2 Vision
  
  // ═══════════════════════════════════════════════════════
  // 🇨🇳 ALIBABA QWEN MODELLEN - Excellent voor Nederlands
  // ═══════════════════════════════════════════════════════
  QWEN_MAX: 'qwen-max',                             // Beste Qwen
  QWEN_PLUS: 'qwen-plus',                           // Balanced
  QWEN_TURBO: 'qwen-turbo',                         // Snelste
  QWEN_VL_MAX: 'qwen-vl-max',                       // Vision model
  QWEN_VL_PLUS: 'qwen-vl-plus',                     // Vision balanced
  QWEN_2_5_72B: 'qwen-2.5-72b-instruct',
  QWEN_2_5_32B: 'qwen-2.5-32b-instruct',
  QWEN_2_5_14B: 'qwen-2.5-14b-instruct',
  QWEN_2_5_7B: 'qwen-2.5-7b-instruct',
  
  // ═══════════════════════════════════════════════════════
  // 🌪️ MISTRAL MODELLEN
  // ═══════════════════════════════════════════════════════
  MISTRAL_LARGE: 'mistral-large-latest',            // Premium Mistral
  MISTRAL_MEDIUM: 'mistral-medium-latest',          // Balanced
  MISTRAL_SMALL: 'mistral-small-latest',            // Budget
  PIXTRAL_LARGE: 'pixtral-large-latest',            // Vision model
  CODESTRAL: 'codestral-latest',                    // Code specialist
  
  // ═══════════════════════════════════════════════════════
  // 🔍 PERPLEXITY SONAR MODELLEN - Real-time web search
  // ═══════════════════════════════════════════════════════
  PERPLEXITY_SONAR_PRO: 'perplexity/sonar-pro',         // 🔥 Premium web search
  PERPLEXITY_SONAR: 'perplexity/sonar',                 // Standard web search
  PERPLEXITY_SONAR_REASONING: 'perplexity/sonar-reasoning', // With reasoning
  PERPLEXITY_SONAR_DEEP: 'perplexity/sonar-deep-research',  // Deep research
  
  // 🔎 AIML BAGOODEX - Alternative web search
  BAGOODEX_SEARCH: 'bagoodex/bagoodex-search-v1',      // AIML native search
  
  // 🚀 OVERIGE TOP MODELLEN
  // ═══════════════════════════════════════════════════════
  
  // Amazon Nova
  AMAZON_NOVA_PRO: 'amazon-nova-pro-v1',
  AMAZON_NOVA_LITE: 'amazon-nova-lite-v1',
  AMAZON_NOVA_MICRO: 'amazon-nova-micro-v1',
  
  // Cohere
  COMMAND_R_PLUS: 'command-r-plus',
  COMMAND_R: 'command-r',
  
  // AI21 Jamba
  JAMBA_15_LARGE: 'ai21-jamba-1.5-large',
  JAMBA_15_MINI: 'ai21-jamba-1.5-mini',
  
  // Nvidia Nemotron
  NEMOTRON_70B: 'nvidia-nemotron-4-340b-instruct',
  
  // DeepSeek Coder
  DEEPSEEK_CODER_V2: 'deepseek-coder-v2',
  
  // Nous Research
  NOUS_HERMES_405B: 'nous-hermes-2-mixtral-8x7b-dpo',
};

// 🎯 INTELLIGENTE MODEL ROUTING - Automatische model selectie
export const MODEL_ROUTING = {
  // Blog schrijven - Lang, gedetailleerd, creatief
  blog_writing: {
    premium: AVAILABLE_MODELS.CLAUDE_35_SONNET,    // Beste voor lange content
    balanced: AVAILABLE_MODELS.DEEPSEEK_R1,        // Goed + goedkoop
    budget: AVAILABLE_MODELS.GPT_4O_MINI,          // Budget optie
    fallbacks: [
      AVAILABLE_MODELS.GEMINI_25_PRO,
      AVAILABLE_MODELS.LLAMA_4_SCOUT,
      AVAILABLE_MODELS.GPT_4O
    ],
    temperature: 0.7,
    max_tokens: 10000, // ✅ VERHOOGD van 4000 naar 10000 voor volledige blogs met 2000-3000+ woorden
    reasoning: 'Lange content vereist coherentie en creativiteit over 1500+ woorden'
  },
  
  // Social media - Kort, pakkend, trend-gevoelig
  social_media: {
    premium: AVAILABLE_MODELS.GPT_4O,              // Beste voor short-form
    balanced: AVAILABLE_MODELS.GPT_4O_MINI,        // Snel + goed
    budget: AVAILABLE_MODELS.GEMINI_15_FLASH,      // Cheapest
    fallbacks: [
      AVAILABLE_MODELS.CLAUDE_35_SONNET,
      AVAILABLE_MODELS.DEEPSEEK_CHAT
    ],
    temperature: 0.8,
    max_tokens: 1000,
    reasoning: 'Korte content, snelheid belangrijker dan perfectie'
  },
  
  // Video scripts - Structuur, timing, engaging
  video_script: {
    premium: AVAILABLE_MODELS.CLAUDE_35_SONNET,    // Script expert
    balanced: AVAILABLE_MODELS.DEEPSEEK_R1,        // Goed voor structuur
    budget: AVAILABLE_MODELS.CLAUDE_3_HAIKU,       // Snelste Claude
    fallbacks: [
      AVAILABLE_MODELS.GPT_4O,
      AVAILABLE_MODELS.LLAMA_31_70B
    ],
    temperature: 0.7,
    max_tokens: 2000,
    reasoning: 'Scripts vereisen structuur en timing, medium lengte'
  },
  
  // Planning & strategie - Logisch denken, structuur
  planning: {
    premium: AVAILABLE_MODELS.O1_MINI,             // Beste reasoning
    balanced: AVAILABLE_MODELS.DEEPSEEK_R1,        // Reasoning specialist
    budget: AVAILABLE_MODELS.GPT_4O_MINI,          // Budget denker
    fallbacks: [
      AVAILABLE_MODELS.CLAUDE_35_SONNET,
      AVAILABLE_MODELS.GEMINI_2_FLASH_THINKING,
      AVAILABLE_MODELS.GPT_4_TURBO
    ],
    temperature: 0.5,
    max_tokens: 3000,
    reasoning: 'Content planning vereist strategisch denken en structuur'
  },
  
  // Chat & conversatie - Snel, natuurlijk, accuraat
  chat: {
    premium: AVAILABLE_MODELS.GPT_4O,              // Beste conversatie
    balanced: AVAILABLE_MODELS.GPT_4O_MINI,        // Snelste
    budget: AVAILABLE_MODELS.GEMINI_15_FLASH,      // Cheapest
    fallbacks: [
      AVAILABLE_MODELS.CLAUDE_35_SONNET,
      AVAILABLE_MODELS.DEEPSEEK_CHAT,
      AVAILABLE_MODELS.LLAMA_31_70B
    ],
    temperature: 0.7,
    max_tokens: 2000,
    reasoning: 'Chat vereist snelle, natuurlijke responses'
  },
  
  // Research & analyse - Accurate, gedetailleerd
  research: {
    premium: AVAILABLE_MODELS.GEMINI_25_PRO,       // 1M context voor deep research
    balanced: AVAILABLE_MODELS.DEEPSEEK_R1,        // Reasoning + analyse
    budget: AVAILABLE_MODELS.GPT_4O_MINI,          // Budget research
    fallbacks: [
      AVAILABLE_MODELS.CLAUDE_35_OPUS,
      AVAILABLE_MODELS.O1_PREVIEW,
      AVAILABLE_MODELS.GPT_5
    ],
    temperature: 0.3,
    max_tokens: 3000,
    reasoning: 'Research vereist diepgaande analyse en grote context'
  }
};

// 🔄 Model tier selectie (voor kosten optimalisatie)
type ModelTier = 'premium' | 'balanced' | 'budget';
let currentTier: ModelTier = 'balanced'; // Default: balanced (beste prijs/kwaliteit)

export function setModelTier(tier: ModelTier) {
  currentTier = tier;
  console.log(`🎯 Model tier ingesteld op: ${tier}`);
}

export function getModelTier(): ModelTier {
  return currentTier;
}

/**
 * Verwijder dubbele punten en scheidingstekens uit H2 en H3 headings
 * Deze functie past de SEO best practices toe:
 * - Geen dubbele punten in headings
 * - Geen scheidingstekens zoals "Tip 1:", "Conclusie:", etc.
 * - Behoudt natuurlijke, vloeiende headings
 */
export function cleanHeadings(html: string): string {
  if (!html) return html;
  
  let cleanedHtml = html;
  
  // Regex patterns voor H2 en H3 headings
  const h2Pattern = /<h2[^>]*>(.*?)<\/h2>/gi;
  const h3Pattern = /<h3[^>]*>(.*?)<\/h3>/gi;
  
  // Clean H2 headings
  cleanedHtml = cleanedHtml.replace(h2Pattern, (match, content) => {
    let cleaned = content.trim();
    
    // Check if heading is ONLY "Conclusie" or "Afsluiting" (case insensitive)
    // If so, remove the entire heading
    if (/^(conclusie|afsluiting)$/i.test(cleaned)) {
      return ''; // Verwijder de hele heading
    }
    
    // Verwijder dubbele punten en alles ervoor als het een label lijkt
    // Bijvoorbeeld: "De afsluiting: is het de moeite waard?" → "Is het de moeite waard?"
    // Bijvoorbeeld: "Tip 1: Let op de prijs" → "Let op de prijs"
    if (cleaned.includes(':')) {
      // Check if it's a label pattern (kort woord/nummer voor de dubbele punt)
      const parts = cleaned.split(':');
      if (parts.length === 2) {
        const beforeColon = parts[0].trim();
        const afterColon = parts[1].trim();
        
        // Als het deel voor de dubbele punt kort is (<30 chars) en het ziet eruit als een label
        // verwijder dan het geheel en behoud alleen het deel na de dubbele punt
        const labelPatterns = [
          /^(tip|stap|punt|regel|fase|onderdeel|sectie|deel)\s*\d+$/i,
          /^(conclusie|afsluiting|samenvatting|introductie|inleiding|waarom|hoe|wat|wanneer|waar|wie)$/i,
          /^(de|het|een)\s+(afsluiting|conclusie|samenvatting|uitleg|vraag|antwoord|uitdaging|vraag|tip|stap)$/i,
        ];
        
        const isLabel = labelPatterns.some(pattern => pattern.test(beforeColon)) || beforeColon.length < 30;
        
        if (isLabel && afterColon.length > 0) {
          // Capitalize eerste letter van het overgebleven deel
          cleaned = afterColon.charAt(0).toUpperCase() + afterColon.slice(1);
        } else {
          // Vervang dubbele punt door streepje of verwijder
          cleaned = cleaned.replace(/:/g, ' -');
        }
      } else {
        // Meerdere dubbele punten - vervang allemaal
        cleaned = cleaned.replace(/:/g, '');
      }
    }
    
    // Verwijder andere scheidingstekens aan het begin
    cleaned = cleaned.replace(/^[\-–—|•›»]+\s*/g, '');
    
    // Verwijder dubbele spaties
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Behoud originele HTML tags en attributes
    return match.replace(content, cleaned);
  });
  
  // Clean H3 headings (zelfde logica)
  cleanedHtml = cleanedHtml.replace(h3Pattern, (match, content) => {
    let cleaned = content.trim();
    
    // Check if heading is ONLY "Conclusie" or "Afsluiting" (case insensitive)
    // If so, remove the entire heading
    if (/^(conclusie|afsluiting)$/i.test(cleaned)) {
      return ''; // Verwijder de hele heading
    }
    
    if (cleaned.includes(':')) {
      const parts = cleaned.split(':');
      if (parts.length === 2) {
        const beforeColon = parts[0].trim();
        const afterColon = parts[1].trim();
        
        const labelPatterns = [
          /^(tip|stap|punt|regel|fase|onderdeel|sectie|deel)\s*\d+$/i,
          /^(conclusie|afsluiting|samenvatting|introductie|inleiding|waarom|hoe|wat|wanneer|waar|wie)$/i,
          /^(de|het|een)\s+(afsluiting|conclusie|samenvatting|uitleg|vraag|antwoord|uitdaging|vraag|tip|stap)$/i,
        ];
        
        const isLabel = labelPatterns.some(pattern => pattern.test(beforeColon)) || beforeColon.length < 30;
        
        if (isLabel && afterColon.length > 0) {
          cleaned = afterColon.charAt(0).toUpperCase() + afterColon.slice(1);
        } else {
          cleaned = cleaned.replace(/:/g, ' -');
        }
      } else {
        cleaned = cleaned.replace(/:/g, '');
      }
    }
    
    cleaned = cleaned.replace(/^[\-–—|•›»]+\s*/g, '');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return match.replace(content, cleaned);
  });
  
  return cleanedHtml;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  messages: ChatMessage[];
  stream?: boolean;
  taskType?: keyof typeof MODEL_ROUTING;
}

/**
 * 🧠 INTELLIGENTE MODEL ROUTER - Kiest automatisch het beste model
 * Net als RouteLLM, maar dan voor AIML API
 */
/**
 * 🎯 Direct Model Call with Smart Fallbacks
 * Gebruik specifiek model met automatische fallbacks
 */
export async function callWithModel(
  modelName: string,
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    max_tokens?: number;
  }
): Promise<string> {
  // Map user-friendly model names to actual model IDs
  const modelMap: Record<string, string> = {
    'gpt-4': AVAILABLE_MODELS.GPT_4O,
    'gpt-4-turbo': AVAILABLE_MODELS.GPT_4_TURBO,
    'claude-3-opus': AVAILABLE_MODELS.CLAUDE_35_OPUS,
    'claude-3-sonnet': AVAILABLE_MODELS.CLAUDE_35_SONNET,
    'gemini-pro': AVAILABLE_MODELS.GEMINI_25_PRO,
    'llama-3-70b': AVAILABLE_MODELS.LLAMA_31_70B,
    'mistral-large': AVAILABLE_MODELS.MISTRAL_LARGE,
  };
  
  const actualModel = modelMap[modelName] || modelName;
  
  console.log(`🎯 Direct call met model: ${modelName} (${actualModel})`);
  
  // Define smart fallbacks based on model type
  const fallbacks: string[] = [];
  if (actualModel.includes('gpt') || actualModel.includes('openai')) {
    fallbacks.push(AVAILABLE_MODELS.GPT_4O_MINI, AVAILABLE_MODELS.GPT_4_TURBO);
  } else if (actualModel.includes('claude')) {
    fallbacks.push(AVAILABLE_MODELS.CLAUDE_35_SONNET, AVAILABLE_MODELS.CLAUDE_35_HAIKU);
  } else if (actualModel.includes('gemini')) {
    fallbacks.push(AVAILABLE_MODELS.GEMINI_25_FLASH, AVAILABLE_MODELS.GEMINI_15_PRO);
  } else {
    fallbacks.push(AVAILABLE_MODELS.GPT_4O_MINI, AVAILABLE_MODELS.CLAUDE_35_SONNET);
  }
  
  // Try primary model
  try {
    const result = await callAIMLAPI({
      model: actualModel,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 2000
    });
    
    console.log(`✅ Success met ${actualModel}`);
    return result;
  } catch (primaryError: any) {
    console.warn(`⚠️ Primary model ${actualModel} faalde:`, primaryError.message);
    
    // Try fallbacks
    for (const fallbackModel of fallbacks) {
      try {
        console.log(`🔄 Probeer fallback: ${fallbackModel}`);
        const result = await callAIMLAPI({
          model: fallbackModel,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.max_tokens ?? 2000
        });
        
        console.log(`✅ Success met fallback ${fallbackModel}`);
        return result;
      } catch (fallbackError: any) {
        console.warn(`⚠️ Fallback ${fallbackModel} faalde:`, fallbackError.message);
        continue;
      }
    }
    
    // Last resort
    console.error('❌ Alle modellen gefaald, laatste poging met GPT-4o-mini...');
    return await callAIMLAPI({
      model: AVAILABLE_MODELS.GPT_4O_MINI,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 2000
    });
  }
}

export async function smartModelRouter(
  taskType: keyof typeof MODEL_ROUTING,
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    max_tokens?: number;
    forceTier?: ModelTier;
    preferredModel?: string;
  }
): Promise<string> {
  // Als er een preferred model is, gebruik die direct
  if (options?.preferredModel) {
    console.log(`🎯 Gebruik preferred model: ${options.preferredModel}`);
    return callWithModel(options.preferredModel, messages, {
      temperature: options.temperature,
      max_tokens: options.max_tokens
    });
  }
  
  const routing = MODEL_ROUTING[taskType];
  const tier = options?.forceTier || currentTier;
  
  // Selecteer model op basis van tier
  const primaryModel = routing[tier];
  const fallbackModels = routing.fallbacks;
  
  console.log(`🎯 Smart Router: ${taskType} | Tier: ${tier} | Primary: ${primaryModel}`);
  console.log(`   💡 Reasoning: ${routing.reasoning}`);
  
  // Probeer primary model eerst
  try {
    const result = await callAIMLAPI({
      model: primaryModel,
      messages,
      temperature: options?.temperature ?? routing.temperature,
      max_tokens: options?.max_tokens ?? routing.max_tokens
    });
    
    console.log(`✅ Success met ${primaryModel}`);
    return result;
  } catch (primaryError: any) {
    console.warn(`⚠️ Primary model ${primaryModel} faalde:`, primaryError.message);
    
    // Probeer fallback modellen
    for (const fallbackModel of fallbackModels) {
      try {
        console.log(`🔄 Probeer fallback: ${fallbackModel}`);
        const result = await callAIMLAPI({
          model: fallbackModel,
          messages,
          temperature: options?.temperature ?? routing.temperature,
          max_tokens: options?.max_tokens ?? routing.max_tokens
        });
        
        console.log(`✅ Success met fallback ${fallbackModel}`);
        return result;
      } catch (fallbackError: any) {
        console.warn(`⚠️ Fallback ${fallbackModel} faalde:`, fallbackError.message);
        continue;
      }
    }
    
    // Als alle modellen falen, probeer laatste redmiddel: GPT-4o-mini (meest betrouwbaar)
    console.error('❌ Alle modellen gefaald, laatste poging met GPT-4o-mini...');
    try {
      return await callAIMLAPI({
        model: AVAILABLE_MODELS.GPT_4O_MINI,
        messages,
        temperature: options?.temperature ?? routing.temperature,
        max_tokens: options?.max_tokens ?? routing.max_tokens
      });
    } catch (finalError: any) {
      throw new Error(`Alle AI modellen zijn niet beschikbaar. Error: ${finalError.message}`);
    }
  }
}

/**
 * 🔌 Direct AIML API Call met foutafhandeling
 */
/**
 * Call AIML API using OpenAI SDK (volgens officiële AIML docs)
 * https://docs.aimlapi.com/quickstart/setting-up
 */
async function callAIMLAPI(options: {
  model: string;
  messages: ChatMessage[];
  temperature: number;
  max_tokens: number;
}): Promise<string> {
  if (!AIML_API_KEY) {
    throw new Error('AIML_API_KEY niet geconfigureerd');
  }

  try {
    // Gebruik OpenAI SDK zoals beschreven in AIML docs
    const completion = await aimlClient.chat.completions.create({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature,
      max_tokens: options.max_tokens,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('Geen response ontvangen van model');
    }
    
    return response;
    
  } catch (error: any) {
    // Betere error handling
    const errorMessage = error?.message || String(error);
    throw new Error(`AIML API fout (${options.model}): ${errorMessage}`);
  }
}

/**
 * Legacy functie voor backwards compatibility
 * DEPRECATED: Gebruik smartModelRouter() in plaats hiervan
 */
export async function aimlChatCompletion(options: ChatCompletionOptions): Promise<string> {
  // Als er een taskType is, gebruik dan de slimme router
  if (options.taskType) {
    return smartModelRouter(options.taskType, options.messages, {
      temperature: options.temperature,
      max_tokens: options.max_tokens
    });
  }
  
  // Anders, gebruik direct de opgegeven model (legacy gedrag)
  return callAIMLAPI({
    model: options.model || AVAILABLE_MODELS.GPT_4O_MINI,
    messages: options.messages,
    temperature: options.temperature || 0.7,
    max_tokens: options.max_tokens || 2000
  });
}

/**
 * 🌐 ECHTE WEB SEARCH - Met Perplexity Sonar voor actuele internet data
 * Gebruikt real-time web search via AIML API Perplexity models
 */
export async function realTimeWebSearch(query: string, options?: {
  searchRecency?: 'day' | 'week' | 'month';
  includeDomains?: string[];
  excludeDomains?: string[];
}): Promise<{
  answer: string;
  sources: string[];
  searchDate: string;
}> {
  console.log(`🌐 REAL-TIME WEB SEARCH: "${query}"`);
  
  try {
    // Gebruik Perplexity Sonar Pro voor beste real-time search
    const completion = await aimlClient.chat.completions.create({
      model: AVAILABLE_MODELS.PERPLEXITY_SONAR_PRO, // Perplexity Sonar Pro met web search
      messages: [
        {
          role: 'user',
          content: `Als real-time web search assistant: Zoek actuele informatie op internet en geef bronnen aan. Gebruik ALTIJD de meest recente informatie beschikbaar. Geef het antwoord in het Nederlands.\n\nVraag: ${query}`
        }
      ],
      temperature: 0.3, // Lager voor meer accurate web search
      max_tokens: 3000,
      // @ts-ignore - AIML API specific parameters
      search_recency_filter: options?.searchRecency || 'month',
      ...(options?.includeDomains && {
        search_domain_filter: options.includeDomains
      })
    });
    
    const answer = completion.choices[0]?.message?.content || 'Geen resultaten gevonden.';
    
    // Extract sources from response if available
    const sourceRegex = /\[(https?:\/\/[^\]]+)\]/g;
    const sources: string[] = [];
    let match;
    while ((match = sourceRegex.exec(answer)) !== null) {
      sources.push(match[1]);
    }
    
    console.log(`✅ Web search completed - ${sources.length} sources found`);
    
    return {
      answer,
      sources,
      searchDate: new Date().toISOString()
    };
    
  } catch (error: any) {
    console.error('Real-time web search error:', error);
    
    // Fallback naar AIML bagoodex search model
    try {
      console.log('🔄 Fallback naar bagoodex search model...');
      const completion = await aimlClient.chat.completions.create({
        model: AVAILABLE_MODELS.BAGOODEX_SEARCH,
        messages: [
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });
      
      const answer = completion.choices[0]?.message?.content || 'Geen resultaten gevonden.';
      
      return {
        answer,
        sources: [],
        searchDate: new Date().toISOString()
      };
      
    } catch (fallbackError: any) {
      console.error('Bagoodex fallback also failed:', fallbackError);
      throw new Error(`Web search failed: ${error.message}`);
    }
  }
}

/**
 * Web Research Tool (LEGACY - nu met echte web search)
 */
export async function webResearch(query: string, context?: string): Promise<string> {
  try {
    // Gebruik nieuwe real-time web search
    const result = await realTimeWebSearch(query);
    
    let response = result.answer;
    
    // Voeg bronnen toe aan antwoord
    if (result.sources.length > 0) {
      response += '\n\n**Bronnen:**\n';
      result.sources.forEach((source, idx) => {
        response += `${idx + 1}. ${source}\n`;
      });
    }
    
    response += `\n\n*Gezocht op: ${new Date(result.searchDate).toLocaleString('nl-NL')}*`;
    
    return response;
    
  } catch (error: any) {
    console.error('Web research error:', error);
    // Fallback naar oude methode (zonder real-time search)
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: `Als expert web researcher, geef gedetailleerde, goed-onderbouwde informatie op basis van de vraag. ${context ? `Context: ${context}` : ''}\n\nDoe web research over: ${query}\n\nGeef een uitgebreid antwoord met feiten, statistieken en relevante informatie.`,
      },
    ];

    return await smartModelRouter('research', messages);
  }
}

/**
 * Content Planner Tool met Intelligente Routing
 */
export async function planContent(
  topic: string,
  contentType: 'blog' | 'social' | 'video' | 'all',
  brandInfo?: string
): Promise<any> {
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: `Als expert content strategist, maak een gedetailleerd content plan. ${brandInfo ? `Merk info: ${brandInfo}` : ''}\n\nMaak een content plan voor: ${topic}
Content type: ${contentType}

Geef de output als JSON met:
{
  "hoofdthema": "...",
  "subthemas": ["...", "..."],
  "blog": { "titel": "...", "structuur": ["intro", "punt1", ...] },
  "social": [{ "platform": "instagram", "tekst": "...", "hashtags": [...] }],
  "video": { "titel": "...", "script_onderdelen": [...] }
}`,
    },
  ];

  const response = await smartModelRouter('planning', messages);

  try {
    // Probeer JSON te extraheren uit de response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { raw: response };
  } catch (error) {
    return { raw: response };
  }
}

/**
 * Taal-specifieke configuratie voor content generatie
 */
function getLanguageConfig(language: 'NL' | 'EN' | 'DE' | 'FR' | 'ES' = 'NL') {
  const configs = {
    NL: {
      name: 'Nederlands',
      systemPrompt: 'Je bent een expert SEO blog schrijver die uitsluitend in het Nederlands schrijft.',
      languageRule: `🔴 KRITIEKE TAALREGELS (VERPLICHT):
1. ⚠️ Schrijf ALLEEN in het NEDERLANDS - GEEN enkele Duitse, Engelse of andere woorden!
2. ⚠️ GEEN woorden zoals "vielleicht", "perhaps", "maybe" - gebruik ALLEEN Nederlandse alternatieven
3. ⚠️ Controleer ELKE zin op taalfouten voordat je verder gaat
4. ⚠️ Maak ELKE zin af - GEEN afgebroken zinnen zoals "de wereld ," zonder vervolg
5. ⚠️ GEEN komma's aan het einde van zinnen zonder dat de zin compleet is`,
      writingStyle: 'NATUURLIJK en VLOEIEND Nederlands - geen gekunstelde of robotachtige zinnen',
      headingRule: `NEDERLANDSE HOOFDLETTERS:
   ⚠️ ALLEEN DE EERSTE LETTER VAN EEN TITEL IS EEN HOOFDLETTER (Nederlandse schrijfwijze)
   ⚠️ NIET ELKE WOORD EEN HOOFDLETTER (dat is Engels, niet Nederlands!)`,
      exampleHeading: 'De beste tips voor een gezonde levensstijl'
    },
    EN: {
      name: 'English',
      systemPrompt: 'You are an expert SEO blog writer who writes exclusively in English.',
      languageRule: `🔴 CRITICAL LANGUAGE RULES (MANDATORY):
1. ⚠️ Write ONLY in ENGLISH - NO Dutch, German or other language words!
2. ⚠️ Use proper English grammar and spelling throughout
3. ⚠️ Check EVERY sentence for language errors before continuing
4. ⚠️ Complete EVERY sentence - NO incomplete sentences like "the world ," without continuation
5. ⚠️ NO commas at the end of sentences without proper completion`,
      writingStyle: 'NATURAL and FLUENT English - no artificial or robotic sentences',
      headingRule: `ENGLISH TITLE CAPITALIZATION:
   ⚠️ Use Title Case for headings (capitalize major words)
   ⚠️ Follow standard English capitalization rules`,
      exampleHeading: 'The Best Tips for a Healthy Lifestyle'
    },
    DE: {
      name: 'Deutsch',
      systemPrompt: 'Du bist ein Experte für SEO-Blog-Schreiben, der ausschließlich auf Deutsch schreibt.',
      languageRule: `🔴 KRITISCHE SPRACHREGELN (PFLICHT):
1. ⚠️ Schreibe NUR auf DEUTSCH - KEINE niederländischen, englischen oder anderen Wörter!
2. ⚠️ Verwende korrekte deutsche Grammatik und Rechtschreibung durchgehend
3. ⚠️ Überprüfe JEDEN Satz auf Sprachfehler, bevor du weitermachst
4. ⚠️ Vervollständige JEDEN Satz - KEINE unvollständigen Sätze wie "die Welt ," ohne Fortsetzung
5. ⚠️ KEINE Kommas am Ende von Sätzen ohne richtige Vervollständigung`,
      writingStyle: 'NATÜRLICHES und FLIESSENDES Deutsch - keine künstlichen oder roboterartigen Sätze',
      headingRule: `DEUTSCHE GROẞSCHREIBUNG:
   ⚠️ Nur der erste Buchstabe und Substantive werden großgeschrieben (deutsche Rechtschreibung)
   ⚠️ Folge den deutschen Groß- und Kleinschreibungsregeln`,
      exampleHeading: 'Die besten Tipps für einen gesunden Lebensstil'
    },
    FR: {
      name: 'Français',
      systemPrompt: 'Vous êtes un expert en rédaction de blogs SEO qui écrit exclusivement en français.',
      languageRule: `🔴 RÈGLES LINGUISTIQUES CRITIQUES (OBLIGATOIRE):
1. ⚠️ Écrivez UNIQUEMENT en FRANÇAIS - AUCUN mot néerlandais, allemand, anglais ou autre!
2. ⚠️ Utilisez une grammaire et une orthographe françaises correctes tout au long
3. ⚠️ Vérifiez CHAQUE phrase pour les erreurs de langue avant de continuer
4. ⚠️ Complétez CHAQUE phrase - PAS de phrases incomplètes comme "le monde ," sans continuation
5. ⚠️ PAS de virgules à la fin des phrases sans complétion appropriée`,
      writingStyle: 'Français NATUREL et FLUIDE - pas de phrases artificielles ou robotiques',
      headingRule: `CAPITALISATION DES TITRES EN FRANÇAIS:
   ⚠️ Seule la première lettre est en majuscule (orthographe française)
   ⚠️ Suivez les règles françaises de capitalisation`,
      exampleHeading: 'Les meilleurs conseils pour un mode de vie sain'
    },
    ES: {
      name: 'Español',
      systemPrompt: 'Eres un experto en redacción de blogs SEO que escribe exclusivamente en español.',
      languageRule: `🔴 REGLAS LINGÜÍSTICAS CRÍTICAS (OBLIGATORIO):
1. ⚠️ Escribe SOLO en ESPAÑOL - ¡NINGUNA palabra en holandés, alemán, inglés u otro idioma!
2. ⚠️ Usa gramática y ortografía española correcta en todo momento
3. ⚠️ Verifica CADA oración en busca de errores de idioma antes de continuar
4. ⚠️ Completa CADA oración - NO oraciones incompletas como "el mundo ," sin continuación
5. ⚠️ NO comas al final de las oraciones sin la finalización adecuada`,
      writingStyle: 'Español NATURAL y FLUIDO - sin oraciones artificiales o robóticas',
      headingRule: `CAPITALIZACIÓN DE TÍTULOS EN ESPAÑOL:
   ⚠️ Solo la primera letra está en mayúscula (ortografía española)
   ⚠️ Sigue las reglas españolas de capitalización`,
      exampleHeading: 'Los mejores consejos para un estilo de vida saludable'
    }
  };
  
  return configs[language];
}

/**
 * Blog Generator Tool met Intelligente Routing en Multi-taal Support
 */
export async function generateBlog(
  topic: string,
  keywords: string[],
  tone: string = 'professioneel',
  brandInfo?: string,
  options?: {
    affiliateLinks?: Array<{url: string; anchorText: string; description?: string}>;
    productLinks?: Array<{name: string; url: string; price?: string; description?: string}>;
    productList?: Array<any>; // 🛍️ Full product data with images, pros/cons for "beste" articles
    reviewProduct?: any; // 📝 Single product for in-depth reviews
    targetWordCount?: number; // 🎯 Gewenst woordenaantal
    knowledgeBase?: string; // 📚 Knowledge base context from uploaded files
    includeFAQ?: boolean; // ❓ Veelgestelde vragen sectie toevoegen
    includeYouTube?: boolean; // 🎥 YouTube video embed toevoegen
    includeDirectAnswer?: boolean; // 🎯 Direct antwoord met dikgedrukte tekst toevoegen
    language?: 'NL' | 'EN' | 'DE' | 'FR' | 'ES'; // 🌍 Taal voor content generatie (standaard NL)
  }
): Promise<string> {
  // Get language configuration
  const language = options?.language || 'NL';
  const langConfig = getLanguageConfig(language);
  
  // DEBUG: Log what we receive
  console.log('🎨 generateBlog called with:', {
    topic: topic.substring(0, 50) + '...',
    keywordsCount: keywords.length,
    tone,
    language: langConfig.name,
    hasBrandInfo: !!brandInfo,
    options: {
      affiliateLinks: options?.affiliateLinks?.length || 0,
      productLinks: options?.productLinks?.length || 0,
      productList: options?.productList?.length || 0,
      hasReviewProduct: !!options?.reviewProduct,
      targetWordCount: options?.targetWordCount,
      hasKnowledgeBase: !!options?.knowledgeBase,
      includeFAQ: options?.includeFAQ,
      includeYouTube: options?.includeYouTube,
      includeDirectAnswer: options?.includeDirectAnswer
    }
  });
  
  // Build optional sections for prompt
  let affiliateLinkSection = '';
  if (options?.affiliateLinks && options.affiliateLinks.length > 0) {
    affiliateLinkSection = `\n\n🔗 AFFILIATE LINKS - Integreer deze links NATUURLIJK in je tekst:
Plaats deze links ALLEEN waar ze relevant zijn en waarde toevoegen. Gebruik ze contextually, niet geforceerd.

${options.affiliateLinks.map((link, idx) => `${idx + 1}. ${link.anchorText}
   URL: ${link.url}
   ${link.description ? `Context: ${link.description}` : ''}`).join('\n\n')}

BELANGRIJK VOOR AFFILIATE LINKS:
- Integreer ze NATUURLIJK in lopende tekst waar relevant
- Gebruik VARIËRENDE zinconstructies (niet steeds dezelfde zin)
- Plaats ze alleen waar ze ECHT waarde toevoegen voor de lezer
- Voorbeelden van natuurlijke integratie:
  ✅ "Als je meer wilt weten over <a href="URL">onderwerp</a>, dan..."
  ✅ "Een goede optie is om <a href="URL">dit te bekijken</a> voor..."
  ✅ "Voor diepgaande informatie over dit onderwerp, raad ik <a href="URL">deze resource</a> aan."
  ❌ NIET: "Voor meer informatie over X, bekijk X." (te repetitief!)
- Gebruik het exacte anchor text uit de lijst hierboven
- Gebruik target="_blank" rel="noopener noreferrer sponsored" voor alle affiliate links`;
  }

  let productLinkSection = '';
  if (options?.productLinks && options.productLinks.length > 0 && !options?.productList) {
    // Regular product links (only if no product list is provided)
    productLinkSection = `\n\n🛍️ PRODUCT LINKS - Vermeld ALLE deze producten NATUURLIJK in je content:
⚠️ KRITIEK: Als je een product noemt in de tekst, moet het ALTIJD een affiliate link hebben!

${options.productLinks.map((product, idx) => `${idx + 1}. ${product.name}${product.price ? ` (${product.price})` : ''}
   URL: ${product.url}
   ${product.description ? `Info: ${product.description}` : ''}`).join('\n\n')}

🎯 VERPLICHTE REGELS VOOR PRODUCT LINKS:
- Noem ALLE producten uit de lijst hierboven waar relevant
- ALS je een product noemt, MOET het een affiliate link hebben
- Bij vergelijkingen (bijv. "product A vs product B"): BEIDE producten moeten links krijgen
- Bij opsommingen (bijv. "yogabal, yoga rek, yoga shirt"): ALLE items moeten links krijgen
- Varieer je zinconstructies - niet steeds dezelfde introductie

✅ VOORBEELDEN VAN CORRECTE INTEGRATIE:
  ✅ "Vergelijk de <a href="URL1">Nvidia RTX 4070</a> met de <a href="URL2">AMD RX 7800 XT</a> voor gaming."
  ✅ "Voor yoga thuis heb je een <a href="URL1">yogabal</a>, <a href="URL2">yoga rek</a> en <a href="URL3">yoga shirt</a> nodig."
  ✅ "Een populaire keuze is de <a href="URL">productnaam</a>, bekend om zijn kwaliteit."
  ❌ FOUT: "Vergelijk de Nvidia RTX 4070 met de AMD RX 7800 XT" (beide producten genoemd maar GEEN links!)

- Gebruik target="_blank" rel="noopener noreferrer sponsored" voor alle productlinks
- Gebruik inline styling: style="color: #3b82f6; text-decoration: underline; font-weight: 600;"`;
  }

  // 🛍️ PRODUCT LIST SECTION - Voor "beste" of "top" artikelen met volledige product reviews
  let productListSection = '';
  if (options?.productList && options.productList.length > 0) {
    productListSection = `\n\n🛍️📋 PRODUCTLIJST SECTIE (ABSOLUUT VERPLICHT - VOLG EXACT!):

🚨 Dit is een "beste [product]" artikel. Je MOET voor ELK product de EXACTE HTML structuur gebruiken die hieronder staat.

⚠️ KRITIEK: 
- GEEN doorlopende tekst zoals nu!
- GEEN productboxes met fancy styling!
- GEEN complexe HTML structuren!
- WEL: SIMPELE, GESTRUCTUREERDE layout zoals hieronder

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**EXACTE HTML TEMPLATE - KOPIEER DIT LETTERLIJK VOOR ELK PRODUCT:**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<h2>1. [PRODUCTNAAM]</h2>

<img src="[PRODUCT_IMAGE_URL]" alt="[PRODUCTNAAM]" style="width: 100%; max-width: 550px; height: auto; border-radius: 8px; margin: 24px 0;" />

<p>[KORTE BESCHRIJVING - Maximaal 2-3 zinnen over waarom dit product goed is]</p>

<h3>Voordelen</h3>
<ul>
<li>[Voordeel 1]</li>
<li>[Voordeel 2]</li>
<li>[Voordeel 3]</li>
</ul>

<h3>Nadelen</h3>
<ul>
<li>[Nadeel 1]</li>
<li>[Nadeel 2]</li>
</ul>

<p style="margin: 24px 0;">
<a href="[AFFILIATE_URL]" target="_blank" rel="noopener noreferrer sponsored" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Bekijk beste prijs →</a>
</p>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**VOORBEELD CORRECT GEBRUIK:**

<h2>1. Inventum VWM5001W</h2>

<img src="https://i.ytimg.com/vi/VKq3U9dcVmY/maxresdefault.jpg" alt="Inventum VWM5001W compacte wasmachine" style="width: 100%; max-width: 550px; height: auto; border-radius: 8px; margin: 24px 0;" />

<p>De Inventum VWM5001W is een uitstekende compacte wasmachine met een capaciteit van 5 kg. Perfect voor kleine huishoudens en studentenkamers.</p>

<h3>Voordelen</h3>
<ul>
<li>Compact formaat (51 cm breed)</li>
<li>15 verschillende wasprogramma's</li>
<li>Energielabel D</li>
</ul>

<h3>Nadelen</h3>
<ul>
<li>Gemiddeld geluidsniveau (76 dB)</li>
<li>Beperkte capaciteit van 5 kg</li>
</ul>

<p style="margin: 24px 0;">
<a href="https://partner.bol.com/click/..." target="_blank" rel="noopener noreferrer sponsored" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Bekijk beste prijs →</a>
</p>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**BESCHIKBARE PRODUCTEN (gebruik deze data):**

${options.productList.map((product, idx) => `
━━━ PRODUCT ${idx + 1} ━━━
Naam: ${product.title}
Afbeelding URL: ${product.image?.url || 'https://upload.wikimedia.org/wikipedia/commons/9/98/Simple_placeholder_sizes.jpg'}
Prijs: €${product.price?.toFixed(2) || '0.00'}
Affiliate Link: ${product.affiliateUrl}
Beschrijving: ${product.summary || product.description?.substring(0, 150) || 'Geen omschrijving beschikbaar'}

✅ Voordelen:
${(product.pros || ['Geen voordelen beschikbaar']).map((pro: string) => `  • ${pro}`).join('\n')}

❌ Nadelen:
${(product.cons || ['Geen nadelen beschikbaar']).map((con: string) => `  • ${con}`).join('\n')}

`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 KRITIEKE VOLGORDE - VOLG EXACT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Introductie (2-3 paragrafen)

2️⃣ H2: "De beste ${keywords[0]} van 2025"

3️⃣ Voor ELK product in de lijst, EXACT deze volgorde:
   ✓ <h2>[nummer]. [productnaam]</h2>
   ✓ <img> tag met product afbeelding (gebruik de ECHTE Bol.com URL)
   ✓ <p>[korte beschrijving - 2-3 zinnen]</p>
   ✓ <h3>Voordelen</h3>
   ✓ <ul> met <li> items voor voordelen</li>
   ✓ <h3>Nadelen</h3>
   ✓ <ul> met <li> items voor nadelen</li>
   ✓ <p> met affiliate link "Bekijk beste prijs →"</p>

4️⃣ Na ALLE producten: extra secties (koopgids, FAQ, conclusie)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 VERBODEN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ GEEN doorlopende tekst zoals: "De Inventum VWM5001W is een uitstekend voorbeeld..."
❌ GEEN <div> containers met fancy styling
❌ GEEN product boxes met gradient backgrounds
❌ GEEN inline style blocks met complexe CSS
❌ GEEN afbeeldingen in de tekst zelf - afbeeldingen komen DIRECT na de H2
❌ GEEN "Prijs:" labels - alleen beschrijving, voordelen, nadelen, link

✅ WEL:
✓ Clean, simpele HTML structuur zoals in het voorbeeld
✓ H2 → IMG → Beschrijving → Voordelen → Nadelen → Link
✓ Gebruik <ul> met <li> voor voor/nadelen
✓ Styled button voor de affiliate link
✓ Exact deze volgorde voor ELK product

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**ALLERLAATSTE WAARSCHUWING:**
Als je NIET exact deze structuur volgt, is het artikel ONBRUIKBAAR.
Kopieer letterlijk de HTML template hierboven en vul alleen de [PLACEHOLDERS] in.
GEEN creatieve vrijheid - EXACT deze layout!`;
  }

  // 📝 IN-DEPTH REVIEW SECTION - Voor review artikelen met 1 product
  let reviewSection = '';
  if (options?.reviewProduct) {
    const product = options.reviewProduct;
    reviewSection = `\n\n📝 DIEPGAANDE PRODUCT REVIEW (VERPLICHT!):

Dit is een PRODUCT REVIEW artikel. Je moet een UITGEBREIDE, DIEPGAANDE review schrijven die de klant ALLES vertelt wat hij moet weten om een aankoop te doen.

**PRODUCT INFORMATIE:**

Product: ${product.title}
Afbeelding: ${product.image?.url || 'geen'}
Prijs: €${product.price?.toFixed(2) || '0.00'}
Affiliate Link: ${product.affiliateUrl}
Beschrijving: ${product.summary || product.description?.substring(0, 200) || ''}

Voordelen:
${(product.pros || []).map((pro: string, i: number) => `${i + 1}. ${pro}`).join('\n')}

Nadelen:
${(product.cons || []).map((con: string, i: number) => `${i + 1}. ${con}`).join('\n')}

**ARTIKEL STRUCTUUR VOOR PRODUCT REVIEW (VERPLICHT):**

1. **Pakkende Intro (3-4 alinea's)**
   - Waarom dit product interessant is
   - Eerste indruk / hands-on ervaring
   - Voor wie is deze review bedoeld
   - Wat je in deze review leert

2. **Product Overzicht met Afbeelding** (VERPLICHT - plaats direct na intro)

<div style="margin: 40px 0; padding: 30px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
  <h2 style="margin: 0 0 24px 0; font-size: 32px; color: #1e293b; font-weight: 700;">${product.title} - Het complete overzicht</h2>
  
  <div style="display: grid; grid-template-columns: 320px 1fr; gap: 40px; align-items: start;">
    <div style="text-align: center;">
      <img src="${product.image?.url || ''}" alt="${product.title}" style="width: 100%; height: auto; border-radius: 16px; box-shadow: 0 12px 32px rgba(0,0,0,0.15); margin-bottom: 20px;" />
      <a href="${product.affiliateUrl}" target="_blank" rel="noopener noreferrer sponsored" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 18px; box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5); transition: all 0.3s;">
        🛒 Bekijk Beste Prijs →
      </a>
      <p style="margin-top: 16px; font-size: 28px; font-weight: 800; color: #3b82f6;">€${product.price?.toFixed(2) || '0.00'}</p>
    </div>
    
    <div>
      <div style="background: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <h3 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px; font-weight: 700;">📋 Specificaties</h3>
        <ul style="margin: 0; padding-left: 24px; color: #334155; line-height: 2;">
          <li><strong>Product:</strong> ${product.title}</li>
          <li><strong>Prijs:</strong> €${product.price?.toFixed(2) || '0.00'}</li>
          <li><strong>Rating:</strong> ⭐⭐⭐⭐⭐ (${product.rating || 'N/A'})</li>
          ${product.summary ? `<li><strong>Samenvatting:</strong> ${product.summary}</li>` : ''}
        </ul>
      </div>
      
      <div style="background: #fef3c7; padding: 20px; border-radius: 12px; border-left: 5px solid #f59e0b;">
        <p style="margin: 0; font-size: 16px; line-height: 1.7; color: #78350f;"><strong>💡 TL;DR:</strong> [Schrijf hier 2-3 zinnen met de kernboodschap van deze review - waarom is dit product de moeite waard of niet?]</p>
      </div>
    </div>
  </div>
</div>

3. **<h2>Technische specificaties en features</h2>**
   - Gedetailleerd overzicht van ALLE belangrijke specs
   - Gebruik <h3> voor elke hoofdcategorie (Design, Prestaties, Materiaal, etc.)
   - Beschrijf elk kenmerk uitgebreid in 2-3 alinea's
   - Wat maakt dit product technisch uniek?
   - Vergelijk met concurrenten waar relevant

4. **<h2>In de praktijk: hands-on ervaring</h2>**
   - <h3>Eerste indruk en unboxing</h3>
     - Wat viel op bij het uitpakken?
     - Verpakking, accessoires, handleiding
     - Eerste setup/installatie ervaring
   
   - <h3>Dagelijks gebruik</h3>
     - Hoe presteert het in normale scenario's?
     - Concrete voorbeelden van gebruik
     - Wat valt op na een week/maand gebruik?
   
   - <h3>Prestaties in echte situaties</h3>
     - Test verschillende scenario's
     - Hoe presteert het onder druk?
     - Verschillen tussen specs en werkelijkheid

5. **<h2>Diepgaande analyse: voordelen en nadelen</h2>**
   
   <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 30px 0;">
     <div style="background: linear-gradient(135deg, #ecfdf5, #d1fae5); padding: 30px; border-radius: 16px; border-left: 6px solid #10b981;">
       <h3 style="margin: 0 0 20px 0; color: #065f46; font-size: 24px; font-weight: 700; display: flex; align-items: center;">
         <span style="margin-right: 12px; font-size: 28px;">✅</span> Sterke punten
       </h3>
       <ul style="margin: 0; padding-left: 24px; color: #065f46; line-height: 2;">
         ${(product.pros || []).map((pro: string) => `<li><strong>${pro}</strong> - [Leg uit WAAROM dit een voordeel is met concrete voorbeelden]</li>`).join('\n         ')}
       </ul>
     </div>
     
     <div style="background: linear-gradient(135deg, #fef2f2, #fee2e2); padding: 30px; border-radius: 16px; border-left: 6px solid #ef4444;">
       <h3 style="margin: 0 0 20px 0; color: #991b1b; font-size: 24px; font-weight: 700; display: flex; align-items: center;">
         <span style="margin-right: 12px; font-size: 28px;">❌</span> Zwakke punten
       </h3>
       <ul style="margin: 0; padding-left: 24px; color: #991b1b; line-height: 2;">
         ${(product.cons || []).map((con: string) => `<li><strong>${con}</strong> - [Leg uit waarom dit een nadeel is en voor wie]</li>`).join('\n         ')}
       </ul>
     </div>
   </div>

6. **<h2>Vergelijking met alternatieven</h2>**
   - Noem 2-3 directe concurrenten (vergelijkbare producten in deze categorie)
   - Maak een vergelijkingstabel met specs
   - Waar scoort ${product.title} beter?
   - Waar blijft het achter bij de concurrentie?
   - Prijs-kwaliteit vergelijking

7. **<h2>Voor wie is ${product.title} geschikt?</h2>**
   
   <div style="margin: 30px 0;">
     <div style="background: #dbeafe; padding: 24px; border-radius: 12px; margin-bottom: 20px; border-left: 5px solid #3b82f6;">
       <h3 style="margin: 0 0 16px 0; color: #1e40af; font-size: 20px; font-weight: 700;">✅ Perfect voor:</h3>
       <ul style="margin: 0; padding-left: 24px; color: #1e40af; line-height: 2;">
         <li>[Specifieke gebruikersgroep 1 met uitleg waarom]</li>
         <li>[Specifieke use-case 1 met concrete scenario]</li>
         <li>[Specifieke situatie 1 waar dit product uitblinkt]</li>
       </ul>
     </div>
     
     <div style="background: #fee2e2; padding: 24px; border-radius: 12px; border-left: 5px solid #ef4444;">
       <h3 style="margin: 0 0 16px 0; color: #991b1b; font-size: 20px; font-weight: 700;">❌ Minder geschikt voor:</h3>
       <ul style="margin: 0; padding-left: 24px; color: #991b1b; line-height: 2;">
         <li>[Gebruikersgroep die beter iets anders kan kiezen]</li>
         <li>[Scenario's waar dit product tekortschiet]</li>
         <li>[Situaties waar alternatieven beter zijn]</li>
       </ul>
     </div>
   </div>

8. **<h2>Prijs-kwaliteit verhouding</h2>**
   - Is de prijs van €${product.price?.toFixed(2)} eerlijk voor wat je krijgt?
   - Waar zit de waarde in dit product?
   - Vergelijking met duurdere alternatieven
   - Vergelijking met goedkopere alternatieven
   - Zijn er vaak aanbiedingen of kortingen?
   - Wat krijg je voor je geld?

9. **<h2>Veelgestelde vragen over ${product.title}</h2>**
   
   Minimaal 5-7 FAQ's in dit format:
   
   <h3>Vraag 1: [Concrete vraag die kopers hebben]?</h3>
   <p>[Uitgebreid antwoord met praktische informatie]</p>
   
   [Herhaal voor alle FAQ's]

10. **<h2>Eindoordeel en conclusie</h2>**
    
<div style="margin: 40px 0; padding: 40px; background: linear-gradient(135deg, #ede9fe, #ddd6fe); border-radius: 16px; box-shadow: 0 12px 32px rgba(0,0,0,0.1);">
  <h3 style="margin: 0 0 24px 0; font-size: 32px; color: #5b21b6; font-weight: 800; text-align: center;">⭐ Ons eindoordeel: [X/10]</h3>
  
  <p style="font-size: 18px; line-height: 1.9; color: #4c1d95; margin-bottom: 24px;">[Schrijf hier 2-3 uitgebreide alinea's met je eindoordeel. Vat alle belangrijke punten samen en geef een duidelijk advies.]</p>
  
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 30px 0;">
    <div style="background: white; padding: 24px; border-radius: 12px;">
      <h4 style="margin: 0 0 12px 0; color: #10b981; font-size: 20px; font-weight: 700;">🏆 Beste eigenschap:</h4>
      <p style="margin: 0; color: #334155; font-size: 16px; line-height: 1.7;">[De absolute killer feature die dit product onderscheidt]</p>
    </div>
    
    <div style="background: white; padding: 24px; border-radius: 12px;">
      <h4 style="margin: 0 0 12px 0; color: #ef4444; font-size: 20px; font-weight: 700;">⚠️ Grootste minpunt:</h4>
      <p style="margin: 0; color: #334155; font-size: 16px; line-height: 1.7;">[Het belangrijkste nadeel dat kopers moeten weten]</p>
    </div>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 12px; text-align: center; margin-top: 24px;">
    <h4 style="margin: 0 0 16px 0; color: #1e293b; font-size: 22px; font-weight: 700;">📣 Ons verdict:</h4>
    <p style="margin: 0 0 24px 0; font-size: 18px; color: #334155; font-weight: 600;">[AANRADER / MET VOORBEHOUD / NIET AANRADEN]</p>
    <p style="margin: 0 0 28px 0; font-size: 16px; line-height: 1.8; color: #475569;">[Duidelijke aanbeveling met een zin: Voor wie is dit wel/niet geschikt?]</p>
    
    <a href="${product.affiliateUrl}" target="_blank" rel="noopener noreferrer sponsored" style="display: inline-block; padding: 18px 48px; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 20px; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4); transition: all 0.3s;">
      🛒 Bekijk ${product.title} op Bol.com →
    </a>
  </div>
</div>

**SCHRIJFSTIJL VOOR REVIEWS:**
- DIEPGAAND en UITGEBREID - dit is geen korte overview maar een volledige review
- Gebruik CONCRETE voorbeelden en scenario's
- Wees EERLIJK over zowel voordelen als nadelen
- Schrijf alsof je een vriend advies geeft die overweegt dit product te kopen
- Conversationeel en toegankelijk (B1 niveau)
- Gebruik 'je/jij' vorm
- Wissel zinslengtes af (kort, middel, lang)
- MINIMAAL 2500-3000 woorden - dit moet een uitgebreide review zijn!
- Geloofwaardigheid is key - wees genuanceerd en eerlijk

**LINK GEBRUIK:**
- Gebruik de affiliate link: ${product.affiliateUrl}
- Plaats minimaal 3-4 keer in het artikel op natuurlijke plekken
- Gebruik target="_blank" rel="noopener noreferrer sponsored"
- Varieer de link tekst: "Bekijk op Bol.com", "Bekijk beste prijs", "Koop ${product.title}", etc.

**AFBEELDING:**
${product.image?.url ? `- Gebruik de productafbeelding: ${product.image.url}
- Plaats deze in het Product Overzicht blok (al voorzien in template)` : '- Geen afbeelding beschikbaar voor dit product'}`;
  }

  // Determine target word count
  // Reviews need to be longer (2500-3000 words)
  const baseWordCount = options?.reviewProduct ? 2800 : (options?.targetWordCount || 2000);
  const targetWordCount = options?.targetWordCount || baseWordCount;
  const wordCountRange = `${targetWordCount - 200}-${targetWordCount + 200}`;
  
  // Build knowledge base section
  let knowledgeBaseSection = '';
  if (options?.knowledgeBase) {
    knowledgeBaseSection = `\n\n📚 KNOWLEDGE BASE CONTEXT - Gebruik deze informatie waar relevant:
${options.knowledgeBase}

BELANGRIJKE INSTRUCTIES VOOR KNOWLEDGE BASE:
- Gebruik deze informatie ALLEEN waar het relevant en waardevol is voor de lezer
- Verwerk deze kennis natuurlijk in je content - niet als aparte sectie
- Parafraseer en integreer - kopieer niet letterlijk
- Gebruik het om je artikel authoritatief en gedetailleerd te maken`;
  }

  // Build SEO features sections
  let seoFeaturesSection = '';
  
  // Direct Answer (standaard aan, tenzij expliciet uitgeschakeld)
  if (options?.includeDirectAnswer !== false) {
    seoFeaturesSection += `\n\n🎯 **DIRECT ANTWOORD (VERPLICHT):**
Voeg direct na de introductie een beknopt, direct antwoord toe op de hoofdvraag:

<p><strong>[Beknopt antwoord op de hoofdvraag in 2-3 zinnen met dikgedrukte tekst. Wat is de kernboodschap van dit artikel?]</strong></p>

⚠️ KRITIEK: 
- GEEN box, heading of speciale styling
- Alleen een <p> met <strong> voor het dikgedrukte antwoord
- Gewoon als onderdeel van de normale tekst flow
- Dit moet een duidelijk, direct antwoord geven op de hoofdvraag

✅ CORRECT: <p><strong>De beste compacte wasmachine voor 2025 is de Inventum VWM5001W vanwege zijn efficiëntie en prijs.</strong></p>
❌ FOUT: Een box met styling of een aparte heading

Zorg ervoor dat je de <strong> tags BEHOUDT in je output!`;
  }

  // FAQ Section (standaard aan, tenzij expliciet uitgeschakeld)
  if (options?.includeFAQ !== false) {
    seoFeaturesSection += `\n\n❓ **FAQ SECTIE (VERPLICHT):**
Voeg aan het einde van het artikel (vóór de conclusie) een FAQ sectie toe met 5-7 veelgestelde vragen:

<h2>Veelgestelde vragen over ${topic}</h2>

<h3>[Relevante vraag die lezers vaak hebben]?</h3>
<p>[Helder, beknopt antwoord in 2-4 zinnen. Geef praktische informatie.]</p>

<h3>[Tweede relevante vraag]?</h3>
<p>[Helder, beknopt antwoord in 2-4 zinnen. Geef praktische informatie.]</p>

[... Herhaal dit format voor 3-5 meer FAQ items ...]

**BELANGRIJKE INSTRUCTIES VOOR FAQ:**
- Gebruik ALLEEN gewone <h3> en <p> tags, GEEN divs of styling
- Elke vraag moet RELEVANT zijn voor het onderwerp "${topic}"
- Focus op vragen die lezers ECHT hebben (denk aan "hoe", "waarom", "wat is")
- Antwoorden moeten helder en beknopt zijn (2-4 zinnen)
- Gebruik waar mogelijk het focus keyword "${keywords[0]}" of variaties
- Maak vragen specifiek en praktisch (niet te algemeen)
- Varieer de vraagformulering (niet steeds "Wat is...")
- GEEN emoji's of speciale karakters in de output`;
  }

  // YouTube Video Embed wordt automatisch toegevoegd via youtube-search.ts na content generatie
  // Geen prompt nodig - de video wordt automatisch gezocht en ingevoegd

  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: `${langConfig.systemPrompt} Schrijf direct het volledige HTML artikel zonder inleiding, uitleg of meta-commentaar.

⚠️ KRITIEK: Begin DIRECT met HTML content - GEEN tekst zoals "Oké, hier is...", "Natuurlijk...", "---" of andere intro.
⚠️ Start METEEN met de eerste <p> tag of <h2> tag van het artikel zelf!

Toon: ${tone}
${brandInfo ? `Merk info: ${brandInfo}` : ''}${knowledgeBaseSection}

Gebruik HTML formatting:
- <h2> voor hoofdsecties
- <h3> voor subsecties
- <p> voor paragrafen
- <ul> en <li> voor lijsten
- <strong> voor nadruk
- <table> voor vergelijkingen (optioneel)

Schrijf een COMPLETE en UITGEBREIDE blog over: ${topic}
Taal: ${langConfig.name}

🎯 FOCUS KEYWORD (gebruik dit in het hele artikel): ${keywords[0]}
Secondary keywords (LSI keywords): ${keywords.slice(1).join(', ')}

${langConfig.languageRule}

${getBannedWordsInstructions(language === 'NL' ? 'nl' : language === 'EN' ? 'en' : 'de')}

🎯 SEO OPTIMALISATIE (KRITIEK):
1. **Main Keyword Plaatsing:**
   - Gebruik "${keywords[0]}" minimaal 5-7 keer verspreid door het artikel
   - Plaats in H2 headings (minimaal 2 keer)
   - Gebruik in eerste en laatste paragraaf
   - Gebruik natuurlijke variaties (bijv. voor "waterfilter": "waterfilters", "filtersysteem", "waterzuivering")

2. **LSI Keywords (Latent Semantic Indexing):**
   - Integreer ALLE secondary keywords natuurlijk: ${keywords.slice(1).join(', ')}
   - Gebruik synoniemen en gerelateerde termen
   - Gebruik long-tail variaties van keywords
   - Semantisch gerelateerde woorden die context geven

3. **Keyword Density:**
   - Main keyword: 1-2% van totale woorden
   - Natuurlijke plaatsing - NIET geforceerd
   - Varieer zinstructuren rond keywords

🔴 KRITIEKE REGELS VOOR HEADINGS EN TITELS:

1. ${langConfig.headingRule}
   
   ✅ CORRECT VOORBEELD: "${langConfig.exampleHeading}"

2. DUBBELE PUNTEN IN HEADINGS (ABSOLUUT VERBODEN):
   🚫 GEBRUIK NOOIT dubbele punten (:) in H2 of H3 headings!
   🚫 GEEN scheidingstekens zoals dubbele punt (:), pijl (→), streepje (-) aan het begin
   🚫 GEEN labels zoals "Tip 1:", "Stap 2:", "Conclusie:", "De uitdaging:", etc.
   ⚠️ Dubbele punten en scheidingstekens maken headings onnatuurlijk en slecht voor SEO
   
   ✅ CORRECT: "Hoe werken vergelijkingssites eigenlijk"
   ✅ CORRECT: "De beste manieren om geld te besparen"
   ✅ CORRECT: "Wat je moet weten voor je koopt"
   ✅ CORRECT: "Vind de perfecte keyboardles in Hoogeveen"
   ❌ FOUT: "De cruciale vraag: hoe werken vergelijkingssites eigenlijk?"
   ❌ FOUT: "De afsluiting: is het de investering waard?"
   ❌ FOUT: "Tip 1: let op de prijs"
   ❌ FOUT: "De uitdaging van een volle agenda: vind de keyboardles"
   ❌ FOUT: "Waarom kiezen: de voordelen op een rij"
   
   💡 HERFORMULEER ALTIJD zonder dubbele punt:
   - "De uitdaging: tijd vinden" → "Hoe vind je tijd voor keyboardlessen"
   - "Tip 1: kies de juiste docent" → "Kies de juiste keyboarddocent voor jouw niveau"
   - "Conclusie: is het de moeite waard" → "Is een keyboardles de investering waard"

3. SEO-GEOPTIMALISEERDE HEADINGS (VERPLICHT):
   ⚠️ Gebruik het FOCUS KEYWORD "${keywords[0]}" of variaties ervan in minimaal 2 H2 headings
   ⚠️ Gebruik LSI keywords in andere H2 headings
   ⚠️ Maak headings SPECIFIEK voor het onderwerp - geen generieke teksten
   ⚠️ GEEN scheidingstekens zoals "De afsluiting:", "Conclusie:", "Tip 1:", etc.
   ⚠️ GEEN generieke zinnen zoals "Is het de investering waard?", "Wat zijn de voordelen?"
   
   ✅ CORRECT (voor "waterfilter"):
      - "Waarom een waterfilter essentieel is voor zuiver drinkwater" (focus keyword)
      - "De beste waterfilters voor thuis in 2025" (focus keyword + variatie)
      - "Hoe een waterzuiveringssysteem werkt en waarom het belangrijk is" (LSI)
      - "Waterfilter onderhoud tips voor optimale prestaties" (focus keyword)
   
   ❌ FOUT (generiek/niet SEO):
      - "De afsluiting: is het de investering waard?"
      - "Wat zijn de voordelen?"
      - "Tip 1: Let op de prijs"
      - "Conclusie"

Dit geldt voor ALLE H2 en H3 headings in het artikel!

${affiliateLinkSection}${productLinkSection}${productListSection}${reviewSection}${seoFeaturesSection}

BELANGRIJKE SCHRIJFINSTRUCTIES:
- Schrijf ${langConfig.writingStyle}
- Controleer ELKE zin: Is deze compleet? Zijn er geen rare komma's? Is dit correct ${langConfig.name}?
- Als de titel specifieke items belooft (bijv. "5 routines", "7 tips"), zorg dat je ALLE items volledig uitwerkt
- Schrijf NIET slechts een introductie - werk elk punt volledig uit met details en voorbeelden
- Stop NIET halverwege - voltooi het hele artikel tot en met de conclusie
- Gebruik GEVARIEERDE zinconstructies - vermijd repetitie
- Zorg dat elke zin grammaticaal correct, logisch en COMPLEET is
- GEEN afgebroken zinnen of zinnen die eindigen met een komma

Structuur:
1. Pakkende intro (1-2 paragrafen) - ZONDER links
2. 5-7 hoofdsecties met SEO-geoptimaliseerde H2 headings die keywords bevatten
   (elk volledig uitgewerkt met minimaal 3-4 paragrafen)
3. Elk hoofdsectie met praktische details, voorbeelden en tips
4. Tussenkopjes (H3) voor subsecties waar nodig
5. Sterke conclusie met call-to-action - ZONDER links

🎯 DOELLENGTE: ${wordCountRange} woorden (streef naar ${targetWordCount} woorden).
${!options?.productList ? `Voeg [IMAGE-2], [IMAGE-3], etc. toe waar afbeeldingen passen (start bij [IMAGE-2] want [IMAGE-1] is de featured image).

⚠️ BELANGRIJK VOOR AFBEELDINGEN:
- Begin met [IMAGE-2] voor de eerste afbeelding IN de content
- [IMAGE-1] wordt ALLEEN gebruikt als featured/uitgelichte afbeelding en verschijnt NIET in de content
- Gebruik [IMAGE-2], [IMAGE-3], [IMAGE-4], etc. voor afbeeldingen in het artikel
- Plaats NOOIT [IMAGE-1] in de content zelf!
- ⚠️ NOOIT 2 afbeeldingen direct achter elkaar plaatsen! Plaats altijd minstens 2-3 paragrafen tekst tussen elke afbeelding
- ⚠️ Verdeel afbeeldingen gelijkmatig over het artikel - niet allemaal aan het begin of einde` : `
⚠️ DIT IS EEN PRODUCTLIJST ARTIKEL:
- Gebruik ALLEEN de echte productafbeeldingen die bij elk product worden vermeld
- Voeg GEEN [IMAGE-X] placeholders toe - alle afbeeldingen komen van Bol.com
- De productafbeeldingen staan al in de template bij elk product
- GEEN AI-gegenereerde afbeeldingen gebruiken!`}

SCHRIJF HET VOLLEDIGE ARTIKEL - STOP NIET HALVERWEGE!
Controleer na elke paragraaf: Zijn alle zinnen compleet? Is dit correct Nederlands zonder fouten?`,
    },
  ];

  const generatedContent = await smartModelRouter('blog_writing', messages);
  
  // ✅ Post-processing: verwijder ongewenste intro tekst
  let cleanedContent = generatedContent;
  
  // Verwijder "Oké, hier is...", "Natuurlijk...", "---" en andere intro patronen
  cleanedContent = cleanedContent.replace(/^(Oké|Natuurlijk|Zeker|Sure|Here is|Here's|Hier is)[,!.]?\s*(hier is|is)?[^<\n]*?---\s*/i, '');
  cleanedContent = cleanedContent.replace(/^(Oké|Natuurlijk|Zeker)[,!.]?\s+[^<]*?(<p>|<h2>)/i, '$2');
  cleanedContent = cleanedContent.replace(/^---+\s*/gm, '');
  cleanedContent = cleanedContent.trim();
  
  // ✅ Post-processing: verwijder dubbele punten en scheidingstekens uit headings
  cleanedContent = cleanHeadings(cleanedContent);
  
  console.log('✅ Headings gecleaned - dubbele punten en scheidingstekens verwijderd');
  
  // 🔗 NIEUWE POST-PROCESSING: Intelligente product link insertie
  // Detecteer alle genoemde producten en voeg affiliate links toe waar ze ontbreken
  if (options?.productLinks && options.productLinks.length > 0) {
    console.log('🔍 Scanning content voor genoemde producten...');
    cleanedContent = insertMissingProductLinks(cleanedContent, options.productLinks);
  }
  
  if (options?.productList && options.productList.length > 0) {
    console.log('🔍 Scanning content voor producten uit productlijst...');
    const productLinksFromList = options.productList.map(p => ({
      name: p.title,
      url: p.affiliateUrl,
      price: `€${p.price?.toFixed(2)}` || '',
      description: p.summary || ''
    }));
    cleanedContent = insertMissingProductLinks(cleanedContent, productLinksFromList);
  }
  
  return cleanedContent;
}

/**
 * 🔗 INTELLIGENTE PRODUCT LINK INSERTIE
 * Scant de content voor alle genoemde producten en voegt automatisch affiliate links toe
 * waar ze ontbreken. Dit zorgt ervoor dat ALLE genoemde producten een link krijgen.
 */
function insertMissingProductLinks(
  content: string,
  productLinks: Array<{name: string; url: string; price?: string; description?: string}>
): string {
  let updatedContent = content;
  let linksAdded = 0;
  
  for (const product of productLinks) {
    // Extract product name (remove price info if present)
    const productName = product.name.replace(/\s*\(€[\d.,]+\)/g, '').trim();
    
    // Escape special regex characters in product name
    const escapedName = productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Check if product is already linked
    const alreadyLinkedRegex = new RegExp(`<a[^>]*>${escapedName}[^<]*<\\/a>`, 'gi');
    if (alreadyLinkedRegex.test(updatedContent)) {
      console.log(`  ✓ ${productName} is al gelinkt`);
      continue;
    }
    
    // Find all mentions of this product (case-insensitive, but not inside HTML tags)
    // Match product name that's NOT inside an HTML tag
    const productMentionRegex = new RegExp(
      `(?<!<[^>]*)\\b(${escapedName})\\b(?![^<]*>)`,
      'gi'
    );
    
    const matches = updatedContent.match(productMentionRegex);
    
    if (matches && matches.length > 0) {
      console.log(`  🔗 ${productName} gevonden ${matches.length}x - links toevoegen...`);
      
      // Replace FIRST occurrence with affiliate link (to avoid over-linking)
      updatedContent = updatedContent.replace(
        productMentionRegex,
        (match) => {
          // Only replace the first match
          if (linksAdded < 1) {
            linksAdded++;
            return `<a href="${product.url}" target="_blank" rel="noopener noreferrer sponsored" style="color: #3b82f6; text-decoration: underline; font-weight: 600;">${match}</a>`;
          }
          return match;
        }
      );
      
      linksAdded = 0; // Reset for next product
    } else {
      console.log(`  ⚠️ ${productName} niet gevonden in content`);
    }
  }
  
  return updatedContent;
}

/**
 * Social Media Generator Tool met Intelligente Routing
 */
export async function generateSocialMedia(
  topic: string,
  platform: 'instagram' | 'tiktok' | 'youtube' | 'linkedin',
  brandInfo?: string
): Promise<{
  caption: string;
  hashtags: string[];
  hooks?: string[];
}> {
  const platformGuides: Record<string, string> = {
    instagram: 'Instagram: 2200 karakters max, 3-5 regels, emoji, 10-15 hashtags',
    tiktok: 'TikTok: Kort en krachtig, trend-gevoelig, 3-5 hashtags',
    youtube: 'YouTube: Uitgebreide beschrijving, timestamps, call-to-action, keywords',
    linkedin: 'LinkedIn: Professioneel, thought leadership, 1-3 hashtags',
  };

  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: `Als social media expert, maak boeiende content voor ${platform}. 
${platformGuides[platform]}
${brandInfo ? `Merk info: ${brandInfo}` : ''}

Maak social media content voor ${platform} over: ${topic}

Geef de output als JSON:
{
  "caption": "de post tekst",
  "hashtags": ["hashtag1", "hashtag2", ...],
  "hooks": ["hook1 voor video", "hook2", ...]
}`,
    },
  ];

  const response = await smartModelRouter('social_media', messages);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('JSON parse error:', error);
  }

  // Fallback als JSON parsing mislukt
  return {
    caption: response,
    hashtags: [],
  };
}

/**
 * Video Script Generator Tool met Intelligente Routing
 */
export async function generateVideoScript(
  topic: string,
  duration: number = 60,
  style: 'educational' | 'entertaining' | 'promotional' = 'educational',
  brandInfo?: string
): Promise<{
  title: string;
  hook: string;
  script: string[];
  cta: string;
}> {
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: `Als video script schrijver, maak boeiende video scripts in het Nederlands.
Stijl: ${style}
Duur: ${duration} seconden
${brandInfo ? `Merk info: ${brandInfo}` : ''}

Maak een video script over: ${topic}

Structuur:
1. Pakkende hook (eerste 3 seconden)
2. Intro (probleem/vraag)
3. Hoofdcontent (3-5 punten)
4. Conclusie
5. Sterke CTA

Geef output als JSON:
{
  "title": "video titel",
  "hook": "pakkende openingszin",
  "script": ["scene 1 tekst", "scene 2 tekst", ...],
  "cta": "call to action"
}`,
    },
  ];

  const response = await smartModelRouter('video_script', messages);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('JSON parse error:', error);
  }

  // Fallback
  return {
    title: topic,
    hook: 'Wist je dat...',
    script: [response],
    cta: 'Like en volg voor meer!',
  };
}

/**
 * Master Agent - orchestreert alle tools met Intelligente Routing
 */
export async function agentExecute(
  task: string,
  context?: {
    clientId?: string;
    brandInfo?: string;
    websiteContent?: string;
    preferences?: any;
  }
): Promise<any> {
  // Bepaal welke tool(s) nodig zijn
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: `Als AI agent die content taken kan uitvoeren: Analyseer de taak en bepaal welke acties nodig zijn.

Beschikbare tools:
- webResearch: voor het zoeken van informatie
- planContent: voor het maken van content plannen
- generateBlog: voor het schrijven van blogs
- generateSocialMedia: voor social media posts
- generateVideoScript: voor video scripts

Geef je antwoord als JSON:
{
  "tools": ["tool1", "tool2"],
  "parameters": { "tool1": {...}, "tool2": {...} },
  "reasoning": "waarom deze tools"
}

Taak: ${task}
${context?.brandInfo ? `\nMerk info: ${context.brandInfo}` : ''}
${context?.websiteContent ? `\nWebsite content: ${context.websiteContent.substring(0, 500)}...` : ''}`,
    },
  ];

  const planResponse = await smartModelRouter('planning', messages);

  let plan;
  try {
    const jsonMatch = planResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      plan = JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Plan parsing error:', error);
    // Fallback: probeer de taak direct uit te voeren
    plan = { tools: ['generateBlog'], parameters: { generateBlog: { topic: task } } };
  }

  console.log('Agent plan:', plan);

  // Voer de tools uit
  const results: any = {};
  
  for (const tool of plan.tools || []) {
    const params = plan.parameters?.[tool] || {};
    
    try {
      switch (tool) {
        case 'webResearch':
          results.research = await webResearch(params.query || task, context?.brandInfo);
          break;
        case 'planContent':
          results.plan = await planContent(
            params.topic || task,
            params.contentType || 'all',
            context?.brandInfo
          );
          break;
        case 'generateBlog':
          results.blog = await generateBlog(
            params.topic || task,
            params.keywords || [task],
            params.tone || 'professioneel',
            context?.brandInfo
          );
          break;
        case 'generateSocialMedia':
          results.social = await generateSocialMedia(
            params.topic || task,
            params.platform || 'instagram',
            context?.brandInfo
          );
          break;
        case 'generateVideoScript':
          results.video = await generateVideoScript(
            params.topic || task,
            params.duration || 60,
            params.style || 'educational',
            context?.brandInfo
          );
          break;
      }
    } catch (error: any) {
      console.error(`Tool ${tool} fout:`, error);
      results[tool + '_error'] = error.message;
    }
  }

  return {
    plan,
    results,
    task,
  };
}

export default {
  // ⚡ Nieuwe slimme routing functies
  smartModelRouter,
  setModelTier,
  getModelTier,
  
  // 🌐 Real-time Web Search
  realTimeWebSearch,
  
  // 🔧 Tool functies
  webResearch,
  planContent,
  generateBlog,
  generateSocialMedia,
  generateVideoScript,
  agentExecute,
  
  // 📚 Legacy (backwards compatibility)
  aimlChatCompletion,
  
  // 📖 Modellen database
  AVAILABLE_MODELS,
  MODEL_ROUTING,
};
