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
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const { clientId } = await request.json();

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is verplicht' },
        { status: 400 }
      );
    }

    console.log(`[API] Analyzing website for client ${clientId}`);

    // Perform analysis
    const analysis = await analyzeWebsite(clientId);

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('[API] Website analysis error:', error);
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
