/**
 * IMAP Client for Email Management System
 * Handles IMAP connections, fetching emails, and email operations
 */

import { ImapFlow, type ImapFlowOptions } from 'imapflow';
import { simpleParser, type ParsedMail } from 'mailparser';

export interface IMAPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  tls?: boolean;
}

export interface EmailMessage {
  uid: number;
  messageId: string;
  from: { address: string; name?: string };
  to: Array<{ address: string; name?: string }>;
  cc?: Array<{ address: string; name?: string }>;
  bcc?: Array<{ address: string; name?: string }>;
  subject: string;
  date: Date;
  textBody?: string;
  htmlBody?: string;
  snippet?: string;
  isRead: boolean;
  hasAttachments: boolean;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
  headers?: Record<string, any>;
  inReplyTo?: string;
  references?: string[];
}

export interface FetchEmailsOptions {
  folder?: string;
  limit?: number;
  unreadOnly?: boolean;
  since?: Date;
}

/**
 * Create IMAP client connection
 */
async function createClient(config: IMAPConfig): Promise<ImapFlow> {
  const clientConfig: ImapFlowOptions = {
    host: config.host,
    port: config.port,
    secure: config.tls ?? true,
    auth: {
      user: config.username,
      pass: config.password,
    },
    logger: false, // Disable logging in production
    tls: {
      rejectUnauthorized: false, // Allow self-signed or mismatched certificates
    },
  };

  const client = new ImapFlow(clientConfig);
  await client.connect();
  
  return client;
}

/**
 * Test IMAP connection
 */
export async function testConnection(config: IMAPConfig): Promise<{ success: boolean; message: string; error?: string }> {
  let client: ImapFlow | null = null;
  
  try {
    client = await createClient(config);
    
    // Try to list mailboxes as a connection test
    const mailboxes = await client.list();
    
    await client.logout();
    
    return {
      success: true,
      message: `Successfully connected to ${config.host}. Found ${mailboxes.length} mailboxes.`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to connect to IMAP server',
      error: error.message || String(error),
    };
  } finally {
    if (client) {
      try {
        await client.logout();
      } catch (e) {
        // Ignore logout errors
      }
    }
  }
}

/**
 * Parse email message from IMAP
 */
async function parseEmailMessage(source: Buffer, uid: number, flags: Set<string>): Promise<EmailMessage> {
  const parsed: ParsedMail = await simpleParser(source);
  
  // Extract snippet (first 200 chars of text)
  const snippet = parsed.text
    ? parsed.text.substring(0, 200).replace(/\n/g, ' ').trim()
    : parsed.subject || '';

  // Parse attachments
  const attachments = parsed.attachments
    ? parsed.attachments.map((att) => ({
        filename: att.filename || 'unnamed',
        contentType: att.contentType,
        size: att.size,
      }))
    : [];

  // Helper to extract addresses
  const getAddresses = (addressObj: any) => {
    if (!addressObj) return [];
    const addressArray = Array.isArray(addressObj) ? addressObj : [addressObj];
    return addressArray.flatMap((obj) => 
      (obj.value || []).map((addr: any) => ({
        address: addr.address || '',
        name: addr.name,
      }))
    );
  };

  return {
    uid,
    messageId: parsed.messageId || `uid-${uid}`,
    from: {
      address: parsed.from?.value?.[0]?.address || parsed.from?.text || '',
      name: parsed.from?.value?.[0]?.name,
    },
    to: getAddresses(parsed.to),
    cc: getAddresses(parsed.cc),
    bcc: getAddresses(parsed.bcc),
    subject: parsed.subject || '(No Subject)',
    date: parsed.date || new Date(),
    textBody: parsed.text,
    htmlBody: parsed.html !== false ? String(parsed.html || '') : undefined,
    snippet,
    isRead: flags.has('\\Seen'),
    hasAttachments: attachments.length > 0,
    attachments,
    headers: parsed.headers ? Object.fromEntries(parsed.headers) : undefined,
    inReplyTo: parsed.inReplyTo,
    references: Array.isArray(parsed.references) ? parsed.references : parsed.references ? [parsed.references] : [],
  };
}

/**
 * Fetch emails from inbox
 */
export async function fetchEmails(
  config: IMAPConfig,
  options: FetchEmailsOptions = {}
): Promise<{ success: boolean; emails?: EmailMessage[]; error?: string; total?: number }> {
  let client: ImapFlow | null = null;
  
  try {
    const {
      folder = 'INBOX',
      limit = 50,
      unreadOnly = false,
      since,
    } = options;

    client = await createClient(config);
    
    // Lock and select mailbox
    const lock = await client.getMailboxLock(folder);
    
    try {
      // Get mailbox status
      const status = await client.status(folder, { messages: true });
      const total = status.messages || 0;
      
      if (total === 0) {
        return {
          success: true,
          emails: [],
          total: 0,
        };
      }

      // Build search query
      let searchQuery: any = { all: true };
      
      if (unreadOnly) {
        searchQuery = { unseen: true };
      }
      
      if (since) {
        searchQuery = { ...searchQuery, since };
      }

      // Search for messages
      const messages = await client.search(searchQuery, { uid: true });
      
      // Get the last N messages (most recent)
      const uids = Array.isArray(messages) ? messages.slice(-limit) : [];
      
      if (uids.length === 0) {
        return {
          success: true,
          emails: [],
          total,
        };
      }

      // Fetch messages
      const emails: EmailMessage[] = [];
      
      for await (const msg of client.fetch(uids, {
        uid: true,
        flags: true,
        source: true,
      })) {
        const email = await parseEmailMessage(msg.source, msg.uid, msg.flags);
        emails.push(email);
      }

      // Sort by date (newest first)
      emails.sort((a, b) => b.date.getTime() - a.date.getTime());

      return {
        success: true,
        emails,
        total,
      };
    } finally {
      lock.release();
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || String(error),
    };
  } finally {
    if (client) {
      try {
        await client.logout();
      } catch (e) {
        // Ignore logout errors
      }
    }
  }
}

/**
 * Fetch single email by UID
 */
export async function fetchEmailById(
  config: IMAPConfig,
  uid: number,
  folder: string = 'INBOX'
): Promise<{ success: boolean; email?: EmailMessage; error?: string }> {
  let client: ImapFlow | null = null;
  
  try {
    client = await createClient(config);
    
    const lock = await client.getMailboxLock(folder);
    
    try {
      // Fetch single message
      const messages = [];
      
      for await (const msg of client.fetch(String(uid), {
        uid: true,
        flags: true,
        source: true,
      })) {
        const email = await parseEmailMessage(msg.source, msg.uid, msg.flags);
        messages.push(email);
      }

      if (messages.length === 0) {
        return {
          success: false,
          error: 'Email not found',
        };
      }

      return {
        success: true,
        email: messages[0],
      };
    } finally {
      lock.release();
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || String(error),
    };
  } finally {
    if (client) {
      try {
        await client.logout();
      } catch (e) {
        // Ignore logout errors
      }
    }
  }
}

/**
 * Mark email as read
 */
export async function markAsRead(
  config: IMAPConfig,
  uid: number,
  folder: string = 'INBOX'
): Promise<{ success: boolean; error?: string }> {
  let client: ImapFlow | null = null;
  
  try {
    client = await createClient(config);
    
    const lock = await client.getMailboxLock(folder);
    
    try {
      await client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true });
      
      return {
        success: true,
      };
    } finally {
      lock.release();
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || String(error),
    };
  } finally {
    if (client) {
      try {
        await client.logout();
      } catch (e) {
        // Ignore logout errors
      }
    }
  }
}

/**
 * Mark email as unread
 */
export async function markAsUnread(
  config: IMAPConfig,
  uid: number,
  folder: string = 'INBOX'
): Promise<{ success: boolean; error?: string }> {
  let client: ImapFlow | null = null;
  
  try {
    client = await createClient(config);
    
    const lock = await client.getMailboxLock(folder);
    
    try {
      await client.messageFlagsRemove(String(uid), ['\\Seen'], { uid: true });
      
      return {
        success: true,
      };
    } finally {
      lock.release();
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || String(error),
    };
  } finally {
    if (client) {
      try {
        await client.logout();
      } catch (e) {
        // Ignore logout errors
      }
    }
  }
}

/**
 * Get list of folders/mailboxes
 */
export async function listFolders(
  config: IMAPConfig
): Promise<{ success: boolean; folders?: string[]; error?: string }> {
  let client: ImapFlow | null = null;
  
  try {
    client = await createClient(config);
    
    const mailboxes = await client.list();
    
    const folders = mailboxes.map((mb) => mb.path);
    
    return {
      success: true,
      folders,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || String(error),
    };
  } finally {
    if (client) {
      try {
        await client.logout();
      } catch (e) {
        // Ignore logout errors
      }
    }
  }
}
