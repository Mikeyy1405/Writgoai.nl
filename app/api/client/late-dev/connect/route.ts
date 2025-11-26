
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

const LATE_DEV_API_KEY = process.env.LATE_DEV_API_KEY;
const LATE_DEV_API_URL = 'https://getlate.dev/api/v1';

/**
 * Generate Late.dev invite link for connecting social media accounts
 * POST /api/client/late-dev/connect
 */
export async function POST(req: NextRequest) {
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

    const { projectId, platform } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
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

    // Create invite token via Late.dev API
    // If platform is specified, scope to that platform; otherwise allow all
    const scope = platform || 'all';
    
    const response = await fetch(`${LATE_DEV_API_URL}/invite/tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LATE_DEV_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scope: scope, // Specific platform or 'all'
        metadata: {
          clientId: client.id,
          projectId: projectId,
          projectName: project.name,
          platform: platform || 'all',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Late.dev] Invite creation failed:', error);
      return NextResponse.json(
        { error: 'Failed to create invite link' },
        { status: response.status }
      );
    }

    const inviteData = await response.json();

    return NextResponse.json({
      inviteUrl: inviteData.url,
      inviteId: inviteData.id,
      expiresAt: inviteData.expiresAt,
    });
  } catch (error: any) {
    console.error('[Late.dev Connect] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
