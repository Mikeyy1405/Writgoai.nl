/**
 * FEATURE FLAGS - SIMPLIFIED
 * 
 * Geen complexe feature gates meer!
 * Alles is gewoon beschikbaar voor iedereen.
 */

export const FEATURE_FLAGS = {
  // Alles is enabled!
  ALL_FEATURES_ENABLED: true,
  
  // Admin features
  ADMIN_PROJECTS: true,
  ADMIN_SEO_TOOLS: true,
  ADMIN_WRITGO_MARKETING: true,
  ADMIN_CONTENT_ANALYTICS: true,
  ADMIN_AFFILIATE: true,
  ADMIN_AGENCY: true,
  ADMIN_MANAGED_PROJECTS: true,
  ADMIN_AUTOPILOT_CONTROL: true,
  ADMIN_EMAIL_INBOX: true,
  
  // Client features
  CLIENT_ULTIMATE_WRITER: true,
  CLIENT_CONTENT_HUB: true,
  CLIENT_EMAIL_SUITE: true,
  CLIENT_VIDEO_SUITE: true,
  CLIENT_SEO_TOOLS: true,
  CLIENT_WOOCOMMERCE: true,
  CLIENT_LINKBUILDING: true,
};

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return true; // Alles is enabled!
}

export function getEnabledFeatures(): FeatureFlag[] {
  return Object.keys(FEATURE_FLAGS) as FeatureFlag[];
}

export function getDisabledFeatures(): FeatureFlag[] {
  return []; // Niets is disabled!
}
