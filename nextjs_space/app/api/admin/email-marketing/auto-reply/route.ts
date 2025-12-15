/**
 * Auto-Reply Configuration API
 * Manage auto-reply settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const configs = await prisma.emailAutoReplyConfig.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ configs });
  } catch (error: any) {
    console.error('[Auto-Reply] Error fetching configs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch auto-reply configs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      mailboxId,
      isActive,
      businessHoursOnly,
      businessHoursStart,
      businessHoursEnd,
      businessDays,
      allowedCategories,
      excludedSenders,
      tone,
      includeSignature,
      signature,
      replyTemplate,
    } = body;

    // Create auto-reply config
    const config = await prisma.emailAutoReplyConfig.create({
      data: {
        clientId: client.id,
        mailboxId,
        isActive: isActive !== undefined ? isActive : false,
        businessHoursOnly: businessHoursOnly || false,
        businessHoursStart,
        businessHoursEnd,
        businessDays: businessDays || [1, 2, 3, 4, 5], // Mon-Fri
        allowedCategories: allowedCategories || [],
        excludedSenders: excludedSenders || [],
        tone: tone || 'professional',
        includeSignature: includeSignature !== undefined ? includeSignature : true,
        signature,
        replyTemplate,
      },
    });

    return NextResponse.json({ config }, { status: 201 });
  } catch (error: any) {
    console.error('[Auto-Reply] Error creating config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create auto-reply config' },
      { status: 500 }
    );
  }
}
