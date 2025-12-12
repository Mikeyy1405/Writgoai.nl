/**
 * FEATURE GATE MIDDLEWARE
 * 
 * Dit middleware blokkeert toegang tot uitgeschakelde features.
 * Routes worden automatisch geredirect naar het dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

interface FeatureRoute {
  path: string;
  flag: boolean;
  redirectTo: string;
}

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
  const path = request.nextUrl.pathname;
  
  // Define blocked features with their respective flags
  const blockedFeatures: FeatureRoute[] = [
    // ADMIN ROUTES
    {
      path: '/admin/projects',
      flag: FEATURE_FLAGS.ADMIN_PROJECTS,
      redirectTo: '/admin/dashboard',
    },
    {
      path: '/admin/seo',
      flag: FEATURE_FLAGS.ADMIN_SEO_TOOLS,
      redirectTo: '/admin/dashboard',
    },
    {
      path: '/admin/linkbuilding',
      flag: FEATURE_FLAGS.ADMIN_SEO_TOOLS,
      redirectTo: '/admin/dashboard',
    },
    {
      path: '/admin/writgo-marketing',
      flag: FEATURE_FLAGS.ADMIN_WRITGO_MARKETING,
      redirectTo: '/admin/dashboard',
    },
    {
      path: '/admin/writgo',
      flag: FEATURE_FLAGS.ADMIN_WRITGO_MARKETING,
      redirectTo: '/admin/dashboard',
    },
    {
      path: '/admin/distribution/analytics',
      flag: FEATURE_FLAGS.ADMIN_CONTENT_ANALYTICS,
      redirectTo: '/admin/statistieken',
    },
    {
      path: '/admin/affiliate',
      flag: FEATURE_FLAGS.ADMIN_AFFILIATE,
      redirectTo: '/admin/dashboard',
    },
    {
      path: '/admin/agency',
      flag: FEATURE_FLAGS.ADMIN_AGENCY,
      redirectTo: '/admin/dashboard',
    },
    {
      path: '/admin/assignments',
      flag: FEATURE_FLAGS.ADMIN_AGENCY,
      redirectTo: '/admin/dashboard',
    },
    {
      path: '/admin/orders',
      flag: FEATURE_FLAGS.ADMIN_AGENCY,
      redirectTo: '/admin/dashboard',
    },
    {
      path: '/admin/managed-projects',
      flag: FEATURE_FLAGS.ADMIN_MANAGED_PROJECTS,
      redirectTo: '/admin/klanten',
    },
    {
      path: '/admin/autopilot-control',
      flag: FEATURE_FLAGS.ADMIN_AUTOPILOT_CONTROL,
      redirectTo: '/admin/dashboard',
    },
    
    // CLIENT ROUTES
    {
      path: '/client-portal',
      flag: FEATURE_FLAGS.CLIENT_OLD_PORTAL,
      redirectTo: '/dashboard/overzicht',
    },
    {
      path: '/client/ultimate-writer',
      flag: FEATURE_FLAGS.CLIENT_ULTIMATE_WRITER,
      redirectTo: '/dashboard/overzicht',
    },
    {
      path: '/client/content-hub',
      flag: FEATURE_FLAGS.CLIENT_CONTENT_HUB,
      redirectTo: '/dashboard/content',
    },
    {
      path: '/client/email-suite',
      flag: FEATURE_FLAGS.CLIENT_EMAIL_SUITE,
      redirectTo: '/dashboard/overzicht',
    },
    {
      path: '/client/video-suite',
      flag: FEATURE_FLAGS.CLIENT_VIDEO_SUITE,
      redirectTo: '/dashboard/overzicht',
    },
    {
      path: '/client/seo-tools',
      flag: FEATURE_FLAGS.CLIENT_SEO_TOOLS,
      redirectTo: '/dashboard/overzicht',
    },
    {
      path: '/client/woocommerce',
      flag: FEATURE_FLAGS.CLIENT_WOOCOMMERCE,
      redirectTo: '/dashboard/overzicht',
    },
    {
      path: '/client/linkbuilding',
      flag: FEATURE_FLAGS.CLIENT_LINKBUILDING,
      redirectTo: '/dashboard/overzicht',
    },
  ];
  
  // Check if current path matches any blocked feature
  for (const { path: featurePath, flag, redirectTo } of blockedFeatures) {
    if (path.startsWith(featurePath) && !flag) {
      // Feature is disabled - redirect
      console.log(`[Feature Gate] Blocking access to ${path} (feature disabled)`);
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }
  
  // Feature is enabled or not protected - allow access
  return NextResponse.next();
}

/**
 * Helper to check if a specific feature is accessible
 */
export function isFeatureAccessible(featurePath: string): boolean {
  const blockedFeatures: FeatureRoute[] = [
    { path: '/admin/projects', flag: FEATURE_FLAGS.ADMIN_PROJECTS, redirectTo: '' },
    { path: '/admin/seo', flag: FEATURE_FLAGS.ADMIN_SEO_TOOLS, redirectTo: '' },
    { path: '/client-portal', flag: FEATURE_FLAGS.CLIENT_OLD_PORTAL, redirectTo: '' },
    // Add more as needed
  ];
  
  for (const { path, flag } of blockedFeatures) {
    if (featurePath.startsWith(path)) {
      return flag;
    }
  }
  
  // Default to accessible if not in blocked list
  return true;
}
