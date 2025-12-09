/**

export const dynamic = "force-dynamic";
 * Content Kalender API
 * Genereer en beheer 400+ artikel ideeën
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateContentCalendar } from '@/lib/content-calendar-generator';
import { prisma } from '@/lib/db';


/**
 * GET - Haal alle artikel ideeën op
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or client
    let clientId: string;
    
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });
    
    if (client) {
      clientId = client.id;
    } else {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get query parameters for filtering
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const cluster = searchParams.get('cluster');
    const projectId = searchParams.get('projectId');

    // Build filter object
    const where: any = { clientId };
    
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (cluster) where.cluster = cluster;
    if (projectId) where.projectId = projectId;

    const articleIdeas = await prisma.articleIdea.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { aiScore: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Get statistics
    const stats = {
      total: articleIdeas.length,
      byStatus: {
        idea: articleIdeas.filter(a => a.status === 'idea').length,
        queued: articleIdeas.filter(a => a.status === 'queued').length,
        writing: articleIdeas.filter(a => a.status === 'writing').length,
        completed: articleIdeas.filter(a => a.status === 'completed').length,
        published: articleIdeas.filter(a => a.status === 'published').length
      },
      byPriority: {
        high: articleIdeas.filter(a => a.priority === 'high').length,
        medium: articleIdeas.filter(a => a.priority === 'medium').length,
        low: articleIdeas.filter(a => a.priority === 'low').length
      },
      withContent: articleIdeas.filter(a => a.hasContent).length,
      trending: articleIdeas.filter(a => a.trending).length,
      seasonal: articleIdeas.filter(a => a.seasonal).length
    };

    return NextResponse.json({
      success: true,
      articles: articleIdeas,
      stats
    });
    
  } catch (error) {
    console.error('Error fetching article ideas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article ideas' },
      { status: 500 }
    );
  }
}

/**
 * POST - Genereer nieuwe content kalender
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });
    
    if (!client) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      websiteUrl,
      niche,
      targetAudience,
      brandVoice,
      existingPages,
      competitors,
      mainKeywords,
      regenerate = false
    } = body;

    // Check if calendar already exists
    if (!regenerate) {
      const existingIdeas = await prisma.articleIdea.count({
        where: { clientId: client.id }
      });
      
      if (existingIdeas > 0) {
        return NextResponse.json({
          error: 'Content calendar already exists. Set regenerate=true to create new one.',
          existingCount: existingIdeas
        }, { status: 400 });
      }
    }

    console.log('🗓️ Generating content calendar for:', client.email);

    // Generate 400+ article ideas with AI
    const articleIdeas = await generateContentCalendar({
      websiteUrl: websiteUrl || client.website || '',
      niche: niche || 'general',
      targetAudience: targetAudience || client.targetAudience || 'general audience',
      brandVoice: brandVoice || client.brandVoice || 'professional and friendly',
      existingPages: existingPages || [],
      competitors: competitors || [],
      mainKeywords: mainKeywords || client.keywords || []
    });

    console.log(`✅ Generated ${articleIdeas.length} article ideas`);

    // Delete old ideas if regenerating
    if (regenerate) {
      await prisma.articleIdea.deleteMany({
        where: { clientId: client.id }
      });
      console.log('🗑️ Deleted old article ideas');
    }

    // Save to database in batches
    const batchSize = 50;
    let savedCount = 0;
    
    for (let i = 0; i < articleIdeas.length; i += batchSize) {
      const batch = articleIdeas.slice(i, i + batchSize);
      
      await prisma.articleIdea.createMany({
        data: batch.map(idea => ({
          clientId: client.id,
          title: idea.title,
          slug: idea.slug,
          focusKeyword: idea.focusKeyword,
          topic: idea.topic,
          secondaryKeywords: idea.secondaryKeywords,
          searchIntent: idea.searchIntent,
          searchVolume: idea.searchVolume,
          difficulty: idea.difficulty,
          contentOutline: idea.contentOutline,
          targetWordCount: idea.targetWordCount,
          contentType: idea.contentType,
          internalLinks: idea.internalLinks,
          imageIdeas: idea.imageIdeas,
          videoIdeas: idea.videoIdeas,
          priority: idea.priority,
          category: idea.category,
          cluster: idea.cluster,
          aiScore: idea.aiScore,
          trending: idea.trending,
          seasonal: idea.seasonal,
          competitorGap: idea.competitorGap
        }))
      });
      
      savedCount += batch.length;
      console.log(`💾 Saved ${savedCount}/${articleIdeas.length} articles`);
    }

    console.log(`🎉 Content calendar created with ${savedCount} articles!`);

    return NextResponse.json({
      success: true,
      message: `Content calendar generated with ${savedCount} article ideas`,
      totalArticles: savedCount
    });
    
  } catch (error) {
    console.error('Error generating content calendar:', error);
    return NextResponse.json(
      { error: 'Failed to generate content calendar', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update artikel idea
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 });
    }

    const updatedArticle = await prisma.articleIdea.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      article: updatedArticle
    });
    
  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Verwijder artikel idea
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 });
    }

    await prisma.articleIdea.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Article deleted'
    });
    
  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}
