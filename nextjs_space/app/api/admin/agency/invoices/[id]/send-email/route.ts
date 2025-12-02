import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { sendEmail, emailTemplates } from '@/lib/email-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if ((user?.role !== 'admin' && user?.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get invoice with client
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        client: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Invoice is already paid' },
        { status: 400 }
      );
    }

    // Ensure invoice has a payment URL
    if (!invoice.stripePaymentUrl) {
      return NextResponse.json(
        { error: 'No payment URL available. Please generate a payment link first.' },
        { status: 400 }
      );
    }

    // Send email
    const emailHtml = emailTemplates.invoiceSent(
      invoice.invoiceNumber,
      invoice.total,
      invoice.dueDate.toISOString(),
      invoice.stripePaymentUrl,
      invoice.client.name
    );

    const result = await sendEmail({
      to: invoice.client.email,
      subject: `Factuur ${invoice.invoiceNumber} - WritGo AI`,
      html: emailHtml,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    // Update invoice status to 'sent' if it was 'draft'
    if (invoice.status === 'draft') {
      await prisma.invoice.update({
        where: { id: params.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
