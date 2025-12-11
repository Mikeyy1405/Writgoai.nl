/**
 * SMTP Client for Sending Emails
 * 
 * Uses nodemailer to send emails via SMTP
 * Supports HTML/text bodies, CC, BCC, and email threading
 */

import nodemailer from 'nodemailer';
import { decrypt } from '../encryption';

// Email configuration from MailboxConnection
export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpTls: boolean;
  email: string;
  password: string; // Encrypted password
  displayName?: string;
}

// Email data to send
export interface EmailData {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
  inReplyTo?: string; // For threading
  references?: string[]; // For threading
}

// Result of sending email
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email via SMTP
 */
export async function sendEmail(
  config: EmailConfig,
  emailData: EmailData
): Promise<SendEmailResult> {
  try {
    // Decrypt password
    const decryptedPassword = decrypt(config.password);
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpTls, // true for 465, false for other ports
      auth: {
        user: config.email,
        pass: decryptedPassword,
      },
      // Additional security options
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates (consider tightening in production)
      },
    });

    // Verify connection
    try {
      await transporter.verify();
    } catch (verifyError: any) {
      console.error('SMTP verification failed:', verifyError);
      return {
        success: false,
        error: `SMTP connection failed: ${verifyError.message}`,
      };
    }

    // Prepare email
    const mailOptions: any = {
      from: config.displayName
        ? `"${config.displayName}" <${config.email}>`
        : config.email,
      to: emailData.to.join(', '),
      subject: emailData.subject,
    };

    // Add CC and BCC if provided
    if (emailData.cc && emailData.cc.length > 0) {
      mailOptions.cc = emailData.cc.join(', ');
    }
    if (emailData.bcc && emailData.bcc.length > 0) {
      mailOptions.bcc = emailData.bcc.join(', ');
    }

    // Add body (HTML takes precedence, fallback to text)
    if (emailData.bodyHtml) {
      mailOptions.html = emailData.bodyHtml;
      
      // Add text version if not provided
      if (!emailData.bodyText) {
        mailOptions.text = stripHtml(emailData.bodyHtml);
      } else {
        mailOptions.text = emailData.bodyText;
      }
    } else if (emailData.bodyText) {
      mailOptions.text = emailData.bodyText;
    }

    // Add threading headers for replies
    if (emailData.inReplyTo) {
      mailOptions.inReplyTo = emailData.inReplyTo;
    }
    if (emailData.references && emailData.references.length > 0) {
      mailOptions.references = emailData.references.join(' ');
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: emailData.to,
      subject: emailData.subject,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred while sending email',
    };
  }
}

/**
 * Strip HTML tags from string (simple implementation)
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'") // Replace &#39; with '
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

/**
 * Test SMTP connection
 */
export async function testSmtpConnection(
  config: EmailConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    // Decrypt password
    const decryptedPassword = decrypt(config.password);
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpTls,
      auth: {
        user: config.email,
        pass: decryptedPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify connection
    await transporter.verify();
    
    return { success: true };
  } catch (error: any) {
    console.error('SMTP test failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}
