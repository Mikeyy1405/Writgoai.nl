
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getLateDevAccountsByProfile } from '@/lib/late-dev-api';

/**
 * This endpoint is deprecated in favor of the new profile-based workflow
 * Now handled by /api/client/social-media/profile
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geauthenticeerd' }, { status: 401 });
    }

    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is verplicht' }, { status: 400 });
    }

    // Get config with profileId
    const config = await prisma.socialMediaConfig.findUnique({
      where: { projectId },
    });

    if (!config || !config.lateDevProfileId) {
      return NextResponse.json(
        { error: 'Geen Late.dev profile gevonden. Maak eerst een profile aan.' },
        { status: 404 }
      );
    }

    // Fetch accounts for this specific profile
    const accounts = await getLateDevAccountsByProfile(config.lateDevProfileId);

    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: 'Geen accounts gevonden. Gebruik invite links om accounts te koppelen.' },
        { status: 404 }
      );
    }

    // Store account IDs
    await prisma.socialMediaConfig.update({
      where: { projectId },
      data: {
        accountIds: accounts.map(acc => acc._id),
        lastConnectionTest: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      accounts: accounts.map(acc => ({
        id: acc._id,
        platform: acc.platform,
        username: acc.username,
      })),
    });
  } catch (error: any) {
    console.error('[load-accounts] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij laden van accounts' },
      { status: 500 }
    );
  }
}
