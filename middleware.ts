
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin-only routes - alleen voor info@writgo.nl
    if (path.startsWith('/admin') || path.startsWith('/superadmin')) {
      if (token?.email !== 'info@writgo.nl' && token?.role !== 'admin' && token?.role !== 'superadmin') {
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
  ],
};
