/**
 * AI Utilities
 * 
 * Centralized AI utility functions for the application
 * Re-exports commonly used AI functions
 */

// Re-export chatCompletion from aiml-advanced (preferred) or aiml-api (fallback)
export { chatCompletion } from './aiml-advanced';

// Re-export other commonly used AI functions
export { generateText, generateStructuredOutput } from './aiml-advanced';
