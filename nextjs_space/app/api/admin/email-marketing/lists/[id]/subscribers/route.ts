/**
 * Email Subscribers API
 * Add, import, and manage subscribers in a list
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify list belongs to client
    const list = await prisma.emailList.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
    });

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    const body = await req.json();
    const { subscribers } = body; // Array of subscriber objects

    if (!Array.isArray(subscribers) || subscribers.length === 0) {
      return NextResponse.json(
        { error: 'Subscribers array is required' },
        { status: 400 }
      );
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validSubscribers = subscribers.filter((sub) =>
      emailRegex.test(sub.email)
    );

    if (validSubscribers.length === 0) {
      return NextResponse.json(
        { error: 'No valid email addresses provided' },
        { status: 400 }
      );
    }

    // Create subscribers (upsert to avoid duplicates)
    const results = {
      added: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const sub of validSubscribers) {
      try {
        const existing = await prisma.emailSubscriber.findUnique({
          where: {
            listId_email: {
              listId: params.id,
              email: sub.email,
            },
          },
        });

        if (existing) {
          // Update existing subscriber
          await prisma.emailSubscriber.update({
            where: {
              listId_email: {
                listId: params.id,
                email: sub.email,
              },
            },
            data: {
              firstName: sub.firstName || existing.firstName,
              lastName: sub.lastName || existing.lastName,
              customFields: sub.customFields || existing.customFields,
              status: sub.status || existing.status,
            },
          });
          results.updated++;
        } else {
          // Create new subscriber
          await prisma.emailSubscriber.create({
            data: {
              listId: params.id,
              email: sub.email,
              firstName: sub.firstName,
              lastName: sub.lastName,
              customFields: sub.customFields,
              status: sub.status || 'active',
              source: sub.source || 'import',
            },
          });
          results.added++;
        }
      } catch (error: any) {
        console.error(`Error adding subscriber ${sub.email}:`, error);
        results.errors.push(`${sub.email}: ${error.message}`);
        results.skipped++;
      }
    }

    // Update subscriber count
    const count = await prisma.emailSubscriber.count({
      where: {
        listId: params.id,
        status: 'active',
      },
    });

    await prisma.emailList.update({
      where: { id: params.id },
      data: { subscriberCount: count },
    });

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('[Email Subscribers] Error adding subscribers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add subscribers' },
      { status: 500 }
    );
  }
}
