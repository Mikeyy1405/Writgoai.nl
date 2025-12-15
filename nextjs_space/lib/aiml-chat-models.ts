


type ModelCapability = 'chat' | 'vision' | 'code' | 'analysis' | 'web-search' | 'artifacts' | 'extended-context';

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  description: string;
  contextWindow: number;
  capabilities: readonly ModelCapability[];
}

// 🎯 CENTRALIZED AI MODEL CONFIGURATION
// Correct AIML API Model IDs (verified with user requirements)
export const AI_MODELS = {
  // Content & Writing (Dutch content, good price/quality)
  CONTENT_REWRITE: 'anthropic/claude-sonnet-4.5',
  
  // Code (Premium - fully autonomous)
  CODE_PREMIUM: 'gpt-5.2',                        // Nieuwste GPT-5.2 met beste reasoning
  CODE_STANDARD: 'anthropic/claude-sonnet-4.5',
  
  // Analysis & Large Context
  LARGE_CODEBASE: 'google/gemini-3-pro-preview',  // 1M context window, cheaper
  HUGE_DOCUMENTS: 'x-ai/grok-4-fast',             // 2M tokens context - nieuwste versie
  
  // Research (real-time internet)
  RESEARCH: 'perplexity/sonar-pro-2',             // Nieuwste research model met real-time internet
  
  // Reasoning (complex problem solving)
  REASONING_PREMIUM: 'o3-pro',                     // Premium reasoning model
  REASONING_STANDARD: 'o3',                        // Standard reasoning model
  REASONING_FAST: 'o3-mini',                       // Fast reasoning model
  
  // Image Generation
  IMAGE_PREMIUM: 'black-forest-labs/FLUX.2-pro',  // Nieuwste FLUX 2
  IMAGE_REALISTIC: 'google/imagen-4.0-ultra',     // Nieuwste Google image generation
  IMAGE_FAST: 'alibaba/z-image-turbo',            // Snelle image generation
  
  // Video Generation
  VIDEO_PREMIUM: 'openai/sora-2',                 // Nieuwste OpenAI video model
  VIDEO_QUALITY: 'google/veo-3.1',                // Text-to-Video en Image-to-Video
  VIDEO_FAST: 'kling-ai/kling-2.6-pro',           // Snelle video generation
  
  // Voice Synthesis
  VOICE_PREMIUM: 'elevenlabs/eleven-v3-alpha',    // Nieuwste ElevenLabs
  VOICE_QUALITY: 'inworld-ai/tts-1-max',          // High-quality TTS
  
  // Multilingual
  MULTILINGUAL: 'zhipu-ai/glm-4.6',               // Chinese AI specialist, goed voor meertalig
  
  // Fallback (most reliable)
  FALLBACK: 'gpt-4o-mini',
} as const;

// Task types for intelligent routing
export type TaskType = 
  | 'content_rewrite'
  | 'blog_writing'
  | 'seo_optimization'
  | 'code_complex'
  | 'code_simple'
  | 'refactoring'
  | 'research'
  | 'large_document'
  | 'codebase_analysis'
  | 'general';

/**
 * Get the appropriate model for a specific task type
 * Implements intelligent model routing based on task requirements
 */
export function getModelForTask(taskType: TaskType): string {
  switch(taskType) {
    case 'content_rewrite':
    case 'blog_writing':
    case 'seo_optimization':
      return AI_MODELS.CONTENT_REWRITE;
    case 'code_complex':
    case 'refactoring':
      return AI_MODELS.CODE_PREMIUM;
    case 'code_simple':
      return AI_MODELS.CODE_STANDARD;
    case 'research':
      return AI_MODELS.RESEARCH;
    case 'large_document':
      return AI_MODELS.HUGE_DOCUMENTS;
    case 'codebase_analysis':
      return AI_MODELS.LARGE_CODEBASE;
    default:
      return AI_MODELS.CONTENT_REWRITE;
  }
}

/**
 * Get fallback models for a given model
 * Implements fallback mechanism for model failures
 */
export function getFallbackModels(primaryModel: string): string[] {
  // If primary is content rewrite, fallback to standard code model then fallback
  if (primaryModel === AI_MODELS.CONTENT_REWRITE) {
    return [AI_MODELS.CODE_STANDARD, AI_MODELS.FALLBACK];
  }
  // If primary is premium code (GPT-5.2), fallback to standard code then content rewrite
  if (primaryModel === AI_MODELS.CODE_PREMIUM) {
    return [AI_MODELS.CODE_STANDARD, AI_MODELS.CONTENT_REWRITE, AI_MODELS.FALLBACK];
  }
  // If primary is reasoning model, fallback to other reasoning models
  if (primaryModel === AI_MODELS.REASONING_PREMIUM) {
    return [AI_MODELS.REASONING_STANDARD, AI_MODELS.CODE_PREMIUM, AI_MODELS.FALLBACK];
  }
  if (primaryModel === AI_MODELS.REASONING_STANDARD) {
    return [AI_MODELS.REASONING_FAST, AI_MODELS.CODE_PREMIUM, AI_MODELS.FALLBACK];
  }
  // If primary is research, fallback to huge documents model
  if (primaryModel === AI_MODELS.RESEARCH) {
    return [AI_MODELS.HUGE_DOCUMENTS, AI_MODELS.CODE_PREMIUM, AI_MODELS.FALLBACK];
  }
  // Default fallback chain
  return [AI_MODELS.CONTENT_REWRITE, AI_MODELS.FALLBACK];
}

// Available AI models via AIML API
export const AVAILABLE_MODELS: readonly ModelConfig[] = [
  { 
    id: AI_MODELS.CONTENT_REWRITE, 
    name: 'Claude Sonnet 4.5', 
    provider: 'Anthropic', 
    description: '🚀 Best voor Nederlandse content, uitstekende prijs/kwaliteit',
    contextWindow: 200000,
    capabilities: ['chat', 'vision', 'code', 'analysis', 'artifacts', 'extended-context'] as const
  },
  { 
    id: AI_MODELS.CODE_PREMIUM, 
    name: 'GPT-5.2', 
    provider: 'OpenAI', 
    description: '🧠 Allernieuwste GPT-5.2 met verbeterde reasoning en 400K context',
    contextWindow: 400000,
    capabilities: ['chat', 'vision', 'code', 'analysis', 'artifacts', 'extended-context'] as const
  },
  { 
    id: AI_MODELS.REASONING_PREMIUM, 
    name: 'OpenAI o3 Pro', 
    provider: 'OpenAI', 
    description: '💡 Premium reasoning model met maximale intelligentie',
    contextWindow: 200000,
    capabilities: ['chat', 'code', 'analysis'] as const
  },
  { 
    id: AI_MODELS.LARGE_CODEBASE, 
    name: 'Gemini 3 Pro Preview', 
    provider: 'Google', 
    description: '📚 1M context window, ideaal voor grote codebase analyse',
    contextWindow: 1000000,
    capabilities: ['chat', 'vision', 'code', 'analysis', 'extended-context'] as const
  },
  { 
    id: AI_MODELS.RESEARCH, 
    name: 'Perplexity Sonar Pro 2', 
    provider: 'Perplexity', 
    description: '🔍 Nieuwste research model met real-time internet en bronnen',
    contextWindow: 128000,
    capabilities: ['chat', 'web-search'] as const
  },
  { 
    id: AI_MODELS.HUGE_DOCUMENTS, 
    name: 'Grok 4 Fast', 
    provider: 'xAI', 
    description: '🚀 Enorm 2M context window, real-time data',
    contextWindow: 2000000,
    capabilities: ['chat', 'vision', 'analysis', 'extended-context'] as const
  },
  { 
    id: AI_MODELS.IMAGE_PREMIUM, 
    name: 'FLUX 2 Pro', 
    provider: 'Black Forest Labs', 
    description: '🎨 Nieuwste FLUX 2 versie met beste fotorealisme',
    contextWindow: 2048,
    capabilities: ['chat'] as const
  },
  { 
    id: AI_MODELS.VIDEO_PREMIUM, 
    name: 'Sora 2', 
    provider: 'OpenAI', 
    description: '🎬 Nieuwste OpenAI video model met hoogste kwaliteit',
    contextWindow: 2048,
    capabilities: ['chat'] as const
  },
  { 
    id: AI_MODELS.VOICE_PREMIUM, 
    name: 'ElevenLabs V3 Alpha', 
    provider: 'ElevenLabs', 
    description: '🎤 Nieuwste voice synthesis met beste emotie',
    contextWindow: 5000,
    capabilities: ['chat'] as const
  },
  { 
    id: AI_MODELS.FALLBACK, 
    name: 'GPT-4o Mini', 
    provider: 'OpenAI', 
    description: '⚡ Snel en betrouwbaar fallback model',
    contextWindow: 128000,
    capabilities: ['chat', 'vision', 'code', 'analysis'] as const
  },
];

export type ModelId = typeof AVAILABLE_MODELS[number]['id'];

/**
 * Get the default AI model
 */
export function getDefaultModel(): ModelId {
  return AI_MODELS.CONTENT_REWRITE;
}

/**
 * Get model capabilities
 */
export function getModelCapabilities(modelId: ModelId): readonly ModelCapability[] {
  const model = AVAILABLE_MODELS.find(m => m.id === modelId);
  return model?.capabilities || [];
}

/**
 * Get model context window
 */
export function getModelContextWindow(modelId: ModelId): number {
  const model = AVAILABLE_MODELS.find(m => m.id === modelId);
  return model?.contextWindow || 128000;
}

/**
 * Check if model supports artifacts
 */
export function supportsArtifacts(modelId: ModelId): boolean {
  const capabilities = getModelCapabilities(modelId);
  return capabilities.includes('artifacts');
}
