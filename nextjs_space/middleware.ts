/**
 * WRITGO.NL SIMPLIFIED MIDDLEWARE
 * 
 * SUPER SIMPEL - Geen admin/client scheiding meer!
 * Iedereen heeft dezelfde interface met 6 functies:
 * - / (Dashboard)
 * - /projects (Projecten)
 * - /content-plan (Content Planning)
 * - /generate (Content Genereren)
 * - /publish (Publiceren)
 * - /stats (Statistieken)
 */

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Bot user agents to detect/block (pre-converted to lowercase for performance)
const BOT_USER_AGENTS = [
  'chatgpt-user',
  'gptbot',
  'anthropic-ai',
  'claude-web',
  'google-extended',
  'ccbot',
  'bytespider',
];

function isAIBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const lowerUserAgent = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => lowerUserAgent.includes(bot));
}

export default withAuth(
  function middleware(req) {
    const userAgent = req.headers.get('user-agent');

    // Block AI bots early - return 403 Forbidden
    if (isAIBot(userAgent)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const path = req.nextUrl.pathname;
    
    // Allow public homepage (root path)
    if (path === '/') {
      return NextResponse.next();
    }
    
    const token = req.nextauth.token;

    // ===================================
    // ADMIN ACCESS CONTROL
    // ===================================
    // Check if user is admin (info@writgo.nl)
    const isAdmin = token?.email === 'info@writgo.nl';

    // Non-admin trying to access /admin → redirect to root
    if (!isAdmin && path.startsWith('/admin')) {
      console.log('⛔ Non-admin trying to access /admin, redirecting to /');
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Admin users are allowed to access /admin routes (legacy admin tools)
    if (isAdmin && path.startsWith('/admin')) {
      return NextResponse.next();
    }

    // Admin users can now see the unified dashboard on / (no redirect)

    // ===================================
    // ALLOWED CLIENT PORTAL ROUTES
    // ===================================
    // Allow specific client-portal routes (don't redirect these)
    const allowedClientPortalRoutes = [
      '/client-portal/planning',
      '/client-portal/content-planner',
      '/client-portal/content-kalender',
      '/client-portal/content-research',
      '/client-portal/keyword-research',
      '/client-portal/content-library',
      '/client-portal/content-hub',
      '/client-portal/topical-content-planner',
      '/client-portal/topical-mapping',
      '/client-portal/schrijven',
      '/client-portal/ultimate-writer',
      '/client-portal/social-media-suite',
      '/client-portal/site-manager',
      '/client-portal/projects',
    ];

    // Check if current path matches any allowed route (including sub-paths)
    const isAllowedClientPortalRoute = allowedClientPortalRoutes.some(route => 
      path === route || path.startsWith(route + '/')
    );

    if (isAllowedClientPortalRoute) {
      return NextResponse.next();
    }

    // ===================================
    // LEGACY REDIRECTS
    // ===================================
    // Redirect other legacy routes → dashboard
    if (
      path.startsWith('/client') || 
      path.startsWith('/client-portal') || 
      path.startsWith('/dashboard') ||
      path.startsWith('/admin-portal') ||
      path.startsWith('/superadmin')
    ) {
      console.log(`🔄 Redirecting legacy route ${path} → /`);
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/inloggen',
    },
  }
);

export const config = {
  matcher: [
    // Nieuwe simpele routes (protected) - EXCLUDE root '/' for public homepage
    '/dashboard/:path*',
    '/projects/:path*',
    '/content-plan/:path*',
    '/generate/:path*',
    '/publish/:path*',
    '/stats/:path*',
    
    // New unified planning page (protected)
    '/client-portal/planning/:path*',
    
    // Legacy routes (redirect naar /)
    '/admin/:path*',
    '/admin-portal/:path*',
    '/superadmin/:path*',
    '/client/:path*',
    '/client-portal/:path*',
  ],
};
