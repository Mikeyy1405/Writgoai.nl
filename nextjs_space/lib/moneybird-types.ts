// Moneybird API Type Definitions

export interface MoneybirdConfig {
  accessToken: string;
  administrationId: string;
}

export interface Contact {
  id: string;
  company_name: string;
  firstname: string;
  lastname: string;
  email: string;
  customer_id: string; // Link to Client.id in our database
  address1?: string;
  address2?: string;
  zipcode?: string;
  city?: string;
  country?: string;
  phone?: string;
  tax_number?: string;
  chamber_of_commerce?: string;
  sepa_active?: boolean;
  sepa_iban?: string;
  sepa_iban_account_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ContactData {
  company_name?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  customer_id?: string;
  address1?: string;
  address2?: string;
  zipcode?: string;
  city?: string;
  country?: string;
  phone?: string;
  tax_number?: string;
  chamber_of_commerce?: string;
  send_invoices_to_email?: string;
  sepa_active?: boolean;
  sepa_iban?: string;
  sepa_iban_account_name?: string;
}

export interface InvoiceDetail {
  description: string;
  price: string;
  amount: string; // quantity
  tax_rate_id?: string;
  ledger_account_id?: string;
  product_id?: string;
}

export interface SalesInvoice {
  id: string;
  contact_id: string;
  state: 'draft' | 'open' | 'scheduled' | 'pending_payment' | 'late' | 'reminded' | 'paid' | 'uncollectible';
  invoice_id: string;
  invoice_date: string;
  due_date: string;
  payment_conditions?: string;
  payment_reference?: string;
  total_price_excl_tax: string;
  total_price_incl_tax: string;
  total_unpaid: string;
  url?: string;
  public_view_code?: string;
  details_attributes: InvoiceDetail[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SalesInvoiceData {
  contact_id: string;
  invoice_date?: string;
  due_date?: string;
  reference?: string;
  details_attributes: InvoiceDetail[];
  prices_are_incl_tax?: boolean;
  payment_conditions?: string;
  currency?: string;
  discount?: string;
}

export interface SendOptions {
  delivery_method: 'Email' | 'Manual' | 'Post' | 'Simplerinvoicing';
  email_address?: string;
  email_message?: string;
  invoice_date?: string;
}

export interface Subscription {
  id: string;
  contact_id: string;
  product_id?: string;
  start_date: string;
  end_date?: string;
  frequency: 'month' | 'quarter' | 'year' | 'week' | '2-months' | '4-months' | 'half-year';
  frequency_amount: number;
  active: boolean;
  details_attributes?: InvoiceDetail[];
  total_price_excl_tax?: string;
  total_price_incl_tax?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionData {
  contact_id: string;
  product_id?: string;
  start_date: string;
  frequency: 'month' | 'quarter' | 'year' | 'week' | '2-months' | '4-months' | 'half-year';
  frequency_amount?: number;
  details_attributes?: InvoiceDetail[];
  prices_are_incl_tax?: boolean;
  auto_send?: boolean;
}

export interface ChargeData {
  description: string;
  price: string;
  amount: string;
  tax_rate_id?: string;
  ledger_account_id?: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  token: string;
  last_http_status?: number;
  last_http_error?: string;
}

export interface WebhookPayload {
  administration_id: string;
  webhook_id: string;
  webhook_token: string;
  entity_type: string; // 'SalesInvoice', 'Subscription', 'Payment', etc.
  entity_id: string;
  state: string;
  action: string; // 'sales_invoice_state_changed_to_paid', 'subscription_created', etc.
  entity: any;
}

export interface TaxRate {
  id: string;
  name: string;
  percentage: string;
  tax_rate_type: 'sales_invoice' | 'purchase_invoice' | 'all';
  show_tax: boolean;
  active: boolean;
  country?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LedgerAccount {
  id: string;
  name: string;
  account_type: string;
  account_id: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  title: string;
  description?: string;
  price: string;
  frequency?: string;
  frequency_type?: string;
  tax_rate_id?: string;
  ledger_account_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MoneybirdError {
  error: string;
  message?: string;
  details?: any;
}

// Purchase Invoices (Kosten/Inkoop Facturen)
export interface PurchaseInvoice {
  id: string;
  contact_id: string;
  state: 'draft' | 'open' | 'scheduled' | 'pending_payment' | 'late' | 'reminded' | 'paid';
  invoice_id: string;
  invoice_date: string;
  due_date: string;
  payment_conditions?: string;
  total_price_excl_tax: string;
  total_price_incl_tax: string;
  total_unpaid: string;
  reference?: string;
  details_attributes: InvoiceDetail[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseInvoiceData {
  contact_id: string;
  invoice_date?: string;
  due_date?: string;
  reference?: string;
  details_attributes: InvoiceDetail[];
  prices_are_incl_tax?: boolean;
  payment_conditions?: string;
  currency?: string;
}

// Financial Mutations (Bank Transactions)
export interface FinancialMutation {
  id: string;
  financial_account_id: string;
  amount: string;
  code: string;
  date: string;
  message: string;
  contra_account_name?: string;
  contra_account_number?: string;
  state: 'pending' | 'processed';
  financial_statement_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Financial Accounts (Bank Accounts)
export interface FinancialAccount {
  id: string;
  name: string;
  account_type: 'bank_account' | 'savings_account' | 'credit_card';
  account_number?: string;
  iban?: string;
  bic?: string;
  bank_name?: string;
  balance?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Financial Statements (Reports)
export interface FinancialStatement {
  id: string;
  financial_account_id: string;
  start_date: string;
  end_date: string;
  statement_date: string;
  starting_balance: string;
  ending_balance: string;
  total_debit: string;
  total_credit: string;
  imported_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Document for file uploads
export interface Document {
  id: string;
  contact_id?: string;
  filename: string;
  content_type: string;
  size: number;
  url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentUploadData {
  contact_id?: string;
  filename: string;
  content_type: string;
  file: Buffer | Blob;
}

// Balance Sheet (Balans)
export interface BalanceSheet {
  date: string;
  assets: {
    current_assets: number;
    fixed_assets: number;
    total_assets: number;
  };
  liabilities: {
    current_liabilities: number;
    long_term_liabilities: number;
    equity: number;
    total_liabilities_and_equity: number;
  };
}

// Profit & Loss Statement (Winst & Verlies)
export interface ProfitLossStatement {
  start_date: string;
  end_date: string;
  revenue: number;
  cost_of_sales: number;
  gross_profit: number;
  operating_expenses: number;
  operating_profit: number;
  other_income: number;
  other_expenses: number;
  net_profit: number;
}
