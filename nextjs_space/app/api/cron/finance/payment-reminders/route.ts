import { NextRequest, NextResponse } from 'next/server';
import { sendPaymentReminders, checkPaymentHealth } from '@/lib/automation/finance/payment-reminder';

/**
 * POST /api/cron/finance/payment-reminders
 * Cron job to send payment reminders for overdue invoices
 * Should be triggered daily
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Payment Reminders Cron] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Payment Reminders Cron] Starting payment reminder check...');

    // Send reminders
    const reminderResult = await sendPaymentReminders();

    // Check overall payment health
    await checkPaymentHealth();

    console.log('[Payment Reminders Cron] Completed:', {
      success: reminderResult.success,
      sent: reminderResult.remindersSent,
      errors: reminderResult.errors.length,
    });

    return NextResponse.json({
      success: reminderResult.success,
      message: `Sent ${reminderResult.remindersSent} reminders with ${reminderResult.errors.length} errors`,
      result: reminderResult,
    });
  } catch (error: any) {
    console.error('[Payment Reminders Cron] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/finance/payment-reminders
 * Test endpoint - should only work in development
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  console.log('[Payment Reminders Cron] TEST RUN');
  
  const result = await sendPaymentReminders();
  await checkPaymentHealth();

  return NextResponse.json({
    message: 'Test run completed',
    result,
  });
}
