
/**
 * Email Templates
 * HTML templates voor verschillende notificatie types
 * 
 * NIEUWE TEMPLATES:
 * - Admin welkomst mail
 * - Onboarding email reeks (5 emails)
 * - Promotionele emails (Black Friday, Kerst, Nieuwjaar, etc.)
 */

/**
 * CLIENT NOTIFICATIE: Content gepubliceerd
 */
export function getContentPublishedEmailTemplate(
  clientName: string,
  articleTitle: string,
  articleUrl: string,
  details: {
    excerpt?: string;
    categories?: string[];
    publishedAt?: Date;
    wordCount?: number;
    autoPublished?: boolean;
  }
): { subject: string; html: string; text: string } {
  const publishDate = details.publishedAt ? details.publishedAt.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : 'vandaag';

  return {
    subject: `🎉 Je artikel "${articleTitle}" is gepubliceerd!`,
    html: getContentPublishedEmailHTML(clientName, articleTitle, articleUrl, publishDate, details),
    text: getContentPublishedEmailText(clientName, articleTitle, articleUrl, publishDate, details),
  };
}

export function getAdminNotificationTemplate(
  type: string,
  clientName: string,
  clientEmail: string,
  details: Record<string, any>
): { subject: string; html: string; text: string } {
  const baseUrl = 'https://WritgoAI.nl';
  const dashboardUrl = `${baseUrl}/admin`;

  switch (type) {
    case 'new_client':
      return {
        subject: '🎉 Nieuwe Klant Aanmelding - Writgo Media',
        html: getNewClientEmailHTML(clientName, clientEmail, details, dashboardUrl),
        text: getNewClientEmailText(clientName, clientEmail, details, dashboardUrl),
      };

    case 'credits_purchased':
      return {
        subject: '💳 Credits Gekocht - Writgo Media',
        html: getCreditsPurchasedEmailHTML(clientName, clientEmail, details, dashboardUrl),
        text: getCreditsPurchasedEmailText(clientName, clientEmail, details, dashboardUrl),
      };

    case 'credits_low':
      return {
        subject: '⚠️ Lage Credits - Writgo Media',
        html: getCreditsLowEmailHTML(clientName, clientEmail, details, dashboardUrl),
        text: getCreditsLowEmailText(clientName, clientEmail, details, dashboardUrl),
      };

    case 'subscription_started':
      return {
        subject: '✅ Nieuw Abonnement - Writgo Media',
        html: getSubscriptionStartedEmailHTML(clientName, clientEmail, details, dashboardUrl),
        text: getSubscriptionStartedEmailText(clientName, clientEmail, details, dashboardUrl),
      };

    case 'subscription_cancelled':
      return {
        subject: '❌ Abonnement Geannuleerd - Writgo Media',
        html: getSubscriptionCancelledEmailHTML(clientName, clientEmail, details, dashboardUrl),
        text: getSubscriptionCancelledEmailText(clientName, clientEmail, details, dashboardUrl),
      };

    case 'subscription_changed':
      return {
        subject: '🔄 Abonnement Gewijzigd - Writgo Media',
        html: getSubscriptionChangedEmailHTML(clientName, clientEmail, details, dashboardUrl),
        text: getSubscriptionChangedEmailText(clientName, clientEmail, details, dashboardUrl),
      };

    default:
      return {
        subject: '📬 Writgo Media Notificatie',
        html: getGenericEmailHTML(clientName, clientEmail, type, details, dashboardUrl),
        text: getGenericEmailText(clientName, clientEmail, type, details, dashboardUrl),
      };
  }
}

// Helper function voor email wrapper
function getEmailWrapper(title: string, emoji: string, content: string): string {
  return `
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
                  <td style="padding: 40px 40px 20px 40px; background: linear-gradient(135deg, #000000 0%, #FF6B35 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                      ${emoji} ${title}
                    </h1>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 40px;">
                    ${content}
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.6; text-align: center;">
                      © 2025 Writgo Media - Admin Notificatie Systeem
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// NEW CLIENT TEMPLATES
function getNewClientEmailHTML(
  clientName: string,
  clientEmail: string,
  details: Record<string, any>,
  dashboardUrl: string
): string {
  const content = `
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      <strong>Nieuwe klant heeft zich aangemeld!</strong>
    </p>
    
    <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px; font-weight: bold;">
        Klantgegevens:
      </p>
      <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.8;">
        <strong>Naam:</strong> ${clientName}<br>
        <strong>Email:</strong> ${clientEmail}<br>
        <strong>Bedrijf:</strong> ${details.companyName || 'Niet opgegeven'}<br>
        <strong>Website:</strong> ${details.website || 'Niet opgegeven'}<br>
        <strong>Aangemeld op:</strong> ${new Date().toLocaleString('nl-NL')}
      </p>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}" 
         style="display: inline-block; background-color: #FF6B35; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
        Bekijk in Admin Dashboard
      </a>
    </div>
  `;

  return getEmailWrapper('Nieuwe Klant Aanmelding', '🎉', content);
}

function getNewClientEmailText(
  clientName: string,
  clientEmail: string,
  details: Record<string, any>,
  dashboardUrl: string
): string {
  return `
Nieuwe Klant Aanmelding

Nieuwe klant heeft zich aangemeld!

Klantgegevens:
- Naam: ${clientName}
- Email: ${clientEmail}
- Bedrijf: ${details.companyName || 'Niet opgegeven'}
- Website: ${details.website || 'Niet opgegeven'}
- Aangemeld op: ${new Date().toLocaleString('nl-NL')}

Bekijk in Admin Dashboard: ${dashboardUrl}
  `;
}

// CREDITS PURCHASED TEMPLATES
function getCreditsPurchasedEmailHTML(
  clientName: string,
  clientEmail: string,
  details: Record<string, any>,
  dashboardUrl: string
): string {
  const content = `
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      <strong>Klant heeft credits gekocht!</strong>
    </p>
    
    <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0 0 12px 0; color: #065f46; font-size: 16px; font-weight: bold;">
        Transactie Details:
      </p>
      <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.8;">
        <strong>Klant:</strong> ${clientName} (${clientEmail})<br>
        <strong>Credits:</strong> ${details.credits || 0}<br>
        <strong>Prijs:</strong> €${details.price || 0}<br>
        <strong>Type:</strong> ${details.type || 'Top-up'}<br>
        <strong>Datum:</strong> ${new Date().toLocaleString('nl-NL')}
      </p>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}" 
         style="display: inline-block; background-color: #FF6B35; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
        Bekijk in Admin Dashboard
      </a>
    </div>
  `;

  return getEmailWrapper('Credits Gekocht', '💳', content);
}

function getCreditsPurchasedEmailText(
  clientName: string,
  clientEmail: string,
  details: Record<string, any>,
  dashboardUrl: string
): string {
  return `
Credits Gekocht

Klant heeft credits gekocht!

Transactie Details:
- Klant: ${clientName} (${clientEmail})
- Credits: ${details.credits || 0}
- Prijs: €${details.price || 0}
- Type: ${details.type || 'Top-up'}
- Datum: ${new Date().toLocaleString('nl-NL')}

Bekijk in Admin Dashboard: ${dashboardUrl}
  `;
}

// CREDITS LOW TEMPLATES
function getCreditsLowEmailHTML(
  clientName: string,
  clientEmail: string,
  details: Record<string, any>,
  dashboardUrl: string
): string {
  const content = `
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      <strong>Klant heeft bijna geen credits meer!</strong>
    </p>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: bold;">
        ⚠️ Waarschuwing:
      </p>
      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.8;">
        <strong>Klant:</strong> ${clientName} (${clientEmail})<br>
        <strong>Subscription Credits:</strong> ${details.subscriptionCredits || 0}<br>
        <strong>Top-up Credits:</strong> ${details.topUpCredits || 0}<br>
        <strong>Totaal:</strong> ${details.totalCredits || 0}<br>
        <br>
        Deze klant kan binnenkort geen content meer genereren!
      </p>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}" 
         style="display: inline-block; background-color: #FF6B35; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
        Bekijk in Admin Dashboard
      </a>
    </div>
  `;

  return getEmailWrapper('Lage Credits Waarschuwing', '⚠️', content);
}

function getCreditsLowEmailText(
  clientName: string,
  clientEmail: string,
  details: Record<string, any>,
  dashboardUrl: string
): string {
  return `
Lage Credits Waarschuwing

Klant heeft bijna geen credits meer!

Details:
- Klant: ${clientName} (${clientEmail})
- Subscription Credits: ${details.subscriptionCredits || 0}
- Top-up Credits: ${details.topUpCredits || 0}
- Totaal: ${details.totalCredits || 0}

Deze klant kan binnenkort geen content meer genereren!

Bekijk in Admin Dashboard: ${dashboardUrl}
  `;
}

// SUBSCRIPTION STARTED TEMPLATES
function getSubscriptionStartedEmailHTML(
  clientName: string,
  clientEmail: string,
  details: Record<string, any>,
  dashboardUrl: string
): string {
  const content = `
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      <strong>Klant heeft een abonnement gestart!</strong>
    </p>
    
    <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0 0 12px 0; color: #065f46; font-size: 16px; font-weight: bold;">
        Abonnement Details:
      </p>
      <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.8;">
        <strong>Klant:</strong> ${clientName} (${clientEmail})<br>
        <strong>Plan:</strong> ${details.plan || 'Onbekend'}<br>
        <strong>Prijs:</strong> €${details.price || 0}/maand<br>
        <strong>Status:</strong> ${details.status || 'Active'}<br>
        <strong>Start datum:</strong> ${new Date().toLocaleString('nl-NL')}
      </p>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}" 
         style="display: inline-block; background-color: #FF6B35; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
        Bekijk in Admin Dashboard
      </a>
    </div>
  `;

  return getEmailWrapper('Nieuw Abonnement', '✅', content);
}

function getSubscriptionStartedEmailText(
  clientName: string,
  clientEmail: string,
  details: Record<string, any>,
  dashboardUrl: string
): string {
  return `
Nieuw Abonnement

Klant heeft een abonnement gestart!

Abonnement Details:
- Klant: ${clientName} (${clientEmail})
- Plan: ${details.plan || 'Onbekend'}
- Prijs: €${details.price || 0}/maand
- Status: ${details.status || 'Active'}
- Start datum: ${new Date().toLocaleString('nl-NL')}

Bekijk in Admin Dashboard: ${dashboardUrl}
  `;
}

// SUBSCRIPTION CANCELLED TEMPLATES
function getSubscriptionCancelledEmailHTML(
  clientName: string,
  clientEmail: string,
  details: Record<string, any>,
  dashboardUrl: string
): string {
  const content = `
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      <strong>Klant heeft abonnement geannuleerd</strong>
    </p>
    
    <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0 0 12px 0; color: #991b1b; font-size: 16px; font-weight: bold;">
        Annulering Details:
      </p>
      <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.8;">
        <strong>Klant:</strong> ${clientName} (${clientEmail})<br>
        <strong>Plan:</strong> ${details.plan || 'Onbekend'}<br>
        <strong>Reden:</strong> ${details.reason || 'Niet opgegeven'}<br>
        <strong>Geannuleerd op:</strong> ${new Date().toLocaleString('nl-NL')}
      </p>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}" 
         style="display: inline-block; background-color: #FF6B35; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
        Bekijk in Admin Dashboard
      </a>
    </div>
  `;

  return getEmailWrapper('Abonnement Geannuleerd', '❌', content);
}

function getSubscriptionCancelledEmailText(
  clientName: string,
  clientEmail: string,
  details: Record<string, any>,
  dashboardUrl: string
): string {
  return `
Abonnement Geannuleerd

Klant heeft abonnement geannuleerd

Annulering Details:
- Klant: ${clientName} (${clientEmail})
- Plan: ${details.plan || 'Onbekend'}
- Reden: ${details.reason || 'Niet opgegeven'}
- Geannuleerd op: ${new Date().toLocaleString('nl-NL')}

Bekijk in Admin Dashboard: ${dashboardUrl}
  `;
}

// SUBSCRIPTION CHANGED TEMPLATES
function getSubscriptionChangedEmailHTML(
  clientName: string,
  clientEmail: string,
  details: Record<string, any>,
  dashboardUrl: string
): string {
  const content = `
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      <strong>Klant heeft abonnement gewijzigd</strong>
    </p>
    
    <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px; font-weight: bold;">
        Wijziging Details:
      </p>
      <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.8;">
        <strong>Klant:</strong> ${clientName} (${clientEmail})<br>
        <strong>Oud plan:</strong> ${details.oldPlan || 'Onbekend'}<br>
        <strong>Nieuw plan:</strong> ${details.newPlan || 'Onbekend'}<br>
        <strong>Wijziging:</strong> ${details.oldPlan && details.newPlan ? (details.newPlan > details.oldPlan ? 'Upgrade ⬆️' : 'Downgrade ⬇️') : 'Gewijzigd'}<br>
        <strong>Datum:</strong> ${new Date().toLocaleString('nl-NL')}
      </p>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}" 
         style="display: inline-block; background-color: #FF6B35; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
        Bekijk in Admin Dashboard
      </a>
    </div>
  `;

  return getEmailWrapper('Abonnement Gewijzigd', '🔄', content);
}

function getSubscriptionChangedEmailText(
  clientName: string,
  clientEmail: string,
  details: Record<string, any>,
  dashboardUrl: string
): string {
  return `
Abonnement Gewijzigd

Klant heeft abonnement gewijzigd

Wijziging Details:
- Klant: ${clientName} (${clientEmail})
- Oud plan: ${details.oldPlan || 'Onbekend'}
- Nieuw plan: ${details.newPlan || 'Onbekend'}
- Datum: ${new Date().toLocaleString('nl-NL')}

Bekijk in Admin Dashboard: ${dashboardUrl}
  `;
}

// GENERIC TEMPLATES
function getGenericEmailHTML(
  clientName: string,
  clientEmail: string,
  type: string,
  details: Record<string, any>,
  dashboardUrl: string
): string {
  const content = `
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      <strong>Nieuwe notificatie</strong>
    </p>
    
    <div style="background-color: #f3f4f6; border-left: 4px solid #6b7280; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.8;">
        <strong>Type:</strong> ${type}<br>
        <strong>Klant:</strong> ${clientName} (${clientEmail})<br>
        <strong>Details:</strong> ${JSON.stringify(details, null, 2)}<br>
        <strong>Datum:</strong> ${new Date().toLocaleString('nl-NL')}
      </p>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}" 
         style="display: inline-block; background-color: #FF6B35; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
        Bekijk in Admin Dashboard
      </a>
    </div>
  `;

  return getEmailWrapper('Writgo Media Notificatie', '📬', content);
}

function getGenericEmailText(
  clientName: string,
  clientEmail: string,
  type: string,
  details: Record<string, any>,
  dashboardUrl: string
): string {
  return `
Writgo Media Notificatie

Nieuwe notificatie

Type: ${type}
Klant: ${clientName} (${clientEmail})
Details: ${JSON.stringify(details, null, 2)}
Datum: ${new Date().toLocaleString('nl-NL')}

Bekijk in Admin Dashboard: ${dashboardUrl}
  `;
}

// ===== CLIENT TEMPLATES: CONTENT PUBLICATIE =====

function getContentPublishedEmailHTML(
  clientName: string,
  articleTitle: string,
  articleUrl: string,
  publishDate: string,
  details: {
    excerpt?: string;
    categories?: string[];
    wordCount?: number;
    autoPublished?: boolean;
  }
): string {
  const content = `
    <div style="margin-bottom: 32px;">
      <p style="font-size: 16px; line-height: 1.6; color: #1f2937; margin: 0 0 16px 0;">
        Hoi ${clientName},
      </p>
      <p style="font-size: 16px; line-height: 1.6; color: #1f2937; margin: 0 0 16px 0;">
        ${details.autoPublished ? 
          '🤖 Je autopilot heeft zojuist automatisch een nieuw artikel gepubliceerd!' : 
          '🎉 Je artikel is succesvol gepubliceerd!'}
      </p>
    </div>

    <div style="background-color: #fff7ed; border-left: 4px solid #FF6B35; padding: 20px; margin-bottom: 32px; border-radius: 6px;">
      <h2 style="margin: 0 0 12px 0; color: #1f2937; font-size: 20px; font-weight: bold;">
        ${articleTitle}
      </h2>
      ${details.excerpt ? `
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 8px 0 16px 0;">
          ${details.excerpt}
        </p>
      ` : ''}
      <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px;">
        ${details.wordCount ? `
          <span style="background-color: #f3f4f6; color: #6b7280; padding: 6px 12px; border-radius: 4px; font-size: 13px;">
            📝 ${details.wordCount} woorden
          </span>
        ` : ''}
        ${details.categories && details.categories.length > 0 ? `
          <span style="background-color: #f3f4f6; color: #6b7280; padding: 6px 12px; border-radius: 4px; font-size: 13px;">
            🏷️ ${details.categories.join(', ')}
          </span>
        ` : ''}
        <span style="background-color: #f3f4f6; color: #6b7280; padding: 6px 12px; border-radius: 4px; font-size: 13px;">
          📅 ${publishDate}
        </span>
      </div>
    </div>

    <div style="margin-bottom: 32px;">
      <a href="${articleUrl}" 
         style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #ff8c5a 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);">
        📖 Bekijk je artikel →
      </a>
    </div>

    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
      <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin: 0 0 12px 0;">
        <strong style="color: #1f2937;">💡 Volgende stappen:</strong>
      </p>
      <ul style="font-size: 14px; line-height: 1.8; color: #6b7280; margin: 0; padding-left: 20px;">
        <li>Deel je artikel op social media voor meer bereik</li>
        <li>Controleer de SEO score in je WordPress dashboard</li>
        <li>Monitor de prestaties in Google Analytics</li>
        <li>Voeg indien nodig nog interne links toe</li>
      </ul>
    </div>

    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin: 0;">
        Heb je vragen of feedback? Wij helpen je graag! Stuur een mail naar 
        <a href="mailto:info@WritgoAI.nl" style="color: #FF6B35; text-decoration: underline;">info@WritgoAI.nl</a>
      </p>
    </div>
  `;

  return getEmailWrapper('Je artikel is gepubliceerd!', '🎉', content);
}

function getContentPublishedEmailText(
  clientName: string,
  articleTitle: string,
  articleUrl: string,
  publishDate: string,
  details: {
    excerpt?: string;
    categories?: string[];
    wordCount?: number;
    autoPublished?: boolean;
  }
): string {
  return `
Je artikel is gepubliceerd!

Hoi ${clientName},

${details.autoPublished ? 
  '🤖 Je autopilot heeft zojuist automatisch een nieuw artikel gepubliceerd!' : 
  '🎉 Je artikel is succesvol gepubliceerd!'}

Artikel: ${articleTitle}
Gepubliceerd op: ${publishDate}
${details.wordCount ? `Aantal woorden: ${details.wordCount}` : ''}
${details.categories && details.categories.length > 0 ? `Categorieën: ${details.categories.join(', ')}` : ''}

${details.excerpt || ''}

Bekijk je artikel: ${articleUrl}

Volgende stappen:
- Deel je artikel op social media voor meer bereik
- Controleer de SEO score in je WordPress dashboard
- Monitor de prestaties in Google Analytics
- Voeg indien nodig nog interne links toe

Heb je vragen of feedback? Mail naar info@WritgoAI.nl

Met vriendelijke groet,
Het Writgo Media Team
  `;
}

// ===== NIEUWE TEMPLATES: ADMIN WELKOMST =====

export function getAdminWelcomeEmailTemplate(
  adminName: string,
  adminEmail: string,
  temporaryPassword: string
): { subject: string; html: string; text: string } {
  const loginUrl = 'https://WritgoAI.nl/admin';
  
  const html = `
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
                      🎉 Welkom bij Writgo Media Admin!
                    </h1>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                      Hoi <strong>${adminName}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                      Je bent aangemaakt als admin gebruiker voor Writgo Media! Je hebt nu volledige toegang tot het admin dashboard.
                    </p>
                    
                    <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 4px;">
                      <p style="margin: 0 0 12px 0; color: #991b1b; font-size: 16px; font-weight: bold;">
                        🔐 Jouw tijdelijke login gegevens:
                      </p>
                      <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.8; font-family: 'Courier New', monospace;">
                        <strong>Email:</strong> ${adminEmail}<br>
                        <strong>Wachtwoord:</strong> ${temporaryPassword}
                      </p>
                    </div>
                    
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
                      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                        ⚠️ <strong>BELANGRIJK:</strong> Wijzig dit wachtwoord direct na je eerste login voor de veiligheid!
                      </p>
                    </div>
                    
                    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                      <strong>Als admin kun je:</strong>
                    </p>
                    
                    <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #333333; font-size: 16px; line-height: 1.8;">
                      <li>Klanten beheren en statistieken bekijken</li>
                      <li>Credits toewijzen en bijhouden</li>
                      <li>Email campagnes maken en verzenden</li>
                      <li>Abonnementen en facturering beheren</li>
                      <li>Support tickets afhandelen</li>
                      <li>Affiliate payouts goedkeuren</li>
                    </ul>
                    
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${loginUrl}" 
                         style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                        Login op Admin Dashboard
                      </a>
                    </div>
                    
                    <p style="margin: 24px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                      Heb je vragen over de admin functionaliteiten? Neem contact op met de hoofdadmin.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.6; text-align: center;">
                      Je ontvangt deze e-mail omdat je bent toegevoegd als admin bij Writgo Media.<br>
                      Wijzig je wachtwoord direct na de eerste login!<br>
                      © 2025 Writgo Media - Admin Dashboard
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = `
Welkom bij Writgo Media Admin!

Hoi ${adminName},

Je bent aangemaakt als admin gebruiker voor Writgo Media! Je hebt nu volledige toegang tot het admin dashboard.

🔐 Jouw tijdelijke login gegevens:
Email: ${adminEmail}
Wachtwoord: ${temporaryPassword}

⚠️ BELANGRIJK: Wijzig dit wachtwoord direct na je eerste login voor de veiligheid!

Als admin kun je:
• Klanten beheren en statistieken bekijken
• Credits toewijzen en bijhouden
• Email campagnes maken en verzenden
• Abonnementen en facturering beheren
• Support tickets afhandelen
• Affiliate payouts goedkeuren

Login op Admin Dashboard: ${loginUrl}

Heb je vragen over de admin functionaliteiten? Neem contact op met de hoofdadmin.

© 2025 Writgo Media - Admin Dashboard
  `;

  return {
    subject: '🎉 Welkom als Writgo Media Admin - Login Gegevens',
    html,
    text,
  };
}

// ===== ONBOARDING EMAIL REEKS (5 EMAILS) =====

/**
 * EMAIL 1: Welkom en eerste stappen (dag 0)
 */
export function getOnboardingEmail1Template(
  clientName: string,
  loginUrl: string
): { subject: string; html: string; text: string } {
  const html = getEmailWrapper(
    'Welkom bij Writgo Media! 🚀',
    '👋',
    `
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Hoi <strong>${clientName}</strong>,
    </p>
    
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Wat super dat je bent begonnen met Writgo Media! In deze mail leggen we kort uit hoe je binnen 10 minuten je eerste AI-artikel kunt maken.
    </p>
    
    <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px; font-weight: bold;">
        🎯 Je eerste 3 stappen:
      </p>
      <ol style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
        <li><strong>Profiel instellen:</strong> Vul je website en doelgroep in</li>
        <li><strong>WordPress koppelen:</strong> Verbind je website (optioneel)</li>
        <li><strong>Eerste artikel maken:</strong> Gebruik de "Writgo Writer"</li>
      </ol>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${loginUrl}" 
         style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
        Start Nu →
      </a>
    </div>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0 0 8px 0; color: #166534; font-size: 14px; font-weight: bold;">
        💡 Pro tip:
      </p>
      <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.6;">
        Gebruik je gratis credits om verschillende schrijfstijlen te testen voordat je een abonnement kiest!
      </p>
    </div>
    
    <p style="margin: 24px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
      Morgen sturen we je tips over hoe je de beste SEO-resultaten behaalt! 📈
    </p>
    `
  );

  const text = `
Welkom bij Writgo Media! 🚀

Hoi ${clientName},

Wat super dat je bent begonnen met Writgo Media! In deze mail leggen we kort uit hoe je binnen 10 minuten je eerste AI-artikel kunt maken.

🎯 Je eerste 3 stappen:
1. Profiel instellen: Vul je website en doelgroep in
2. WordPress koppelen: Verbind je website (optioneel)
3. Eerste artikel maken: Gebruik de "Writgo Writer"

💡 Pro tip:
Gebruik je gratis credits om verschillende schrijfstijlen te testen voordat je een abonnement kiest!

Start Nu: ${loginUrl}

Morgen sturen we je tips over hoe je de beste SEO-resultaten behaalt! 📈

Met vriendelijke groet,
Het Writgo Media Team
  `;

  return {
    subject: '👋 Welkom bij Writgo Media - Je eerste stappen!',
    html,
    text,
  };
}

/**
 * EMAIL 2: SEO tips en best practices (dag 1)
 */
export function getOnboardingEmail2Template(
  clientName: string,
  dashboardUrl: string
): { subject: string; html: string; text: string } {
  const html = getEmailWrapper(
    'Zo maak je SEO-vriendelijke content 📈',
    '📊',
    `
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Hoi <strong>${clientName}</strong>,
    </p>
    
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Gisteren leerde je hoe je snel aan de slag gaat. Vandaag delen we onze <strong>top 5 SEO-tips</strong> voor maximaal resultaat met AI-content!
    </p>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 16px 0; color: #92400e; font-size: 18px; font-weight: bold;">
        🏆 5 Gouden SEO-regels:
      </h3>
      <ol style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.8;">
        <li><strong>Long-tail keywords:</strong> Gebruik specifieke zoekwoorden met 3+ woorden</li>
        <li><strong>FAQ sectie toevoegen:</strong> Beantwoord veel gestelde vragen in je artikel</li>
        <li><strong>Interne links:</strong> Link naar andere artikelen op je website</li>
        <li><strong>Meta beschrijving:</strong> Schrijf een aantrekkelijke samenvatting (max 160 tekens)</li>
        <li><strong>Afbeeldingen optimaliseren:</strong> Gebruik ALT-teksten met keywords</li>
      </ol>
    </div>
    
    <div style="background-color: #ede9fe; border-left: 4px solid #8b5cf6; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0 0 8px 0; color: #5b21b6; font-size: 14px; font-weight: bold;">
        ✨ Writgo Media doet dit automatisch voor je:
      </p>
      <ul style="margin: 0; padding-left: 20px; color: #5b21b6; font-size: 14px; line-height: 1.8;">
        <li>Zoekt automatisch relevante long-tail keywords</li>
        <li>Voegt FAQ secties toe aan je artikelen</li>
        <li>Optimaliseert koppen (H1, H2, H3) voor SEO</li>
        <li>Genereert meta beschrijvingen</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}/writgo-writer" 
         style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
        Maak je eerste SEO-artikel →
      </a>
    </div>
    
    <p style="margin: 24px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
      Morgen: Hoe je tijd bespaart met de Autopilot functie! ⏰
    </p>
    `
  );

  const text = `
Zo maak je SEO-vriendelijke content 📈

Hoi ${clientName},

Gisteren leerde je hoe je snel aan de slag gaat. Vandaag delen we onze top 5 SEO-tips voor maximaal resultaat met AI-content!

🏆 5 Gouden SEO-regels:
1. Long-tail keywords: Gebruik specifieke zoekwoorden met 3+ woorden
2. FAQ sectie toevoegen: Beantwoord veel gestelde vragen in je artikel
3. Interne links: Link naar andere artikelen op je website
4. Meta beschrijving: Schrijf een aantrekkelijke samenvatting (max 160 tekens)
5. Afbeeldingen optimaliseren: Gebruik ALT-teksten met keywords

✨ Writgo Media doet dit automatisch voor je:
• Zoekt automatisch relevante long-tail keywords
• Voegt FAQ secties toe aan je artikelen
• Optimaliseert koppen (H1, H2, H3) voor SEO
• Genereert meta beschrijvingen

Maak je eerste SEO-artikel: ${dashboardUrl}/writgo-writer

Morgen: Hoe je tijd bespaart met de Autopilot functie! ⏰

Met vriendelijke groet,
Het Writgo Media Team
  `;

  return {
    subject: '📊 5 SEO-tips voor betere Google rankings',
    html,
    text,
  };
}

/**
 * EMAIL 3: Autopilot uitleg (dag 3)
 */
export function getOnboardingEmail3Template(
  clientName: string,
  dashboardUrl: string
): { subject: string; html: string; text: string } {
  const html = getEmailWrapper(
    'Bespaar 10+ uur per week met Autopilot ⏰',
    '🤖',
    `
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Hoi <strong>${clientName}</strong>,
    </p>
    
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Stel je voor: <strong>elke week automatisch nieuwe artikelen</strong> op je website, zonder dat jij er iets voor hoeft te doen. Dat is precies wat onze Autopilot functie doet!
    </p>
    
    <div style="background-color: #dcfce7; border-left: 4px solid #22c55e; padding: 20px; margin: 24px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 16px 0; color: #166534; font-size: 18px; font-weight: bold;">
        🚀 Wat doet Autopilot?
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #166534; font-size: 14px; line-height: 1.8;">
        <li>Zoekt automatisch trending topics in jouw niche</li>
        <li>Genereert complete SEO-artikelen (1500-2500 woorden)</li>
        <li>Publiceert direct naar WordPress (of slaat op in je library)</li>
        <li>Voegt automatisch relevante afbeeldingen toe</li>
        <li>Plant publicaties op de beste tijden</li>
      </ul>
    </div>
    
    <div style="background-color: #e0e7ff; border-left: 4px solid #6366f1; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0 0 12px 0; color: #3730a3; font-size: 16px; font-weight: bold;">
        ⚙️ Zo stel je het in (3 minuten):
      </p>
      <ol style="margin: 0; padding-left: 20px; color: #3730a3; font-size: 14px; line-height: 1.8;">
        <li>Ga naar "Autopilot" in je dashboard</li>
        <li>Kies hoe vaak je content wilt (1-5x per week)</li>
        <li>Vul je keywords en doelgroep in</li>
        <li>Zet Autopilot "AAN" en klaar! 🎉</li>
      </ol>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}/autopilot" 
         style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
        Activeer Autopilot →
      </a>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
        💰 <strong>Rekenvoorbeeld:</strong> 4 artikelen/maand × 3 uur per artikel = 12 uur bespaard!<br>
        Wat zou jij met die extra tijd doen?
      </p>
    </div>
    
    <p style="margin: 24px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
      Morgen: Hoe je geld verdient met affiliate marketing! 💰
    </p>
    `
  );

  const text = `
Bespaar 10+ uur per week met Autopilot ⏰

Hoi ${clientName},

Stel je voor: elke week automatisch nieuwe artikelen op je website, zonder dat jij er iets voor hoeft te doen. Dat is precies wat onze Autopilot functie doet!

🚀 Wat doet Autopilot?
• Zoekt automatisch trending topics in jouw niche
• Genereert complete SEO-artikelen (1500-2500 woorden)
• Publiceert direct naar WordPress (of slaat op in je library)
• Voegt automatisch relevante afbeeldingen toe
• Plant publicaties op de beste tijden

⚙️ Zo stel je het in (3 minuten):
1. Ga naar "Autopilot" in je dashboard
2. Kies hoe vaak je content wilt (1-5x per week)
3. Vul je keywords en doelgroep in
4. Zet Autopilot "AAN" en klaar! 🎉

💰 Rekenvoorbeeld: 4 artikelen/maand × 3 uur per artikel = 12 uur bespaard!
Wat zou jij met die extra tijd doen?

Activeer Autopilot: ${dashboardUrl}/autopilot

Morgen: Hoe je geld verdient met affiliate marketing! 💰

Met vriendelijke groet,
Het Writgo Media Team
  `;

  return {
    subject: '⏰ Bespaar 10+ uur per week met deze functie',
    html,
    text,
  };
}

/**
 * EMAIL 4: Affiliate marketing uitleg (dag 5)
 */
export function getOnboardingEmail4Template(
  clientName: string,
  dashboardUrl: string
): { subject: string; html: string; text: string } {
  const html = getEmailWrapper(
    'Verdien geld met je content 💰',
    '💸',
    `
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Hoi <strong>${clientName}</strong>,
    </p>
    
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Wist je dat je met Writgo Media <strong>automatisch geld kunt verdienen</strong> met je artikelen? Door slimme affiliate links in te bouwen!
    </p>
    
    <div style="background-color: #dcfce7; border-left: 4px solid #22c55e; padding: 20px; margin: 24px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 16px 0; color: #166534; font-size: 18px; font-weight: bold;">
        💰 Hoe werkt het?
      </h3>
      <ol style="margin: 0; padding-left: 20px; color: #166534; font-size: 14px; line-height: 1.8;">
        <li><strong>Koppel Bol.com:</strong> Voeg je affiliate credentials toe</li>
        <li><strong>AI vindt producten:</strong> Writgo Media zoekt relevante producten bij je content</li>
        <li><strong>Automatisch invoegen:</strong> Affiliate links worden netjes toegevoegd</li>
        <li><strong>Verdien commissie:</strong> Bij elke verkoop via jouw link! 🎉</li>
      </ol>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: bold;">
        📊 Rekenvoorbeeld:
      </p>
      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.8;">
        100 bezoekers/dag × 2% click-through × €50 gemiddelde bestelling × 7% commissie<br>
        = <strong>€245 per maand extra inkomsten!</strong> 💸
      </p>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}/projects" 
         style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
        Koppel Bol.com Affiliate →
      </a>
    </div>
    
    <div style="background-color: #e0e7ff; border-left: 4px solid #6366f1; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0 0 8px 0; color: #3730a3; font-size: 14px; font-weight: bold;">
        💡 Pro tips:
      </p>
      <ul style="margin: 0; padding-left: 20px; color: #3730a3; font-size: 14px; line-height: 1.8;">
        <li>Schrijf product reviews → Hogere conversie!</li>
        <li>Maak "Top 10" lijsten → Zeer populair</li>
        <li>Vergelijkingsartikelen werken het beste</li>
      </ul>
    </div>
    
    <p style="margin: 24px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
      Morgen: Hoe je anderen uitnodigt en zelf verdient! 🤝
    </p>
    `
  );

  const text = `
Verdien geld met je content 💰

Hoi ${clientName},

Wist je dat je met Writgo Media automatisch geld kunt verdienen met je artikelen? Door slimme affiliate links in te bouwen!

💰 Hoe werkt het?
1. Koppel Bol.com: Voeg je affiliate credentials toe
2. AI vindt producten: Writgo Media zoekt relevante producten bij je content
3. Automatisch invoegen: Affiliate links worden netjes toegevoegd
4. Verdien commissie: Bij elke verkoop via jouw link! 🎉

📊 Rekenvoorbeeld:
100 bezoekers/dag × 2% click-through × €50 gemiddelde bestelling × 7% commissie
= €245 per maand extra inkomsten! 💸

💡 Pro tips:
• Schrijf product reviews → Hogere conversie!
• Maak "Top 10" lijsten → Zeer populair
• Vergelijkingsartikelen werken het beste

Koppel Bol.com Affiliate: ${dashboardUrl}/projects

Morgen: Hoe je anderen uitnodigt en zelf verdient! 🤝

Met vriendelijke groet,
Het Writgo Media Team
  `;

  return {
    subject: '💰 Verdien €245+ per maand met affiliate marketing',
    html,
    text,
  };
}

/**
 * EMAIL 5: Affiliate programma en referrals (dag 7)
 */
export function getOnboardingEmail5Template(
  clientName: string,
  dashboardUrl: string,
  affiliateCode?: string
): { subject: string; html: string; text: string } {
  const html = getEmailWrapper(
    'Verdien 30% commissie met ons affiliate programma! 🤝',
    '🎁',
    `
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Hoi <strong>${clientName}</strong>,
    </p>
    
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Als laatste tip: wist je dat je <strong>30% terugkrijgt</strong> van elke klant die jij aanmeldt bij Writgo Media? Dat kan flink oplopen!
    </p>
    
    <div style="background-color: #dcfce7; border-left: 4px solid #22c55e; padding: 20px; margin: 24px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 16px 0; color: #166534; font-size: 18px; font-weight: bold;">
        💰 Ons Affiliate Programma:
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #166534; font-size: 14px; line-height: 1.8;">
        <li><strong>30% commissie:</strong> Van elke betaling van jouw referrals</li>
        <li><strong>Lifetime earnings:</strong> Zolang ze klant blijven!</li>
        <li><strong>Minimale uitbetaling:</strong> Vanaf €50</li>
        <li><strong>Maandelijkse payouts:</strong> Via overschrijving</li>
      </ul>
    </div>
    
    ${affiliateCode ? `
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: bold;">
          🎯 Jouw unieke affiliate code:
        </p>
        <p style="margin: 0; color: #92400e; font-size: 20px; font-weight: bold; font-family: 'Courier New', monospace;">
          ${affiliateCode}
        </p>
      </div>
    ` : ''}
    
    <div style="background-color: #e0e7ff; border-left: 4px solid #6366f1; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0 0 12px 0; color: #3730a3; font-size: 16px; font-weight: bold;">
        📊 Rekenvoorbeeld:
      </p>
      <p style="margin: 0; color: #3730a3; font-size: 14px; line-height: 1.8;">
        5 referrals × €97/maand × 30% commissie = <strong>€145,50 per maand!</strong><br>
        10 referrals = €291 per maand<br>
        20 referrals = €582 per maand 🚀
      </p>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}/affiliate" 
         style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
        Start met Verdienen →
      </a>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: bold;">
        🎯 Wie kun je aanmelden?
      </p>
      <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.8;">
        <li>Bloggers en website eigenaren</li>
        <li>Online marketeers en SEO specialisten</li>
        <li>E-commerce ondernemers</li>
        <li>Social media managers</li>
        <li>Content creators en copywriters</li>
      </ul>
    </div>
    
    <p style="margin: 24px 0 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Dat was onze onboarding serie! Veel succes met Writgo Media, en als je vragen hebt, mail ons gerust op info@WritgoAI.nl 💪
    </p>
    `
  );

  const text = `
Verdien 30% commissie met ons affiliate programma! 🤝

Hoi ${clientName},

Als laatste tip: wist je dat je 30% terugkrijgt van elke klant die jij aanmeldt bij Writgo Media? Dat kan flink oplopen!

💰 Ons Affiliate Programma:
• 30% commissie: Van elke betaling van jouw referrals
• Lifetime earnings: Zolang ze klant blijven!
• Minimale uitbetaling: Vanaf €50
• Maandelijkse payouts: Via overschrijving

${affiliateCode ? `🎯 Jouw unieke affiliate code: ${affiliateCode}\n` : ''}

📊 Rekenvoorbeeld:
5 referrals × €97/maand × 30% commissie = €145,50 per maand!
10 referrals = €291 per maand
20 referrals = €582 per maand 🚀

🎯 Wie kun je aanmelden?
• Bloggers en website eigenaren
• Online marketeers en SEO specialisten
• E-commerce ondernemers
• Social media managers
• Content creators en copywriters

Start met Verdienen: ${dashboardUrl}/affiliate

Dat was onze onboarding serie! Veel succes met Writgo Media, en als je vragen hebt, mail ons gerust op info@WritgoAI.nl 💪

Met vriendelijke groet,
Het Writgo Media Team
  `;

  return {
    subject: '🎁 Verdien €145+ per maand met ons affiliate programma',
    html,
    text,
  };
}

// ===== PROMOTIONELE EMAILS VOOR FEESTDAGEN =====

/**
 * BLACK FRIDAY EMAIL
 */
export function getBlackFridayEmailTemplate(
  clientName: string,
  discountCode: string,
  discountPercentage: number,
  expiryDate: string,
  dashboardUrl: string
): { subject: string; html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #000000;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 20px rgba(255, 107, 53, 0.4);">
                
                <tr>
                  <td style="padding: 40px 40px 20px 40px; background: linear-gradient(135deg, #000000 0%, #f97316 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; text-align: center;">
                      🖤 BLACK FRIDAY DEAL 🖤
                    </h1>
                    <p style="margin: 12px 0 0 0; color: #ffffff; font-size: 20px; text-align: center; font-weight: bold;">
                      ${discountPercentage}% KORTING OP ALLES!
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                      Hoi <strong>${clientName}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 20px 0; color: #333333; font-size: 18px; line-height: 1.6; font-weight: bold;">
                      Eindelijk is het dan zo ver: onze grootste actie van het jaar! 🎉
                    </p>
                    
                    <div style="background-color: #000000; color: #ffffff; padding: 24px; margin: 24px 0; border-radius: 8px; text-align: center;">
                      <p style="margin: 0 0 16px 0; font-size: 16px; text-transform: uppercase; letter-spacing: 2px;">
                        Jouw exclusieve code:
                      </p>
                      <p style="margin: 0 0 16px 0; font-size: 36px; font-weight: bold; color: #f97316; font-family: 'Courier New', monospace; letter-spacing: 4px;">
                        ${discountCode}
                      </p>
                      <p style="margin: 0; font-size: 14px; color: #d1d5db;">
                        ⏰ Geldig tot ${expiryDate}
                      </p>
                    </div>
                    
                    <div style="background-color: #fef3c7; border-left: 4px solid #f97316; padding: 20px; margin: 24px 0; border-radius: 4px;">
                      <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 18px; font-weight: bold;">
                        🎁 Wat krijg je?
                      </h3>
                      <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.8;">
                        <li><strong>${discountPercentage}% korting</strong> op alle abonnementen (eerste jaar)</li>
                        <li><strong>BONUS:</strong> 2000 extra credits bij ieder abonnement!</li>
                        <li><strong>Lifetime deal:</strong> Deze prijs blijft voor altijd!</li>
                        <li><strong>Gratis WordPress plugin</strong> t.w.v. €49</li>
                      </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${dashboardUrl}/account?promo=${discountCode}" 
                         style="display: inline-block; background: linear-gradient(135deg, #000000 0%, #f97316 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 8px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);">
                        🔥 CLAIM NU JE ${discountPercentage}% KORTING →
                      </a>
                    </div>
                    
                    <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 4px;">
                      <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6; text-align: center;">
                        ⏰ <strong>LET OP:</strong> Deze deal eindigt op ${expiryDate}! Mis het niet!
                      </p>
                    </div>
                    
                    <p style="margin: 24px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6; text-align: center;">
                      Heb je vragen? Stuur een mail naar info@WritgoAI.nl<br>
                      We helpen je graag! 💪
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.6; text-align: center;">
                      © 2025 Writgo Media - Black Friday Actie ${expiryDate}
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = `
🖤 BLACK FRIDAY DEAL - ${discountPercentage}% KORTING OP ALLES! 🖤

Hoi ${clientName},

Eindelijk is het dan zo ver: onze grootste actie van het jaar! 🎉

Jouw exclusieve code: ${discountCode}
⏰ Geldig tot ${expiryDate}

🎁 Wat krijg je?
• ${discountPercentage}% korting op alle abonnementen (eerste jaar)
• BONUS: 2000 extra credits bij ieder abonnement!
• Lifetime deal: Deze prijs blijft voor altijd!
• Gratis WordPress plugin t.w.v. €49

CLAIM NU: ${dashboardUrl}/account?promo=${discountCode}

⏰ LET OP: Deze deal eindigt op ${expiryDate}! Mis het niet!

Heb je vragen? Stuur een mail naar info@WritgoAI.nl
We helpen je graag! 💪

© 2025 Writgo Media - Black Friday Actie
  `;

  return {
    subject: `🖤 BLACK FRIDAY: ${discountPercentage}% KORTING + 2000 BONUS CREDITS!`,
    html,
    text,
  };
}

/**
 * KERST EMAIL
 */
export function getChristmasEmailTemplate(
  clientName: string,
  discountCode: string,
  discountPercentage: number,
  expiryDate: string,
  dashboardUrl: string
): { subject: string; html: string; text: string } {
  const html = getEmailWrapper(
    `Kerst Cadeau: ${discountPercentage}% Korting! 🎄`,
    '🎅',
    `
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Hoi <strong>${clientName}</strong>,
    </p>
    
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 18px; line-height: 1.6;">
      🎄 Ho ho ho! De kerstman heeft een speciaal cadeau voor je: <strong>${discountPercentage}% korting</strong> op alle Writgo Media abonnementen!
    </p>
    
    <div style="background-color: #dcfce7; border-left: 4px solid #22c55e; padding: 24px; margin: 24px 0; border-radius: 8px; text-align: center;">
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #166534;">
        🎁 Jouw kerst code:
      </p>
      <p style="margin: 0 0 16px 0; font-size: 32px; font-weight: bold; color: #ef4444; font-family: 'Courier New', monospace; letter-spacing: 4px;">
        ${discountCode}
      </p>
      <p style="margin: 0; font-size: 14px; color: #166534;">
        ⏰ Geldig t/m ${expiryDate}
      </p>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f97316; padding: 20px; margin: 24px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 18px; font-weight: bold;">
        🎅 Kerst Voordelen:
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.8;">
        <li>${discountPercentage}% korting op alle abonnementen</li>
        <li>1500 bonus credits cadeau! 🎁</li>
        <li>Gratis WordPress plugin</li>
        <li>Persoonlijke onboarding sessie</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}/account?promo=${discountCode}" 
         style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #ef4444 100%); color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 8px; font-size: 18px; font-weight: bold;">
        🎄 Claim Je Kerst Cadeau →
      </a>
    </div>
    
    <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6; text-align: center;">
        🎅 <strong>Wees er snel bij!</strong> Deze kerstactie eindigt op ${expiryDate}
      </p>
    </div>
    
    <p style="margin: 24px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6; text-align: center;">
      Fijne feestdagen gewenst! 🎄✨<br>
      Team Writgo Media
    </p>
    `
  );

  const text = `
🎄 Kerst Cadeau: ${discountPercentage}% Korting! 🎅

Hoi ${clientName},

Ho ho ho! De kerstman heeft een speciaal cadeau voor je: ${discountPercentage}% korting op alle Writgo Media abonnementen!

🎁 Jouw kerst code: ${discountCode}
⏰ Geldig t/m ${expiryDate}

🎅 Kerst Voordelen:
• ${discountPercentage}% korting op alle abonnementen
• 1500 bonus credits cadeau! 🎁
• Gratis WordPress plugin
• Persoonlijke onboarding sessie

Claim Je Kerst Cadeau: ${dashboardUrl}/account?promo=${discountCode}

🎅 Wees er snel bij! Deze kerstactie eindigt op ${expiryDate}

Fijne feestdagen gewenst! 🎄✨
Team Writgo Media
  `;

  return {
    subject: `🎄 Kerst Cadeau: ${discountPercentage}% Korting + 1500 Bonus Credits!`,
    html,
    text,
  };
}

/**
 * NIEUWJAAR EMAIL
 */
export function getNewYearEmailTemplate(
  clientName: string,
  discountCode: string,
  discountPercentage: number,
  expiryDate: string,
  dashboardUrl: string
): { subject: string; html: string; text: string } {
  const html = getEmailWrapper(
    `Nieuwjaars Voornemen: ${discountPercentage}% Korting! 🎊`,
    '🎉',
    `
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Hoi <strong>${clientName}</strong>,
    </p>
    
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 18px; line-height: 1.6;">
      🎉 Gelukkig Nieuwjaar! Start 2026 goed met <strong>${discountPercentage}% korting</strong> op Writgo Media en haal je content doelen dit jaar!
    </p>
    
    <div style="background-color: #e0e7ff; border-left: 4px solid #6366f1; padding: 24px; margin: 24px 0; border-radius: 8px; text-align: center;">
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #3730a3;">
        🎊 Jouw nieuwjaars code:
      </p>
      <p style="margin: 0 0 16px 0; font-size: 32px; font-weight: bold; color: #6366f1; font-family: 'Courier New', monospace; letter-spacing: 4px;">
        ${discountCode}
      </p>
      <p style="margin: 0; font-size: 14px; color: #3730a3;">
        ⏰ Geldig t/m ${expiryDate}
      </p>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f97316; padding: 20px; margin: 24px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 18px; font-weight: bold;">
        🎯 Jouw 2026 Content Voornemens:
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.8;">
        <li>✅ Elke week minimaal 1 artikel publiceren</li>
        <li>✅ SEO ranking verbeteren naar top 3</li>
        <li>✅ 50% meer organisch verkeer genereren</li>
        <li>✅ €500+ per maand verdienen met affiliate</li>
      </ul>
    </div>
    
    <div style="background-color: #dcfce7; border-left: 4px solid #22c55e; padding: 20px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0 0 12px 0; color: #166534; font-size: 16px; font-weight: bold;">
        🎁 Nieuwjaars Bonus:
      </p>
      <ul style="margin: 0; padding-left: 20px; color: #166534; font-size: 14px; line-height: 1.8;">
        <li>${discountPercentage}% korting op alle plannen</li>
        <li>2000 extra credits bij aanmelding!</li>
        <li>Gratis strategy sessie (t.w.v. €149)</li>
        <li>Lifetime pricing (prijs blijft gelijk!)</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}/account?promo=${discountCode}" 
         style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #f97316 100%); color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 8px; font-size: 18px; font-weight: bold;">
        🎊 Start 2026 Met ${discountPercentage}% Korting →
      </a>
    </div>
    
    <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6; text-align: center;">
        🎉 <strong>Laatste kans!</strong> Actie eindigt ${expiryDate}
      </p>
    </div>
    
    <p style="margin: 24px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6; text-align: center;">
      Veel succes in 2026! 🚀<br>
      Team Writgo Media
    </p>
    `
  );

  const text = `
🎊 Nieuwjaars Voornemen: ${discountPercentage}% Korting! 🎉

Hoi ${clientName},

Gelukkig Nieuwjaar! Start 2026 goed met ${discountPercentage}% korting op Writgo Media en haal je content doelen dit jaar!

🎊 Jouw nieuwjaars code: ${discountCode}
⏰ Geldig t/m ${expiryDate}

🎯 Jouw 2026 Content Voornemens:
✅ Elke week minimaal 1 artikel publiceren
✅ SEO ranking verbeteren naar top 3
✅ 50% meer organisch verkeer genereren
✅ €500+ per maand verdienen met affiliate

🎁 Nieuwjaars Bonus:
• ${discountPercentage}% korting op alle plannen
• 2000 extra credits bij aanmelding!
• Gratis strategy sessie (t.w.v. €149)
• Lifetime pricing (prijs blijft gelijk!)

Start 2026: ${dashboardUrl}/account?promo=${discountCode}

🎉 Laatste kans! Actie eindigt ${expiryDate}

Veel succes in 2026! 🚀
Team Writgo Media
  `;

  return {
    subject: `🎊 Nieuwjaar 2026: ${discountPercentage}% Korting + Strategy Sessie!`,
    html,
    text,
  };
}
