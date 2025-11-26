
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { quickAICheck } from '@/lib/originality-ai';

export const dynamic = 'force-dynamic';

/**
 * POST /api/client/originality/quick-check
 * Quick local check for AI patterns (no API call, no credits used)
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

    const result = quickAICheck(content);

    return NextResponse.json({
      success: true,
      ...result,
    });

  } catch (error: any) {
    console.error('[Originality.AI] Quick check error:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij quick check' },
      { status: 500 }
    );
  }
}
