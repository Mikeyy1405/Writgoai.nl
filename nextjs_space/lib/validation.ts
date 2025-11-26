
/**
 * 🛡️ Input Validation Schemas
 * 
 * Centralized Zod schemas voor alle user inputs
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════
// AUTH SCHEMAS
// ═══════════════════════════════════════════════════════

export const loginSchema = z.object({
  email: z.string().email('Ongeldig email adres').min(3).max(100),
  password: z.string().min(6, 'Wachtwoord moet minimaal 6 karakters zijn').max(100),
});

export const signupSchema = z.object({
  name: z.string().min(2, 'Naam moet minimaal 2 karakters zijn').max(100),
  email: z.string().email('Ongeldig email adres').max(100),
  password: z.string().min(8, 'Wachtwoord moet minimaal 8 karakters zijn').max(100),
  companyName: z.string().max(200).optional(),
  website: z.string().url('Ongeldige URL').or(z.literal('')).optional(),
});

// ═══════════════════════════════════════════════════════
// CHAT/AI SCHEMAS
// ═══════════════════════════════════════════════════════

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Bericht mag niet leeg zijn').max(50000),
  conversationId: z.string().cuid().optional(),
  model: z.string().max(100).optional(),
});

export const conversationIdSchema = z.object({
  conversationId: z.string().cuid(),
});

// ═══════════════════════════════════════════════════════
// CONTENT GENERATION SCHEMAS
// ═══════════════════════════════════════════════════════

export const blogGenerationSchema = z.object({
  topic: z.string().min(3).max(500),
  keywords: z.array(z.string().max(100)).max(20).optional(),
  wordCount: z.number().min(300).max(5000).optional(),
  tone: z.enum(['professional', 'casual', 'friendly', 'formal']).optional(),
  includeImages: z.boolean().optional(),
});

export const videoGenerationSchema = z.object({
  topic: z.string().min(3).max(500),
  script: z.string().max(10000).optional(),
  duration: z.enum(['15-30', '30-60', '60-90']).optional(),
  style: z.string().max(100).optional(),
  voiceId: z.string().max(100).optional(),
});

export const socialPostSchema = z.object({
  content: z.string().min(1).max(5000),
  platforms: z.array(z.enum(['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok'])).min(1),
  scheduledAt: z.string().datetime().optional(),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
});

// ═══════════════════════════════════════════════════════
// AUTOMATION SCHEMAS
// ═══════════════════════════════════════════════════════

export const automationSettingsSchema = z.object({
  active: z.boolean(),
  targetAudience: z.string().max(500).optional(),
  brandVoice: z.string().max(1000).optional(),
  keywords: z.array(z.string().max(100)).max(50).optional(),
});

// ═══════════════════════════════════════════════════════
// WORDPRESS SCHEMAS
// ═══════════════════════════════════════════════════════

export const wordpressConfigSchema = z.object({
  url: z.string().url('Ongeldige WordPress URL'),
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(500), // Application password kan lang zijn
});

// ═══════════════════════════════════════════════════════
// PROFILE/SETTINGS SCHEMAS
// ═══════════════════════════════════════════════════════

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  companyName: z.string().max(200).optional(),
  website: z.string().url().or(z.literal('')).optional(),
  targetAudience: z.string().max(500).optional(),
  brandVoice: z.string().max(1000).optional(),
});

export const aiSettingsSchema = z.object({
  nickname: z.string().max(100).optional(),
  customInstructions: z.string().max(5000).optional(),
  preferredModel: z.string().max(100).optional(),
  temperature: z.number().min(0).max(1).optional(),
  enableWebSearch: z.boolean().optional(),
  enableImageGen: z.boolean().optional(),
  enableVideoGen: z.boolean().optional(),
  toneOfVoice: z.string().max(100).optional(),
  writingStyle: z.string().max(100).optional(),
});

// ═══════════════════════════════════════════════════════
// PAYMENT SCHEMAS
// ═══════════════════════════════════════════════════════

export const creditPurchaseSchema = z.object({
  packageId: z.string().cuid(),
});

export const subscriptionCreateSchema = z.object({
  planName: z.enum(['starter', 'pro', 'business']),
});

// ═══════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════

/**
 * Valideer input en return error response als invalid
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: any): {
  success: boolean;
  data?: T;
  error?: string;
} {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError.message,
      };
    }
    return {
      success: false,
      error: 'Ongeldige input',
    };
  }
}

/**
 * Sanitize user input (extra layer of security)
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > (basic XSS prevention)
    .substring(0, 50000); // Max length
}
