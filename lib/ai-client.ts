import OpenAI from 'openai';

// Get API key - support multiple env var names for flexibility
const getApiKey = () => {
  return process.env.AIML_API_KEY || 
         process.env.ANTHROPIC_API_KEY || 
         process.env.OPENAI_API_KEY || 
         '';
};

const apiKey = getApiKey();

// OpenAI-compatible client via AIML API (for all models including Claude)
// With 60 second default timeout to prevent hanging requests
export const openaiClient = new OpenAI({
  apiKey: apiKey,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.aimlapi.com/v1',
  timeout: 60000, // 60 second default timeout
  maxRetries: 2,
});

// For backwards compatibility
export const aimlClient = openaiClient;
export const anthropicClient = openaiClient;

// Best models for each task
// NOTE: Using Claude Sonnet 4.5 via AIML API
// Using full model ID with date as per AIML API requirements
export const BEST_MODELS = {
  CONTENT: 'claude-sonnet-4-5-20250929',       // Best content writing (Claude 4.5 Sonnet via AIML)
  TECHNICAL: 'claude-sonnet-4-5-20250929',     // Best coding (Claude 4.5 Sonnet via AIML)
  QUICK: 'claude-sonnet-4-5-20250929',         // Fast & reliable (Claude 4.5 Sonnet via AIML)
  BUDGET: 'claude-sonnet-4-5-20250929',        // Same model (Claude 4.5 Sonnet via AIML)
  IMAGE: 'flux-pro/v1.1',                      // Best quality images
  PERPLEXITY: 'perplexity/sonar-pro',          // For research/discovery with web access
};

// Available text models for content generation
export interface TextModel {
  id: string;
  name: string;
  developer: string;
  contextLength: number;
  description: string;
  recommended?: boolean;
}

export const AVAILABLE_TEXT_MODELS: TextModel[] = [
  // Claude models (Anthropic) - Best for content writing
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', developer: 'Anthropic', contextLength: 200000, description: 'Best voor Nederlandse content', recommended: true },
  { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5 (alt)', developer: 'Anthropic', contextLength: 200000, description: 'Alternatieve naam voor Claude 4.5' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', developer: 'Anthropic', contextLength: 200000, description: 'Sneller en goedkoper' },
  { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4', developer: 'Anthropic', contextLength: 200000, description: 'Meest geavanceerd' },
  { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', developer: 'Anthropic', contextLength: 200000, description: 'Verbeterde versie' },

  // OpenAI models
  { id: 'gpt-4o', name: 'GPT-4o', developer: 'OpenAI', contextLength: 128000, description: 'Multimodaal, snel en krachtig', recommended: true },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', developer: 'OpenAI', contextLength: 128000, description: 'Sneller en goedkoper' },
  { id: 'chatgpt-4o-latest', name: 'ChatGPT-4o Latest', developer: 'OpenAI', contextLength: 128000, description: 'Nieuwste GPT-4o versie' },
  { id: 'o1', name: 'OpenAI o1', developer: 'OpenAI', contextLength: 200000, description: 'Reasoning model' },
  { id: 'o3-mini', name: 'OpenAI o3 Mini', developer: 'OpenAI', contextLength: 200000, description: 'Nieuwste reasoning model' },

  // Google Gemini models
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', developer: 'Google', contextLength: 1000000, description: 'Zeer snel, grote context' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', developer: 'Google', contextLength: 1000000, description: 'Nieuwste Gemini' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', developer: 'Google', contextLength: 1000000, description: 'Pro versie' },
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', developer: 'Google', contextLength: 1000000, description: 'Experimenteel' },

  // DeepSeek models - Good for technical content
  { id: 'deepseek-chat', name: 'DeepSeek V3', developer: 'DeepSeek', contextLength: 128000, description: 'Goed voor technische content' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', developer: 'DeepSeek', contextLength: 128000, description: 'Reasoning model' },
  { id: 'deepseek/deepseek-chat-v3.1', name: 'DeepSeek V3.1', developer: 'DeepSeek', contextLength: 128000, description: 'Nieuwste versie' },

  // Alibaba Qwen models
  { id: 'qwen-max', name: 'Qwen Max', developer: 'Alibaba Cloud', contextLength: 32000, description: 'Krachtig model' },
  { id: 'qwen-plus', name: 'Qwen Plus', developer: 'Alibaba Cloud', contextLength: 131000, description: 'Grote context' },
  { id: 'qwen-turbo', name: 'Qwen Turbo', developer: 'Alibaba Cloud', contextLength: 1000000, description: 'Zeer grote context' },
  { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B Turbo', developer: 'Alibaba Cloud', contextLength: 32000, description: 'Snel en krachtig' },
  { id: 'alibaba/qwen3-32b', name: 'Qwen3 32B', developer: 'Alibaba Cloud', contextLength: 131000, description: 'Nieuwste generatie' },

  // Meta Llama models
  { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B', developer: 'Meta', contextLength: 128000, description: 'Open source' },
  { id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', name: 'Llama 3.1 405B', developer: 'Meta', contextLength: 4000, description: 'Grootste Llama' },
  { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', name: 'Llama 3.1 70B', developer: 'Meta', contextLength: 128000, description: 'Gebalanceerd' },
  { id: 'meta-llama/llama-4-scout', name: 'Llama 4 Scout', developer: 'Meta', contextLength: 1000000, description: 'Experimenteel' },

  // Mistral models
  { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B', developer: 'Mistral AI', contextLength: 64000, description: 'Mixture of Experts' },
  { id: 'mistralai/mistral-nemo', name: 'Mistral Nemo', developer: 'Mistral AI', contextLength: 128000, description: 'Compact model' },

  // xAI Grok models
  { id: 'x-ai/grok-3-beta', name: 'Grok 3 Beta', developer: 'xAI', contextLength: 131000, description: 'Nieuwste Grok' },
  { id: 'x-ai/grok-4-07-09', name: 'Grok 4', developer: 'xAI', contextLength: 256000, description: 'Krachtigste Grok' },

  // MiniMax models
  { id: 'MiniMax-Text-01', name: 'MiniMax Text-01', developer: 'MiniMax', contextLength: 1000000, description: 'Zeer grote context' },

  // Perplexity (with web access)
  { id: 'perplexity/sonar', name: 'Sonar', developer: 'Perplexity', contextLength: 128000, description: 'Met web toegang' },
  { id: 'perplexity/sonar-pro', name: 'Sonar Pro', developer: 'Perplexity', contextLength: 200000, description: 'Pro met web toegang', recommended: true },
];

interface GenerateOptions {
  model?: string;
  task?: 'content' | 'technical' | 'quick' | 'budget';
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number; // Custom timeout in milliseconds (default: 60000)
}

export async function generateAICompletion(options: GenerateOptions): Promise<string> {
  const {
    model,
    task = 'content',
    systemPrompt,
    userPrompt,
    temperature = 0.7,
    maxTokens = 4000,
    timeout = 60000, // Default 60 second timeout
  } = options;

  const modelMap = {
    content: BEST_MODELS.CONTENT,
    technical: BEST_MODELS.TECHNICAL,
    quick: BEST_MODELS.QUICK,
    budget: BEST_MODELS.BUDGET,
  };

  const selectedModel = model || modelMap[task];

  // Check if API key is configured
  if (!apiKey) {
    console.error('No AI API key configured. Please set AIML_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY');
    throw new Error('AI API key not configured. Please check environment variables.');
  }

  try {
    // Wrap API call with timeout
    const completionPromise = openaiClient.chat.completions.create({
      model: selectedModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`AI request timed out after ${timeout}ms`)), timeout);
    });

    const completion = await Promise.race([completionPromise, timeoutPromise]);

    const content = completion.choices[0]?.message?.content || '';

    // Check if content is empty
    if (!content || content.trim().length === 0) {
      console.error('AI returned empty content');
      console.error('Model:', selectedModel);
      console.error('Response object keys:', Object.keys(completion));
      console.error('Choices:', completion.choices);
      throw new Error('AI returned empty content. The AI model did not generate any text. Please try again.');
    }

    return content;
  } catch (error: any) {
    console.error('AI completion error:', error);

    // Handle timeout errors
    if (error.message?.includes('timed out')) {
      throw new Error(`AI request timed out after ${timeout}ms. The request took too long to complete.`);
    }

    // Provide more helpful error messages
    if (error.status === 401) {
      throw new Error('AI API authentication failed. Please check your API key.');
    }
    if (error.status === 429) {
      throw new Error('AI API rate limit exceeded. Please try again later.');
    }
    if (error.status === 500) {
      throw new Error('AI API server error. Please try again later.');
    }

    throw new Error(`AI generation failed: ${error.message}`);
  }
}

export async function generateJSONCompletion<T>(options: GenerateOptions): Promise<T> {
  const content = await generateAICompletion(options);
  
  // Multiple parsing strategies
  const strategies = [
    // Strategy 1: Direct parse
    () => JSON.parse(content.trim()),
    
    // Strategy 2: Extract from code blocks
    () => {
      const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) return JSON.parse(match[1].trim());
      throw new Error('No code block');
    },
    
    // Strategy 3: Find JSON object
    () => {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error('No object');
    },
    
    // Strategy 4: Find JSON array
    () => {
      const match = content.match(/\[[\s\S]*\]/);
      if (match) return JSON.parse(match[0]);
      throw new Error('No array');
    },
    
    // Strategy 5: Clean and parse object
    () => {
      const cleaned = content
        .replace(/```(?:json)?/g, '')
        .replace(/```/g, '')
        .replace(/^[^{\[]*/, '')  // Remove text before JSON
        .replace(/[^}\]]*$/, '')  // Remove text after JSON
        .trim();
      return JSON.parse(cleaned);
    },
    
    // Strategy 6: Fix common issues and parse
    () => {
      let cleaned = content
        .replace(/```(?:json)?/g, '')
        .replace(/```/g, '')
        .trim();
      
      // Find JSON boundaries
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      const firstBracket = cleaned.indexOf('[');
      const lastBracket = cleaned.lastIndexOf(']');
      
      if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      } else if (firstBracket !== -1 && lastBracket !== -1) {
        cleaned = cleaned.substring(firstBracket, lastBracket + 1);
      }
      
      // Fix common JSON issues
      cleaned = cleaned
        .replace(/,\s*([}\]])/g, '$1')  // Remove trailing commas
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')  // Quote unquoted keys
        .replace(/:\s*'([^']*)'/g, ': "$1"')  // Replace single quotes with double
        .replace(/[\x00-\x1F\x7F]/g, ' ')  // Remove control chars
        .replace(/\\'/g, "'")  // Unescape single quotes
        .replace(/\n/g, ' ')  // Replace newlines
        .replace(/\t/g, ' ');  // Replace tabs
      
      return JSON.parse(cleaned);
    },
    
    // Strategy 7: Very aggressive cleaning
    () => {
      let text = content;
      
      // Remove all non-JSON text
      text = text.replace(/```(?:json)?/gi, '').replace(/```/g, '');
      
      // Find the JSON structure
      const objStart = text.indexOf('{');
      const arrStart = text.indexOf('[');
      
      let start = -1;
      let end = -1;
      let isObject = true;
      
      if (objStart !== -1 && (arrStart === -1 || objStart < arrStart)) {
        start = objStart;
        // Find matching closing brace
        let depth = 0;
        for (let i = start; i < text.length; i++) {
          if (text[i] === '{') depth++;
          if (text[i] === '}') depth--;
          if (depth === 0) { end = i + 1; break; }
        }
      } else if (arrStart !== -1) {
        start = arrStart;
        isObject = false;
        let depth = 0;
        for (let i = start; i < text.length; i++) {
          if (text[i] === '[') depth++;
          if (text[i] === ']') depth--;
          if (depth === 0) { end = i + 1; break; }
        }
      }
      
      if (start !== -1 && end !== -1) {
        let jsonStr = text.substring(start, end);
        // Final cleanup
        jsonStr = jsonStr
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/[\x00-\x1F\x7F]/g, '')
          .replace(/\n/g, ' ')
          .replace(/\r/g, '');
        return JSON.parse(jsonStr);
      }
      throw new Error('No JSON found');
    }
  ];
  
  for (let i = 0; i < strategies.length; i++) {
    try {
      return strategies[i]();
    } catch (e) {
      // Try next strategy
    }
  }
  
  console.error('All JSON parsing strategies failed');
  console.error('Raw content (first 2000 chars):', content.substring(0, 2000));
  throw new Error('Failed to parse AI response as JSON');
}

// Perplexity Sonar Pro for website/niche analysis with real-time web access
export async function analyzeWithPerplexity(prompt: string, timeout: number = 90000): Promise<string> {
  if (!apiKey) {
    throw new Error('AI API key not configured');
  }

  try {
    // Perplexity with web access can take longer, so default timeout is 90s
    const completionPromise = openaiClient.chat.completions.create({
      model: BEST_MODELS.PERPLEXITY,
      messages: [
        {
          role: 'system',
          content: 'Je bent een expert in het analyseren van websites en het identificeren van hun niche op basis van PRODUCTEN, DIENSTEN en CONTENT. Je hebt toegang tot het internet en kunt websites live bekijken. BELANGRIJK: Kijk naar MEERDERE pagina\'s en ALLE artikel titels om de OVERKOEPELENDE niche te bepalen - niet alleen het eerste artikel. Focus op: (1) Welke producten worden verkocht, (2) Welke diensten worden aangeboden, (3) De volledige range van content onderwerpen. Als een site over meerdere gerelateerde onderwerpen gaat (bijv. RAM, SSD, virusscanners, PC bouwen), kies dan de BREDE niche (bijv. "Computer Tutorials"), NIET een enkel subtopic (bijv. "Virusscanner"). Geef specifieke maar brede niches - NOOIT generieke termen zoals "E-commerce" of "Online Shop".',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Perplexity request timed out after ${timeout}ms`)), timeout);
    });

    const completion = await Promise.race([completionPromise, timeoutPromise]);

    const content = completion.choices[0]?.message?.content || '';

    // Check if content is empty
    if (!content || content.trim().length === 0) {
      console.error('Perplexity returned empty content');
      console.error('Response object keys:', Object.keys(completion));
      console.error('Choices:', completion.choices);
      throw new Error('Perplexity returned empty content. The AI model did not generate any text. Please try again.');
    }

    return content;
  } catch (error: any) {
    console.error('Perplexity analysis error:', error);

    // Handle timeout errors specifically
    if (error.message?.includes('timed out')) {
      throw new Error(`Perplexity analysis timed out after ${timeout}ms. The website analysis took too long.`);
    }

    throw new Error(`Perplexity analysis failed: ${error.message}`);
  }
}

// Perplexity for JSON responses - uses same robust parsing as generateJSONCompletion
export async function analyzeWithPerplexityJSON<T>(prompt: string, timeout: number = 90000): Promise<T> {
  const content = await analyzeWithPerplexity(prompt, timeout);
  
  // Multiple parsing strategies (same as generateJSONCompletion)
  const strategies = [
    // Strategy 1: Direct parse
    () => JSON.parse(content.trim()),
    
    // Strategy 2: Extract from code blocks
    () => {
      const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) return JSON.parse(match[1].trim());
      throw new Error('No code block');
    },
    
    // Strategy 3: Find JSON object
    () => {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error('No object');
    },
    
    // Strategy 4: Fix common issues and parse
    () => {
      let cleaned = content
        .replace(/```(?:json)?/g, '')
        .replace(/```/g, '')
        .trim();
      
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
      
      cleaned = cleaned
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/[\x00-\x1F\x7F]/g, ' ')
        .replace(/\n/g, ' ');
      
      return JSON.parse(cleaned);
    },
    
    // Strategy 5: Very aggressive - find matching braces
    () => {
      let text = content.replace(/```(?:json)?/gi, '').replace(/```/g, '');
      const start = text.indexOf('{');
      if (start === -1) throw new Error('No object start');
      
      let depth = 0;
      let end = -1;
      for (let i = start; i < text.length; i++) {
        if (text[i] === '{') depth++;
        if (text[i] === '}') depth--;
        if (depth === 0) { end = i + 1; break; }
      }
      
      if (end !== -1) {
        let jsonStr = text.substring(start, end)
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/[\x00-\x1F\x7F]/g, '')
          .replace(/\n/g, ' ');
        return JSON.parse(jsonStr);
      }
      throw new Error('No matching braces');
    }
  ];
  
  for (let i = 0; i < strategies.length; i++) {
    try {
      return strategies[i]();
    } catch (e) {
      // Try next strategy
    }
  }
  
  console.error('All Perplexity JSON parsing strategies failed');
  console.error('Raw content (first 2000 chars):', content.substring(0, 2000));
  throw new Error('Failed to parse Perplexity response as JSON');
}

export default anthropicClient;
