import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Generate invoice number
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: {
      invoiceNumber: {
        startsWith: `WG-${year}`
      }
    }
  });
  return `WG-${year}-${String(count + 1).padStart(4, '0')}`;
}

// GET all invoices
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');

    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (clientId) where.clientId = clientId;

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
          }
        },
        items: {
          include: {
            assignment: {
              select: {
                id: true,
                title: true,
              }
            }
          }
        },
        _count: {
          select: {
            items: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ invoices });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Kon facturen niet ophalen' }, { status: 500 });
  }
}

// POST create new invoice
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const body = await request.json();
    const {
      clientId,
      items,
      taxRate,
      notes,
      paymentTerms,
      dueDate,
    } = body;

    if (!clientId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Klant en minimaal 1 item zijn verplicht' },
        { status: 400 }
      );
    }

    const invoiceNumber = await generateInvoiceNumber();

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
    const finalTaxRate = taxRate ?? 21;
    const taxAmount = subtotal * (finalTaxRate / 100);
    const total = subtotal + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        clientId,
        invoiceNumber,
        subtotal,
        taxRate: finalTaxRate,
        taxAmount,
        total,
        notes: notes || null,
        paymentTerms: paymentTerms || '14 dagen',
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        items: {
          create: items.map((item: any) => ({
            assignmentId: item.assignmentId || null,
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
            total: (item.quantity || 1) * item.unitPrice,
          }))
        }
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        items: true,
      }
    });

    return NextResponse.json({ invoice });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Kon factuur niet aanmaken' }, { status: 500 });
  }
}
