import { sendEmail } from './email-service';

interface PasswordResetEmailParams {
  to: string;
  name: string;
  resetLink: string;
}

export async function sendPasswordResetEmail({ to, name, resetLink }: PasswordResetEmailParams) {
  const subject = 'Wachtwoord herstellen - WritGo AI';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
          color: white; 
          padding: 40px 30px; 
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content { 
          background: white;
          padding: 40px 30px;
        }
        .content p {
          margin: 0 0 16px;
          color: #374151;
        }
        .warning-box {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 16px;
          margin: 24px 0;
          border-radius: 4px;
        }
        .warning-box p {
          margin: 0;
          color: #92400e;
        }
        .button-container {
          text-align: center;
          margin: 32px 0;
        }
        .button { 
          display: inline-block; 
          background: #18181b;
          color: white !important;
          padding: 14px 32px; 
          text-decoration: none; 
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
        }
        .button:hover {
          background: #27272a;
        }
        .footer { 
          text-align: center; 
          color: #6b7280; 
          font-size: 14px; 
          padding: 30px;
          background: #f9fafb;
        }
        .footer p {
          margin: 8px 0;
        }
        .link-text {
          word-break: break-all;
          font-size: 12px;
          color: #6b7280;
          margin-top: 24px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Wachtwoord Herstellen</h1>
        </div>
        <div class="content">
          <p>Hallo ${name},</p>
          
          <p>Je hebt een verzoek ingediend om je wachtwoord te herstellen voor je WritGo AI account.</p>
          
          <p>Klik op de onderstaande knop om een nieuw wachtwoord in te stellen:</p>
          
          <div class="button-container">
            <a href="${resetLink}" class="button">Wachtwoord Herstellen</a>
          </div>
          
          <div class="warning-box">
            <p><strong>⚠️ Belangrijk:</strong></p>
            <p>• Deze link is 1 uur geldig</p>
            <p>• De link kan maar één keer gebruikt worden</p>
            <p>• Als je dit verzoek niet hebt gedaan, kun je deze email negeren</p>
          </div>
          
          <p>Als de knop niet werkt, kopieer en plak dan deze link in je browser:</p>
          <p class="link-text">${resetLink}</p>
          
          <p style="margin-top: 32px;">Met vriendelijke groet,<br><strong>Team WritGo AI</strong></p>
        </div>
        <div class="footer">
          <p><strong>WritGo AI</strong> - Uw AI Content Partner</p>
          <p>info@writgo.nl | www.writgoai.nl</p>
          <p style="margin-top: 16px; font-size: 12px;">
            Deze email is verstuurd omdat er een wachtwoordherstel is aangevraagd voor dit email adres.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    html,
    from: 'WritGo AI <info@writgo.nl>',
  });
}
