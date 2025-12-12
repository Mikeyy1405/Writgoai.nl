import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';
import { encrypt, decrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/settings/social
 * Fetch social media settings for the current user
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check if lateDevApiKey exists and decrypt it
    let lateDevApiKey = '';
    let connected = false;

    if (client.lateDevApiKey) {
      try {
        lateDevApiKey = decrypt(client.lateDevApiKey);
        connected = true;
      } catch (error) {
        console.error('Failed to decrypt API key:', error);
      }
    }

    return NextResponse.json({
      lateDevApiKey: lateDevApiKey ? '••••••••' : '', // Mask the API key
      connected
    });
  } catch (error) {
    console.error('Failed to fetch social media settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/social
 * Update social media settings for the current user
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const data = await request.json();

    if (!data.lateDevApiKey) {
      return NextResponse.json(
        { error: 'Late.dev API key is required' },
        { status: 400 }
      );
    }

    // Encrypt the API key
    const encryptedApiKey = encrypt(data.lateDevApiKey);

    // Update client with encrypted API key
    await prisma.client.update({
      where: { id: client.id },
      data: {
        lateDevApiKey: encryptedApiKey
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Social media settings saved successfully'
    });
  } catch (error) {
    console.error('Failed to update social media settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/settings/social
 * Remove social media settings for the current user
 */
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Remove API key
    await prisma.client.update({
      where: { id: client.id },
      data: {
        lateDevApiKey: null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Social media settings removed successfully'
    });
  } catch (error) {
    console.error('Failed to remove social media settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
