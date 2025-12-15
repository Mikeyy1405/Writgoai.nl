
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { scanContent } from '@/lib/zerogpt-api';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Geen content opgegeven' },
        { status: 400 }
      );
    }

    console.log('[ZeroGPT Scan API] Scanning', content.length, 'characters');

    // Get client details for credit tracking
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }

    // Scan the content
    const result = await scanContent(content);

    if (!result.success) {
      console.error('[ZeroGPT Scan API] Scan failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Scan mislukt' },
        { status: 500 }
      );
    }

    // Track credit usage (0.01 credits per scan)
    await prisma.client.update({
      where: { id: client.id },
      data: {
        totalCreditsUsed: {
          increment: 0.01,
        },
      },
    });

    console.log('[ZeroGPT Scan API] Scan successful');
    console.log('[ZeroGPT Scan API] AI Score:', result.score.ai + '%');

    return NextResponse.json({
      success: true,
      score: result.score,
      sentences: result.sentences,
      shareUrl: result.shareUrl,
    });
  } catch (error: any) {
    console.error('[ZeroGPT Scan API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
