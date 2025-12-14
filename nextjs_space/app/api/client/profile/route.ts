import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
import { getAuthenticatedClient, isAuthError } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';


export async function GET() {
  try {
    const auth = await getAuthenticatedClient();
    
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    // Use client.id (from Client table), NOT session.user.id
    const clientId = auth.client.id;
    
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        website: true,
        automationActive: true,
        automationStartDate: true,
        targetAudience: true,
        brandVoice: true,
        keywords: true,
        wordpressUrl: true,
        wordpressUsername: true,
        wordpressPassword: true,
        wordpressSitemap: true,
        contentPlan: true,
        lastPlanGenerated: true,
        lateDevProfileId: true,
        // Credit informatie
        subscriptionCredits: true,
        topUpCredits: true,
        isUnlimited: true,
        totalCreditsUsed: true,
        totalCreditsPurchased: true
      }
    });
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Content plan is already stored as JSON in client
    const contentPlanArray = Array.isArray(client.contentPlan) ? client.contentPlan : [];
    
    // Bereken totaal credits
    const totalCredits = client.subscriptionCredits + client.topUpCredits;
    
    return NextResponse.json({
      client: {
        ...client,
        // Don't send actual password, just indicate if it's set
        wordpressPassword: client.wordpressPassword ? 'SET' : null,
        contentPlan: contentPlanArray,
        // Totaal credits voor backwards compatibility
        credits: totalCredits
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}
