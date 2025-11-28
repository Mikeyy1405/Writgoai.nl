import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getArticleIdea, scheduleArticle } from '@/lib/db/content-planning';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ideas/[id]/schedule
 * Schedule an article idea for publication
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const ideaId = resolvedParams.id;

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get client from email
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // 2. Get existing idea to verify ownership
    const existingIdea = await getArticleIdea(ideaId);

    if (!existingIdea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    if (existingIdea.clientId !== client.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 3. Parse request body
    const body = await req.json();
    const { scheduledFor } = body;

    if (!scheduledFor) {
      return NextResponse.json({
        error: 'Scheduled date is required',
      }, { status: 400 });
    }

    // Validate date
    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json({
        error: 'Invalid date format',
      }, { status: 400 });
    }

    // 4. Schedule the article
    const updatedIdea = await scheduleArticle(ideaId, scheduledFor);

    return NextResponse.json({
      success: true,
      idea: updatedIdea,
      message: `Article scheduled for ${scheduledDate.toLocaleDateString('nl-NL')}`,
    });

  } catch (error) {
    console.error('[Schedule POST] Error:', error);
    return NextResponse.json({
      error: 'Er is een fout opgetreden',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
