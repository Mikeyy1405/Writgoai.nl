export const dynamic = "force-dynamic";

/**
 * API Route for Testing Email Connection
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { testConnection } from '@/lib/email/imap-client';

/**
 * POST - Test IMAP connection
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imapHost, imapPort, username, password, tls } = body;

    // Validate required fields
    if (!imapHost || !imapPort || !username || !password) {
      return NextResponse.json(
        { error: 'IMAP host, port, username, and password are required' },
        { status: 400 }
      );
    }

    // Test connection
    const result = await testConnection({
      host: imapHost,
      port: parseInt(imapPort),
      username,
      password,
      tls: tls ?? true,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error testing connection:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to test connection',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
