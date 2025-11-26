
/**
 * Notification Helper
 * Centraal systeem voor het versturen van admin notificaties
 */

import { prisma } from './db';
import { sendAdminNotificationEmail } from './email';

const ADMIN_EMAILS = [
  'mikeschonewille@gmail.com',
  // Voeg hier meer admin emails toe indien nodig
];

export interface NotificationData {
  type: 'new_client' | 'credits_purchased' | 'credits_low' | 'subscription_started' | 'subscription_cancelled' | 'subscription_changed' | 'subscription_error';
  clientId: string;
  clientName: string;
  clientEmail: string;
  details: Record<string, any>;
}

/**
 * Stuur notificatie naar alle admins
 */
export async function sendAdminNotification(data: NotificationData) {
  try {
    // Log notification in database (optioneel - kan later toegevoegd worden)
    console.log('[Notification] Sending to admins:', data.type, data.clientName);

    // Stuur e-mail naar alle admins
    for (const adminEmail of ADMIN_EMAILS) {
      try {
        await sendAdminNotificationEmail({
          to: adminEmail,
          type: data.type,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          details: data.details,
        });
      } catch (emailError) {
        console.error(`[Notification] Failed to send email to ${adminEmail}:`, emailError);
        // Continue met andere emails ook al faalt één
      }
    }

    return { success: true };
  } catch (error) {
    console.error('[Notification] Failed to send admin notification:', error);
    // Throw niet - we willen niet dat het hoofd proces faalt door een notificatie fout
    return { success: false, error };
  }
}

/**
 * Check of credits laag zijn en stuur notificatie
 */
export async function checkAndNotifyLowCredits(clientId: string) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionCredits: true,
        topUpCredits: true,
        isUnlimited: true,
      },
    });

    if (!client || client.isUnlimited) {
      return;
    }

    const totalCredits = client.subscriptionCredits + client.topUpCredits;

    // Stuur notificatie als credits onder 5 zijn
    if (totalCredits <= 5 && totalCredits > 0) {
      await sendAdminNotification({
        type: 'credits_low',
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email,
        details: {
          subscriptionCredits: client.subscriptionCredits,
          topUpCredits: client.topUpCredits,
          totalCredits,
        },
      });
    }
  } catch (error) {
    console.error('[Notification] Failed to check low credits:', error);
  }
}
