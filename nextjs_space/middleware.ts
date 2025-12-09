
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Redirect old writer routes to Ultimate Writer
    if (path === '/client-portal/blog-writer' || 
        path === '/client-portal/ai-writer' || 
        path === '/client-portal/content-writer') {
      return NextResponse.redirect(new URL('/client-portal/ultimate-writer', req.url));
    }

    // Admin-only routes
    if (path.startsWith('/admin') || path.startsWith('/superadmin')) {
      if (token?.role !== 'admin' && token?.role !== 'superadmin') {
        return NextResponse.redirect(new URL('/client-portal', req.url));
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
    '/superadmin/:path*',
    '/client-portal/blog-writer',
    '/client-portal/ai-writer',
    '/client-portal/content-writer',
  ],
};
