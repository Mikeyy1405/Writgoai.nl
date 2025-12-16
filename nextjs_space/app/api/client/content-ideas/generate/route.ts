import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-utils';

/**
 * POST /api/client/content-ideas/generate
 * Generate AI-powered content ideas for a project
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is verplicht' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client_id: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    // Generate content ideas using AI
    const prompt = `Genereer 10 content ideeën voor het volgende project:

Project: ${project.name}
Beschrijving: ${project.description || 'Geen beschrijving'}
Website: ${project.website || 'Niet opgegeven'}
Zoekwoorden: ${project.target_keywords?.join(', ') || 'Geen zoekwoorden'}

Genereer creatieve en relevante content ideeën die passen bij dit project.
Geef voor elk idee:
1. Titel (max 100 karakters)
2. Korte beschrijving (max 200 karakters)
3. Geschatte waarde (hoog/middel/laag)
4. Content type (blog/social/video/infographic)

Format: JSON array met objecten: { title, description, value, type }`;

    const aiResponse = await chatCompletion([
      {
        role: 'user',
        content: prompt,
      },
    ], {
      model: 'claude-sonnet-4',
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    let ideas = [];
    try {
      const parsed = JSON.parse(aiResponse);
      ideas = parsed.ideas || parsed.contentIdeas || [];
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      return NextResponse.json(
        { error: 'Fout bij verwerken van AI resultaten' },
        { status: 500 }
      );
    }

    // Save ideas to database
    const savedIdeas = await Promise.all(
      ideas.map((idea: any) =>
        prisma.savedContent.create({
          data: {
            client_id: session.user.id,
            project_id: projectId,
            title: idea.title,
            content: idea.description,
            type: idea.type || 'blog',
            status: 'idea',
            metadata: {
              value: idea.value,
              generatedAt: new Date().toISOString(),
            },
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      ideas: savedIdeas,
      count: savedIdeas.length,
    });
  } catch (error) {
    console.error('[API] Error generating content ideas:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het genereren van content ideeën' },
      { status: 500 }
    );
  }
}
