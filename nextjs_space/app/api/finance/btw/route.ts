import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/finance/btw
 * Get VAT/BTW reports
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const quarter = searchParams.get('quarter') ? parseInt(searchParams.get('quarter')!) : null;

    if (quarter) {
      // Get specific quarter
      const report = await prisma.vATReport.findUnique({
        where: {
          year_quarter: {
            year,
            quarter,
          },
        },
      });

      if (!report) {
        // Generate report if it doesn't exist
        const generatedReport = await generateVATReport(year, quarter);
        return NextResponse.json(generatedReport);
      }

      return NextResponse.json(report);
    } else {
      // Get all quarters for the year
      const reports = await prisma.vATReport.findMany({
        where: { year },
        orderBy: { quarter: 'asc' },
      });

      return NextResponse.json({ reports });
    }
  } catch (error: any) {
    console.error('[Finance BTW API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/finance/btw
 * Generate VAT report for a quarter
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { year, quarter } = body;

    if (!year || !quarter || quarter < 1 || quarter > 4) {
      return NextResponse.json(
        { error: 'Invalid year or quarter' },
        { status: 400 }
      );
    }

    const report = await generateVATReport(year, quarter);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('[Finance BTW Generate API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate VAT report for a specific quarter
 */
async function generateVATReport(year: number, quarter: number) {
  // Calculate quarter dates
  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0, 23, 59, 59);

  // Get all sales invoices (revenue) for the period
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

  // Get all purchase invoices (expenses) for the period
  const purchaseInvoices = await prisma.purchaseInvoice.findMany({
    where: {
      invoiceDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Calculate sales totals
  const totalSalesExclVat = salesInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
  const totalSalesVat = salesInvoices.reduce((sum, inv) => sum + inv.taxAmount, 0);

  // Calculate purchase totals
  const totalPurchasesExclVat = purchaseInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
  const totalPurchasesVat = purchaseInvoices.reduce((sum, inv) => sum + inv.taxAmount, 0);

  // Calculate VAT to pay (sales VAT - purchase VAT)
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
    },
    purchases: {
      count: purchaseInvoices.length,
      totalExclVat: totalPurchasesExclVat,
      totalVat: totalPurchasesVat,
      totalInclVat: totalPurchasesExclVat + totalPurchasesVat,
    },
    vatCalculation: {
      salesVat: totalSalesVat,
      purchaseVat: totalPurchasesVat,
      vatToPay: vatToPay,
      vatToPayOrReceive: vatToPay >= 0 ? 'te betalen' : 'terug te ontvangen',
    },
  };

  // Check if report already exists
  const existingReport = await prisma.vATReport.findUnique({
    where: {
      year_quarter: {
        year,
        quarter,
      },
    },
  });

  if (existingReport) {
    // Update existing report
    return await prisma.vATReport.update({
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
    // Create new report
    return await prisma.vATReport.create({
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
}

/**
 * PATCH /api/finance/btw/[id]
 * Update VAT report status
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing report ID' }, { status: 400 });
    }

    const body = await req.json();
    const { status, notes } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      
      if (status === 'submitted') {
        updateData.submittedAt = new Date();
      } else if (status === 'paid') {
        updateData.paidAt = new Date();
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const report = await prisma.vATReport.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('[Finance BTW Update API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
