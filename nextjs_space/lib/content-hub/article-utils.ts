/**
 * Shared utility functions for Content Hub articles
 */

// Article statuses where operations are in progress
export const IN_PROGRESS_STATUSES = ['researching', 'writing', 'publishing'] as const;

// Article statuses that count as completed
export const COMPLETED_STATUSES = ['published'] as const;

/**
 * Filters and validates keywords array
 * Removes empty strings and trims whitespace
 * @param keywords - Array of keywords to filter
 * @returns Filtered array of valid keywords
 */
export function getValidKeywords(keywords: string[]): string[] {
  return keywords
    .filter((k: string) => k && k.trim().length > 0)
    .map((k: string) => k.trim());
}

/**
 * Validates article title
 * @param title - Title to validate
 * @returns Error message if invalid, null if valid
 */
export function validateArticleTitle(title: string): string | null {
  if (!title || typeof title !== 'string') {
    return 'Valid title is required';
  }
  
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return 'Title cannot be empty';
  }
  
  if (trimmed.length > 200) {
    return 'Title must be 200 characters or less';
  }
  
  return null;
}

/**
 * Validates keywords array
 * @param keywords - Keywords to validate
 * @returns Error message if invalid, null if valid
 */
export function validateKeywords(keywords: unknown): string | null {
  if (!keywords || !Array.isArray(keywords)) {
    return 'At least one keyword is required';
  }
  
  const validKeywords = getValidKeywords(keywords);
  if (validKeywords.length === 0) {
    return 'At least one keyword is required';
  }
  
  return null;
}
