/**
 * Niche Presets voor AI Video Creator Pro
 * Niche-specifieke configuraties voor video generatie
 */

export interface NichePreset {
  id: string;
  naam: string;
  beschrijving: string;
  beeldstijl: string;
  toon: string;
  muziek_stemming: string;
  kleuren_palette: string[];
  image_model: 'FLUX_PRO_ULTRA' | 'IMAGEN_4' | 'DALLE_3' | 'SD_35';
  voice_settings: {
    stability: number;
    similarity_boost: number;
    style: number;
  };
  script_template: {
    opening_hook: string;
    structure: string;
    closing_cta: string;
  };
  seo_keywords: string[];
  target_demographics: string[];
}

export const NICHE_PRESETS: Record<string, NichePreset> = {
  horror: {
    id: 'horror',
    naam: 'Horror',
    beschrijving: 'Griezelige en spannende content voor horror fans',
    beeldstijl: 'Dark & Moody',
    toon: 'Mysterieus',
    muziek_stemming: 'Spannend',
    kleuren_palette: ['#1a1a2e', '#16213e', '#0f3460', '#e94560'],
    image_model: 'FLUX_PRO_ULTRA',
    voice_settings: {
      stability: 0.6,
      similarity_boost: 0.8,
      style: 0.4,
    },
    script_template: {
      opening_hook: 'Wat je zo meteen gaat horen, zal je doen twijfelen aan wat je dacht te weten...',
      structure: 'build_suspense',
      closing_cta: 'Als je meer mysterieuze verhalen wilt horen, vergeet dan niet te abonneren...',
    },
    seo_keywords: ['horror verhalen', 'griezelig', 'spookverhalen', 'true horror'],
    target_demographics: ['18-24', '25-34'],
  },
  stoicism: {
    id: 'stoicism',
    naam: 'Stoicism',
    beschrijving: 'Wijsheid en filosofie voor persoonlijke groei',
    beeldstijl: 'Cinematic',
    toon: 'Wijs',
    muziek_stemming: 'Episch',
    kleuren_palette: ['#2c3e50', '#34495e', '#d4af37', '#f5f5dc'],
    image_model: 'IMAGEN_4',
    voice_settings: {
      stability: 0.7,
      similarity_boost: 0.75,
      style: 0.2,
    },
    script_template: {
      opening_hook: 'De oude filosofen kenden een geheim dat vandaag nog steeds krachtig is...',
      structure: 'philosophical_journey',
      closing_cta: 'Wil je meer eeuwenoude wijsheid ontdekken? Abonneer dan nu...',
    },
    seo_keywords: ['stoicisme', 'filosofie', 'persoonlijke groei', 'marcus aurelius'],
    target_demographics: ['25-34', '35-44', '45+'],
  },
  finance: {
    id: 'finance',
    naam: 'Finance',
    beschrijving: 'Financiële tips en geldmanagement strategieën',
    beeldstijl: 'Bright & Clean',
    toon: 'Professioneel',
    muziek_stemming: 'Motiverend',
    kleuren_palette: ['#1e3a8a', '#3b82f6', '#10b981', '#f59e0b'],
    image_model: 'DALLE_3',
    voice_settings: {
      stability: 0.65,
      similarity_boost: 0.75,
      style: 0.1,
    },
    script_template: {
      opening_hook: 'Wat als ik je vertel dat je financiële vrijheid dichter bij is dan je denkt?',
      structure: 'problem_solution',
      closing_cta: 'Voor meer financiële tips die echt werken, abonneer je nu...',
    },
    seo_keywords: ['financieel advies', 'geld besparen', 'investeren', 'passief inkomen'],
    target_demographics: ['25-34', '35-44', '45+'],
  },
  tech: {
    id: 'tech',
    naam: 'Tech',
    beschrijving: 'Technologie nieuws en innovaties',
    beeldstijl: 'Futuristic',
    toon: 'Enthusiast',
    muziek_stemming: 'Energiek',
    kleuren_palette: ['#0f172a', '#1e40af', '#06b6d4', '#8b5cf6'],
    image_model: 'SD_35',
    voice_settings: {
      stability: 0.6,
      similarity_boost: 0.7,
      style: 0.3,
    },
    script_template: {
      opening_hook: 'De technologie van morgen is vandaag al realiteit...',
      structure: 'trend_analysis',
      closing_cta: 'Blijf op de hoogte van de nieuwste tech, abonneer nu...',
    },
    seo_keywords: ['technologie', 'AI', 'innovatie', 'gadgets'],
    target_demographics: ['18-24', '25-34'],
  },
  gezondheid: {
    id: 'gezondheid',
    naam: 'Gezondheid',
    beschrijving: 'Gezondheid, fitness en welzijn tips',
    beeldstijl: 'Natural & Bright',
    toon: 'Ondersteunend',
    muziek_stemming: 'Rustig',
    kleuren_palette: ['#059669', '#10b981', '#34d399', '#a7f3d0'],
    image_model: 'DALLE_3',
    voice_settings: {
      stability: 0.7,
      similarity_boost: 0.75,
      style: 0.15,
    },
    script_template: {
      opening_hook: 'Je gezondheid is je rijkdom - laten we samen kijken hoe je deze kunt verbeteren...',
      structure: 'educational_guide',
      closing_cta: 'Voor meer gezondheid tips, vergeet niet te abonneren...',
    },
    seo_keywords: ['gezondheid', 'fitness', 'welzijn', 'levensstijl'],
    target_demographics: ['25-34', '35-44', '45+'],
  },
  gaming: {
    id: 'gaming',
    naam: 'Gaming',
    beschrijving: 'Gaming nieuws, reviews en tips',
    beeldstijl: 'Vibrant & Dynamic',
    toon: 'Energiek',
    muziek_stemming: 'Vrolijk',
    kleuren_palette: ['#7c3aed', '#a855f7', '#ec4899', '#f97316'],
    image_model: 'SD_35',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.7,
      style: 0.4,
    },
    script_template: {
      opening_hook: 'Gamers, dit gaat jullie dag maken...',
      structure: 'entertainment_focused',
      closing_cta: 'Like en abonneer voor meer gaming content!',
    },
    seo_keywords: ['gaming', 'video games', 'esports', 'game reviews'],
    target_demographics: ['18-24', '25-34'],
  },
  motivatie: {
    id: 'motivatie',
    naam: 'Motivatie',
    beschrijving: 'Inspirerende en motiverende content',
    beeldstijl: 'Inspiring & Uplifting',
    toon: 'Motiverend',
    muziek_stemming: 'Motiverend',
    kleuren_palette: ['#ea580c', '#f59e0b', '#eab308', '#84cc16'],
    image_model: 'IMAGEN_4',
    voice_settings: {
      stability: 0.65,
      similarity_boost: 0.8,
      style: 0.3,
    },
    script_template: {
      opening_hook: 'Vandaag is de dag dat alles verandert...',
      structure: 'inspirational_story',
      closing_cta: 'Als je meer inspiratie nodig hebt, abonneer dan nu...',
    },
    seo_keywords: ['motivatie', 'inspiratie', 'succes', 'mindset'],
    target_demographics: ['18-24', '25-34', '35-44'],
  },
  wetenschap: {
    id: 'wetenschap',
    naam: 'Wetenschap',
    beschrijving: 'Wetenschappelijke ontdekkingen en educatie',
    beeldstijl: 'Scientific & Clear',
    toon: 'Informatief',
    muziek_stemming: 'Rustig',
    kleuren_palette: ['#1e40af', '#3b82f6', '#0ea5e9', '#06b6d4'],
    image_model: 'DALLE_3',
    voice_settings: {
      stability: 0.75,
      similarity_boost: 0.75,
      style: 0.1,
    },
    script_template: {
      opening_hook: 'Wat de wetenschap net heeft ontdekt, zal je perspectief veranderen...',
      structure: 'scientific_explanation',
      closing_cta: 'Voor meer fascinerende wetenschap, abonneer nu...',
    },
    seo_keywords: ['wetenschap', 'onderwijs', 'ontdekkingen', 'educatief'],
    target_demographics: ['25-34', '35-44', '45+'],
  },
  geschiedenis: {
    id: 'geschiedenis',
    naam: 'Geschiedenis',
    beschrijving: 'Historische verhalen en gebeurtenissen',
    beeldstijl: 'Historical & Dramatic',
    toon: 'Verhalend',
    muziek_stemming: 'Episch',
    kleuren_palette: ['#78350f', '#92400e', '#b45309', '#d97706'],
    image_model: 'IMAGEN_4',
    voice_settings: {
      stability: 0.7,
      similarity_boost: 0.8,
      style: 0.2,
    },
    script_template: {
      opening_hook: 'In een tijd lang geleden, gebeurde iets dat de wereld voorgoed zou veranderen...',
      structure: 'narrative_timeline',
      closing_cta: 'Wil je meer historische verhalen? Abonneer dan...',
    },
    seo_keywords: ['geschiedenis', 'historisch', 'oorlog', 'cultuur'],
    target_demographics: ['35-44', '45+'],
  },
  true_crime: {
    id: 'true_crime',
    naam: 'True Crime',
    beschrijving: 'Ware misdaadverhalen en mysteries',
    beeldstijl: 'Dark & Gritty',
    toon: 'Dramatisch',
    muziek_stemming: 'Spannend',
    kleuren_palette: ['#18181b', '#27272a', '#dc2626', '#991b1b'],
    image_model: 'FLUX_PRO_ULTRA',
    voice_settings: {
      stability: 0.65,
      similarity_boost: 0.8,
      style: 0.35,
    },
    script_template: {
      opening_hook: 'Wat je vandaag gaat horen is zo bizar dat het bijna ongelofelijk lijkt...',
      structure: 'mystery_unfolding',
      closing_cta: 'Voor meer true crime mysteries, vergeet niet te abonneren...',
    },
    seo_keywords: ['true crime', 'misdaad', 'mysteries', 'detective'],
    target_demographics: ['25-34', '35-44'],
  },
  educatie: {
    id: 'educatie',
    naam: 'Educatie',
    beschrijving: 'Educatieve content en leermaterialen',
    beeldstijl: 'Clear & Educational',
    toon: 'Informatief',
    muziek_stemming: 'Rustig',
    kleuren_palette: ['#0891b2', '#06b6d4', '#22d3ee', '#67e8f9'],
    image_model: 'DALLE_3',
    voice_settings: {
      stability: 0.75,
      similarity_boost: 0.75,
      style: 0.1,
    },
    script_template: {
      opening_hook: 'Vandaag leer je iets dat je altijd al wilde weten...',
      structure: 'educational_breakdown',
      closing_cta: 'Blijf leren met ons, abonneer nu...',
    },
    seo_keywords: ['educatie', 'leren', 'les', 'uitleg'],
    target_demographics: ['18-24', '25-34', '35-44'],
  },
  lifestyle: {
    id: 'lifestyle',
    naam: 'Lifestyle',
    beschrijving: 'Lifestyle tips en inspiratie',
    beeldstijl: 'Aesthetic & Modern',
    toon: 'Casual',
    muziek_stemming: 'Vrolijk',
    kleuren_palette: ['#ec4899', '#f472b6', '#fbbf24', '#fde047'],
    image_model: 'DALLE_3',
    voice_settings: {
      stability: 0.6,
      similarity_boost: 0.75,
      style: 0.25,
    },
    script_template: {
      opening_hook: 'Laten we samen je leven een beetje leuker maken...',
      structure: 'tips_and_tricks',
      closing_cta: 'Voor meer lifestyle inspiratie, abonneer nu...',
    },
    seo_keywords: ['lifestyle', 'tips', 'inspiratie', 'leven'],
    target_demographics: ['18-24', '25-34'],
  },
};

// Helper functie om niche preset te krijgen
export function getNichePreset(nicheId: string): NichePreset | null {
  return NICHE_PRESETS[nicheId] || null;
}

// Lijst van alle beschikbare niches voor dropdown
export const AVAILABLE_NICHES = Object.values(NICHE_PRESETS).map(preset => ({
  value: preset.id,
  label: preset.naam,
  description: preset.beschrijving,
}));

// Taal opties
export const LANGUAGE_OPTIONS = [
  { value: 'nl', label: 'Nederlands', voice_id: 'CwhRBWXzGAHq8TQ4Fs17' }, // Roger
  { value: 'en', label: 'Engels', voice_id: 'EXAVITQu4vr4xnSDxMaL' }, // Sarah
  { value: 'de', label: 'Duits', voice_id: '2EiwWnXFnvU5JabPnv8n' }, // Clyde
  { value: 'fr', label: 'Frans', voice_id: 'FGY2WhTYpPnrIDTdsKH5' }, // Laura
  { value: 'es', label: 'Spaans', voice_id: 'IKne3meq5aSn9XLyUdCD' }, // Charlie
];

// Video lengte opties
export const VIDEO_LENGTH_OPTIONS = [
  { value: 'kort', label: 'Kort (1-3 min)', duration: { min: 60, max: 180 } },
  { value: 'medium', label: 'Medium (5-8 min)', duration: { min: 300, max: 480 } },
  { value: 'lang', label: 'Lang (10-15 min)', duration: { min: 600, max: 900 } },
];

// Toon opties
export const TONE_OPTIONS = [
  { value: 'informatief', label: 'Informatief' },
  { value: 'mysterieus', label: 'Mysterieus' },
  { value: 'motiverend', label: 'Motiverend' },
  { value: 'dramatisch', label: 'Dramatisch' },
  { value: 'casual', label: 'Casual' },
  { value: 'professioneel', label: 'Professioneel' },
];

// Beeldstijl opties
export const IMAGE_STYLE_OPTIONS = [
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'realistic', label: 'Realistic' },
  { value: 'artistic', label: 'Artistic' },
  { value: 'dark-moody', label: 'Dark & Moody' },
  { value: 'bright-clean', label: 'Bright & Clean' },
  { value: 'vintage', label: 'Vintage' },
];

// Stem geslacht opties
export const VOICE_GENDER_OPTIONS = [
  { value: 'male', label: 'Man' },
  { value: 'female', label: 'Vrouw' },
  { value: 'neutral', label: 'Neutraal' },
];

// Muziek stemming opties
export const MUSIC_MOOD_OPTIONS = [
  { value: 'episch', label: 'Episch' },
  { value: 'rustig', label: 'Rustig' },
  { value: 'spannend', label: 'Spannend' },
  { value: 'vrolijk', label: 'Vrolijk' },
  { value: 'melancholisch', label: 'Melancholisch' },
  { value: 'motiverend', label: 'Motiverend' },
];

// Doelgroep opties
export const TARGET_AUDIENCE_OPTIONS = [
  { value: '18-24', label: '18-24 jaar' },
  { value: '25-34', label: '25-34 jaar' },
  { value: '35-44', label: '35-44 jaar' },
  { value: '45+', label: '45+ jaar' },
  { value: 'algemeen', label: 'Algemeen' },
];
