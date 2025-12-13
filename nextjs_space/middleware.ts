
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { featureGateMiddleware } from '@/middleware/feature-gate';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // ===================================
    // FEATURE GATE CHECK (FIRST)
    // ===================================
    // Block access to disabled features before auth check
    const featureGateResponse = featureGateMiddleware(req);
    if (featureGateResponse.status === 307 || featureGateResponse.status === 308) {
      // Feature is disabled, redirect
      return featureGateResponse;
    }

    // ===================================
    // OLD PORTAL REDIRECT
    // ===================================
    // Redirect old client portal to new dashboard
    if (path.startsWith('/client-portal')) {
      return NextResponse.redirect(new URL('/dashboard/overzicht', req.url));
    }

    // ===================================
    // LEGACY ROUTE REDIRECTS
    // ===================================
    // Redirect old writer routes to Ultimate Writer (deprecated)
    if (path === '/client-portal/blog-writer' || 
        path === '/client-portal/ai-writer' || 
        path === '/client-portal/content-writer') {
      return NextResponse.redirect(new URL('/dashboard/overzicht', req.url));
    }

    // ===================================
    // ADMIN AUTH CHECK
    // ===================================
    // Admin-only routes
    if (path.startsWith('/admin') || path.startsWith('/superadmin') || path.startsWith('/admin-portal')) {
      if (token?.role !== 'admin' && token?.role !== 'superadmin') {
        return NextResponse.redirect(new URL('/dashboard/overzicht', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/client-login',
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/admin-portal/:path*',
    '/superadmin/:path*',
    '/client-portal/:path*',
    '/dashboard/:path*',
    '/client/:path*',
  ],
};
