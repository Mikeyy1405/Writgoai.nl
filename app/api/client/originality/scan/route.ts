
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { scanContent as scanOriginalityAI } from '@/lib/originality-ai';
import { scanContent as scanZeroGPT } from '@/lib/zerogpt-api';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/client/originality/scan
 * Scan content for AI detection using ZeroGPT
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet ingelogd' },
        { status: 401 }
      );
    }

    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is verplicht' },
        { status: 400 }
      );
    }

    if (content.length < 50) {
      return NextResponse.json(
        { error: 'Content te kort voor accurate scanning (minimaal 50 karakters)' },
        { status: 400 }
      );
    }

    // Always use Originality.AI
    const selectedProvider = 'originality';

    console.log(`[AI Detection] Scanning ${content.length} characters using Originality.AI for ${session.user.email}`);

    // Call Originality.AI API
    const result = await scanOriginalityAI(content);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Scan mislukt' },
        { status: 500 }
      );
    }

    // Determine detection level
    let level: 'safe' | 'warning' | 'danger' = 'safe';
    let message = 'Content lijkt menselijk geschreven';

    if (result.score.ai > 50) {
      level = 'danger';
      message = 'Hoge AI-detectie score - humanization sterk aanbevolen';
    } else if (result.score.ai > 20) {
      level = 'warning';
      message = 'Matige AI-detectie score - humanization aanbevolen';
    }

    return NextResponse.json({
      success: true,
      score: result.score,
      level,
      message,
      provider: selectedProvider,
      credits_used: result.credits_used,
      sentences: result.sentences,
      shareUrl: result.shareUrl, // Include share URL from Originality.AI
    });

  } catch (error: any) {
    console.error('[AI Detection] Scan error:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij scannen' },
      { status: 500 }
    );
  }
}
