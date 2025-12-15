import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/simplified/projects/[id]
 * Haal een specifiek project op met content plan
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Haal project op
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/simplified/projects/[id]
 * Verwijder een project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verwijder project (alleen als het van de gebruiker is)
    await prisma.project.deleteMany({
      where: {
        id: params.id,
        clientId: client.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/simplified/projects/[id]
 * Update een project
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, websiteUrl, wordpressUrl, wordpressUsername, wordpressPassword, wordpressCategory, description } = body;

    // Validate required fields
    if (name !== undefined && !name) {
      return NextResponse.json(
        { error: 'Project naam is verplicht' },
        { status: 400 }
      );
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get existing project to check for existing WordPress password
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Test WordPress connection if new credentials are provided
    const hasCompleteWordPressCredentials = wordpressUrl && wordpressUsername && wordpressPassword;
    
    if (hasCompleteWordPressCredentials) {
      try {
        const wpTestUrl = `${wordpressUrl}/wp-json/wp/v2/posts?per_page=1`;
        const wpResponse = await fetch(wpTestUrl, {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${wordpressUsername}:${wordpressPassword}`).toString('base64')}`,
          },
        });

        if (!wpResponse.ok) {
          throw new Error('WordPress connection failed');
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'WordPress connection failed. Check your credentials.' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: {
      name?: string;
      websiteUrl?: string | null;
      description?: string | null;
      wordpressUrl?: string | null;
      wordpressUsername?: string | null;
      wordpressPassword?: string;
      wordpressCategory?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl || null;
    if (description !== undefined) updateData.description = description || null;
    if (wordpressUrl !== undefined) updateData.wordpressUrl = wordpressUrl || null;
    if (wordpressUsername !== undefined) updateData.wordpressUsername = wordpressUsername || null;
    if (wordpressCategory !== undefined) updateData.wordpressCategory = wordpressCategory || null;
    
    // Only update password if a new one is provided
    if (wordpressPassword) {
      updateData.wordpressPassword = wordpressPassword;
    }

    // Update project
    const project = await prisma.project.updateMany({
      where: {
        id: params.id,
        clientId: client.id,
      },
      data: updateData,
    });

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}
