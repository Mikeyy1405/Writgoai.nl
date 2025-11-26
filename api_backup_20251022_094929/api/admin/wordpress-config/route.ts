
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { verifyWordPressConnection } from '@/lib/wordpress-publisher';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, siteUrl, username, applicationPassword } = body;

    if (!clientId || !siteUrl || !username || !applicationPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Verify connection
    const isValid = await verifyWordPressConnection({
      siteUrl,
      username,
      applicationPassword,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid WordPress credentials or API not accessible' },
        { status: 400 }
      );
    }

    // Sla config op
    const config = await prisma.wordPressConfig.upsert({
      where: { clientId },
      create: {
        clientId,
        siteUrl,
        username,
        applicationPassword,
        verified: true,
        lastSyncAt: new Date(),
      },
      update: {
        siteUrl,
        username,
        applicationPassword,
        verified: true,
        lastSyncAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'WordPress connection configured successfully',
      config: {
        id: config.id,
        siteUrl: config.siteUrl,
        username: config.username,
        verified: config.verified,
      },
    });
  } catch (error) {
    console.error('Error configuring WordPress:', error);
    return NextResponse.json(
      { error: 'Failed to configure WordPress' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const config = await prisma.wordPressConfig.findUnique({
      where: { clientId },
      select: {
        id: true,
        siteUrl: true,
        username: true,
        verified: true,
        lastSyncAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!config) {
      return NextResponse.json(
        { error: 'WordPress not configured for this client' },
        { status: 404 }
      );
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching WordPress config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch WordPress config' },
      { status: 500 }
    );
  }
}
