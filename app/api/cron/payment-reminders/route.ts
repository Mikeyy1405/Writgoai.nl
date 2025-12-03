import { NextRequest, NextResponse } from 'next/server';
import { checkAndSendPaymentReminders } from '@/lib/notification-helper';
import { prisma } from '@/lib/db';

/**
 * Cron endpoint to check for overdue invoices and send reminders
 * This should be called daily by a cron job or scheduled task
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication via secret token
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'writgo-cron-secret-2024';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Running payment reminders cron job...');

    // First, update invoice statuses
    const today = new Date();
    await prisma.invoice.updateMany({
      where: {
        status: 'sent',
        dueDate: {
          lt: today,
        },
      },
      data: {
        status: 'overdue',
      },
    });

    // Then send reminders
    const result = await checkAndSendPaymentReminders();

    return NextResponse.json({
      success: true,
      message: 'Payment reminders processed',
      ...result,
    });
  } catch (error) {
    console.error('Error in payment reminders cron:', error);
    return NextResponse.json(
      { error: 'Failed to process payment reminders' },
      { status: 500 }
    );
  }
}
