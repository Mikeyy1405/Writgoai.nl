// AI-powered revenue prediction and forecasting



export interface RevenueForecast {
  currentMRR: number;
  predictedMRR: number;
  growth: number;
  confidence: number;
  factors: string[];
}

export interface ChurnPrediction {
  clientId: string;
  clientName: string;
  churnRisk: 'high' | 'medium' | 'low';
  riskScore: number;
  reasons: string[];
  recommendations: string[];
}

/**
 * Calculate Monthly Recurring Revenue (MRR)
 */
export async function calculateMRR(): Promise<{
  mrr: number;
  activeSubscriptions: number;
  averageRevenuePerClient: number;
  breakdown: Record<string, number>;
}> {
  const activeClients = await prisma.client.findMany({
    where: {
      subscriptionStatus: 'active',
    },
    select: {
      id: true,
      subscriptionPlan: true,
      monthlyCredits: true,
      subscriptionCredits: true,
    },
  });

  // Plan pricing (should match your actual pricing)
  const planPricing: Record<string, number> = {
    basis: 29,
    professional: 79,
    business: 199,
    enterprise: 499,
  };

  let mrr = 0;
  const breakdown: Record<string, number> = {};

  activeClients.forEach((client) => {
    const plan = (client.subscriptionPlan || 'basis').toLowerCase();
    const revenue = planPricing[plan] || 0;
    mrr += revenue;
    breakdown[plan] = (breakdown[plan] || 0) + revenue;
  });

  return {
    mrr,
    activeSubscriptions: activeClients.length,
    averageRevenuePerClient: activeClients.length > 0 ? mrr / activeClients.length : 0,
    breakdown,
  };
}

/**
 * Predict future MRR based on trends
 */
export async function predictMRR(monthsAhead: number = 3): Promise<RevenueForecast[]> {
  // Get historical MRR data from invoices
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const invoices = await prisma.invoice.findMany({
    where: {
      issueDate: {
        gte: sixMonthsAgo,
      },
      status: {
        in: ['paid', 'sent'],
      },
    },
    orderBy: {
      issueDate: 'asc',
    },
  });

  // Group by month
  const monthlyRevenue: Record<string, number> = {};
  invoices.forEach((invoice) => {
    const month = invoice.issueDate.toISOString().substring(0, 7);
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + invoice.total;
  });

  const months = Object.keys(monthlyRevenue).sort();
  const revenues = months.map((m) => monthlyRevenue[m]);

  if (revenues.length < 3) {
    // Not enough data for prediction
    const currentMRR = await calculateMRR();
    return [{
      currentMRR: currentMRR.mrr,
      predictedMRR: currentMRR.mrr,
      growth: 0,
      confidence: 0.3,
      factors: ['Onvoldoende historische data voor accurate voorspelling'],
    }];
  }

  // Simple linear regression for trend
  const avgGrowth = calculateAverageGrowth(revenues);
  const currentMRR = revenues[revenues.length - 1];

  const forecasts: RevenueForecast[] = [];
  
  for (let i = 1; i <= monthsAhead; i++) {
    const predictedMRR = currentMRR * Math.pow(1 + avgGrowth, i);
    const growth = avgGrowth * 100;
    
    forecasts.push({
      currentMRR,
      predictedMRR,
      growth,
      confidence: Math.max(0.5, 0.9 - (i * 0.1)), // Confidence decreases with time
      factors: [
        `Gebaseerd op ${revenues.length} maanden historische data`,
        `Gemiddelde groei: ${growth.toFixed(1)}% per maand`,
        growth > 0 ? 'Positieve trend gedetecteerd' : 'Negatieve trend gedetecteerd',
      ],
    });
  }

  return forecasts;
}

/**
 * Calculate average monthly growth rate
 */
function calculateAverageGrowth(revenues: number[]): number {
  if (revenues.length < 2) return 0;

  let totalGrowth = 0;
  for (let i = 1; i < revenues.length; i++) {
    const growth = (revenues[i] - revenues[i - 1]) / revenues[i - 1];
    totalGrowth += growth;
  }

  return totalGrowth / (revenues.length - 1);
}

/**
 * Predict client churn risk
 */
export async function predictChurnRisk(): Promise<ChurnPrediction[]> {
  const clients = await prisma.client.findMany({
    where: {
      subscriptionStatus: 'active',
    },
    include: {
      invoices: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
          },
        },
      },
      creditTransactions: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      },
    },
  });

  const predictions: ChurnPrediction[] = [];

  for (const client of clients) {
    const analysis = analyzeClientChurnRisk(client);
    if (analysis.riskScore > 30) {
      // Only include clients with some risk
      predictions.push({
        clientId: client.id,
        clientName: client.name,
        churnRisk: analysis.riskScore > 70 ? 'high' : analysis.riskScore > 50 ? 'medium' : 'low',
        riskScore: analysis.riskScore,
        reasons: analysis.reasons,
        recommendations: analysis.recommendations,
      });
    }
  }

  return predictions.sort((a, b) => b.riskScore - a.riskScore);
}

/**
 * Analyze individual client churn risk
 */
function analyzeClientChurnRisk(client: any): {
  riskScore: number;
  reasons: string[];
  recommendations: string[];
} {
  let riskScore = 0;
  const reasons: string[] = [];
  const recommendations: string[] = [];

  // Factor 1: Payment issues
  const overdueInvoices = client.invoices.filter((inv: any) => inv.status === 'overdue');
  if (overdueInvoices.length > 0) {
    riskScore += 25;
    reasons.push(`${overdueInvoices.length} openstaande facturen`);
    recommendations.push('Stuur betalingsherinnering en bied betalingsregeling aan');
  }

  // Factor 2: Low usage
  const recentCreditsUsed = client.creditTransactions.filter(
    (t: any) => t.type === 'usage'
  ).length;
  
  if (recentCreditsUsed < 5) {
    riskScore += 20;
    reasons.push('Lage platform activiteit (< 5 acties in 30 dagen)');
    recommendations.push('Neem contact op om te vragen of ze hulp nodig hebben');
  }

  // Factor 3: Time since onboarding
  const daysSinceCreation = Math.floor(
    (Date.now() - client.createdAt.getTime()) / (24 * 60 * 60 * 1000)
  );
  
  if (daysSinceCreation < 14 && recentCreditsUsed === 0) {
    riskScore += 30;
    reasons.push('Nieuwe klant zonder activiteit');
    recommendations.push('Bied onboarding sessie aan');
  }

  // Factor 4: Downgrade history
  const subscriptionChanges = client.creditTransactions.filter(
    (t: any) => t.description?.includes('downgrade')
  );
  
  if (subscriptionChanges.length > 0) {
    riskScore += 15;
    reasons.push('Recente downgrade van abonnement');
    recommendations.push('Vraag naar feedback en bied extra waarde');
  }

  // Factor 5: Credit balance
  const totalCredits = client.subscriptionCredits + client.topUpCredits;
  if (totalCredits < 10) {
    riskScore += 10;
    reasons.push('Lage credit balans');
    recommendations.push('Bied credit top-up met korting aan');
  }

  return { riskScore, reasons, recommendations };
}

/**
 * Calculate Annual Recurring Revenue (ARR)
 */
export async function calculateARR(): Promise<number> {
  const mrr = await calculateMRR();
  return mrr.mrr * 12;
}

/**
 * Calculate customer lifetime value (CLV)
 */
export async function calculateCLV(): Promise<{
  averageCLV: number;
  averageLifespanMonths: number;
  totalRevenue: number;
}> {
  // Get all clients with their total revenue
  const clients = await prisma.client.findMany({
    include: {
      invoices: {
        where: {
          status: 'paid',
        },
      },
    },
  });

  let totalRevenue = 0;
  let totalLifespanMonths = 0;
  let clientCount = 0;

  clients.forEach((client) => {
    const clientRevenue = client.invoices.reduce((sum, inv) => sum + inv.total, 0);
    const lifespan = Math.floor(
      (Date.now() - client.createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000)
    );

    if (lifespan > 0 && clientRevenue > 0) {
      totalRevenue += clientRevenue;
      totalLifespanMonths += lifespan;
      clientCount++;
    }
  });

  const averageCLV = clientCount > 0 ? totalRevenue / clientCount : 0;
  const averageLifespanMonths = clientCount > 0 ? totalLifespanMonths / clientCount : 0;

  return {
    averageCLV,
    averageLifespanMonths,
    totalRevenue,
  };
}

/**
 * Get revenue growth metrics
 */
export async function getGrowthMetrics(): Promise<{
  monthOverMonth: number;
  quarterOverQuarter: number;
  yearOverYear: number;
}> {
  const now = new Date();
  
  // Current month
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthRevenue = await getRevenueForPeriod(currentMonthStart, now);

  // Last month
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthRevenue = await getRevenueForPeriod(lastMonthStart, lastMonthEnd);

  // Quarter over quarter
  const currentQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const currentQuarterRevenue = await getRevenueForPeriod(currentQuarterStart, now);

  const lastQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - 3, 1);
  const lastQuarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 0);
  const lastQuarterRevenue = await getRevenueForPeriod(lastQuarterStart, lastQuarterEnd);

  // Year over year
  const currentYearStart = new Date(now.getFullYear(), 0, 1);
  const currentYearRevenue = await getRevenueForPeriod(currentYearStart, now);

  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
  const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
  const lastYearRevenue = await getRevenueForPeriod(lastYearStart, lastYearEnd);

  return {
    monthOverMonth: calculatePercentageChange(lastMonthRevenue, currentMonthRevenue),
    quarterOverQuarter: calculatePercentageChange(lastQuarterRevenue, currentQuarterRevenue),
    yearOverYear: calculatePercentageChange(lastYearRevenue, currentYearRevenue),
  };
}

/**
 * Get total revenue for a period
 */
async function getRevenueForPeriod(startDate: Date, endDate: Date): Promise<number> {
  const invoices = await prisma.invoice.findMany({
    where: {
      issueDate: {
        gte: startDate,
        lte: endDate,
      },
      status: 'paid',
    },
  });

  return invoices.reduce((sum, inv) => sum + inv.total, 0);
}

/**
 * Calculate percentage change
 */
function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}
