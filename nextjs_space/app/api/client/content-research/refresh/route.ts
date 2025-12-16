import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-utils';

/**
 * POST /api/client/content-research/refresh
 * Refresh content research and generate new strategy
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

    const { projectId, keywords, competitors, targetAudience } = await req.json();

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

    // Generate content strategy using AI
    const prompt = `Maak een uitgebreide content strategie voor het volgende project:

Project: ${project.name}
Website: ${project.website || 'Niet opgegeven'}
Huidige keywords: ${keywords?.join(', ') || project.target_keywords?.join(', ') || 'Geen'}
Concurrenten: ${competitors || 'Niet opgegeven'}
Doelgroep: ${targetAudience || 'Niet opgegeven'}

Genereer een complete content strategie met:
1. Content pilaren (3-5 hoofdthema's)
2. Zoekwoorden strategie
3. Content types en verdeling
4. Publicatie frequentie aanbeveling
5. SEO aanbevelingen

Format als JSON object met deze structuur:
{
  "contentPillars": ["Pilaar 1", "Pilaar 2", ...],
  "keywordStrategy": "beschrijving",
  "contentTypes": { "blog": 60, "social": 30, "video": 10 },
  "publishingFrequency": "beschrijving",
  "seoRecommendations": ["tip 1", "tip 2", ...]
}`;

    const strategyResponse = await chatCompletion([
      {
        role: 'user',
        content: prompt,
      },
    ], {
      model: 'claude-sonnet-4',
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    let strategy;
    try {
      strategy = JSON.parse(strategyResponse);
    } catch (e) {
      console.error('Failed to parse strategy response:', e);
      return NextResponse.json(
        { error: 'Fout bij verwerken van strategie' },
        { status: 500 }
      );
    }

    // Update project with new strategy
    await prisma.project.update({
      where: { id: projectId },
      data: {
        content_strategy: strategy,
        target_keywords: keywords || project.target_keywords,
      },
    });

    // Generate article ideas based on strategy
    const ideasPrompt = `Genereer 15 concrete artikel ideeën gebaseerd op deze content strategie:

Strategie: ${JSON.stringify(strategy, null, 2)}
Project: ${project.name}

Format als JSON array: [{ "title": "...", "description": "...", "pillar": "...", "keywords": [...] }]`;

    const ideasResponse = await chatCompletion([
      {
        role: 'user',
        content: ideasPrompt,
      },
    ], {
      model: 'claude-sonnet-4',
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    let ideas = [];
    try {
      const parsed = JSON.parse(ideasResponse);
      ideas = parsed.ideas || parsed.articles || [];
    } catch (e) {
      console.error('Failed to parse ideas response:', e);
    }

    // Save ideas to database
    if (ideas.length > 0) {
      await Promise.all(
        ideas.map((idea: any) =>
          prisma.savedContent.create({
            data: {
              client_id: session.user.id,
              project_id: projectId,
              title: idea.title,
              content: idea.description,
              type: 'blog',
              status: 'idea',
              metadata: {
                pillar: idea.pillar,
                keywords: idea.keywords,
                generatedAt: new Date().toISOString(),
              },
            },
          })
        )
      );
    }

    return NextResponse.json({
      success: true,
      contentStrategy: strategy,
      articleIdeas: ideas,
      message: 'Content research succesvol vernieuwd',
    });
  } catch (error) {
    console.error('[API] Error refreshing content research:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het vernieuwen van content research' },
      { status: 500 }
    );
  }
}
