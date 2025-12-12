import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';
import { getlateClient } from '@/lib/getlate/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/social/accounts
 * Fetch all connected social media accounts for a project
 * 
 * Query params:
 * - projectId: WritGo project ID
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // Fetch from our database
    const accounts = await prisma.connectedSocialAccount.findMany({
      where: {
        projectId,
        isActive: true
      },
      orderBy: {
        connectedAt: 'desc'
      }
    });

    // Optionally sync with Getlate to get latest data
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (project?.getlateProfileId) {
      try {
        const getlateData = await getlateClient.listAccounts(project.getlateProfileId);
        
        // Update follower counts and other data from Getlate
        for (const account of accounts) {
          const getlateAccount = getlateData.accounts.find(
            (a: any) => a._id === account.getlateAccountId
          );
          
          if (getlateAccount && getlateAccount.followersCount) {
            // Update follower count in database
            await prisma.connectedSocialAccount.update({
              where: { id: account.id },
              data: {
                followersCount: getlateAccount.followersCount,
                followersLastUpdated: new Date()
              }
            });
            
            // Update in response
            account.followersCount = getlateAccount.followersCount;
          }
        }
      } catch (error) {
        console.error('Failed to sync with Getlate:', error);
        // Continue with database data
      }
    }

    return NextResponse.json({
      accounts,
      total: accounts.length
    });
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}
