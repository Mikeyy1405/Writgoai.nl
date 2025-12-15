import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion, TEXT_MODELS } from '@/lib/aiml-api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/simplified/content-plan
 * Genereer een content plan op basis van een keyword
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyword, projectId } = body;

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Genereer topical authority map met AIML API
    const prompt = `Je bent een SEO content strategist. Maak een topical authority map voor het keyword "${keyword}".

Genereer 15-20 gerelateerde topics die samen een complete kennisstructuur vormen.

Voor elk topic geef je:
- Title: De titel van het artikel
- Description: Een korte beschrijving (1-2 zinnen)
- Keywords: 3-5 gerelateerde keywords
- Priority: high, medium, of low

Format je antwoord als JSON array:
[
  {
    "title": "...",
    "description": "...",
    "keywords": ["...", "..."],
    "priority": "high"
  }
]

Geef ALLEEN de JSON array terug, geen extra tekst.`;

    const response = await chatCompletion({
      model: TEXT_MODELS.GPT5_CHAT,
      messages: [
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    let topics = [];
    try {
      // ✅ FIX: Extract content from correct response structure
      // AIML API returns: { choices: [{ message: { content: "..." } }] }
      const content = response.choices?.[0]?.message?.content || '';
      console.log('[Content Plan] Raw AI response length:', content.length);
      
      // Debug: Log full response structure if content is empty
      if (!content) {
        console.error('[Content Plan] ❌ EMPTY CONTENT! Full response structure:', {
          hasChoices: !!response.choices,
          choicesLength: response.choices?.length || 0,
          firstChoice: response.choices?.[0] ? {
            hasMessage: !!response.choices[0].message,
            messageKeys: response.choices[0].message ? Object.keys(response.choices[0].message) : [],
            contentPreview: response.choices[0].message?.content?.substring(0, 100)
          } : 'NO_FIRST_CHOICE',
          responseKeys: Object.keys(response)
        });
      }
      
      // Strategie 1: Verwijder markdown code blocks (```json ... ```)
      let cleanedContent = content;
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        cleanedContent = codeBlockMatch[1];
        console.log('[Content Plan] Found markdown code block');
      }
      
      // Strategie 2: Extract JSON array met regex
      const jsonMatch = cleanedContent.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        try {
          topics = JSON.parse(jsonMatch[0]);
          console.log('[Content Plan] Successfully parsed JSON array');
        } catch (e) {
          console.log('[Content Plan] JSON array parse failed, trying direct parse');
        }
      }
      
      // Strategie 3: Probeer directe parse als nog geen topics
      if (topics.length === 0) {
        try {
          topics = JSON.parse(cleanedContent.trim());
          console.log('[Content Plan] Successfully parsed direct JSON');
        } catch (e) {
          console.log('[Content Plan] Direct JSON parse failed');
        }
      }
      
      // Strategie 4: Probeer JSON te repareren (incomplete JSON)
      if (topics.length === 0) {
        try {
          let repairedJson = cleanedContent.trim();
          
          // Tel opening en closing brackets
          const openBrackets = (repairedJson.match(/\[/g) || []).length;
          const closeBrackets = (repairedJson.match(/\]/g) || []).length;
          const openBraces = (repairedJson.match(/\{/g) || []).length;
          const closeBraces = (repairedJson.match(/\}/g) || []).length;
          
          // Voeg missende brackets toe
          if (openBraces > closeBraces) {
            repairedJson += '}'.repeat(openBraces - closeBraces);
          }
          if (openBrackets > closeBrackets) {
            repairedJson += ']'.repeat(openBrackets - closeBrackets);
          }
          
          topics = JSON.parse(repairedJson);
          console.log('[Content Plan] Successfully parsed repaired JSON');
        } catch (e) {
          console.log('[Content Plan] JSON repair failed');
        }
      }
      
      // Valideer dat we een array hebben
      if (!Array.isArray(topics) || topics.length === 0) {
        console.error('[Content Plan] No valid topics array found');
        console.error('[Content Plan] Response preview:', content.substring(0, 500));
        throw new Error('Invalid AI response format');
      }
      
      // Valideer topic structuur
      topics = topics.filter(topic => {
        return topic.title && 
               topic.description && 
               Array.isArray(topic.keywords) && 
               topic.priority;
      });
      
      if (topics.length === 0) {
        throw new Error('No valid topics found in response');
      }
      
    } catch (error) {
      const responseContent = response.choices?.[0]?.message?.content || '';
      console.error('[Content Plan] Error parsing AI response:', error);
      console.error('[Content Plan] Response content:', responseContent.substring(0, 1000));
      return NextResponse.json(
        { 
          error: 'Kon AI response niet verwerken',
          details: error instanceof Error ? error.message : 'Unknown parsing error',
          rawResponse: responseContent.substring(0, 500) + '...'
        },
        { status: 500 }
      );
    }

    // Sla content plan op in project (als projectId is meegegeven)
    if (projectId) {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          contentPlan: {
            keyword,
            topics,
            generatedAt: new Date().toISOString(),
          },
          lastPlanGenerated: new Date(),
        },
      });
    } else {
      // Sla op in client als er geen project is
      await prisma.client.update({
        where: { id: client.id },
        data: {
          contentPlan: {
            keyword,
            topics,
            generatedAt: new Date().toISOString(),
          },
          lastPlanGenerated: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      keyword,
      topics,
      count: topics.length,
    });
  } catch (error) {
    console.error('Error generating content plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate content plan' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/simplified/content-plan
 * Haal bestaande content plans op
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Haal content plans op van client en alle projecten
    const projects = await prisma.project.findMany({
      where: {
        clientId: client.id,
        contentPlan: { not: null },
      },
      select: {
        id: true,
        name: true,
        contentPlan: true,
        lastPlanGenerated: true,
      },
    });

    const plans = [];

    // Client plan
    if (client.contentPlan) {
      plans.push({
        id: 'client',
        source: 'account',
        name: 'Account Plan',
        plan: client.contentPlan,
        lastGenerated: client.lastPlanGenerated,
      });
    }

    // Project plans
    projects.forEach((project) => {
      plans.push({
        id: project.id,
        source: 'project',
        name: project.name,
        plan: project.contentPlan,
        lastGenerated: project.lastPlanGenerated,
      });
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching content plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content plans' },
      { status: 500 }
    );
  }
}
