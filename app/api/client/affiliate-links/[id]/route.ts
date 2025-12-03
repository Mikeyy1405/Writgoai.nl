

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import aimlAPI from '@/lib/aiml-api';

const prisma = new PrismaClient();

// Generate keywords from URL and title
async function generateKeywords(url: string, title: string, category: string): Promise<string[]> {
  try {
    const prompt = `Genereer 3-5 relevante Nederlandse keywords voor deze affiliate link.

URL: ${url}
Titel: ${title}
Categorie: ${category}

Return ALLEEN een komma-gescheiden lijst van keywords, niets anders.
Voorbeeld: yoga, meditatie, mindfulness, ontspanning`;

    const response = await aimlAPI.chatCompletion({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Je bent een keyword extractie expert. Genereer relevante Nederlandse keywords.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    const keywords = response.choices[0].message.content
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 2)
      .slice(0, 5);

    return keywords.length > 0 ? keywords : [title.toLowerCase()];
  } catch (error) {
    console.error('[Affiliate Links] Error generating keywords:', error);
    return [title.toLowerCase()];
  }
}

// PUT - Update affiliate link
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, url, description, category } = body;

    if (!title || !url) {
      return NextResponse.json({ error: 'Titel en URL zijn verplicht' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Ongeldige URL' }, { status: 400 });
    }

    // Get client's project
    const client = await prisma.client.findUnique({
      where: { email: session.user.email as string },
      include: { projects: { take: 1 } },
    });

    if (!client || !client.projects[0]) {
      return NextResponse.json({ error: 'No project found' }, { status: 404 });
    }

    const projectId = client.projects[0].id;

    // Check if link belongs to this client
    const existingLink = await prisma.affiliateLink.findFirst({
      where: { 
        id: params.id,
        projectId,
      },
    });

    if (!existingLink) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Generate keywords
    const keywords = await generateKeywords(url, title, category || 'Algemeen');

    // Update affiliate link
    const affiliateLink = await prisma.affiliateLink.update({
      where: { id: params.id },
      data: {
        url,
        anchorText: title,
        description: description || null,
        category: category || null,
        keywords,
      },
    });

    return NextResponse.json({
      id: affiliateLink.id,
      title: affiliateLink.anchorText,
      url: affiliateLink.url,
      description: affiliateLink.description,
      category: affiliateLink.category,
      isActive: affiliateLink.isActive,
      usageCount: affiliateLink.usageCount,
      createdAt: affiliateLink.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('[Affiliate Links API] PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update link' }, { status: 500 });
  }
}

// DELETE - Delete affiliate link
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client's project
    const client = await prisma.client.findUnique({
      where: { email: session.user.email as string },
      include: { projects: { take: 1 } },
    });

    if (!client || !client.projects[0]) {
      return NextResponse.json({ error: 'No project found' }, { status: 404 });
    }

    const projectId = client.projects[0].id;

    // Check if link belongs to this client
    const existingLink = await prisma.affiliateLink.findFirst({
      where: { 
        id: params.id,
        projectId,
      },
    });

    if (!existingLink) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Delete affiliate link
    await prisma.affiliateLink.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Affiliate Links API] DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 });
  }
}
