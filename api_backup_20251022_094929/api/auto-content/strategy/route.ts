
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET /api/auto-content/strategy
 * Get the auto content strategy for the logged-in client
 */
export async function GET() {
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

    const strategy = await prisma.autoContentStrategy.findUnique({
      where: { clientId: client.id },
      include: {
        GeneratedTopics: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    return NextResponse.json(strategy);
  } catch (error) {
    console.error('Error fetching auto content strategy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch strategy' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auto-content/strategy
 * Create or update auto content strategy
 */
export async function POST(request: Request) {
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

    const data = await request.json();

    // Check if strategy already exists
    const existingStrategy = await prisma.autoContentStrategy.findUnique({
      where: { clientId: client.id },
    });

    if (existingStrategy) {
      // Update existing strategy
      const updated = await prisma.autoContentStrategy.update({
        where: { id: existingStrategy.id },
        data: {
          niche: data.niche,
          subTopics: data.subTopics || [],
          targetAudience: data.targetAudience,
          isEnabled: data.isEnabled !== undefined ? data.isEnabled : true,
          postsPerDay: data.postsPerDay || 1,
          preferredPostTime: data.preferredPostTime || '09:00',
          contentTypes: data.contentTypes || ['article'],
          toneOfVoice: data.toneOfVoice || 'professional',
          language: data.language || 'Dutch',
          useAITopicGeneration: data.useAITopicGeneration !== false,
          autoPublish: data.autoPublish || false,
        },
      });
      return NextResponse.json(updated);
    } else {
      // Create new strategy
      const strategy = await prisma.autoContentStrategy.create({
        data: {
          clientId: client.id,
          niche: data.niche,
          subTopics: data.subTopics || [],
          targetAudience: data.targetAudience,
          isEnabled: data.isEnabled !== undefined ? data.isEnabled : true,
          postsPerDay: data.postsPerDay || 1,
          preferredPostTime: data.preferredPostTime || '09:00',
          contentTypes: data.contentTypes || ['article'],
          toneOfVoice: data.toneOfVoice || 'professional',
          language: data.language || 'Dutch',
          useAITopicGeneration: data.useAITopicGeneration !== false,
          autoPublish: data.autoPublish || false,
        },
      });
      return NextResponse.json(strategy);
    }
  } catch (error) {
    console.error('Error creating/updating auto content strategy:', error);
    return NextResponse.json(
      { error: 'Failed to save strategy' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auto-content/strategy
 * Delete auto content strategy
 */
export async function DELETE() {
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

    await prisma.autoContentStrategy.deleteMany({
      where: { clientId: client.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting auto content strategy:', error);
    return NextResponse.json(
      { error: 'Failed to delete strategy' },
      { status: 500 }
    );
  }
}
