/**
 * AI Brain Model Router - Intelligente Model Selectie
 * Selecteert automatisch het beste model voor elke taak op basis van task type, priority en budget
 */

import { AIModel, TaskType, ALL_MODELS, getModelById } from './models';

export interface RouterOptions {
  task: TaskType;
  language?: string;          // Default: 'nl'
  priority?: 'speed' | 'quality' | 'cost';  // Default: 'quality'
  maxBudget?: number;         // Maximum kosten per 1k tokens (cents)
  minQuality?: 1 | 2 | 3 | 4 | 5;  // Minimum kwaliteit
}

// Task-specific model mappings
const TASK_MODEL_MAPPING: Record<TaskType, { primary: string; fallback: string; budget?: string }> = {
  // Orchestration & Complex Tasks
  orchestrate: {
    primary: 'google/gemini-3-pro-preview',
    fallback: 'gpt-4o',
  },
  
  // Long-form Content
  blog_long: {
    primary: 'claude-sonnet-4-5-20250929',
    fallback: 'gpt-5-2025-08-07',
    budget: 'deepseek-ai/DeepSeek-V3',
  },
  
  // Short-form Content
  blog_short: {
    primary: 'gpt-5-mini-2025-08-07',
    fallback: 'claude-3-5-haiku-20241022',
    budget: 'deepseek-ai/DeepSeek-V3',
  },
  
  // Social Media
  social_post: {
    primary: 'gpt-4o-mini',
    fallback: 'gemini-2.5-flash',
    budget: 'deepseek-ai/DeepSeek-V3',
  },
  
  // Video Scripts
  video_script: {
    primary: 'gpt-5-2025-08-07',
    fallback: 'claude-sonnet-4-5-20250929',
  },
  
  video_hook: {
    primary: 'gpt-4o',
    fallback: 'claude-3-5-haiku-20241022',
  },
  
  // Marketing Copy
  email: {
    primary: 'gpt-4o-mini',
    fallback: 'claude-3-5-haiku-20241022',
    budget: 'deepseek-ai/DeepSeek-V3',
  },
  
  product_description: {
    primary: 'gpt-4o-mini',
    fallback: 'gemini-2.5-flash',
    budget: 'deepseek-ai/DeepSeek-V3',
  },
  
  meta_description: {
    primary: 'gpt-4o-mini',
    fallback: 'gemini-2.5-flash',
  },
  
  // Code Tasks
  code_generate: {
    primary: 'claude-sonnet-4-5-20250929',
    fallback: 'gpt-5-2025-08-07',
    budget: 'Qwen/Qwen2.5-Coder-32B-Instruct',
  },
  
  code_review: {
    primary: 'claude-sonnet-4-5-20250929',
    fallback: 'gpt-4o',
  },
  
  code_debug: {
    primary: 'claude-opus-4-5-20250514',
    fallback: 'deepseek-ai/DeepSeek-R1',
    budget: 'deepseek-ai/DeepSeek-R1',
  },
  
  // Image Generation
  image_realistic: {
    primary: 'black-forest-labs/FLUX.1-pro',
    fallback: 'dall-e-3',
    budget: 'black-forest-labs/FLUX.1-schnell',
  },
  
  image_artistic: {
    primary: 'midjourney',
    fallback: 'black-forest-labs/FLUX.1-pro',
  },
  
  image_logo: {
    primary: 'ideogram-ai/ideogram-v3',
    fallback: 'recraft-ai/recraft-v3',
  },
  
  image_thumbnail: {
    primary: 'dall-e-3',
    fallback: 'black-forest-labs/FLUX.1-schnell',
    budget: 'stabilityai/stable-diffusion-xl-1024-v1-0',
  },
  
  // Video Generation
  video_generate: {
    primary: 'luma/ray-2',
    fallback: 'runway/gen3a_turbo',
    budget: 'kling-ai/kling-video-v2',
  },
  
  // Voice/Audio
  voice_nl: {
    primary: 'elevenlabs/eleven_multilingual_v2',
    fallback: 'openai/tts-1-hd',
  },
  
  voice_en: {
    primary: 'elevenlabs/eleven_multilingual_v2',
    fallback: 'openai/tts-1-hd',
    budget: 'cartesia/sonic',
  },
  
  transcription: {
    primary: 'openai/whisper-large-v3',
    fallback: 'openai/whisper-large-v3',
  },
  
  music_background: {
    primary: 'suno/suno-v4',
    fallback: 'minimax/music-01',
  },
  
  // Analysis & Research
  research: {
    primary: 'grok-4-1-fast',
    fallback: 'claude-opus-4-5-20250514',
    budget: 'deepseek-ai/DeepSeek-R1',
  },
  
  analyze: {
    primary: 'claude-opus-4-5-20250514',
    fallback: 'gpt-5-2025-08-07',
    budget: 'deepseek-ai/DeepSeek-R1',
  },
  
  summarize: {
    primary: 'gemini-2.5-flash',
    fallback: 'gpt-4o-mini',
    budget: 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
  },
  
  translation: {
    primary: 'gpt-5-2025-08-07',
    fallback: 'Qwen/Qwen3-235B-A22B',
    budget: 'deepseek-ai/DeepSeek-V3',
  },
  
  // Moderation
  moderation: {
    primary: 'openai/omni-moderation-latest',
    fallback: 'meta-llama/Meta-Llama-Guard-3-8B',
  },
};

/**
 * Selecteer het beste model voor een specifieke taak
 */
export function selectBestModel(options: RouterOptions): AIModel {
  const {
    task,
    language = 'nl',
    priority = 'quality',
    maxBudget,
    minQuality = 3,
  } = options;

  // Get task-specific model recommendations
  const taskMapping = TASK_MODEL_MAPPING[task];
  if (!taskMapping) {
    // Fallback to default high-quality model
    return getModelById('google/gemini-3-pro-preview') || ALL_MODELS[0];
  }

  // Select model based on priority
  let selectedModelId: string;

  switch (priority) {
    case 'cost':
      // Prefer budget model if available, otherwise fallback
      selectedModelId = taskMapping.budget || taskMapping.fallback;
      break;
    
    case 'speed':
      // For speed, prefer fallback (usually faster) or budget
      selectedModelId = taskMapping.fallback;
      break;
    
    case 'quality':
    default:
      // For quality, always prefer primary
      selectedModelId = taskMapping.primary;
      break;
  }

  // Get the selected model
  let model = getModelById(selectedModelId);
  
  if (!model) {
    // If model not found, try fallback
    model = getModelById(taskMapping.fallback);
  }

  if (!model) {
    // Last resort: return first model in ALL_MODELS
    return ALL_MODELS[0];
  }

  // Check budget constraint
  if (maxBudget) {
    const avgCost = (model.costPer1kInput + model.costPer1kOutput) / 2;
    if (avgCost > maxBudget) {
      // Try budget model
      if (taskMapping.budget) {
        const budgetModel = getModelById(taskMapping.budget);
        if (budgetModel) {
          const budgetAvgCost = (budgetModel.costPer1kInput + budgetModel.costPer1kOutput) / 2;
          if (budgetAvgCost <= maxBudget) {
            model = budgetModel;
          }
        }
      }
    }
  }

  // Check quality constraint
  if (model.quality < minQuality) {
    // Try primary model if we're on fallback/budget
    const primaryModel = getModelById(taskMapping.primary);
    if (primaryModel && primaryModel.quality >= minQuality) {
      model = primaryModel;
    }
  }

  // Check language support
  if (!model.languages.includes(language)) {
    // Try to find a model that supports the language
    const alternativeModel = getModelById(taskMapping.fallback);
    if (alternativeModel && alternativeModel.languages.includes(language)) {
      model = alternativeModel;
    }
  }

  return model;
}

/**
 * Detecteer automatisch het task type op basis van de prompt/context
 */
export function detectTaskType(prompt: string, context?: any): TaskType {
  const lowerPrompt = prompt.toLowerCase();

  // Code detection
  if (lowerPrompt.includes('code') || lowerPrompt.includes('functie') || 
      lowerPrompt.includes('bug') || lowerPrompt.includes('debug') ||
      lowerPrompt.includes('programming') || lowerPrompt.includes('typescript') ||
      lowerPrompt.includes('javascript') || lowerPrompt.includes('python')) {
    if (lowerPrompt.includes('review')) return 'code_review';
    if (lowerPrompt.includes('bug') || lowerPrompt.includes('debug') || lowerPrompt.includes('fix')) return 'code_debug';
    return 'code_generate';
  }

  // Image detection
  if (lowerPrompt.includes('afbeelding') || lowerPrompt.includes('image') ||
      lowerPrompt.includes('foto') || lowerPrompt.includes('plaatje') ||
      lowerPrompt.includes('illustratie') || lowerPrompt.includes('genereer een')) {
    if (lowerPrompt.includes('logo')) return 'image_logo';
    if (lowerPrompt.includes('thumbnail')) return 'image_thumbnail';
    if (lowerPrompt.includes('realistisch') || lowerPrompt.includes('fotorealistisch')) return 'image_realistic';
    if (lowerPrompt.includes('artistiek') || lowerPrompt.includes('kunst')) return 'image_artistic';
    return 'image_realistic';
  }

  // Video detection
  if (lowerPrompt.includes('video') || lowerPrompt.includes('reel') ||
      lowerPrompt.includes('tiktok') || lowerPrompt.includes('youtube short')) {
    if (lowerPrompt.includes('script')) return 'video_script';
    if (lowerPrompt.includes('hook')) return 'video_hook';
    return 'video_generate';
  }

  // Voice detection
  if (lowerPrompt.includes('voice') || lowerPrompt.includes('stem') ||
      lowerPrompt.includes('voice-over') || lowerPrompt.includes('inspreken')) {
    if (lowerPrompt.includes('nederlands') || lowerPrompt.includes('dutch')) return 'voice_nl';
    return 'voice_en';
  }

  // Audio detection
  if (lowerPrompt.includes('audio') || lowerPrompt.includes('muziek') ||
      lowerPrompt.includes('music') || lowerPrompt.includes('sound')) {
    if (lowerPrompt.includes('transcri')) return 'transcription';
    return 'music_background';
  }

  // Blog detection
  if (lowerPrompt.includes('blog') || lowerPrompt.includes('artikel') ||
      lowerPrompt.includes('article')) {
    if (lowerPrompt.includes('lang') || lowerPrompt.includes('uitgebreid') ||
        lowerPrompt.includes('2000') || lowerPrompt.includes('3000')) return 'blog_long';
    return 'blog_short';
  }

  // Social media detection
  if (lowerPrompt.includes('social') || lowerPrompt.includes('post') ||
      lowerPrompt.includes('instagram') || lowerPrompt.includes('facebook') ||
      lowerPrompt.includes('linkedin') || lowerPrompt.includes('twitter') ||
      lowerPrompt.includes('tweet')) {
    return 'social_post';
  }

  // Email detection
  if (lowerPrompt.includes('email') || lowerPrompt.includes('mail') ||
      lowerPrompt.includes('nieuwsbrief') || lowerPrompt.includes('newsletter')) {
    return 'email';
  }

  // Product detection
  if (lowerPrompt.includes('product') && lowerPrompt.includes('beschrijving')) {
    return 'product_description';
  }

  // Meta description detection
  if (lowerPrompt.includes('meta') && lowerPrompt.includes('description')) {
    return 'meta_description';
  }

  // Analysis detection
  if (lowerPrompt.includes('analyseer') || lowerPrompt.includes('analyze') ||
      lowerPrompt.includes('analyse') || lowerPrompt.includes('bekijk')) {
    return 'analyze';
  }

  // Research detection
  if (lowerPrompt.includes('onderzoek') || lowerPrompt.includes('research') ||
      lowerPrompt.includes('zoek uit') || lowerPrompt.includes('fact-check')) {
    return 'research';
  }

  // Summarize detection
  if (lowerPrompt.includes('samenvat') || lowerPrompt.includes('summarize') ||
      lowerPrompt.includes('samenvatting') || lowerPrompt.includes('tldr')) {
    return 'summarize';
  }

  // Translation detection
  if (lowerPrompt.includes('vertaal') || lowerPrompt.includes('translate') ||
      lowerPrompt.includes('vertaling') || lowerPrompt.includes('translation')) {
    return 'translation';
  }

  // Moderation detection
  if (lowerPrompt.includes('modereer') || lowerPrompt.includes('moderate') ||
      lowerPrompt.includes('filter') || lowerPrompt.includes('check')) {
    return 'moderation';
  }

  // Default to blog_short for general content
  return 'blog_short';
}

/**
 * Get model recommendations for a task
 */
export function getModelRecommendations(task: TaskType): {
  primary: AIModel | undefined;
  fallback: AIModel | undefined;
  budget: AIModel | undefined;
} {
  const mapping = TASK_MODEL_MAPPING[task];
  if (!mapping) {
    return {
      primary: undefined,
      fallback: undefined,
      budget: undefined,
    };
  }

  return {
    primary: getModelById(mapping.primary),
    fallback: getModelById(mapping.fallback),
    budget: mapping.budget ? getModelById(mapping.budget) : undefined,
  };
}

/**
 * Calculate estimated cost for a task
 */
export function estimateCost(
  model: AIModel,
  inputTokens: number,
  outputTokens: number
): number {
  const inputCost = (inputTokens / 1000) * model.costPer1kInput;
  const outputCost = (outputTokens / 1000) * model.costPer1kOutput;
  return inputCost + outputCost;
}

/**
 * Compare models side by side
 */
export function compareModels(modelIds: string[]): AIModel[] {
  return modelIds
    .map(id => getModelById(id))
    .filter((model): model is AIModel => model !== undefined);
}

/**
 * Get best value model (quality/cost ratio)
 */
export function getBestValueModel(category?: string): AIModel {
  let models = ALL_MODELS;
  
  if (category) {
    models = models.filter(m => m.category === category);
  }

  // Calculate value score: quality / average cost
  const modelsWithValue = models.map(model => {
    const avgCost = (model.costPer1kInput + model.costPer1kOutput) / 2;
    const valueScore = avgCost > 0 ? model.quality / avgCost : model.quality * 1000;
    return { model, valueScore };
  });

  // Sort by value score descending
  modelsWithValue.sort((a, b) => b.valueScore - a.valueScore);

  return modelsWithValue[0]?.model || ALL_MODELS[0];
}
