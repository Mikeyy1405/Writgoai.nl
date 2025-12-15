
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geauthenticeerd' }, { status: 401 });
    }

    const { projectId, accountIds } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is verplicht' }, { status: 400 });
    }

    if (!Array.isArray(accountIds)) {
      return NextResponse.json({ error: 'Account IDs moeten een array zijn' }, { status: 400 });
    }

    // Find client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Update config with selected account IDs
    await prisma.socialMediaConfig.update({
      where: { projectId },
      data: {
        accountIds,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${accountIds.length} account(s) opgeslagen`,
    });
  } catch (error) {
    console.error('[save-accounts] Error:', error);
    return NextResponse.json(
      { error: 'Fout bij opslaan van accounts' },
      { status: 500 }
    );
  }
}
