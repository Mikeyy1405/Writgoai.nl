/**
 * WordPress Content Analysis API Route
 * 
 * POST: Analyze WordPress site and generate content gap analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ContentPlanTopic {
  title: string;
  description: string;
  keywords: string[];
  priority: string;
  reason?: string;
}

interface WordPressPost {
  id: number;
  title: { rendered: string };
  excerpt?: { rendered: string };
  categories?: number[];
  tags?: number[];
}

/**
 * POST /api/simplified/content-plan/analyze-wordpress
 * Analyze WordPress site and generate content plan based on gaps
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Je moet ingelogd zijn'
      }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ 
        error: 'Client not found',
        message: 'Gebruiker niet gevonden'
      }, { status: 404 });
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ 
        error: 'Invalid input',
        message: 'Project ID is verplicht'
      }, { status: 400 });
    }

    // Get project details
    const project = await prisma.project.findUnique({
      where: { id: projectId, clientId: client.id },
    });

    if (!project) {
      return NextResponse.json({ 
        error: 'Project not found',
        message: 'Project niet gevonden'
      }, { status: 404 });
    }

    if (!project.websiteUrl) {
      return NextResponse.json({ 
        error: 'No website URL',
        message: 'Geen website URL gevonden voor dit project'
      }, { status: 400 });
    }

    console.log(`[analyze-wordpress] Analyzing WordPress site: ${project.websiteUrl}`);

    // Fetch existing WordPress posts
    let existingPosts: WordPressPost[] = [];
    try {
      const wpApiUrl = `${project.websiteUrl}/wp-json/wp/v2/posts?per_page=50&_fields=id,title,excerpt,categories,tags`;
      const response = await fetch(wpApiUrl, {
        headers: {
          'User-Agent': 'WritGoAI Content Planner/1.0',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.ok) {
        existingPosts = await response.json();
        console.log(`[analyze-wordpress] Fetched ${existingPosts.length} existing posts`);
      } else {
        console.warn(`[analyze-wordpress] Failed to fetch posts: ${response.status}`);
        // Continue without existing posts data
      }
    } catch (fetchError: any) {
      console.warn(`[analyze-wordpress] Error fetching WordPress content:`, fetchError.message);
      // Continue without existing posts data
    }

    // Prepare content summary for AI
    const existingTitles = existingPosts.map(post => post.title.rendered).slice(0, 30);
    const contentSummary = existingTitles.length > 0
      ? `Bestaande artikelen:\n${existingTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
      : 'Geen bestaande content gevonden of site niet toegankelijk';

    // Generate content gap analysis using AI
    const prompt = `Je bent een expert SEO content strategist. Analyseer de WordPress website en genereer een content plan.

Website: ${project.name} (${project.websiteUrl})
Niche: ${project.niche || 'Niet gespecificeerd'}

${contentSummary}

Gebaseerd op de bestaande content (of het ontbreken daarvan), genereer 8-12 nieuwe artikel topics die:
1. Content gaps invullen die nog niet gedekt zijn
2. De niche en doelgroep aanspreken
3. Verschillende zoekintents dekken
4. SEO-vriendelijk zijn met goede zoekvolume potentie
5. Complementair zijn aan bestaande content

BELANGRIJK: Geef je antwoord ALLEEN als een geldig JSON object, zonder extra tekst, uitleg of markdown formatting.

Exact formaat (volg dit exact):
{
  "topics": [
    {
      "title": "Artikel titel",
      "description": "Korte beschrijving van het artikel",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "priority": "high",
      "reason": "Waarom dit topic een content gap invult"
    }
  ]
}

Gebruik alleen deze priority waarden: "high", "medium", of "low".
Geef minimaal 8 en maximaal 12 topics.
Antwoord direct met de JSON, geen tekst ervoor of erna.`;

    const aiResponse = await chatCompletion(
      [
        { role: 'system', content: 'Je bent een SEO expert die WordPress sites analyseert en gestructureerde JSON content plannen genereert.' },
        { role: 'user', content: prompt }
      ],
      {
        model: 'claude-sonnet-4-20250514',
        temperature: 0.7,
        max_tokens: 4000,
      }
    );

    // Parse AI response with robust error handling
    let topics: ContentPlanTopic[] = [];
    
    try {
      // Strategy 1: Try direct JSON parse
      try {
        const parsed = JSON.parse(aiResponse);
        topics = parsed.topics || [];
        console.log('[analyze-wordpress] Strategy 1 success: Direct JSON parse');
      } catch (e1) {
        // Strategy 2: Remove markdown code blocks
        try {
          const withoutCodeBlocks = aiResponse
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();
          const parsed = JSON.parse(withoutCodeBlocks);
          topics = parsed.topics || [];
          console.log('[analyze-wordpress] Strategy 2 success: Removed markdown code blocks');
        } catch (e2) {
          // Strategy 3: Extract JSON from text using regex
          try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*"topics"[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              topics = parsed.topics || [];
              console.log('[analyze-wordpress] Strategy 3 success: Regex JSON extraction');
            } else {
              throw new Error('No JSON object found in response');
            }
          } catch (e3) {
            // Strategy 4: Try to find array of topics directly
            try {
              const topicsMatch = aiResponse.match(/"topics"\s*:\s*(\[[\s\S]*?\])\s*\}/);
              if (topicsMatch) {
                topics = JSON.parse(topicsMatch[1]);
                console.log('[analyze-wordpress] Strategy 4 success: Direct topics array extraction');
              } else {
                // All strategies failed - log raw response for debugging
                console.error('[analyze-wordpress] All parsing strategies failed');
                console.error('[analyze-wordpress] Raw AI response length:', aiResponse.length);
                console.error('[analyze-wordpress] Raw AI response (first 1000 chars):', aiResponse.substring(0, 1000));
                console.error('[analyze-wordpress] Raw AI response (last 500 chars):', aiResponse.substring(Math.max(0, aiResponse.length - 500)));
                
                throw new Error('Failed to parse AI response after trying all strategies');
              }
            } catch (e4) {
              // Final fallback failed
              console.error('[analyze-wordpress] Strategy 4 failed:', e4);
              console.error('[analyze-wordpress] Raw AI response:', aiResponse);
              throw e4;
            }
          }
        }
      }
    } catch (parseError: any) {
      console.error('[analyze-wordpress] Complete parsing failure');
      console.error('[analyze-wordpress] Parse error:', parseError);
      console.error('[analyze-wordpress] Full raw AI response:', aiResponse);
      
      return NextResponse.json(
        { 
          error: 'Failed to parse AI response',
          message: 'Kan AI response niet parsen. Controleer de logs voor details.',
          details: parseError.message,
          responsePreview: aiResponse.substring(0, 200) + '...'
        },
        { status: 500 }
      );
    }

    // Validate topics
    if (!Array.isArray(topics) || topics.length === 0) {
      console.error('[analyze-wordpress] No valid topics generated');
      console.error('[analyze-wordpress] Parsed topics:', topics);
      
      return NextResponse.json(
        { 
          error: 'No topics generated',
          message: 'Geen topics gegenereerd. Probeer het opnieuw.',
          details: 'AI response was parsed but contained no valid topics'
        },
        { status: 500 }
      );
    }

    console.log(`[analyze-wordpress] Successfully parsed ${topics.length} topics`);

    // Save ideas to database
    const savedIdeas = await Promise.all(
      topics.map((topic, index) =>
        prisma.articleIdea.create({
          data: {
            clientId: client.id,
            projectId: project.id,
            title: topic.title,
            description: topic.description,
            keywords: topic.keywords,
            priority: topic.priority,
            reason: topic.reason,
            aiScore: 1.0 - (index * 0.05),
            searchVolume: 0,
          },
        })
      )
    );

    console.log(`[analyze-wordpress] Generated ${topics.length} content gap topics for project: ${project.name}`);

    return NextResponse.json({
      success: true,
      topics,
      savedCount: savedIdeas.length,
      existingPostsAnalyzed: existingPosts.length,
    });

  } catch (error: any) {
    console.error('[analyze-wordpress] POST error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze WordPress site',
        message: 'Kan WordPress site niet analyseren',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
