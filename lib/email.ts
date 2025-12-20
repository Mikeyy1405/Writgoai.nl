
import nodemailer from 'nodemailer';
import { 
  getAdminNotificationTemplate, 
  getContentPublishedEmailTemplate,
  getAdminWelcomeEmailTemplate,
  getOnboardingEmail1Template,
  getOnboardingEmail2Template,
  getOnboardingEmail3Template,
  getOnboardingEmail4Template,
  getOnboardingEmail5Template,
  getBlackFridayEmailTemplate,
  getChristmasEmailTemplate,
  getNewYearEmailTemplate,
} from './email-templates';

// Create transporter with WritgoAI SMTP or other service
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'WritgoAI.nl',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false // Accept self-signed certificates
  }
});

// Check if email is configured
export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

export interface WelcomeEmailOptions {
  to: string;
  name: string;
  email: string;
}

export async function sendWelcomeEmail({ to, name, email }: WelcomeEmailOptions) {
  const mailOptions = {
    from: `"WritgoAI" <${process.env.SMTP_USER}>`,
    to,
    subject: '🎉 Welkom bij WritgoAI!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <!-- Header with brand colors -->
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; background: linear-gradient(135deg, #1e3a8a 0%, #f97316 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                        Welkom bij WritgoAI! 🚀
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Hoi <strong>${name}</strong>,
                      </p>
                      
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Wat leuk dat je je hebt aangemeld bij WritgoAI! Je account is succesvol aangemaakt en je kunt nu aan de slag.
                      </p>
                      
                      <div style="background-color: #fef3c7; border-left: 4px solid #f97316; padding: 16px; margin: 24px 0; border-radius: 4px;">
                        <p style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: bold;">
                          🎁 Je gratis cadeau:
                        </p>
                        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                          • 1 gratis artikel<br>
                          • 1 gratis reel<br>
                          <br>
                          Deze credits zijn direct beschikbaar in je dashboard!
                        </p>
                      </div>
                      
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        <strong>Zo ga je verder:</strong>
                      </p>
                      
                      <ol style="margin: 0 0 24px 0; padding-left: 20px; color: #333333; font-size: 16px; line-height: 1.8;">
                        <li>Log in op je dashboard</li>
                        <li>Vul je AI-profiel in (website, social media, etc.)</li>
                        <li>Gebruik je gratis credits om te testen</li>
                        <li>Kies een abonnement dat bij je past</li>
                      </ol>
                      
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="https://writgoai.abacusai.app/client" 
                           style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                          Ga naar je Dashboard
                        </a>
                      </div>
                      
                      <p style="margin: 24px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                        Heb je vragen? Reageer gewoon op deze e-mail, dan helpen we je graag verder!
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.6; text-align: center;">
                        Je ontvangt deze e-mail omdat je je hebt aangemeld bij WritgoAI.<br>
                        © 2025 WritgoAI - Automatiseer je content creatie
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `
Welkom bij WritgoAI!

Hoi ${name},

Wat leuk dat je je hebt aangemeld bij WritgoAI! Je account is succesvol aangemaakt en je kunt nu aan de slag.

🎁 Je gratis cadeau:
• 1 gratis artikel
• 1 gratis reel

Deze credits zijn direct beschikbaar in je dashboard!

Zo ga je verder:
1. Log in op je dashboard
2. Vul je AI-profiel in (website, social media, etc.)
3. Gebruik je gratis credits om te testen
4. Kies een abonnement dat bij je past

Ga naar je dashboard: https://writgoai.abacusai.app/client

Heb je vragen? Reageer gewoon op deze e-mail, dan helpen we je graag verder!

© 2025 WritgoAI - Automatiseer je content creatie
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}

export async function sendTestEmail(to: string) {
  const mailOptions = {
    from: `"WritgoAI" <${process.env.SMTP_USER}>`,
    to,
    subject: '✅ Test Email van WritgoAI',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; background: linear-gradient(135deg, #1e3a8a 0%, #f97316 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                        ✅ Test Succesvol!
                      </h1>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        <strong>Gefeliciteerd!</strong>
                      </p>
                      
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Het email systeem van WritgoAI werkt perfect! Deze test email bevestigt dat alle welkomstmails en notificaties succesvol worden verzonden.
                      </p>
                      
                      <div style="background-color: #dcfce7; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0; border-radius: 4px;">
                        <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.6;">
                          ✓ SMTP configuratie: OK<br>
                          ✓ Email verzending: OK<br>
                          ✓ HTML templates: OK<br>
                          ✓ Systeem status: Actief
                        </p>
                      </div>
                      
                      <p style="margin: 24px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                        Test verzonden op: ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}
                      </p>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.6; text-align: center;">
                        © 2025 WritgoAI - Automatiseer je content creatie
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `
✅ Test Succesvol!

Gefeliciteerd!

Het email systeem van WritgoAI werkt perfect! Deze test email bevestigt dat alle welkomstmails en notificaties succesvol worden verzonden.

✓ SMTP configuratie: OK
✓ Email verzending: OK
✓ HTML templates: OK
✓ Systeem status: Actief

Test verzonden op: ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}

© 2025 WritgoAI - Automatiseer je content creatie
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending test email:', error);
    throw error;
  }
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Generieke email verzenden functie
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const mailOptions = {
    from: `"WritgoAI" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text: text || '',
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export interface SubscriptionWelcomeEmailOptions {
  to: string;
  name: string;
  planName: string;
  monthlyCredits: number;
  resetToken: string;
}

export async function sendSubscriptionWelcomeEmail({
  to,
  name,
  planName,
  monthlyCredits,
  resetToken,
}: SubscriptionWelcomeEmailOptions) {
  const resetLink = `https://WritgoAI.nl/inloggen?token=${resetToken}`;
  
  const mailOptions = {
    from: `"WritgoAI" <${process.env.SMTP_USER}>`,
    to,
    subject: '🎉 Welkom bij WritgoAI - Activeer je account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <!-- Header with brand colors -->
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; background: linear-gradient(135deg, #1e3a8a 0%, #f97316 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                        🎉 Welkom bij WritgoAI!
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Hoi <strong>${name}</strong>,
                      </p>
                      
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Bedankt voor je aankoop! Je <strong>${planName}</strong> abonnement is succesvol geactiveerd.
                      </p>
                      
                      <div style="background-color: #dcfce7; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0; border-radius: 4px;">
                        <p style="margin: 0 0 12px 0; color: #166534; font-size: 16px; font-weight: bold;">
                          ✓ Je abonnement is actief!
                        </p>
                        <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.6;">
                          Plan: <strong>${planName}</strong><br>
                          Maandelijkse credits: <strong>${monthlyCredits.toLocaleString('nl-NL')}</strong><br>
                          Deze credits zijn direct beschikbaar!
                        </p>
                      </div>
                      
                      <div style="background-color: #fef3c7; border-left: 4px solid #f97316; padding: 16px; margin: 24px 0; border-radius: 4px;">
                        <p style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: bold;">
                          🔑 Activeer nu je account
                        </p>
                        <p style="margin: 0 0 16px 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                          Om aan de slag te gaan, moet je eerst een wachtwoord instellen voor je account. Klik op de knop hieronder om je account te activeren.
                        </p>
                      </div>
                      
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="${resetLink}" 
                           style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                          Account Activeren
                        </a>
                      </div>
                      
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        <strong>Daarna kun je:</strong>
                      </p>
                      
                      <ol style="margin: 0 0 24px 0; padding-left: 20px; color: #333333; font-size: 16px; line-height: 1.8;">
                        <li>Inloggen op je dashboard</li>
                        <li>Je AI-profiel configureren</li>
                        <li>Direct content genereren met je credits</li>
                        <li>Automatiseringen instellen</li>
                      </ol>
                      
                      <p style="margin: 24px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                        <strong>Werkt de knop niet?</strong> Kopieer deze link in je browser:<br>
                        <span style="color: #1e3a8a; word-break: break-all;">${resetLink}</span>
                      </p>
                      
                      <p style="margin: 24px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                        Heb je vragen? Reageer gewoon op deze e-mail, dan helpen we je graag verder!
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.6; text-align: center;">
                        Je ontvangt deze e-mail omdat je een abonnement hebt afgesloten bij WritgoAI.<br>
                        Deze activatielink is 24 uur geldig.<br>
                        © 2025 WritgoAI - Automatiseer je content creatie
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `
🎉 Welkom bij WritgoAI!

Hoi ${name},

Bedankt voor je aankoop! Je ${planName} abonnement is succesvol geactiveerd.

✓ Je abonnement is actief!
Plan: ${planName}
Maandelijkse credits: ${monthlyCredits.toLocaleString('nl-NL')}
Deze credits zijn direct beschikbaar!

🔑 ACTIVEER NU JE ACCOUNT

Om aan de slag te gaan, moet je eerst een wachtwoord instellen voor je account.

Klik op deze link om je account te activeren:
${resetLink}

Daarna kun je:
1. Inloggen op je dashboard
2. Je AI-profiel configureren
3. Direct content genereren met je credits
4. Automatiseringen instellen

Deze activatielink is 24 uur geldig.

Heb je vragen? Reageer gewoon op deze e-mail, dan helpen we je graag verder!

© 2025 WritgoAI - Automatiseer je content creatie
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Subscription welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending subscription welcome email:', error);
    throw error;
  }
}

export interface AdminNotificationEmailOptions {
  to: string;
  type: string;
  clientName: string;
  clientEmail: string;
  details: Record<string, any>;
}

export async function sendAdminNotificationEmail({
  to,
  type,
  clientName,
  clientEmail,
  details,
}: AdminNotificationEmailOptions) {
  const { subject, html, text } = getAdminNotificationTemplate(
    type,
    clientName,
    clientEmail,
    details
  );

  const mailOptions = {
    from: `"WritgoAI Admin" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Admin notification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    throw error;
  }
}


/**
 * Send blog generation completion notification to client
 */
export async function sendBlogReadyEmail(
  to: string,
  clientName: string,
  blogTitle: string,
  dashboardUrl: string
) {
  if (!isEmailConfigured()) {
    console.log('Email not configured, skipping blog ready notification');
    return { success: false, reason: 'not_configured' };
  }

  const mailOptions = {
    from: `"WritgoAI" <${process.env.SMTP_USER}>`,
    to,
    subject: `✅ Je blog "${blogTitle}" is klaar!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; background: linear-gradient(135deg, #1e3a8a 0%, #f97316 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                        ✅ Je blog is klaar!
                      </h1>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Hoi <strong>${clientName}</strong>,
                      </p>
                      
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Goed nieuws! Je blog "<strong>${blogTitle}</strong>" is succesvol gegenereerd en staat klaar in je Content Library.
                      </p>
                      
                      <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
                        <p style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px; font-weight: bold;">
                          📝 Volgende stappen:
                        </p>
                        <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.8;">
                          • Review en bewerk de content<br>
                          • Voeg indien nodig extra secties toe<br>
                          • Publiceer naar WordPress of download als Word<br>
                          • Deel op social media voor meer bereik
                        </p>
                      </div>
                      
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="${dashboardUrl}" 
                           style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                          Bekijk je blog
                        </a>
                      </div>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.6; text-align: center;">
                        © 2025 WritgoAI - Automatiseer je content creatie
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `
Je blog is klaar!

Hoi ${clientName},

Goed nieuws! Je blog "${blogTitle}" is succesvol gegenereerd en staat klaar in je Content Library.

Volgende stappen:
• Review en bewerk de content
• Voeg indien nodig extra secties toe
• Publiceer naar WordPress of download als Word
• Deel op social media voor meer bereik

Bekijk je blog: ${dashboardUrl}

© 2025 WritgoAI - Automatiseer je content creatie
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Blog ready email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending blog ready email:', error);
    return { success: false, error };
  }
}

/**
 * Send low credits warning to client
 */
export async function sendLowCreditsEmail(
  to: string,
  clientName: string,
  creditsLeft: number,
  dashboardUrl: string
) {
  if (!isEmailConfigured()) {
    console.log('Email not configured, skipping low credits notification');
    return { success: false, reason: 'not_configured' };
  }

  const mailOptions = {
    from: `"WritgoAI" <${process.env.SMTP_USER}>`,
    to,
    subject: '⚠️ Je credits raken op!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                        ⚠️ Credits waarschuwing
                      </h1>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Hoi <strong>${clientName}</strong>,
                      </p>
                      
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Je hebt nog maar <strong>${creditsLeft} credits</strong> over. Om door te blijven gaan met content creëren heb je meer credits nodig.
                      </p>
                      
                      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
                        <p style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: bold;">
                          💡 Opties:
                        </p>
                        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.8;">
                          • Wacht tot je maandelijkse credits worden bijgevuld<br>
                          • Koop extra credits als eenmalige top-up<br>
                          • Upgrade naar een hoger abonnement
                        </p>
                      </div>
                      
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="${dashboardUrl}/account" 
                           style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                          Credits Bijkopen
                        </a>
                      </div>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.6; text-align: center;">
                        © 2025 WritgoAI - Automatiseer je content creatie
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `
Credits waarschuwing

Hoi ${clientName},

Je hebt nog maar ${creditsLeft} credits over. Om door te blijven gaan met content creëren heb je meer credits nodig.

Opties:
• Wacht tot je maandelijkse credits worden bijgevuld
• Koop extra credits als eenmalige top-up
• Upgrade naar een hoger abonnement

Credits bijkopen: ${dashboardUrl}/account

© 2025 WritgoAI - Automatiseer je content creatie
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Low credits email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending low credits email:', error);
    return { success: false, error };
  }
}

/**
 * Send content published notification to client
 */
export async function sendContentPublishedEmail(
  to: string,
  clientName: string,
  articleTitle: string,
  articleUrl: string,
  details: {
    excerpt?: string;
    categories?: string[];
    publishedAt?: Date;
    wordCount?: number;
    autoPublished?: boolean;
  } = {}
) {
  if (!isEmailConfigured()) {
    console.log('Email not configured, skipping content published notification');
    return { success: false, reason: 'not_configured' };
  }

  const { subject, html, text } = getContentPublishedEmailTemplate(
    clientName,
    articleTitle,
    articleUrl,
    details
  );

  const mailOptions = {
    from: `"WritgoAI" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Content published email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending content published email:', error);
    return { success: false, error };
  }
}

/**
 * Send keyword research ready notification
 */
export async function sendKeywordResearchReadyEmail(
  to: string,
  clientName: string,
  keywordsFound: number,
  dashboardUrl: string
) {
  if (!isEmailConfigured()) {
    console.log('Email not configured, skipping keyword research notification');
    return { success: false, reason: 'not_configured' };
  }

  const mailOptions = {
    from: `"WritgoAI" <${process.env.SMTP_USER}>`,
    to,
    subject: `🔍 Je keyword research is klaar! (${keywordsFound} keywords gevonden)`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                        🔍 Keyword research compleet!
                      </h1>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Hoi <strong>${clientName}</strong>,
                      </p>
                      
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Je keyword research is klaar! We hebben <strong>${keywordsFound} relevante keywords</strong> gevonden met zoekvolumes en content suggesties.
                      </p>
                      
                      <div style="background-color: #ede9fe; border-left: 4px solid #8b5cf6; padding: 16px; margin: 24px 0; border-radius: 4px;">
                        <p style="margin: 0 0 12px 0; color: #5b21b6; font-size: 16px; font-weight: bold;">
                          💡 Wat nu?
                        </p>
                        <p style="margin: 0; color: #5b21b6; font-size: 14px; line-height: 1.8;">
                          • Bekijk de gevonden keywords<br>
                          • Kies keywords voor je content strategie<br>
                          • Genereer content ideeën gebaseerd op de keywords<br>
                          • Start met het schrijven van je eerste blog
                        </p>
                      </div>
                      
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="${dashboardUrl}" 
                           style="display: inline-block; background-color: #8b5cf6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                          Bekijk Keywords
                        </a>
                      </div>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.6; text-align: center;">
                        © 2025 WritgoAI - Automatiseer je content creatie
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `
Keyword research compleet!

Hoi ${clientName},

Je keyword research is klaar! We hebben ${keywordsFound} relevante keywords gevonden met zoekvolumes en content suggesties.

Wat nu?
• Bekijk de gevonden keywords
• Kies keywords voor je content strategie
• Genereer content ideeën gebaseerd op de keywords
• Start met het schrijven van je eerste blog

Bekijk keywords: ${dashboardUrl}

© 2025 WritgoAI - Automatiseer je content creatie
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Keyword research ready email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending keyword research email:', error);
    return { success: false, error };
  }
}

/**
 * Send admin welcome email with temporary password
 */
export async function sendAdminWelcomeEmail(
  to: string,
  name: string,
  temporaryPassword: string
) {
  if (!isEmailConfigured()) {
    console.log('Email not configured, skipping admin welcome email');
    return { success: false, reason: 'not_configured' };
  }

  const { subject, html, text } = getAdminWelcomeEmailTemplate(name, to, temporaryPassword);

  const mailOptions = {
    from: `"WritgoAI Admin" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Admin welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending admin welcome email:', error);
    return { success: false, error };
  }
}

/**
 * Send onboarding email sequence
 */
export async function sendOnboardingEmail(
  to: string,
  clientName: string,
  emailNumber: 1 | 2 | 3 | 4 | 5,
  dashboardUrl: string,
  affiliateCode?: string
) {
  if (!isEmailConfigured()) {
    console.log('Email not configured, skipping onboarding email');
    return { success: false, reason: 'not_configured' };
  }

  let template;
  
  switch (emailNumber) {
    case 1:
      template = getOnboardingEmail1Template(clientName, dashboardUrl);
      break;
    case 2:
      template = getOnboardingEmail2Template(clientName, dashboardUrl);
      break;
    case 3:
      template = getOnboardingEmail3Template(clientName, dashboardUrl);
      break;
    case 4:
      template = getOnboardingEmail4Template(clientName, dashboardUrl);
      break;
    case 5:
      template = getOnboardingEmail5Template(clientName, dashboardUrl, affiliateCode);
      break;
    default:
      return { success: false, reason: 'invalid_email_number' };
  }

  const { subject, html, text } = template;

  const mailOptions = {
    from: `"WritgoAI" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Onboarding email ${emailNumber} sent:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error sending onboarding email ${emailNumber}:`, error);
    return { success: false, error };
  }
}

/**
 * Send promotional email (Black Friday, Christmas, New Year)
 */
export async function sendPromotionalEmail(
  to: string,
  clientName: string,
  type: 'black-friday' | 'christmas' | 'new-year',
  discountCode: string,
  discountPercentage: number,
  expiryDate: string,
  dashboardUrl: string
) {
  if (!isEmailConfigured()) {
    console.log('Email not configured, skipping promotional email');
    return { success: false, reason: 'not_configured' };
  }

  let template;
  
  switch (type) {
    case 'black-friday':
      template = getBlackFridayEmailTemplate(clientName, discountCode, discountPercentage, expiryDate, dashboardUrl);
      break;
    case 'christmas':
      template = getChristmasEmailTemplate(clientName, discountCode, discountPercentage, expiryDate, dashboardUrl);
      break;
    case 'new-year':
      template = getNewYearEmailTemplate(clientName, discountCode, discountPercentage, expiryDate, dashboardUrl);
      break;
    default:
      return { success: false, reason: 'invalid_promo_type' };
  }

  const { subject, html, text } = template;

  const mailOptions = {
    from: `"WritgoAI" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Promotional email (${type}) sent:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error sending promotional email (${type}):`, error);
    return { success: false, error };
  }
}