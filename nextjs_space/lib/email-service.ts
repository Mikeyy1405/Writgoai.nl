import fs from 'fs';
import path from 'path';

// Load MailerLite API key from secrets
function getMailerLiteApiKey(): string {
  try {
    const secretsPath = '/home/ubuntu/.config/abacusai_auth_secrets.json';
    const secretsData = fs.readFileSync(secretsPath, 'utf-8');
    const secrets = JSON.parse(secretsData);
    return secrets?.mailerlite?.secrets?.api_key?.value || process.env.MAILERLITE_API_KEY || '';
  } catch (error) {
    console.error('Error loading MailerLite API key:', error);
    return process.env.MAILERLITE_API_KEY || '';
  }
}

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from = 'WritGo <info@writgo.nl>' }: EmailParams) {
  const apiKey = getMailerLiteApiKey();
  
  if (!apiKey) {
    console.error('MailerLite API key not found');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://connect.mailerlite.com/api/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: {
          email: from.includes('<') ? from.split('<')[1].replace('>', '') : from,
          name: from.includes('<') ? from.split('<')[0].trim() : 'WritGo',
        },
        to: [{
          email: to,
        }],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('MailerLite API error:', error);
      return { success: false, error: `Failed to send email: ${error}` };
    }

    const data = await response.json();
    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Email templates
export const emailTemplates = {
  invoiceSent: (invoiceNumber: string, total: number, dueDate: string, paymentUrl: string, clientName: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>WritGo AI</h1>
          <p>Nieuwe Factuur</p>
        </div>
        <div class="content">
          <p>Beste ${clientName},</p>
          <p>Hierbij ontvangt u factuur <strong>${invoiceNumber}</strong> van WritGo AI.</p>
          
          <div class="invoice-details">
            <h3>Factuurdetails</h3>
            <p><strong>Factuurnummer:</strong> ${invoiceNumber}</p>
            <p><strong>Totaalbedrag:</strong> €${total.toFixed(2)}</p>
            <p><strong>Vervaldatum:</strong> ${new Date(dueDate).toLocaleDateString('nl-NL')}</p>
          </div>
          
          <p>U kunt deze factuur direct betalen via de onderstaande link:</p>
          <center>
            <a href="${paymentUrl}" class="button">Betaal Factuur</a>
          </center>
          
          <p>Met vriendelijke groet,<br><strong>Team WritGo AI</strong></p>
        </div>
        <div class="footer">
          <p>WritGo AI - Uw AI Content Partner</p>
          <p>info@writgo.nl | www.writgoai.nl</p>
        </div>
      </div>
    </body>
    </html>
  `,

  paymentReceived: (invoiceNumber: string, total: number, clientName: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
        .payment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>WritGo AI</h1>
          <p>Betaling Ontvangen</p>
        </div>
        <div class="content">
          <div class="success-icon">✅</div>
          <p>Beste ${clientName},</p>
          <p>Bedankt voor uw betaling! We hebben uw betaling succesvol ontvangen.</p>
          
          <div class="payment-details">
            <h3>Betalingsdetails</h3>
            <p><strong>Factuurnummer:</strong> ${invoiceNumber}</p>
            <p><strong>Bedrag:</strong> €${total.toFixed(2)}</p>
            <p><strong>Status:</strong> <span style="color: #10b981;">Betaald</span></p>
          </div>
          
          <p>Uw factuur is nu volledig voldaan. U ontvangt binnenkort een PDF-factuur ter bevestiging.</p>
          
          <p>Met vriendelijke groet,<br><strong>Team WritGo AI</strong></p>
        </div>
        <div class="footer">
          <p>WritGo AI - Uw AI Content Partner</p>
          <p>info@writgo.nl | www.writgoai.nl</p>
        </div>
      </div>
    </body>
    </html>
  `,

  paymentReminder: (invoiceNumber: string, total: number, dueDate: string, paymentUrl: string, clientName: string, daysOverdue: number) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>WritGo AI</h1>
          <p>Betalingsherinnering</p>
        </div>
        <div class="content">
          <p>Beste ${clientName},</p>
          
          <div class="warning">
            <strong>⚠️ Betaalherinnering</strong><br>
            Factuur ${invoiceNumber} is ${daysOverdue} dag${daysOverdue > 1 ? 'en' : ''} over de vervaldatum.
          </div>
          
          <p>Wij hebben nog geen betaling ontvangen voor onderstaande factuur. Mogelijk is deze over het hoofd gezien.</p>
          
          <div class="invoice-details">
            <h3>Factuurdetails</h3>
            <p><strong>Factuurnummer:</strong> ${invoiceNumber}</p>
            <p><strong>Totaalbedrag:</strong> €${total.toFixed(2)}</p>
            <p><strong>Vervaldatum:</strong> ${new Date(dueDate).toLocaleDateString('nl-NL')}</p>
            <p><strong>Dagen over tijd:</strong> ${daysOverdue}</p>
          </div>
          
          <p>U kunt deze factuur direct betalen via de onderstaande link:</p>
          <center>
            <a href="${paymentUrl}" class="button">Betaal Nu</a>
          </center>
          
          <p>Indien u vragen heeft over deze factuur, neem dan gerust contact met ons op.</p>
          
          <p>Met vriendelijke groet,<br><strong>Team WritGo AI</strong></p>
        </div>
        <div class="footer">
          <p>WritGo AI - Uw AI Content Partner</p>
          <p>info@writgo.nl | www.writgoai.nl</p>
        </div>
      </div>
    </body>
    </html>
  `,

  assignmentCreated: (assignmentTitle: string, assignmentType: string, deadline: string, clientName: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .assignment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>WritGo AI</h1>
          <p>Nieuwe Opdracht</p>
        </div>
        <div class="content">
          <p>Beste ${clientName},</p>
          <p>Er is een nieuwe opdracht voor u aangemaakt in het WritGo AI portal.</p>
          
          <div class="assignment-details">
            <h3>Opdrachtdetails</h3>
            <p><strong>Titel:</strong> ${assignmentTitle}</p>
            <p><strong>Type:</strong> ${assignmentType}</p>
            ${deadline ? `<p><strong>Deadline:</strong> ${new Date(deadline).toLocaleDateString('nl-NL')}</p>` : ''}
          </div>
          
          <p>U kunt de volledige details en voortgang bekijken in uw portal:</p>
          <center>
            <a href="https://writgoai.nl/client-portal/opdrachten" class="button">Bekijk Opdrachten</a>
          </center>
          
          <p>Met vriendelijke groet,<br><strong>Team WritGo AI</strong></p>
        </div>
        <div class="footer">
          <p>WritGo AI - Uw AI Content Partner</p>
          <p>info@writgo.nl | www.writgoai.nl</p>
        </div>
      </div>
    </body>
    </html>
  `,

  requestReceived: (requestTitle: string, requestType: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .request-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>WritGo AI</h1>
          <p>Nieuw Klantverzoek</p>
        </div>
        <div class="content">
          <p>Er is een nieuw verzoek ontvangen van een klant.</p>
          
          <div class="request-details">
            <h3>Verzoekdetails</h3>
            <p><strong>Titel:</strong> ${requestTitle}</p>
            <p><strong>Type:</strong> ${requestType}</p>
          </div>
          
          <p>Log in op het agency portal om dit verzoek te bekijken en te verwerken.</p>
          
          <p>Met vriendelijke groet,<br><strong>WritGo AI Systeem</strong></p>
        </div>
        <div class="footer">
          <p>WritGo AI - Agency Portal</p>
        </div>
      </div>
    </body>
    </html>
  `,
};
