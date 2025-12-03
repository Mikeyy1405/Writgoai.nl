import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { rateLimiters } from '@/lib/rate-limiter';
import { sendPasswordResetEmail } from '@/lib/password-reset-email';
import { log, logError } from '@/lib/logger';

const prisma = new PrismaClient();

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
    const [client, user] = await Promise.all([
      prisma.client.findUnique({ 
        where: { email: normalizedEmail },
        select: { id: true, email: true, name: true }
      }),
      prisma.user.findUnique({ 
        where: { email: normalizedEmail },
        select: { id: true, email: true, name: true }
      }),
    ]);

    const userExists = client || user;

    if (userExists) {
      // Generate secure random token (32 bytes = 64 hex characters)
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Token expires in 1 hour
      const expires = new Date();
      expires.setHours(expires.getHours() + 1);

      // Store token in database
      await prisma.passwordResetToken.create({
        data: {
          email: normalizedEmail,
          token: resetToken,
          expires,
        },
      });

      // Get the base URL for the reset link
      const baseUrl = process.env.NEXTAUTH_URL || 'https://writgoai.nl';
      const resetLink = `${baseUrl}/wachtwoord-resetten?token=${resetToken}`;

      // Send password reset email
      try {
        await sendPasswordResetEmail({
          to: normalizedEmail,
          name: userExists.name || 'daar',
          resetLink,
        });

        log('info', 'Password reset email sent', {
          email: normalizedEmail,
          expiresAt: expires.toISOString(),
        });
      } catch (emailError) {
        logError(emailError as Error, {
          context: 'Failed to send password reset email',
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
