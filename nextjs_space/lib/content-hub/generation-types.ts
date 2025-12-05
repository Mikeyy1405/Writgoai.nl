/**
 * Shared types for article generation
 */

export interface GenerationPhase {
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  message?: string;
  duration?: number;
  metrics?: {
    wordCount?: number;
    lsiKeywords?: number;
    paaQuestions?: number;
    images?: number;
  };
}
