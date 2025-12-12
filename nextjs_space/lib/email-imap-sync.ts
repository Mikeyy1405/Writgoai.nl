/**
 * IMAP Email Sync Service
 * Handles real IMAP connections and email synchronization
 */

import Imap from 'imap-simple';
import { simpleParser, ParsedMail, AddressObject } from 'mailparser';
import { prisma } from './db';

export interface IMAPConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
  tlsOptions?: {
    rejectUnauthorized?: boolean;
  };
}

export interface ParsedEmail {
  messageId: string;
  from: string;
  fromName?: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  textBody?: string;
  htmlBody?: string;
  receivedAt: Date;
  hasAttachments: boolean;
  attachments: any[];
  headers: any;
  inReplyTo?: string;
  references: string[];
}

/**
 * Connect to IMAP server
 */
export async function connectToIMAP(config: IMAPConfig): Promise<any> {
  const imapConfig = {
    imap: {
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.tls,
      tlsOptions: config.tlsOptions || { rejectUnauthorized: false },
      authTimeout: 10000,
      connTimeout: 10000,
    },
  };

  try {
    const connection = await Imap.connect(imapConfig);
    console.log('[IMAP] Connected successfully to', config.host);
    return connection;
  } catch (error: any) {
    console.error('[IMAP] Connection error:', error.message);
    throw new Error(`Failed to connect to IMAP server: ${error.message}`);
  }
}

/**
 * Fetch new emails from IMAP server
 */
export async function fetchNewEmails(
  connection: any,
  since?: Date,
  folder: string = 'INBOX'
): Promise<any[]> {
  try {
    // Open mailbox
    await connection.openBox(folder);
    console.log(`[IMAP] Opened folder: ${folder}`);

    // Build search criteria
    const searchCriteria = since
      ? [['SINCE', since]]
      : ['ALL'];

    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: false,
      struct: true,
    };

    // Search and fetch messages
    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`[IMAP] Found ${messages.length} messages`);

    return messages;
  } catch (error: any) {
    console.error('[IMAP] Error fetching emails:', error.message);
    throw new Error(`Failed to fetch emails: ${error.message}`);
  }
}

/**
 * Parse raw email message
 */
export async function parseEmail(rawMessage: any): Promise<ParsedEmail | null> {
  try {
    // Get the message body
    const all = rawMessage.parts.find((part: any) => part.which === '');
    if (!all || !all.body) {
      console.warn('[IMAP] No message body found');
      return null;
    }

    // Parse with mailparser
    const parsed: ParsedMail = await simpleParser(all.body);

    // Extract email addresses
    const getEmailAddresses = (addressObj?: AddressObject | AddressObject[]): string[] => {
      if (!addressObj) return [];
      const addresses = Array.isArray(addressObj) ? addressObj : [addressObj];
      return addresses.flatMap(addr => 
        addr.value.map(v => v.address || '')
      ).filter(Boolean);
    };

    const getFirstEmailName = (addressObj?: AddressObject | AddressObject[]): string | undefined => {
      if (!addressObj) return undefined;
      const addresses = Array.isArray(addressObj) ? addressObj : [addressObj];
      const first = addresses[0]?.value[0];
      return first?.name || undefined;
    };

    // Extract references
    const references: string[] = [];
    if (parsed.references) {
      if (typeof parsed.references === 'string') {
        references.push(...parsed.references.split(/\s+/).filter(Boolean));
      } else if (Array.isArray(parsed.references)) {
        references.push(...parsed.references);
      }
    }

    // Process attachments
    const attachments = (parsed.attachments || []).map(att => ({
      filename: att.filename || 'unnamed',
      contentType: att.contentType,
      size: att.size,
      checksum: att.checksum,
    }));

    const result: ParsedEmail = {
      messageId: parsed.messageId || `${Date.now()}-${Math.random()}`,
      from: getEmailAddresses(parsed.from)[0] || '',
      fromName: getFirstEmailName(parsed.from),
      to: getEmailAddresses(parsed.to),
      cc: getEmailAddresses(parsed.cc),
      bcc: getEmailAddresses(parsed.bcc),
      subject: parsed.subject || '(No Subject)',
      textBody: parsed.text,
      htmlBody: parsed.html ? parsed.html.toString() : undefined,
      receivedAt: parsed.date || new Date(),
      hasAttachments: attachments.length > 0,
      attachments,
      headers: parsed.headers ? Object.fromEntries(parsed.headers) : {},
      inReplyTo: parsed.inReplyTo,
      references,
    };

    return result;
  } catch (error: any) {
    console.error('[IMAP] Error parsing email:', error.message);
    return null;
  }
}

/**
 * Save email to database
 */
export async function saveEmailToDatabase(
  email: ParsedEmail,
  mailboxId: string,
  threadId?: string
): Promise<string | null> {
  try {
    // Create snippet (first 200 chars of text body)
    const snippet = email.textBody
      ? email.textBody.substring(0, 200).replace(/\s+/g, ' ').trim()
      : email.subject.substring(0, 200);

    // Check if email already exists
    const existing = await prisma.inboxEmail.findUnique({
      where: { messageId: email.messageId },
    });

    if (existing) {
      console.log(`[IMAP] Email ${email.messageId} already exists, skipping`);
      return existing.id;
    }

    // Create email record
    const inboxEmail = await prisma.inboxEmail.create({
      data: {
        mailboxId,
        messageId: email.messageId,
        from: email.from,
        fromName: email.fromName,
        to: email.to,
        cc: email.cc,
        bcc: email.bcc,
        subject: email.subject,
        textBody: email.textBody,
        htmlBody: email.htmlBody,
        snippet,
        receivedAt: email.receivedAt,
        hasAttachments: email.hasAttachments,
        attachments: email.attachments,
        headers: email.headers,
        inReplyTo: email.inReplyTo,
        references: email.references,
        threadId: threadId || null,
        folder: 'inbox',
        isRead: false,
        isStarred: false,
        isArchived: false,
      },
    });

    console.log(`[IMAP] Saved email: ${email.subject}`);
    return inboxEmail.id;
  } catch (error: any) {
    console.error('[IMAP] Error saving email to database:', error.message);
    return null;
  }
}

/**
 * Complete mailbox sync flow with retry logic
 */
export async function syncMailbox(
  mailboxId: string,
  maxRetries: number = 3
): Promise<{
  success: boolean;
  newEmails: number;
  error?: string;
}> {
  let retries = 0;
  let lastError: string | undefined;

  while (retries < maxRetries) {
    try {
      // Get mailbox configuration
      const mailbox = await prisma.mailboxConnection.findUnique({
        where: { id: mailboxId },
      });

      if (!mailbox) {
        return { success: false, newEmails: 0, error: 'Mailbox not found' };
      }

      if (!mailbox.isActive) {
        return { success: false, newEmails: 0, error: 'Mailbox is inactive' };
      }

      // For OAuth providers, refresh token if needed
      if (mailbox.provider === 'gmail' || mailbox.provider === 'outlook') {
        if (mailbox.tokenExpiry && new Date(mailbox.tokenExpiry) < new Date()) {
          console.log('[IMAP] Token expired, needs refresh');
          // Token refresh would happen here
          return { 
            success: false, 
            newEmails: 0, 
            error: 'OAuth token expired - please reconnect mailbox' 
          };
        }
      }

      // Decrypt password
      // WARNING: Base64 is NOT secure encryption! Replace with proper decryption in production
      // TODO: Implement proper password decryption using crypto module or secrets manager
      const password = mailbox.password 
        ? Buffer.from(mailbox.password, 'base64').toString('utf-8')
        : mailbox.accessToken || '';

      if (!password) {
        return { 
          success: false, 
          newEmails: 0, 
          error: 'No authentication credentials found' 
        };
      }

      // Build IMAP config
      const imapConfig: IMAPConfig = {
        host: mailbox.imapHost || '',
        port: mailbox.imapPort || 993,
        user: mailbox.email,
        password,
        tls: mailbox.imapTls !== false,
        tlsOptions: { 
          rejectUnauthorized: false // Allow self-signed or mismatched certificates
        },
      };

      // Connect to IMAP
      const connection = await connectToIMAP(imapConfig);

      try {
        // Fetch emails since last sync (or all if first sync)
        const since = mailbox.lastSyncAt || undefined;
        const messages = await fetchNewEmails(connection, since);

        let newEmailCount = 0;

        // Parse and save each message
        for (const message of messages) {
          const parsed = await parseEmail(message);
          if (parsed) {
            const emailId = await saveEmailToDatabase(parsed, mailboxId);
            if (emailId) {
              newEmailCount++;
            }
          }
        }

        // Update last sync time
        await prisma.mailboxConnection.update({
          where: { id: mailboxId },
          data: {
            lastSyncAt: new Date(),
            lastError: null,
            updatedAt: new Date(),
          },
        });

        // Close connection
        await connection.end();

        console.log(`[IMAP] Sync complete: ${newEmailCount} new emails`);
        return { success: true, newEmails: newEmailCount };
      } catch (error: any) {
        // Close connection on error
        try {
          await connection.end();
        } catch (e) {
          // Ignore close errors
        }
        throw error;
      }
    } catch (error: any) {
      lastError = error.message;
      retries++;
      
      // Log error to database
      try {
        await prisma.mailboxConnection.update({
          where: { id: mailboxId },
          data: {
            lastError: lastError,
            updatedAt: new Date(),
          },
        });
      } catch (e) {
        // Ignore database update errors
      }

      if (retries < maxRetries) {
        // Exponential backoff: 2^retries seconds
        const delay = Math.pow(2, retries) * 1000;
        console.log(`[IMAP] Retry ${retries}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return {
    success: false,
    newEmails: 0,
    error: lastError || 'Unknown error after all retries',
  };
}

/**
 * Test IMAP connection
 */
export async function testImapConnection(config: IMAPConfig): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const connection = await connectToIMAP(config);
    await connection.end();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
