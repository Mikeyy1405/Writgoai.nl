import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/cron/finance/vat-calculation
 * Cron job to calculate quarterly VAT reports
 * Should be triggered at the end of each quarter
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[VAT Calculation Cron] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[VAT Calculation Cron] Starting quarterly VAT calculation...');

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3) + 1;

    // Calculate for the previous quarter
    let year = currentYear;
    let quarter = currentQuarter - 1;

    if (quarter === 0) {
      quarter = 4;
      year = currentYear - 1;
    }

    console.log(`[VAT Calculation Cron] Calculating for Q${quarter} ${year}`);

    // Check if report already exists
    const existingReport = await prisma.vATReport.findUnique({
      where: {
        year_quarter: {
          year,
          quarter,
        },
      },
    });

    if (existingReport && existingReport.status !== 'draft') {
      console.log('[VAT Calculation Cron] Report already exists and is not draft');
      return NextResponse.json({
        success: true,
        message: 'Report already exists',
        report: existingReport,
      });
    }

    // Calculate quarter dates
    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 3, 0, 23, 59, 59);

    // Get all sales invoices for the period
    const salesInvoices = await prisma.invoice.findMany({
      where: {
        issueDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['paid', 'sent'],
        },
      },
    });

    // Get all purchase invoices for the period
    const purchaseInvoices = await prisma.purchaseInvoice.findMany({
      where: {
        invoiceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate totals
    const totalSalesExclVat = salesInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
    const totalSalesVat = salesInvoices.reduce((sum, inv) => sum + inv.taxAmount, 0);
    const totalPurchasesExclVat = purchaseInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
    const totalPurchasesVat = purchaseInvoices.reduce((sum, inv) => sum + inv.taxAmount, 0);
    const vatToPay = totalSalesVat - totalPurchasesVat;

    // Create detailed breakdown
    const reportData = {
      period: `Q${quarter} ${year}`,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      sales: {
        count: salesInvoices.length,
        totalExclVat: totalSalesExclVat,
        totalVat: totalSalesVat,
        totalInclVat: totalSalesExclVat + totalSalesVat,
        byMonth: groupByMonth(salesInvoices, 'issueDate'),
      },
      purchases: {
        count: purchaseInvoices.length,
        totalExclVat: totalPurchasesExclVat,
        totalVat: totalPurchasesVat,
        totalInclVat: totalPurchasesExclVat + totalPurchasesVat,
        byMonth: groupByMonth(purchaseInvoices, 'invoiceDate'),
      },
      vatCalculation: {
        salesVat: totalSalesVat,
        purchaseVat: totalPurchasesVat,
        vatToPay: vatToPay,
        vatToPayOrReceive: vatToPay >= 0 ? 'te betalen' : 'terug te ontvangen',
      },
    };

    // Create or update report
    let report;
    if (existingReport) {
      report = await prisma.vATReport.update({
        where: { id: existingReport.id },
        data: {
          startDate,
          endDate,
          totalSalesExclVat,
          totalSalesVat,
          totalPurchasesExclVat,
          totalPurchasesVat,
          vatToPay,
          reportData: JSON.parse(JSON.stringify(reportData)),
          updatedAt: new Date(),
        },
      });
    } else {
      report = await prisma.vATReport.create({
        data: {
          year,
          quarter,
          startDate,
          endDate,
          totalSalesExclVat,
          totalSalesVat,
          totalPurchasesExclVat,
          totalPurchasesVat,
          vatToPay,
          status: 'draft',
          reportData: JSON.parse(JSON.stringify(reportData)),
        },
      });
    }

    console.log('[VAT Calculation Cron] Report generated:', report.id);

    // Create financial alert
    await prisma.financialAlert.create({
      data: {
        type: 'vat_report',
        severity: vatToPay > 5000 ? 'warning' : 'info',
        title: `BTW aangifte Q${quarter} ${year} klaar`,
        message: `Totaal ${vatToPay >= 0 ? 'te betalen' : 'terug te ontvangen'}: €${Math.abs(vatToPay).toFixed(2)}`,
        relatedEntityId: report.id,
        relatedEntityType: 'vat_report',
        actionRequired: true,
        actionUrl: '/admin/finance/btw',
      },
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('[VAT Calculation Cron] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Group invoices by month
 */
function groupByMonth(invoices: any[], dateField: string): Record<string, any> {
  const grouped: Record<string, any> = {};

  invoices.forEach((invoice) => {
    const date = invoice[dateField];
    if (!date) return;

    const month = date.toISOString().substring(0, 7); // YYYY-MM
    if (!grouped[month]) {
      grouped[month] = {
        count: 0,
        totalExclVat: 0,
        totalVat: 0,
        total: 0,
      };
    }

    grouped[month].count++;
    grouped[month].totalExclVat += invoice.subtotal || 0;
    grouped[month].totalVat += invoice.taxAmount || 0;
    grouped[month].total += invoice.total || 0;
  });

  return grouped;
}

/**
 * GET /api/cron/finance/vat-calculation
 * Test endpoint - should only work in development
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  console.log('[VAT Calculation Cron] TEST RUN');
  
  // Call POST handler for test
  return POST(req);
}
