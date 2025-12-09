import { NextResponse } from 'next/server';

// Moneybird API Type Definitions

interface MoneybirdContact {
  id: string;
  administration_id: string;
  company_name: string | null;
  firstname: string | null;
  lastname: string | null;
  address1: string | null;
  address2: string | null;
  zipcode: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  delivery_method: string;
  customer_id: string | null;
  tax_number: string | null;
  chamber_of_commerce: string | null;
  bank_account: string | null;
  attention: string | null;
  email: string | null;
  email_ubl: boolean;
  send_invoices_to_attention: string | null;
  send_invoices_to_email: string | null;
  send_estimates_to_attention: string | null;
  send_estimates_to_email: string | null;
  sepa_active: boolean;
  sepa_iban: string | null;
  sepa_iban_account_name: string | null;
  sepa_bic: string | null;
  sepa_mandate_id: string | null;
  sepa_mandate_date: string | null;
  sepa_sequence_type: string;
  credit_card_number: string | null;
  credit_card_reference: string | null;
  credit_card_type: string | null;
  tax_number_validated_at: string | null;
  tax_number_valid: boolean | null;
  invoice_workflow_id: string | null;
  estimate_workflow_id: string | null;
  si_identifier: string | null;
  si_identifier_type: string | null;
  created_at: string;
  updated_at: string;
  version: number;
  sales_invoices_url: string;
  notes: MoneybirdNote[];
  custom_fields: MoneybirdCustomField[];
  events: MoneybirdEvent[];
}

interface MoneybirdNote {
  id: string;
  note: string;
  todo: boolean;
  assignee_id: string | null;
  completed_at: string | null;
  completed_by_id: string | null;
  created_at: string;
  updated_at: string;
}

interface MoneybirdCustomField {
  id: string;
  value: string;
}

interface MoneybirdEvent {
  administration_id: string;
  user_id: string;
  action: string;
  link_entity_id: string | null;
  link_entity_type: string | null;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface MoneybirdDetailsLine {
  id: string;
  administration_id: string;
  tax_rate_id: string;
  ledger_account_id: string;
  project_id: string | null;
  amount: string;
  amount_decimal: string;
  description: string;
  price: string;
  period: string | null;
  row_order: number;
  total_price_excl_tax_with_discount: string;
  total_price_excl_tax_with_discount_base: string;
  tax_report_reference: string[];
  created_at: string;
  updated_at: string;
}

interface MoneybirdPayment {
  id: string;
  administration_id: string;
  invoice_type: string;
  invoice_id: string;
  financial_account_id: string | null;
  user_id: string;
  payment_transaction_id: string | null;
  price: string;
  price_base: string;
  payment_date: string;
  credit_invoice_id: string | null;
  financial_mutation_id: string | null;
  transaction_identifier: string | null;
  manual_payment_action: string | null;
  ledger_account_id: string;
  created_at: string;
  updated_at: string;
}

interface MoneybirdTaxTotal {
  tax_rate_id: string;
  taxable_amount: string;
  taxable_amount_base: string;
  tax_amount: string;
  tax_amount_base: string;
}

interface MoneybirdSalesInvoice {
  id: string;
  administration_id: string;
  contact_id: string;
  contact: MoneybirdContact | null;
  invoice_id: string;
  recurring_sales_invoice_id: string | null;
  subscription_id: string | null;
  workflow_id: string;
  document_style_id: string;
  identity_id: string;
  draft_id: string | null;
  state: 'draft' | 'open' | 'scheduled' | 'pending_payment' | 'late' | 'reminded' | 'paid' | 'uncollectible';
  invoice_date: string;
  due_date: string | null;
  payment_conditions: string | null;
  payment_reference: string | null;
  short_payment_reference: string | null;
  reference: string | null;
  language: string;
  currency: string;
  discount: string;
  original_sales_invoice_id: string | null;
  paused: boolean;
  paid_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  public_view_code: string;
  public_view_code_expires_at: string | null;
  version: number;
  details: MoneybirdDetailsLine[];
  payments: MoneybirdPayment[];
  total_paid: string;
  total_unpaid: string;
  total_unpaid_base: string;
  prices_are_incl_tax: boolean;
  total_price_excl_tax: string;
  total_price_excl_tax_base: string;
  total_price_incl_tax: string;
  total_price_incl_tax_base: string;
  total_discount: string;
  marked_dubious_on: string | null;
  marked_uncollectible_on: string | null;
  reminder_count: number;
  next_reminder: string | null;
  original_estimate_id: string | null;
  url: string;
  payment_url: string;
  custom_fields: MoneybirdCustomField[];
  notes: MoneybirdNote[];
  attachments: MoneybirdAttachment[];
  events: MoneybirdEvent[];
  tax_totals: MoneybirdTaxTotal[];
}

interface MoneybirdAttachment {
  id: string;
  administration_id: string;
  attachable_id: string;
  attachable_type: string;
  filename: string;
  content_type: string;
  size: number;
  rotation: number;
  created_at: string;
  updated_at: string;
}

interface MoneybirdPurchaseInvoice {
  id: string;
  administration_id: string;
  contact_id: string;
  contact: MoneybirdContact | null;
  reference: string;
  date: string;
  due_date: string | null;
  entry_number: number;
  state: 'new' | 'open' | 'scheduled' | 'pending_payment' | 'late' | 'paid';
  currency: string;
  exchange_rate: string;
  revenue_invoice: boolean;
  prices_are_incl_tax: boolean;
  origin: string | null;
  paid_at: string | null;
  tax_number: string | null;
  total_price_excl_tax: string;
  total_price_excl_tax_base: string;
  total_price_incl_tax: string;
  total_price_incl_tax_base: string;
  created_at: string;
  updated_at: string;
  version: number;
  details: MoneybirdDetailsLine[];
  payments: MoneybirdPayment[];
  notes: MoneybirdNote[];
  attachments: MoneybirdAttachment[];
  events: MoneybirdEvent[];
}

interface MoneybirdFinancialAccount {
  id: string;
  administration_id: string;
  type: string;
  name: string;
  identifier: string | null;
  currency: string;
  provider: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface MoneybirdFinancialMutation {
  id: string;
  administration_id: string;
  amount: string;
  code: string | null;
  date: string;
  message: string | null;
  contra_account_name: string | null;
  contra_account_number: string | null;
  state: string;
  amount_open: string;
  sepa_fields: Record<string, string | null> | null;
  batch_reference: string | null;
  financial_account_id: string;
  currency: string;
  original_amount: string | null;
  created_at: string;
  updated_at: string;
  financial_statement_id: string;
  processed_at: string | null;
  account_servicer_transaction_id: string | null;
  payments: MoneybirdPayment[];
  ledger_account_bookings: MoneybirdLedgerAccountBooking[];
}

interface MoneybirdLedgerAccountBooking {
  id: string;
  administration_id: string;
  ledger_account_id: string;
  description: string | null;
  price: string;
  created_at: string;
  updated_at: string;
}

interface MoneybirdLedgerAccount {
  id: string;
  administration_id: string;
  name: string;
  account_type: string;
  account_id: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

interface MoneybirdEstimate {
  id: string;
  administration_id: string;
  contact_id: string;
  contact: MoneybirdContact | null;
  estimate_id: string;
  workflow_id: string;
  document_style_id: string;
  identity_id: string;
  draft_id: string | null;
  state: 'draft' | 'open' | 'late' | 'accepted' | 'rejected' | 'billed' | 'archived';
  estimate_date: string;
  due_date: string | null;
  reference: string | null;
  language: string;
  currency: string;
  exchange_rate: string;
  discount: string;
  original_estimate_id: string | null;
  show_tax: boolean;
  sign_online: boolean;
  sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  public_view_code: string;
  public_view_code_expires_at: string | null;
  version: number;
  pre_text: string | null;
  post_text: string | null;
  details: MoneybirdDetailsLine[];
  total_price_excl_tax: string;
  total_price_excl_tax_base: string;
  total_price_incl_tax: string;
  total_price_incl_tax_base: string;
  total_discount: string;
  url: string;
  custom_fields: MoneybirdCustomField[];
  notes: MoneybirdNote[];
  attachments: MoneybirdAttachment[];
  events: MoneybirdEvent[];
  tax_totals: MoneybirdTaxTotal[];
}

interface MoneybirdRecurringSalesInvoice {
  id: string;
  administration_id: string;
  contact_id: string;
  contact: MoneybirdContact | null;
  workflow_id: string;
  state: 'active' | 'paused' | 'finished';
  start_date: string;
  invoice_date: string | null;
  last_date: string | null;
  payment_conditions: string | null;
  reference: string | null;
  language: string;
  currency: string;
  discount: string;
  first_due_interval: number;
  auto_send: boolean;
  mergeable: boolean;
  sending_scheduled_at: string | null;
  sending_scheduled_user_id: string | null;
  frequency_type: 'day' | 'week' | 'month' | 'quarter' | 'year';
  frequency: number;
  created_at: string;
  updated_at: string;
  version: number;
  details: MoneybirdDetailsLine[];
  total_price_excl_tax: string;
  total_price_excl_tax_base: string;
  total_price_incl_tax: string;
  total_price_incl_tax_base: string;
  custom_fields: MoneybirdCustomField[];
  notes: MoneybirdNote[];
}

// Dashboard Response Types
interface DashboardSummary {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  pendingPayments: number;
}

interface DashboardData {
  summary: DashboardSummary;
  recentInvoices: MoneybirdSalesInvoice[];
  recentExpenses: MoneybirdPurchaseInvoice[];
  financialAccounts: MoneybirdFinancialAccount[];
}

interface ApiErrorResponse {
  error: string;
  message?: string;
  statusCode?: number;
}

// Helper function to make Moneybird API requests
async function moneybirdRequest<T>(
  endpoint: string,
  administrationId: string,
  accessToken: string
): Promise<T> {
  const baseUrl = 'https://moneybird.com/api/v2';
  const url = `${baseUrl}/${administrationId}/${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Moneybird API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
    );
  }

  return response.json() as Promise<T>;
}

// Calculate summary from invoices
function calculateSummary(
  salesInvoices: MoneybirdSalesInvoice[],
  purchaseInvoices: MoneybirdPurchaseInvoice[]
): DashboardSummary {
  const totalRevenue = salesInvoices
    .filter((inv) => inv.state === 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.total_price_incl_tax || '0'), 0);

  const totalExpenses = purchaseInvoices
    .filter((inv) => inv.state === 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.total_price_incl_tax || '0'), 0);

  const outstandingInvoices = salesInvoices.filter(
    (inv) => inv.state === 'open' || inv.state === 'pending_payment'
  ).length;

  const overdueInvoices = salesInvoices.filter(
    (inv) => inv.state === 'late' || inv.state === 'reminded'
  ).length;

  const pendingPayments = salesInvoices
    .filter((inv) => inv.state !== 'paid' && inv.state !== 'draft')
    .reduce((sum, inv) => sum + parseFloat(inv.total_unpaid || '0'), 0);

  return {
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
    outstandingInvoices,
    overdueInvoices,
    pendingPayments,
  };
}

export async function GET(request: Request): Promise<NextResponse<DashboardData | ApiErrorResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const administrationId = searchParams.get('administration_id');
    const accessToken = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!administrationId) {
      return NextResponse.json(
        { error: 'Missing administration_id parameter' },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing Authorization header' },
        { status: 401 }
      );
    }

    // Fetch data from Moneybird API in parallel
    const [salesInvoices, purchaseInvoices, financialAccounts] = await Promise.all([
      moneybirdRequest<MoneybirdSalesInvoice[]>(
        'sales_invoices.json?per_page=50',
        administrationId,
        accessToken
      ),
      moneybirdRequest<MoneybirdPurchaseInvoice[]>(
        'documents/purchase_invoices.json?per_page=50',
        administrationId,
        accessToken
      ),
      moneybirdRequest<MoneybirdFinancialAccount[]>(
        'financial_accounts.json',
        administrationId,
        accessToken
      ),
    ]);

    const summary = calculateSummary(salesInvoices, purchaseInvoices);

    const dashboardData: DashboardData = {
      summary,
      recentInvoices: salesInvoices.slice(0, 10),
      recentExpenses: purchaseInvoices.slice(0, 10),
      financialAccounts,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Export types for use in other files
export type {
  MoneybirdContact,
  MoneybirdSalesInvoice,
  MoneybirdPurchaseInvoice,
  MoneybirdFinancialAccount,
  MoneybirdFinancialMutation,
  MoneybirdLedgerAccount,
  MoneybirdEstimate,
  MoneybirdRecurringSalesInvoice,
  MoneybirdPayment,
  MoneybirdDetailsLine,
  MoneybirdNote,
  MoneybirdCustomField,
  MoneybirdEvent,
  MoneybirdAttachment,
  MoneybirdTaxTotal,
  MoneybirdLedgerAccountBooking,
  DashboardSummary,
  DashboardData,
  ApiErrorResponse,
};
