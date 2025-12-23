/**
 * WordPress Error Handling Utilities
 * 
 * This module provides error classification, detailed error messages,
 * and troubleshooting guidance for WordPress API integration.
 */

export enum WordPressErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  API = 'API',
  TIMEOUT = 'TIMEOUT',
  CONFIG = 'CONFIG',
  NOT_FOUND = 'NOT_FOUND',
  UNKNOWN = 'UNKNOWN',
}

export interface WordPressErrorDetails {
  type: WordPressErrorType;
  message: string;
  technicalDetails?: string;
  wpUrl?: string;
  troubleshooting: string[];
  timestamp: string;
}

export interface ConnectionTestResult {
  success: boolean;
  checks: {
    siteReachable: { passed: boolean; message: string; details?: string };
    restApiEnabled: { passed: boolean; message: string; details?: string };
    wpV2ApiEnabled?: { passed: boolean; message: string; details?: string };
    postsEndpointAccessible?: { passed: boolean; message: string; details?: string };
    authenticationValid: { passed: boolean; message: string; details?: string };
  };
  wpUrl: string;
  testedEndpoints?: string[];
  timestamp: string;
}

/**
 * Classify error type based on error object and response
 */
export function classifyWordPressError(
  error: any,
  response?: Response,
  wpUrl?: string
): WordPressErrorDetails {
  const timestamp = new Date().toISOString();
  
  // Timeout errors
  if (error.name === 'AbortError' || error.name === 'TimeoutError' || error.message?.includes('aborted')) {
    return {
      type: WordPressErrorType.TIMEOUT,
      message: `WordPress server reageert te traag of is niet bereikbaar`,
      technicalDetails: `Connection timeout - server did not respond in time (${error.message})`,
      wpUrl: wpUrl ? sanitizeUrl(wpUrl) : undefined,
      troubleshooting: [
        'De WordPress server reageert niet binnen de timeout periode',
        'Controleer of je WordPress website online is en normaal werkt',
        'Test de website in je browser - laadt deze snel?',
        'Mogelijk is de server overbelast of heeft een trage internetverbinding',
        'Controleer of er geen firewall de verbinding blokkeert',
        'Probeer het over een paar minuten opnieuw',
        'Als het probleem aanhoudt, neem contact op met je hosting provider',
      ],
      timestamp,
    };
  }

  // Network errors (fetch failed, DNS, connection refused)
  if (
    error.message?.includes('fetch failed') ||
    error.message?.includes('ENOTFOUND') ||
    error.message?.includes('ECONNREFUSED') ||
    error.message?.includes('network')
  ) {
    return {
      type: WordPressErrorType.NETWORK,
      message: `Kan WordPress website niet bereiken op ${wpUrl ? sanitizeUrl(wpUrl) : 'het opgegeven adres'}`,
      technicalDetails: error.message,
      wpUrl: wpUrl ? sanitizeUrl(wpUrl) : undefined,
      troubleshooting: [
        'Controleer of de WordPress URL correct is (inclusief https:// of http://)',
        'Controleer of je WordPress website online en bereikbaar is',
        'Test de URL in je browser',
        'Als je Render.com gebruikt: Controleer of je WordPress site een geldig SSL certificaat heeft',
        'Render.com heeft een 30 seconden timeout - zorg dat je WordPress server snel reageert',
        'Controleer je internetverbinding',
        'Mogelijk blokkeert een firewall de verbinding',
        'Probeer het over een paar minuten opnieuw als de server traag reageert',
      ],
      timestamp,
    };
  }

  // Authentication errors (401)
  if (response?.status === 401 || error.message?.includes('401')) {
    return {
      type: WordPressErrorType.AUTH,
      message: 'WordPress authenticatie mislukt - controleer je app password',
      technicalDetails: 'HTTP 401 Unauthorized',
      wpUrl: wpUrl ? sanitizeUrl(wpUrl) : undefined,
      troubleshooting: [
        'Controleer of je WordPress gebruikersnaam correct is',
        'Controleer of je WordPress app password correct is (niet je normale wachtwoord!)',
        'Zorg dat er geen spaties in je app password zitten',
        'Maak een nieuw app password aan in WordPress (Gebruikers → Profiel)',
        'Controleer of je gebruiker Administrator rechten heeft',
      ],
      timestamp,
    };
  }

  // 403 Forbidden
  if (response?.status === 403) {
    return {
      type: WordPressErrorType.AUTH,
      message: 'Toegang geweigerd - onvoldoende rechten',
      technicalDetails: 'HTTP 403 Forbidden',
      wpUrl: wpUrl ? sanitizeUrl(wpUrl) : undefined,
      troubleshooting: [
        'Controleer of je gebruiker Administrator rechten heeft in WordPress',
        'Sommige beveiligingsplugins blokkeren REST API toegang',
        'Controleer je WordPress beveiligingsinstellingen',
        'Voeg je IP-adres toe aan de whitelist als je een beveiligingsplugin gebruikt',
      ],
      timestamp,
    };
  }

  // 404 Not Found - REST API or endpoint not found
  if (response?.status === 404 || error.message?.includes('404')) {
    return {
      type: WordPressErrorType.NOT_FOUND,
      message: 'WordPress REST API niet gevonden',
      technicalDetails: 'HTTP 404 Not Found - REST API endpoint niet bereikbaar',
      wpUrl: wpUrl ? sanitizeUrl(wpUrl) : undefined,
      troubleshooting: [
        'Controleer of de WordPress REST API is ingeschakeld',
        'Sommige beveiligingsplugins schakelen de REST API uit',
        'Test of /wp-json/ bereikbaar is: bezoek [je-site]/wp-json/ in je browser',
        'Controleer je WordPress permalink instellingen',
        'Mogelijk blokkeert een beveiligingsplugin de REST API',
      ],
      timestamp,
    };
  }

  // Configuration errors
  if (error.message?.includes('configuratie') || error.message?.includes('credentials')) {
    return {
      type: WordPressErrorType.CONFIG,
      message: 'WordPress configuratie onvolledig',
      technicalDetails: error.message,
      troubleshooting: [
        'Ga naar Project Instellingen',
        'Vul je WordPress URL in (bijv. https://mijnsite.nl)',
        'Vul je WordPress gebruikersnaam in',
        'Maak een app password aan in WordPress en vul deze in',
        'Sla de instellingen op',
      ],
      timestamp,
    };
  }

  // Generic API errors
  if (response && !response.ok) {
    return {
      type: WordPressErrorType.API,
      message: `WordPress API fout (${response.status} ${response.statusText})`,
      technicalDetails: `HTTP ${response.status}: ${response.statusText}`,
      wpUrl: wpUrl ? sanitizeUrl(wpUrl) : undefined,
      troubleshooting: [
        'Controleer de WordPress server logs voor meer details',
        'Probeer het later opnieuw',
        'Mogelijk is er een tijdelijk probleem met de WordPress site',
        'Controleer of alle WordPress plugins up-to-date zijn',
      ],
      timestamp,
    };
  }

  // Unknown errors
  return {
    type: WordPressErrorType.UNKNOWN,
    message: error.message || 'Er is een onbekende fout opgetreden',
    technicalDetails: error.stack || error.toString(),
    wpUrl: wpUrl ? sanitizeUrl(wpUrl) : undefined,
    troubleshooting: [
      'Probeer het opnieuw',
      'Controleer de browser console voor meer details',
      'Neem contact op met support als het probleem aanhoudt',
    ],
    timestamp,
  };
}

/**
 * Sanitize URL for display (remove credentials if present)
 */
export function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove any credentials that might be in the URL
    urlObj.username = '';
    urlObj.password = '';
    return urlObj.toString();
  } catch {
    // If URL parsing fails, return a safe placeholder instead of the original
    return '[Invalid URL]';
  }
}

/**
 * Format error details for logging
 */
export function formatErrorForLogging(details: WordPressErrorDetails): string {
  return JSON.stringify({
    type: details.type,
    message: details.message,
    technicalDetails: details.technicalDetails,
    wpUrl: details.wpUrl,
    timestamp: details.timestamp,
  }, null, 2);
}

/**
 * Get user-friendly error message with troubleshooting steps
 */
export function getErrorMessage(details: WordPressErrorDetails): string {
  let message = details.message;
  
  if (details.wpUrl) {
    message += `\n\nWordPress URL: ${details.wpUrl}`;
  }
  
  if (details.troubleshooting.length > 0) {
    message += '\n\nProbeer het volgende:\n';
    message += details.troubleshooting.map((tip, i) => `${i + 1}. ${tip}`).join('\n');
  }
  
  return message;
}
