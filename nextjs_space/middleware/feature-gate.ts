/**
 * FEATURE GATE MIDDLEWARE - SIMPLIFIED
 * 
 * Alle features zijn nu enabled! Dit middleware doet niets meer.
 * Het blijft bestaan voor backwards compatibility.
 * 
 * TODO: Consider removing this middleware entirely in a future refactor
 * if no feature gating is needed.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Feature gate middleware voor route protection
 * 
 * Gebruik in je Next.js middleware.ts bestand:
 * ```typescript
 * import { featureGateMiddleware } from '@/middleware/feature-gate';
 * 
 * export function middleware(request: NextRequest) {
 *   return featureGateMiddleware(request);
 * }
 * ```
 */
export function featureGateMiddleware(request: NextRequest) {
  // Alle features zijn enabled - allow all access
  return NextResponse.next();
}

/**
 * Helper to check if a specific feature is accessible
 * 
 * Alle features zijn nu altijd accessible
 */
export function isFeatureAccessible(_featurePath: string): boolean {
  // Alle features zijn accessible
  return true;
}
