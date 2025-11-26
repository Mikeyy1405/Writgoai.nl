

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateContentIdeas } from '@/lib/keyword-research';

/**
 * POST - Genereer content voor een keyword
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { keywordId, action } = body;

    if (!keywordId) {
      return NextResponse.json({ error: 'Keyword ID is required' }, { status: 400 });
    }

    // Get keyword
    const keyword = await prisma.keyword.findFirst({
      where: {
        id: keywordId,
        clientId: client.id
      }
    });

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    if (action === 'ideas') {
      // Generate more content ideas
      const ideas = await generateContentIdeas(keyword.keyword, 10);
      
      // Update keyword with new ideas
      await prisma.keyword.update({
        where: { id: keywordId },
        data: {
          contentIdeas: [...keyword.contentIdeas, ...ideas]
        }
      });

      return NextResponse.json({
        success: true,
        ideas
      });

    } else if (action === 'create') {
      // Redirect to blog generator with this keyword pre-filled
      // This will be handled in the frontend
      return NextResponse.json({
        success: true,
        message: 'Redirect to blog generator',
        keyword: keyword.keyword
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}
