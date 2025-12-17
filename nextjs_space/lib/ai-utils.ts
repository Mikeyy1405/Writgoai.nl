/**
 * AI Utilities
 * 
 * Centralized AI utility functions for the application
 * Re-exports commonly used AI functions
 */

// Re-export chatCompletion from aiml-api (has correct signature with messages array + options)
export { chatCompletion } from './aiml-api';

// Re-export other commonly used AI functions
export { generateText, generateStructuredOutput } from './aiml-advanced';
