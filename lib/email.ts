/**
 * Email Service - Simplified for WordPress SEO Agent
 * Removed: SMTP, MailerLite, complex email templates
 * Kept: Simple logging for debugging
 */

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Simplified sendEmail - just logs for now
 * In production, integrate with your preferred email service
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  console.log(`📧 Email would be sent:`);
  console.log(`   To: ${to}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   HTML length: ${html.length} chars`);
  
  return {
    success: true,
    message: 'Email logged (not sent - configure email service in production)',
  };
}
