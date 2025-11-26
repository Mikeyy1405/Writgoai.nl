
/**
 * Smart Model Router
 * Automatisch het beste model kiezen op basis van de taak
 */

// 🎯 MODEL CATEGORIES
// 🚀 ALLES GEMINI 3 PRO VOOR MAXIMALE KWALITEIT EN CONSISTENTIE
export const MODEL_CATEGORIES = {
  // Web Search - Voor actuele informatie
  WEB_SEARCH: {
    primary: 'google/gemini-3-pro-preview',
    fallback: 'google/gemini-3-pro-preview',
    description: 'Real-time web search met Gemini 3 Pro'
  },
  
  // Advanced Reasoning - Voor complexe analyses
  REASONING: {
    primary: 'google/gemini-3-pro-preview',
    fallback: 'google/gemini-3-pro-preview',
    description: 'Diepgaande redenering met Gemini 3 Pro'
  },
  
  // Long Context - Voor grote documenten
  LONG_CONTEXT: {
    primary: 'google/gemini-3-pro-preview',
    fallback: 'google/gemini-3-pro-preview',
    description: 'Tot 2M+ tokens context met Gemini 3 Pro'
  },
  
  // Creative Writing - Voor blogs en content
  CREATIVE: {
    primary: 'google/gemini-3-pro-preview',
    fallback: 'google/gemini-3-pro-preview',
    description: 'Creatieve en natuurlijke schrijfstijl met Gemini 3 Pro'
  },
  
  // Fast Generation - Voor snelle responses
  FAST: {
    primary: 'google/gemini-3-pro-preview',
    fallback: 'google/gemini-3-pro-preview',
    description: 'Snelle antwoorden met Gemini 3 Pro'
  },
  
  // Code Generation - Voor programmeren
  CODE: {
    primary: 'google/gemini-3-pro-preview',
    fallback: 'google/gemini-3-pro-preview',
    description: 'Code generatie met Gemini 3 Pro'
  },
  
  // Dutch Language - Voor Nederlandse teksten
  DUTCH: {
    primary: 'google/gemini-3-pro-preview',
    fallback: 'google/gemini-3-pro-preview',
    description: 'Nederlandse taal met Gemini 3 Pro'
  },
  
  // SEO Writing - Voor SEO-geoptimaliseerde content
  SEO_WRITING: {
    primary: 'google/gemini-3-pro-preview',
    fallback: 'google/gemini-3-pro-preview',
    description: 'SEO-geoptimaliseerd schrijven met Gemini 3 Pro'
  },
  
  // Multimodal - Voor afbeeldingen
  VISION: {
    primary: 'google/gemini-3-pro-preview',
    fallback: 'google/gemini-3-pro-preview',
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
