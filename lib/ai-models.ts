// AI Model constants that can be safely imported in both client and server components
// This file contains NO server-side initialization and can be used in 'use client' components

// Best models for each task
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
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', developer: 'Anthropic', contextLength: 200000, description: '✨ Uitstekend voor hoogwaardige Nederlandse content met natuurlijke taal en perfecte SEO', recommended: true },
  { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5 (alt)', developer: 'Anthropic', contextLength: 200000, description: 'Alternatieve endpoint voor Claude 4.5 Sonnet' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', developer: 'Anthropic', contextLength: 200000, description: '⚡ Snelste Claude model - ideaal voor korte artikelen en social media posts' },
  { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4', developer: 'Anthropic', contextLength: 200000, description: '🏆 Meest geavanceerde model - perfect voor complexe, lange en diepgaande artikelen' },
  { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', developer: 'Anthropic', contextLength: 200000, description: '📝 Verbeterde versie met betere creatieve schrijfstijl' },

  // OpenAI models
  { id: 'gpt-4o', name: 'GPT-4o', developer: 'OpenAI', contextLength: 128000, description: '🎯 Veelzijdig en betrouwbaar voor alle soorten content - uitstekende balans', recommended: true },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', developer: 'OpenAI', contextLength: 128000, description: '💨 Sneller en kostenefficiënt voor eenvoudige blogposts en productbeschrijvingen' },
  { id: 'chatgpt-4o-latest', name: 'ChatGPT-4o Latest', developer: 'OpenAI', contextLength: 128000, description: '🆕 Nieuwste GPT-4o versie met verbeterde natuurlijke schrijfstijl' },
  { id: 'o1', name: 'OpenAI o1', developer: 'OpenAI', contextLength: 200000, description: '🧠 Reasoning model - perfect voor analytische artikelen en diepgaande analyses' },
  { id: 'o3-mini', name: 'OpenAI o3 Mini', developer: 'OpenAI', contextLength: 200000, description: '💡 Nieuwste reasoning model voor logische en gestructureerde content' },

  // Google Gemini models
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', developer: 'Google', contextLength: 1000000, description: '🚀 Bliksemsnelle generatie met zeer grote context - ideaal voor lange artikelen' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', developer: 'Google', contextLength: 1000000, description: '⚡ Nieuwste Gemini - extreem snel met uitstekende kwaliteit voor alle content types' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', developer: 'Google', contextLength: 1000000, description: '🌟 Pro versie voor professionele content met grote context venster' },
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', developer: 'Google', contextLength: 1000000, description: '🔬 Experimentele nieuwste generatie - voor early adopters' },

  // DeepSeek models - Good for technical content
  { id: 'deepseek-chat', name: 'DeepSeek V3', developer: 'DeepSeek', contextLength: 128000, description: '💻 Uitstekend voor technische tutorials, how-to guides en programmeer content' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', developer: 'DeepSeek', contextLength: 128000, description: '🔍 Reasoning model - perfect voor wetenschappelijke en technische analyses' },
  { id: 'deepseek/deepseek-chat-v3.1', name: 'DeepSeek V3.1', developer: 'DeepSeek', contextLength: 128000, description: '🛠️ Nieuwste versie met verbeterde technische nauwkeurigheid' },

  // Alibaba Qwen models
  { id: 'qwen-max', name: 'Qwen Max', developer: 'Alibaba Cloud', contextLength: 32000, description: '🎨 Creatieve schrijfstijl - goed voor storytelling en engagement content' },
  { id: 'qwen-plus', name: 'Qwen Plus', developer: 'Alibaba Cloud', contextLength: 131000, description: '📚 Grote context voor uitgebreide artikelen met veel bronmateriaal' },
  { id: 'qwen-turbo', name: 'Qwen Turbo', developer: 'Alibaba Cloud', contextLength: 1000000, description: '🌊 Gigantische context - ideaal voor zeer lange documenten en e-books' },
  { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B Turbo', developer: 'Alibaba Cloud', contextLength: 32000, description: '⚡ Snel en krachtig voor diverse content types' },
  { id: 'alibaba/qwen3-32b', name: 'Qwen3 32B', developer: 'Alibaba Cloud', contextLength: 131000, description: '🆕 Nieuwste generatie met verbeterde taalvaardigheid' },

  // Meta Llama models
  { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B', developer: 'Meta', contextLength: 128000, description: '🔓 Open source model - uitstekend voor diverse content en blogs' },
  { id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', name: 'Llama 3.1 405B', developer: 'Meta', contextLength: 4000, description: '🦙 Grootste Llama model - voor professionele en complexe content' },
  { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', name: 'Llama 3.1 70B', developer: 'Meta', contextLength: 128000, description: '⚖️ Gebalanceerde keuze voor algemene content creatie' },
  { id: 'meta-llama/llama-4-scout', name: 'Llama 4 Scout', developer: 'Meta', contextLength: 1000000, description: '🔭 Experimenteel model met zeer grote context - voor pioneers' },

  // Mistral models
  { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B', developer: 'Mistral AI', contextLength: 64000, description: '🎭 Mixture of Experts - veelzijdig voor verschillende content stijlen' },
  { id: 'mistralai/mistral-nemo', name: 'Mistral Nemo', developer: 'Mistral AI', contextLength: 128000, description: '🎯 Compact maar krachtig - efficiënt voor standaard blogposts' },

  // xAI Grok models
  { id: 'x-ai/grok-3-beta', name: 'Grok 3 Beta', developer: 'xAI', contextLength: 131000, description: '🤖 Nieuwste Grok - eigenzinnige en unieke schrijfstijl voor opvallende content' },
  { id: 'x-ai/grok-4-07-09', name: 'Grok 4', developer: 'xAI', contextLength: 256000, description: '🚀 Krachtigste Grok - creatieve en originele content met persoonlijkheid' },

  // MiniMax models
  { id: 'MiniMax-Text-01', name: 'MiniMax Text-01', developer: 'MiniMax', contextLength: 1000000, description: '📖 Zeer grote context voor uitgebreide documentatie en lange vorm content' },

  // Perplexity (with web access)
  { id: 'perplexity/sonar', name: 'Sonar', developer: 'Perplexity', contextLength: 128000, description: '🌐 Real-time web toegang - perfect voor actuele onderwerpen en trending topics' },
  { id: 'perplexity/sonar-pro', name: 'Sonar Pro', developer: 'Perplexity', contextLength: 200000, description: '🔥 Pro met web toegang - uitstekend voor goed onderbouwde artikelen met recente bronnen', recommended: true },
];
