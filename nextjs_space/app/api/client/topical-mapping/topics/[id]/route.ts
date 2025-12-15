
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { customOutline, selectedImages, internalLinks, notes, status, scheduledFor } = body;

    // Find topic and verify ownership
    const topic = await prisma.topicalTopic.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            topicalMap: {
              include: {
                project: {
                  include: {
                    client: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    if (topic.category.topicalMap.project.client.email !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update topic
    const updatedTopic = await prisma.topicalTopic.update({
      where: { id },
      data: {
        ...(customOutline !== undefined && { customOutline }),
        ...(selectedImages !== undefined && { selectedImages }),
        ...(internalLinks !== undefined && { internalLinks }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
        ...(scheduledFor !== undefined && { scheduledFor })
      }
    });

    return NextResponse.json({ 
      success: true, 
      topic: updatedTopic 
    });

  } catch (error) {
    console.error('Error updating topic:', error);
    return NextResponse.json(
      { error: 'Failed to update topic' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Find topic and verify ownership
    const topic = await prisma.topicalTopic.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            topicalMap: {
              include: {
                project: {
                  include: {
                    client: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    if (topic.category.topicalMap.project.client.email !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete topic
    await prisma.topicalTopic.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting topic:', error);
    return NextResponse.json(
      { error: 'Failed to delete topic' },
      { status: 500 }
    );
  }
}
