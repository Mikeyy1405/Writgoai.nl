
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// GET /api/clients - Get all clients (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clients = await prisma.client.findMany({
      include: {
        ClientSubscription: {
          include: {
            Package: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create a new client with subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      email, 
      password, 
      phone, 
      companyName, 
      website,
      packageId 
    } = body;

    // Validate required fields
    if (!name || !email || !password || !packageId) {
      return NextResponse.json(
        { error: 'Name, email, password, and package are required' },
        { status: 400 }
      );
    }

    // Check if client already exists
    const existingClient = await prisma.client.findUnique({
      where: { email }
    });

    if (existingClient) {
      return NextResponse.json(
        { error: 'A client with this email already exists' },
        { status: 400 }
      );
    }

    // Verify package exists
    const subscriptionPackage = await prisma.subscriptionPackage.findUnique({
      where: { id: packageId }
    });

    if (!subscriptionPackage) {
      return NextResponse.json(
        { error: 'Invalid subscription package' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Calculate next billing date (30 days from now)
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + 30);

    // Create client with subscription in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create client
      const client = await tx.client.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone: phone || null,
          companyName: companyName || null,
          website: website || null,
          isActive: true
        }
      });

      // Create subscription
      const subscription = await tx.clientSubscription.create({
        data: {
          clientId: client.id,
          packageId: packageId,
          status: 'ACTIVE',
          startDate: new Date(),
          nextBillingDate: nextBillingDate,
          articlesUsed: 0,
          reelsUsed: 0
        },
        include: {
          Package: true
        }
      });

      return { client, subscription };
    });

    return NextResponse.json({
      message: 'Client created successfully',
      client: {
        id: result.client.id,
        name: result.client.name,
        email: result.client.email
      },
      subscription: result.subscription
    });
  } catch (error: any) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create client' },
      { status: 500 }
    );
  }
}
