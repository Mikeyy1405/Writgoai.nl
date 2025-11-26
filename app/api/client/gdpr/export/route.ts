

export const dynamic = "force-dynamic";
/**
 * 🔒 GDPR Data Export Endpoint
 * 
 * Artikel 15 - Recht op inzage
 * Klanten kunnen al hun data downloaden in JSON formaat
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { log } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'client') {
      return NextResponse.json(
        { error: 'Ongeautoriseerd' },
        { status: 401 }
      );
    }

    const clientId = session.user.id;

    // Haal ALLE data op van deze client
    const clientData = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        contentPieces: true,
        conversations: {
          include: {
            messages: true,
          },
        },
        videos: true,
        lateDevAccounts: true,
        creditTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 500, // Laatste 500 transacties
        },
        creditPurchases: {
          orderBy: { createdAt: 'desc' },
        },
        aiSettings: true,
      },
    });

    if (!clientData) {
      return NextResponse.json(
        { error: 'Geen data gevonden' },
        { status: 404 }
      );
    }

    // Verwijder gevoelige velden
    const sanitizedData = {
      ...clientData,
      password: '[VERWIJDERD]', // Wachtwoord nooit exporteren
      wordpressPassword: clientData.wordpressPassword ? '[VERSLEUTELD]' : null,
      youtubeAccessToken: clientData.youtubeAccessToken ? '[VERSLEUTELD]' : null,
      youtubeRefreshToken: clientData.youtubeRefreshToken ? '[VERSLEUTELD]' : null,
      tiktokAccessToken: clientData.tiktokAccessToken ? '[VERSLEUTELD]' : null,
      tiktokRefreshToken: clientData.tiktokRefreshToken ? '[VERSLEUTELD]' : null,
      facebookAccessToken: clientData.facebookAccessToken ? '[VERSLEUTELD]' : null,
      instagramAccessToken: clientData.instagramAccessToken ? '[VERSLEUTELD]' : null,
    };

    // Metadata over export
    const exportMetadata = {
      exportDate: new Date().toISOString(),
      clientId: clientData.id,
      email: clientData.email,
      accountCreated: clientData.createdAt.toISOString(),
      totalConversations: clientData.conversations.length,
      totalMessages: clientData.conversations.reduce((sum: any, conv: any) => sum + conv.messages.length, 0),
      totalContentPieces: clientData.contentPieces.length,
      totalVideos: clientData.videos.length,
      totalCreditTransactions: clientData.creditTransactions.length,
      gdprCompliant: true,
    };

    const fullExport = {
      metadata: exportMetadata,
      personalData: {
        name: sanitizedData.name,
        email: sanitizedData.email,
        companyName: sanitizedData.companyName,
        website: sanitizedData.website,
      },
      subscriptionData: {
        subscriptionPlan: sanitizedData.subscriptionPlan,
        subscriptionStatus: sanitizedData.subscriptionStatus,
        subscriptionStartDate: sanitizedData.subscriptionStartDate,
        subscriptionEndDate: sanitizedData.subscriptionEndDate,
        monthlyCredits: sanitizedData.monthlyCredits,
        subscriptionCredits: sanitizedData.subscriptionCredits,
        topUpCredits: sanitizedData.topUpCredits,
        totalCreditsUsed: sanitizedData.totalCreditsUsed,
        totalCreditsPurchased: sanitizedData.totalCreditsPurchased,
      },
      automationSettings: {
        automationActive: sanitizedData.automationActive,
        automationStartDate: sanitizedData.automationStartDate,
        targetAudience: sanitizedData.targetAudience,
        brandVoice: sanitizedData.brandVoice,
        keywords: sanitizedData.keywords,
      },
      integrations: {
        wordpress: {
          url: sanitizedData.wordpressUrl,
          username: sanitizedData.wordpressUsername,
          connected: !!sanitizedData.wordpressUrl,
        },
        socialMedia: {
          lateDevAccounts: sanitizedData.lateDevAccounts,
          youtubeConnected: sanitizedData.youtubeConnected,
          tiktokConnected: sanitizedData.tiktokConnected,
          facebookConnected: sanitizedData.facebookConnected,
          instagramConnected: sanitizedData.instagramConnected,
        },
      },
      content: sanitizedData.contentPieces,
      conversations: sanitizedData.conversations,
      videos: sanitizedData.videos,
      creditHistory: sanitizedData.creditTransactions,
      purchases: sanitizedData.creditPurchases,
      aiSettings: sanitizedData.aiSettings,
    };

    // Log de export
    log('info', 'GDPR data export', { clientId, email: clientData.email });

    // Return als downloadable JSON
    const filename = `writgoai-data-export-${clientData.email}-${Date.now()}.json`;

    return new NextResponse(JSON.stringify(fullExport, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('GDPR export error:', error);
    return NextResponse.json(
      { error: 'Export mislukt', details: error.message },
      { status: 500 }
    );
  }
}
