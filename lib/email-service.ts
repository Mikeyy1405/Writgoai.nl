
/**
 * Email Service
 * Handles fetching, parsing, and managing emails from info@WritgoAI.nl
 */

import imaps from 'imap-simple';
import { simpleParser, ParsedMail, AddressObject } from 'mailparser';
import { prisma } from './db';
import { uploadFile } from './s3';
import { getBucketConfig } from './aws-config';

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
}

/**
 * Get email configuration from environment variables
 */
export function getEmailConfig(): EmailConfig {
  return {
    host: process.env.EMAIL_IMAP_HOST || '',
    port: parseInt(process.env.EMAIL_IMAP_PORT || '993'),
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    tls: true,
  };
}

/**
 * Extract email address from AddressObject
 */
function extractEmail(addressObj: AddressObject | AddressObject[] | undefined): string {
  if (!addressObj) return '';
  const addr = Array.isArray(addressObj) ? addressObj[0] : addressObj;
  return addr.value?.[0]?.address || '';
}

/**
 * Extract email addresses from AddressObject array
 */
function extractEmails(addressObj: AddressObject | AddressObject[] | undefined): string[] {
  if (!addressObj) return [];
  const addresses = Array.isArray(addressObj) ? addressObj : [addressObj];
  return addresses.flatMap(addr => 
    addr.value?.map(v => v.address) || []
  ).filter(Boolean);
}

/**
 * Extract name from AddressObject
 */
function extractName(addressObj: AddressObject | AddressObject[] | undefined): string | undefined {
  if (!addressObj) return undefined;
  const addr = Array.isArray(addressObj) ? addressObj[0] : addressObj;
  return addr.value?.[0]?.name;
}

/**
 * Find or create email thread
 */
async function findOrCreateThread(
  subject: string,
  participants: string[],
  messageId: string,
  inReplyTo?: string
): Promise<string> {
  // If this is a reply, find the parent thread
  if (inReplyTo) {
    const parentEmail = await prisma.email.findUnique({
      where: { messageId: inReplyTo },
      select: { threadId: true },
    });
    if (parentEmail) {
      // Update thread activity
      await prisma.emailThread.update({
        where: { id: parentEmail.threadId },
        data: { lastActivity: new Date() },
      });
      return parentEmail.threadId;
    }
  }

  // Try to find existing thread by subject and participants
  const normalizedSubject = subject.replace(/^(Re|Fwd):\s*/i, '').trim();
  const threads = await prisma.emailThread.findMany({
    where: {
      subject: {
        contains: normalizedSubject,
        mode: 'insensitive',
      },
    },
    orderBy: { lastActivity: 'desc' },
    take: 5,
  });

  // Check if any thread has matching participants
  for (const thread of threads) {
    const hasMatchingParticipants = participants.some(p => 
      thread.participants.includes(p)
    );
    if (hasMatchingParticipants) {
      // Update thread activity
      await prisma.emailThread.update({
        where: { id: thread.id },
        data: { lastActivity: new Date() },
      });
      return thread.id;
    }
  }

  // Create new thread
  const newThread = await prisma.emailThread.create({
    data: {
      subject: normalizedSubject,
      participants,
      lastActivity: new Date(),
    },
  });

  return newThread.id;
}

/**
 * Process and store email attachment
 */
async function processAttachment(
  attachment: any,
  emailId: string
): Promise<void> {
  try {
    const config = getBucketConfig();
    const timestamp = Date.now();
    const sanitizedFilename = attachment.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `${config.folderPrefix}email-attachments/${emailId}/${timestamp}-${sanitizedFilename}`;
    
    const cloudStoragePath = await uploadFile(attachment.content, s3Key);

    await prisma.emailAttachment.create({
      data: {
        emailId,
        filename: attachment.filename,
        mimeType: attachment.contentType,
        size: attachment.size,
        cloudStoragePath,
      },
    });
  } catch (error) {
    console.error('Error processing attachment:', error);
  }
}

/**
 * Fetch new emails from inbox
 */
export async function fetchNewEmails(): Promise<number> {
  const config = getEmailConfig();
  
  if (!config.host || !config.user || !config.password) {
    console.error('[Email Service] Email configuration incomplete');
    return 0;
  }

  let connection;
  try {
    console.log('[Email Service] Connecting to email server...');
    
    connection = await imaps.connect({
      imap: {
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        tls: config.tls,
        authTimeout: 10000,
      },
    });

    console.log('[Email Service] Connected successfully');

    await connection.openBox('INBOX');
    
    // Search for unseen emails
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: false,
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`[Email Service] Found ${messages.length} new emails`);

    let processedCount = 0;

    for (const item of messages) {
      try {
        const all = item.parts.find((part: any) => part.which === '');
        if (!all || !all.body) continue;

        const parsed: ParsedMail = await simpleParser(all.body);

        // Extract email data
        const messageId = parsed.messageId || `generated-${Date.now()}-${Math.random()}`;
        const from = extractEmail(parsed.from);
        const fromName = extractName(parsed.from);
        const to = extractEmails(parsed.to);
        const cc = extractEmails(parsed.cc);
        const bcc = extractEmails(parsed.bcc);
        const subject = parsed.subject || '(No Subject)';
        const textBody = parsed.text || '';
        const htmlBody = parsed.html || undefined;
        const snippet = textBody.substring(0, 200).trim();
        const receivedAt = parsed.date || new Date();
        const inReplyTo = parsed.inReplyTo || undefined;
        const references = parsed.references || [];
        const hasAttachments = (parsed.attachments?.length || 0) > 0;

        // Check if email already exists
        const existingEmail = await prisma.email.findUnique({
          where: { messageId },
        });

        if (existingEmail) {
          console.log(`[Email Service] Email ${messageId} already exists, skipping`);
          continue;
        }

        // Determine all participants
        const participants = Array.from(new Set([from, ...to, ...cc]));

        // Find or create thread
        const threadId = await findOrCreateThread(
          subject,
          participants,
          messageId,
          inReplyTo
        );

        // Create email record
        const email = await prisma.email.create({
          data: {
            threadId,
            messageId,
            inReplyTo,
            references: Array.isArray(references) ? references : [references].filter(Boolean),
            from,
            fromName,
            to,
            cc,
            bcc,
            replyTo: extractEmail(parsed.replyTo),
            subject,
            textBody,
            htmlBody,
            snippet,
            hasAttachments,
            receivedAt,
            isIncoming: true,
            isRead: false,
          },
        });

        // Process attachments
        if (hasAttachments && parsed.attachments) {
          for (const attachment of parsed.attachments) {
            await processAttachment(attachment, email.id);
          }
        }

        processedCount++;
        console.log(`[Email Service] Processed email: ${subject} from ${from}`);
      } catch (error) {
        console.error('[Email Service] Error processing email:', error);
      }
    }

    console.log(`[Email Service] Successfully processed ${processedCount} new emails`);
    return processedCount;
  } catch (error) {
    console.error('[Email Service] Error fetching emails:', error);
    throw error;
  } finally {
    if (connection) {
      connection.end();
    }
  }
}

/**
 * Send email reply
 */
export async function sendEmailReply(params: {
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  html?: string;
  inReplyTo?: string;
  references?: string[];
  threadId: string;
}): Promise<string> {
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST,
    port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
    secure: process.env.EMAIL_SMTP_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: `WritgoAI <${process.env.EMAIL_USER}>`,
    to: Array.isArray(params.to) ? params.to : [params.to],
    cc: params.cc,
    bcc: params.bcc,
    subject: params.subject,
    text: params.text,
    html: params.html,
    inReplyTo: params.inReplyTo,
    references: params.references,
  };

  const info = await transporter.sendMail(mailOptions);
  const messageId = info.messageId;

  // Store sent email in database
  await prisma.email.create({
    data: {
      threadId: params.threadId,
      messageId,
      inReplyTo: params.inReplyTo,
      references: params.references || [],
      from: process.env.EMAIL_USER || '',
      fromName: 'WritgoAI',
      to: Array.isArray(params.to) ? params.to : [params.to],
      cc: params.cc || [],
      bcc: params.bcc || [],
      subject: params.subject,
      textBody: params.text,
      htmlBody: params.html,
      snippet: params.text.substring(0, 200),
      receivedAt: new Date(),
      sentAt: new Date(),
      isIncoming: false,
      isRead: true,
      hasAttachments: false,
    },
  });

  // Update thread activity
  await prisma.emailThread.update({
    where: { id: params.threadId },
    data: { lastActivity: new Date() },
  });

  console.log(`[Email Service] Sent reply: ${messageId}`);
  return messageId;
}

/**
 * Mark email as read
 */
export async function markEmailAsRead(emailId: string): Promise<void> {
  await prisma.email.update({
    where: { id: emailId },
    data: { isRead: true },
  });
}

/**
 * Mark email as starred
 */
export async function toggleEmailStar(emailId: string): Promise<boolean> {
  const email = await prisma.email.findUnique({
    where: { id: emailId },
    select: { isStarred: true },
  });

  const newStarred = !email?.isStarred;
  
  await prisma.email.update({
    where: { id: emailId },
    data: { isStarred: newStarred },
  });

  return newStarred;
}

/**
 * Update thread status
 */
export async function updateThreadStatus(
  threadId: string,
  status: 'open' | 'closed' | 'archived'
): Promise<void> {
  await prisma.emailThread.update({
    where: { id: threadId },
    data: { status },
  });
}

/**
 * Update thread priority
 */
export async function updateThreadPriority(
  threadId: string,
  priority: 'low' | 'normal' | 'high' | 'urgent'
): Promise<void> {
  await prisma.emailThread.update({
    where: { id: threadId },
    data: { priority },
  });
}
