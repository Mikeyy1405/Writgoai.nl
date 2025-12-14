/**
 * Debug endpoint to check user/client mapping
 * 
 * Shows the difference between session.user.id and client.id
 * to help diagnose data isolation issues.
 * 
 * Only accessible in development or for admin users.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet ingelogd' }, 
        { status: 401 }
      );
    }

    // Check if user is admin (only admins should access this in production)
    if (process.env.NODE_ENV === 'production' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Alleen beschikbaar voor admins' }, 
        { status: 403 }
      );
    }

    // Get client record
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionCredits: true,
        topUpCredits: true,
        createdAt: true,
      }
    });

    // Get user record (if exists)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      }
    });

    // Get projects count for this client
    const projectCount = client ? await prisma.project.count({
      where: { clientId: client.id }
    }) : 0;

    // Get projects list for this client
    const projects = client ? await prisma.project.findMany({
      where: { clientId: client.id },
      select: {
        id: true,
        name: true,
        websiteUrl: true,
        createdAt: true,
        isPrimary: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }) : [];

    return NextResponse.json({
      warning: '⚠️ Dit is een debug endpoint. Gebruik alleen voor troubleshooting.',
      session: {
        userId: session.user.id,
        userEmail: session.user.email,
        userName: session.user.name,
        userRole: session.user.role,
      },
      client: client ? {
        id: client.id,
        email: client.email,
        name: client.name,
        credits: {
          subscription: client.subscriptionCredits,
          topUp: client.topUpCredits,
          total: client.subscriptionCredits + client.topUpCredits,
        },
        createdAt: client.createdAt,
      } : null,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      } : null,
      comparison: {
        sessionUserIdMatchesClientId: session.user.id === client?.id,
        sessionUserIdMatchesUserId: session.user.id === user?.id,
        explanation: session.user.id === client?.id 
          ? '✅ session.user.id komt uit Client tabel'
          : session.user.id === user?.id
          ? '⚠️ session.user.id komt uit User tabel (admin), NIET Client tabel!'
          : '❌ session.user.id matcht GEEN van beide!',
      },
      projects: {
        count: projectCount,
        list: projects,
        note: `Projecten gekoppeld aan clientId: ${client?.id || 'N/A'}`,
      },
      recommendation: session.user.id !== client?.id
        ? '🔧 API endpoints moeten client.id gebruiken (via email lookup), NIET session.user.id!'
        : '✅ Voor deze gebruiker werken beide, maar gebruik altijd client.id via email lookup voor consistentie.',
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch debug info',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
