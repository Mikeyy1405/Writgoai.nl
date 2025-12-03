
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { validateLateDevApiKey } from '@/lib/late-dev-api';

/**
 * POST /api/client/social-media/test-connection
 * Test PROJECT-SPECIFIC Late.dev API connection and fetch connected accounts
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get project-specific social media config
    const config = await prisma.socialMediaConfig.findUnique({
      where: { projectId },
    });

    // Test connection using CENTRALIZED WritgoAI API key
    try {
      const isValid = await validateLateDevApiKey();
      
      // Update last connection test timestamp and ensure config exists
      if (config) {
        await prisma.socialMediaConfig.update({
          where: { projectId },
          data: { lastConnectionTest: new Date() },
        });
      } else {
        // Create config if it doesn't exist
        await prisma.socialMediaConfig.create({
          data: {
            projectId,
            lastConnectionTest: new Date(),
            autopilotEnabled: false,
          },
        });
      }
      
      return NextResponse.json({
        success: isValid,
        message: isValid ? 'Verbinding succesvol! Late.dev API key is geldig.' : 'Verbinding mislukt',
      });
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: error.message || 'Fout bij verbinden met Late.dev API.',
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error testing Late.dev connection:', error);
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    );
  }
}
