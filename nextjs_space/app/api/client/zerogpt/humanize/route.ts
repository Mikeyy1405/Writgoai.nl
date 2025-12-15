
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { humanizeContent } from '@/lib/zerogpt-api';
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
    const { content, tone = 'Standard', isHtml = false } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Geen content opgegeven' },
        { status: 400 }
      );
    }

    console.log('[ZeroGPT Humanize API] Humanizing', content.length, 'characters');
    console.log('[ZeroGPT Humanize API] Tone:', tone);
    console.log('[ZeroGPT Humanize API] Is HTML:', isHtml);

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

    // Humanize the content
    const result = await humanizeContent(content, tone);

    if (!result.success || !result.humanizedContent) {
      console.error('[ZeroGPT Humanize API] Humanization failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Humanization mislukt' },
        { status: 500 }
      );
    }

    // Track credit usage (0.01 credits per humanization)
    await prisma.client.update({
      where: { id: client.id },
      data: {
        totalCreditsUsed: {
          increment: 0.01,
        },
      },
    });

    console.log('[ZeroGPT Humanize API] Humanization successful');

    return NextResponse.json({
      success: true,
      humanizedContent: result.humanizedContent,
    });
  } catch (error: any) {
    console.error('[ZeroGPT Humanize API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
