
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topicIds, startDate, interval } = await request.json();

    if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
      return NextResponse.json(
        { error: 'No topics provided' },
        { status: 400 }
      );
    }

    if (!startDate) {
      return NextResponse.json(
        { error: 'No start date provided' },
        { status: 400 }
      );
    }

    // Verify ownership of all topics
    const topics = await prisma.topicalTopic.findMany({
      where: { id: { in: topicIds } },
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

    const unauthorized = topics.some(
      t => t.category.topicalMap.project.client.email !== session.user.email
    );

    if (unauthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Calculate scheduled dates based on interval
    const baseDate = new Date(startDate);
    const scheduledDates: Date[] = [];

    for (let i = 0; i < topics.length; i++) {
      const date = new Date(baseDate);
      
      if (interval === 'daily') {
        date.setDate(date.getDate() + i);
      } else if (interval === 'weekly') {
        date.setDate(date.getDate() + (i * 7));
      }
      // If interval is 'none', all topics get the same date
      
      scheduledDates.push(date);
    }

    // Update all topics with their scheduled dates
    const updates = topics.map((topic, index) =>
      prisma.topicalTopic.update({
        where: { id: topic.id },
        data: {
          status: 'scheduled',
          scheduledFor: scheduledDates[index]
        }
      })
    );

    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      scheduled: topics.length,
      message: `${topics.length} topics zijn ingepland`
    });

  } catch (error) {
    console.error('Error scheduling topics:', error);
    return NextResponse.json(
      { error: 'Failed to schedule topics' },
      { status: 500 }
    );
  }
}
