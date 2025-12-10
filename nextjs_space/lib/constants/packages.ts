/**
 * Package and Platform Constants
 * 
 * Defines all subscription packages and social media platforms
 */

import { PackageType, PlatformType } from '@/lib/supabase/database.types';

// ============================================
// PACKAGE INFORMATION
// ============================================

export interface PackageInfo {
  type: PackageType;
  name: string;
  price: number;
  pillarArticles: number;
  clusterArticles: number;
  socialPosts: number;
  videos: number;
  description: string;
  recommended?: boolean;
}

export const PACKAGE_INFO: Record<PackageType, PackageInfo> = {
  INSTAPPER: {
    type: 'INSTAPPER',
    name: 'Instapper',
    price: 197,
    pillarArticles: 2,
    clusterArticles: 0,
    socialPosts: 16,
    videos: 4,
    description: 'Perfect om te starten',
  },
  STARTER: {
    type: 'STARTER',
    name: 'Starter',
    price: 297,
    pillarArticles: 1,
    clusterArticles: 2,
    socialPosts: 16,
    videos: 4,
    description: 'Serieus bouwen aan SEO',
  },
  GROEI: {
    type: 'GROEI',
    name: 'Groei',
    price: 497,
    pillarArticles: 1,
    clusterArticles: 3,
    socialPosts: 24,
    videos: 8,
    description: 'De beste keuze voor groei',
    recommended: true, // ⭐ BESTSELLER
  },
  DOMINANT: {
    type: 'DOMINANT',
    name: 'Dominant',
    price: 797,
    pillarArticles: 2,
    clusterArticles: 4,
    socialPosts: 40,
    videos: 12,
    description: 'Maximale online dominantie',
  },
};

// ============================================
// PLATFORM INFORMATION
// ============================================

export interface PlatformInfo {
  type: PlatformType;
  name: string;
  icon: string;
  category: 'essential' | 'recommended' | 'optional';
  description: string;
}

export const PLATFORM_INFO: Record<PlatformType, PlatformInfo> = {
  linkedin_personal: {
    type: 'linkedin_personal',
    name: 'LinkedIn (Personal)',
    icon: '💼',
    category: 'essential',
    description: 'Persoonlijk LinkedIn profiel voor thought leadership',
  },
  linkedin_company: {
    type: 'linkedin_company',
    name: 'LinkedIn (Company)',
    icon: '��',
    category: 'recommended',
    description: 'Bedrijfspagina op LinkedIn',
  },
  instagram: {
    type: 'instagram',
    name: 'Instagram',
    icon: '📸',
    category: 'essential',
    description: 'Visuele content en stories',
  },
  facebook_personal: {
    type: 'facebook_personal',
    name: 'Facebook (Personal)',
    icon: '👤',
    category: 'optional',
    description: 'Persoonlijk Facebook profiel',
  },
  facebook_page: {
    type: 'facebook_page',
    name: 'Facebook (Page)',
    icon: '📄',
    category: 'recommended',
    description: 'Facebook bedrijfspagina',
  },
  twitter: {
    type: 'twitter',
    name: 'Twitter/X',
    icon: '🐦',
    category: 'recommended',
    description: 'Korte updates en engagement',
  },
  tiktok: {
    type: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    category: 'optional',
    description: 'Korte video content',
  },
  pinterest: {
    type: 'pinterest',
    name: 'Pinterest',
    icon: '📌',
    category: 'optional',
    description: 'Visual discovery platform',
  },
  google_my_business: {
    type: 'google_my_business',
    name: 'Google My Business',
    icon: '📍',
    category: 'essential',
    description: 'Lokale vindbaarheid',
  },
  youtube: {
    type: 'youtube',
    name: 'YouTube',
    icon: '🎬',
    category: 'recommended',
    description: 'Lange video content',
  },
};

// Helper functions
export const getAllPackages = (): PackageInfo[] => {
  return Object.values(PACKAGE_INFO);
};

export const getPackageByType = (type: PackageType): PackageInfo | undefined => {
  return PACKAGE_INFO[type];
};

export const getAllPlatforms = (): PlatformInfo[] => {
  return Object.values(PLATFORM_INFO);
};

export const getPlatformByType = (type: PlatformType): PlatformInfo | undefined => {
  return PLATFORM_INFO[type];
};

export const getPlatformsByCategory = (
  category: 'essential' | 'recommended' | 'optional'
): PlatformInfo[] => {
  return Object.values(PLATFORM_INFO).filter((p) => p.category === category);
};
