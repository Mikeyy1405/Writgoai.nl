import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Protected route patterns - routes that require authentication
const PROTECTED_PATTERNS = [
  '/admin',
  '/superadmin',
  '/client-portal',
  '/dashboard',
]

// Check if a path matches any protected pattern
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PATTERNS.some(pattern => pathname.startsWith(pattern))
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user and trying to access protected routes, redirect to login
  if (!user && isProtectedRoute(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/client-login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
