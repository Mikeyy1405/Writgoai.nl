/**
 * Content Plan Add Ideas API Route
 * 
 * POST: Add new content ideas based on keywords
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion, TEXT_MODELS } from '@/lib/aiml-api';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;
export const runtime = 'nodejs';

/**
 * POST /api/client/content-plan/add-ideas
 * Body: { keywords: string[], projectId: string, language: string }
 * Add content ideas based on keywords
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();
    const { keywords, projectId, language = 'NL' } = body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ 
        error: 'Keywords array is required' 
      }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ 
        error: 'projectId is required' 
      }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId, clientId: client.id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    console.log(`💡 Generating ideas for keywords:`, keywords);

    // Generate ideas using AI
    const prompt = `Generate 5-10 high-quality content ideas based on these keywords: ${keywords.join(', ')}

For each idea, provide:
- A compelling title
- A brief description (1-2 sentences)
- Focus keyword
- 3-5 secondary keywords
- Search intent (informational/commercial/navigational/transactional)
- Estimated difficulty (0-100)
- Content type (blog-post/how-to/guide/listicle/review/comparison)
- 5-7 H2 outline points

IMPORTANT: Respond with ONLY valid JSON in this exact format:
{
  "ideas": [
    {
      "title": "string",
      "description": "string",
      "focusKeyword": "string",
      "secondaryKeywords": ["string"],
      "searchIntent": "informational|commercial|navigational|transactional",
      "estimatedDifficulty": number,
      "contentType": "blog-post|how-to|guide|listicle|review|comparison",
      "outline": ["string"],
      "priority": number (1-10)
    }
  ]
}

Do not include any markdown formatting, code blocks, or explanations. Return only the raw JSON object.`;

    const aiResponse = await chatCompletion({
      model: TEXT_MODELS.CLAUDE_SONNET,
      messages: [{
        role: 'user',
        content: prompt,
      }],
      temperature: 0.8,
    });

    // Extract JSON from response (handle potential markdown code blocks)
    let responseContent = aiResponse.choices[0]?.message?.content || '{}';
    
    // Remove markdown code blocks if present
    responseContent = responseContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const result = JSON.parse(responseContent);
    const ideas = result.ideas || result.contentIdeas || [];

    // Save ideas to database
    const savedIdeas = [];
    for (const idea of ideas) {
      try {
        const slug = idea.title.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        const saved = await prisma.articleIdea.upsert({
          where: {
            clientId_slug: {
              clientId: client.id,
              slug: slug,
            }
          },
          update: {
            secondaryKeywords: idea.secondaryKeywords || [],
            contentOutline: { 
              sections: (idea.outline || []).map((h2: string) => ({ 
                heading: h2, 
                subpoints: [] 
              })) 
            },
            aiScore: idea.priority ? idea.priority * 10 : 70,
          },
          create: {
            clientId: client.id,
            projectId: projectId,
            title: idea.title,
            slug: slug,
            focusKeyword: idea.focusKeyword || keywords[0],
            topic: idea.description || idea.title,
            secondaryKeywords: idea.secondaryKeywords || [],
            searchIntent: idea.searchIntent || 'informational',
            difficulty: idea.estimatedDifficulty || 50,
            contentOutline: { 
              sections: (idea.outline || []).map((h2: string) => ({ 
                heading: h2, 
                subpoints: [] 
              })) 
            },
            contentType: idea.contentType || 'blog-post',
            priority: idea.priority || 5,
            aiScore: idea.priority ? idea.priority * 10 : 70,
            status: 'idea',
          }
        });
        savedIdeas.push(saved);
      } catch (error) {
        console.error('Error saving idea:', error);
        // Continue with other ideas
      }
    }

    return NextResponse.json({
      success: true,
      ideas: savedIdeas,
      message: `${savedIdeas.length} nieuwe ideeën toegevoegd!`,
    });

  } catch (error: any) {
    console.error('[content-plan/add-ideas] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to add content ideas',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
