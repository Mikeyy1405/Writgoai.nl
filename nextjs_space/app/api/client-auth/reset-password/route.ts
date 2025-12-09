import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { log, logError } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, password, email } = body;

    // Validate password
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Wachtwoord moet minimaal 6 tekens bevatten' },
        { status: 400 }
      );
    }

    // Validate access token
    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json(
        { error: 'Ongeldige reset token' },
        { status: 400 }
      );
    }

    // Validate the session using the access token from Supabase
    const { data: { user: supabaseUser }, error: sessionError } = await supabaseAdmin.auth.getUser(accessToken);

    if (sessionError || !supabaseUser) {
      log('warn', 'Invalid or expired password reset token', {
        error: sessionError?.message,
      });
      return NextResponse.json(
        { error: 'Ongeldige of verlopen reset link. Vraag een nieuwe aan.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get the email from the Supabase user
    const userEmail = supabaseUser.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Geen email gevonden in reset token' },
        { status: 400 }
      );
    }

    // Update password in Client or User table
    const [client, user] = await Promise.all([
      supabaseAdmin
        .from('Client')
        .select('id')
        .eq('email', userEmail)
        .single()
        .then(({ data }) => data),
      supabaseAdmin
        .from('User')
        .select('id')
        .eq('email', userEmail)
        .single()
        .then(({ data }) => data),
    ]);

    if (client) {
      const { error: updateError } = await supabaseAdmin
        .from('Client')
        .update({ password: hashedPassword })
        .eq('id', client.id);

      if (updateError) {
        throw updateError;
      }

      log('info', 'Client password reset successfully via Supabase', {
        clientId: client.id,
        email: userEmail,
      });
    } else if (user) {
      const { error: updateError } = await supabaseAdmin
        .from('User')
        .update({ password: hashedPassword })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      log('info', 'User password reset successfully via Supabase', {
        userId: user.id,
        email: userEmail,
      });
    } else {
      log('warn', 'Password reset attempted for non-existent user', {
        email: userEmail,
      });

      return NextResponse.json(
        { error: 'Gebruiker niet gevonden' },
        { status: 404 }
      );
    }

    // Also update the password in Supabase Auth to keep them in sync
    try {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = authUsers?.users?.find(u => u.email === userEmail);

      if (authUser) {
        await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
          password: password, // Supabase Auth will hash this automatically
        });

        log('info', 'Updated password in Supabase Auth', {
          email: userEmail,
        });
      }
    } catch (authError) {
      logError(authError as Error, {
        context: 'Failed to update Supabase Auth password',
        email: userEmail,
      });
      // Don't fail the request - the main database password was updated
    }

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
