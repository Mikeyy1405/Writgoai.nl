

export const dynamic = "force-dynamic";
/**
 * 💼 WordPress Configuration API
 * 
 * Manage WordPress connection settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { publishToWordPress } from '@/lib/wordpress-publisher';
import { prisma } from '@/lib/db';


// Get WordPress config
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { id: session.user.id },
      select: {
        wordpressUrl: true,
        wordpressUsername: true,
        wordpressPassword: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      config: {
        url: client.wordpressUrl || '',
        username: client.wordpressUsername || '',
        hasPassword: !!client.wordpressPassword,
      },
    });

  } catch (error: any) {
    console.error('Get WordPress config error:', error);
    await prisma.$disconnect();
    
    return NextResponse.json(
      { error: 'Kon WordPress configuratie niet ophalen', details: error.message },
      { status: 500 }
    );
  }
}

// Update WordPress config
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, username, password } = body;

    if (!url || !username) {
      return NextResponse.json(
        { error: 'URL en username zijn verplicht' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Ongeldige URL format' },
        { status: 400 }
      );
    }

    // Update client
    const updateData: any = {
      wordpressUrl: url,
      wordpressUsername: username,
    };

    // Only update password if provided (allow updating URL/username without changing password)
    if (password) {
      updateData.wordpressPassword = password;
    }

    const client = await prisma.client.update({
      where: { id: session.user.id },
      data: updateData,
    });

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'WordPress configuratie opgeslagen',
      config: {
        url: client.wordpressUrl,
        username: client.wordpressUsername,
        connected: true,
      },
    });

  } catch (error: any) {
    console.error('Update WordPress config error:', error);
    await prisma.$disconnect();
    
    return NextResponse.json(
      { error: 'Kon WordPress configuratie niet opslaan', details: error.message },
      { status: 500 }
    );
  }
}

// Delete WordPress config
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.client.update({
      where: { id: session.user.id },
      data: {
        wordpressUrl: null,
        wordpressUsername: null,
        wordpressPassword: null,
      },
    });

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'WordPress configuratie verwijderd',
    });

  } catch (error: any) {
    console.error('Delete WordPress config error:', error);
    await prisma.$disconnect();
    
    return NextResponse.json(
      { error: 'Kon WordPress configuratie niet verwijderen', details: error.message },
      { status: 500 }
    );
  }
}

// Publish to WordPress
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, title, content, excerpt, status, featuredImageUrl } = body;

    if (action !== 'publish') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Titel en content zijn verplicht' },
        { status: 400 }
      );
    }

    // Get WordPress config
    const client = await prisma.client.findUnique({
      where: { id: session.user.id },
      select: {
        wordpressUrl: true,
        wordpressUsername: true,
        wordpressPassword: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    if (!client.wordpressUrl || !client.wordpressUsername || !client.wordpressPassword) {
      return NextResponse.json(
        { error: 'WordPress is nog niet geconfigureerd' },
        { status: 400 }
      );
    }

    // Publish to WordPress
    const result = await publishToWordPress(
      {
        siteUrl: client.wordpressUrl,
        username: client.wordpressUsername,
        applicationPassword: client.wordpressPassword,
      },
      {
        title,
        content,
        excerpt: excerpt || '',
        status: status || 'draft',
        featuredImageUrl: featuredImageUrl || undefined, // Include featured image URL
      }
    );

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Blog succesvol gepubliceerd',
      postId: result.id,
      link: result.link,
      status: result.status,
    });

  } catch (error: any) {
    console.error('Publish to WordPress error:', error);
    await prisma.$disconnect();
    
    return NextResponse.json(
      { error: 'Kon niet publiceren naar WordPress', details: error.message },
      { status: 500 }
    );
  }
}
