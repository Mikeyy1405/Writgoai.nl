

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { verifyWordPressConnection } from '@/lib/wordpress-publisher';

// GET - Haal WordPress instellingen op
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: {
        wordpressUrl: true,
        wordpressUsername: true,
        wordpressPassword: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({
      wordpressUrl: client.wordpressUrl || '',
      wordpressUsername: client.wordpressUsername || '',
      // Don't send the actual password for security
      hasPassword: !!client.wordpressPassword,
    });
  } catch (error) {
    console.error('Error fetching WordPress settings:', error);
    return NextResponse.json(
      { error: 'Fout bij ophalen WordPress instellingen' },
      { status: 500 }
    );
  }
}

// POST - Update WordPress instellingen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await request.json();
    const { wordpressUrl, wordpressUsername, wordpressPassword, testConnection } = body;

    // Validate required fields
    if (!wordpressUrl || !wordpressUsername) {
      return NextResponse.json(
        { error: 'WordPress URL en gebruikersnaam zijn verplicht' },
        { status: 400 }
      );
    }

    // Clean up the URL (remove trailing slashes)
    const cleanUrl = wordpressUrl.replace(/\/+$/, '');

    // Validate URL format
    try {
      new URL(cleanUrl);
    } catch {
      return NextResponse.json(
        { error: 'Ongeldige WordPress URL. Gebruik het volledige adres (bijv. https://jouwsite.nl)' },
        { status: 400 }
      );
    }

    // If testing connection, verify credentials
    if (testConnection && wordpressPassword) {
      const config = {
        siteUrl: cleanUrl,
        username: wordpressUsername,
        applicationPassword: wordpressPassword,
      };

      const isValid = await verifyWordPressConnection(config);

      if (!isValid) {
        return NextResponse.json(
          { 
            error: 'Kan geen verbinding maken met WordPress. Controleer je URL, gebruikersnaam en Application Password.',
            success: false 
          },
          { status: 400 }
        );
      }

      // Connection successful, save the credentials
      await prisma.client.update({
        where: { email: session.user.email },
        data: {
          wordpressUrl: cleanUrl,
          wordpressUsername,
          wordpressPassword,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'WordPress verbinding succesvol getest en opgeslagen! ✓',
        wordpressUrl: cleanUrl,
      });
    }

    // Just save without testing (password might not be provided if only updating URL/username)
    const updateData: any = {
      wordpressUrl: cleanUrl,
      wordpressUsername,
    };

    // Only update password if provided
    if (wordpressPassword) {
      updateData.wordpressPassword = wordpressPassword;
    }

    await prisma.client.update({
      where: { email: session.user.email },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'WordPress instellingen opgeslagen',
      wordpressUrl: cleanUrl,
    });
  } catch (error) {
    console.error('Error updating WordPress settings:', error);
    return NextResponse.json(
      { error: 'Fout bij opslaan WordPress instellingen' },
      { status: 500 }
    );
  }
}

// DELETE - Verwijder WordPress instellingen
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    await prisma.client.update({
      where: { email: session.user.email },
      data: {
        wordpressUrl: null,
        wordpressUsername: null,
        wordpressPassword: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'WordPress koppeling verwijderd',
    });
  } catch (error) {
    console.error('Error deleting WordPress settings:', error);
    return NextResponse.json(
      { error: 'Fout bij verwijderen WordPress koppeling' },
      { status: 500 }
    );
  }
}
