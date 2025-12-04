/**
 * Cookie Consent Management Utilities
 * GDPR/AVG Compliant Cookie Consent System
 */

export interface CookieConsent {
  necessary: boolean;  // always true
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  timestamp: string;
  version: string;
}

export const COOKIE_CONSENT_VERSION = '1.0';
export const COOKIE_CONSENT_KEY = 'writgo_cookie_consent';

export const COOKIE_CATEGORIES = {
  necessary: {
    name: 'Noodzakelijke cookies',
    description: 'Deze cookies zijn essentieel voor het functioneren van de website. Zonder deze cookies werkt de website niet goed.',
    required: true,
    cookies: [
      'Sessie cookies voor authenticatie',
      'CSRF bescherming tokens',
      'Cookie consent voorkeuren'
    ]
  },
  analytics: {
    name: 'Analytische cookies',
    description: 'Helpen ons begrijpen hoe bezoekers de website gebruiken door informatie te verzamelen en te rapporteren.',
    required: false,
    cookies: [
      'Google Analytics (_ga, _gid)',
      'Vercel Analytics'
    ]
  },
  marketing: {
    name: 'Marketing cookies',
    description: 'Worden gebruikt om relevante advertenties te tonen en marketingcampagnes te meten.',
    required: false,
    cookies: [
      'Google Ads remarketing',
      'Facebook Pixel'
    ]
  },
  functional: {
    name: 'Functionele cookies',
    description: 'Onthouden uw voorkeuren zoals taal, thema en andere personalisatie-instellingen.',
    required: false,
    cookies: [
      'Taalvoorkeur',
      'Thema instelling (dark mode)',
      'Layout voorkeuren'
    ]
  },
} as const;

/**
 * Get the current cookie consent from localStorage
 */
export function getCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) return null;
    
    const consent = JSON.parse(stored) as CookieConsent;
    
    // Check if consent version matches
    if (consent.version !== COOKIE_CONSENT_VERSION) {
      return null;
    }
    
    return consent;
  } catch (error) {
    console.error('Error reading cookie consent:', error);
    return null;
  }
}

/**
 * Save cookie consent to localStorage
 */
export function saveCookieConsent(consent: Omit<CookieConsent, 'necessary' | 'timestamp' | 'version'>): CookieConsent {
  const fullConsent: CookieConsent = {
    ...consent,
    necessary: true, // Always true
    timestamp: new Date().toISOString(),
    version: COOKIE_CONSENT_VERSION,
  };
  
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(fullConsent));
      
      // Update Google Analytics consent if available
      updateGoogleAnalyticsConsent(fullConsent);
      
      // Dispatch event for listeners
      window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: fullConsent }));
    } catch (error) {
      console.error('Error saving cookie consent:', error);
    }
  }
  
  return fullConsent;
}

/**
 * Check if user has given consent
 */
export function hasConsent(): boolean {
  return getCookieConsent() !== null;
}

/**
 * Accept all cookies
 */
export function acceptAllCookies(): CookieConsent {
  return saveCookieConsent({
    analytics: true,
    marketing: true,
    functional: true,
  });
}

/**
 * Accept only necessary cookies
 */
export function acceptNecessaryOnly(): CookieConsent {
  return saveCookieConsent({
    analytics: false,
    marketing: false,
    functional: false,
  });
}

/**
 * Update Google Analytics consent mode
 */
function updateGoogleAnalyticsConsent(consent: CookieConsent) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('consent', 'update', {
      'analytics_storage': consent.analytics ? 'granted' : 'denied',
      'ad_storage': consent.marketing ? 'granted' : 'denied',
      'functionality_storage': consent.functional ? 'granted' : 'denied',
      'personalization_storage': consent.functional ? 'granted' : 'denied',
    });
  }
}

/**
 * Initialize Google Analytics consent mode (default denied)
 */
export function initializeGoogleAnalyticsConsent() {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    const consent = getCookieConsent();
    
    (window as any).gtag('consent', 'default', {
      'analytics_storage': consent?.analytics ? 'granted' : 'denied',
      'ad_storage': consent?.marketing ? 'granted' : 'denied',
      'functionality_storage': consent?.functional ? 'granted' : 'denied',
      'personalization_storage': consent?.functional ? 'granted' : 'denied',
    });
    
    // If we have consent, update it
    if (consent) {
      updateGoogleAnalyticsConsent(consent);
    }
  }
}

/**
 * Delete cookie consent
 */
export function deleteCookieConsent() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: null }));
  }
}
