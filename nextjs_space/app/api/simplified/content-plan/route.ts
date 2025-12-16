/**
 * Simplified Content Plan API Routes
 * 
 * GET: Retrieve existing content plans
 * POST: Generate new content plan based on keyword
 * 
 * Refactored to use shared service layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { 
  validateClient,
  validateProject,
  generateContentIdeas,
  saveArticleIdeas,
  mapServiceError,
  ContentPlanTopic
} from '@/lib/services/content-plan-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ContentPlanData {
  source: string;
  keyword?: string;
  topics: ContentPlanTopic[];
  generatedAt: string;
}

/**
 * GET /api/simplified/content-plan
 * Retrieve existing content plans for the logged-in user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Validate client (consolidated validation)
    const client = await validateClient(session);

    // Get all article ideas
    const ideas = await prisma.articleIdea.findMany({
      where: {
        clientId: client.id,
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: 100 // Limit to recent ideas
    });

    // Group ideas into plans (simplified-specific logic)
    const plansMap = new Map<string, any>();

    ideas.forEach(idea => {
      const key = idea.projectId || idea.targetKeyword || 'general';
      
      if (!plansMap.has(key)) {
        plansMap.set(key, {
          id: key,
          source: idea.projectId ? 'wordpress' : 'manual',
          name: idea.projectId ? `Project Plan` : `Keyword Plan: ${idea.targetKeyword || 'General'}`,
          plan: {
            source: idea.projectId ? 'wordpress' : 'manual',
            keyword: idea.targetKeyword,
            topics: [] as ContentPlanTopic[],
            generatedAt: idea.createdAt.toISOString(),
          },
          lastGenerated: idea.createdAt.toISOString(),
        });
      }

      const plan = plansMap.get(key);
      plan.plan.topics.push({
        title: idea.title,
        description: idea.description || '',
        keywords: idea.keywords || [],
        priority: (idea.priority || 'medium') as 'high' | 'medium' | 'low',
        reason: idea.reason,
      });

      // Update last generated date if this idea is newer
      if (new Date(idea.createdAt) > new Date(plan.lastGenerated)) {
        plan.lastGenerated = idea.createdAt.toISOString();
      }
    });

    const plans = Array.from(plansMap.values());

    return NextResponse.json({
      success: true,
      plans,
    });

  } catch (error: any) {
    console.error('[simplified/content-plan] GET error:', error);
    const errorResponse = mapServiceError(error);
    return NextResponse.json(
      { 
        error: errorResponse.error,
        message: errorResponse.message,
        details: errorResponse.details
      },
      { status: errorResponse.status }
    );
  }
}

/**
 * POST /api/simplified/content-plan
 * Generate new content plan based on keyword
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { projectId, keyword } = body;

    // Validate input
    if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
      return NextResponse.json({ 
        error: 'Invalid input',
        message: 'Voer een geldig keyword in'
      }, { status: 400 });
    }

    // Validate client
    const client = await validateClient(session);

    // Validate project if provided
    let project = null;
    if (projectId) {
      project = await validateProject(projectId, client.id);
    }

    // Generate content plan using shared service
    const topics = await generateContentIdeas({
      keyword,
      projectContext: project ? {
        name: project.name,
        websiteUrl: project.websiteUrl,
        niche: project.niche,
      } : undefined,
      count: 12,
      temperature: 0.7,
    });

    // Save ideas to database using shared service
    const savedIdeas = await saveArticleIdeas(
      topics,
      client.id,
      projectId || null,
      { 
        targetKeyword: keyword,
        useUpsert: false // Use create for new ideas
      }
    );

    console.log(`[simplified/content-plan] Generated ${topics.length} topics for keyword: ${keyword}`);

    return NextResponse.json({
      success: true,
      topics,
      savedCount: savedIdeas.length,
    });

  } catch (error: any) {
    console.error('[simplified/content-plan] POST error:', error);
    const errorResponse = mapServiceError(error);
    return NextResponse.json(
      { 
        error: errorResponse.error,
        message: errorResponse.message,
        details: errorResponse.details
      },
      { status: errorResponse.status }
    );
  }
}
