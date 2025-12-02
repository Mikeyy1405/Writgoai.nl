

export const dynamic = "force-dynamic";
/**
 * 🗑️ GDPR Data Deletion Endpoint
 * 
 * Artikel 17 - Recht op vergetelheid
 * Klanten kunnen hun account en alle data permanent verwijderen
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { log } from '@/lib/logger';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover'
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'client') {
      return NextResponse.json(
        { error: 'Ongeautoriseerd' },
        { status: 401 }
      );
    }

    const clientId = session.user.id;
    const body = await request.json();
    const { confirmEmail, password } = body;

    // Haal client data op
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        email: true,
        password: true,
        subscriptionId: true,
        subscriptionStatus: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Account niet gevonden' },
        { status: 404 }
      );
    }

    // Verificatie: Email moet matchen
    if (client.email !== confirmEmail) {
      return NextResponse.json(
        { error: 'Email komt niet overeen' },
        { status: 400 }
      );
    }

    // Verificatie: Wachtwoord moet kloppen
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, client.password);

    if (!isPasswordValid) {
      log('warn', 'GDPR deletion attempt with wrong password', {
        clientId,
        email: client.email,
      });

      return NextResponse.json(
        { error: 'Ongeldig wachtwoord' },
        { status: 401 }
      );
    }

    // ═══════════════════════════════════════════════════════
    // STAP 1: Annuleer actief Stripe abonnement
    // ═══════════════════════════════════════════════════════

    if (client.subscriptionId && stripe) {
      try {
        await stripe.subscriptions.cancel(client.subscriptionId);
        log('info', 'Stripe subscription cancelled for GDPR deletion', {
          clientId,
          subscriptionId: client.subscriptionId,
        });
      } catch (error) {
        console.error('Failed to cancel Stripe subscription:', error);
        // Continue anyway - Stripe kan al geannuleerd zijn
      }
    }

    // ═══════════════════════════════════════════════════════
    // STAP 2: Verwijder alle data (Cascade delete via Prisma)
    // ═══════════════════════════════════════════════════════

    // Prisma verwijdert automatisch alle gerelateerde data via onDelete: Cascade
    await prisma.client.delete({
      where: { id: clientId },
    });

    // Log de verwijdering (voor audit trail)
    log('info', 'GDPR account deletion completed', {
      clientId,
      email: client.email,
      deletedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Uw account en alle data zijn permanent verwijderd',
      deletedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('GDPR deletion error:', error);
    log('error', 'GDPR deletion failed', { error: error.message });

    return NextResponse.json(
      { error: 'Verwijdering mislukt', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint voor deletion confirmation page info
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

    // Haal client info op voor weergave
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        email: true,
        name: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        createdAt: true,
        _count: {
          select: {
            contentPieces: true,
            conversations: true,
            videos: true,
            creditTransactions: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Account niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      email: client.email,
      name: client.name,
      accountAge: Math.floor(
        (Date.now() - client.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      ),
      subscription: client.subscriptionPlan || 'geen',
      dataToDelete: {
        contentPieces: client._count.contentPieces,
        conversations: client._count.conversations,
        videos: client._count.videos,
        transactions: client._count.creditTransactions,
      },
      warning:
        'Deze actie kan niet ongedaan gemaakt worden. Alle data wordt permanent verwijderd.',
    });
  } catch (error: any) {
    console.error('Error fetching deletion info:', error);
    return NextResponse.json(
      { error: 'Ophalen info mislukt' },
      { status: 500 }
    );
  }
}
