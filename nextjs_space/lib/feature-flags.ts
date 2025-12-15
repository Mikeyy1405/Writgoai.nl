/**
 * FEATURE FLAGS - SIMPLIFIED
 * 
 * Geen complexe feature gates meer!
 * Alles is gewoon beschikbaar voor iedereen.
 */

export const FEATURE_FLAGS = {
  // Alles is enabled!
  ALL_FEATURES_ENABLED: true,
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
