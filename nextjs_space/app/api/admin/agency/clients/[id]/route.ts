import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// GET single client
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            websiteUrl: true,
            isActive: true,
          }
        },
        assignments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        clientRequests: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            assignments: true,
            invoices: true,
            clientRequests: true,
            projects: true,
            savedContent: true,
          }
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Klant niet gevonden' }, { status: 404 });
    }

    // Remove password from response
    const { password, ...clientData } = client;

    return NextResponse.json(clientData);
  } catch (error: any) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Kon klant niet ophalen' }, { status: 500 });
  }
}

// PUT update client
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, companyName, website, password } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (website !== undefined) updateData.website = website;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const client = await prisma.client.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        website: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({ client });
  } catch (error: any) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Kon klant niet bijwerken' }, { status: 500 });
  }
}

// DELETE client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    await prisma.client.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Kon klant niet verwijderen' }, { status: 500 });
  }
}
