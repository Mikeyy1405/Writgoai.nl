/**
 * WRITGO.NL FEATURE FLAGS SYSTEM
 * 
 * Dit systeem controleert welke features zichtbaar zijn in de applicatie.
 * Doel: Vereenvoudig de app door onnodige features te verbergen.
 * 
 * Status: ✅ = Actief, ⚠️ = Optioneel, ❌ = Uitgeschakeld
 */

export const FEATURE_FLAGS = {
  // ============================================
  // ADMIN FEATURES
  // ============================================
  
  // CORE FEATURES (Altijd actief - essentieel voor business) ✅
  ADMIN_DASHBOARD: true,           // Hoofdoverzicht MRR, klanten, content
  ADMIN_CLIENTS: true,             // Klantenbeheer (CRUD)
  ADMIN_CONTENT: true,             // Content overzicht van alle klanten
  ADMIN_DISTRIBUTION: true,        // Social media distributie
  ADMIN_FINANCIAL: true,           // Financieel dashboard
  ADMIN_INVOICES: true,            // Facturen
  ADMIN_STATISTICS: true,          // Statistieken en analytics
  ADMIN_SETTINGS: true,            // Systeem instellingen
  
  // OPTIONAL FEATURES (Nuttig maar niet kritisch) ⚠️
  ADMIN_BLOG_CMS: true,            // Blog management voor WritGo.nl zelf
  ADMIN_EMAIL_INBOX: true,         // Email inbox met AI features
  
  // EXPERIMENTAL/COMPLEX FEATURES (Uitgeschakeld) ❌
  ADMIN_WRITGO_MARKETING: false,   // WritGo als interne klant (experimenteel)
  ADMIN_SEO_TOOLS: false,          // SEO & Linkbuilding (te complex)
  ADMIN_CONTENT_ANALYTICS: false,  // Content analytics (merge met statistieken)
  
  // DEPRECATED FEATURES (Verwijderd uit navigatie) ❌
  ADMIN_PROJECTS: false,           // Invisible project layer
  ADMIN_AFFILIATE: false,          // Affiliate programma
  ADMIN_AGENCY: false,             // Agency features (assignments/orders)
  ADMIN_MANAGED_PROJECTS: false,   // Duplicate van clients
  ADMIN_AUTOPILOT_CONTROL: false,  // Moet automatisch zijn
  
  // ============================================
  // CLIENT FEATURES
  // ============================================
  
  // NEW DASHBOARD (Simplified - 4 items) ✅
  CLIENT_NEW_DASHBOARD: true,      // Nieuwe vereenvoudigde dashboard
  CLIENT_OVERVIEW: true,           // Overzicht pagina
  CLIENT_PLATFORMS: true,          // Platform configuratie
  CLIENT_CONTENT: true,            // Content kalender
  CLIENT_ACCOUNT: true,            // Account instellingen
  
  // OPTIONAL CLIENT FEATURES ⚠️
  CLIENT_WORDPRESS_PUBLISH: true,  // Handmatig WordPress publiceren
  CLIENT_AUTOPILOT_SETTINGS: true, // Autopilot configuratie
  
  // OLD PORTAL (Deprecated - wordt vervangen) ❌
  CLIENT_OLD_PORTAL: false,        // Oude /client-portal met 20+ items
  
  // FEATURE BLOAT (Niet core dienst) ❌
  CLIENT_ULTIMATE_WRITER: false,   // Klant schrijft niet zelf
  CLIENT_CONTENT_HUB: false,       // Te complex
  CLIENT_EMAIL_SUITE: false,       // Niet onderdeel van dienst
  CLIENT_VIDEO_SUITE: false,       // Te geavanceerd
  CLIENT_SEO_TOOLS: false,         // Te technisch voor doelgroep
  CLIENT_WOOCOMMERCE: false,       // Niche feature
  CLIENT_LINKBUILDING: false,      // Niet core dienst
  CLIENT_AI_CHAT: false,           // Overbodig
  CLIENT_CONTENT_AUTOMATION: false,// Te technisch
};

/**
 * Type-safe feature flag keys
 */
export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Check if a feature is enabled
 * 
 * @param feature - Feature flag naam
 * @returns true als feature actief is
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return FEATURE_FLAGS[feature] ?? false;
}

/**
 * Get all enabled features
 * 
 * @returns Array van actieve feature namen
 */
export function getEnabledFeatures(): FeatureFlag[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature as FeatureFlag);
}

/**
 * Get all disabled features
 * 
 * @returns Array van uitgeschakelde feature namen
 */
export function getDisabledFeatures(): FeatureFlag[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => !enabled)
    .map(([feature]) => feature as FeatureFlag);
}

/**
 * Feature categories for reporting
 */
export const FEATURE_CATEGORIES = {
  CORE: [
    'ADMIN_DASHBOARD',
    'ADMIN_CLIENTS',
    'ADMIN_CONTENT',
    'ADMIN_DISTRIBUTION',
    'ADMIN_FINANCIAL',
    'CLIENT_NEW_DASHBOARD',
  ],
  OPTIONAL: [
    'ADMIN_BLOG_CMS',
    'ADMIN_EMAIL_INBOX',
    'CLIENT_WORDPRESS_PUBLISH',
  ],
  DEPRECATED: [
    'ADMIN_PROJECTS',
    'ADMIN_AFFILIATE',
    'ADMIN_AGENCY',
    'CLIENT_OLD_PORTAL',
  ],
};
