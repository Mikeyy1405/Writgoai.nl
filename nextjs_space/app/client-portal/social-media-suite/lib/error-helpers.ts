/**
 * Helper functions for error handling in Social Media Suite
 */

/**
 * Checks if an error is a network error
 */
export function isNetworkError(error: any): boolean {
  return error.name === 'TypeError' && 
         (error.message.includes('fetch') || error.message.includes('network'));
}

/**
 * Gets a user-friendly error message based on the error type
 */
export function getUserFriendlyErrorMessage(error: any, defaultMessage: string = 'Er is een fout opgetreden'): string {
  if (isNetworkError(error)) {
    return 'Netwerkfout. Controleer je internetverbinding.';
  }
  return error.message || defaultMessage;
}

/**
 * Generates a helpful tip based on the error message
 */
export function getErrorTip(errorMessage: string): string {
  if (errorMessage.includes('credits')) {
    return '\n\nTip: Koop extra credits of upgrade je abonnement.';
  } else if (errorMessage.includes('ingelogd')) {
    return '\n\nTip: Log opnieuw in.';
  } else {
    return '\n\nTip: Probeer het onderwerp anders te formuleren of probeer het later opnieuw.';
  }
}

/**
 * Handles API response errors and returns a formatted error message
 */
export async function handleApiError(response: Response): Promise<never> {
  const error = await response.json().catch(() => ({ error: 'Onbekende serverfout' }));
  
  // Provide specific error messages based on status code
  if (response.status === 401) {
    throw new Error('Je bent niet ingelogd');
  } else if (response.status === 402) {
    throw new Error('Onvoldoende credits');
  } else if (response.status === 404) {
    throw new Error('Project niet gevonden. Selecteer een ander project.');
  } else {
    throw new Error(error.error || 'Fout bij genereren');
  }
}

/**
 * Safely copies text to clipboard with error handling
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        throw err;
      }
    }
    
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
