
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * POST /api/client/social-media/link-account
 * Link a connected account to a project
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, accountId } = body;

    if (!projectId || !accountId) {
      return NextResponse.json(
        { error: 'Project ID and account ID are required' },
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

    // Get or create social media config
    let config = await prisma.socialMediaConfig.findUnique({
      where: { projectId },
    });

    if (!config) {
      config = await prisma.socialMediaConfig.create({
        data: {
          projectId,
          autopilotEnabled: false,
          postsPerWeek: 3,
          contentTypes: ['blog_promo', 'tips'],
          includeHashtags: true,
          includeEmojis: true,
          scheduleDays: ['monday', 'wednesday', 'friday'],
          scheduleTime: '09:00',
          timezone: 'Europe/Amsterdam',
          autoPublishBlog: false,
          autoApprove: false,
          accountIds: [],
        },
      });
    }

    // Add account ID to project if not already linked
    const currentAccountIds = config.accountIds || [];
    if (!currentAccountIds.includes(accountId)) {
      await prisma.socialMediaConfig.update({
        where: { projectId },
        data: {
          accountIds: [...currentAccountIds, accountId],
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Account successfully linked to project',
    });
  } catch (error: any) {
    console.error('Error linking account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to link account' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/client/social-media/link-account
 * Unlink an account from a project
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const accountId = searchParams.get('accountId');

    if (!projectId || !accountId) {
      return NextResponse.json(
        { error: 'Project ID and account ID are required' },
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

    // Get config
    const config = await prisma.socialMediaConfig.findUnique({
      where: { projectId },
    });

    if (!config) {
      return NextResponse.json({ error: 'Config not found' }, { status: 404 });
    }

    // Remove account ID from project
    const currentAccountIds = config.accountIds || [];
    const updatedAccountIds = currentAccountIds.filter(id => id !== accountId);

    await prisma.socialMediaConfig.update({
      where: { projectId },
      data: {
        accountIds: updatedAccountIds,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account successfully unlinked from project',
    });
  } catch (error: any) {
    console.error('Error unlinking account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to unlink account' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
