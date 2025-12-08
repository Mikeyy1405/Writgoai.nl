import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { analyzeExpense, getExpenseInsights } from '@/lib/ai-finance';

const prisma = new PrismaClient();

/**
 * GET /api/finance/expenses
 * Get purchase invoices (expense tracking)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month';
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where: any = {};

    // Period filter
    const now = new Date();
    if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      where.invoiceDate = { gte: startOfMonth };
    } else if (period === 'quarter') {
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      where.invoiceDate = { gte: quarterStart };
    } else if (period === 'year') {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      where.invoiceDate = { gte: yearStart };
    }

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    // Get expenses
    const [expenses, total] = await Promise.all([
      prisma.purchaseInvoice.findMany({
        where,
        include: {
          expenseCategory: true,
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { invoiceDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.purchaseInvoice.count({ where }),
    ]);

    // Calculate totals
    const totals = await prisma.purchaseInvoice.aggregate({
      where,
      _sum: {
        subtotal: true,
        taxAmount: true,
        total: true,
      },
    });

    // Get category breakdown
    const categoryBreakdown = await prisma.purchaseInvoice.groupBy({
      by: ['category'],
      where: {
        invoiceDate: where.invoiceDate,
      },
      _sum: {
        total: true,
      },
      _count: {
        category: true,
      },
    });

    // Get insights using AI
    const startDate = where.invoiceDate?.gte || new Date(now.getFullYear(), 0, 1);
    const insights = await getExpenseInsights(startDate, now);

    return NextResponse.json({
      expenses,
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
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c.category || 'other',
        count: c._count.category,
        total: c._sum.total || 0,
      })),
      insights,
    });
  } catch (error: any) {
    console.error('[Finance Expenses API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/finance/expenses
 * Create a new expense or upload invoice
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      invoiceNumber,
      supplierName,
      supplierEmail,
      description,
      invoiceDate,
      dueDate,
      subtotal,
      taxAmount,
      total,
      category,
      notes,
      recurring,
      recurringPeriod,
      attachmentUrl,
    } = body;

    // Validate required fields
    if (!invoiceNumber || !supplierName || !invoiceDate || !total) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get similar expenses for AI analysis
    const similarExpenses = await prisma.purchaseInvoice.findMany({
      where: {
        OR: [
          { supplierName: { contains: supplierName, mode: 'insensitive' } },
          { description: { contains: description || '', mode: 'insensitive' } },
        ],
      },
      orderBy: { invoiceDate: 'desc' },
      take: 10,
    });

    // AI-powered categorization
    let aiAnalysis = null;
    let suggestedCategory = category;

    if (!category && description) {
      aiAnalysis = await analyzeExpense(
        description,
        total,
        supplierName,
        similarExpenses
      );
      suggestedCategory = aiAnalysis.categorization.category;
    }

    // Create expense
    const expense = await prisma.purchaseInvoice.create({
      data: {
        invoiceNumber,
        supplierName,
        supplierEmail,
        description,
        invoiceDate: new Date(invoiceDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal: subtotal || total / 1.21, // Assuming 21% VAT if not provided
        taxAmount: taxAmount || total - (total / 1.21),
        total,
        category: suggestedCategory,
        notes,
        recurring: recurring || false,
        recurringPeriod,
        attachmentUrl,
        status: 'pending',
        autoCategorizationAI: aiAnalysis ? JSON.parse(JSON.stringify(aiAnalysis)) : null,
      },
    });

    // Create financial alert if needed
    if (total > 5000) {
      await prisma.financialAlert.create({
        data: {
          type: 'high_expense',
          severity: 'warning',
          title: 'Hoge uitgave geregistreerd',
          message: `Nieuwe uitgave van €${total.toFixed(2)} van ${supplierName}`,
          relatedEntityId: expense.id,
          relatedEntityType: 'expense',
          actionRequired: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      expense,
      aiAnalysis,
    });
  } catch (error: any) {
    console.error('[Finance Expenses Create API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/finance/expenses/[id]
 * Update an expense
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing expense ID' }, { status: 400 });
    }

    const body = await req.json();

    const expense = await prisma.purchaseInvoice.update({
      where: { id },
      data: {
        ...body,
        invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        paidDate: body.paidDate ? new Date(body.paidDate) : undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      expense,
    });
  } catch (error: any) {
    console.error('[Finance Expenses Update API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/finance/expenses/[id]
 * Delete an expense
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing expense ID' }, { status: 400 });
    }

    await prisma.purchaseInvoice.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('[Finance Expenses Delete API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
