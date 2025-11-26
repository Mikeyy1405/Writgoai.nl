

export const dynamic = "force-dynamic";
/**
 * Mark Content Idea as Written
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { ideaId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { ideaId } = params;

    const body = await request.json();
    const { status = 'completed', contentId } = body;

    // Update article idea
    const updatedIdea = await prisma.articleIdea.update({
      where: { 
        id: ideaId,
        clientId: client.id 
      },
      data: {
        status,
        hasContent: status === 'completed',
        contentId: contentId || undefined,
        generatedAt: status === 'completed' ? new Date() : undefined,
      }
    });

    return NextResponse.json({
      success: true,
      idea: updatedIdea,
    });

  } catch (error: any) {
    console.error('❌ Mark written error:', error);
    return NextResponse.json({ 
      error: 'Failed to update idea', 
      details: error.message 
    }, { status: 500 });
  }
}
