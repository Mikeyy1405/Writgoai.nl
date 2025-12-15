
/**
 * Smart Model Router
 * Automatisch het beste model kiezen op basis van de taak
 */

// 🎯 MODEL CATEGORIES
// Updated with correct AIML API model IDs
export const MODEL_CATEGORIES = {
  // Web Search - Voor actuele informatie
  WEB_SEARCH: {
    primary: 'perplexity/sonar-pro',
    fallback: 'google/gemini-3-pro-preview',
    description: 'Real-time web search met Perplexity Sonar Pro'
  },
  
  // Advanced Reasoning - Voor complexe analyses
  REASONING: {
    primary: 'google/gemini-3-pro-preview',
    fallback: 'anthropic/claude-sonnet-4.5',
    description: 'Diepgaande redenering met Gemini 3 Pro'
  },
  
  // Long Context - Voor grote documenten
  LONG_CONTEXT: {
    primary: 'google/gemini-3-pro-preview',
    fallback: 'anthropic/claude-sonnet-4.5',
    description: 'Tot 1M+ tokens context'
  },
  
  // Creative Writing - Voor blogs en content (Dutch)
  CREATIVE: {
    primary: 'anthropic/claude-sonnet-4.5',
    fallback: 'google/gemini-3-pro-preview',
    description: 'Beste Nederlandse content met Claude Sonnet 4.5'
  },
  
  // Fast Generation - Voor snelle responses
  FAST: {
    primary: 'anthropic/claude-sonnet-4.5',
    fallback: 'gpt-4o-mini',
    description: 'Snelle antwoorden met goede kwaliteit'
  },
  
  // Code Generation - Voor programmeren
  CODE: {
    primary: 'anthropic/claude-opus-4-5',
    fallback: 'anthropic/claude-sonnet-4.5',
    description: 'Beste code generatie met Claude Opus 4.5'
  },
  
  // Dutch Language - Voor Nederlandse teksten
  DUTCH: {
    primary: 'anthropic/claude-sonnet-4.5',
    fallback: 'google/gemini-3-pro-preview',
    description: 'Beste Nederlandse taal met Claude Sonnet 4.5'
  },
  
  // SEO Writing - Voor SEO-geoptimaliseerde content
  SEO_WRITING: {
    primary: 'anthropic/claude-sonnet-4.5',
    fallback: 'google/gemini-3-pro-preview',
    description: 'SEO-geoptimaliseerd schrijven met Claude Sonnet 4.5'
  },
  
  // Multimodal - Voor afbeeldingen
  VISION: {
    primary: 'google/gemini-3-pro-preview',
    fallback: 'gpt-4o',
    description: 'Afbeelding analyse met Gemini 3 Pro'
  }
};

// 🧠 SMART MODEL SELECTION
export function selectModel(taskType: string, options?: {
  needsWebSearch?: boolean;
  needsReasoning?: boolean;
  needsLongContext?: boolean;
  needsSpeed?: boolean;
  needsCode?: boolean;
}): string {
  
  // Web search taken
  if (options?.needsWebSearch || taskType.includes('search') || taskType.includes('actueel')) {
    return MODEL_CATEGORIES.WEB_SEARCH.primary;
  }
  
  // Reasoning taken
  if (options?.needsReasoning || taskType.includes('analyse') || taskType.includes('complex')) {
    return MODEL_CATEGORIES.REASONING.primary;
  }
  
  // Lange context
  if (options?.needsLongContext || taskType.includes('document') || taskType.includes('lang')) {
    return MODEL_CATEGORIES.LONG_CONTEXT.primary;
  }
  
  // Code taken
  if (options?.needsCode || taskType.includes('code') || taskType.includes('programming')) {
    return MODEL_CATEGORIES.CODE.primary;
  }
  
  // Snelle responses
  if (options?.needsSpeed || taskType.includes('snel') || taskType.includes('quick')) {
    return MODEL_CATEGORIES.FAST.primary;
  }
  
  // SEO writing
  if (taskType.includes('seo') || taskType.includes('blog') || taskType.includes('artikel')) {
    return MODEL_CATEGORIES.SEO_WRITING.primary;
  }
  
  // Default: Creative writing
  return MODEL_CATEGORIES.CREATIVE.primary;
}

// 📊 MODEL FALLBACK CHAIN
export function getModelFallbackChain(category: keyof typeof MODEL_CATEGORIES): string[] {
  const cat = MODEL_CATEGORIES[category];
  return [cat.primary, cat.fallback, 'gpt-4o-mini']; // Altijd een fallback
}

// 🔍 Detect task type from prompt
export function detectTaskType(prompt: string): keyof typeof MODEL_CATEGORIES {
  const lower = prompt.toLowerCase();
  
  // Check voor specifieke keywords
  if (lower.includes('actueel') || lower.includes('nieuws') || lower.includes('latest') || 
      lower.includes('vandaag') || lower.includes('recent')) {
    return 'WEB_SEARCH';
  }
  
  if (lower.includes('analyseer') || lower.includes('redeneer') || lower.includes('complex')) {
    return 'REASONING';
  }
  
  if (lower.includes('code') || lower.includes('programmeer') || lower.includes('script')) {
    return 'CODE';
  }
  
  if (lower.includes('seo') || lower.includes('blog') || lower.includes('artikel')) {
    return 'SEO_WRITING';
  }
  
  if (lower.includes('snel') || lower.includes('quick')) {
    return 'FAST';
  }
  
  // Default
  return 'CREATIVE';
}
