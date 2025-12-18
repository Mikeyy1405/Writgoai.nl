import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/simplified/account
 * Haal account informatie op voor de ingelogde gebruiker
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Je moet ingelogd zijn' },
        { status: 401 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        website: true,
        // Account settings
        automationActive: true,
        automationStartDate: true,
        targetAudience: true,
        brandVoice: true,
        keywords: true,
        // Credit informatie
        subscriptionCredits: true,
        topUpCredits: true,
        isUnlimited: true,
        totalCreditsUsed: true,
        totalCreditsPurchased: true,
        // Timestamps
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found', message: 'Gebruiker niet gevonden' },
        { status: 404 }
      );
    }

    // Bereken totaal beschikbare credits
    const totalCredits = client.subscriptionCredits + client.topUpCredits;

    return NextResponse.json({
      success: true,
      data: {
        ...client,
        totalCredits,
      },
    });
  } catch (error) {
    console.error('[Account API] Error fetching account:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        error: 'Failed to fetch account',
        message: 'Er is een fout opgetreden bij het ophalen van je account informatie',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/simplified/account
 * Update account informatie
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Je moet ingelogd zijn' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, companyName, website, targetAudience, brandVoice, keywords } = body;

    // Validate input
    if (name && typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input', message: 'Naam moet een tekst zijn' },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found', message: 'Gebruiker niet gevonden' },
        { status: 404 }
      );
    }

    // Update only provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (website !== undefined) updateData.website = website;
    if (targetAudience !== undefined) updateData.targetAudience = targetAudience;
    if (brandVoice !== undefined) updateData.brandVoice = brandVoice;
    if (keywords !== undefined) updateData.keywords = keywords;

    const updatedClient = await prisma.client.update({
      where: { id: client.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        website: true,
        targetAudience: true,
        brandVoice: true,
        keywords: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account succesvol bijgewerkt',
      data: updatedClient,
    });
  } catch (error) {
    console.error('[Account API] Error updating account:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        error: 'Failed to update account',
        message: 'Er is een fout opgetreden bij het bijwerken van je account',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
