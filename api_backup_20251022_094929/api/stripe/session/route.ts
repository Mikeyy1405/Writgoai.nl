
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Retrieve Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session.customer_email) {
      return NextResponse.json({ error: 'No email found' }, { status: 404 });
    }

    // Find client
    const client = await prisma.client.findUnique({
      where: { email: session.customer_email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Extract temporary password from phone field (TEMP storage)
    let tempPassword = '';
    if (client.phone?.startsWith('TEMP_PASSWORD:')) {
      tempPassword = client.phone.replace('TEMP_PASSWORD:', '');
      
      // Clear temp password after first retrieval
      await prisma.client.update({
        where: { id: client.id },
        data: { phone: null },
      });
    }

    return NextResponse.json({
      email: client.email,
      password: tempPassword || 'Neem contact op voor je wachtwoord',
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}
