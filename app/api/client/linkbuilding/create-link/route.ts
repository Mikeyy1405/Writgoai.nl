
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * Create Linkbuilding Link
 * POST /api/client/linkbuilding/create-link
 * 
 * Plaatst een link in een artikel (kost 15 credits)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        linkbuildingEnabled: true,
        subscriptionCredits: true,
        topUpCredits: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    if (!client.linkbuildingEnabled) {
      return NextResponse.json({ 
        error: 'Linkbuilding is niet ingeschakeld voor jouw account' 
      }, { status: 403 });
    }

    const body = await req.json();
    const {
      sourceArticleId,
      targetArticleId,
      targetClientId,
      anchorText,
      placement = 'body',
    } = body;

    if (!sourceArticleId || !targetArticleId || !targetClientId || !anchorText) {
      return NextResponse.json({ 
        error: 'Missende vereiste velden' 
      }, { status: 400 });
    }

    // Check credits (15 credits per link)
    const LINK_COST = 15;
    const availableCredits = client.subscriptionCredits + client.topUpCredits;

    if (availableCredits < LINK_COST) {
      return NextResponse.json({ 
        error: `Onvoldoende credits. Je hebt ${availableCredits} credits, maar er zijn ${LINK_COST} credits nodig.`,
        creditsNeeded: LINK_COST,
        creditsAvailable: availableCredits,
      }, { status: 402 });
    }

    // Haal source artikel op
    const sourceArticle = await prisma.savedContent.findFirst({
      where: {
        id: sourceArticleId,
        clientId: client.id,
      },
      select: {
        id: true,
        title: true,
        publishedUrl: true,
        projectId: true,
      },
    });

    if (!sourceArticle) {
      return NextResponse.json({ error: 'Bron artikel niet gevonden' }, { status: 404 });
    }

    if (!sourceArticle.publishedUrl) {
      return NextResponse.json({ 
        error: 'Bron artikel moet gepubliceerd zijn om links te plaatsen' 
      }, { status: 400 });
    }

    // Haal target artikel op
    const targetArticle = await prisma.savedContent.findFirst({
      where: {
        id: targetArticleId,
        clientId: targetClientId,
      },
      select: {
        id: true,
        title: true,
        publishedUrl: true,
        projectId: true,
      },
    });

    if (!targetArticle) {
      return NextResponse.json({ error: 'Doel artikel niet gevonden' }, { status: 404 });
    }

    if (!targetArticle.publishedUrl) {
      return NextResponse.json({ 
        error: 'Doel artikel moet gepubliceerd zijn' 
      }, { status: 400 });
    }

    // Check of target client linkbuilding enabled heeft
    const targetClient = await prisma.client.findUnique({
      where: { id: targetClientId },
      select: { linkbuildingEnabled: true },
    });

    if (!targetClient?.linkbuildingEnabled) {
      return NextResponse.json({ 
        error: 'Doel client accepteert geen linkbuilding' 
      }, { status: 403 });
    }

    // Check of deze link al bestaat
    const existingLink = await prisma.linkbuildingLink.findFirst({
      where: {
        sourceClientId: client.id,
        sourceArticleId: sourceArticle.id,
        targetArticleId: targetArticle.id,
        status: { not: 'removed' },
      },
    });

    if (existingLink) {
      return NextResponse.json({ 
        error: 'Er bestaat al een link tussen deze artikelen' 
      }, { status: 400 });
    }

    // Maak de link
    const link = await prisma.linkbuildingLink.create({
      data: {
        sourceClientId: client.id,
        sourceArticleId: sourceArticle.id,
        sourceArticleTitle: sourceArticle.title,
        sourceArticleUrl: sourceArticle.publishedUrl,
        sourceProjectId: sourceArticle.projectId,
        
        targetClientId: targetClientId,
        targetArticleId: targetArticle.id,
        targetArticleTitle: targetArticle.title,
        targetArticleUrl: targetArticle.publishedUrl,
        targetProjectId: targetArticle.projectId,
        
        anchorText,
        placement,
        
        creditsCharged: LINK_COST,
        status: 'active',
        isAutomatic: false,
      },
    });

    // Trek credits af
    let remainingCredits = LINK_COST;
    let subscriptionCreditsUsed = 0;
    let topUpCreditsUsed = 0;

    if (client.subscriptionCredits >= remainingCredits) {
      subscriptionCreditsUsed = remainingCredits;
      remainingCredits = 0;
    } else {
      subscriptionCreditsUsed = client.subscriptionCredits;
      remainingCredits -= client.subscriptionCredits;
      topUpCreditsUsed = remainingCredits;
    }

    const newSubscriptionCredits = client.subscriptionCredits - subscriptionCreditsUsed;
    const newTopUpCredits = client.topUpCredits - topUpCreditsUsed;

    await prisma.client.update({
      where: { id: client.id },
      data: {
        subscriptionCredits: newSubscriptionCredits,
        topUpCredits: newTopUpCredits,
        totalCreditsUsed: { increment: LINK_COST },
      },
    });

    // Log credit transaction
    await prisma.creditTransaction.create({
      data: {
        clientId: client.id,
        amount: -LINK_COST,
        type: 'linkbuilding',
        description: `Linkbuilding link geplaatst naar "${targetArticle.title}"`,
        balanceAfter: newSubscriptionCredits + newTopUpCredits,
      },
    });

    // Update link billing status
    await prisma.linkbuildingLink.update({
      where: { id: link.id },
      data: {
        creditsPaid: true,
        billedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Link succesvol geplaatst! (${LINK_COST} credits gebruikt)`,
      link: {
        id: link.id,
        sourceTitle: link.sourceArticleTitle,
        targetTitle: link.targetArticleTitle,
        anchorText: link.anchorText,
        creditsCharged: LINK_COST,
      },
      creditsRemaining: newSubscriptionCredits + newTopUpCredits,
    });

  } catch (error: any) {
    console.error('Create linkbuilding link error:', error);
    return NextResponse.json({
      error: 'Er is een fout opgetreden',
      details: error.message,
    }, { status: 500 });
  }
}
