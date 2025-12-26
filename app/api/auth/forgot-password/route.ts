import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is verplicht' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const cookieStore = cookies();
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Get the site URL for the reset redirect
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
    });

    if (error) {
      console.error('Password reset error:', error);
      // For security, we don't reveal if the email exists or not
      // We always return success to prevent email enumeration
      return NextResponse.json(
        { success: true, message: 'Als dit email adres bestaat, hebben we een reset link gestuurd.' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Reset link verzonden naar je email adres.' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Forgot password API error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
