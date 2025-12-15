
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const maxDuration = 300; // 5 minuten voor AI processing

/**
 * POST: Voeg nieuw content idee toe en laat AI de details invullen
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: { projects: true }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, projectId } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Titel is verplicht' }, { status: 400 });
    }

    // Haal project informatie op als er een project is geselecteerd
    let project = null;
    let niche = 'algemeen';
    let targetAudience = 'Nederlandse lezers';
    
    if (projectId) {
      project = await prisma.project.findUnique({
        where: { id: projectId, clientId: client.id }
      });
      
      if (project) {
        niche = project.niche || project.name || 'algemeen';
        targetAudience = project.targetAudience || 'Nederlandse lezers';
      }
    }

    console.log(`🤖 AI vult content idee in voor: "${title}"`);

    // Gebruik AI om het idee uit te werken
    const { generateContentIdea } = await import('@/lib/intelligent-content-planner');
    const enrichedIdea = await generateContentIdea(title, niche, targetAudience);

    // Genereer slug
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Maak het nieuwe idee aan
    const newIdea = await prisma.articleIdea.create({
      data: {
        clientId: client.id,
        projectId: projectId || null,
        title: enrichedIdea.title,
        slug: slug,
        focusKeyword: enrichedIdea.focusKeyword,
        topic: enrichedIdea.description,
        secondaryKeywords: enrichedIdea.secondaryKeywords,
        searchIntent: enrichedIdea.searchIntent,
        difficulty: enrichedIdea.estimatedDifficulty,
        contentOutline: { 
          sections: enrichedIdea.outline.map((h2: string) => ({ 
            heading: h2, 
            subpoints: [] 
          })) 
        },
        contentType: enrichedIdea.contentType,
        priority: enrichedIdea.priority,
        aiScore: 75, // Default score voor handmatige toevoegingen
        trending: false,
        competitorGap: false,
        status: 'idea',
      }
    });

    console.log(`✅ Nieuw content idee aangemaakt: ${newIdea.id}`);

    // Automatisch inplannen als er een project is geselecteerd
    let scheduledFor = null;
    if (projectId) {
      const { scheduleNewIdea } = await import('@/lib/article-scheduler');
      scheduledFor = await scheduleNewIdea(newIdea.id, projectId, client.id);
      console.log(`📅 Automatisch ingepland voor: ${scheduledFor}`);
    }

    // Haal updated idee op met scheduledFor datum
    const updatedIdea = await prisma.articleIdea.findUnique({
      where: { id: newIdea.id }
    });

    return NextResponse.json({
      success: true,
      message: scheduledFor 
        ? 'Content idee succesvol toegevoegd, ingevuld en ingepland door AI'
        : 'Content idee succesvol toegevoegd en ingevuld door AI',
      idea: updatedIdea || newIdea
    });

  } catch (error: any) {
    console.error('❌ Error adding article idea:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij toevoegen van content idee' },
      { status: 500 }
    );
  }
}
