// AI-powered invoice pattern analysis and payment behavior prediction

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PaymentBehavior {
  clientId: string;
  clientName: string;
  averagePaymentDays: number;
  onTimePaymentRate: number;
  latePaymentRate: number;
  totalInvoices: number;
  totalPaid: number;
  totalOutstanding: number;
  behavior: 'excellent' | 'good' | 'fair' | 'poor';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface LatePaymentPrediction {
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  dueDate: Date;
  predictedDelayDays: number;
  probability: number;
  riskFactors: string[];
  recommendations: string[];
}

/**
 * Analyze payment behavior for a specific client
 */
export async function analyzeClientPaymentBehavior(clientId: string): Promise<PaymentBehavior> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      invoices: {
        orderBy: { issueDate: 'desc' },
      },
    },
  });

  if (!client) {
    throw new Error('Client not found');
  }

  const invoices = client.invoices;
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid' && inv.paidAt);

  // Calculate average payment days
  let totalPaymentDays = 0;
  let onTimeCount = 0;
  let lateCount = 0;

  paidInvoices.forEach((invoice) => {
    if (!invoice.paidAt || !invoice.dueDate) return;

    const paymentDays = Math.floor(
      (invoice.paidAt.getTime() - invoice.issueDate.getTime()) / (24 * 60 * 60 * 1000)
    );
    const dueDays = Math.floor(
      (invoice.dueDate.getTime() - invoice.issueDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    totalPaymentDays += paymentDays;

    if (paymentDays <= dueDays) {
      onTimeCount++;
    } else {
      lateCount++;
    }
  });

  const averagePaymentDays = paidInvoices.length > 0 ? totalPaymentDays / paidInvoices.length : 0;
  const onTimePaymentRate = paidInvoices.length > 0 ? (onTimeCount / paidInvoices.length) * 100 : 0;
  const latePaymentRate = paidInvoices.length > 0 ? (lateCount / paidInvoices.length) * 100 : 0;

  // Calculate totals
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalOutstanding = invoices
    .filter((inv) => ['sent', 'overdue'].includes(inv.status))
    .reduce((sum, inv) => sum + inv.total, 0);

  // Determine behavior rating
  let behavior: 'excellent' | 'good' | 'fair' | 'poor' = 'fair';
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';

  if (onTimePaymentRate >= 95 && averagePaymentDays <= 14) {
    behavior = 'excellent';
    riskLevel = 'low';
  } else if (onTimePaymentRate >= 80 && averagePaymentDays <= 30) {
    behavior = 'good';
    riskLevel = 'low';
  } else if (onTimePaymentRate >= 60) {
    behavior = 'fair';
    riskLevel = 'medium';
  } else {
    behavior = 'poor';
    riskLevel = 'high';
  }

  return {
    clientId: client.id,
    clientName: client.name,
    averagePaymentDays,
    onTimePaymentRate,
    latePaymentRate,
    totalInvoices: invoices.length,
    totalPaid,
    totalOutstanding,
    behavior,
    riskLevel,
  };
}

/**
 * Get payment behavior for all clients
 */
export async function getAllClientsPaymentBehavior(): Promise<PaymentBehavior[]> {
  const clients = await prisma.client.findMany({
    include: {
      invoices: true,
    },
  });

  const behaviors = await Promise.all(
    clients
      .filter((client) => client.invoices.length > 0)
      .map((client) => analyzeClientPaymentBehavior(client.id))
  );

  return behaviors.sort((a, b) => b.totalOutstanding - a.totalOutstanding);
}

/**
 * Predict late payment risk for outstanding invoices
 */
export async function predictLatePayments(): Promise<LatePaymentPrediction[]> {
  const outstandingInvoices = await prisma.invoice.findMany({
    where: {
      status: {
        in: ['sent', 'overdue'],
      },
    },
    include: {
      client: {
        include: {
          invoices: {
            where: {
              status: 'paid',
              paidAt: { not: null },
            },
          },
        },
      },
    },
  });

  const predictions: LatePaymentPrediction[] = [];

  for (const invoice of outstandingInvoices) {
    const prediction = await analyzeLatePaymentRisk(invoice);
    if (prediction.probability > 0.3) {
      // Only include if there's significant risk
      predictions.push(prediction);
    }
  }

  return predictions.sort((a, b) => b.probability - a.probability);
}

/**
 * Analyze late payment risk for a specific invoice
 */
async function analyzeLatePaymentRisk(invoice: any): Promise<LatePaymentPrediction> {
  const client = invoice.client;
  const historicalInvoices = client.invoices;

  const riskFactors: string[] = [];
  let riskScore = 0;

  // Factor 1: Historical payment behavior
  const paidInvoices = historicalInvoices.filter((inv: any) => inv.paidAt && inv.dueDate);
  if (paidInvoices.length > 0) {
    let latePayments = 0;
    let totalDelayDays = 0;

    paidInvoices.forEach((inv: any) => {
      const delay = Math.floor(
        (inv.paidAt.getTime() - inv.dueDate.getTime()) / (24 * 60 * 60 * 1000)
      );
      if (delay > 0) {
        latePayments++;
        totalDelayDays += delay;
      }
    });

    const lateRate = (latePayments / paidInvoices.length) * 100;
    if (lateRate > 50) {
      riskScore += 40;
      riskFactors.push(`${lateRate.toFixed(0)}% van facturen te laat betaald`);
    } else if (lateRate > 25) {
      riskScore += 20;
      riskFactors.push(`${lateRate.toFixed(0)}% van facturen te laat betaald`);
    }
  } else {
    // New client - higher risk
    riskScore += 30;
    riskFactors.push('Nieuwe klant zonder betalingsgeschiedenis');
  }

  // Factor 2: Invoice amount
  if (invoice.total > 1000) {
    riskScore += 10;
    riskFactors.push('Hoog factuurbedrag (>€1000)');
  } else if (invoice.total > 5000) {
    riskScore += 20;
    riskFactors.push('Zeer hoog factuurbedrag (>€5000)');
  }

  // Factor 3: Current overdue status
  if (invoice.status === 'overdue') {
    riskScore += 50;
    riskFactors.push('Factuur is al verlopen');
  }

  // Factor 4: Days until/past due
  const daysUntilDue = invoice.dueDate
    ? Math.floor((invoice.dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : 0;

  if (daysUntilDue < 0) {
    const daysOverdue = Math.abs(daysUntilDue);
    riskScore += Math.min(30, daysOverdue * 2);
    riskFactors.push(`${daysOverdue} dagen over vervaldatum`);
  }

  // Factor 5: Other outstanding invoices
  const otherOutstanding = await prisma.invoice.count({
    where: {
      clientId: client.id,
      status: {
        in: ['sent', 'overdue'],
      },
      id: {
        not: invoice.id,
      },
    },
  });

  if (otherOutstanding > 0) {
    riskScore += otherOutstanding * 10;
    riskFactors.push(`${otherOutstanding} andere openstaande facturen`);
  }

  // Calculate probability (0-1)
  const probability = Math.min(1, riskScore / 100);

  // Predict delay days based on historical data
  let predictedDelayDays = 0;
  if (paidInvoices.length > 0) {
    const delays = paidInvoices
      .filter((inv: any) => inv.paidAt && inv.dueDate)
      .map((inv: any) =>
        Math.max(
          0,
          Math.floor((inv.paidAt.getTime() - inv.dueDate.getTime()) / (24 * 60 * 60 * 1000))
        )
      );
    predictedDelayDays = delays.length > 0 ? Math.round(delays.reduce((a, b) => a + b) / delays.length) : 7;
  } else {
    predictedDelayDays = 7; // Default for new clients
  }

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (probability > 0.7) {
    recommendations.push('Stuur direct een herinnering');
    recommendations.push('Bel de klant om betalingsstatus te bespreken');
  } else if (probability > 0.5) {
    recommendations.push('Stuur een vriendelijke herinnering');
    recommendations.push('Monitor de factuur nauwlettend');
  } else if (probability > 0.3) {
    recommendations.push('Plan een herinnering 3 dagen voor vervaldatum');
  }

  if (invoice.total > 1000) {
    recommendations.push('Overweeg betalingsregeling aan te bieden');
  }

  if (otherOutstanding > 0) {
    recommendations.push('Vraag naar eventuele problemen met betalingen');
  }

  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    clientName: client.name,
    amount: invoice.total,
    dueDate: invoice.dueDate || invoice.issueDate,
    predictedDelayDays,
    probability,
    riskFactors,
    recommendations,
  };
}

/**
 * Get invoice patterns and insights
 */
export async function getInvoicePatterns(): Promise<{
  averageInvoiceValue: number;
  averagePaymentDays: number;
  onTimePaymentRate: number;
  monthlyPatterns: { month: string; count: number; total: number }[];
  topClients: { name: string; total: number; invoiceCount: number }[];
}> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const invoices = await prisma.invoice.findMany({
    where: {
      issueDate: {
        gte: sixMonthsAgo,
      },
    },
    include: {
      client: true,
    },
  });

  // Average invoice value
  const averageInvoiceValue =
    invoices.length > 0 ? invoices.reduce((sum, inv) => sum + inv.total, 0) / invoices.length : 0;

  // Payment days analysis
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid' && inv.paidAt);
  let totalPaymentDays = 0;
  let onTimeCount = 0;

  paidInvoices.forEach((invoice) => {
    if (!invoice.paidAt || !invoice.dueDate) return;

    const paymentDays = Math.floor(
      (invoice.paidAt.getTime() - invoice.issueDate.getTime()) / (24 * 60 * 60 * 1000)
    );
    const dueDays = Math.floor(
      (invoice.dueDate.getTime() - invoice.issueDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    totalPaymentDays += paymentDays;

    if (paymentDays <= dueDays) {
      onTimeCount++;
    }
  });

  const averagePaymentDays = paidInvoices.length > 0 ? totalPaymentDays / paidInvoices.length : 0;
  const onTimePaymentRate = paidInvoices.length > 0 ? (onTimeCount / paidInvoices.length) * 100 : 0;

  // Monthly patterns
  const monthlyData: Record<string, { count: number; total: number }> = {};
  invoices.forEach((invoice) => {
    const month = invoice.issueDate.toISOString().substring(0, 7);
    if (!monthlyData[month]) {
      monthlyData[month] = { count: 0, total: 0 };
    }
    monthlyData[month].count++;
    monthlyData[month].total += invoice.total;
  });

  const monthlyPatterns = Object.entries(monthlyData)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Top clients
  const clientTotals: Record<string, { name: string; total: number; count: number }> = {};
  invoices.forEach((invoice) => {
    const clientId = invoice.client.id;
    if (!clientTotals[clientId]) {
      clientTotals[clientId] = {
        name: invoice.client.name,
        total: 0,
        count: 0,
      };
    }
    clientTotals[clientId].total += invoice.total;
    clientTotals[clientId].count++;
  });

  const topClients = Object.values(clientTotals)
    .map((client) => ({
      name: client.name,
      total: client.total,
      invoiceCount: client.count,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return {
    averageInvoiceValue,
    averagePaymentDays,
    onTimePaymentRate,
    monthlyPatterns,
    topClients,
  };
}

/**
 * Generate automated payment reminder text
 */
export async function generatePaymentReminder(
  invoiceId: string,
  reminderType: 'friendly' | 'urgent' | 'final'
): Promise<string> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { client: true },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const daysOverdue = invoice.dueDate
    ? Math.floor((Date.now() - invoice.dueDate.getTime()) / (24 * 60 * 60 * 1000))
    : 0;

  let message = '';

  if (reminderType === 'friendly') {
    message = `Beste ${invoice.client.name},

Dit is een vriendelijke herinnering dat factuur ${invoice.invoiceNumber} van €${invoice.total.toFixed(2)} op ${invoice.dueDate?.toLocaleDateString('nl-NL')} vervalt.

Als je deze factuur al hebt betaald, beschouw dit bericht dan als niet verzonden.

Met vriendelijke groet,
WritgoAI Team`;
  } else if (reminderType === 'urgent') {
    message = `Beste ${invoice.client.name},

We hebben nog geen betaling ontvangen voor factuur ${invoice.invoiceNumber} van €${invoice.total.toFixed(2)}, die ${daysOverdue} dagen geleden verviel.

Graag ontvangen we de betaling zo spoedig mogelijk. Mocht er een probleem zijn, neem dan contact met ons op.

Met vriendelijke groet,
WritgoAI Team`;
  } else if (reminderType === 'final') {
    message = `Beste ${invoice.client.name},

Dit is onze laatste herinnering voor factuur ${invoice.invoiceNumber} van €${invoice.total.toFixed(2)}.

De betaling is nu ${daysOverdue} dagen te laat. Als we binnen 7 dagen geen betaling ontvangen, zijn we genoodzaakt verdere maatregelen te nemen.

Neem direct contact met ons op als er vragen zijn.

Met vriendelijke groet,
WritgoAI Team`;
  }

  return message;
}
