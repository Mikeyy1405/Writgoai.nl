import { NextRequest, NextResponse } from 'next/server';
import { generateMonthlyInvoices } from '@/lib/automation/finance/invoice-generator';

/**
 * POST /api/cron/finance/monthly-invoices
 * Cron job to automatically generate monthly subscription invoices
 * Should be triggered on the 1st of every month
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Monthly Invoices Cron] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Monthly Invoices Cron] Starting monthly invoice generation...');

    const result = await generateMonthlyInvoices();

    console.log('[Monthly Invoices Cron] Completed:', {
      success: result.success,
      generated: result.invoicesGenerated,
      errors: result.errors.length,
    });

    return NextResponse.json({
      success: result.success,
      message: `Generated ${result.invoicesGenerated} invoices with ${result.errors.length} errors`,
      result,
    });
  } catch (error: any) {
    console.error('[Monthly Invoices Cron] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/finance/monthly-invoices
 * Test endpoint - should only work in development
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  console.log('[Monthly Invoices Cron] TEST RUN');
  
  const result = await generateMonthlyInvoices();

  return NextResponse.json({
    message: 'Test run completed',
    result,
  });
}
