

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Project details ophalen
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        clientId: client.id
      },
      include: {
        knowledgeBase: {
          where: { isActive: true },
          orderBy: [
            { importance: 'desc' },
            { createdAt: 'desc' }
          ]
        },
        _count: {
          select: {
            savedContent: true,
            knowledgeBase: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Add computed field to indicate if password exists without exposing actual password
    return NextResponse.json({ 
      project: {
        ...project,
        hasWordPressPassword: Boolean(project.wordpressPassword),
        wordpressPassword: undefined // Don't expose the actual password
      }
    });

  } catch (error: any) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Fout bij ophalen project' },
      { status: 500 }
    );
  }
}

// PUT - Project bijwerken
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Controleer of project bestaat en van deze client is
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        clientId: client.id
      }
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    const data = await request.json();
    
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        websiteUrl: data.websiteUrl !== undefined ? data.websiteUrl : undefined,
        description: data.description !== undefined ? data.description : undefined,
        targetAudience: data.targetAudience !== undefined ? data.targetAudience : undefined,
        brandVoice: data.brandVoice !== undefined ? data.brandVoice : undefined,
        niche: data.niche !== undefined ? data.niche : undefined,
        keywords: data.keywords !== undefined ? data.keywords : undefined,
        contentPillars: data.contentPillars !== undefined ? data.contentPillars : undefined,
        writingStyle: data.writingStyle !== undefined ? data.writingStyle : undefined,
        customInstructions: data.customInstructions !== undefined ? data.customInstructions : undefined,
        businessGoals: data.businessGoals !== undefined ? data.businessGoals : undefined,
        uniqueSellingPoints: data.uniqueSellingPoints !== undefined ? data.uniqueSellingPoints : undefined,
        competitors: data.competitors !== undefined ? data.competitors : undefined,
        isPrimary: data.isPrimary !== undefined ? data.isPrimary : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
        // Bol.com settings
        bolcomClientId: data.bolcomClientId !== undefined ? data.bolcomClientId : undefined,
        bolcomClientSecret: data.bolcomClientSecret !== undefined ? data.bolcomClientSecret : undefined,
        bolcomAffiliateId: data.bolcomAffiliateId !== undefined ? data.bolcomAffiliateId : undefined,
        bolcomEnabled: data.bolcomEnabled !== undefined ? data.bolcomEnabled : undefined,
        // Language setting
        language: data.language !== undefined ? data.language : undefined,
      }
    });

    return NextResponse.json({
      success: true,
      project: updatedProject
    });

  } catch (error: any) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Fout bij bijwerken project' },
      { status: 500 }
    );
  }
}

// PATCH - Snelle project updates (zoals language)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Controleer of project bestaat en van deze client is
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        clientId: client.id
      }
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    const data = await request.json();
    
    // Filter out undefined values
    const updateData: any = {};
    if (data.language !== undefined) updateData.language = data.language;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.websiteUrl !== undefined) updateData.websiteUrl = data.websiteUrl;
    if (data.description !== undefined) updateData.description = data.description;
    
    // WordPress integration fields
    if (data.wordpressUrl !== undefined) updateData.wordpressUrl = data.wordpressUrl;
    if (data.wordpressUsername !== undefined) updateData.wordpressUsername = data.wordpressUsername;
    if (data.wordpressPassword !== undefined) updateData.wordpressPassword = data.wordpressPassword;
    if (data.wordpressCategory !== undefined) updateData.wordpressCategory = data.wordpressCategory;
    if (data.wordpressAutoPublish !== undefined) updateData.wordpressAutoPublish = data.wordpressAutoPublish;
    
    // Bol.com integration fields
    if (data.bolcomClientId !== undefined) updateData.bolcomClientId = data.bolcomClientId;
    if (data.bolcomClientSecret !== undefined) updateData.bolcomClientSecret = data.bolcomClientSecret;
    if (data.bolcomAffiliateId !== undefined) updateData.bolcomAffiliateId = data.bolcomAffiliateId;
    if (data.bolcomEnabled !== undefined) updateData.bolcomEnabled = data.bolcomEnabled;
    
    // TradeTracker integration fields
    if (data.tradeTrackerSiteId !== undefined) updateData.tradeTrackerSiteId = data.tradeTrackerSiteId;
    if (data.tradeTrackerPassphrase !== undefined) updateData.tradeTrackerPassphrase = data.tradeTrackerPassphrase;
    if (data.tradeTrackerCampaignId !== undefined) updateData.tradeTrackerCampaignId = data.tradeTrackerCampaignId;
    if (data.tradeTrackerEnabled !== undefined) updateData.tradeTrackerEnabled = data.tradeTrackerEnabled;
    
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      project: updatedProject
    });

  } catch (error: any) {
    console.error('Error patching project:', error);
    return NextResponse.json(
      { error: 'Fout bij bijwerken project' },
      { status: 500 }
    );
  }
}

// DELETE - Project verwijderen
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Controleer of project bestaat en van deze client is
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        clientId: client.id
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Verwijder project (cascade delete zorgt voor knowledge base items)
    await prisma.project.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Project verwijderd'
    });

  } catch (error: any) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Fout bij verwijderen project' },
      { status: 500 }
    );
  }
}
