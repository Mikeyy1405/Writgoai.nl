
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, phone, companyName, website } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Naam, e-mail en wachtwoord zijn verplicht' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingClient = await prisma.client.findUnique({
      where: { email },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: 'Er bestaat al een account met dit e-mailadres' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create client without subscription
    const client = await prisma.client.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        companyName: companyName || null,
        website: website || null,
        isActive: true,
      },
    });

    // Send welcome email (non-blocking - don't wait for it)
    sendWelcomeEmail({
      to: client.email,
      name: client.name,
      email: client.email,
    }).catch((error) => {
      // Log error but don't fail registration
      console.error('Failed to send welcome email:', error);
    });

    // Start AI onboarding in background if website is provided
    if (website) {
      fetch(`${process.env.NEXTAUTH_URL || 'https://writgoai.abacusai.app'}/api/client/ai-onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          clientId: client.id,
          website,
          companyName: companyName || name,
        }),
      }).catch((error) => {
        console.error('Failed to start AI onboarding:', error);
      });
    }

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
      },
      aiOnboardingStarted: !!website,
    });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het aanmaken van je account' },
      { status: 500 }
    );
  }
}
