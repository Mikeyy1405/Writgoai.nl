import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { log, logError } from '@/lib/logger';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    // Validate input
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Ongeldige reset token' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Wachtwoord moet minimaal 6 tekens bevatten' },
        { status: 400 }
      );
    }

    // Find the token in the database
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      log('warn', 'Invalid password reset token used');
      return NextResponse.json(
        { error: 'Ongeldige of verlopen reset link. Vraag een nieuwe aan.' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (new Date() > resetToken.expires) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      
      log('warn', 'Expired password reset token used', {
        email: resetToken.email,
        expiredAt: resetToken.expires.toISOString(),
      });
      
      return NextResponse.json(
        { error: 'Deze reset link is verlopen. Vraag een nieuwe aan.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password in Client or User table
    const [client, user] = await Promise.all([
      prisma.client.findUnique({ 
        where: { email: resetToken.email },
        select: { id: true }
      }),
      prisma.user.findUnique({ 
        where: { email: resetToken.email },
        select: { id: true }
      }),
    ]);

    if (client) {
      await prisma.client.update({
        where: { id: client.id },
        data: { password: hashedPassword },
      });
      
      log('info', 'Client password reset successfully', {
        clientId: client.id,
        email: resetToken.email,
      });
    } else if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      
      log('info', 'User password reset successfully', {
        userId: user.id,
        email: resetToken.email,
      });
    } else {
      // User no longer exists
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      
      log('warn', 'Password reset attempted for non-existent user', {
        email: resetToken.email,
      });
      
      return NextResponse.json(
        { error: 'Gebruiker niet gevonden' },
        { status: 404 }
      );
    }

    // Delete the used token (single-use)
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Je wachtwoord is succesvol gewijzigd. Je kunt nu inloggen met je nieuwe wachtwoord.',
    });

  } catch (error) {
    logError(error as Error, { endpoint: '/api/client-auth/reset-password' });
    console.error('Reset password error:', error);
    
    return NextResponse.json(
      { error: 'Er is een fout opgetreden. Probeer het later opnieuw.' },
      { status: 500 }
    );
  }
}
