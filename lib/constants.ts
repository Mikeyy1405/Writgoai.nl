
// Constants for WritgoAI

export const CATEGORY_COLORS = {
  CONTENT_AUTOMATION: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: 'bg-blue-100',
  },
  SOCIAL_MEDIA_AUTOMATION: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: 'bg-purple-100',
  },
  YOUTUBE_FACELESS_AUTOMATION: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: 'bg-red-100',
  },
} as const;

export const STATUS_COLORS = {
  TODO: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    dot: 'bg-gray-400',
  },
  IN_PROGRESS: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
  },
  COMPLETED: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
} as const;

export const BRAND_COLORS = {
  primary: '#FF6B35', // Orange
  secondary: '#004E89', // Dark Blue
  accent: '#1B998B',
} as const;
