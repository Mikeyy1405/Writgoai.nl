/**
 * API Timeout Utilities
 * Centralized timeout handling for API calls to prevent hanging requests and memory leaks
 */

// Timeout constants (in milliseconds)
export const API_TIMEOUTS = {
  ADMIN_STATS: 10000,        // 10 seconds for admin stats API
  MONEYBIRD_API: 15000,      // 15 seconds for Moneybird external API
  AUTH_CHECK: 10000,         // 10 seconds for authentication checks
  SESSION_CHECK: 5000,       // 5 seconds for session validation
} as const;

/**
 * Wraps a promise with a timeout
 * Automatically cleans up the timeout to prevent memory leaks
 * 
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout duration in milliseconds
 * @param timeoutMessage - Custom error message for timeout
 * @returns Promise that rejects if timeout is exceeded
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Request timeout'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
