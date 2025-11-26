
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * DELETE /api/video-workflow/content-calendar/[id]
 * Delete a video idea
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if the idea belongs to this client
    const idea = await prisma.videoIdea.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
    });

    if (!idea) {
      return NextResponse.json(
        { error: 'Video idea not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the idea
    await prisma.videoIdea.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Video idea deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting video idea:', error);
    return NextResponse.json(
      { error: 'Failed to delete video idea' },
      { status: 500 }
    );
  }
}
