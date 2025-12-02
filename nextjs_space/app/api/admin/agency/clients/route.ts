import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET all clients for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    // Check if admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        website: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionCredits: true,
        topUpCredits: true,
        totalCreditsUsed: true,
        totalCreditsPurchased: true,
        isUnlimited: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            assignments: true,
            invoices: true,
            clientRequests: true,
            projects: true,
            savedContent: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ clients });
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Kon klanten niet ophalen' }, { status: 500 });
  }
}

// POST create new client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, companyName, website, password } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Naam en email zijn verplicht' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await prisma.client.findUnique({
      where: { email }
    });

    if (existing) {
      return NextResponse.json({ error: 'Email is al in gebruik' }, { status: 400 });
    }

    // Generate password if not provided
    const finalPassword = password || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    const client = await prisma.client.create({
      data: {
        name,
        email,
        companyName: companyName || null,
        website: website || null,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        website: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ 
      client,
      generatedPassword: password ? undefined : finalPassword 
    });
  } catch (error: any) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Kon klant niet aanmaken' }, { status: 500 });
  }
}
