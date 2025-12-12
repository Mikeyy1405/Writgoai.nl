import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { analyzeWebsite, getLatestAnalysis } from '@/lib/analyzer/website-analyzer';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/analyzer/website
 * Analyze a client's website and content to detect niche, audience, tone, keywords
 */
export async function POST(request: NextRequest) {
  try {
    console.log(`\n🔵 ========================================`);
    console.log(`🔵 [API] POST /api/admin/analyzer/website`);
    console.log(`🔵 ========================================`);
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      console.error(`❌ [API] Unauthorized - no session`);
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }
    
    console.log(`✅ [API] Authenticated as: ${session.user.email}`);

    const { clientId } = await request.json();
    console.log(`📝 [API] Request body: { clientId: "${clientId}" }`);

    if (!clientId) {
      console.error(`❌ [API] Missing clientId`);
      return NextResponse.json(
        { error: 'Client ID is verplicht' },
        { status: 400 }
      );
    }

    // Validate that clientId is not a placeholder value
    if (clientId === 'default-client-id' || clientId.trim().length === 0) {
      console.error(`❌ [API] Invalid clientId: "${clientId}"`);
      return NextResponse.json(
        { error: 'Selecteer eerst een geldige client voordat je een analyse uitvoert' },
        { status: 400 }
      );
    }

    console.log(`✅ [API] Valid clientId, starting analysis...`);

    // Perform analysis
    const analysis = await analyzeWebsite(clientId);

    console.log(`✅ [API] Analysis complete, returning results`);
    console.log(`📊 [API] Response:`, {
      niche: analysis.niche.substring(0, 50) + '...',
      nicheConfidence: analysis.nicheConfidence,
      keywordsCount: analysis.keywords.length,
      themesCount: analysis.themes.length,
    });
    console.log(`🔵 ========================================\n`);

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error(`\n❌ ========================================`);
    console.error(`❌ [API] Website analysis error`);
    console.error(`❌ ========================================`);
    console.error(`❌ Error message:`, error.message);
    console.error(`❌ Error stack:`, error.stack);
    console.error(`❌ ========================================\n`);
    
    return NextResponse.json(
      { error: error.message || 'Fout bij website analyse' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/analyzer/website?clientId=xxx
 * Get the latest analysis for a client
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is verplicht' },
        { status: 400 }
      );
    }

    // Validate that clientId is not a placeholder value
    if (clientId === 'default-client-id' || clientId.trim().length === 0) {
      return NextResponse.json(
        { error: 'Selecteer eerst een geldige client' },
        { status: 400 }
      );
    }

    const analysis = await getLatestAnalysis(clientId);

    if (!analysis) {
      return NextResponse.json(
        { error: 'Geen analyse gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('[API] Get analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij ophalen analyse' },
      { status: 500 }
    );
  }
}
