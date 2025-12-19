import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * DELETE: Delete a topical map
 */

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = params;

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // For now, return success without deleting from database
    // In production, you'd delete: await prisma.topicalMap.delete({ where: { id, project: { clientId: client.id } } })
    return NextResponse.json({
      success: true,
      message: 'TopicalMap storage not yet implemented in database.',
    });

  } catch (error) {
    console.error('Error deleting topical map:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
