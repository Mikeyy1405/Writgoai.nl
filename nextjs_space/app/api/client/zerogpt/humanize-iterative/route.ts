
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { iterativeHumanize } from '@/lib/zerogpt-api';
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
    const { content, targetScore = 5, maxIterations = 5 } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Geen content opgegeven' },
        { status: 400 }
      );
    }

    console.log('[ZeroGPT Iterative Humanize API] Starting iterative humanization');
    console.log('[ZeroGPT Iterative Humanize API] Content length:', content.length);
    console.log('[ZeroGPT Iterative Humanize API] Target score:', targetScore + '%');
    console.log('[ZeroGPT Iterative Humanize API] Max iterations:', maxIterations);

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

    // Perform iterative humanization
    const result = await iterativeHumanize(
      content,
      targetScore,
      maxIterations
    );

    if (!result.success) {
      console.error('[ZeroGPT Iterative Humanize API] Failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Iteratieve humanization mislukt' },
        { status: 500 }
      );
    }

    // Track credit usage (0.01 per iteration + 0.01 per scan)
    const totalCredits = result.iterations * 0.02; // scan + humanize per iteration
    await prisma.client.update({
      where: { id: client.id },
      data: {
        totalCreditsUsed: {
          increment: totalCredits,
        },
      },
    });

    console.log('[ZeroGPT Iterative Humanize API] Success!');
    console.log('[ZeroGPT Iterative Humanize API] Iterations:', result.iterations);
    console.log('[ZeroGPT Iterative Humanize API] Final score:', result.finalScore + '%');

    return NextResponse.json({
      success: true,
      finalContent: result.finalContent,
      finalScore: result.finalScore,
      iterations: result.iterations,
    });
  } catch (error: any) {
    console.error('[ZeroGPT Iterative Humanize API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
