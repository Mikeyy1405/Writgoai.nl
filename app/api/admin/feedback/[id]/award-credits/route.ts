
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma as db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { credits } = await request.json();

    // Get feedback
    const feedback = await db.feedback.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    // Check if credits already awarded
    if (feedback.creditsAwarded > 0) {
      return NextResponse.json(
        { error: 'Credits already awarded for this feedback' },
        { status: 400 }
      );
    }

    // Check hourly limit (max 10 credits per hour per user)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentFeedback = await db.feedback.findMany({
      where: {
        clientId: feedback.clientId,
        createdAt: { gte: oneHourAgo },
        creditsAwarded: { gt: 0 }
      }
    });

    const totalCreditsLastHour = recentFeedback.reduce(
      (sum, f) => sum + f.creditsAwarded,
      0
    );

    if (totalCreditsLastHour + credits > 10) {
      return NextResponse.json(
        {
          error: `Limiet bereikt: max 10 credits per uur. ${totalCreditsLastHour} al toegekend.`
        },
        { status: 400 }
      );
    }

    // Award credits
    const [updatedFeedback, updatedClient] = await db.$transaction([
      db.feedback.update({
        where: { id },
        data: {
          creditsAwarded: credits,
          status: 'completed'
        }
      }),
      db.client.update({
        where: { id: feedback.clientId },
        data: {
          topUpCredits: { increment: credits }
        }
      }),
      db.creditTransaction.create({
        data: {
          clientId: feedback.clientId,
          amount: credits,
          type: 'feedback_reward',
          description: `Feedback reward: ${feedback.title}`,
          balanceAfter: feedback.client.subscriptionCredits + feedback.client.topUpCredits + credits
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      feedback: updatedFeedback,
      client: updatedClient
    });
  } catch (error) {
    console.error('Error awarding credits:', error);
    return NextResponse.json(
      { error: 'Failed to award credits' },
      { status: 500 }
    );
  }
}
