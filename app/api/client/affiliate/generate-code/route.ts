
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * Generate Affiliate Code
 * POST /api/client/affiliate/generate-code
 * 
 * Genereert een unieke affiliate code voor de client
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        affiliateCode: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Als client al een code heeft, return die
    if (client.affiliateCode) {
      return NextResponse.json({
        success: true,
        affiliateCode: client.affiliateCode,
        affiliateUrl: `https://WritgoAI.nl/registreren?ref=${client.affiliateCode}`,
        message: 'Je affiliate code is al actief',
      });
    }

    // Genereer een unieke code gebaseerd op naam + random
    const generateCode = (name: string, attempt: number = 0): string => {
      const cleanName = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 8);
      
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      return `${cleanName}${randomSuffix}${attempt > 0 ? attempt : ''}`.toUpperCase();
    };

    let affiliateCode = '';
    let attempt = 0;
    let isUnique = false;

    // Probeer maximaal 10 keer een unieke code te vinden
    while (!isUnique && attempt < 10) {
      affiliateCode = generateCode(client.name || client.email, attempt);
      
      const existing = await prisma.client.findFirst({
        where: { affiliateCode },
      });

      if (!existing) {
        isUnique = true;
      } else {
        attempt++;
      }
    }

    if (!isUnique) {
      return NextResponse.json({ 
        error: 'Kon geen unieke affiliate code genereren. Probeer het later opnieuw.' 
      }, { status: 500 });
    }

    // Update client met nieuwe affiliate code
    await prisma.client.update({
      where: { id: client.id },
      data: { affiliateCode },
    });

    return NextResponse.json({
      success: true,
      affiliateCode,
      affiliateUrl: `https://WritgoAI.nl/registreren?ref=${affiliateCode}`,
      message: 'Affiliate code succesvol gegenereerd!',
    });

  } catch (error: any) {
    console.error('Generate affiliate code error:', error);
    return NextResponse.json({
      error: 'Er is een fout opgetreden',
      details: error.message,
    }, { status: 500 });
  }
}
