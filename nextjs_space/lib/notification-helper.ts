import { sendEmail, emailTemplates } from './email-service';
import { prisma as db } from './db';

/**
 * Send notification when a new assignment is created
 */
export async function notifyAssignmentCreated(assignmentId: string) {
  try {
    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId },
      include: { client: true },
    });

    if (!assignment) {
      console.error('Assignment not found for notification');
      return { success: false, error: 'Assignment not found' };
    }

    const emailHtml = emailTemplates.assignmentCreated(
      assignment.title,
      assignment.type,
      assignment.deadline?.toISOString() || '',
      assignment.client.name
    );

    return await sendEmail({
      to: assignment.client.email,
      subject: `Nieuwe Opdracht: ${assignment.title} - WritGo AI`,
      html: emailHtml,
    });
  } catch (error) {
    console.error('Error sending assignment notification:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}

/**
 * Send notification when a payment is received
 */
export async function notifyPaymentReceived(invoiceId: string) {
  try {
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true },
    });

    if (!invoice) {
      console.error('Invoice not found for notification');
      return { success: false, error: 'Invoice not found' };
    }

    const emailHtml = emailTemplates.paymentReceived(
      invoice.invoiceNumber,
      invoice.total,
      invoice.client.name
    );

    return await sendEmail({
      to: invoice.client.email,
      subject: `Betaling Ontvangen - ${invoice.invoiceNumber}`,
      html: emailHtml,
    });
  } catch (error) {
    console.error('Error sending payment notification:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}

/**
 * Send payment reminder for overdue invoice
 */
export async function sendPaymentReminder(invoiceId: string) {
  try {
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true },
    });

    if (!invoice) {
      console.error('Invoice not found for reminder');
      return { success: false, error: 'Invoice not found' };
    }

    if (invoice.status === 'paid') {
      return { success: false, error: 'Invoice is already paid' };
    }

    if (!invoice.stripePaymentUrl) {
      return { success: false, error: 'No payment URL available' };
    }

    // Calculate days overdue
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    const daysOverdue = Math.floor(
      (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysOverdue <= 0) {
      return { success: false, error: 'Invoice is not overdue yet' };
    }

    const emailHtml = emailTemplates.paymentReminder(
      invoice.invoiceNumber,
      invoice.total,
      invoice.dueDate.toISOString(),
      invoice.stripePaymentUrl,
      invoice.client.name,
      daysOverdue
    );

    return await sendEmail({
      to: invoice.client.email,
      subject: `Betaalherinnering - ${invoice.invoiceNumber}`,
      html: emailHtml,
    });
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    return { success: false, error: 'Failed to send reminder' };
  }
}

/**
 * Notify admin about new client request
 */
export async function notifyAdminNewRequest(requestId: string) {
  try {
    const request = await db.clientRequest.findUnique({
      where: { id: requestId },
      include: { client: true },
    });

    if (!request) {
      console.error('Request not found for notification');
      return { success: false, error: 'Request not found' };
    }

    const emailHtml = emailTemplates.requestReceived(
      request.title,
      request.type
    );

    return await sendEmail({
      to: 'info@writgo.nl',
      subject: `Nieuw Klantverzoek: ${request.title}`,
      html: emailHtml,
    });
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}

/**
 * Check and send reminders for all overdue invoices
 */
export async function checkAndSendPaymentReminders() {
  try {
    const today = new Date();
    const overdueInvoices = await db.invoice.findMany({
      where: {
        status: 'overdue',
        dueDate: {
          lt: today,
        },
        stripePaymentUrl: {
          not: null,
        },
      },
      include: { client: true },
    });

    console.log(`Found ${overdueInvoices.length} overdue invoices`);

    const results = [];
    for (const invoice of overdueInvoices) {
      // Only send reminder if last reminder was sent more than 7 days ago
      // (You can add a lastReminderSent field to the Invoice model if needed)
      const result = await sendPaymentReminder(invoice.id);
      results.push({ invoiceId: invoice.id, result });
    }

    return { success: true, results };
  } catch (error) {
    console.error('Error checking payment reminders:', error);
    return { success: false, error: 'Failed to check reminders' };
  }
}
