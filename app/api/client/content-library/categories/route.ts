

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Ophalen van alle categorieën
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const categories = await prisma.contentCategory.findMany({
      where: { clientId: client.id },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het ophalen van categorieën' },
      { status: 500 }
    );
  }
}

// POST - Nieuwe categorie maken
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const { name, description, color, icon } = await req.json();

    const category = await prisma.contentCategory.create({
      data: {
        clientId: client.id,
        name,
        description,
        color,
        icon,
      },
    });

    return NextResponse.json({ category });
  } catch (error: any) {
    console.error('Error creating category:', error);
    
    // Check for unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Deze categorienaam bestaat al' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Er ging iets mis bij het maken van de categorie' },
      { status: 500 }
    );
  }
}
