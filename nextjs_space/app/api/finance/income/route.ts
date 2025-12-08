import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { getMoneybird } from '@/lib/moneybird';

const prisma = new PrismaClient();

/**
 * GET /api/finance/income
 * Get sales invoices (income tracking)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month'; // month, quarter, year
    const status = searchParams.get('status'); // paid, sent, overdue
    const clientId = searchParams.get('clientId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where: any = {};

    // Period filter
    const now = new Date();
    if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      where.issueDate = { gte: startOfMonth };
    } else if (period === 'quarter') {
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      where.issueDate = { gte: quarterStart };
    } else if (period === 'year') {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      where.issueDate = { gte: yearStart };
    }

    if (status) {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    // Get invoices
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: true,
        },
        orderBy: { issueDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    // Calculate totals
    const totals = await prisma.invoice.aggregate({
      where,
      _sum: {
        subtotal: true,
        taxAmount: true,
        total: true,
      },
    });

    // Get status breakdown
    const statusBreakdown = await prisma.invoice.groupBy({
      by: ['status'],
      where: {
        issueDate: where.issueDate,
      },
      _count: {
        status: true,
      },
      _sum: {
        total: true,
      },
    });

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      totals: {
        subtotal: totals._sum.subtotal || 0,
        taxAmount: totals._sum.taxAmount || 0,
        total: totals._sum.total || 0,
      },
      statusBreakdown: statusBreakdown.map((s) => ({
        status: s.status,
        count: s._count.status,
        total: s._sum.total || 0,
      })),
    });
  } catch (error: any) {
    console.error('[Finance Income API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/finance/income/sync
 * Sync sales invoices from Moneybird
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'sync') {
      // Sync from Moneybird
      const moneybird = getMoneybird();
      
      // Get all sales invoices from Moneybird
      const moneybirdInvoices = await moneybird.listSalesInvoices({
        period: 'this_year',
      });

      let synced = 0;
      let errors = 0;

      for (const mbInvoice of moneybirdInvoices) {
        try {
          // Find client by Moneybird contact ID
          const client = await prisma.client.findFirst({
            where: {
              moneybirdContactId: mbInvoice.contact_id,
            },
          });

          if (!client) {
            console.warn(`[Sync] No client found for Moneybird contact ${mbInvoice.contact_id}`);
            errors++;
            continue;
          }

          // Check if invoice already exists
          const existingInvoice = await prisma.invoice.findFirst({
            where: {
              moneybirdInvoiceId: mbInvoice.id,
            },
          });

          const invoiceData = {
            clientId: client.id,
            invoiceNumber: mbInvoice.invoice_id,
            status: mapMoneybirdState(mbInvoice.state),
            issueDate: new Date(mbInvoice.invoice_date),
            dueDate: mbInvoice.due_date ? new Date(mbInvoice.due_date) : null,
            subtotal: parseFloat(mbInvoice.total_price_excl_tax),
            taxAmount: parseFloat(mbInvoice.total_price_incl_tax) - parseFloat(mbInvoice.total_price_excl_tax),
            total: parseFloat(mbInvoice.total_price_incl_tax),
            moneybirdInvoiceId: mbInvoice.id,
            moneybirdState: mbInvoice.state,
          };

          if (existingInvoice) {
            await prisma.invoice.update({
              where: { id: existingInvoice.id },
              data: invoiceData,
            });
          } else {
            await prisma.invoice.create({
              data: invoiceData,
            });
          }

          synced++;
        } catch (err: any) {
          console.error(`[Sync] Error syncing invoice ${mbInvoice.id}:`, err);
          errors++;
        }
      }

      return NextResponse.json({
        success: true,
        synced,
        errors,
        total: moneybirdInvoices.length,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Finance Income Sync API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function mapMoneybirdState(state: string): string {
  const stateMap: Record<string, string> = {
    draft: 'draft',
    open: 'sent',
    scheduled: 'sent',
    pending_payment: 'sent',
    late: 'overdue',
    reminded: 'overdue',
    paid: 'paid',
    uncollectible: 'cancelled',
  };
  return stateMap[state] || 'draft';
}
