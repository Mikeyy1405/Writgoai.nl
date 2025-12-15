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

export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname;

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
    
    // Legacy routes (redirect naar /)
    '/admin/:path*',
    '/admin-portal/:path*',
    '/superadmin/:path*',
    '/client/:path*',
    '/client-portal/:path*',
    '/dashboard/:path*',
  ],
};
