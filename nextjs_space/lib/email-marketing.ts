/**
 * Email Marketing Suite Library
 * Handles campaign sending, analytics tracking, and credit management
 */

import { prisma } from './db';
import { sendEmail } from './email-service';

interface CampaignEmailParams {
  campaignId: string;
  listId: string;
  subject: string;
  htmlContent: string;
  clientId: string;
}

/**
 * Send marketing campaign to all active subscribers
 */
export async function sendMarketingCampaign({
  campaignId,
  listId,
  subject,
  htmlContent,
  clientId,
}: CampaignEmailParams) {
  try {
    // Get all active subscribers
    const subscribers = await prisma.emailSubscriber.findMany({
      where: {
        listId,
        status: 'active',
      },
    });

    if (subscribers.length === 0) {
      return {
        success: false,
        error: 'No active subscribers found',
      };
    }

    // Calculate credits needed (1 credit per 10 emails)
    const creditsNeeded = Math.ceil(subscribers.length / 10);

    // Check client credits
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        subscriptionCredits: true,
        topUpCredits: true,
        isUnlimited: true,
      },
    });

    if (!client) {
      return { success: false, error: 'Client not found' };
    }

    const totalCredits = client.subscriptionCredits + client.topUpCredits;

    if (!client.isUnlimited && totalCredits < creditsNeeded) {
      return {
        success: false,
        error: `Insufficient credits. Need ${creditsNeeded} credits, have ${totalCredits}`,
      };
    }

    // Update campaign status
    await prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'sending',
        recipientCount: subscribers.length,
      },
    });

    let sentCount = 0;
    let failedCount = 0;

    // Send emails in batches
    const batchSize = 50;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      const sendPromises = batch.map(async (subscriber) => {
        try {
          // Personalize email content
          let personalizedContent = htmlContent
            .replace(/\{\{firstName\}\}/g, subscriber.firstName || '')
            .replace(/\{\{lastName\}\}/g, subscriber.lastName || '')
            .replace(/\{\{email\}\}/g, subscriber.email);

          // Add unsubscribe link (TODO: Use hashed token instead of email in URL for security)
          // For production, create a unique token and store it with the subscriber
          const unsubscribeToken = Buffer.from(`${listId}:${subscriber.email}:${Date.now()}`).toString('base64');
          const unsubscribeUrl = `${process.env.NEXTAUTH_URL}/api/unsubscribe/${unsubscribeToken}`;
          personalizedContent += `
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
              <p>Don't want to receive these emails? <a href="${unsubscribeUrl}" style="color: #3b82f6;">Unsubscribe</a></p>
            </div>
          `;

          const result = await sendEmail({
            to: subscriber.email,
            subject,
            html: personalizedContent,
          });

          if (result.success) {
            sentCount++;

            // Create analytics record
            await prisma.marketingCampaignAnalytics.create({
              data: {
                campaignId,
                subscriberId: subscriber.id,
              },
            });

            // Update subscriber stats
            await prisma.emailSubscriber.update({
              where: { id: subscriber.id },
              data: {
                lastEmailSent: new Date(),
              },
            });
          } else {
            failedCount++;
            console.error(`Failed to send to ${subscriber.email}:`, result.error);
          }
        } catch (error) {
          failedCount++;
          console.error(`Error sending to ${subscriber.email}:`, error);
        }
      });

      await Promise.allSettled(sendPromises);
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Deduct credits (only if not unlimited)
    if (!client.isUnlimited) {
      const subscriptionDeduct = Math.min(creditsNeeded, client.subscriptionCredits);
      const topUpDeduct = creditsNeeded - subscriptionDeduct;

      await prisma.client.update({
        where: { id: clientId },
        data: {
          subscriptionCredits: { decrement: subscriptionDeduct },
          topUpCredits: { decrement: topUpDeduct },
          totalCreditsUsed: { increment: creditsNeeded },
        },
      });

      // Log credit transaction
      await prisma.creditTransaction.create({
        data: {
          clientId,
          amount: -creditsNeeded,
          type: 'deduction',
          description: `Email marketing campaign: ${sentCount} emails sent`,
          balanceAfter: totalCredits - creditsNeeded,
        },
      });
    }

    // Update campaign final status
    await prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'sent',
        sentAt: new Date(),
        openedCount: 0,
        clickedCount: 0,
        bouncedCount: failedCount,
        creditsUsed: creditsNeeded,
      },
    });

    return {
      success: true,
      sentCount,
      failedCount,
      creditsUsed: creditsNeeded,
    };
  } catch (error: any) {
    console.error('Error sending marketing campaign:', error);
    
    // Update campaign to failed status
    await prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: { status: 'draft' },
    });

    return {
      success: false,
      error: error.message || 'Failed to send campaign',
    };
  }
}

/**
 * Track email open (via tracking pixel)
 */
export async function trackEmailOpen(campaignId: string, subscriberId: string) {
  try {
    await prisma.marketingCampaignAnalytics.updateMany({
      where: {
        campaignId,
        subscriberId,
        opened: false,
      },
      data: {
        opened: true,
        openedAt: new Date(),
      },
    });

    // Update campaign open count
    await prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: {
        openedCount: { increment: 1 },
      },
    });

    // Update subscriber open count
    await prisma.emailSubscriber.update({
      where: { id: subscriberId },
      data: {
        openCount: { increment: 1 },
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error tracking email open:', error);
    return { success: false };
  }
}

/**
 * Track email click
 */
export async function trackEmailClick(
  campaignId: string,
  subscriberId: string,
  url: string
) {
  try {
    const analytics = await prisma.marketingCampaignAnalytics.findUnique({
      where: {
        campaignId_subscriberId: {
          campaignId,
          subscriberId,
        },
      },
    });

    if (!analytics) {
      return { success: false };
    }

    const clickedUrls = [...(analytics.clickedUrls || []), url];

    await prisma.marketingCampaignAnalytics.update({
      where: {
        campaignId_subscriberId: {
          campaignId,
          subscriberId,
        },
      },
      data: {
        clicked: true,
        clickedAt: new Date(),
        clickedUrls,
      },
    });

    // Update campaign click count (only once per subscriber)
    if (!analytics.clicked) {
      await prisma.marketingCampaign.update({
        where: { id: campaignId },
        data: {
          clickedCount: { increment: 1 },
        },
      });
    }

    // Update subscriber click count
    await prisma.emailSubscriber.update({
      where: { id: subscriberId },
      data: {
        clickCount: { increment: 1 },
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error tracking email click:', error);
    return { success: false };
  }
}

/**
 * Unsubscribe user from list
 */
export async function unsubscribeFromList(listId: string, email: string) {
  try {
    await prisma.emailSubscriber.updateMany({
      where: {
        listId,
        email,
      },
      data: {
        status: 'unsubscribed',
        unsubscribedAt: new Date(),
      },
    });

    // Update list subscriber count
    const count = await prisma.emailSubscriber.count({
      where: {
        listId,
        status: 'active',
      },
    });

    await prisma.emailList.update({
      where: { id: listId },
      data: { subscriberCount: count },
    });

    return { success: true };
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return { success: false };
  }
}
