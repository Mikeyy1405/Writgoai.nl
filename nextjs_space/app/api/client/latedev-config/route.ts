

export const dynamic = "force-dynamic";
/**
 * 💼 Late.dev Configuration API
 * 
 * Manage Late.dev social media connection settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import fs from 'fs';
import path from 'path';


// Load Late.dev API key from secrets
function getLateDevApiKey(): string | null {
  try {
    const secretsPath = path.join(process.env.HOME || '/home/ubuntu', '.config', 'abacusai_auth_secrets.json');
    if (fs.existsSync(secretsPath)) {
      const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf-8'));
      return secrets?.['late.dev']?.secrets?.api_key?.value || null;
    }
  } catch (error) {
    console.error('Failed to load Late.dev API key:', error);
  }
  return null;
}

// Get Late.dev config and connected accounts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { id: session.user.id },
      include: {
        lateDevAccounts: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      config: {
        connected: client.lateDevAccounts.length > 0,
        accounts: client.lateDevAccounts.map((acc: any) => ({
          id: acc.id,
          platform: acc.platform,
          name: acc.username || acc.platform,
          accountId: acc.accountId,
        })),
        profileInfo: {
          email: session.user.email || client.email,
          name: session.user.name || client.name,
        },
      },
    });

  } catch (error: any) {
    console.error('Get Late.dev config error:', error);
    await prisma.$disconnect();
    
    return NextResponse.json(
      { error: 'Kon Late.dev configuratie niet ophalen', details: error.message },
      { status: 500 }
    );
  }
}

// Sync Late.dev accounts using Writgo's API key
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use Writgo's Late.dev API key from secrets
    const apiKey = getLateDevApiKey();
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Late.dev API key niet geconfigureerd. Neem contact op met support.' },
        { status: 500 }
      );
    }

    // Fetch connected accounts from Late.dev API
    try {
      const accountsRes = await fetch('https://api.late.dev/v1/accounts', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!accountsRes.ok) {
        throw new Error('Failed to fetch accounts from Late.dev');
      }

      const accountsData = await accountsRes.json();
      
      // Clear existing accounts
      await prisma.lateDevAccount.deleteMany({
        where: { clientId: session.user.id },
      });

      // Save new accounts
      if (accountsData.data && Array.isArray(accountsData.data)) {
        for (const account of accountsData.data) {
          await prisma.lateDevAccount.create({
            data: {
              clientId: session.user.id,
              lateDevProfileId: account.id,
              platform: account.platform || 'unknown',
              username: account.username || account.name,
              displayName: account.displayName || account.name,
              avatar: account.avatar_url,
              isActive: true,
              connectedAt: new Date(),
            },
          });
        }
      }

      // Get updated accounts
      const client = await prisma.client.findUnique({
        where: { id: session.user.id },
        include: {
          lateDevAccounts: true,
        },
      });

      await prisma.$disconnect();

      return NextResponse.json({
        success: true,
        message: 'Late.dev accounts gesynchroniseerd',
        config: {
          isActive: true,
          accounts: client?.lateDevAccounts.map((acc: any) => ({
            id: acc.id,
            platform: acc.platform,
            name: acc.username || acc.platform,
            accountId: acc.accountId,
          })) || [],
          profileInfo: {
            email: session.user.email || client?.email,
            name: session.user.name || client?.name,
          },
        },
      });

    } catch (fetchError: any) {
      console.error('Failed to fetch Late.dev accounts:', fetchError);
      await prisma.$disconnect();
      
      return NextResponse.json(
        { error: 'Kon accounts niet ophalen van Late.dev.', details: fetchError.message },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Sync Late.dev config error:', error);
    await prisma.$disconnect();
    
    return NextResponse.json(
      { error: 'Kon Late.dev accounts niet synchroniseren', details: error.message },
      { status: 500 }
    );
  }
}

// Delete Late.dev config (disconnect accounts for this user only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all connected accounts for this user only
    await prisma.lateDevAccount.deleteMany({
      where: { clientId: session.user.id },
    });

    // NOTE: We don't remove the Writgo API key from secrets file
    // because it's shared across all users

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Late.dev accounts ontkoppeld',
    });

  } catch (error: any) {
    console.error('Delete Late.dev config error:', error);
    await prisma.$disconnect();
    
    return NextResponse.json(
      { error: 'Kon Late.dev accounts niet ontkoppelen', details: error.message },
      { status: 500 }
    );
  }
}
