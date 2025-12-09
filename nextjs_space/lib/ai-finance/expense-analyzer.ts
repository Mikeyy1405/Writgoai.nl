import { prisma } from '../db';
// AI-powered expense analyzer for categorization, trends, and savings opportunities



export interface ExpenseAnalysis {
  categorization: {
    category: string;
    confidence: number;
    reasoning: string;
  };
  trends: {
    monthlyAverage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    percentageChange: number;
  };
  savingsOpportunities: {
    opportunity: string;
    potentialSavings: number;
    priority: 'high' | 'medium' | 'low';
  }[];
}

/**
 * Analyze an expense using AI to categorize and find patterns
 */
export async function analyzeExpense(
  description: string,
  amount: number,
  supplierName: string,
  similarExpenses?: any[]
): Promise<ExpenseAnalysis> {
  // Get AI categorization
  const categorization = await categorizeExpense(description, supplierName);
  
  // Analyze trends if we have historical data
  const trends = similarExpenses && similarExpenses.length > 0
    ? await analyzeTrends(similarExpenses, amount)
    : { monthlyAverage: amount, trend: 'stable' as const, percentageChange: 0 };
  
  // Find savings opportunities
  const savingsOpportunities = await findSavingsOpportunities(
    categorization.category,
    amount,
    supplierName,
    similarExpenses
  );

  return {
    categorization,
    trends,
    savingsOpportunities,
  };
}

/**
 * Use AI to categorize an expense based on description and supplier
 */
async function categorizeExpense(
  description: string,
  supplierName: string
): Promise<{ category: string; confidence: number; reasoning: string }> {
  // Predefined categories with keywords
  const categoryRules = [
    {
      category: 'hosting',
      keywords: ['hosting', 'server', 'vps', 'cloud', 'aws', 'digitalocean', 'linode', 'vercel', 'netlify'],
      confidence: 0.95,
    },
    {
      category: 'software',
      keywords: ['software', 'subscription', 'saas', 'license', 'api', 'service', 'tool'],
      confidence: 0.90,
    },
    {
      category: 'marketing',
      keywords: ['marketing', 'advertising', 'ads', 'facebook', 'google ads', 'meta', 'campaign'],
      confidence: 0.90,
    },
    {
      category: 'office',
      keywords: ['office', 'supplies', 'furniture', 'equipment', 'workspace'],
      confidence: 0.85,
    },
    {
      category: 'utilities',
      keywords: ['electricity', 'water', 'internet', 'phone', 'mobile', 'telecom'],
      confidence: 0.90,
    },
    {
      category: 'professional_services',
      keywords: ['consultant', 'accountant', 'lawyer', 'advisor', 'freelancer', 'contractor'],
      confidence: 0.85,
    },
    {
      category: 'travel',
      keywords: ['travel', 'hotel', 'flight', 'train', 'taxi', 'uber', 'transport'],
      confidence: 0.90,
    },
    {
      category: 'banking',
      keywords: ['bank', 'transaction fee', 'service charge', 'payment processing', 'stripe', 'mollie'],
      confidence: 0.95,
    },
  ];

  const textToMatch = `${description} ${supplierName}`.toLowerCase();

  // Find best matching category
  let bestMatch = { category: 'other', confidence: 0.5, reasoning: 'No specific match found' };

  for (const rule of categoryRules) {
    const matchedKeywords = rule.keywords.filter(keyword =>
      textToMatch.includes(keyword.toLowerCase())
    );

    if (matchedKeywords.length > 0) {
      const confidence = Math.min(
        rule.confidence + (matchedKeywords.length - 1) * 0.05,
        0.99
      );
      
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          category: rule.category,
          confidence,
          reasoning: `Matched keywords: ${matchedKeywords.join(', ')}`,
        };
      }
    }
  }

  return bestMatch;
}

/**
 * Analyze expense trends over time
 */
async function analyzeTrends(
  historicalExpenses: any[],
  currentAmount: number
): Promise<{ monthlyAverage: number; trend: 'increasing' | 'decreasing' | 'stable'; percentageChange: number }> {
  if (historicalExpenses.length === 0) {
    return {
      monthlyAverage: currentAmount,
      trend: 'stable',
      percentageChange: 0,
    };
  }

  // Calculate monthly average
  const totalAmount = historicalExpenses.reduce((sum, exp) => sum + exp.total, 0);
  const monthlyAverage = totalAmount / historicalExpenses.length;

  // Calculate trend
  const recentHalf = historicalExpenses.slice(Math.floor(historicalExpenses.length / 2));
  const olderHalf = historicalExpenses.slice(0, Math.floor(historicalExpenses.length / 2));

  const recentAvg = recentHalf.reduce((sum, exp) => sum + exp.total, 0) / recentHalf.length;
  const olderAvg = olderHalf.reduce((sum, exp) => sum + exp.total, 0) / olderHalf.length;

  const percentageChange = ((recentAvg - olderAvg) / olderAvg) * 100;

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (percentageChange > 10) trend = 'increasing';
  else if (percentageChange < -10) trend = 'decreasing';

  return {
    monthlyAverage,
    trend,
    percentageChange,
  };
}

/**
 * Identify potential savings opportunities
 */
async function findSavingsOpportunities(
  category: string,
  amount: number,
  supplierName: string,
  similarExpenses?: any[]
): Promise<{ opportunity: string; potentialSavings: number; priority: 'high' | 'medium' | 'low' }[]> {
  const opportunities: { opportunity: string; potentialSavings: number; priority: 'high' | 'medium' | 'low' }[] = [];

  // Check for duplicate subscriptions
  if (category === 'software' && similarExpenses && similarExpenses.length > 1) {
    const duplicates = similarExpenses.filter(
      exp => exp.supplierName.toLowerCase().includes(supplierName.toLowerCase()) ||
             supplierName.toLowerCase().includes(exp.supplierName.toLowerCase())
    );
    
    if (duplicates.length > 1) {
      opportunities.push({
        opportunity: `Mogelijk dubbele abonnementen bij ${supplierName}`,
        potentialSavings: amount * 0.5,
        priority: 'high',
      });
    }
  }

  // Check for high recurring costs
  if (amount > 500 && similarExpenses && similarExpenses.length >= 3) {
    opportunities.push({
      opportunity: `Hoge terugkerende kosten bij ${supplierName} - onderhandel over volume korting`,
      potentialSavings: amount * 0.15,
      priority: 'medium',
    });
  }

  // Annual billing savings
  if (category === 'software' || category === 'hosting') {
    opportunities.push({
      opportunity: 'Overweeg jaarlijkse billing voor 10-20% korting',
      potentialSavings: amount * 0.15,
      priority: 'low',
    });
  }

  // Marketing optimization
  if (category === 'marketing' && amount > 1000) {
    opportunities.push({
      opportunity: 'Analyseer marketing ROI en optimaliseer budget allocatie',
      potentialSavings: amount * 0.2,
      priority: 'medium',
    });
  }

  return opportunities;
}

/**
 * Bulk categorize multiple expenses
 */
export async function bulkCategorizeExpenses(expenses: any[]): Promise<any[]> {
  const categorizedExpenses = await Promise.all(
    expenses.map(async (expense) => {
      const categorization = await categorizeExpense(
        expense.description || '',
        expense.supplierName
      );

      return {
        ...expense,
        suggestedCategory: categorization.category,
        categoryConfidence: categorization.confidence,
        categoryReasoning: categorization.reasoning,
      };
    })
  );

  return categorizedExpenses;
}

/**
 * Get expense insights for a time period
 */
export async function getExpenseInsights(
  startDate: Date,
  endDate: Date,
  clientId?: string
): Promise<{
  totalExpenses: number;
  categoryBreakdown: Record<string, number>;
  topSuppliers: { name: string; total: number }[];
  trends: { month: string; total: number }[];
}> {
  const where: any = {
    invoiceDate: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (clientId) {
    where.clientId = clientId;
  }

  const expenses = await prisma.purchaseInvoice.findMany({
    where,
    include: {
      expenseCategory: true,
    },
  });

  // Calculate total
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.total, 0);

  // Category breakdown
  const categoryBreakdown: Record<string, number> = {};
  expenses.forEach((exp) => {
    const category = exp.category || 'other';
    categoryBreakdown[category] = (categoryBreakdown[category] || 0) + exp.total;
  });

  // Top suppliers
  const supplierTotals: Record<string, number> = {};
  expenses.forEach((exp) => {
    supplierTotals[exp.supplierName] = (supplierTotals[exp.supplierName] || 0) + exp.total;
  });

  const topSuppliers = Object.entries(supplierTotals)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Monthly trends
  const monthlyTotals: Record<string, number> = {};
  expenses.forEach((exp) => {
    const month = exp.invoiceDate.toISOString().substring(0, 7); // YYYY-MM
    monthlyTotals[month] = (monthlyTotals[month] || 0) + exp.total;
  });

  const trends = Object.entries(monthlyTotals)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalExpenses,
    categoryBreakdown,
    topSuppliers,
    trends,
  };
}
