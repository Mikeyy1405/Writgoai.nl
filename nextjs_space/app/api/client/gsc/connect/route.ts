import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
 * GET /api/client/gsc/connect
 * Initiate Google Search Console OAuth flow
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }
    
    // For now, return a message that this feature is being set up
    // In production, this would redirect to Google OAuth
    return NextResponse.json({
      message: 'Google Search Console connection wordt binnenkort beschikbaar gesteld.',
      instructions: [
        '1. Google Search Console moet geconfigureerd zijn voor je website',
        '2. OAuth credentials moeten ingesteld zijn in Google Cloud Console',
        '3. Redirect URI moet toegevoegd zijn aan OAuth consent screen',
      ],
    });
  } catch (error: any) {
    console.error('[GSC Connect] Error:', error);
    return NextResponse.json(
      { error: 'Fout bij verbinden met GSC' },
      { status: 500 }
    );
  }
}
