/**
 * Email Invoice Detection and Moneybird Integration
 * Detects invoices in emails and creates them in Moneybird
 */

import { prisma } from './db';
import { analyzeEmail } from './email-ai-analyzer';

interface InboxEmail {
  id: string;
  from: string;
  fromName?: string;
  subject: string;
  textBody?: string;
  htmlBody?: string;
  attachments?: any;
  hasAttachments: boolean;
}

interface DetectionResult {
  isInvoice: boolean;
  moneybirdId?: string;
  error?: string;
}

/**
 * Detect and process invoice from email
 */
export async function detectAndProcessInvoice(
  email: InboxEmail
): Promise<DetectionResult> {
  try {
    const body = email.textBody || email.htmlBody || '';
    
    // First check: Quick keyword detection
    if (!isLikelyInvoice(email.subject, body, email.hasAttachments)) {
      return { isInvoice: false };
    }

    // Second check: AI analysis for better accuracy
    const analysis = await analyzeEmail({
      from: email.from,
      subject: email.subject,
      body: body.substring(0, 2000),
      attachments: email.attachments ? Object.keys(email.attachments) : [],
    });

    if (!analysis.isInvoice || !analysis.invoiceData) {
      return { isInvoice: false };
    }

    // Extract invoice details
    const invoiceData = {
      vendor: analysis.invoiceData.vendor || extractVendorName(email.from, email.fromName),
      amount: analysis.invoiceData.amount || extractAmount(body),
      dueDate: analysis.invoiceData.dueDate || extractDueDate(body),
      reference: extractInvoiceNumber(email.subject, body),
      description: email.subject,
    };

    console.log('[Invoice Detector] Invoice detected:', invoiceData);

    // Create purchase invoice in Moneybird
    try {
      const moneybirdId = await createMoneybirdInvoice(invoiceData);
      
      // Update email record
      await prisma.inboxEmail.update({
        where: { id: email.id },
        data: {
          isInvoice: true,
          invoiceAmount: invoiceData.amount,
          invoiceVendor: invoiceData.vendor,
          invoiceDueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : null,
          moneybirdId,
          updatedAt: new Date(),
        },
      });

      return {
        isInvoice: true,
        moneybirdId,
      };
    } catch (moneybirdError: any) {
      console.error('[Invoice Detector] Moneybird error:', moneybirdError.message);
      
      // Still mark as invoice even if Moneybird fails
      await prisma.inboxEmail.update({
        where: { id: email.id },
        data: {
          isInvoice: true,
          invoiceAmount: invoiceData.amount,
          invoiceVendor: invoiceData.vendor,
          invoiceDueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : null,
          updatedAt: new Date(),
        },
      });

      return {
        isInvoice: true,
        error: `Invoice detected but Moneybird sync failed: ${moneybirdError.message}`,
      };
    }
  } catch (error: any) {
    console.error('[Invoice Detector] Error:', error.message);
    return {
      isInvoice: false,
      error: error.message,
    };
  }
}

/**
 * Quick keyword-based invoice detection
 */
function isLikelyInvoice(subject: string, body: string, hasAttachments: boolean): boolean {
  const text = `${subject} ${body}`.toLowerCase();
  
  // Invoice keywords
  const invoiceKeywords = [
    'factuur',
    'invoice',
    'betaling',
    'payment',
    'rekening',
    'bill',
    'betaalverzoek',
    'payment request',
    'nota',
    'receipt',
  ];

  const hasInvoiceKeyword = invoiceKeywords.some(keyword => 
    text.includes(keyword)
  );

  // Check for amount patterns
  const hasAmount = /€\s*\d+[\.,]\d{2}|\d+[\.,]\d{2}\s*euro/i.test(text);

  // Check for PDF attachment (common for invoices)
  const likelyHasPdfInvoice = hasAttachments && text.includes('.pdf');

  return hasInvoiceKeyword && (hasAmount || likelyHasPdfInvoice);
}

/**
 * Extract vendor name from email
 */
function extractVendorName(fromEmail: string, fromName?: string): string {
  if (fromName) {
    // Clean up common email patterns from name
    return fromName.replace(/noreply|no-reply|info|admin|support/gi, '').trim() || fromName;
  }
  
  // Extract domain name as vendor
  const domain = fromEmail.split('@')[1];
  if (domain) {
    return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
  }
  
  return fromEmail;
}

/**
 * Extract invoice amount from text
 */
function extractAmount(text: string): number | undefined {
  // Match various amount patterns
  const patterns = [
    /totaal[:\s]+€?\s*(\d+[\.,]\d{2})/i,
    /total[:\s]+€?\s*(\d+[\.,]\d{2})/i,
    /bedrag[:\s]+€?\s*(\d+[\.,]\d{2})/i,
    /amount[:\s]+€?\s*(\d+[\.,]\d{2})/i,
    /€\s*(\d+[\.,]\d{2})/i,
    /(\d+[\.,]\d{2})\s*euro/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(',', '.'));
      if (amount > 0) {
        return amount;
      }
    }
  }

  return undefined;
}

/**
 * Extract due date from text
 */
function extractDueDate(text: string): string | undefined {
  // Match various date patterns
  const patterns = [
    /vervaldatum[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /due date[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /betalen voor[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /pay before[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        // Parse and convert to ISO date
        const dateParts = match[1].split(/[-\/]/);
        let day, month, year;
        
        if (dateParts.length === 3) {
          // Assume DD/MM/YYYY or DD-MM-YYYY format
          day = parseInt(dateParts[0]);
          month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
          year = parseInt(dateParts[2]);
          
          // Fix 2-digit years
          if (year < 100) {
            year += 2000;
          }
          
          const date = new Date(year, month, day);
          return date.toISOString();
        }
      } catch (e) {
        // Invalid date, continue
      }
    }
  }

  return undefined;
}

/**
 * Extract invoice number from text
 */
function extractInvoiceNumber(subject: string, body: string): string | undefined {
  const text = `${subject} ${body}`;
  
  const patterns = [
    /factuurnummer[:\s]+([A-Z0-9-]+)/i,
    /invoice number[:\s]+([A-Z0-9-]+)/i,
    /factuur[:\s]+([A-Z0-9-]+)/i,
    /invoice[:\s]+([A-Z0-9-]+)/i,
    /nr[:\s]+([A-Z0-9-]+)/i,
    /no[:\s]+([A-Z0-9-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return undefined;
}

/**
 * Create purchase invoice in Moneybird
 */
async function createMoneybirdInvoice(invoiceData: {
  vendor: string;
  amount?: number;
  dueDate?: string;
  reference?: string;
  description: string;
}): Promise<string> {
  // Import Moneybird module
  const { createPurchaseInvoice } = await import('./moneybird');

  // Prepare invoice data for Moneybird
  const invoice = {
    contact_name: invoiceData.vendor,
    reference: invoiceData.reference || `Email Invoice - ${new Date().toISOString().split('T')[0]}`,
    date: new Date().toISOString().split('T')[0],
    due_date: invoiceData.dueDate 
      ? new Date(invoiceData.dueDate).toISOString().split('T')[0]
      : undefined,
    details_attributes: [
      {
        description: invoiceData.description,
        amount: invoiceData.amount ? `${invoiceData.amount}` : '0',
        tax_rate_id: process.env.MONEYBIRD_TAX_RATE_21_ID || '', // 21% BTW
      },
    ],
  };

  const result = await createPurchaseInvoice(invoice);
  return result.id;
}
