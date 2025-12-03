
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { listAvailableSites } from '@/lib/google-search-console';

/**
 * GET /api/client/search-console/sites
 * Haalt beschikbare Google Search Console sites op voor de ingelogde gebruiker
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }
    
    console.log('🔍 Fetching available GSC sites...');
    
    const sites = await listAvailableSites();
    
    return NextResponse.json({
      success: true,
      sites,
      count: sites.length,
      message: sites.length > 0 
        ? `${sites.length} site${sites.length !== 1 ? 's' : ''} gevonden`
        : 'Geen sites gevonden. Voeg eerst een property toe in Google Search Console.',
    });
  } catch (error: any) {
    console.error('Error fetching GSC sites:', error);
    
    // Check if it's an auth error
    if (error.message?.includes('Geen Google Search Console toegang')) {
      return NextResponse.json(
        {
          error: 'Google Search Console niet gekoppeld',
          message: 'Koppel eerst je Google account om je sites te zien.',
          needsAuth: true,
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        error: error.message || 'Fout bij ophalen van GSC sites',
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
