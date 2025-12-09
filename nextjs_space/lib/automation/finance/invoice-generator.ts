// Automated invoice generation for monthly subscriptions

import { getMoneybird } from '@/lib/moneybird';


export interface InvoiceGenerationResult {
  success: boolean;
  invoicesGenerated: number;
  errors: string[];
  details: {
    clientId: string;
    clientName: string;
    invoiceId?: string;
    amount?: number;
    error?: string;
  }[];
}

/**
 * Generate monthly subscription invoices for all active clients
 */
export async function generateMonthlyInvoices(): Promise<InvoiceGenerationResult> {
  const result: InvoiceGenerationResult = {
    success: true,
    invoicesGenerated: 0,
    errors: [],
    details: [],
  };

  try {
    // Get all clients with active subscriptions
    const activeClients = await prisma.client.findMany({
      where: {
        subscriptionStatus: 'active',
        subscriptionPlan: {
          not: null,
        },
      },
    });

    console.log(`[Invoice Generator] Found ${activeClients.length} active clients`);

    const moneybird = getMoneybird();

    // Plan pricing
    const planPricing: Record<string, number> = {
      basis: 29,
      professional: 79,
      business: 199,
      enterprise: 499,
    };

    for (const client of activeClients) {
      try {
        const plan = (client.subscriptionPlan || 'basis').toLowerCase();
        const amount = planPricing[plan] || 29;

        // Check if invoice already generated this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const existingInvoice = await prisma.invoice.findFirst({
          where: {
            clientId: client.id,
            issueDate: {
              gte: startOfMonth,
            },
            invoiceNumber: {
              contains: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
            },
          },
        });

        if (existingInvoice) {
          console.log(`[Invoice Generator] Invoice already exists for ${client.name}`);
          result.details.push({
            clientId: client.id,
            clientName: client.name,
            error: 'Invoice already generated this month',
          });
          continue;
        }

        // Create invoice in our database
        const invoiceNumber = `INV-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${client.id.substring(0, 8)}`;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14); // 14 days payment term

        const invoice = await prisma.invoice.create({
          data: {
            clientId: client.id,
            invoiceNumber,
            status: 'draft',
            issueDate: now,
            dueDate,
            subtotal: amount / 1.21, // Excluding 21% VAT
            taxRate: 21,
            taxAmount: amount - (amount / 1.21),
            total: amount,
            paymentTerms: '14 dagen',
            notes: `WritgoAI ${plan.charAt(0).toUpperCase() + plan.slice(1)} Abonnement - ${now.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}`,
            items: {
              create: [
                {
                  description: `WritgoAI ${plan.charAt(0).toUpperCase() + plan.slice(1)} Abonnement`,
                  quantity: 1,
                  unitPrice: amount,
                  total: amount,
                },
              ],
            },
          },
        });

        // Create invoice in Moneybird if client has contact ID
        if (client.moneybirdContactId) {
          try {
            const moneybirdInvoice = await moneybird.createSalesInvoice({
              contact_id: client.moneybirdContactId,
              invoice_date: now.toISOString().split('T')[0],
              details_attributes: [
                {
                  description: `WritgoAI ${plan.charAt(0).toUpperCase() + plan.slice(1)} Abonnement`,
                  price: String(amount / 1.21),
                  amount: '1',
                  tax_rate_id: process.env.MONEYBIRD_TAX_RATE_21_ID,
                },
              ],
            });

            // Update invoice with Moneybird ID
            await prisma.invoice.update({
              where: { id: invoice.id },
              data: {
                moneybirdInvoiceId: moneybirdInvoice.id,
                moneybirdState: moneybirdInvoice.state,
                status: 'sent',
              },
            });

            // Send invoice via email
            await moneybird.sendSalesInvoice(moneybirdInvoice.id, {
              delivery_method: 'Email',
              email_address: client.email,
              email_message: `Beste ${client.name},\n\nBijgevoegd vind je de factuur voor je WritgoAI abonnement.\n\nMet vriendelijke groet,\nWritgoAI Team`,
            });

            console.log(`[Invoice Generator] Generated invoice for ${client.name}: ${invoiceNumber}`);
          } catch (mbError: any) {
            console.error(`[Invoice Generator] Moneybird error for ${client.name}:`, mbError);
            // Keep local invoice even if Moneybird fails
          }
        } else {
          // Update to sent status even without Moneybird
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { status: 'sent' },
          });
        }

        result.invoicesGenerated++;
        result.details.push({
          clientId: client.id,
          clientName: client.name,
          invoiceId: invoice.id,
          amount,
        });
      } catch (clientError: any) {
        console.error(`[Invoice Generator] Error for client ${client.name}:`, clientError);
        result.errors.push(`${client.name}: ${clientError.message}`);
        result.details.push({
          clientId: client.id,
          clientName: client.name,
          error: clientError.message,
        });
      }
    }

    if (result.errors.length > 0) {
      result.success = false;
    }

    // Create financial alert for summary
    await prisma.financialAlert.create({
      data: {
        type: 'invoice_generation',
        severity: 'info',
        title: 'Maandelijkse facturen gegenereerd',
        message: `${result.invoicesGenerated} facturen succesvol gegenereerd. ${result.errors.length} fouten.`,
        actionRequired: result.errors.length > 0,
        metadata: JSON.parse(JSON.stringify(result)),
      },
    });

    console.log(`[Invoice Generator] Completed: ${result.invoicesGenerated} generated, ${result.errors.length} errors`);

    return result;
  } catch (error: any) {
    console.error('[Invoice Generator] Fatal error:', error);
    result.success = false;
    result.errors.push(`Fatal error: ${error.message}`);
    return result;
  }
}

/**
 * Generate invoice for a specific client
 */
export async function generateClientInvoice(
  clientId: string,
  description: string,
  amount: number
): Promise<{ success: boolean; invoice?: any; error?: string }> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return { success: false, error: 'Client not found' };
    }

    const now = new Date();
    const invoiceNumber = `INV-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${clientId.substring(0, 8)}-${Date.now()}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const invoice = await prisma.invoice.create({
      data: {
        clientId: client.id,
        invoiceNumber,
        status: 'draft',
        issueDate: now,
        dueDate,
        subtotal: amount / 1.21,
        taxRate: 21,
        taxAmount: amount - (amount / 1.21),
        total: amount,
        paymentTerms: '14 dagen',
        notes: description,
        items: {
          create: [
            {
              description,
              quantity: 1,
              unitPrice: amount,
              total: amount,
            },
          ],
        },
      },
    });

    // Create in Moneybird if contact exists
    if (client.moneybirdContactId) {
      const moneybird = getMoneybird();
      
      const moneybirdInvoice = await moneybird.createSalesInvoice({
        contact_id: client.moneybirdContactId,
        invoice_date: now.toISOString().split('T')[0],
        details_attributes: [
          {
            description,
            price: String(amount / 1.21),
            amount: '1',
            tax_rate_id: process.env.MONEYBIRD_TAX_RATE_21_ID,
          },
        ],
      });

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          moneybirdInvoiceId: moneybirdInvoice.id,
          moneybirdState: moneybirdInvoice.state,
          status: 'sent',
        },
      });
    }

    return { success: true, invoice };
  } catch (error: any) {
    console.error(`[Invoice Generator] Error generating invoice:`, error);
    return { success: false, error: error.message };
  }
}
