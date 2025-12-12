import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getlateClient } from '@/lib/getlate/client';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

/**
 * POST /api/social/connect
 * Get OAuth URL to connect a social media platform
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, platform } = await request.json();

    // Validate input
    if (!projectId || !platform) {
      return NextResponse.json(
        { error: 'projectId and platform are required' },
        { status: 400 }
      );
    }

    // Get project with getlateProfileId
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.getlateProfileId) {
      return NextResponse.json(
        { error: 'Project has no Getlate profile. Please contact support.' },
        { status: 400 }
      );
    }

    // Get connect URL from Getlate.dev
    const redirectUrl = `${process.env.NEXTAUTH_URL}/api/social/connect/callback`;
    
    const connectData = await getlateClient.getConnectUrl(
      project.getlateProfileId,
      platform,
      redirectUrl
    );

    console.log('✓ Generated connect URL for platform:', platform);

    return NextResponse.json({
      authUrl: connectData.authUrl,
      state: connectData.state
    });
  } catch (error: any) {
    console.error('Failed to get connect URL:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get connect URL' },
      { status: 500 }
    );
  }
}
