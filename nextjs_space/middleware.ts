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

    // ===================================
    // CONTENT PLANNING REDIRECTS
    // ===================================
    // Redirect old content planning pages to new unified planning page
    if (
      path === '/client-portal/content-kalender' ||
      path === '/client-portal/content-research' ||
      path === '/client-portal/content-planner' ||
      path === '/client-portal/keyword-research'
    ) {
      console.log(`🔄 Redirecting ${path} → /client-portal/planning`);
      return NextResponse.redirect(new URL('/client-portal/planning', req.url));
    }

    // Allow the new unified planning page
    if (path.startsWith('/client-portal/planning')) {
      return NextResponse.next();
    }

    // ===================================
    // LEGACY REDIRECTS
    // ===================================
    // Alle oude routes → dashboard
    if (
      path.startsWith('/admin') || 
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
    // Nieuwe simpele routes (protected)
    '/',
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
    '/dashboard/:path*',
  ],
};
