/**
 * Email Mailbox Synchronization Library
 * Handles IMAP/SMTP connections and OAuth 2.0 for Gmail and Outlook
 */

import { prisma } from './db';
import { analyzeEmailWithAI, shouldAutoReply, sendAutoReply } from './email-ai-assistant';

/**
 * Sync emails from mailbox using IMAP
 * This is a simplified version - in production you'd use nodemailer or imap-simple
 */
export async function syncMailbox(mailboxId: string): Promise<{
  success: boolean;
  newEmails: number;
  error?: string;
}> {
  try {
    const mailbox = await prisma.mailboxConnection.findUnique({
      where: { id: mailboxId },
      include: {
        client: true,
      },
    });

    if (!mailbox) {
      return { success: false, newEmails: 0, error: 'Mailbox not found' };
    }

    if (!mailbox.isActive) {
      return { success: false, newEmails: 0, error: 'Mailbox is inactive' };
    }

    let newEmailsCount = 0;

    // For OAuth providers, we'd refresh the token here if needed
    if (mailbox.provider === 'gmail' || mailbox.provider === 'outlook') {
      // Check if token needs refresh
      if (mailbox.tokenExpiry && new Date(mailbox.tokenExpiry) < new Date()) {
        await refreshOAuthToken(mailbox);
      }
    }

    // Use real IMAP sync implementation
    const { syncMailbox: syncWithIMAP } = await import('./email-imap-sync');
    const result = await syncWithIMAP(mailboxId);
    
    if (result.success) {
      newEmailsCount = result.newEmails;
      
      // Process new emails with AI analysis
      if (newEmailsCount > 0) {
        const newEmails = await prisma.inboxEmail.findMany({
          where: {
            mailboxId,
            analyzedAt: null,
          },
          orderBy: {
            receivedAt: 'desc',
          },
          take: 10, // Process up to 10 at a time
        });

        for (const email of newEmails) {
          try {
            await processInboxEmail(email.id, mailbox.clientId);
          } catch (error) {
            console.error(`[Mailbox Sync] Error processing email ${email.id}:`, error);
          }
        }
      }
    }

    return {
      success: result.success,
      newEmails: newEmailsCount,
      error: result.error,
    };
  } catch (error: any) {
    console.error('[Mailbox Sync] Error:', error);
    return {
      success: false,
      newEmails: 0,
      error: error.message,
    };
  }
}

/**
 * Refresh OAuth 2.0 token
 */
async function refreshOAuthToken(mailbox: any): Promise<void> {
  try {
    if (mailbox.provider === 'gmail') {
      // Refresh Gmail OAuth token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          refresh_token: mailbox.refreshToken || '',
          grant_type: 'refresh_token',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        await prisma.mailboxConnection.update({
          where: { id: mailbox.id },
          data: {
            accessToken: data.access_token,
            tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
          },
        });
      }
    } else if (mailbox.provider === 'outlook') {
      // Refresh Outlook OAuth token
      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID || '',
          client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
          refresh_token: mailbox.refreshToken || '',
          grant_type: 'refresh_token',
          scope: 'https://outlook.office365.com/IMAP.AccessAsUser.All https://outlook.office365.com/SMTP.Send',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        await prisma.mailboxConnection.update({
          where: { id: mailbox.id },
          data: {
            accessToken: data.access_token,
            tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
          },
        });
      }
    }
  } catch (error) {
    console.error('[OAuth] Error refreshing token:', error);
  }
}

/**
 * Process new inbox email with AI analysis
 */
export async function processInboxEmail(
  emailId: string,
  clientId: string
): Promise<void> {
  try {
    const email = await prisma.inboxEmail.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      return;
    }

    // Analyze with AI
    const { analyzeEmail } = await import('./email-ai-analyzer');
    const analysis = await analyzeEmail({
      from: email.from,
      subject: email.subject,
      body: email.textBody || email.htmlBody || '',
      attachments: email.attachments ? Object.keys(email.attachments as any) : [],
    });

    // Update email with AI analysis
    await prisma.inboxEmail.update({
      where: { id: emailId },
      data: {
        aiSummary: analysis.summary,
        aiSentiment: analysis.sentiment,
        aiCategory: analysis.category,
        aiPriority: analysis.priority,
        aiSuggestedReply: analysis.suggestedReply,
        analyzedAt: new Date(),
        creditsUsed: 5,
      },
    });

    // Check for invoices and process with Moneybird
    if (analysis.isInvoice) {
      const { detectAndProcessInvoice } = await import('./email-invoice-detector');
      await detectAndProcessInvoice(email as any);
    }

    // Check if auto-reply should be sent
    const config = await prisma.emailAutoReplyConfig.findFirst({
      where: {
        clientId,
        mailboxId: email.mailboxId,
        isActive: true,
      },
    });

    if (config) {
      const shouldSend = await shouldAutoReply(config, {
        from: email.from,
        receivedAt: email.receivedAt,
        category: analysis.category,
      });

      if (shouldSend) {
        await sendAutoReply(email, config, clientId);
      }
    }
  } catch (error) {
    console.error('[Process Email] Error:', error);
  }
}

/**
 * Sync all active mailboxes
 * This should be called by a cron job every 15 minutes
 */
export async function syncAllMailboxes(): Promise<void> {
  try {
    const mailboxes = await prisma.mailboxConnection.findMany({
      where: {
        isActive: true,
      },
      include: {
        client: true,
      },
    });

    console.log(`[Mailbox Sync] Syncing ${mailboxes.length} mailboxes...`);

    for (const mailbox of mailboxes) {
      try {
        await syncMailbox(mailbox.id);
      } catch (error) {
        console.error(`[Mailbox Sync] Error syncing ${mailbox.email}:`, error);
      }
    }

    console.log('[Mailbox Sync] All mailboxes synced');
  } catch (error) {
    console.error('[Mailbox Sync] Error syncing mailboxes:', error);
  }
}

/**
 * Encrypt password for storage
 * WARNING: This is a basic implementation. In production, use:
 * - Node.js crypto module with AES-256-GCM
 * - AWS KMS or similar key management service
 * - Or store passwords in a secure vault like HashiCorp Vault
 */
export function encryptPassword(password: string): string {
  // TODO: Implement proper encryption before production
  // For now, using base64 encoding (NOT SECURE - FOR DEVELOPMENT ONLY)
  console.warn('⚠️  WARNING: Using insecure password storage. Implement proper encryption before production!');
  return Buffer.from(password).toString('base64');
}

/**
 * Decrypt password from storage
 * WARNING: This matches the basic encryption above
 */
export function decryptPassword(encrypted: string): string {
  // TODO: Implement proper decryption before production
  return Buffer.from(encrypted, 'base64').toString('utf-8');
}

/**
 * Test IMAP connection
 */
export async function testImapConnection(
  host: string,
  port: number,
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // This would use imap-simple or nodemailer to test the connection
    // Placeholder for now
    console.log(`Testing IMAP connection to ${host}:${port}...`);
    
    // Simulate connection test
    if (!host || !port || !username || !password) {
      return { success: false, error: 'Missing required connection parameters' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Test SMTP connection
 */
export async function testSmtpConnection(
  host: string,
  port: number,
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // This would use nodemailer to test the connection
    // Placeholder for now
    console.log(`Testing SMTP connection to ${host}:${port}...`);
    
    // Simulate connection test
    if (!host || !port || !username || !password) {
      return { success: false, error: 'Missing required connection parameters' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
