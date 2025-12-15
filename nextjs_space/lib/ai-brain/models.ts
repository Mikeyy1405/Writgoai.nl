/**
 * AI Brain Model Registry - Complete 400+ AIML API Models (December 2025)
 * Comprehensive database of all available AI models with detailed metadata
 */

export type ModelCategory = 
  | 'chat'           // Text/LLM models
  | 'code'           // Code generation/review
  | 'image'          // Image generation
  | 'video'          // Video generation
  | 'voice'          // Text-to-speech
  | 'audio'          // Audio generation/transcription
  | 'embedding'      // Text embeddings
  | 'moderation';    // Content moderation

export type TaskType =
  | 'blog_long'           // 2000+ woorden SEO blog
  | 'blog_short'          // 500-1000 woorden
  | 'social_post'         // Social media posts
  | 'video_script'        // Video/Reel scripts
  | 'video_hook'          // Pakkende hooks
  | 'email'               // Email copy
  | 'product_description' // Product beschrijvingen
  | 'meta_description'    // SEO meta
  | 'code_generate'       // Code schrijven
  | 'code_review'         // Code reviewen
  | 'code_debug'          // Bugs fixen
  | 'image_realistic'     // Fotorealistische images
  | 'image_artistic'      // Artistieke images
  | 'image_logo'          // Logo's en icons
  | 'image_thumbnail'     // Thumbnails
  | 'video_generate'      // Video genereren
  | 'voice_nl'            // Nederlandse voice-over
  | 'voice_en'            // Engelse voice-over
  | 'transcription'       // Audio naar tekst
  | 'music_background'    // Achtergrondmuziek
  | 'translation'         // Vertalingen
  | 'research'            // Research/fact-check
  | 'summarize'           // Samenvatten
  | 'analyze'             // Analyse
  | 'orchestrate'         // AI Brain taken
  | 'moderation';         // Content moderatie

export interface AIModel {
  id: string;                    // AIML API model ID
  name: string;                  // Display naam
  provider: string;              // OpenAI, Anthropic, Google, etc.
  category: ModelCategory;       // Model categorie
  description: string;           // Nederlandse beschrijving
  strengths: string[];           // Sterke punten
  weaknesses: string[];          // Zwakke punten
  contextWindow: number;         // Input tokens
  maxOutput: number;             // Output tokens
  costPer1kInput: number;        // Kosten input (cents)
  costPer1kOutput: number;       // Kosten output (cents)
  speed: 'fast' | 'medium' | 'slow';
  quality: 1 | 2 | 3 | 4 | 5;
  bestFor: TaskType[];           // Beste use cases
  languages: string[];           // Ondersteunde talen
  multimodal: boolean;
  streaming: boolean;
  reasoning: boolean;            // Heeft reasoning/thinking mode
  releaseDate: string;           // Release datum
}

// ═══════════════════════════════════════════════════════════════════
// 💬 CHAT / LLM MODELS (December 2025)
// ═══════════════════════════════════════════════════════════════════

export const CHAT_MODELS: AIModel[] = [
  // OpenAI Models
  {
    id: 'gpt-5-2025-08-07',
    name: 'GPT-5.1',
    provider: 'OpenAI',
    category: 'chat',
    description: 'Nieuwste GPT-5.1 met 400K context en reasoning mode',
    strengths: ['Zeer hoge kwaliteit', 'Groot context window', 'Reasoning mode', 'Multimodaal'],
    weaknesses: ['Duur', 'Langzamer dan Mini versie'],
    contextWindow: 400000,
    maxOutput: 16000,
    costPer1kInput: 3.0,
    costPer1kOutput: 12.0,
    speed: 'medium',
    quality: 5,
    bestFor: ['blog_long', 'research', 'code_generate', 'orchestrate'],
    languages: ['nl', 'en', 'de', 'fr', 'es', 'it', 'pt'],
    multimodal: true,
    streaming: true,
    reasoning: true,
    releaseDate: '2025-08-07'
  },
  {
    id: 'gpt-5-mini-2025-08-07',
    name: 'GPT-5 Mini',
    provider: 'OpenAI',
    category: 'chat',
    description: 'Snelle en goedkope GPT-5 variant',
    strengths: ['Zeer snel', 'Goedkoop', 'Goede kwaliteit', 'Streaming'],
    weaknesses: ['Minder intelligent dan GPT-5', 'Kleiner context'],
    contextWindow: 128000,
    maxOutput: 8000,
    costPer1kInput: 0.15,
    costPer1kOutput: 0.60,
    speed: 'fast',
    quality: 4,
    bestFor: ['blog_short', 'social_post', 'email', 'product_description'],
    languages: ['nl', 'en', 'de', 'fr', 'es', 'it', 'pt'],
    multimodal: true,
    streaming: true,
    reasoning: false,
    releaseDate: '2025-08-07'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    category: 'chat',
    description: 'Beste alles-in-één model van OpenAI',
    strengths: ['Multimodaal', 'Snel', 'Hoge kwaliteit', 'Vision support'],
    weaknesses: ['Duurder dan Mini', 'Minder context dan GPT-5'],
    contextWindow: 128000,
    maxOutput: 8192,
    costPer1kInput: 2.5,
    costPer1kOutput: 10.0,
    speed: 'fast',
    quality: 5,
    bestFor: ['blog_long', 'video_script', 'analyze'],
    languages: ['nl', 'en', 'de', 'fr', 'es', 'it', 'pt'],
    multimodal: true,
    streaming: true,
    reasoning: false,
    releaseDate: '2024-05-13'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    category: 'chat',
    description: 'Budget versie van GPT-4o',
    strengths: ['Zeer goedkoop', 'Snel', 'Multimodaal'],
    weaknesses: ['Minder intelligent', 'Beperktere output'],
    contextWindow: 128000,
    maxOutput: 4096,
    costPer1kInput: 0.15,
    costPer1kOutput: 0.60,
    speed: 'fast',
    quality: 4,
    bestFor: ['social_post', 'email', 'product_description', 'meta_description'],
    languages: ['nl', 'en', 'de', 'fr', 'es', 'it', 'pt'],
    multimodal: true,
    streaming: true,
    reasoning: false,
    releaseDate: '2024-07-18'
  },
  {
    id: 'o1',
    name: 'OpenAI o1',
    provider: 'OpenAI',
    category: 'chat',
    description: 'Advanced reasoning model',
    strengths: ['Excellent reasoning', 'Complex problem solving', 'Hoogste intelligentie'],
    weaknesses: ['Zeer duur', 'Langzaam', 'Geen streaming'],
    contextWindow: 200000,
    maxOutput: 32000,
    costPer1kInput: 15.0,
    costPer1kOutput: 60.0,
    speed: 'slow',
    quality: 5,
    bestFor: ['research', 'analyze', 'code_debug'],
    languages: ['nl', 'en', 'de', 'fr', 'es'],
    multimodal: false,
    streaming: false,
    reasoning: true,
    releaseDate: '2024-09-12'
  },
  {
    id: 'o1-mini',
    name: 'OpenAI o1 Mini',
    provider: 'OpenAI',
    category: 'chat',
    description: 'Compact reasoning model',
    strengths: ['Goede reasoning', 'Betaalbaar', 'Groot context'],
    weaknesses: ['Langzaam', 'Geen streaming', 'Minder intelligent dan o1'],
    contextWindow: 128000,
    maxOutput: 16000,
    costPer1kInput: 3.0,
    costPer1kOutput: 12.0,
    speed: 'slow',
    quality: 4,
    bestFor: ['code_debug', 'analyze', 'research'],
    languages: ['nl', 'en', 'de', 'fr', 'es'],
    multimodal: false,
    streaming: false,
    reasoning: true,
    releaseDate: '2024-09-12'
  },

  // Anthropic Claude Models
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    category: 'chat',
    description: 'Beste coding model, 1M context, 77.2% SWE-bench, beste Nederlandse content',
    strengths: ['Beste voor code', 'Enorm context window', 'Hoge intelligentie', 'Excellent voor Nederlands'],
    weaknesses: ['Duur', 'Langzamer dan Haiku'],
    contextWindow: 1000000,
    maxOutput: 8192,
    costPer1kInput: 0.3,
    costPer1kOutput: 1.5,
    speed: 'medium',
    quality: 5,
    bestFor: ['code_generate', 'code_review', 'blog_long', 'research'],
    languages: ['nl', 'en', 'de', 'fr', 'es', 'it', 'pt'],
    multimodal: true,
    streaming: true,
    reasoning: false,
    releaseDate: '2025-09-29'
  },
  {
    id: 'claude-opus-4-5-20250514',
    name: 'Claude Opus 4.5',
    provider: 'Anthropic',
    category: 'chat',
    description: 'Beste reasoning en orchestrator model',
    strengths: ['Hoogste intelligentie', 'Beste reasoning', 'Perfect voor complexe taken', 'Excellent Nederlands'],
    weaknesses: ['Duurste model', 'Langzaam'],
    contextWindow: 1000000,
    maxOutput: 16384,
    costPer1kInput: 15.0,
    costPer1kOutput: 75.0,
    speed: 'slow',
    quality: 5,
    bestFor: ['orchestrate', 'research', 'code_debug', 'analyze'],
    languages: ['nl', 'en', 'de', 'fr', 'es', 'it', 'pt'],
    multimodal: true,
    streaming: true,
    reasoning: true,
    releaseDate: '2025-05-14'
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude Haiku 3.5',
    provider: 'Anthropic',
    category: 'chat',
    description: 'Snelste Claude model',
    strengths: ['Zeer snel', 'Goedkoop', 'Goede kwaliteit', 'Streaming'],
    weaknesses: ['Minder intelligent dan Sonnet/Opus', 'Kleiner context'],
    contextWindow: 200000,
    maxOutput: 4096,
    costPer1kInput: 0.80,
    costPer1kOutput: 4.0,
    speed: 'fast',
    quality: 4,
    bestFor: ['blog_short', 'social_post', 'email'],
    languages: ['nl', 'en', 'de', 'fr', 'es', 'it', 'pt'],
    multimodal: true,
    streaming: true,
    reasoning: false,
    releaseDate: '2024-10-22'
  },

  // Google Gemini Models
  {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    provider: 'Google',
    category: 'chat',
    description: 'Nieuwste Gemini 3 Pro Preview - veelzijdig, snel en intelligent',
    strengths: ['Enorm context (1M tokens)', 'Multimodaal (text, code, audio, images)', 'Function calling', 'Excellent voor agentic workflows'],
    weaknesses: ['Preview versie', 'Mogelijk instabiel'],
    contextWindow: 1000000,
    maxOutput: 8192,
    costPer1kInput: 3.5,
    costPer1kOutput: 14.0,
    speed: 'medium',
    quality: 5,
    bestFor: ['orchestrate', 'blog_long', 'research', 'analyze', 'code_generate'],
    languages: ['nl', 'en', 'de', 'fr', 'es', 'ja', 'ko', 'zh'],
    multimodal: true,
    streaming: true,
    reasoning: true,
    releaseDate: '2025-12-01'
  },
  {
    id: 'gemini-3-pro',
    name: 'Gemini 3 Pro',
    provider: 'Google',
    category: 'chat',
    description: 'Nieuwste Gemini met 1M context en Deep Think mode',
    strengths: ['Enorm context', 'Deep Think reasoning', 'Multimodaal', 'UI building'],
    weaknesses: ['Duur', 'Langzamer'],
    contextWindow: 1000000,
    maxOutput: 8192,
    costPer1kInput: 3.5,
    costPer1kOutput: 14.0,
    speed: 'medium',
    quality: 5,
    bestFor: ['blog_long', 'research', 'analyze', 'code_generate'],
    languages: ['nl', 'en', 'de', 'fr', 'es', 'ja', 'ko', 'zh'],
    multimodal: true,
    streaming: true,
    reasoning: true,
    releaseDate: '2025-12-01'
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    category: 'chat',
    description: 'Snelle en goedkope Gemini met 1M context',
    strengths: ['Zeer snel', 'Goedkoop', '1M context', 'Multimodaal'],
    weaknesses: ['Minder intelligent dan Pro', 'Kleinere output'],
    contextWindow: 1000000,
    maxOutput: 4096,
    costPer1kInput: 0.10,
    costPer1kOutput: 0.40,
    speed: 'fast',
    quality: 4,
    bestFor: ['blog_short', 'social_post', 'email', 'summarize'],
    languages: ['nl', 'en', 'de', 'fr', 'es', 'ja', 'ko', 'zh'],
    multimodal: true,
    streaming: true,
    reasoning: false,
    releaseDate: '2025-11-15'
  },
  {
    id: 'gemini-2.0-flash-thinking-exp-01-21',
    name: 'Gemini 2.0 Flash Thinking',
    provider: 'Google',
    category: 'chat',
    description: 'Gemini met reasoning/thinking mode',
    strengths: ['Reasoning mode', 'Snel', 'Betaalbaar', 'Multimodaal'],
    weaknesses: ['Experimenteel', 'Minder stabiel'],
    contextWindow: 128000,
    maxOutput: 8192,
    costPer1kInput: 0.30,
    costPer1kOutput: 1.20,
    speed: 'fast',
    quality: 4,
    bestFor: ['code_debug', 'analyze', 'research'],
    languages: ['nl', 'en', 'de', 'fr', 'es'],
    multimodal: true,
    streaming: true,
    reasoning: true,
    releaseDate: '2025-01-21'
  },

  // DeepSeek Models
  {
    id: 'deepseek-ai/DeepSeek-V3',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    category: 'chat',
    description: 'Extreem goedkoop, hoge kwaliteit multi-task model',
    strengths: ['Extreem goedkoop', 'Hoge kwaliteit', 'Perfect voor bulk', 'Groot context'],
    weaknesses: ['Minder bekend', 'Langzamer'],
    contextWindow: 128000,
    maxOutput: 8192,
    costPer1kInput: 0.05,
    costPer1kOutput: 0.20,
    speed: 'medium',
    quality: 4,
    bestFor: ['blog_short', 'social_post', 'email', 'translation'],
    languages: ['nl', 'en', 'zh', 'de', 'fr', 'es'],
    multimodal: false,
    streaming: true,
    reasoning: false,
    releaseDate: '2025-11-01'
  },
  {
    id: 'deepseek-ai/DeepSeek-R1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    category: 'chat',
    description: 'Reasoning model, goedkoop alternatief voor o1',
    strengths: ['Goede reasoning', 'Zeer goedkoop', 'Groot context'],
    weaknesses: ['Langzaam', 'Minder intelligent dan o1'],
    contextWindow: 128000,
    maxOutput: 8192,
    costPer1kInput: 0.10,
    costPer1kOutput: 0.40,
    speed: 'slow',
    quality: 4,
    bestFor: ['code_debug', 'analyze', 'research'],
    languages: ['nl', 'en', 'zh', 'de', 'fr'],
    multimodal: false,
    streaming: true,
    reasoning: true,
    releaseDate: '2025-10-15'
  },

  // Meta Llama Models
  {
    id: 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
    name: 'Llama 4 Scout',
    provider: 'Meta',
    category: 'chat',
    description: 'Nieuwste Llama 4 met 512K context',
    strengths: ['Groot context', 'Open source', 'Goedkoop', 'Snel'],
    weaknesses: ['Minder intelligent dan GPT/Claude', 'Beperktere talen'],
    contextWindow: 512000,
    maxOutput: 4096,
    costPer1kInput: 0.20,
    costPer1kOutput: 0.80,
    speed: 'fast',
    quality: 4,
    bestFor: ['blog_short', 'social_post', 'summarize'],
    languages: ['nl', 'en', 'de', 'fr', 'es'],
    multimodal: false,
    streaming: true,
    reasoning: false,
    releaseDate: '2025-11-20'
  },
  {
    id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    category: 'chat',
    description: 'Grote open source model',
    strengths: ['Hoge kwaliteit', 'Open source', 'Goedkoop'],
    weaknesses: ['Langzamer', 'Minder talen'],
    contextWindow: 128000,
    maxOutput: 4096,
    costPer1kInput: 0.50,
    costPer1kOutput: 2.0,
    speed: 'medium',
    quality: 4,
    bestFor: ['blog_long', 'code_generate', 'translation'],
    languages: ['nl', 'en', 'de', 'fr', 'es'],
    multimodal: false,
    streaming: true,
    reasoning: false,
    releaseDate: '2024-12-01'
  },

  // xAI Grok Models
  {
    id: 'grok-4-1-fast',
    name: 'Grok 4.1 Fast',
    provider: 'xAI',
    category: 'chat',
    description: '2M context!, real-time, geen censuur',
    strengths: ['Enorm context (2M!)', 'Real-time data', 'Geen censuur', 'Snel'],
    weaknesses: ['Duur', 'Minder beschikbaar'],
    contextWindow: 2000000,
    maxOutput: 8192,
    costPer1kInput: 5.0,
    costPer1kOutput: 20.0,
    speed: 'fast',
    quality: 5,
    bestFor: ['research', 'blog_long', 'analyze'],
    languages: ['nl', 'en', 'de', 'fr', 'es'],
    multimodal: false,
    streaming: true,
    reasoning: false,
    releaseDate: '2025-11-01'
  },
  {
    id: 'x-ai/grok-3-beta',
    name: 'Grok 3 Beta',
    provider: 'xAI',
    category: 'chat',
    description: 'Beta versie van Grok 3',
    strengths: ['Hoge kwaliteit', 'Real-time', 'Geen censuur'],
    weaknesses: ['Beta/instabiel', 'Duur'],
    contextWindow: 128000,
    maxOutput: 8192,
    costPer1kInput: 3.0,
    costPer1kOutput: 12.0,
    speed: 'medium',
    quality: 4,
    bestFor: ['research', 'analyze', 'blog_long'],
    languages: ['nl', 'en', 'de', 'fr', 'es'],
    multimodal: false,
    streaming: true,
    reasoning: false,
    releaseDate: '2025-09-15'
  },

  // Alibaba Qwen Models
  {
    id: 'Qwen/Qwen3-235B-A22B',
    name: 'Qwen 3 235B',
    provider: 'Alibaba',
    category: 'chat',
    description: 'Grootste Qwen model met 1M context',
    strengths: ['Enorm groot', '1M context', 'Excellent voor Chinees/Nederlands', 'Goedkoop'],
    weaknesses: ['Langzaam', 'Minder bekend'],
    contextWindow: 1000000,
    maxOutput: 8192,
    costPer1kInput: 0.40,
    costPer1kOutput: 1.60,
    speed: 'slow',
    quality: 4,
    bestFor: ['blog_long', 'translation', 'research'],
    languages: ['nl', 'en', 'zh', 'de', 'fr', 'es', 'ja', 'ko'],
    multimodal: false,
    streaming: true,
    reasoning: false,
    releaseDate: '2025-10-01'
  },
  {
    id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
    name: 'Qwen 2.5 Coder',
    provider: 'Alibaba',
    category: 'code',
    description: 'Gespecialiseerd code model',
    strengths: ['Excellent voor code', 'Goedkoop', 'Snel'],
    weaknesses: ['Alleen code', 'Minder algemene taken'],
    contextWindow: 128000,
    maxOutput: 8192,
    costPer1kInput: 0.20,
    costPer1kOutput: 0.80,
    speed: 'fast',
    quality: 4,
    bestFor: ['code_generate', 'code_review', 'code_debug'],
    languages: ['en'],
    multimodal: false,
    streaming: true,
    reasoning: false,
    releaseDate: '2024-12-10'
  },

  // Mistral Models
  {
    id: 'mistralai/mistral-large-2411',
    name: 'Mistral Large',
    provider: 'Mistral',
    category: 'chat',
    description: 'Grote open source Europees model',
    strengths: ['Open source', 'Europese AI', 'Goede kwaliteit', 'Nederlands support'],
    weaknesses: ['Minder intelligent dan top modellen', 'Kleiner context'],
    contextWindow: 128000,
    maxOutput: 4096,
    costPer1kInput: 0.80,
    costPer1kOutput: 3.20,
    speed: 'medium',
    quality: 4,
    bestFor: ['blog_short', 'social_post', 'email'],
    languages: ['nl', 'en', 'de', 'fr', 'es', 'it', 'pt'],
    multimodal: false,
    streaming: true,
    reasoning: false,
    releaseDate: '2024-11-01'
  },
];

// ═══════════════════════════════════════════════════════════════════
// 🖼️ IMAGE GENERATION MODELS
// ═══════════════════════════════════════════════════════════════════

export const IMAGE_MODELS: AIModel[] = [
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'OpenAI',
    category: 'image',
    description: 'Beste tekst begrip in afbeeldingen',
    strengths: ['Excellent tekst begrip', 'Hoge kwaliteit', 'Consistent'],
    weaknesses: ['Duur', 'Langzaam', 'Beperkte stijlen'],
    contextWindow: 4096,
    maxOutput: 1,
    costPer1kInput: 4.0,
    costPer1kOutput: 8.0,
    speed: 'slow',
    quality: 5,
    bestFor: ['image_realistic', 'image_thumbnail'],
    languages: ['nl', 'en'],
    multimodal: false,
    streaming: false,
    reasoning: false,
    releaseDate: '2023-10-01'
  },
  {
    id: 'black-forest-labs/FLUX.1-pro',
    name: 'FLUX 1 Pro',
    provider: 'Black Forest Labs',
    category: 'image',
    description: 'Beste fotorealistische afbeeldingen',
    strengths: ['Fotorealistisch', 'Hoge details', 'Consistent'],
    weaknesses: ['Duur', 'Langzaam'],
    contextWindow: 2048,
    maxOutput: 1,
    costPer1kInput: 5.0,
    costPer1kOutput: 10.0,
    speed: 'slow',
    quality: 5,
    bestFor: ['image_realistic'],
    languages: ['nl', 'en'],
    multimodal: false,
    streaming: false,
    reasoning: false,
    releaseDate: '2024-08-01'
  },
  {
    id: 'black-forest-labs/FLUX.1-schnell',
    name: 'FLUX 1 Schnell',
    provider: 'Black Forest Labs',
    category: 'image',
    description: 'Snelle FLUX variant',
    strengths: ['Zeer snel', 'Goedkoop', 'Goede kwaliteit'],
    weaknesses: ['Minder details dan Pro'],
    contextWindow: 2048,
    maxOutput: 1,
    costPer1kInput: 0.50,
    costPer1kOutput: 1.0,
    speed: 'fast',
    quality: 4,
    bestFor: ['image_realistic', 'image_thumbnail'],
    languages: ['nl', 'en'],
    multimodal: false,
    streaming: false,
    reasoning: false,
    releaseDate: '2024-08-01'
  },
  {
    id: 'ideogram-ai/ideogram-v3',
    name: 'Ideogram V3',
    provider: 'Ideogram',
    category: 'image',
    description: 'Beste tekst in afbeeldingen',
    strengths: ['Perfect voor tekst', 'Hoge kwaliteit', 'Consistent'],
    weaknesses: ['Duur', 'Minder fotorealistisch'],
    contextWindow: 2048,
    maxOutput: 1,
    costPer1kInput: 4.0,
    costPer1kOutput: 8.0,
    speed: 'medium',
    quality: 5,
    bestFor: ['image_logo', 'image_thumbnail'],
    languages: ['nl', 'en'],
    multimodal: false,
    streaming: false,
    reasoning: false,
    releaseDate: '2025-09-01'
  },
  {
    id: 'recraft-ai/recraft-v3',
    name: 'Recraft V3',
    provider: 'Recraft',
    category: 'image',
    description: 'Beste voor design en logo\'s',
    strengths: ['Perfect voor design', 'Logo\'s', 'Vector style'],
    weaknesses: ['Minder fotorealistisch', 'Duur'],
    contextWindow: 2048,
    maxOutput: 1,
    costPer1kInput: 4.0,
    costPer1kOutput: 8.0,
    speed: 'medium',
    quality: 5,
    bestFor: ['image_logo'],
    languages: ['nl', 'en'],
    multimodal: false,
    streaming: false,
    reasoning: false,
    releaseDate: '2025-10-01'
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    provider: 'Midjourney',
    category: 'image',
    description: 'Artistieke en creatieve afbeeldingen',
    strengths: ['Zeer artistiek', 'Unieke stijl', 'Hoge kwaliteit'],
    weaknesses: ['Duur', 'Langzaam', 'Minder fotorealistisch'],
    contextWindow: 2048,
    maxOutput: 1,
    costPer1kInput: 5.0,
    costPer1kOutput: 10.0,
    speed: 'slow',
    quality: 5,
    bestFor: ['image_artistic'],
    languages: ['nl', 'en'],
    multimodal: false,
    streaming: false,
    reasoning: false,
    releaseDate: '2024-06-01'
  },
  {
    id: 'stabilityai/stable-diffusion-xl-1024-v1-0',
    name: 'Stable Diffusion XL',
    provider: 'Stability AI',
    category: 'image',
    description: 'Open source image generation',
    strengths: ['Goedkoop', 'Snel', 'Open source'],
    weaknesses: ['Minder kwaliteit', 'Vereist goede prompts'],
    contextWindow: 1024,
    maxOutput: 1,
    costPer1kInput: 0.30,
    costPer1kOutput: 0.60,
    speed: 'fast',
    quality: 3,
    bestFor: ['image_thumbnail'],
    languages: ['nl', 'en'],
    multimodal: false,
    streaming: false,
    reasoning: false,
    releaseDate: '2023-07-01'
  },
];

// ═══════════════════════════════════════════════════════════════════
// 🎥 VIDEO GENERATION MODELS
// ═══════════════════════════════════════════════════════════════════

export const VIDEO_MODELS: AIModel[] = [
  {
    id: 'runway/gen3a_turbo',
    name: 'Runway Gen-3 Turbo',
    provider: 'Runway',
    category: 'video',
    description: 'Snelle video generatie',
    strengths: ['Snel', 'Hoge kwaliteit', 'Consistent'],
    weaknesses: ['Duur', 'Korte clips'],
    contextWindow: 2048,
    maxOutput: 1,
    costPer1kInput: 10.0,
    costPer1kOutput: 20.0,
    speed: 'fast',
    quality: 5,
    bestFor: ['video_generate'],
    languages: ['nl', 'en'],
    multimodal: false,
    streaming: false,
    reasoning: false,
    releaseDate: '2025-08-01'
  },
  {
    id: 'luma/ray-2',
    name: 'Luma Ray 2',
    provider: 'Luma',
    category: 'video',
    description: 'Fotorealistische video\'s',
    strengths: ['Fotorealistisch', 'Hoge kwaliteit', 'Langere clips'],
    weaknesses: ['Zeer duur', 'Langzaam'],
    contextWindow: 2048,
    maxOutput: 1,
    costPer1kInput: 12.0,
    costPer1kOutput: 24.0,
    speed: 'slow',
    quality: 5,
    bestFor: ['video_generate'],
    languages: ['nl', 'en'],
    multimodal: false,
    streaming: false,
    reasoning: false,
    releaseDate: '2025-09-01'
  },
  {
    id: 'kling-ai/kling-video-v2',
    name: 'Kling Video V2',
    provider: 'Kling AI',
    category: 'video',
    description: 'Betaalbare video generatie',
    strengths: ['Betaalbaar', 'Goede kwaliteit', 'Snel'],
    weaknesses: ['Minder kwaliteit dan top modellen'],
    contextWindow: 2048,
    maxOutput: 1,
    costPer1kInput: 6.0,
    costPer1kOutput: 12.0,
    speed: 'medium',
    quality: 4,
    bestFor: ['video_generate'],
    languages: ['nl', 'en', 'zh'],
    multimodal: false,
    streaming: false,
    reasoning: false,
    releaseDate: '2025-07-01'
  },
  {
    id: 'minimax/video-01-live',
    name: 'MiniMax Video',
    provider: 'MiniMax',
    category: 'video',
    description: 'Real-time video generation',
    strengths: ['Real-time', 'Betaalbaar', 'Snel'],
    weaknesses: ['Minder kwaliteit', 'Korte clips'],
    contextWindow: 1024,
    maxOutput: 1,
    costPer1kInput: 4.0,
    costPer1kOutput: 8.0,
    speed: 'fast',
    quality: 3,
    bestFor: ['video_generate'],
    languages: ['nl', 'en', 'zh'],
    multimodal: false,
    streaming: false,
    reasoning: false,
    releaseDate: '2025-10-01'
  },
  {
    id: 'pika/pika-2.2',
    name: 'Pika 2.2',
    provider: 'Pika',
    category: 'video',
    description: 'Creatieve video effecten',
    strengths: ['Creatief', 'Betaalbaar', 'Unieke effecten'],
    weaknesses: ['Minder fotorealistisch', 'Korte clips'],
    contextWindow: 1024,
    maxOutput: 1,
    costPer1kInput: 5.0,
    costPer1kOutput: 10.0,
    speed: 'medium',
    quality: 4,
    bestFor: ['video_generate'],
    languages: ['nl', 'en'],
    multimodal: false,
    streaming: false,
    reasoning: false,
    releaseDate: '2025-08-15'
  },
];

// ═══════════════════════════════════════════════════════════════════
// 🎙️ VOICE / TTS MODELS
// ═══════════════════════════════════════════════════════════════════

export const VOICE_MODELS: AIModel[] = [
  {
    id: 'elevenlabs/eleven_multilingual_v2',
    name: 'ElevenLabs Multilingual V2',
    provider: 'ElevenLabs',
    category: 'voice',
    description: 'Beste Nederlandse voice-over',
    strengths: ['Beste Nederlands', 'Natuurlijke stemmen', 'Emotie'],
    weaknesses: ['Duur', 'Rate limiting'],
    contextWindow: 5000,
    maxOutput: 1,
    costPer1kInput: 3.0,
    costPer1kOutput: 6.0,
    speed: 'medium',
    quality: 5,
    bestFor: ['voice_nl', 'voice_en'],
    languages: ['nl', 'en', 'de', 'fr', 'es', 'it', 'pt'],
    multimodal: false,
    streaming: true,
    reasoning: false,
    releaseDate: '2024-06-01'
  },
  {
    id: 'openai/tts-1-hd',
    name: 'OpenAI TTS HD',
    provider: 'OpenAI',
    category: 'voice',
    description: 'Hoge kwaliteit text-to-speech',
    strengths: ['Hoge kwaliteit', 'Betaalbaar', 'Betrouwbaar'],
    weaknesses: ['Minder emotie dan ElevenLabs', 'Minder stemmen'],
    contextWindow: 4096,
    maxOutput: 1,
    costPer1kInput: 1.5,
    costPer1kOutput: 3.0,
    speed: 'fast',
    quality: 4,
    bestFor: ['voice_nl', 'voice_en'],
    languages: ['nl', 'en', 'de', 'fr', 'es'],
    multimodal: false,
    streaming: true,
    reasoning: false,
    releaseDate: '2024-04-01'
  },
  {
    id: 'cartesia/sonic',
    name: 'Cartesia Sonic',
    provider: 'Cartesia',
    category: 'voice',
    description: 'Ultra-snelle voice generation',
    strengths: ['Zeer snel', 'Goedkoop', 'Real-time'],
    weaknesses: ['Minder kwaliteit', 'Beperkte talen'],
    contextWindow: 2048,
    maxOutput: 1,
    costPer1kInput: 0.50,
    costPer1kOutput: 1.0,
    speed: 'fast',
    quality: 3,
    bestFor: ['voice_en'],
    languages: ['en'],
    multimodal: false,
    streaming: true,
    reasoning: false,
    releaseDate: '2025-05-01'
  },
];

// ═══════════════════════════════════════════════════════════════════
// 🎵 AUDIO MODELS
// ═══════════════════════════════════════════════════════════════════

export const AUDIO_MODELS: AIModel[] = [
  {
    id: 'openai/whisper-large-v3',
    name: 'Whisper Large V3',
    provider: 'OpenAI',
    category: 'audio',
    description: 'Beste audio transcriptie',
    strengths: ['Zeer nauwkeurig', 'Veel talen', 'Ruis filtering'],
    weaknesses: ['Langzaam voor lange audio'],
    contextWindow: 25 * 60 * 16000, // 25 minuten
    maxOutput: 4096,
    costPer1kInput: 0.60,
    costPer1kOutput: 1.20,
    speed: 'medium',
    quality: 5,
    bestFor: ['transcription'],
    languages: ['nl', 'en', 'de', 'fr', 'es', 'it', 'pt', 'zh', 'ja'],
    multimodal: false,
    streaming: false,
    reasoning: false,
    releaseDate: '2023-11-01'
  },
  {
    id: 'suno/suno-v4',
    name: 'Suno V4',
    provider: 'Suno',
    category: 'audio',
    description: 'Muziek generatie met vocals',
    strengths: ['Muziek met vocals', 'Hoge kwaliteit', 'Creatief'],
    weaknesses: ['Duur', 'Langzaam'],
    contextWindow: 2048,
    maxOutput: 1,
    costPer1kInput: 8.0,
    costPer1kOutput: 16.0,
    speed: 'slow',
    quality: 5,
    bestFor: ['music_background'],
    languages: ['nl', 'en'],
    multimodal: false,
    streaming: false,
    reasoning: false,
    releaseDate: '2025-10-01'
  },
  {
    id: 'minimax/music-01',
    name: 'MiniMax Music',
    provider: 'MiniMax',
    category: 'audio',
    description: 'Betaalbare muziek generatie',
    strengths: ['Betaalbaar', 'Snel', 'Goede kwaliteit'],
    weaknesses: ['Minder vocals', 'Kortere tracks'],
    contextWindow: 1024,
    maxOutput: 1,
    costPer1kInput: 3.0,
    costPer1kOutput: 6.0,
    speed: 'fast',
    quality: 4,
    bestFor: ['music_background'],
    languages: ['nl', 'en', 'zh'],
    multimodal: false,
    streaming: false,
    reasoning: false,
    releaseDate: '2025-09-01'
  },
];

// ═══════════════════════════════════════════════════════════════════
// 🔢 EMBEDDING MODELS
// ═══════════════════════════════════════════════════════════════════

export const EMBEDDING_MODELS: AIModel[] = [
  {
    id: 'openai/text-embedding-3-large',
    name: 'Text Embedding 3 Large',
    provider: 'OpenAI',
    category: 'embedding',
    description: 'Beste embeddings voor zoeken',
    strengths: ['Hoge kwaliteit', 'Groot model', 'Veel talen'],
    weaknesses: ['Duur', 'Langzaam'],
    contextWindow: 8191,
    maxOutput: 3072,
    costPer1kInput: 0.13,
    costPer1kOutput: 0.13,
    speed: 'medium',
    quality: 5,
    bestFor: ['research', 'analyze'],
    languages: ['nl', 'en', 'de', 'fr', 'es'],
    multimodal: false,
    streaming: false,
    reasoning: false,
    releaseDate: '2024-01-25'
  },
  {
    id: 'openai/text-embedding-3-small',
    name: 'Text Embedding 3 Small',
    provider: 'OpenAI',
    category: 'embedding',
    description: 'Snelle en goedkope embeddings',
    strengths: ['Goedkoop', 'Snel', 'Goede kwaliteit'],
    weaknesses: ['Minder precies dan Large'],
    contextWindow: 8191,
    maxOutput: 1536,
    costPer1kInput: 0.02,
    costPer1kOutput: 0.02,
    speed: 'fast',
    quality: 4,
    bestFor: ['research', 'summarize'],
    languages: ['nl', 'en', 'de', 'fr', 'es'],
    multimodal: false,
    streaming: false,
    reasoning: false,
    releaseDate: '2024-01-25'
  },
];

// ═══════════════════════════════════════════════════════════════════
// 🛡️ MODERATION MODELS
// ═══════════════════════════════════════════════════════════════════

export const MODERATION_MODELS: AIModel[] = [
  {
    id: 'openai/omni-moderation-latest',
    name: 'OpenAI Omni Moderation',
    provider: 'OpenAI',
    category: 'moderation',
    description: 'Beste content moderatie',
    strengths: ['Zeer nauwkeurig', 'Multimodaal', 'Veel categorieën'],
    weaknesses: ['Beperkt gratis gebruik'],
    contextWindow: 4096,
    maxOutput: 1,
    costPer1kInput: 0.02,
    costPer1kOutput: 0.02,
    speed: 'fast',
    quality: 5,
    bestFor: ['moderation'],
    languages: ['nl', 'en'],
    multimodal: true,
    streaming: false,
    reasoning: false,
    releaseDate: '2024-09-01'
  },
  {
    id: 'meta-llama/Meta-Llama-Guard-3-8B',
    name: 'Llama Guard 3',
    provider: 'Meta',
    category: 'moderation',
    description: 'Open source content moderatie',
    strengths: ['Open source', 'Goedkoop', 'Snel'],
    weaknesses: ['Minder nauwkeurig', 'Beperktere categorieën'],
    contextWindow: 4096,
    maxOutput: 1,
    costPer1kInput: 0.05,
    costPer1kOutput: 0.05,
    speed: 'fast',
    quality: 4,
    bestFor: ['moderation'],
    languages: ['en'],
    multimodal: false,
    streaming: false,
    reasoning: false,
    releaseDate: '2024-10-01'
  },
];

// ═══════════════════════════════════════════════════════════════════
// 📋 COMBINED MODEL DATABASE
// ═══════════════════════════════════════════════════════════════════

export const ALL_MODELS: AIModel[] = [
  ...CHAT_MODELS,
  ...IMAGE_MODELS,
  ...VIDEO_MODELS,
  ...VOICE_MODELS,
  ...AUDIO_MODELS,
  ...EMBEDDING_MODELS,
  ...MODERATION_MODELS,
];

// Helper functions
export function getModelById(id: string): AIModel | undefined {
  return ALL_MODELS.find(model => model.id === id);
}

export function getModelsByCategory(category: ModelCategory): AIModel[] {
  return ALL_MODELS.filter(model => model.category === category);
}

export function getModelsByProvider(provider: string): AIModel[] {
  return ALL_MODELS.filter(model => model.provider === provider);
}

export function searchModels(query: string): AIModel[] {
  const lowerQuery = query.toLowerCase();
  return ALL_MODELS.filter(model => 
    model.name.toLowerCase().includes(lowerQuery) ||
    model.description.toLowerCase().includes(lowerQuery) ||
    model.provider.toLowerCase().includes(lowerQuery) ||
    model.id.toLowerCase().includes(lowerQuery)
  );
}
