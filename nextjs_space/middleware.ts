/**
 * WRITGO.NL MIDDLEWARE - ROUTING & AUTHENTICATION
 * 
 * Duidelijke routing structuur:
 * - /admin/*     = Admin routes (content management, clients, financials, etc.)
 * - /client/*    = Client portal routes (overzicht, content, platforms, account)
 * - /dashboard/* = Legacy routes (wordt geredirect naar /client/*)
 * 
 * Role-based access:
 * - Admin/Superadmin → Toegang tot /admin/* en /client/*
 * - Client → Alleen toegang tot /client/*
 */

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
    // LEGACY REDIRECTS
    // ===================================
    // Old /client-portal → New /client structure
    if (path.startsWith('/client-portal')) {
      // Map old routes to new structure
      if (path === '/client-portal' || path === '/client-portal/dashboard') {
        return NextResponse.redirect(new URL('/client/overzicht', req.url));
      }
      // Redirect all other old portal routes to overview
      return NextResponse.redirect(new URL('/client/overzicht', req.url));
    }

    // Old /dashboard → New /client structure
    if (path.startsWith('/dashboard')) {
      // Map specific dashboard routes to new client routes
      const dashboardToClientMap: Record<string, string> = {
        '/dashboard/overzicht': '/client/overzicht',
        '/dashboard/content': '/client/content',
        '/dashboard/platforms': '/client/platforms',
        '/dashboard/account': '/client/account',
      };

      const newPath = dashboardToClientMap[path];
      if (newPath) {
        return NextResponse.redirect(new URL(newPath, req.url));
      }

      // Default: redirect to client overview
      return NextResponse.redirect(new URL('/client/overzicht', req.url));
    }

    // ===================================
    // ROLE-BASED ACCESS CONTROL
    // ===================================
    const isAdmin = token?.role === 'admin' || token?.role === 'superadmin';

    // ADMIN ROUTES - Only for admin/superadmin
    if (path.startsWith('/admin') || path.startsWith('/superadmin') || path.startsWith('/admin-portal')) {
      if (!isAdmin) {
        // Non-admin users trying to access admin routes → redirect to client portal
        return NextResponse.redirect(new URL('/client/overzicht', req.url));
      }
    }

    // CLIENT ROUTES - Accessible to everyone (clients and admins)
    // No additional checks needed - if authenticated, they can access /client/*

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
    // Admin routes
    '/admin/:path*',
    '/admin-portal/:path*',
    '/superadmin/:path*',
    
    // Client routes (new structure)
    '/client/:path*',
    
    // Legacy routes (will be redirected)
    '/client-portal/:path*',
    '/dashboard/:path*',
  ],
};
