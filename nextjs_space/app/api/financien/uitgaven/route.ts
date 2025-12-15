import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getMoneybird } from '@/lib/moneybird';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/financien/uitgaven
 * Haal alle uitgaven/inkoopfacturen op
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
    const state = searchParams.get('state');
    const period = searchParams.get('period');
    const category = searchParams.get('category');

    // Haal uit database (met categorie filter indien gegeven)
    const where: any = {};
    if (state) where.status = state;
    if (category) where.category = category;
    if (period) {
      const [year, month] = period.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      where.invoiceDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    const expenses = await prisma.purchaseInvoice.findMany({
      where,
      orderBy: { invoiceDate: 'desc' },
      include: {
        expenseCategory: true,
      },
    });

    // Haal ook categorieën op
    const categories = await prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ expenses, categories });
  } catch (error: any) {
    console.error('[Financien Uitgaven API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/financien/uitgaven
 * Maak een nieuwe uitgave aan
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

    // Maak aan in database
    const expense = await prisma.purchaseInvoice.create({
      data: body,
    });

    // Optioneel: sync naar Moneybird indien gewenst
    if (body.syncToMoneybird) {
      try {
        const moneybird = getMoneybird();
        const moneybirdInvoice = await moneybird.createPurchaseInvoice({
          contact_id: body.contactId,
          invoice_date: body.invoiceDate,
          due_date: body.dueDate,
          reference: body.invoiceNumber,
          details_attributes: [
            {
              description: body.description || body.supplierName,
              price: body.subtotal.toString(),
              amount: '1',
            },
          ],
        });

        // Update met Moneybird ID
        await prisma.purchaseInvoice.update({
          where: { id: expense.id },
          data: { moneybirdInvoiceId: moneybirdInvoice.id },
        });
      } catch (mbError) {
        console.error('Failed to sync to Moneybird:', mbError);
      }
    }

    return NextResponse.json({ expense });
  } catch (error: any) {
    console.error('[Financien Uitgaven API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
