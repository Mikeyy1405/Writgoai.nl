
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';


// GET - Haal alle topics op voor een project
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Haal client en project op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id
      },
      select: { id: true }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Haal alle topics op
    const topics = await prisma.socialMediaTopic.findMany({
      where: { projectId: project.id },
      orderBy: [
        { usageCount: 'asc' },  // Minst gebruikte eerst
        { createdAt: 'desc' }
      ]
    });

    // Groepeer per categorie
    const byCategory = topics.reduce((acc: any, topic) => {
      if (!acc[topic.category]) {
        acc[topic.category] = [];
      }
      acc[topic.category].push(topic);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      total: topics.length,
      byCategory,
      topics
    });

  } catch (error: any) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Verwijder een topic
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('id');

    if (!topicId) {
      return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 });
    }

    // Valideer eigenaarschap
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const topic = await prisma.socialMediaTopic.findFirst({
      where: {
        id: topicId,
        project: {
          clientId: client.id
        }
      }
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    await prisma.socialMediaTopic.delete({
      where: { id: topicId }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error deleting topic:', error);
    return NextResponse.json(
      { error: 'Failed to delete topic', details: error.message },
      { status: 500 }
    );
  }
}
