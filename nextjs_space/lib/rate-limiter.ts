
/**
 * 🛡️ Rate Limiting - Bescherming tegen API abuse
 * 
 * Gebruikt in-memory rate limiting (Redis niet nodig voor kleine schaal)
 * Voor productie met veel users: upgrade naar Redis
 */

import { RateLimiterMemory } from 'rate-limiter-flexible';
import { NextRequest, NextResponse } from 'next/server';

// Verschillende rate limiters per endpoint type
export const rateLimiters = {
  // Login - Strikte limiet tegen brute force
  login: new RateLimiterMemory({
    points: 5, // 5 pogingen
    duration: 15 * 60, // per 15 minuten
    blockDuration: 15 * 60, // block voor 15 min na overschrijding
  }),

  // Registratie - Voorkom spam accounts
  signup: new RateLimiterMemory({
    points: 3, // 3 pogingen
    duration: 60 * 60, // per uur
    blockDuration: 60 * 60, // block voor 1 uur
  }),

  // Chat API - Voorkom abuse van AI
  chat: new RateLimiterMemory({
    points: 100, // 100 berichten
    duration: 15 * 60, // per 15 minuten
    blockDuration: 5 * 60, // block voor 5 min
  }),

  // Video generatie - Duur en kostbaar
  video: new RateLimiterMemory({
    points: 10, // 10 videos
    duration: 60 * 60, // per uur
    blockDuration: 60 * 60, // block voor 1 uur
  }),

  // Blog generatie
  blog: new RateLimiterMemory({
    points: 20, // 20 blogs
    duration: 60 * 60, // per uur
    blockDuration: 30 * 60, // block voor 30 min
  }),

  // Content automation (dagelijkse generatie)
  automation: new RateLimiterMemory({
    points: 50, // 50 calls
    duration: 60 * 60, // per uur
    blockDuration: 60 * 60,
  }),

  // Password reset - Prevent abuse
  forgotPassword: new RateLimiterMemory({
    points: 3, // 3 attempts
    duration: 60 * 60, // per hour
    blockDuration: 60 * 60, // block for 1 hour
  }),

  // Algemene API calls
  api: new RateLimiterMemory({
    points: 200, // 200 requests
    duration: 15 * 60, // per 15 minuten
    blockDuration: 5 * 60,
  }),
};

export type RateLimitType = keyof typeof rateLimiters;

/**
 * Rate limit een request op basis van IP + user ID
 */
export async function checkRateLimit(
  request: NextRequest,
  type: RateLimitType,
  userId?: string
): Promise<{ allowed: boolean; error?: string; retryAfter?: number }> {
  try {
    // Gebruik IP + userId als key (of alleen IP als geen user)
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const key = userId ? `${type}:${userId}` : `${type}:${ip}`;

    const limiter = rateLimiters[type];
    await limiter.consume(key, 1);

    return { allowed: true };
  } catch (error: any) {
    // Rate limit exceeded
    const retryAfter = error?.msBeforeNext 
      ? Math.ceil(error.msBeforeNext / 1000) 
      : 900; // default 15 min

    return {
      allowed: false,
      error: `Te veel verzoeken. Probeer het over ${retryAfter} seconden opnieuw.`,
      retryAfter,
    };
  }
}

/**
 * Middleware helper voor rate limiting in API routes
 */
export async function withRateLimit(
  request: NextRequest,
  type: RateLimitType,
  userId?: string
): Promise<NextResponse | null> {
  const result = await checkRateLimit(request, type, userId);

  if (!result.allowed) {
    return NextResponse.json(
      { error: result.error },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.retryAfter || 900),
          'X-RateLimit-Limit': String(rateLimiters[type].points),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  return null; // Toegestaan
}
