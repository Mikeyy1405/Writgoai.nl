
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * DELETE /api/videos/[id]
 * Delete a specific video
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

    // Check if the video belongs to this client
    const video = await prisma.generatedVideo.findFirst({
      where: {
        id: params.id,
        Series: {
          clientId: client.id,
        },
      },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the video
    await prisma.generatedVideo.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/videos/[id]
 * Update a specific video
 */
export async function PATCH(
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

    // Check if the video belongs to this client
    const video = await prisma.generatedVideo.findFirst({
      where: {
        id: params.id,
        Series: {
          clientId: client.id,
        },
      },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found or unauthorized' },
        { status: 404 }
      );
    }

    const data = await request.json();

    // Update the video
    const updatedVideo = await prisma.generatedVideo.update({
      where: { id: params.id },
      data: {
        videoTopic: data.videoTopic,
        status: data.status,
        videoUrl: data.videoUrl,
        errorMessage: data.errorMessage,
      },
    });

    return NextResponse.json(updatedVideo);
  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    );
  }
}
