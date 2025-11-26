

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    // Check if admin
    if (!session?.user?.email || session.user.email !== 'info@WritgoAI.nl') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId } = await req.json();

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Delete the client - all related records will be cascade deleted automatically
    // because of the onDelete: Cascade in the schema relations
    await prisma.client.delete({
      where: { id: clientId },
    });

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete client error:', error);
    return NextResponse.json(
      { error: 'Failed to delete client', details: error.message },
      { status: 500 }
    );
  }
}
