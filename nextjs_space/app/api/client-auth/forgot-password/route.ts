import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { rateLimiters } from '@/lib/rate-limiter';
import { log, logError } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Ongeldig email adres' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting per email address
    try {
      await rateLimiters.forgotPassword.consume(normalizedEmail);
    } catch (error) {
      log('warn', 'Rate limit exceeded for forgot password', { email: normalizedEmail });
      // Still return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'Als dit e-mailadres bij ons bekend is, ontvang je binnen enkele minuten een e-mail met instructies.',
      });
    }

    // Check if user exists in Client or User table
    const [clientResult, userResult] = await Promise.all([
      supabaseAdmin
        .from('Client')
        .select('id, email, name')
        .eq('email', normalizedEmail)
        .single(),
      supabaseAdmin
        .from('User')
        .select('id, email, name')
        .eq('email', normalizedEmail)
        .single(),
    ]);

    const client = clientResult.data;
    const user = userResult.data;

    const userExists = client || user;

    if (userExists) {
      // Ensure user exists in Supabase Auth (create if doesn't exist)
      // This allows us to use Supabase Auth's email system
      try {
        // Try to create user - if they already exist, this will fail silently
        // This is more efficient than checking first
        const randomPassword = crypto.randomBytes(32).toString('hex');
        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: normalizedEmail,
          password: randomPassword,
          email_confirm: true, // Auto-confirm email
        });

        if (createData?.user) {
          log('info', 'Created Supabase Auth user for password reset', {
            email: normalizedEmail,
          });
        }
        // If error indicates user already exists, that's fine - we can still send reset email
      } catch (authError) {
        logError(authError as Error, {
          context: 'Failed to ensure Supabase Auth user exists',
          email: normalizedEmail,
        });
        // Continue anyway - user might already exist
      }

      // Use Supabase Auth to send password reset email
      const redirectUrl = process.env.NEXTAUTH_URL 
        ? `${process.env.NEXTAUTH_URL}/wachtwoord-resetten`
        : 'https://writgoai.nl/wachtwoord-resetten';

      try {
        const { error } = await supabaseAdmin.auth.resetPasswordForEmail(
          normalizedEmail,
          {
            redirectTo: redirectUrl,
          }
        );

        if (error) {
          logError(error as Error, {
            context: 'Supabase password reset failed',
            email: normalizedEmail,
          });
          // Continue anyway - don't reveal if email sending failed
        } else {
          log('info', 'Password reset email sent via Supabase', {
            email: normalizedEmail,
          });
        }
      } catch (emailError) {
        logError(emailError as Error, {
          context: 'Failed to send password reset email via Supabase',
          email: normalizedEmail,
        });
        // Continue anyway - don't reveal if email sending failed
      }
    } else {
      log('info', 'Password reset requested for non-existent email', {
        email: normalizedEmail,
      });
    }

    // Always return success message to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'Als dit e-mailadres bij ons bekend is, ontvang je binnen enkele minuten een e-mail met instructies.',
    });

  } catch (error) {
    logError(error as Error, { endpoint: '/api/client-auth/forgot-password' });
    console.error('Forgot password error:', error);
    
    // Return generic error to prevent information leakage
    return NextResponse.json(
      { error: 'Er is een fout opgetreden. Probeer het later opnieuw.' },
      { status: 500 }
    );
  }
}
