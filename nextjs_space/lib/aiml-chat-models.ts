


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
  CONTENT_REWRITE: 'claude-sonnet-4-5-20250929',
  
  // Code (Premium - fully autonomous)
  CODE_PREMIUM: 'anthropic/claude-opus-4-5',
  CODE_STANDARD: 'claude-sonnet-4-5-20250929',
  
  // Analysis & Large Context
  LARGE_CODEBASE: 'google/gemini-3-pro-preview',  // 1M context window, cheaper
  HUGE_DOCUMENTS: 'x-ai/grok-4-fast-reasoning',    // 2M tokens context
  
  // Research (real-time internet)
  RESEARCH: 'perplexity/sonar-pro',
  
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
  // If primary is premium code, fallback to standard code then content rewrite
  if (primaryModel === AI_MODELS.CODE_PREMIUM) {
    return [AI_MODELS.CODE_STANDARD, AI_MODELS.CONTENT_REWRITE, AI_MODELS.FALLBACK];
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
    name: 'Claude Opus 4.5', 
    provider: 'Anthropic', 
    description: '🧠 Beste kwaliteit, volledig autonoom voor complexe code',
    contextWindow: 200000,
    capabilities: ['chat', 'vision', 'code', 'analysis', 'artifacts', 'extended-context'] as const
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
    name: 'Perplexity Sonar Pro', 
    provider: 'Perplexity', 
    description: '🔍 Real-time internet search met bronnen en citaties',
    contextWindow: 128000,
    capabilities: ['chat', 'web-search'] as const
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
