
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
 * GET /api/client/search-console/status
 * Check of Google Search Console is gekoppeld
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
    
    // Check of er een access token is
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const authPath = path.join('/home/ubuntu/.config', 'abacusai_auth_secrets.json');
      
      console.log('Checking GSC status from:', authPath);
      
      const authData = JSON.parse(await fs.readFile(authPath, 'utf8'));
      const gscToken = authData?.['google search console']?.secrets?.access_token?.value;
      
      console.log('GSC token present:', !!gscToken);
      
      if (gscToken) {
        return NextResponse.json({
          connected: true,
          message: 'Google Search Console is gekoppeld',
        });
      }
    } catch (error: any) {
      // Auth file niet gevonden of geen token
      console.log('GSC status check error:', error.message);
      console.log('This is expected if OAuth has not been completed yet');
    }
    
    return NextResponse.json({
      connected: false,
      message: 'Google Search Console is niet gekoppeld',
      connectUrl: `/api/client/search-console/oauth?action=connect`,
    });
  } catch (error: any) {
    console.error('Error checking GSC status:', error);
    
    return NextResponse.json(
      {
        error: error.message || 'Fout bij status check',
      },
      { status: 500 }
    );
  }
}
