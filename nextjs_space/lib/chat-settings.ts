
/**
 * GPT-5.1 Chat Settings & Personality Presets
 */

export type PersonalityPreset = 
  | 'default'
  | 'professional'
  | 'friendly'
  | 'candid'
  | 'quirky'
  | 'efficient'
  | 'cynical'
  | 'nerdy';

export type ReasoningMode = 'instant' | 'thinking' | 'auto';

export interface ChatSettings {
  personality: PersonalityPreset;
  reasoningMode: ReasoningMode;
  temperature: number;
  webSearchEnabled: boolean;
  canvasModeEnabled: boolean;
  artifactsMode: boolean;
}

export const PERSONALITY_PRESETS: Record<PersonalityPreset, {
  label: string;
  description: string;
  icon: string;
  systemPrompt: string;
}> = {
  default: {
    label: 'Standaard',
    description: 'Uitgebalanceerd en warm',
    icon: '⚡',
    systemPrompt: 'Je bent een behulpzame AI-assistent die vriendelijk en direct communiceert.'
  },
  professional: {
    label: 'Professioneel',
    description: 'Formeel en zakelijk',
    icon: '💼',
    systemPrompt: 'Je bent een professionele AI-assistent. Communiceer formeel, zakelijk en to-the-point. Gebruik geen informeel taalgebruik.'
  },
  friendly: {
    label: 'Vriendelijk',
    description: 'Warm en toegankelijk',
    icon: '😊',
    systemPrompt: 'Je bent een zeer vriendelijke en behulpzame AI-assistent. Wees warm, enthousiast en toegankelijk in je antwoorden.'
  },
  candid: {
    label: 'Eerlijk',
    description: 'Direct en oprecht',
    icon: '💬',
    systemPrompt: 'Je bent een directe en eerlijke AI-assistent. Geef open en oprechte antwoorden zonder omhaal.'
  },
  quirky: {
    label: 'Speels',
    description: 'Creatief en uniek',
    icon: '🎨',
    systemPrompt: 'Je bent een creatieve en eigenzinnige AI-assistent. Wees speels, gebruik humor en unieke perspectieven.'
  },
  efficient: {
    label: 'Efficiënt',
    description: 'Kort en bondig',
    icon: '⚡',
    systemPrompt: 'Je bent een efficiënte AI-assistent. Geef korte, bondige antwoorden zonder overbodige informatie.'
  },
  cynical: {
    label: 'Cynisch',
    description: 'Kritisch en realistisch',
    icon: '😏',
    systemPrompt: 'Je bent een cynische maar realistische AI-assistent. Wees kritisch en pragmatisch in je antwoorden.'
  },
  nerdy: {
    label: 'Technisch',
    description: 'Gedetailleerd en precies',
    icon: '🤓',
    systemPrompt: 'Je bent een technische AI-assistent. Geef gedetailleerde, nauwkeurige antwoorden met technische precisie.'
  }
};

export const REASONING_MODES: Record<ReasoningMode, {
  label: string;
  description: string;
  icon: string;
}> = {
  instant: {
    label: 'Instant',
    description: 'Snelle antwoorden',
    icon: '⚡'
  },
  thinking: {
    label: 'Thinking',
    description: 'Diep redeneren',
    icon: '🧠'
  },
  auto: {
    label: 'Auto',
    description: 'Automatisch kiezen',
    icon: '🤖'
  }
};

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  personality: 'default',
  reasoningMode: 'auto',
  temperature: 0.7,
  webSearchEnabled: false,
  canvasModeEnabled: true,
  artifactsMode: false
};
