import { sendEmail, emailTemplates } from './email-service';
import { prisma as db } from './db';
import { sendLowCreditsEmail } from './email';

interface AdminNotificationParams {
  type: string;
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  details?: Record<string, any>;
}

/**
 * Send admin notification for important events
 * Supports both object-style and 2-argument style for backwards compatibility
 */
export async function sendAdminNotification(
  typeOrParams: string | AdminNotificationParams,
  data?: Record<string, any>
) {
  try {
    const adminEmail = 'info@writgo.nl';
    
    // Handle both calling styles
    let type: string;
    let notificationData: Record<string, any>;
    
    if (typeof typeOrParams === 'object') {
      type = typeOrParams.type;
      notificationData = {
        clientId: typeOrParams.clientId,
        clientName: typeOrParams.clientName,
        clientEmail: typeOrParams.clientEmail,
        ...typeOrParams.details,
      };
    } else {
      type = typeOrParams;
      notificationData = data || {};
    }
    
    let subject = '';
    let html = '';
    
    switch (type) {
      case 'new_registration':
        subject = `Nieuwe Registratie: ${notificationData.clientName || 'Nieuwe Klant'}`;
        html = `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #10b981;">Nieuwe Registratie</h2>
            <p><strong>Naam:</strong> ${notificationData.clientName || 'N/A'}</p>
            <p><strong>Email:</strong> ${notificationData.email || notificationData.clientEmail || 'N/A'}</p>
            <p><strong>Bedrijf:</strong> ${notificationData.companyName || 'N/A'}</p>
            <p><strong>Website:</strong> ${notificationData.website || 'N/A'}</p>
          </div>
        `;
        break;
      case 'payment_received':
        subject = `Betaling Ontvangen: ${notificationData.invoiceNumber || 'Factuur'}`;
        html = `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #10b981;">Betaling Ontvangen</h2>
            <p><strong>Factuurnummer:</strong> ${notificationData.invoiceNumber || 'N/A'}</p>
            <p><strong>Bedrag:</strong> €${notificationData.amount?.toFixed(2) || '0.00'}</p>
            <p><strong>Klant:</strong> ${notificationData.clientName || 'N/A'}</p>
          </div>
        `;
        break;
      case 'subscription_error':
        subject = `⚠️ Subscription Error: ${notificationData.clientName || 'Unknown'}`;
        html = `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #ef4444;">Subscription Error</h2>
            <p><strong>Klant:</strong> ${notificationData.clientName || 'N/A'}</p>
            <p><strong>Email:</strong> ${notificationData.clientEmail || 'N/A'}</p>
            <p><strong>Error:</strong> ${notificationData.error || 'Unknown error'}</p>
            <pre style="background: #f3f4f6; padding: 10px; border-radius: 4px;">${JSON.stringify(notificationData, null, 2)}</pre>
          </div>
        `;
        break;
      case 'subscription_created':
        subject = `🎉 Nieuwe Abonnement: ${notificationData.clientName || 'Klant'}`;
        html = `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #10b981;">Nieuw Abonnement</h2>
            <p><strong>Klant:</strong> ${notificationData.clientName || 'N/A'}</p>
            <p><strong>Email:</strong> ${notificationData.clientEmail || 'N/A'}</p>
            <p><strong>Plan:</strong> ${notificationData.plan || 'N/A'}</p>
            <p><strong>Credits:</strong> ${notificationData.credits || 'N/A'}</p>
          </div>
        `;
        break;
      default:
        subject = `Notificatie: ${type}`;
        html = `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #10b981;">Systeem Notificatie</h2>
            <p><strong>Type:</strong> ${type}</p>
            <pre style="background: #f3f4f6; padding: 10px; border-radius: 4px;">${JSON.stringify(notificationData, null, 2)}</pre>
          </div>
        `;
    }
    
    return await sendEmail({
      to: adminEmail,
      subject,
      html,
    });
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return { success: false, error: 'Failed to send admin notification' };
  }
}

/**
 * Check and notify clients with low credits
 * Can be called with just clientId (will fetch credits from DB) or with both clientId and currentCredits
 */
export async function checkAndNotifyLowCredits(clientId: string, currentCredits?: number) {
  try {
    const client = await db.client.findUnique({
      where: { id: clientId },
    });
    
    if (!client) {
      return { success: false, error: 'Client not found' };
    }
    
    // Use provided credits or fetch from client
    const credits = currentCredits ?? client.credits ?? 0;
    
    // Only notify if credits are low (below 100)
    if (credits > 100) {
      return { success: true, notified: false };
    }
    
    // Send low credits notification
    await sendLowCreditsEmail(
      client.email,
      client.name,
      credits,
      'https://writgoai.nl/client-portal'
    );
    
    return { success: true, notified: true };
  } catch (error) {
    console.error('Error checking/notifying low credits:', error);
    return { success: false, error: 'Failed to check low credits' };
  }
}

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
