


type ModelCapability = 'chat' | 'vision' | 'code' | 'analysis' | 'web-search' | 'artifacts' | 'extended-context';

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  description: string;
  contextWindow: number;
  capabilities: readonly ModelCapability[];
}

// Available AI models via AIML API
export const AVAILABLE_MODELS: readonly ModelConfig[] = [
  { 
    id: 'openai/gpt-5-1', 
    name: 'GPT-5.1', 
    provider: 'OpenAI', 
    description: '🚀 Nieuwste GPT-5.1 model, meest geavanceerd voor alle taken',
    contextWindow: 128000,
    capabilities: ['chat', 'vision', 'code', 'analysis', 'web-search'] as const
  },
  { 
    id: 'anthropic/claude-4-5-sonnet', 
    name: 'Claude 4.5 Sonnet', 
    provider: 'Anthropic', 
    description: '🧠 Claude 4.5 Sonnet - Uitstekend in code, reasoning en complexe projecten',
    contextWindow: 200000,
    capabilities: ['chat', 'vision', 'code', 'analysis', 'artifacts', 'extended-context'] as const
  },
];

export type ModelId = typeof AVAILABLE_MODELS[number]['id'];

/**
 * Get the default AI model
 */
export function getDefaultModel(): ModelId {
  return 'openai/gpt-5-1';
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
