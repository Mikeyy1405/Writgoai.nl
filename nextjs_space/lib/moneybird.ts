// Moneybird API Client
import {
  MoneybirdConfig,
  Contact,
  ContactData,
  SalesInvoice,
  SalesInvoiceData,
  SendOptions,
  Subscription,
  SubscriptionData,
  ChargeData,
  Webhook,
  TaxRate,
  LedgerAccount,
  Product,
  MoneybirdError
} from './moneybird-types';

const MONEYBIRD_BASE_URL = 'https://moneybird.com/api/v2';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export class MoneybirdClient {
  private accessToken: string;
  private administrationId: string;
  private baseUrl: string;

  constructor(config: MoneybirdConfig) {
    if (!config.accessToken) {
      throw new Error('Moneybird access token is required');
    }
    if (!config.administrationId) {
      throw new Error('Moneybird administration ID is required');
    }

    this.accessToken = config.accessToken;
    this.administrationId = config.administrationId;
    this.baseUrl = `${MONEYBIRD_BASE_URL}/${config.administrationId}`;
  }

  /**
   * Make HTTP request to Moneybird API with retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle rate limiting
      if (response.status === 429) {
        if (retryCount < MAX_RETRIES) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
          const delay = retryAfter > 0 ? retryAfter * 1000 : RETRY_DELAY_MS * Math.pow(2, retryCount);
          
          console.log(`[Moneybird] Rate limited, retrying after ${delay}ms...`);
          await this.sleep(delay);
          return this.request<T>(endpoint, options, retryCount + 1);
        }
        throw new Error('Moneybird API rate limit exceeded');
      }

      // Handle other errors
      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `Moneybird API error: ${response.status} ${response.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          // If error is not JSON, use the raw text
          if (errorBody) {
            errorMessage = `${errorMessage} - ${errorBody}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      // Handle empty responses (e.g., DELETE requests)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (retryCount < MAX_RETRIES && this.isRetryableError(error)) {
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
        console.log(`[Moneybird] Request failed, retrying after ${delay}ms...`, error);
        await this.sleep(delay);
        return this.request<T>(endpoint, options, retryCount + 1);
      }
      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    // Retry on network errors or 5xx server errors
    return (
      error.message?.includes('fetch') ||
      error.message?.includes('ECONNRESET') ||
      error.message?.includes('ETIMEDOUT')
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===== CONTACTS =====

  /**
   * Create a new contact in Moneybird
   */
  async createContact(data: ContactData): Promise<Contact> {
    return this.request<Contact>('/contacts.json', {
      method: 'POST',
      body: JSON.stringify({ contact: data }),
    });
  }

  /**
   * Get contact by customer ID (our internal Client ID)
   */
  async getContactByCustomerId(customerId: string): Promise<Contact | null> {
    try {
      const contacts = await this.request<Contact[]>(
        `/contacts.json?query=customer_id:${customerId}`,
        { method: 'GET' }
      );
      return contacts.length > 0 ? contacts[0] : null;
    } catch (error) {
      console.error(`[Moneybird] Error fetching contact by customer_id ${customerId}:`, error);
      return null;
    }
  }

  /**
   * Get contact by ID
   */
  async getContact(id: string): Promise<Contact> {
    return this.request<Contact>(`/contacts/${id}.json`, {
      method: 'GET',
    });
  }

  /**
   * Update an existing contact
   */
  async updateContact(id: string, data: Partial<ContactData>): Promise<Contact> {
    return this.request<Contact>(`/contacts/${id}.json`, {
      method: 'PATCH',
      body: JSON.stringify({ contact: data }),
    });
  }

  /**
   * Create or update contact (find by customer_id first)
   */
  async createOrUpdateContact(data: ContactData): Promise<Contact> {
    if (data.customer_id) {
      const existingContact = await this.getContactByCustomerId(data.customer_id);
      if (existingContact) {
        return this.updateContact(existingContact.id, data);
      }
    }
    return this.createContact(data);
  }

  // ===== SALES INVOICES =====

  /**
   * Create a sales invoice
   */
  async createSalesInvoice(data: SalesInvoiceData): Promise<SalesInvoice> {
    return this.request<SalesInvoice>('/sales_invoices.json', {
      method: 'POST',
      body: JSON.stringify({ sales_invoice: data }),
    });
  }

  /**
   * Get a sales invoice by ID
   */
  async getSalesInvoice(id: string): Promise<SalesInvoice> {
    return this.request<SalesInvoice>(`/sales_invoices/${id}.json`, {
      method: 'GET',
    });
  }

  /**
   * Send a sales invoice to the contact
   */
  async sendSalesInvoice(id: string, options: SendOptions): Promise<void> {
    await this.request(`/sales_invoices/${id}/send_invoice.json`, {
      method: 'PATCH',
      body: JSON.stringify({ sales_invoice_sending: options }),
    });
  }

  /**
   * Register a payment for a sales invoice
   */
  async registerPayment(
    invoiceId: string,
    amount: string,
    paymentDate?: string
  ): Promise<void> {
    await this.request(`/sales_invoices/${invoiceId}/register_payment.json`, {
      method: 'PATCH',
      body: JSON.stringify({
        payment: {
          payment_date: paymentDate || new Date().toISOString().split('T')[0],
          price: amount,
        },
      }),
    });
  }

  // ===== SUBSCRIPTIONS =====

  /**
   * Create a recurring subscription
   */
  async createSubscription(data: SubscriptionData): Promise<Subscription> {
    return this.request<Subscription>('/recurring_sales_invoices.json', {
      method: 'POST',
      body: JSON.stringify({ recurring_sales_invoice: data }),
    });
  }

  /**
   * Get a subscription by ID
   */
  async getSubscription(id: string): Promise<Subscription> {
    return this.request<Subscription>(`/recurring_sales_invoices/${id}.json`, {
      method: 'GET',
    });
  }

  /**
   * Cancel a subscription (mark as inactive)
   */
  async cancelSubscription(id: string): Promise<void> {
    await this.request(`/recurring_sales_invoices/${id}.json`, {
      method: 'PATCH',
      body: JSON.stringify({
        recurring_sales_invoice: {
          active: false,
        },
      }),
    });
  }

  /**
   * Update a subscription
   */
  async updateSubscription(
    id: string,
    data: Partial<SubscriptionData>
  ): Promise<Subscription> {
    return this.request<Subscription>(`/recurring_sales_invoices/${id}.json`, {
      method: 'PATCH',
      body: JSON.stringify({ recurring_sales_invoice: data }),
    });
  }

  // ===== WEBHOOKS =====

  /**
   * Create a webhook
   */
  async createWebhook(url: string, events: string[]): Promise<Webhook> {
    return this.request<Webhook>('/webhooks.json', {
      method: 'POST',
      body: JSON.stringify({
        webhook: {
          url,
          events,
        },
      }),
    });
  }

  /**
   * List all webhooks
   */
  async listWebhooks(): Promise<Webhook[]> {
    return this.request<Webhook[]>('/webhooks.json', {
      method: 'GET',
    });
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(id: string): Promise<void> {
    await this.request(`/webhooks/${id}.json`, {
      method: 'DELETE',
    });
  }

  // ===== TAX RATES & LEDGER ACCOUNTS =====

  /**
   * Get all tax rates
   */
  async getTaxRates(): Promise<TaxRate[]> {
    return this.request<TaxRate[]>('/tax_rates.json', {
      method: 'GET',
    });
  }

  /**
   * Get all ledger accounts
   */
  async getLedgerAccounts(): Promise<LedgerAccount[]> {
    return this.request<LedgerAccount[]>('/ledger_accounts.json', {
      method: 'GET',
    });
  }

  /**
   * Get all products
   */
  async getProducts(): Promise<Product[]> {
    return this.request<Product[]>('/products.json', {
      method: 'GET',
    });
  }
}

// Singleton instance
let moneybirdInstance: MoneybirdClient | null = null;

/**
 * Get or create Moneybird client instance
 */
export const getMoneybird = (): MoneybirdClient => {
  if (!moneybirdInstance) {
    const accessToken = process.env.MONEYBIRD_ACCESS_TOKEN;
    const administrationId = process.env.MONEYBIRD_ADMINISTRATION_ID;

    if (!accessToken || !administrationId) {
      throw new Error(
        'Moneybird configuration missing. Please set MONEYBIRD_ACCESS_TOKEN and MONEYBIRD_ADMINISTRATION_ID environment variables.'
      );
    }

    moneybirdInstance = new MoneybirdClient({
      accessToken,
      administrationId,
    });
  }

  return moneybirdInstance;
};

// Export default instance
export const moneybird = new Proxy({} as MoneybirdClient, {
  get: (target, prop) => {
    const client = getMoneybird();
    return client[prop as keyof MoneybirdClient];
  },
});
