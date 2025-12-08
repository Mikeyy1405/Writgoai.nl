# WritgoAI Financial Management System - Implementation Guide

## Overview

This guide covers the comprehensive AI-powered financial management system integrated with Moneybird API that has been implemented for WritgoAI.

## System Architecture

### 1. Database Models (Prisma Schema)

The following models have been added to support the financial system:

- **PurchaseInvoice**: Tracks company expenses and purchase invoices
- **ExpenseCategory**: Categorizes expenses for better tracking
- **BankTransaction**: Syncs and matches bank transactions
- **FinancialAlert**: Creates notifications for important financial events
- **VATReport**: Quarterly VAT/BTW reporting
- **FinancialMetric**: Cached financial metrics for performance

### 2. Moneybird Integration

Extended the existing Moneybird client (`lib/moneybird.ts`) with:

- Purchase invoice management (GET, POST, UPDATE)
- Financial mutations (bank transactions)
- Financial accounts (bank balances)
- Document uploads
- Financial statements

### 3. AI Finance Engine (`lib/ai-finance/`)

#### Expense Analyzer (`expense-analyzer.ts`)
- Auto-categorizes expenses using keyword matching
- Analyzes trends over time
- Identifies savings opportunities
- Provides bulk categorization

#### Revenue Predictor (`revenue-predictor.ts`)
- Calculates MRR (Monthly Recurring Revenue)
- Calculates ARR (Annual Recurring Revenue)
- Predicts future MRR with confidence scores
- Identifies churn risk for clients
- Tracks growth metrics (MoM, QoQ, YoY)

#### Invoice Analyzer (`invoice-analyzer.ts`)
- Analyzes payment behavior per client
- Predicts late payments with probability scores
- Generates automated payment reminders
- Identifies high-risk invoices

#### Chat Assistant (`chat-assistant.ts`)
- Natural language financial queries
- Context-aware responses
- Quick financial summaries
- Suggestion-based interactions

### 4. API Routes

#### Admin Finance Routes (`/api/finance/`)

- **GET /api/finance/dashboard**
  - Real-time financial overview
  - MRR, ARR, net profit
  - Recent transactions
  - Financial alerts

- **GET /api/finance/income**
  - List sales invoices with filters
  - Status breakdown
  - Totals calculation

- **POST /api/finance/income**
  - Sync invoices from Moneybird
  - Auto-match to clients

- **GET /api/finance/expenses**
  - List purchase invoices
  - AI-powered insights
  - Category breakdown

- **POST /api/finance/expenses**
  - Create new expense
  - AI categorization
  - Automatic alerts for high expenses

- **GET /api/finance/bank-transactions**
  - List bank transactions
  - Filter by status (matched, unmatched)

- **POST /api/finance/bank-transactions**
  - Sync from Moneybird
  - Auto-match to invoices

- **GET /api/finance/btw**
  - Quarterly VAT reports
  - Filter by year/quarter

- **POST /api/finance/btw**
  - Generate VAT report
  - Automatic calculations

- **GET /api/finance/reports/[type]**
  - Profit & Loss Statement
  - Balance Sheet
  - Cash Flow Statement

- **POST /api/finance/ai-chat**
  - Natural language queries
  - AI-powered responses

### 5. Automation & Cron Jobs (`/api/cron/finance/`)

#### Monthly Invoice Generation
**Endpoint**: `/api/cron/finance/monthly-invoices`
**Schedule**: 1st of every month
**Function**: Auto-generates subscription invoices for all active clients

#### Payment Reminders
**Endpoint**: `/api/cron/finance/payment-reminders`
**Schedule**: Daily
**Function**: 
- Sends friendly reminders 3 days before due
- Sends urgent reminders for 14+ days overdue
- Sends final reminders for 30+ days overdue
- Creates alerts for high-risk payments

#### Bank Sync
**Endpoint**: `/api/cron/finance/bank-sync`
**Schedule**: Every 4 hours
**Function**:
- Syncs bank transactions from Moneybird
- Auto-matches transactions to invoices
- Updates invoice payment status

#### VAT Calculation
**Endpoint**: `/api/cron/finance/vat-calculation`
**Schedule**: End of each quarter
**Function**:
- Calculates quarterly VAT
- Generates detailed reports
- Creates alerts for payment

### 6. Admin Dashboard

**Location**: `/admin/finance/`

Features:
- Real-time KPIs (MRR, ARR, Net Profit)
- Growth metrics visualization
- Recent invoices and expenses
- Financial alerts
- AI chat assistant
- Quick actions to all modules

## Environment Variables

Add these to your `.env` file:

```bash
# Moneybird API
MONEYBIRD_ACCESS_TOKEN=your-personal-api-token
MONEYBIRD_ADMINISTRATION_ID=your-administration-id

# Moneybird Product IDs (optional - for automated billing)
MONEYBIRD_PRODUCT_BASIS_ID=product-id
MONEYBIRD_PRODUCT_PROFESSIONAL_ID=product-id
MONEYBIRD_PRODUCT_BUSINESS_ID=product-id
MONEYBIRD_PRODUCT_ENTERPRISE_ID=product-id

# Moneybird Tax & Ledger IDs
MONEYBIRD_TAX_RATE_21_ID=tax-rate-id-for-21-percent
MONEYBIRD_TAX_RATE_9_ID=tax-rate-id-for-9-percent
MONEYBIRD_TAX_RATE_0_ID=tax-rate-id-for-0-percent
MONEYBIRD_REVENUE_LEDGER_ID=ledger-account-id

# Cron Job Security
CRON_SECRET=your-secret-key-for-cron-authentication
```

## Setup Instructions

### 1. Database Migration

Run the Prisma migration to create new tables:

```bash
cd nextjs_space
npx prisma migrate dev --name add_financial_management
```

### 2. Seed Expense Categories

Create initial expense categories:

```sql
INSERT INTO "ExpenseCategory" (id, name, description, "taxDeductible", "vatPercentage", "aiKeywords") VALUES
  ('cat_hosting', 'hosting', 'Server en cloud hosting', true, 21, ARRAY['hosting', 'server', 'vps', 'cloud']),
  ('cat_software', 'software', 'Software licenties en SaaS', true, 21, ARRAY['software', 'saas', 'license', 'subscription']),
  ('cat_marketing', 'marketing', 'Marketing en advertenties', true, 21, ARRAY['marketing', 'ads', 'advertising', 'campaign']),
  ('cat_utilities', 'utilities', 'Nutsvoorzieningen', true, 21, ARRAY['electricity', 'internet', 'phone', 'telecom']),
  ('cat_professional', 'professional_services', 'Professionele diensten', true, 21, ARRAY['consultant', 'accountant', 'lawyer', 'advisor']);
```

### 3. Configure Moneybird

1. Go to [Moneybird](https://moneybird.com)
2. Create API token: Settings → API & Webhooks → Personal Access Token
3. Get Administration ID from URL
4. Configure tax rates and ledger accounts
5. Add IDs to environment variables

### 4. Setup Cron Jobs

Configure your cron scheduler (e.g., Vercel Cron, GitHub Actions, or custom):

```yaml
# Example for Vercel cron
crons:
  - path: /api/cron/finance/monthly-invoices
    schedule: 0 0 1 * * # 1st of month at midnight
  
  - path: /api/cron/finance/payment-reminders
    schedule: 0 9 * * * # Daily at 9 AM
  
  - path: /api/cron/finance/bank-sync
    schedule: 0 */4 * * * # Every 4 hours
  
  - path: /api/cron/finance/vat-calculation
    schedule: 0 0 1 */3 * # First day of quarter
```

Include the CRON_SECRET in Authorization header:
```
Authorization: Bearer ${CRON_SECRET}
```

## Usage Examples

### AI Chat Queries

Try these natural language queries:

- "Wat is onze huidige MRR?"
- "Toon me de uitgaven van deze maand"
- "Welke facturen zijn nog openstaand?"
- "Hoe is onze groei afgelopen kwartaal?"
- "Welke klanten hebben betalingsachterstanden?"
- "Voorspel de MRR voor de komende 3 maanden"
- "Waar kan ik op besparen?"
- "Welke klanten hebben churn risico?"

### Manual Sync

Sync invoices from Moneybird:
```javascript
fetch('/api/finance/income', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'sync' })
});
```

### Create Expense

```javascript
fetch('/api/finance/expenses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    invoiceNumber: 'INV-2024-001',
    supplierName: 'Digital Ocean',
    description: 'Cloud hosting December 2024',
    invoiceDate: '2024-12-01',
    total: 150.00,
    category: 'hosting'
  })
});
```

### Generate Report

```javascript
// Profit & Loss
fetch('/api/finance/reports/profit-loss?startDate=2024-01-01&endDate=2024-12-31');

// Balance Sheet
fetch('/api/finance/reports/balance-sheet?endDate=2024-12-31');

// Cash Flow
fetch('/api/finance/reports/cash-flow?startDate=2024-01-01&endDate=2024-12-31');
```

## Features by Module

### ✅ Income Tracking
- Automatic sync with Moneybird
- Status tracking (draft, sent, paid, overdue)
- Client billing history
- Payment status updates

### ✅ Expense Management
- AI-powered categorization
- Upload invoices
- Track recurring expenses
- Supplier management

### ✅ Bank Transaction Sync
- Automatic sync from Moneybird
- Auto-matching to invoices
- Manual matching interface
- Transaction history

### ✅ VAT/BTW Reporting
- Quarterly calculations
- Automatic report generation
- Sales vs Purchase VAT
- Export-ready reports

### ✅ Financial Reports
- Profit & Loss Statement
- Balance Sheet
- Cash Flow Statement
- Monthly breakdowns

### ✅ AI Analytics
- MRR forecasting
- Churn prediction
- Late payment prediction
- Expense insights
- Savings opportunities

### ✅ Automation
- Monthly invoice generation
- Payment reminders (tiered)
- Bank sync (4-hourly)
- Quarterly VAT calculation
- Financial alerts

## TODO: Future Enhancements

1. **Email Integration**: Implement actual email sending for payment reminders
2. **PDF Generation**: Generate PDF invoices and reports
3. **Multi-currency Support**: Handle multiple currencies
4. **Budget Management**: Set and track budgets per category
5. **Cash Flow Forecasting**: Advanced AI predictions
6. **Financial Goals**: Set and track financial goals
7. **Export to Excel**: Export reports to Excel format
8. **Webhook Integration**: Real-time Moneybird webhooks
9. **Mobile App**: Mobile-optimized views
10. **Advanced Analytics**: More AI-powered insights

## Security Considerations

✅ **Implemented**:
- Authentication required for all admin routes
- Role-based access control (admin only)
- Cron job authentication with secret
- Input validation on all API routes
- Prisma prepared statements (SQL injection prevention)

⚠️ **Important Notes**:
- Store API tokens securely in environment variables
- Never commit `.env` file to git
- Use HTTPS in production
- Regular security audits recommended
- Monitor API rate limits

## Support

For issues or questions:
1. Check the logs for detailed error messages
2. Verify Moneybird API credentials
3. Ensure database migrations are up to date
4. Check cron job execution logs
5. Review financial alerts in the dashboard

## License

This financial management system is part of the WritgoAI platform and follows the same license terms.
