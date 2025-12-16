import { prisma } from '../db';
// AI-powered financial chat assistant for natural language queries

import { calculateMRR, predictMRR, getGrowthMetrics } from './revenue-predictor';
import { getExpenseInsights } from './expense-analyzer';
import { getInvoicePatterns, predictLatePayments } from './invoice-analyzer';


export interface ChatResponse {
  answer: string;
  data?: any;
  visualization?: 'chart' | 'table' | 'metric';
  suggestions?: string[];
}

/**
 * Process natural language financial queries
 */
export async function processFinancialQuery(query: string): Promise<ChatResponse> {
  const normalizedQuery = query.toLowerCase();

  // Revenue queries
  if (
    normalizedQuery.includes('revenue') ||
    normalizedQuery.includes('omzet') ||
    normalizedQuery.includes('mrr') ||
    normalizedQuery.includes('arr')
  ) {
    return handleRevenueQuery(normalizedQuery);
  }

  // Expense queries
  if (
    normalizedQuery.includes('expense') ||
    normalizedQuery.includes('uitgave') ||
    normalizedQuery.includes('kosten') ||
    normalizedQuery.includes('cost')
  ) {
    return handleExpenseQuery(normalizedQuery);
  }

  // Invoice queries
  if (
    normalizedQuery.includes('invoice') ||
    normalizedQuery.includes('factuur') ||
    normalizedQuery.includes('payment') ||
    normalizedQuery.includes('betaling')
  ) {
    return handleInvoiceQuery(normalizedQuery);
  }

  // Growth queries
  if (
    normalizedQuery.includes('growth') ||
    normalizedQuery.includes('groei') ||
    normalizedQuery.includes('trend')
  ) {
    return handleGrowthQuery(normalizedQuery);
  }

  // Client queries
  if (
    normalizedQuery.includes('client') ||
    normalizedQuery.includes('klant') ||
    normalizedQuery.includes('customer')
  ) {
    return handleClientQuery(normalizedQuery);
  }

  // Default response
  return {
    answer: 'Ik kan je helpen met vragen over omzet, kosten, facturen, groei en klanten. Stel gerust een vraag!',
    suggestions: [
      'Wat is onze huidige MRR?',
      'Toon me de uitgaven van deze maand',
      'Welke facturen zijn nog openstaand?',
      'Hoe is onze groei afgelopen kwartaal?',
      'Welke klanten hebben betalingsachterstanden?',
    ],
  };
}

/**
 * Handle revenue-related queries
 */
async function handleRevenueQuery(query: string): Promise<ChatResponse> {
  if (query.includes('predict') || query.includes('voorspel') || query.includes('forecast')) {
    const forecasts = await predictMRR(3);
    const currentForecast = forecasts[0];

    return {
      answer: `Onze huidige MRR is €${currentForecast.currentMRR.toFixed(2)}. Gebaseerd op historische data voorspel ik een MRR van €${currentForecast.predictedMRR.toFixed(2)} over 3 maanden, wat neerkomt op een groei van ${currentForecast.growth.toFixed(1)}%.`,
      data: forecasts,
      visualization: 'chart',
      suggestions: [
        'Wat zijn de belangrijkste groeifactoren?',
        'Hoe kan ik de MRR verhogen?',
        'Toon me de MRR per abonnement type',
      ],
    };
  }

  const mrrData = await calculateMRR();

  return {
    answer: `Onze huidige Monthly Recurring Revenue (MRR) is €${mrrData.mrr.toFixed(2)} van ${mrrData.activeSubscriptions} actieve abonnementen. De gemiddelde omzet per klant is €${mrrData.averageRevenuePerClient.toFixed(2)}.`,
    data: mrrData,
    visualization: 'metric',
    suggestions: [
      'Voorspel de MRR voor de komende maanden',
      'Toon me de omzet per abonnement type',
      'Welke klanten dragen het meest bij aan de omzet?',
    ],
  };
}

/**
 * Handle expense-related queries
 */
async function handleExpenseQuery(query: string): Promise<ChatResponse> {
  const endDate = new Date();
  const startDate = new Date();

  // Determine time period from query
  if (query.includes('month') || query.includes('maand')) {
    startDate.setMonth(startDate.getMonth() - 1);
  } else if (query.includes('quarter') || query.includes('kwartaal')) {
    startDate.setMonth(startDate.getMonth() - 3);
  } else if (query.includes('year') || query.includes('jaar')) {
    startDate.setFullYear(startDate.getFullYear() - 1);
  } else {
    // Default to current month
    startDate.setDate(1);
  }

  const insights = await getExpenseInsights(startDate, endDate);

  const topCategory = Object.entries(insights.categoryBreakdown)
    .sort(([, a], [, b]) => (b as number) - (a as number))[0];

  return {
    answer: `De totale uitgaven zijn €${insights.totalExpenses.toFixed(2)}. De hoogste categorie is '${topCategory?.[0] || 'onbekend'}' met €${topCategory?.[1]?.toFixed(2) || 0}. De top 3 leveranciers zijn: ${insights.topSuppliers.slice(0, 3).map(s => `${s.name} (€${s.total.toFixed(2)})`).join(', ')}.`,
    data: insights,
    visualization: 'chart',
    suggestions: [
      'Waar kan ik op besparen?',
      'Vergelijk uitgaven met vorige maand',
      'Toon me terugkerende kosten',
    ],
  };
}

/**
 * Handle invoice-related queries
 */
async function handleInvoiceQuery(query: string): Promise<ChatResponse> {
  if (query.includes('overdue') || query.includes('verlopen') || query.includes('achterstand')) {
    const latePayments = await predictLatePayments();
    const totalOutstanding = latePayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      answer: `Er zijn ${latePayments.length} facturen met betalingsrisico, totaal €${totalOutstanding.toFixed(2)}. De top risico's zijn: ${latePayments.slice(0, 3).map(p => `${p.clientName} (€${p.amount.toFixed(2)}, ${Math.round(p.probability * 100)}% risico)`).join(', ')}.`,
      data: latePayments,
      visualization: 'table',
      suggestions: [
        'Stuur herinneringen naar deze klanten',
        'Toon me de betalingsgeschiedenis per klant',
        'Welke acties moet ik ondernemen?',
      ],
    };
  }

  if (query.includes('pattern') || query.includes('patroon') || query.includes('trend')) {
    const patterns = await getInvoicePatterns();

    return {
      answer: `De gemiddelde factuurwaarde is €${patterns.averageInvoiceValue.toFixed(2)}. Klanten betalen gemiddeld binnen ${patterns.averagePaymentDays.toFixed(0)} dagen, met een on-time rate van ${patterns.onTimePaymentRate.toFixed(1)}%.`,
      data: patterns,
      visualization: 'chart',
      suggestions: [
        'Welke klanten betalen het snelst?',
        'Hoe kan ik betalingen versnellen?',
        'Toon me maandelijkse facturatietrends',
      ],
    };
  }

  // Default: outstanding invoices
  const outstandingInvoices = await prisma.invoice.findMany({
    where: {
      status: {
        in: ['sent', 'overdue'],
      },
    },
    include: {
      client: true,
    },
    orderBy: {
      issueDate: 'desc',
    },
  });

  const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + inv.total, 0);

  return {
    answer: `Er zijn ${outstandingInvoices.length} openstaande facturen met een totaalwaarde van €${totalOutstanding.toFixed(2)}.`,
    data: outstandingInvoices.slice(0, 10),
    visualization: 'table',
    suggestions: [
      'Welke facturen zijn al verlopen?',
      'Stuur betalingsherinneringen',
      'Toon me de betalingsgeschiedenis',
    ],
  };
}

/**
 * Handle growth-related queries
 */
async function handleGrowthQuery(query: string): Promise<ChatResponse> {
  const metrics = await getGrowthMetrics();

  const bestMetric = Math.max(
    metrics.monthOverMonth,
    metrics.quarterOverQuarter,
    metrics.yearOverYear
  );

  let period = 'maand';
  let growth = metrics.monthOverMonth;

  if (bestMetric === metrics.quarterOverQuarter) {
    period = 'kwartaal';
    growth = metrics.quarterOverQuarter;
  } else if (bestMetric === metrics.yearOverYear) {
    period = 'jaar';
    growth = metrics.yearOverYear;
  }

  return {
    answer: `Onze groei is ${growth >= 0 ? 'positief' : 'negatief'}: ${Math.abs(growth).toFixed(1)}% ten opzichte van vorig ${period}. Month-over-month: ${metrics.monthOverMonth.toFixed(1)}%, Quarter-over-quarter: ${metrics.quarterOverQuarter.toFixed(1)}%, Year-over-year: ${metrics.yearOverYear.toFixed(1)}%.`,
    data: metrics,
    visualization: 'chart',
    suggestions: [
      'Wat zijn de belangrijkste groeimotoren?',
      'Hoe kunnen we de groei verbeteren?',
      'Vergelijk met industrie benchmarks',
    ],
  };
}

/**
 * Handle client-related queries
 */
async function handleClientQuery(query: string): Promise<ChatResponse> {
  if (query.includes('churn') || query.includes('risk') || query.includes('risico')) {
    const { predictChurnRisk } = await import('./revenue-predictor');
    const predictions = await predictChurnRisk();
    
    const highRiskClients = predictions.filter(p => p.churnRisk === 'high');
    
    return {
      answer: `Gevonden: ${predictions.length} klanten met verhoogd churn risico. ${highRiskClients.length} klanten hebben hoog risico. Top risico's: ${predictions.slice(0, 3).map(p => `${p.clientName} (${p.riskScore}%)`).join(', ')}`,
      data: predictions,
      visualization: 'table',
      suggestions: [
        'Toon klanten met laag gebruik',
        'Welke klanten hebben betalingsachterstanden?',
        'Toon me nieuwe klanten zonder activiteit',
      ],
    };
  }

  if (query.includes('top') || query.includes('beste') || query.includes('highest')) {
    const topClients = await prisma.client.findMany({
      include: {
        invoices: {
          where: {
            status: 'paid',
          },
        },
      },
      take: 100,
    });

    const clientRevenues = topClients.map((client) => ({
      name: client.name,
      revenue: client.invoices.reduce((sum, inv) => sum + inv.total, 0),
      invoiceCount: client.invoices.length,
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    return {
      answer: `De top 10 klanten op basis van omzet zijn: ${clientRevenues.slice(0, 3).map(c => `${c.name} (€${c.revenue.toFixed(2)})`).join(', ')}.`,
      data: clientRevenues,
      visualization: 'table',
      suggestions: [
        'Welke klanten zijn recent gestart?',
        'Toon me klanten met betalingsachterstanden',
        'Welke klanten hebben weinig gebruik?',
      ],
    };
  }

  // Default: client stats
  const totalClients = await prisma.client.count();
  const activeClients = await prisma.client.count({
    where: {
      subscriptionStatus: 'active',
    },
  });

  return {
    answer: `We hebben ${totalClients} klanten in totaal, waarvan ${activeClients} actieve abonnementen.`,
    suggestions: [
      'Toon me de top klanten',
      'Welke klanten hebben churn risico?',
      'Analyseer klantgedrag',
    ],
  };
}

/**
 * Get quick financial summary for dashboard
 */
export async function getQuickFinancialSummary(): Promise<{
  mrr: number;
  totalExpenses: number;
  outstandingInvoices: number;
  outstandingAmount: number;
  alerts: string[];
}> {
  const mrrData = await calculateMRR();

  // Get expenses for current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const expenses = await getExpenseInsights(startOfMonth, new Date());

  // Get outstanding invoices
  const outstandingInvoices = await prisma.invoice.findMany({
    where: {
      status: {
        in: ['sent', 'overdue'],
      },
    },
  });

  const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + inv.total, 0);

  // Generate alerts
  const alerts: string[] = [];
  
  const overdueInvoices = outstandingInvoices.filter(inv => inv.status === 'overdue');
  if (overdueInvoices.length > 0) {
    alerts.push(`${overdueInvoices.length} verlopen facturen`);
  }

  if (expenses.totalExpenses > mrrData.mrr * 0.7) {
    alerts.push('Hoge uitgaven deze maand (>70% van MRR)');
  }

  if (mrrData.activeSubscriptions < 10) {
    alerts.push('Lage klantbasis - focus op acquisitie');
  }

  return {
    mrr: mrrData.mrr,
    totalExpenses: expenses.totalExpenses,
    outstandingInvoices: outstandingInvoices.length,
    outstandingAmount,
    alerts,
  };
}
