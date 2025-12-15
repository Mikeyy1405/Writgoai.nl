/**
 * Supabase Error Helper Functions
 * 
 * Helper functions for handling common Supabase errors
 */

/**
 * Type representing a Supabase/PostgREST error
 */
export interface SupabaseError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

/**
 * Check if a Supabase error is due to a missing table
 * @param error The error from Supabase query
 * @returns true if the error indicates a missing table
 */
export function isMissingTableError(error: SupabaseError | null | undefined): boolean {
  if (!error) return false;
  
  // PGRST205 is the Supabase error code for "table not found"
  if (error.code === 'PGRST205') return true;
  
  // Also check the error message as a fallback
  if (error.message && typeof error.message === 'string') {
    return error.message.includes('Could not find the table');
  }
  
  return false;
}

/**
 * Check if a Supabase error is due to no rows found (PGRST116)
 * @param error The error from Supabase query
 * @returns true if the error indicates no rows were found
 */
export function isNoRowsError(error: SupabaseError | null | undefined): boolean {
  if (!error) return false;
  return error.code === 'PGRST116';
}
