
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { listAccounts } from '@/lib/getlate-api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/client/getlate/accounts?projectId=xxx
 * Haal Getlate accounts op voor een project
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const projectId = req.nextUrl.searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is verplicht' },
        { status: 400 }
      );
    }

    // Controleer of project bestaat en bij deze client hoort
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: {
          email: session.user.email,
        },
      },
      include: {
        socialMediaConfig: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    // Check if Getlate is enabled
    if (!project.socialMediaConfig?.getlateEnabled || !project.socialMediaConfig?.getlateProfileId) {
      return NextResponse.json({
        accounts: [],
        message: 'Getlate nog niet ingesteld voor dit project',
      });
    }

    // Haal accounts op van Getlate
    const accounts = await listAccounts(project.socialMediaConfig.getlateProfileId);

    // Update database met account informatie
    if (accounts.length > 0) {
      const accountIds = accounts.map(acc => acc.id);
      const connectedAccounts = accounts.reduce((acc, account) => {
        acc[account.platform] = {
          id: account.id,
          username: account.username,
          displayName: account.displayName,
          avatar: account.avatar,
        };
        return acc;
      }, {} as Record<string, any>);

      await prisma.socialMediaConfig.update({
        where: { projectId },
        data: {
          getlateAccountIds: accountIds,
          getlateConnectedAccounts: connectedAccounts,
          getlateLastSync: new Date(),
        },
      });
    }

    return NextResponse.json({
      accounts,
      profileId: project.socialMediaConfig.getlateProfileId,
    });
  } catch (error: any) {
    console.error('Getlate accounts error:', error);
    return NextResponse.json(
      { error: error.message || 'Accounts ophalen gefaald' },
      { status: 500 }
    );
  }
}
