import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { GetlateClient } from '@/lib/getlate-client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/simplified/social-media/settings
 * Haal social media instellingen op voor een project
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is verplicht' },
        { status: 400 }
      );
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Haal project op
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
      select: {
        id: true,
        name: true,
        getlateApiKey: true,
        autopostEnabled: true,
        connectedPlatforms: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({
      projectId: project.id,
      projectName: project.name,
      getlateApiKey: project.getlateApiKey ? '***configured***' : null,
      getlateApiKeyConfigured: !!project.getlateApiKey,
      autopostEnabled: project.autopostEnabled || false,
      connectedPlatforms: project.connectedPlatforms || [],
    });
  } catch (error) {
    console.error('Error fetching social media settings:', error);
    return NextResponse.json(
      { error: 'Fout bij ophalen van instellingen' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/simplified/social-media/settings
 * Update social media instellingen voor een project
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, getlateApiKey, autopostEnabled, connectedPlatforms } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is verplicht' },
        { status: 400 }
      );
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Haal project op
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Als nieuwe API key is opgegeven, test de connectie
    if (getlateApiKey && getlateApiKey !== '***configured***') {
      try {
        const getlate = new GetlateClient(getlateApiKey);
        const connectionTest = await getlate.testConnection();

        if (!connectionTest.success) {
          return NextResponse.json(
            { error: `Getlate.Dev API key ongeldig: ${connectionTest.error}` },
            { status: 400 }
          );
        }
      } catch (error: any) {
        return NextResponse.json(
          { error: `Getlate.Dev API key test gefaald: ${error.message}` },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {};

    if (getlateApiKey !== undefined && getlateApiKey !== '***configured***') {
      updateData.getlateApiKey = getlateApiKey;
    }

    if (autopostEnabled !== undefined) {
      updateData.autopostEnabled = autopostEnabled;
    }

    if (connectedPlatforms !== undefined) {
      updateData.connectedPlatforms = connectedPlatforms;
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Instellingen bijgewerkt',
      project: {
        id: updatedProject.id,
        name: updatedProject.name,
        getlateApiKeyConfigured: !!updatedProject.getlateApiKey,
        autopostEnabled: updatedProject.autopostEnabled,
        connectedPlatforms: updatedProject.connectedPlatforms,
      },
    });
  } catch (error) {
    console.error('Error updating social media settings:', error);
    return NextResponse.json(
      { error: 'Fout bij bijwerken van instellingen' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/simplified/social-media/settings/test-connection
 * Test Getlate.Dev API connectie
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'apiKey is verplicht' },
        { status: 400 }
      );
    }

    const getlate = new GetlateClient(apiKey);
    const connectionTest = await getlate.testConnection();

    if (connectionTest.success) {
      // Haal ook profiles op om te laten zien
      try {
        const profiles = await getlate.getProfiles();
        return NextResponse.json({
          success: true,
          message: 'Verbinding succesvol!',
          profiles: profiles.map((p: any) => ({
            id: p.id,
            name: p.name,
            accountCount: p.accounts?.length || 0,
          })),
        });
      } catch (error) {
        return NextResponse.json({
          success: true,
          message: 'Verbinding succesvol!',
          profiles: [],
        });
      }
    } else {
      return NextResponse.json(
        { error: `Verbinding gefaald: ${connectionTest.error}` },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error testing connection:', error);
    return NextResponse.json(
      { error: `Test gefaald: ${error.message}` },
      { status: 500 }
    );
  }
}
