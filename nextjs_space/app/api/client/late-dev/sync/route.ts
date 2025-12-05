
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getLateDevAccountsByProfile, createLateDevProfile } from '@/lib/late-dev-api';

/**
 * Sync connected accounts from Late.dev to database
 * POST /api/client/late-dev/sync
 * Uses profile-based approach to fetch accounts for specific project
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

    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Verify project belongs to client
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
      include: {
        socialMediaConfig: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Ensure we have a Late.dev profile for this project
    let profileId = project.socialMediaConfig?.lateDevProfileId;
    
    if (!profileId) {
      console.log('[Late.dev Sync] No profile found, creating one...');
      const profileResult = await createLateDevProfile(project.name, project.id);
      
      if (!profileResult) {
        return NextResponse.json(
          { error: 'Failed to create Late.dev profile' },
          { status: 500 }
        );
      }

      profileId = profileResult.profileId;

      // Save profile ID in database
      await prisma.socialMediaConfig.upsert({
        where: { projectId },
        create: {
          projectId,
          lateDevProfileId: profileResult.profileId,
          lateDevProfileName: profileResult.name,
        },
        update: {
          lateDevProfileId: profileResult.profileId,
          lateDevProfileName: profileResult.name,
        },
      });
    }

    // Fetch accounts for this specific profile from Late.dev API
    console.log('[Late.dev Sync] Fetching accounts for profile:', profileId);
    const accounts = await getLateDevAccountsByProfile(profileId);

    let syncedCount = 0;
    let newCount = 0;

    // Sync each account to database
    for (const account of accounts) {
      // Check if account already exists for this project
      const existing = await prisma.lateDevAccount.findFirst({
        where: {
          lateDevProfileId: account._id,
          projectId: projectId,
        },
      });

      if (existing) {
        // Update existing
        await prisma.lateDevAccount.update({
          where: { id: existing.id },
          data: {
            platform: account.platform || existing.platform,
            username: account.username,
            displayName: account.username, // Late.dev doesn't always return displayName
            isActive: true,
            lastUsedAt: new Date(),
          },
        });
        syncedCount++;
      } else {
        // Create new - only create if we have a valid platform
        if (account.platform) {
          await prisma.lateDevAccount.create({
            data: {
              projectId,
              clientId: client.id,
              lateDevProfileId: account._id,
              platform: account.platform,
              username: account.username,
              displayName: account.username,
              isActive: true,
              connectedAt: new Date(),
              lastUsedAt: new Date(),
            },
          });
          newCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      new: newCount,
      total: accounts.length,
    });
  } catch (error: any) {
    console.error('[Late.dev Sync] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
