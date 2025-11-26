
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Get Autopilot settings for a specific project
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get projectId from query params
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get project with autopilot settings
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
      select: {
        id: true,
        name: true,
        autopilotEnabled: true,
        autopilotMode: true,
        autopilotFrequency: true,
        autopilotArticlesPerRun: true,
        autopilotWordCount: true,
        autopilotPriority: true,
        autopilotAutoPublish: true,
        autopilotContentType: true,
        autopilotIncludeFAQ: true,
        autopilotIncludeDirectAnswer: true,
        autopilotIncludeYouTube: true,
        autopilotImageCount: true,
        autopilotPublishingDays: true,
        autopilotPublishingTime: true,
        autopilotPublishToWritgoaiBlog: true,
        autopilotNextRun: true,
        autopilotLastRun: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      settings: {
        projectId: project.id,
        projectName: project.name,
        enabled: project.autopilotEnabled || false,
        mode: project.autopilotMode || 'fast',
        frequency: project.autopilotFrequency || 'weekly',
        articlesPerRun: project.autopilotArticlesPerRun || 5,
        wordCount: project.autopilotWordCount || 2000,
        priority: project.autopilotPriority || 'all',
        autoPublish: project.autopilotAutoPublish || false,
        contentType: project.autopilotContentType || 'all',
        includeFAQ: project.autopilotIncludeFAQ ?? false,
        includeDirectAnswer: project.autopilotIncludeDirectAnswer ?? true,
        includeYouTube: project.autopilotIncludeYouTube ?? false,
        imageCount: project.autopilotImageCount || 2,
        publishingDays: project.autopilotPublishingDays || [],
        publishingTime: project.autopilotPublishingTime || '09:00',
        publishToWritgoaiBlog: project.autopilotPublishToWritgoaiBlog ?? false,
        nextRun: project.autopilotNextRun,
        lastRun: project.autopilotLastRun,
      },
    });
  } catch (error) {
    console.error('[Autopilot Settings GET Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch autopilot settings' },
      { status: 500 }
    );
  }
}

// PUT - Update Autopilot settings for a specific project
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
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
    const {
      projectId,
      enabled,
      mode,
      frequency,
      articlesPerRun,
      wordCount,
      priority,
      autoPublish,
      contentType,
      includeFAQ,
      includeDirectAnswer,
      includeYouTube,
      imageCount,
      publishingDays,
      publishingTime,
      publishToWritgoaiBlog,
    } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Verify project belongs to client
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
      select: {
        id: true,
        websiteUrl: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Security: Only allow publishToWritgoaiBlog for info@WritgoAI.nl and WritgoAI projects
    const isWritgoAiProject = client.email === 'info@WritgoAI.nl' && 
                              project.websiteUrl?.includes('WritgoAI.nl');
    
    // Force publishToWritgoaiBlog to false if not authorized
    const finalPublishToWritgoaiBlog = isWritgoAiProject && publishToWritgoaiBlog ? true : false;

    // Calculate next run time based on frequency
    let nextRun: Date | null = null;
    if (enabled) {
      const now = new Date();
      switch (frequency) {
        case 'daily':
          nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'weekly':
          nextRun = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          nextRun = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          nextRun = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
    }

    // Update project autopilot settings
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        autopilotEnabled: enabled,
        autopilotMode: mode || 'fast',
        autopilotFrequency: frequency,
        autopilotArticlesPerRun: articlesPerRun,
        autopilotWordCount: wordCount || 2000,
        autopilotPriority: priority,
        autopilotAutoPublish: autoPublish,
        autopilotContentType: contentType,
        autopilotIncludeFAQ: includeFAQ !== undefined ? includeFAQ : false,
        autopilotIncludeDirectAnswer: includeDirectAnswer !== undefined ? includeDirectAnswer : true,
        autopilotIncludeYouTube: includeYouTube !== undefined ? includeYouTube : false,
        autopilotImageCount: imageCount || 2,
        autopilotPublishingDays: publishingDays || [],
        autopilotPublishingTime: publishingTime || '09:00',
        autopilotPublishToWritgoaiBlog: finalPublishToWritgoaiBlog,
        autopilotNextRun: nextRun,
      },
      select: {
        id: true,
        name: true,
        autopilotEnabled: true,
        autopilotMode: true,
        autopilotFrequency: true,
        autopilotArticlesPerRun: true,
        autopilotWordCount: true,
        autopilotPriority: true,
        autopilotAutoPublish: true,
        autopilotContentType: true,
        autopilotIncludeFAQ: true,
        autopilotIncludeDirectAnswer: true,
        autopilotIncludeYouTube: true,
        autopilotImageCount: true,
        autopilotPublishingDays: true,
        autopilotPublishingTime: true,
        autopilotPublishToWritgoaiBlog: true,
        autopilotNextRun: true,
        autopilotLastRun: true,
      },
    });

    // 📅 Automatisch opnieuw inplannen van article ideas bij wijziging van frequency/articlesPerRun
    if (frequency || articlesPerRun) {
      try {
        const { rescheduleAllIdeas } = await import('@/lib/article-scheduler');
        await rescheduleAllIdeas(projectId, client.id);
        console.log(`📅 Article ideas automatisch opnieuw ingepland voor project: ${projectId}`);
      } catch (scheduleError) {
        console.error('Fout bij automatisch opnieuw inplannen:', scheduleError);
        // Continue - niet kritisch voor settings update
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Autopilot settings updated successfully',
      settings: {
        projectId: updatedProject.id,
        projectName: updatedProject.name,
        enabled: updatedProject.autopilotEnabled,
        mode: updatedProject.autopilotMode,
        frequency: updatedProject.autopilotFrequency,
        articlesPerRun: updatedProject.autopilotArticlesPerRun,
        wordCount: updatedProject.autopilotWordCount,
        priority: updatedProject.autopilotPriority,
        autoPublish: updatedProject.autopilotAutoPublish,
        contentType: updatedProject.autopilotContentType,
        includeFAQ: updatedProject.autopilotIncludeFAQ,
        includeDirectAnswer: updatedProject.autopilotIncludeDirectAnswer,
        includeYouTube: updatedProject.autopilotIncludeYouTube,
        imageCount: updatedProject.autopilotImageCount,
        publishingDays: updatedProject.autopilotPublishingDays,
        publishingTime: updatedProject.autopilotPublishingTime,
        publishToWritgoaiBlog: updatedProject.autopilotPublishToWritgoaiBlog,
        nextRun: updatedProject.autopilotNextRun,
        lastRun: updatedProject.autopilotLastRun,
      },
    });
  } catch (error) {
    console.error('[Autopilot Settings PUT Error]:', error);
    return NextResponse.json(
      { error: 'Failed to update autopilot settings' },
      { status: 500 }
    );
  }
}