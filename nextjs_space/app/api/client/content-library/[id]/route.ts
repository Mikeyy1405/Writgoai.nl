

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Ophalen van specifiek content item
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const content = await prisma.savedContent.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            websiteUrl: true,
          },
        },
      },
    });

    if (!content) {
      return NextResponse.json({ error: 'Content niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het ophalen van content' },
      { status: 500 }
    );
  }
}

// PATCH - Update content
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const data = await req.json();

    // Check if content exists and belongs to client
    const existing = await prisma.savedContent.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Content niet gevonden' }, { status: 404 });
    }

    // Calculate word count and character count if content is updated
    let wordCount = existing.wordCount;
    let characterCount = existing.characterCount;
    
    if (data.content) {
      const text = data.content;
      wordCount = text.split(/\s+/).filter((word: string) => word.length > 0).length;
      characterCount = text.length;
    }

    const content = await prisma.savedContent.update({
      where: { id: params.id },
      data: {
        ...data,
        wordCount,
        characterCount,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            websiteUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het updaten van content' },
      { status: 500 }
    );
  }
}

// DELETE - Verwijder content
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if content exists and belongs to client
    const existing = await prisma.savedContent.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Content niet gevonden' }, { status: 404 });
    }

    await prisma.savedContent.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het verwijderen van content' },
      { status: 500 }
    );
  }
}
