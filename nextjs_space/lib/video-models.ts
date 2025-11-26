
/**
 * Video Generation Models Configuration
 * All available video models with pricing
 */

export interface VideoModel {
  id: string;
  name: string;
  provider: string;
  contextWindow?: string;
  costPerVideo: number; // in credits
  estimatedTime: string; // in seconds
  quality: 'standard' | 'pro' | 'premium';
  description: string;
  apiEndpoint: string;
}

export const VIDEO_MODELS: VideoModel[] = [
  // Alibaba Models
  {
    id: 'alibaba/wan2.1-t2v-plus',
    name: 'Wan 2.1 Plus',
    provider: 'Alibaba Cloud',
    costPerVideo: 10,
    estimatedTime: '60-120',
    quality: 'pro',
    description: 'Hoogwaardige video met goede details',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },
  {
    id: 'alibaba/wan2.1-t2v-turbo',
    name: 'Wan 2.1 Turbo',
    provider: 'Alibaba Cloud',
    costPerVideo: 5,
    estimatedTime: '30-60',
    quality: 'standard',
    description: 'Snelle generatie met goede kwaliteit',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },
  {
    id: 'alibaba/wan2.2-t2v-plus',
    name: 'Wan 2.2 T2V',
    provider: 'Alibaba Cloud',
    costPerVideo: 12,
    estimatedTime: '60-120',
    quality: 'premium',
    description: 'Nieuwste versie met beste kwaliteit',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },
  {
    id: 'alibaba/wan2.5-t2v-preview',
    name: 'Wan 2.5 Text-to-Video',
    provider: 'Alibaba Cloud',
    costPerVideo: 15,
    estimatedTime: '90-150',
    quality: 'premium',
    description: 'Preview versie met geavanceerde features',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },

  // ByteDance Models
  {
    id: 'bytedance/seedance-1-0-lite-t2v',
    name: 'Seedance 1.0 Lite',
    provider: 'ByteDance',
    costPerVideo: 6,
    estimatedTime: '40-80',
    quality: 'standard',
    description: 'Lichtgewicht model voor snelle resultaten',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },
  {
    id: 'bytedance/seedance-1-0-pro-t2v',
    name: 'Seedance 1.0 Pro',
    provider: 'ByteDance',
    costPerVideo: 12,
    estimatedTime: '60-120',
    quality: 'pro',
    description: 'Professionele kwaliteit van ByteDance',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },

  // Google Models
  {
    id: 'veo2',
    name: 'Veo 2',
    provider: 'Google',
    costPerVideo: 20,
    estimatedTime: '90-180',
    quality: 'premium',
    description: 'Google nieuwste video AI met topkwaliteit',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },
  {
    id: 'google/veo3',
    name: 'Veo 3',
    provider: 'Google',
    costPerVideo: 25,
    estimatedTime: '120-240',
    quality: 'premium',
    description: 'Nieuwste Google model met beste resultaten',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },
  {
    id: 'google/veo-3.0-fast',
    name: 'Veo 3 Fast',
    provider: 'Google',
    costPerVideo: 15,
    estimatedTime: '60-120',
    quality: 'pro',
    description: 'Snellere versie van Veo 3',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },

  // Kling AI Models
  {
    id: 'kling-video/v1/standard/text-to-video',
    name: 'Kling 1.0 Standard',
    provider: 'Kling AI',
    costPerVideo: 8,
    estimatedTime: '45-90',
    quality: 'standard',
    description: 'Standaard kwaliteit met goede prestaties',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },
  {
    id: 'kling-video/v1/pro/text-to-video',
    name: 'Kling 1.0 Pro',
    provider: 'Kling AI',
    costPerVideo: 12,
    estimatedTime: '60-120',
    quality: 'pro',
    description: 'Pro versie met betere details',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },
  {
    id: 'kling-video/v1.6/standard/text-to-video',
    name: 'Kling 1.6 Standard',
    provider: 'Kling AI',
    costPerVideo: 9,
    estimatedTime: '50-100',
    quality: 'standard',
    description: 'Verbeterde versie 1.6 standard',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },
  {
    id: 'kling-video/v1.6/pro/text-to-video',
    name: 'Kling 1.6 Pro',
    provider: 'Kling AI',
    costPerVideo: 14,
    estimatedTime: '70-140',
    quality: 'pro',
    description: 'Pro versie met hoogste kwaliteit',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },
  {
    id: 'klingai/v2-master-text-to-video',
    name: 'Kling 2.0 Master',
    provider: 'Kling AI',
    costPerVideo: 18,
    estimatedTime: '80-160',
    quality: 'premium',
    description: 'Master versie met beste resultaten',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },
  {
    id: 'klingai/v2.1-master-text-to-video',
    name: 'Kling 2.1 Master',
    provider: 'Kling AI',
    costPerVideo: 20,
    estimatedTime: '90-180',
    quality: 'premium',
    description: 'Nieuwste Kling versie',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },
  {
    id: 'klingai/v2.5-turbo/pro/text-to-video',
    name: 'Kling 2.5 Turbo Pro',
    provider: 'Kling AI',
    costPerVideo: 16,
    estimatedTime: '60-120',
    quality: 'pro',
    description: 'Snelle turbo versie met pro kwaliteit',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },

  // Minimax Models
  {
    id: 'video-01',
    name: 'Video-01',
    provider: 'Minimax',
    costPerVideo: 10,
    estimatedTime: '60-120',
    quality: 'pro',
    description: 'Minimax video generatie model',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },
  {
    id: 'minimax/hailuo-02',
    name: 'Hailuo 02',
    provider: 'Minimax',
    costPerVideo: 12,
    estimatedTime: '70-140',
    quality: 'pro',
    description: 'Geavanceerd Minimax model',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },

  // PixVerse Models
  {
    id: 'pixverse/v5/text-to-video',
    name: 'PixVerse V5',
    provider: 'PixVerse',
    costPerVideo: 8,
    estimatedTime: '45-90',
    quality: 'standard',
    description: 'PixVerse standaard kwaliteit',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },

  // Runway Models
  {
    id: 'gen3a_turbo',
    name: 'Gen-3 Turbo',
    provider: 'Runway',
    costPerVideo: 15,
    estimatedTime: '60-120',
    quality: 'pro',
    description: 'Runway turbo model',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },
  {
    id: 'runway/gen4_turbo',
    name: 'Gen-4 Turbo',
    provider: 'Runway',
    costPerVideo: 20,
    estimatedTime: '90-180',
    quality: 'premium',
    description: 'Nieuwste Runway generatie',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },
  {
    id: 'runway/gen4_aleph',
    name: 'Aleph',
    provider: 'Runway',
    costPerVideo: 25,
    estimatedTime: '120-240',
    quality: 'premium',
    description: 'Premium Runway model',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },

  // Krea Models
  {
    id: 'krea/krea-wan-14b/text-to-video',
    name: 'Krea WAN 14B',
    provider: 'Krea',
    costPerVideo: 13,
    estimatedTime: '60-120',
    quality: 'pro',
    description: 'Krea geavanceerde model',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },

  // Veed Models
  {
    id: 'veed/fabric-1.0',
    name: 'Fabric 1.0',
    provider: 'Veed',
    costPerVideo: 10,
    estimatedTime: '50-100',
    quality: 'pro',
    description: 'Veed Fabric model',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },
  {
    id: 'veed/fabric-1.0-fast',
    name: 'Fabric 1.0 Fast',
    provider: 'Veed',
    costPerVideo: 7,
    estimatedTime: '30-60',
    quality: 'standard',
    description: 'Snelle versie van Fabric',
    apiEndpoint: 'https://api.aimlapi.com/v2/generate/video/text-to-video'
  },
];

export function getVideoModelById(id: string): VideoModel | undefined {
  return VIDEO_MODELS.find(model => model.id === id);
}

export function getVideoModelsByQuality(quality: 'standard' | 'pro' | 'premium'): VideoModel[] {
  return VIDEO_MODELS.filter(model => model.quality === quality);
}

export function getVideoModelsByProvider(provider: string): VideoModel[] {
  return VIDEO_MODELS.filter(model => model.provider === provider);
}

export function getRecommendedModels(): VideoModel[] {
  // Return top recommended models across different price points
  return [
    VIDEO_MODELS.find(m => m.id === 'alibaba/wan2.1-t2v-turbo'),
    VIDEO_MODELS.find(m => m.id === 'kling-video/v1.6/standard/text-to-video'),
    VIDEO_MODELS.find(m => m.id === 'kling-video/v1.6/pro/text-to-video'),
    VIDEO_MODELS.find(m => m.id === 'google/veo-3.0-fast'),
  ].filter((m): m is VideoModel => m !== undefined);
}
