import { prisma } from '../../db';
// Automated payment reminder system

import { predictLatePayments, generatePaymentReminder } from '@/lib/ai-finance';


export interface ReminderResult {
  success: boolean;
  remindersSent: number;
  errors: string[];
  details: {
    clientId: string;
    clientName: string;
    invoiceNumber: string;
    amount: number;
    daysOverdue: number;
    reminderType: 'friendly' | 'urgent' | 'final';
    sent?: boolean;
    error?: string;
  }[];
}

/**
 * Send payment reminders for overdue invoices
 */
export async function sendPaymentReminders(): Promise<ReminderResult> {
  const result: ReminderResult = {
    success: true,
    remindersSent: 0,
    errors: [],
    details: [],
  };

  try {
    const now = new Date();

    // Get all overdue or soon-to-be-overdue invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        status: {
          in: ['sent', 'overdue'],
        },
        dueDate: {
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Due within 7 days or overdue
        },
      },
      include: {
        client: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    console.log(`[Payment Reminders] Found ${invoices.length} invoices needing attention`);

    for (const invoice of invoices) {
      try {
        if (!invoice.dueDate) continue;

        const daysUntilDue = Math.floor(
          (invoice.dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );
        const daysOverdue = -daysUntilDue;

        // Determine reminder type based on how overdue
        let reminderType: 'friendly' | 'urgent' | 'final' = 'friendly';
        let shouldSend = false;

        if (daysOverdue >= 30) {
          // 30+ days overdue - final reminder
          reminderType = 'final';
          shouldSend = true;
        } else if (daysOverdue >= 14) {
          // 14-29 days overdue - urgent reminder
          reminderType = 'urgent';
          // Send every 7 days
          const daysSinceLastReminder = invoice.reminderSentAt
            ? Math.floor((now.getTime() - invoice.reminderSentAt.getTime()) / (24 * 60 * 60 * 1000))
            : 999;
          shouldSend = daysSinceLastReminder >= 7;
        } else if (daysOverdue >= 1) {
          // 1-13 days overdue - friendly reminder
          reminderType = 'friendly';
          // Send once
          shouldSend = !invoice.reminderSentAt;
        } else if (daysUntilDue === 3) {
          // 3 days before due - friendly reminder
          reminderType = 'friendly';
          shouldSend = !invoice.reminderSentAt;
        }

        if (!shouldSend) {
          continue;
        }

        // Generate reminder message
        const message = await generatePaymentReminder(invoice.id, reminderType);

        // TODO: Implement email sending functionality
        // This should integrate with your email service (e.g., SendGrid, AWS SES, or nodemailer)
        // Example implementation:
        // await sendEmail({
        //   to: invoice.client.email,
        //   subject: `Betalingsherinnering ${invoice.invoiceNumber}`,
        //   body: message,
        // });
        console.log(`[Payment Reminders] Sending ${reminderType} reminder to ${invoice.client.name}`);
        console.log(`Subject: Betalingsherinnering ${invoice.invoiceNumber}`);
        console.log(`Message: ${message}`);

        // Update invoice
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            reminderSentAt: now,
            status: daysOverdue > 0 ? 'overdue' : 'sent',
          },
        });

        // Create financial alert for urgent/final reminders
        if (reminderType === 'urgent' || reminderType === 'final') {
          await prisma.financialAlert.create({
            data: {
              type: 'overdue_invoice',
              severity: reminderType === 'final' ? 'critical' : 'warning',
              title: `Factuur ${daysOverdue} dagen over tijd`,
              message: `${invoice.client.name} - ${invoice.invoiceNumber} (€${invoice.total.toFixed(2)})`,
              relatedEntityId: invoice.id,
              relatedEntityType: 'invoice',
              actionRequired: true,
              actionUrl: `/financien/facturen`,
            },
          });
        }

        result.remindersSent++;
        result.details.push({
          clientId: invoice.client.id,
          clientName: invoice.client.name,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.total,
          daysOverdue: Math.max(0, daysOverdue),
          reminderType,
          sent: true,
        });
      } catch (invoiceError: any) {
        console.error(`[Payment Reminders] Error for invoice ${invoice.invoiceNumber}:`, invoiceError);
        result.errors.push(`${invoice.invoiceNumber}: ${invoiceError.message}`);
        result.details.push({
          clientId: invoice.client.id,
          clientName: invoice.client.name,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.total,
          daysOverdue: 0,
          reminderType: 'friendly',
          error: invoiceError.message,
        });
      }
    }

    // Get AI predictions for high-risk invoices
    try {
      const predictions = await predictLatePayments();
      
      // Create alerts for high-risk invoices that haven't been reminded yet
      for (const prediction of predictions.slice(0, 5)) { // Top 5 risks
        if (prediction.probability > 0.7) {
          await prisma.financialAlert.create({
            data: {
              type: 'payment_risk',
              severity: 'warning',
              title: 'Hoog risico op late betaling',
              message: `${prediction.clientName} - ${prediction.invoiceNumber} (${Math.round(prediction.probability * 100)}% risico)`,
              relatedEntityId: prediction.invoiceId,
              relatedEntityType: 'invoice',
              actionRequired: true,
              metadata: JSON.parse(JSON.stringify(prediction)),
            },
          });
        }
      }
    } catch (predictionError) {
      console.error('[Payment Reminders] Error generating predictions:', predictionError);
    }

    if (result.errors.length > 0) {
      result.success = false;
    }

    console.log(`[Payment Reminders] Completed: ${result.remindersSent} sent, ${result.errors.length} errors`);

    return result;
  } catch (error: any) {
    console.error('[Payment Reminders] Fatal error:', error);
    result.success = false;
    result.errors.push(`Fatal error: ${error.message}`);
    return result;
  }
}

/**
 * Send a specific reminder to a client
 */
export async function sendSpecificReminder(
  invoiceId: string,
  reminderType: 'friendly' | 'urgent' | 'final'
): Promise<{ success: boolean; error?: string }> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true },
    });

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    // Generate message
    const message = await generatePaymentReminder(invoiceId, reminderType);

    // TODO: Implement email sending functionality - integrate with your email service
    // await sendEmail({ to: invoice.client.email, subject: `Betalingsherinnering ${invoice.invoiceNumber}`, body: message });
    console.log(`[Payment Reminder] Sending ${reminderType} reminder`);
    console.log(`To: ${invoice.client.email}`);
    console.log(`Subject: Betalingsherinnering ${invoice.invoiceNumber}`);
    console.log(`Message: ${message}`);

    // Update invoice
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        reminderSentAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('[Payment Reminder] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check for clients with payment issues and create alerts
 */
export async function checkPaymentHealth(): Promise<void> {
  try {
    const clients = await prisma.client.findMany({
      include: {
        invoices: {
          where: {
            status: {
              in: ['sent', 'overdue'],
            },
          },
        },
      },
    });

    for (const client of clients) {
      const overdueInvoices = client.invoices.filter(inv => inv.status === 'overdue');
      const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0);

      // Create alert for clients with significant overdue amounts
      if (totalOverdue > 500) {
        const existing = await prisma.financialAlert.findFirst({
          where: {
            relatedEntityId: client.id,
            relatedEntityType: 'client',
            type: 'payment_issues',
            dismissed: false,
          },
        });

        if (!existing) {
          await prisma.financialAlert.create({
            data: {
              type: 'payment_issues',
              severity: totalOverdue > 2000 ? 'critical' : 'warning',
              title: 'Klant met betalingsachterstanden',
              message: `${client.name} heeft €${totalOverdue.toFixed(2)} aan openstaande facturen (${overdueInvoices.length} facturen)`,
              relatedEntityId: client.id,
              relatedEntityType: 'client',
              actionRequired: true,
              actionUrl: `/financien/contacten`,
            },
          });
        }
      }
    }
  } catch (error) {
    console.error('[Payment Health Check] Error:', error);
  }
}
