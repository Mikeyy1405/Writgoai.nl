import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/client/ai-profile
 * Haal alle AI profiel instellingen op
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    // Get client with all relevant data
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        aiSettings: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Get projects for this client
    const projects = await prisma.project.findMany({
      where: { 
        clientId: client.id,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Build profile data from various sources
    const profile = {
      // Company info (from first/primary project or client)
      websiteName: client.companyName || projects[0]?.name || '',
      websiteUrl: projects[0]?.websiteUrl || client.website || '',
      blogUrl: projects[0]?.wordpressUrl || '',
      companyDescription: projects[0]?.description || client.brandVoice || '',
      targetAudience: projects[0]?.targetAudience || client.targetAudience || '',
      problemStatement: '',
      solutionStatement: '',
      uniqueFeatures: projects[0]?.contentPillars || [],
      
      // YouTube
      youtubeChannelUrl: client.youtubeChannelId ? `https://youtube.com/channel/${client.youtubeChannelId}` : '',
      
      // Content settings
      contentStyle: [],
      contentLanguage: 'Dutch',
      toneOfVoice: client.aiSettings?.toneOfVoice || client.brandVoice || '',
      customBlogInstructions: client.aiSettings?.customInstructions || projects[0]?.customInstructions || '',
      
      // Visual settings
      imageSize: '1536x1024',
      imageStyle: '',
      brandAccentColor: '',
      customImageInstructions: '',
      
      // Automation settings
      autopilotEnabled: client.automationActive || false,
      publishingDays: [],
      publishingTime: '09:00',
      postsPerDay: 1,
      
      // Store AI scan results if available
      aiScanResults: projects[0]?.contentTopics ? JSON.stringify({
        companyInfo: {
          name: projects[0]?.name,
          description: projects[0]?.description,
          values: projects[0]?.contentPillars || [],
        },
        targetAudience: {
          primaryAudience: projects[0]?.targetAudience,
        },
        contentStyle: {
          toneOfVoice: client.aiSettings?.toneOfVoice || client.brandVoice,
        },
        seoKeywords: projects[0]?.keywords || [],
        contentTopics: projects[0]?.contentPillars || [],
      }) : null,
    };

    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error('Error fetching AI profile:', error);
    return NextResponse.json(
      { error: 'Kon AI profiel niet ophalen' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/client/ai-profile
 * Sla AI profiel instellingen op
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await req.json();

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        aiSettings: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Update or create AI Settings (voor tone of voice en custom instructions)
    if (client.aiSettings) {
      await prisma.clientAISettings.update({
        where: { clientId: client.id },
        data: {
          toneOfVoice: body.toneOfVoice || null,
          customInstructions: body.customBlogInstructions || null,
        },
      });
    } else {
      await prisma.clientAISettings.create({
        data: {
          clientId: client.id,
          toneOfVoice: body.toneOfVoice || null,
          customInstructions: body.customBlogInstructions || null,
        },
      });
    }

    // Update Client data
    await prisma.client.update({
      where: { id: client.id },
      data: {
        companyName: body.websiteName || undefined,
        website: body.websiteUrl || undefined,
        targetAudience: body.targetAudience || undefined,
        brandVoice: body.toneOfVoice || undefined,
        automationActive: body.autopilotEnabled || false,
      },
    });

    // Update or create primary project with all settings
    const projects = await prisma.project.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' },
    });

    if (projects.length > 0) {
      // Update existing primary project
      await prisma.project.update({
        where: { id: projects[0].id },
        data: {
          name: body.websiteName || projects[0].name,
          websiteUrl: body.websiteUrl || projects[0].websiteUrl,
          description: body.companyDescription || undefined,
          targetAudience: body.targetAudience || undefined,
          brandVoice: body.toneOfVoice || undefined,
          contentPillars: body.uniqueFeatures || undefined,
          keywords: body.keywords || undefined,
          customInstructions: body.customBlogInstructions || undefined,
          wordpressUrl: body.blogUrl || undefined,
          wordpressAutoPublish: body.autopilotEnabled || false,
        },
      });
    } else if (body.websiteUrl) {
      // Create new project if none exists and website URL provided
      await prisma.project.create({
        data: {
          clientId: client.id,
          name: body.websiteName || 'Mijn Project',
          websiteUrl: body.websiteUrl,
          description: body.companyDescription || undefined,
          targetAudience: body.targetAudience || undefined,
          brandVoice: body.toneOfVoice || undefined,
          contentPillars: body.uniqueFeatures || [],
          customInstructions: body.customBlogInstructions || undefined,
          wordpressUrl: body.blogUrl || undefined,
          wordpressAutoPublish: body.autopilotEnabled || false,
          isPrimary: true,
        },
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'AI profiel succesvol opgeslagen' 
    });
  } catch (error: any) {
    console.error('Error saving AI profile:', error);
    return NextResponse.json(
      { error: 'Kon AI profiel niet opslaan' },
      { status: 500 }
    );
  }
}
