import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET: Get all topical maps for a project
 * POST: Save a new topical map
 */

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify project belongs to client
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // For now, return empty array - would need database migration to add TopicalMap model
    // In production, you'd query: await prisma.topicalMap.findMany({ where: { projectId } })
    return NextResponse.json({
      success: true,
      maps: [],
      message: 'TopicalMap storage not yet implemented in database. Maps will be stored client-side for now.',
    });

  } catch (error) {
    console.error('Error fetching topical maps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, name, niche, items } = body;

    if (!projectId || !name || !items) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify project belongs to client
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // For now, return success without saving to database
    // In production, you'd create: await prisma.topicalMap.create({ data: { projectId, name, niche, items: JSON.stringify(items) } })
    return NextResponse.json({
      success: true,
      message: 'TopicalMap storage not yet implemented in database. Use export features to save your map.',
      id: `temp-${Date.now()}`,
    });

  } catch (error) {
    console.error('Error saving topical map:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
