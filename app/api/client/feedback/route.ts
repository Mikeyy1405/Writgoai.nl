
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma as db } from '@/lib/db';
import { sendEmail } from '@/lib/email';

/**
 * POST /api/client/feedback - Submit feedback
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client
    const client = await db.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { category, title, description, rating, screenshotUrl } = await request.json();

    // Check hourly limit
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentFeedback = await db.feedback.findMany({
      where: {
        clientId: client.id,
        createdAt: { gte: oneHourAgo }
      }
    });

    if (recentFeedback.length >= 2) {
      return NextResponse.json(
        { error: 'Je kunt maximaal 2 feedback items per uur indienen' },
        { status: 429 }
      );
    }

    // Create feedback
    const feedback = await db.feedback.create({
      data: {
        clientId: client.id,
        category,
        title,
        description,
        rating: rating || null,
        screenshotUrl: screenshotUrl || null,
        priority: 'normal',
        status: 'pending',
        attachments: []
      }
    });

    // Notify admin
    try {
      await sendEmail({
        to: 'support@WritgoAI.nl',
        subject: `Nieuwe feedback: ${title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FF6B35;">Nieuwe Feedback Ontvangen</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Van:</strong> ${client.name} (${client.email})</p>
              <p><strong>Categorie:</strong> ${category}</p>
              <p><strong>Titel:</strong> ${title}</p>
              <p><strong>Beschrijving:</strong></p>
              <p style="white-space: pre-wrap;">${description}</p>
              ${rating ? `<p><strong>Rating:</strong> ${rating}/5 sterren</p>` : ''}
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard?tab=feedback" 
               style="background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Bekijk feedback
            </a>
          </div>
        `,
        text: `Nieuwe feedback van ${client.name} (${client.email})\n\nCategorie: ${category}\nTitel: ${title}\n\n${description}`
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
    }

    return NextResponse.json({
      success: true,
      feedback,
      message: 'Feedback succesvol ingediend! Je ontvangt 5 credits zodra deze is beoordeeld.'
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/client/feedback - Get client's feedback
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await db.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const feedback = await db.feedback.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}
