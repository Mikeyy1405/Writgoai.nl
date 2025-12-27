/**
 * AI Configuration System
 * Centralized configuration for all AI features
 */

export interface AIConfig {
  // Router Configuration
  router: {
    enabled: boolean;
    costOptimization: 'aggressive' | 'balanced' | 'quality';
    complexityThresholds: {
      simple: number;  // word count threshold
      complex: number; // word count threshold
    };
  };

  // Cost Optimizer Configuration
  costOptimizer: {
    enabled: boolean;
    caching: {
      enabled: boolean;
      ttl: number; // Time to live in seconds
      maxSize: number; // Maximum cache entries
    };
    budgetLimits: {
      enabled: boolean;
      dailyLimit?: number; // USD per day
      monthlyLimit?: number; // USD per month
      perRequestLimit?: number; // USD per request
    };
  };

  // Failover Configuration
  failover: {
    enabled: boolean;
    maxRetries: number;
    retryDelay: number; // milliseconds
    enableCrossProviderFailover: boolean; // Failover between OpenAI, Anthropic, etc.
  };

  // DeepAgent Configuration
  deepAgent: {
    enabled: boolean;
    maxSteps: number;
    enableMemory: boolean;
    availableTools: string[]; // Tool names to enable
  };

  // Analytics Configuration
  analytics: {
    enabled: boolean;
    trackCosts: boolean;
    trackLatency: boolean;
    trackErrors: boolean;
  };

  // Model Pricing (USD per 1M tokens)
  pricing: {
    [modelId: string]: {
      input: number;
      output: number;
    };
  };
}

// Default configuration
export const DEFAULT_AI_CONFIG: AIConfig = {
  router: {
    enabled: true,
    costOptimization: 'balanced',
    complexityThresholds: {
      simple: 50,  // < 50 words = simple
      complex: 200, // > 200 words = complex
    },
  },

  costOptimizer: {
    enabled: true,
    caching: {
      enabled: true,
      ttl: 3600, // 1 hour
      maxSize: 1000,
    },
    budgetLimits: {
      enabled: true,
      dailyLimit: 100, // $100 per day
      monthlyLimit: 2000, // $2000 per month
      perRequestLimit: 5, // $5 per request
    },
  },

  failover: {
    enabled: true,
    maxRetries: 3,
    retryDelay: 2000,
    enableCrossProviderFailover: true,
  },

  deepAgent: {
    enabled: true,
    maxSteps: 10,
    enableMemory: true,
    availableTools: [
      'web_research',
      'generate_text',
      'generate_image',
      'generate_video',
      'analyze_content',
      'search_knowledge',
    ],
  },

  analytics: {
    enabled: true,
    trackCosts: true,
    trackLatency: true,
    trackErrors: true,
  },

  // Model pricing (approximate rates as of 2025)
  pricing: {
    // OpenAI
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },

    // Anthropic Claude
    'claude-opus-4': { input: 15.00, output: 75.00 },
    'claude-sonnet-4': { input: 3.00, output: 15.00 },
    'claude-sonnet-4-5-20250929': { input: 3.00, output: 15.00 },
    'claude-haiku-4': { input: 0.25, output: 1.25 },
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },

    // Google Gemini
    'gemini-2.0-flash-exp': { input: 0.10, output: 0.40 },
    'gemini-exp-1206': { input: 0.20, output: 0.80 },
    'gemini-1.5-pro': { input: 1.25, output: 5.00 },
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },

    // DeepSeek
    'deepseek-chat': { input: 0.14, output: 0.28 },
    'deepseek-reasoner': { input: 0.55, output: 2.19 },

    // Perplexity
    'sonar-pro': { input: 3.00, output: 15.00 },
    'sonar': { input: 1.00, output: 1.00 },

    // Meta Llama
    'llama-3.3-70b': { input: 0.35, output: 0.40 },
    'llama-3.1-405b': { input: 2.00, output: 2.00 },

    // Mistral
    'mistral-large': { input: 2.00, output: 6.00 },
    'mistral-medium': { input: 0.60, output: 1.80 },
    'mistral-small': { input: 0.20, output: 0.60 },
  },
};

// Model capabilities and recommended use cases
export const MODEL_CAPABILITIES = {
  // Premium models - best quality, highest cost
  premium: [
    'claude-opus-4',
    'gpt-4-turbo',
    'claude-sonnet-4-5-20250929',
  ],

  // Balanced models - good quality, moderate cost
  balanced: [
    'claude-sonnet-4',
    'gpt-4o',
    'gemini-1.5-pro',
    'sonar-pro',
  ],

  // Fast models - quick responses, lower cost
  fast: [
    'claude-haiku-4',
    'gpt-4o-mini',
    'gemini-2.0-flash-exp',
    'mistral-small',
  ],

  // Budget models - cheapest options
  budget: [
    'deepseek-chat',
    'gemini-1.5-flash',
    'llama-3.3-70b',
  ],

  // Specialized models
  reasoning: ['deepseek-reasoner', 'claude-opus-4'],
  webAccess: ['sonar-pro', 'sonar'],
  longContext: ['gemini-1.5-pro', 'claude-sonnet-4'], // 1M+ tokens
  coding: ['gpt-4o', 'claude-sonnet-4-5-20250929', 'deepseek-chat'],
};

// Task to model mapping
export const TASK_MODEL_MAP = {
  // Content creation
  'blog_article': {
    aggressive: 'gpt-4o-mini',
    balanced: 'claude-sonnet-4',
    quality: 'claude-opus-4',
  },
  'social_media': {
    aggressive: 'deepseek-chat',
    balanced: 'gpt-4o-mini',
    quality: 'claude-haiku-4',
  },
  'technical_writing': {
    aggressive: 'gpt-4o',
    balanced: 'claude-sonnet-4',
    quality: 'claude-opus-4',
  },

  // Analysis
  'sentiment_analysis': {
    aggressive: 'gemini-1.5-flash',
    balanced: 'gpt-4o-mini',
    quality: 'claude-haiku-4',
  },
  'web_research': {
    aggressive: 'sonar',
    balanced: 'sonar-pro',
    quality: 'sonar-pro',
  },

  // Code
  'code_generation': {
    aggressive: 'deepseek-chat',
    balanced: 'gpt-4o',
    quality: 'claude-sonnet-4-5-20250929',
  },
  'code_review': {
    aggressive: 'gpt-4o-mini',
    balanced: 'claude-sonnet-4',
    quality: 'claude-opus-4',
  },

  // Reasoning
  'complex_reasoning': {
    aggressive: 'claude-sonnet-4',
    balanced: 'deepseek-reasoner',
    quality: 'claude-opus-4',
  },
  'math': {
    aggressive: 'gpt-4o-mini',
    balanced: 'deepseek-reasoner',
    quality: 'claude-opus-4',
  },
};

// Global configuration instance
let currentConfig: AIConfig = { ...DEFAULT_AI_CONFIG };

export function getAIConfig(): AIConfig {
  return currentConfig;
}

export function updateAIConfig(updates: Partial<AIConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...updates,
    router: { ...currentConfig.router, ...updates.router },
    costOptimizer: { ...currentConfig.costOptimizer, ...updates.costOptimizer },
    failover: { ...currentConfig.failover, ...updates.failover },
    deepAgent: { ...currentConfig.deepAgent, ...updates.deepAgent },
    analytics: { ...currentConfig.analytics, ...updates.analytics },
  };
}

export function resetAIConfig(): void {
  currentConfig = { ...DEFAULT_AI_CONFIG };
}
