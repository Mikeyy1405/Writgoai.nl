

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/aiml-api';

// GET - Haal alle affiliate links op voor een project
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = params;

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email! }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get all affiliate links
    const links = await prisma.affiliateLink.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ links });
  } catch (error) {
    console.error('[Affiliate Links GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch affiliate links' },
      { status: 500 }
    );
  }
}

// POST - Voeg een nieuwe affiliate link toe (met AI titel generatie)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = params;
    const body = await req.json();
    const { url, anchorText, category, description } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email! }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Als geen anchor text is opgegeven, gebruik AI om het te genereren
    let finalAnchorText = anchorText;
    let finalCategory = category;
    let finalDescription = description;
    let keywords: string[] = [];

    if (!anchorText) {
      try {
        console.log(`[Affiliate Link] Generating title for URL: ${url}`);
        
        // Gebruik AI om titel en metadata te genereren
        const aiPrompt = `Analyseer deze URL en genereer een korte, SEO-vriendelijke anchor text (titel) ervoor: ${url}

Geef het antwoord in het volgende JSON formaat:
{
  "anchorText": "Een korte, aantrekkelijke titel (max 60 tekens)",
  "category": "Een relevante categorie",
  "description": "Een korte beschrijving (1-2 zinnen)",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Zorg ervoor dat de anchor text natuurlijk klinkt en niet spam-achtig is.`;

        const aiResponse = await chatCompletion({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Je bent een SEO expert die professionele anchor texts en metadata genereert voor affiliate links. Antwoord altijd in valid JSON formaat.'
            },
            {
              role: 'user',
              content: aiPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        });

        const aiText = aiResponse.choices[0]?.message?.content || '{}';
        
        // Parse AI response
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const aiData = JSON.parse(jsonMatch[0]);
          finalAnchorText = aiData.anchorText || url;
          finalCategory = aiData.category || category;
          finalDescription = aiData.description || description;
          keywords = aiData.keywords || [];
        } else {
          // Fallback: gebruik URL als titel
          finalAnchorText = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
        }

        console.log(`[Affiliate Link] AI Generated title: ${finalAnchorText}`);
      } catch (aiError) {
        console.error('[Affiliate Link] AI generation error:', aiError);
        // Fallback: gebruik URL als titel
        finalAnchorText = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
      }
    }

    // Create affiliate link
    const link = await prisma.affiliateLink.create({
      data: {
        projectId,
        url,
        anchorText: finalAnchorText,
        category: finalCategory,
        description: finalDescription,
        keywords
      }
    });

    return NextResponse.json({ link });
  } catch (error) {
    console.error('[Affiliate Link POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create affiliate link' },
      { status: 500 }
    );
  }
}

// PATCH - Update een affiliate link
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = params;
    const body = await req.json();
    const { id, url, anchorText, category, description, isActive, keywords } = body;

    if (!id) {
      return NextResponse.json({ error: 'Link ID is required' }, { status: 400 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email! }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Update affiliate link
    const link = await prisma.affiliateLink.update({
      where: { id },
      data: {
        ...(url && { url }),
        ...(anchorText && { anchorText }),
        ...(category && { category }),
        ...(description && { description }),
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(keywords && { keywords })
      }
    });

    return NextResponse.json({ link });
  } catch (error) {
    console.error('[Affiliate Link PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update affiliate link' },
      { status: 500 }
    );
  }
}

// DELETE - Verwijder een affiliate link
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = params;
    const { searchParams } = new URL(req.url);
    const linkId = searchParams.get('id');

    if (!linkId) {
      return NextResponse.json({ error: 'Link ID is required' }, { status: 400 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email! }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Delete affiliate link
    await prisma.affiliateLink.delete({
      where: { id: linkId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Affiliate Link DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete affiliate link' },
      { status: 500 }
    );
  }
}
