import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/financien/btw
 * Haal BTW overzichten op
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year');
    const quarter = searchParams.get('quarter');

    // Als jaar en kwartaal gegeven, bereken BTW
    if (year && quarter) {
      const quarterInt = parseInt(quarter);
      const yearInt = parseInt(year);

      // Bereken start en einddatum van kwartaal
      const startMonth = (quarterInt - 1) * 3;
      const startDate = new Date(yearInt, startMonth, 1);
      const endDate = new Date(yearInt, startMonth + 3, 0);

      // Haal facturen op (verkoop)
      const salesInvoices = await prisma.invoice.findMany({
        where: {
          issueDate: {
            gte: startDate,
            lte: endDate,
          },
          status: 'paid',
        },
      });

      const totalSalesExclVat = salesInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
      const totalSalesVat = salesInvoices.reduce((sum, inv) => sum + inv.taxAmount, 0);

      // Haal inkopen op (uitgaven)
      const purchaseInvoices = await prisma.purchaseInvoice.findMany({
        where: {
          invoiceDate: {
            gte: startDate,
            lte: endDate,
          },
          status: 'paid',
        },
      });

      const totalPurchasesExclVat = purchaseInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
      const totalPurchasesVat = purchaseInvoices.reduce((sum, inv) => sum + inv.taxAmount, 0);

      const vatToPay = totalSalesVat - totalPurchasesVat;

      // Check of rapport al bestaat
      let report = await prisma.vATReport.findUnique({
        where: {
          year_quarter: {
            year: yearInt,
            quarter: quarterInt,
          },
        },
      });

      if (!report) {
        // Maak nieuw rapport aan
        report = await prisma.vATReport.create({
          data: {
            year: yearInt,
            quarter: quarterInt,
            startDate,
            endDate,
            totalSalesExclVat,
            totalSalesVat,
            totalPurchasesExclVat,
            totalPurchasesVat,
            vatToPay,
            status: 'draft',
          },
        });
      }

      return NextResponse.json({ report });
    }

    // Anders, haal alle rapporten op
    const reports = await prisma.vATReport.findMany({
      orderBy: [
        { year: 'desc' },
        { quarter: 'desc' },
      ],
    });

    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error('[Financien BTW API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/financien/btw
 * Update BTW rapport status
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, notes } = body;

    const report = await prisma.vATReport.update({
      where: { id },
      data: {
        status,
        notes,
        submittedAt: status === 'submitted' ? new Date() : undefined,
        paidAt: status === 'paid' ? new Date() : undefined,
      },
    });

    return NextResponse.json({ report });
  } catch (error: any) {
    console.error('[Financien BTW API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
