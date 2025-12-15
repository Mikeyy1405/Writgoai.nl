
/**
 * 🚀 AIML API - Complete Implementation
 * Gebaseerd op officiële AI/ML API documentatie
 * 
 * Features:
 * - 200+ AI modellen (GPT, Claude, Gemini, DeepSeek, etc)
 * - Image generation (Flux, DALL-E, Imagen)
 * - Video generation (Kling, MiniMax, Veo)
 * - Speech-to-Text & Text-to-Speech
 * - Web Search & Real-time information
 * - Vision & OCR capabilities
 */

const AIML_API_KEY = process.env.AIML_API_KEY || '';
const AIML_BASE_URL = 'https://api.aimlapi.com';

if (!AIML_API_KEY) {
  console.warn('⚠️ AIML_API_KEY niet ingesteld!');
}

// ═══════════════════════════════════════════════════════
// 📝 TEXT MODELS (LLM)
// ═══════════════════════════════════════════════════════

/**
 * Beste modellen per taak volgens officiële docs
 */
export const TEXT_MODELS = {
  // 🚀 GPT-5 modellen (OpenAI - NIEUWSTE 2025)
  GPT5: 'gpt-5-2025-08-07', // Nieuwste OpenAI flagship
  GPT5_MINI: 'gpt-5-mini-2025-08-07', // Snelle GPT-5 variant
  GPT5_NANO: 'gpt-5-nano-2025-08-07', // Ultra snelle GPT-5
  GPT5_CHAT: 'anthropic/claude-sonnet-4.5', // Beste voor content (was gpt-5-chat-latest)
  
  // GPT-4 modellen (OpenAI)
  REASONING: 'gpt-4o', // Beste voor complexe redeneringen
  FAST: 'gpt-4o-mini', // Snelste GPT-4
  WEB_SEARCH: 'gpt-4o-search-preview', // Met real-time web search!
  
  // Google Gemini (Beste context length) - NIEUWSTE
  GEMINI_PRO_3: 'gemini-3-preview', // 🆕 NIEUWSTE - Gemini 3 (beste reasoning!)
  GEMINI_PRO_25: 'gemini-2.5-pro', // Gemini 2.5 flagship
  GEMINI_FLASH: 'google/gemini-2.5-flash', // 1M tokens, snel en goedkoop
  GEMINI_PRO: 'google/gemini-2.5-pro', // 1M tokens, krachtigste
  
  // Claude (Anthropic - Beste voor creative writing)
  CLAUDE_OPUS: 'anthropic/claude-opus-4.1', // Beste kwaliteit
  CLAUDE_45: 'claude-sonnet-4-5', // 🆕 Nieuwste Claude 4.5 - Beste balans
  CLAUDE_SONNET: 'claude-sonnet-4-5', // Alias voor Claude 4.5
  CLAUDE_37: 'claude-3-7-sonnet-20250219', // Legacy versie
  
  // DeepSeek (Beste prijs/kwaliteit ratio)
  DEEPSEEK: 'deepseek/deepseek-r1', // DeepSeek R1, zeer krachtig
  DEEPSEEK_CHAT: 'deepseek-chat', // DeepSeek V3
  
  // Meta Llama (Open source)
  LLAMA: 'meta-llama/llama-3.3-70b-versatile',
  LLAMA_33: 'meta-llama/llama-3.3-70b-instruct', // 🆕 Nieuwste Llama 3.3
  
  // Qwen (Alibaba - Excellent voor meerdere talen)
  QWEN_MAX: 'qwen-max',
  QWEN_TURBO: 'qwen-turbo', // 1M tokens!
  
  // Grok (xAI)
  GROK: 'x-ai/grok-4-fast-reasoning',
} as const;

export interface ChatMessage {
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

export interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  tools?: any[];
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  stream?: boolean;
  // Usage tracking (optional)
  trackUsage?: {
    clientId?: string;
    projectId?: string;
    feature: string;
    contentId?: string;
  };
}

/**
 * Chat completion met AIML API
 * Volledig compatible met OpenAI SDK
 */
export async function chatCompletion(options: ChatCompletionOptions): Promise<any> {
  try {
    // 🎯 CLAUDE DETECTION - Claude models need special handling
    const isClaude = options.model.toLowerCase().includes('claude');
    const isHaiku = options.model.toLowerCase().includes('haiku');
    
    // 🎨 Extract system messages for Claude (Claude doesn't support system role in messages)
    let systemPrompt: string | undefined = undefined;
    let messagesToProcess = options.messages;
    
    if (isClaude) {
      // Find all system messages
      const systemMessages = options.messages.filter(msg => msg.role === 'system');
      if (systemMessages.length > 0) {
        // Combine all system messages into one
        systemPrompt = systemMessages
          .map(msg => msg.content)
          .filter(content => content && content.trim())
          .join('\n\n');
        
        // Remove system messages from regular messages array
        messagesToProcess = options.messages.filter(msg => msg.role !== 'system');
        
        console.log(`🔵 Claude detected - extracted system prompt (${systemPrompt.length} chars)`);
      }
      
      // 🔥 FIX: Claude Haiku heeft problemen met tools in bepaalde gevallen
      // Verwijder tools voor Haiku als er weinig messages zijn
      if (isHaiku && messagesToProcess.length <= 2 && options.tools) {
        console.log('⚠️ Claude Haiku detected with few messages - disabling tools to prevent 400 error');
        options.tools = undefined;
        options.tool_choice = undefined;
      }
    }
    
    // 🎯 PERPLEXITY/SONAR DETECTION - Strict message alternation required
    const isPerplexity = options.model.toLowerCase().includes('perplexity') || 
                         options.model.toLowerCase().includes('sonar');
    
    // Valideer en clean messages - AIML API IS STRICT
    const cleanMessages = messagesToProcess
      .filter(msg => {
        // Filter invalid messages
        if (!msg || !msg.role) {
          console.warn('⚠️ Skipping message without role:', msg);
          return false;
        }
        
        // Tool messages moeten content EN tool_call_id hebben
        if (msg.role === 'tool') {
          if (!msg.tool_call_id) {
            console.warn('⚠️ Skipping tool message without tool_call_id');
            return false;
          }
          if (!msg.content || msg.content.trim() === '') {
            console.warn('⚠️ Skipping tool message without content');
            return false;
          }
          return true;
        }
        
        // Assistant messages met tool_calls mogen GEEN content hebben (of null)
        if (msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0) {
          return true;
        }
        
        // User/assistant messages zonder tool_calls moeten content hebben
        if (!msg.content || msg.content.trim() === '') {
          console.warn(`⚠️ Skipping ${msg.role} message without content`);
          return false;
        }
        
        return true;
      })
      .map(msg => {
        const cleaned: any = { 
          role: msg.role
        };
        
        // Handle content based on role
        if (msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0) {
          // Assistant with tool_calls: OMIT content field entirely (AIML doesn't accept null)
          // Don't set content at all
          cleaned.tool_calls = msg.tool_calls;
        } else {
          // All other messages: content must be non-empty string
          if (msg.content && typeof msg.content === 'string') {
            const trimmed = msg.content.trim();
            if (trimmed) {
              cleaned.content = trimmed;
            } else {
              // Fallback for empty content
              cleaned.content = ' ';
            }
          } else {
            // KRITIEKE FIX: Als message geen content heeft (en geen tool_calls), 
            // geef een default content in plaats van undefined
            console.warn(`⚠️ Message ${msg.role} heeft geen content, gebruik fallback`);
            cleaned.content = ' ';
          }
        }
        
        // Add tool_call_id for tool messages
        if (msg.tool_call_id) {
          cleaned.tool_call_id = msg.tool_call_id;
        }
        
        return cleaned;
      });

    // Validate we have at least one message
    if (cleanMessages.length === 0) {
      throw new Error('No valid messages after cleaning. Ensure all messages have proper role and content.');
    }
    
    // 🔥 FIX: Perplexity/Sonar requires strict user/assistant alternation
    // Merge consecutive messages of the same role to ensure alternation
    let alternatingMessages = cleanMessages;
    if (isPerplexity && cleanMessages.length > 1) {
      console.log('🟣 Perplexity detected - ensuring message alternation');
      
      alternatingMessages = [];
      let lastRole: string | null = null;
      let accumulatedContent: string = '';
      
      for (let i = 0; i < cleanMessages.length; i++) {
        const msg = cleanMessages[i];
        const currentRole = msg.role;
        
        // Skip system messages for Perplexity (they don't support it well)
        if (currentRole === 'system') {
          // Prepend system message to first user message
          if (alternatingMessages.length === 0 && msg.content) {
            accumulatedContent = msg.content + '\n\n';
          }
          continue;
        }
        
        // If same role as previous, merge content
        if (currentRole === lastRole && currentRole !== 'tool') {
          if (msg.content) {
            accumulatedContent += '\n\n' + msg.content;
          }
        } else {
          // Different role - push accumulated message if any
          if (lastRole && accumulatedContent) {
            alternatingMessages.push({
              role: lastRole,
              content: accumulatedContent.trim()
            });
          }
          
          // Start new accumulation
          lastRole = currentRole;
          accumulatedContent = msg.content || '';
          
          // For tool messages, add immediately without accumulation
          if (currentRole === 'tool') {
            alternatingMessages.push(msg);
            lastRole = null;
            accumulatedContent = '';
          }
        }
      }
      
      // Push final accumulated message
      if (lastRole && accumulatedContent) {
        alternatingMessages.push({
          role: lastRole,
          content: accumulatedContent.trim()
        });
      }
      
      // Ensure we start with a user message (required by Perplexity)
      if (alternatingMessages.length > 0 && alternatingMessages[0].role !== 'user') {
        console.log('🟣 Perplexity: First message is not user, adding default user message');
        alternatingMessages.unshift({
          role: 'user',
          content: 'Please help me with the following:'
        });
      }
      
      console.log(`🟣 Perplexity: Merged ${cleanMessages.length} messages into ${alternatingMessages.length} alternating messages`);
    }

    console.log(`📝 Sending ${alternatingMessages.length} messages to AIML API:`, 
      alternatingMessages.map(m => ({
        role: m.role, 
        hasContent: !!m.content, 
        hasToolCalls: !!m.tool_calls,
        contentLength: m.content ? m.content.length : 0
      }))
    );

    // AIML API accepteert OpenAI format tools (type: "function", function: {...})
    // GEEN conversie nodig - stuur tools direct door
    // 🔥 FIX: Perplexity/Sonar doesn't support tools well - disable for Perplexity
    let convertedTools: any[] | undefined = undefined;
    if (options.tools && options.tools.length > 0 && !isPerplexity) {
      // Validate that tools are in OpenAI format
      const validTools = options.tools.filter((tool: any) => {
        if (!tool.type || tool.type !== 'function') {
          console.warn('⚠️ Skipping tool without type=function:', tool);
          return false;
        }
        if (!tool.function || !tool.function.name) {
          console.warn('⚠️ Skipping tool without function.name:', tool);
          return false;
        }
        return true;
      });
      
      if (validTools.length > 0) {
        convertedTools = validTools;
      }
    } else if (isPerplexity && options.tools && options.tools.length > 0) {
      console.log('🟣 Perplexity: Tools disabled - not supported well by Perplexity models');
    }

    const requestBody: any = {
      model: options.model,
      messages: alternatingMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 4000,
    };
    
    // 🔵 Add system prompt for Claude models (as separate parameter, not in messages)
    if (isClaude && systemPrompt) {
      requestBody.system = systemPrompt;
      console.log('🔵 Added system parameter for Claude');
    }
    
    // Only add tools if they're valid and converted
    if (convertedTools && convertedTools.length > 0) {
      requestBody.tools = convertedTools;
    }
    
    // Only add tool_choice if tools are present
    if (options.tool_choice && convertedTools && convertedTools.length > 0) {
      requestBody.tool_choice = options.tool_choice;
    }
    
    // Add stream if enabled
    if (options.stream) {
      requestBody.stream = true;
    }

    console.log('📤 AIML API Request:', {
      model: options.model,
      messageCount: cleanMessages.length,
      messageRoles: cleanMessages.map(m => m.role),
      hasTools: !!convertedTools,
      toolCount: convertedTools?.length || 0,
      stream: !!options.stream
    });
    
    // Debug: Log first message to check system role conversion
    if (cleanMessages.length > 0) {
      console.log('First message role:', cleanMessages[0].role);
    }
    
    // Debug: Log tool format if present
    if (convertedTools && convertedTools.length > 0) {
      console.log('Converted tools sample:', JSON.stringify(convertedTools[0], null, 2));
    }

    // 🔥 FIX: Add timeout to prevent hanging (especially for long Claude responses)
    // VERHOOGDE TIMEOUT: 5 minuten voor complexe blog generatie
    // Claude kan lang doen voor 1500+ woorden met research, afbeeldingen, FAQ, etc.
    const timeoutMs = 300000; // 5 MINUTEN timeout voor API calls
    
    let response;
    let lastError: any;
    
    // RETRY MECHANISME: Probeer maximaal 2x bij failures
    const maxRetries = 2;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn(`⏰ Timeout na ${timeoutMs / 1000}s (poging ${attempt}/${maxRetries})`);
        controller.abort();
      }, timeoutMs);
      
      try {
        console.log(`📤 API call poging ${attempt}/${maxRetries} - model: ${requestBody.model}`);
        
        response = await fetch(`${AIML_BASE_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AIML_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        // Success - break retry loop
        console.log(`✅ API response ontvangen (poging ${attempt}/${maxRetries}), status: ${response.status}`);
        break;
        
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        lastError = fetchError;
        
        if (fetchError.name === 'AbortError') {
          console.error(`❌ AIML API Timeout na ${timeoutMs / 1000}s (poging ${attempt}/${maxRetries})`);
          
          if (attempt < maxRetries) {
            console.log(`🔄 Opnieuw proberen... (${attempt + 1}/${maxRetries})`);
            // Wacht 2 seconden voor retry
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          
          throw new Error('AI model timeout - de aanvraag duurde te lang. Probeer een kortere tekst of minder features.');
        }
        
        console.error(`❌ Fetch error (poging ${attempt}/${maxRetries}):`, fetchError.message);
        
        if (attempt < maxRetries) {
          console.log(`🔄 Opnieuw proberen... (${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
        throw fetchError;
      }
    }
    
    if (!response) {
      throw lastError || new Error('Failed to get response from AIML API after retries');
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `AIML API Error (${response.status})`;
      let errorDetails: any = {};
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
        errorDetails = errorData;
      } catch {
        errorDetails = { rawError: errorText };
      }
      
      console.error('❌ AIML API Error:', {
        status: response.status,
        statusText: response.statusText,
        model: options.model,
        messageCount: cleanMessages.length,
        hasTools: !!convertedTools,
        errorDetails: errorDetails,
        fieldErrors: errorDetails?.meta?.fieldErrors ? JSON.stringify(errorDetails.meta.fieldErrors, null, 2) : 'none',
        requestSample: {
          model: requestBody.model,
          messageRoles: cleanMessages.map((m: any) => m.role),
          firstMessage: cleanMessages[0]?.content?.substring(0, 100)
        }
      });
      
      // Create user-friendly error message
      let userMessage = 'Er ging iets mis met de AI.';
      if (response.status === 401) {
        userMessage = 'API authenticatie gefaald. Controleer de API key.';
      } else if (response.status === 429) {
        userMessage = 'Te veel verzoeken. Probeer het over een minuut opnieuw.';
      } else if (response.status >= 500) {
        userMessage = 'De AI service heeft een probleem. Probeer het later opnieuw.';
      } else if (errorMessage.includes('Invalid')) {
        userMessage = `Ongeldige invoer: ${errorMessage}`;
      }
      
      throw new Error(userMessage);
    }

    // 🔥 ROBUST JSON PARSING - Handle incomplete/corrupt responses
    let data;
    try {
      const responseText = await response.text();
      
      if (!responseText || responseText.trim() === '') {
        throw new Error('API response is leeg - de verbinding werd mogelijk onderbroken');
      }
      
      console.log(`📊 Response size: ${responseText.length} characters`);
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError: any) {
        console.error('❌ JSON Parse Error:', {
          error: parseError.message,
          responsePreview: responseText.substring(0, 500),
          responseLength: responseText.length,
          model: options.model
        });
        
        throw new Error(
          `AI response kon niet gelezen worden (${parseError.message}). ` +
          `Dit kan gebeuren bij zeer lange teksten of netwerk problemen. ` +
          `Probeer: 1) Minder woorden, 2) Minder features, 3) Opnieuw proberen`
        );
      }
    } catch (readError: any) {
      console.error('❌ Response Read Error:', {
        error: readError.message,
        model: options.model
      });
      
      if (readError.message.includes('gelezen worden')) {
        throw readError; // Re-throw our custom error
      }
      
      throw new Error(
        `Kon AI response niet lezen: ${readError.message}. ` +
        `De verbinding werd mogelijk onderbroken. Probeer opnieuw.`
      );
    }
    
    console.log('✅ AIML API Response:', {
      model: data.model,
      hasChoices: !!data.choices,
      hasToolCalls: !!data.choices?.[0]?.message?.tool_calls,
      finishReason: data.choices?.[0]?.finish_reason,
      usage: data.usage
    });

    // Track API usage if requested
    if (options.trackUsage && data.usage) {
      try {
        const { trackApiUsage } = await import('./api-usage-tracker');
        await trackApiUsage({
          clientId: options.trackUsage.clientId,
          projectId: options.trackUsage.projectId,
          feature: options.trackUsage.feature,
          model: data.model || options.model,
          inputTokens: data.usage.prompt_tokens || 0,
          outputTokens: data.usage.completion_tokens || 0,
          success: true,
          contentId: options.trackUsage.contentId,
        });
      } catch (trackError) {
        console.error('❌ Failed to track API usage:', trackError);
        // Don't throw - tracking errors shouldn't break the main flow
      }
    }

    return data;
  } catch (error: any) {
    console.error('❌ Chat completion error:', {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    
    // Track failed API usage
    if (options.trackUsage) {
      try {
        const { trackApiUsage } = await import('./api-usage-tracker');
        await trackApiUsage({
          clientId: options.trackUsage.clientId,
          projectId: options.trackUsage.projectId,
          feature: options.trackUsage.feature,
          model: options.model,
          inputTokens: 0,
          outputTokens: 0,
          success: false,
          errorMessage: error.message,
        });
      } catch (trackError) {
        console.error('❌ Failed to track API usage:', trackError);
      }
    }
    
    throw error;
  }
}

// ═══════════════════════════════════════════════════════
// 🔍 WEB SEARCH MODELS
// ═══════════════════════════════════════════════════════

/**
 * Models met native web search capabilities
 */
export const WEB_SEARCH_MODELS = {
  GPT4O_SEARCH: 'gpt-4o-search-preview', // GPT-4o met web search
  GPT4O_MINI_SEARCH: 'gpt-4o-mini-search-preview', // GPT-4o mini met web search
  PERPLEXITY_SONAR: 'perplexity/sonar', // Perplexity Sonar
  PERPLEXITY_PRO: 'perplexity/sonar-pro', // Perplexity Sonar Pro
} as const;

/**
 * Web search met AIML API
 * Gebruikt modellen met native web search
 */
export async function webSearch(query: string): Promise<{
  success: boolean;
  results?: string;
  sources?: string[];
  error?: string;
}> {
  try {
    console.log(`🔍 Web search: "${query}"`);
    
    // Gebruik GPT-4o Search Preview (heeft native web search)
    const response = await chatCompletion({
      model: WEB_SEARCH_MODELS.GPT4O_SEARCH,
      messages: [
        {
          role: 'user',
          content: `Als expert researcher, geef actuele, accurate informatie met bronnen voor deze vraag:\n\n${query}`,
        },
      ],
      temperature: 0.3, // Lagere temp voor accuracy
      max_tokens: 2000,
    });

    const content = response.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Geen resultaten van web search');
    }

    return {
      success: true,
      results: `📅 Informatie van ${new Date().toLocaleDateString('nl-NL', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}:\n\n${content}`,
      sources: [], // GPT-4o Search voegt bronnen toe in de content
    };
  } catch (error: any) {
    console.error('❌ Web search error:', error);
    
    // Fallback naar Perplexity Sonar
    try {
      console.log('⚠️ Fallback to Perplexity Sonar...');
      
      const fallbackResponse = await chatCompletion({
        model: WEB_SEARCH_MODELS.PERPLEXITY_SONAR,
        messages: [
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const fallbackContent = fallbackResponse.choices?.[0]?.message?.content;
      
      if (fallbackContent) {
        return {
          success: true,
          results: `📅 Informatie van ${new Date().toLocaleDateString('nl-NL', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}:\n\n${fallbackContent}`,
          sources: [],
        };
      }
    } catch (fallbackError) {
      console.error('❌ Fallback search error:', fallbackError);
    }

    return {
      success: false,
      error: error.message,
    };
  }
}

// ═══════════════════════════════════════════════════════
// 🎨 IMAGE GENERATION
// ═══════════════════════════════════════════════════════

export const IMAGE_MODELS = {
  // GPT Image 1 (NIEUW - Beste kwaliteit en flexibiliteit)
  GPT_IMAGE_1: 'openai/gpt-image-1',
  
  // Flux (Beste kwaliteit/snelheid ratio)
  FLUX_SCHNELL: 'flux/schnell', // Snelste
  FLUX_DEV: 'flux/dev', // Goede balans
  FLUX_PRO: 'flux-pro', // Beste kwaliteit
  FLUX_PRO_ULTRA: 'flux-pro/v1.1-ultra', // Ultra HD
  FLUX_REALISM: 'flux-realism', // Ultra realistic
  
  // Google Imagen
  IMAGEN_3: 'imagen-3.0-generate-002',
  IMAGEN_4: 'google/imagen4/preview',
  IMAGEN_4_ULTRA: 'imagen-4.0-ultra-generate-preview-06-06',
  GEMINI_IMAGE: 'google/gemini-2.5-flash-image',
  
  // OpenAI DALL-E
  DALLE_2: 'dall-e-2',
  DALLE_3: 'dall-e-3',
  
  // Stable Diffusion
  SD_3: 'stable-diffusion-v3-medium',
  SD_35: 'stable-diffusion-v35-large',
  
  // Recraft (Design)
  RECRAFT: 'recraft-v3',
  
  // Nano Banana (Ultra snelle image generatie)
  NANO_BANANA: 'nano-banana', // Ultra snel, budget-vriendelijk
  NANO_BANANA_PRO: 'nano-banana-pro', // Snelle pro versie met hogere kwaliteit
} as const;

export interface ImageOptions {
  prompt: string;
  model?: keyof typeof IMAGE_MODELS;
  width?: number;
  height?: number;
  num_images?: number;
  style?: string; // Voor GPT Image 1: realistic_image, digital_illustration, etc.
  quality?: 'low' | 'medium' | 'high'; // Voor GPT Image 1
}

/**
 * Genereer afbeeldingen met AIML API
 */
export async function generateImage(options: ImageOptions): Promise<{
  success: boolean;
  images?: string[];
  model?: string;
  error?: string;
}> {
  try {
    // 💰 COST OPTIMIZATION: Stable Diffusion 3 is 5x goedkoper dan GPT Image 1!
    // SD3: $0.037 vs GPT Image 1: $0.18 per request
    const model = IMAGE_MODELS[options.model || 'SD_3'];
    
    console.log(`🎨 Generating image with ${model}`, {
      style: options.style,
      quality: options.quality,
      size: options.width && options.height ? `${options.width}x${options.height}` : 'default'
    });
    
    const requestBody: any = {
      model,
      prompt: options.prompt,
      n: options.num_images || 1,
    };

    // GPT Image 1 specifieke parameters
    if (model === 'openai/gpt-image-1') {
      // Map style to supported values
      if (options.style) {
        // Map common style names to supported API values
        const styleMapping: Record<string, string> = {
          'natural': 'realistic_image/natural_light',
          'vivid': 'realistic_image',
          'realistic': 'realistic_image',
          'cinematic': 'realistic_image/hdr',
          'anime': 'digital_illustration',
          'comic': 'digital_illustration/2d_art_poster',
          'watercolor': 'digital_illustration/hand_drawn',
          'oil-painting': 'digital_illustration',
          'sketch': 'digital_illustration/infantile_sketch',
          '3d-render': 'digital_illustration/handmade_3d',
          'minimalist': 'vector_illustration',
          'abstract': 'digital_illustration',
          'fantasy': 'digital_illustration',
          'sci-fi': 'digital_illustration',
          'vintage': 'realistic_image',
          'professional-photo': 'realistic_image/studio_portrait',
        };
        requestBody.style = styleMapping[options.style] || 'realistic_image';
      }
      
      // Quality parameter
      if (options.quality) {
        requestBody.quality = options.quality; // 'low' | 'medium' | 'high'
      }
      
      // GPT Image 1 supported sizes: 1024x1024, 1024x1536, 1536x1024
      let size = '1024x1024'; // Default
      if (options.width && options.height) {
        const requestedSize = `${options.width}x${options.height}`;
        const supportedSizes = ['1024x1024', '1024x1536', '1536x1024'];
        
        if (supportedSizes.includes(requestedSize)) {
          size = requestedSize;
        } else {
          // Map to closest supported size
          if (options.width > options.height) {
            size = '1536x1024';
          } else if (options.height > options.width) {
            size = '1024x1536';
          }
        }
      }
      requestBody.size = size;
    } else {
      // Andere modellen gebruiken width/height parameters
      if (options.width) requestBody.width = options.width;
      if (options.height) requestBody.height = options.height;
      if (options.quality) requestBody.quality = options.quality;
    }
    
    const response = await fetch(`${AIML_BASE_URL}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Image generation failed:', errorText);
      throw new Error(`Image generation failed: ${errorText}`);
    }

    // Check content type - some models return binary data directly
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('image/')) {
      // Binary image response - convert to base64
      console.log('🖼️ Received binary image response, converting to base64...');
      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      const dataUrl = `data:${contentType};base64,${base64Image}`;
      
      console.log(`✅ Converted binary image to base64 (${model})`);
      
      return {
        success: true,
        images: [dataUrl],
        model,
      };
    }

    // JSON response with URLs
    const data = await response.json();
    console.log('📦 Received image data structure:', JSON.stringify(data).substring(0, 200));
    
    const images = data.data?.map((img: any) => img.url || img.b64_json) || [];

    if (images.length === 0) {
      console.error('❌ No images found in response:', JSON.stringify(data));
      return {
        success: false,
        error: 'No images returned from API',
      };
    }

    console.log(`✅ Generated ${images.length} image(s) with ${model}`);
    console.log('🖼️ First image preview:', images[0]?.substring(0, 100));

    return {
      success: true,
      images,
      model,
    };
  } catch (error: any) {
    console.error('❌ Image generation error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ═══════════════════════════════════════════════════════
// 🎬 VIDEO GENERATION
// ═══════════════════════════════════════════════════════

export const VIDEO_MODELS = {
  // MiniMax (Beste all-round)
  MINIMAX_01: 'video-01',
  MINIMAX_HAILUO: 'minimax/hailuo-02',
  
  // Google Veo (Hoge kwaliteit)
  VEO_2: 'veo2',
  VEO_3: 'google/veo3',
  VEO_3_FAST: 'google/veo-3.0-fast',
  
  // Kling AI (Professional)
  KLING_PRO: 'klingai/v2.1-master-text-to-video',
  KLING_STANDARD: 'kling-video/v2.1/standard/text-to-video',
  
  // Runway (Creative)
  RUNWAY_GEN4: 'runway/gen4_turbo',
} as const;

export interface VideoOptions {
  prompt: string;
  model?: keyof typeof VIDEO_MODELS;
  duration?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

/**
 * Genereer video's met AIML API
 */
export async function generateVideo(options: VideoOptions): Promise<{
  success: boolean;
  videoId?: string;
  status?: string;
  error?: string;
}> {
  try {
    const model = VIDEO_MODELS[options.model || 'MINIMAX_01'];
    
    console.log(`🎬 Generating video with ${model}`);
    
    const response = await fetch(`${AIML_BASE_URL}/v1/videos/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: options.prompt,
        duration: options.duration || 5,
        aspect_ratio: options.aspectRatio || '16:9',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Video generation failed: ${errorText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      videoId: data.id,
      status: 'generating',
    };
  } catch (error: any) {
    console.error('❌ Video generation error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Check video generation status
 */
export async function checkVideoStatus(videoId: string): Promise<{
  success: boolean;
  status?: 'generating' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${AIML_BASE_URL}/v1/videos/${videoId}`, {
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check video status');
    }

    const data = await response.json();
    
    return {
      success: true,
      status: data.status,
      videoUrl: data.url,
    };
  } catch (error: any) {
    console.error('❌ Video status check error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ═══════════════════════════════════════════════════════
// 🎤 SPEECH-TO-TEXT
// ═══════════════════════════════════════════════════════

/**
 * Transcribeer audio naar text
 */
export async function speechToText(audioUrl: string, language = 'nl'): Promise<{
  success: boolean;
  text?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${AIML_BASE_URL}/v1/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: '#g1_whisper-large', // Beste model voor Nederlands
        audio_url: audioUrl,
        language: language,
      }),
    });

    if (!response.ok) {
      throw new Error('Speech to text failed');
    }

    const data = await response.json();
    
    return {
      success: true,
      text: data.text,
    };
  } catch (error: any) {
    console.error('❌ Speech to text error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ═══════════════════════════════════════════════════════
// 🔊 TEXT-TO-SPEECH
// ═══════════════════════════════════════════════════════

export interface TTSOptions {
  text: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  model?: 'openai/tts-1' | 'openai/tts-1-hd';
  speed?: number;
}

/**
 * Converteer text naar speech
 */
export async function textToSpeech(options: TTSOptions): Promise<{
  success: boolean;
  audioUrl?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${AIML_BASE_URL}/v1/audio/speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || 'openai/tts-1-hd',
        input: options.text,
        voice: options.voice || 'nova',
        speed: options.speed || 1.0,
      }),
    });

    if (!response.ok) {
      throw new Error('Text to speech failed');
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    return {
      success: true,
      audioUrl,
    };
  } catch (error: any) {
    console.error('❌ Text to speech error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ═══════════════════════════════════════════════════════
// 🧠 SMART MULTI-MODEL INTELLIGENCE SYSTEM
// ═══════════════════════════════════════════════════════

/**
 * 🎯 MODEL SELECTION STRATEGIES
 * Gebruikt verschillende modellen voor verschillende fases van een taak
 */

export interface ModelSelection {
  model: string;
  reason: string;
  category: 'research' | 'reasoning' | 'creative' | 'fast' | 'vision' | 'code' | 'multimodal';
  tier: 'budget' | 'balanced' | 'premium' | 'specialized';
  estimatedCost: number;
}

export interface MultiModelStrategy {
  primary: ModelSelection;
  fallbacks: ModelSelection[];
  toolSpecific?: {
    web_search?: ModelSelection;
    content_generation?: ModelSelection;
    code_generation?: ModelSelection;
    image_analysis?: ModelSelection;
  };
}

/**
 * 🎯 GEAVANCEERDE MODEL SELECTIE per taak type
 * Maakt gebruik van de volledige 300+ modelbibliotheek
 */
export function selectOptimalModelForTask(
  taskType: 'blog_research' | 'blog_writing' | 'social_media' | 'video_script' | 
            'keyword_research' | 'code_generation' | 'chat' | 'web_search' | 
            'content_analysis' | 'strategic_planning' | 'creative_writing' | 
            'technical_writing' | 'translation' | 'summarization',
  complexity: 'simple' | 'medium' | 'complex' = 'medium',
  priority: 'speed' | 'quality' | 'balanced' | 'cost' = 'balanced'
): MultiModelStrategy {
  
  // ═══════════════════════════════════════════════════════
  // 📊 MODEL DATABASE - 300+ modellen georganiseerd
  // ═══════════════════════════════════════════════════════
  
  const MODEL_DB = {
    // 🚀 WEB RESEARCH & REAL-TIME INFO
    research: {
      premium: {
        model: 'gpt-4o-search-preview',
        reason: 'Native web search met real-time data, beste voor research',
        category: 'research' as const,
        tier: 'premium' as const,
        estimatedCost: 8
      },
      balanced: {
        model: 'perplexity/sonar-pro',
        reason: 'Perplexity Sonar Pro - excellent research capabilities',
        category: 'research' as const,
        tier: 'balanced' as const,
        estimatedCost: 5
      },
      fast: {
        model: 'perplexity/sonar',
        reason: 'Perplexity Sonar - snelle research',
        category: 'research' as const,
        tier: 'balanced' as const,
        estimatedCost: 3
      }
    },
    
    // ✍️ CREATIVE CONTENT WRITING
    creative: {
      premium: {
        model: 'claude-sonnet-4-5',
        reason: 'Claude 4.5 Sonnet - nieuwste en beste voor creatieve, natuurlijke content',
        category: 'creative' as const,
        tier: 'premium' as const,
        estimatedCost: 10
      },
      balanced: {
        model: 'gpt-4o-mini',
        reason: 'GPT-4o Mini - snelle, natuurlijke schrijfstijl met tools support',
        category: 'creative' as const,
        tier: 'balanced' as const,
        estimatedCost: 4
      },
      fast: {
        model: 'gemini-2.5-flash',
        reason: 'Gemini 2.5 Flash - zeer snel voor creative content',
        category: 'creative' as const,
        tier: 'balanced' as const,
        estimatedCost: 3
      }
    },
    
    // 🧠 REASONING & ANALYSIS
    reasoning: {
      premium: {
        model: 'deepseek/deepseek-r1',
        reason: 'DeepSeek R1 - beste reasoning capabilities, excellent prijs/kwaliteit',
        category: 'reasoning' as const,
        tier: 'premium' as const,
        estimatedCost: 7
      },
      balanced: {
        model: 'gpt-4o',
        reason: 'GPT-4o - uitstekende reasoning met multimodal support',
        category: 'reasoning' as const,
        tier: 'premium' as const,
        estimatedCost: 8
      },
      fast: {
        model: 'gpt-5-mini-2025-08-07',
        reason: 'GPT-5 Mini - snel met goede reasoning',
        category: 'reasoning' as const,
        tier: 'balanced' as const,
        estimatedCost: 4
      }
    },
    
    // 💻 CODE GENERATION & TECHNICAL
    code: {
      premium: {
        model: 'gpt-4o',
        reason: 'GPT-4o - beste voor complexe code en debugging',
        category: 'code' as const,
        tier: 'premium' as const,
        estimatedCost: 8
      },
      balanced: {
        model: 'deepseek-chat',
        reason: 'DeepSeek Chat V3 - excellent voor code, goedkoop',
        category: 'code' as const,
        tier: 'balanced' as const,
        estimatedCost: 3
      },
      fast: {
        model: 'gemini-2.5-flash',
        reason: 'Gemini 2.5 Flash - snel voor eenvoudige code',
        category: 'code' as const,
        tier: 'balanced' as const,
        estimatedCost: 3
      }
    },
    
    // 🌐 MULTI-LANGUAGE & CONTEXT
    multimodal: {
      premium: {
        model: 'gemini-2.5-pro',
        reason: 'Gemini 2.5 Pro - 1M tokens context, excellent voor lange teksten',
        category: 'multimodal' as const,
        tier: 'premium' as const,
        estimatedCost: 9
      },
      balanced: {
        model: 'qwen-max',
        reason: 'Qwen Max - excellent voor meerdere talen, lange context',
        category: 'multimodal' as const,
        tier: 'balanced' as const,
        estimatedCost: 5
      },
      fast: {
        model: 'qwen-turbo',
        reason: 'Qwen Turbo - 1M tokens, zeer snel',
        category: 'multimodal' as const,
        tier: 'balanced' as const,
        estimatedCost: 3
      }
    },
    
    // ⚡ FAST & EFFICIENT
    fast: {
      premium: {
        model: 'gpt-5-nano-2025-08-07',
        reason: 'GPT-5 Nano - ultra snel, moderne GPT-5 kwaliteit',
        category: 'fast' as const,
        tier: 'balanced' as const,
        estimatedCost: 2
      },
      balanced: {
        model: 'gemini-2.5-flash',
        reason: 'Gemini 2.5 Flash - snelste met 1M context',
        category: 'fast' as const,
        tier: 'balanced' as const,
        estimatedCost: 3
      },
      fast: {
        model: 'gemini-1.5-flash-8b',
        reason: 'Gemini Flash 8B - ultra compact en snel',
        category: 'fast' as const,
        tier: 'budget' as const,
        estimatedCost: 1
      }
    },
    
    // 🎯 STRATEGIC & PLANNING
    strategy: {
      premium: {
        model: 'gpt-5-2025-08-07',
        reason: 'GPT-5 - nieuwste flagship, beste voor strategie',
        category: 'reasoning' as const,
        tier: 'premium' as const,
        estimatedCost: 12
      },
      balanced: {
        model: 'claude-sonnet-4-5',
        reason: 'Claude 4.5 - nieuwste versie, excellent voor strategisch denken',
        category: 'reasoning' as const,
        tier: 'premium' as const,
        estimatedCost: 10
      },
      fast: {
        model: 'deepseek/deepseek-r1',
        reason: 'DeepSeek R1 - sterke reasoning, goede prijs',
        category: 'reasoning' as const,
        tier: 'premium' as const,
        estimatedCost: 7
      }
    }
  };
  
  // ═══════════════════════════════════════════════════════
  // 🎯 TASK-SPECIFIC STRATEGIES
  // ═══════════════════════════════════════════════════════
  
  const strategies: Record<string, MultiModelStrategy> = {
    // BLOG RESEARCH - Combineer research + creative writing
    blog_research: {
      primary: MODEL_DB.research[priority === 'speed' ? 'fast' : priority === 'quality' ? 'premium' : 'balanced'],
      fallbacks: [MODEL_DB.research.balanced, MODEL_DB.research.fast],
      toolSpecific: {
        web_search: MODEL_DB.research.premium,
        content_generation: MODEL_DB.creative.premium
      }
    },
    
    // BLOG WRITING - Focus op creative content
    blog_writing: {
      primary: MODEL_DB.creative[priority === 'speed' ? 'fast' : priority === 'quality' ? 'premium' : 'balanced'],
      fallbacks: [MODEL_DB.creative.balanced, MODEL_DB.creative.fast],
      toolSpecific: {
        web_search: MODEL_DB.research.balanced,
        content_generation: MODEL_DB.creative.premium
      }
    },
    
    // SOCIAL MEDIA - Snel en engaging
    social_media: {
      primary: MODEL_DB.creative.balanced,
      fallbacks: [MODEL_DB.creative.fast, MODEL_DB.fast.balanced],
      toolSpecific: {
        web_search: MODEL_DB.research.fast,
        content_generation: MODEL_DB.creative.balanced
      }
    },
    
    // VIDEO SCRIPT - Creative storytelling
    video_script: {
      primary: MODEL_DB.creative.premium,
      fallbacks: [MODEL_DB.creative.balanced, MODEL_DB.creative.fast],
      toolSpecific: {
        web_search: MODEL_DB.research.balanced,
        content_generation: MODEL_DB.creative.premium
      }
    },
    
    // KEYWORD RESEARCH - Analytical + SEO focus
    keyword_research: {
      primary: MODEL_DB.reasoning.balanced,
      fallbacks: [MODEL_DB.reasoning.fast, MODEL_DB.fast.balanced],
      toolSpecific: {
        web_search: MODEL_DB.research.premium,
        content_generation: MODEL_DB.reasoning.balanced
      }
    },
    
    // CODE GENERATION - Technical precision
    code_generation: {
      primary: MODEL_DB.code[priority === 'speed' ? 'fast' : priority === 'quality' ? 'premium' : 'balanced'],
      fallbacks: [MODEL_DB.code.balanced, MODEL_DB.code.fast],
      toolSpecific: {
        code_generation: MODEL_DB.code.premium
      }
    },
    
    // CHAT - Balanced & responsive
    chat: {
      primary: complexity === 'complex' ? MODEL_DB.reasoning.balanced : MODEL_DB.fast.balanced,
      fallbacks: [MODEL_DB.fast.balanced, MODEL_DB.fast.fast],
      toolSpecific: {
        web_search: MODEL_DB.research.fast
      }
    },
    
    // WEB SEARCH - Research specialized
    web_search: {
      primary: MODEL_DB.research[priority === 'speed' ? 'fast' : priority === 'quality' ? 'premium' : 'balanced'],
      fallbacks: [MODEL_DB.research.balanced, MODEL_DB.research.fast],
      toolSpecific: {
        web_search: MODEL_DB.research.premium
      }
    },
    
    // STRATEGIC PLANNING - Deep thinking
    strategic_planning: {
      primary: MODEL_DB.strategy[priority === 'speed' ? 'fast' : priority === 'quality' ? 'premium' : 'balanced'],
      fallbacks: [MODEL_DB.strategy.balanced, MODEL_DB.reasoning.premium],
      toolSpecific: {
        web_search: MODEL_DB.research.premium,
        content_generation: MODEL_DB.strategy.premium
      }
    },
    
    // CREATIVE WRITING - Maximum creativity
    creative_writing: {
      primary: MODEL_DB.creative.premium,
      fallbacks: [MODEL_DB.creative.balanced, MODEL_DB.creative.fast],
      toolSpecific: {
        content_generation: MODEL_DB.creative.premium
      }
    },
    
    // TECHNICAL WRITING - Precision & clarity
    technical_writing: {
      primary: MODEL_DB.code.premium,
      fallbacks: [MODEL_DB.code.balanced, MODEL_DB.reasoning.balanced],
      toolSpecific: {
        web_search: MODEL_DB.research.balanced,
        content_generation: MODEL_DB.code.premium
      }
    },
    
    // LONG CONTENT ANALYSIS - Large context needed
    content_analysis: {
      primary: MODEL_DB.multimodal[priority === 'speed' ? 'fast' : 'premium'],
      fallbacks: [MODEL_DB.multimodal.balanced, MODEL_DB.reasoning.balanced],
      toolSpecific: {
        web_search: MODEL_DB.research.balanced
      }
    },
    
    // TRANSLATION - Multi-language specialists
    translation: {
      primary: MODEL_DB.multimodal.balanced,
      fallbacks: [MODEL_DB.multimodal.fast, MODEL_DB.fast.balanced],
      toolSpecific: {}
    },
    
    // SUMMARIZATION - Quick & accurate
    summarization: {
      primary: MODEL_DB.fast.balanced,
      fallbacks: [MODEL_DB.fast.fast, MODEL_DB.multimodal.fast],
      toolSpecific: {}
    }
  };
  
  return strategies[taskType] || strategies.chat;
}

/**
 * Backward compatibility - simpele model selectie
 */
export function selectBestModel(
  taskType: 'reasoning' | 'creative' | 'fast' | 'coding' | 'planning' | 'web_search'
): string {
  const taskMap: Record<string, string> = {
    reasoning: 'strategic_planning',
    creative: 'creative_writing',
    fast: 'chat',
    coding: 'code_generation',
    planning: 'strategic_planning',
    web_search: 'web_search'
  };
  
  const strategy = selectOptimalModelForTask(taskMap[taskType] as any);
  return strategy.primary.model;
}

export default {
  // Text
  TEXT_MODELS,
  chatCompletion,
  selectBestModel,
  
  // Web Search
  WEB_SEARCH_MODELS,
  webSearch,
  
  // Image
  IMAGE_MODELS,
  generateImage,
  
  // Video
  VIDEO_MODELS,
  generateVideo,
  checkVideoStatus,
  
  // Speech
  speechToText,
  textToSpeech,
};
