export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Fetch a specific project
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check authorization: user must own the project or be admin
    if (
      project.clientId !== session.user.id && 
      session.user.role !== 'admin'
    ) {
      return NextResponse.json(
        { error: 'Unauthorized to access this project' },
        { status: 403 }
      );
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Failed to fetch project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT - Update a project
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.id;
    const body = await request.json();

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (
      existingProject.clientId !== session.user.id && 
      session.user.role !== 'admin'
    ) {
      return NextResponse.json(
        { error: 'Unauthorized to update this project' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.websiteUrl !== undefined) updateData.websiteUrl = body.websiteUrl.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.isPrimary !== undefined) updateData.isPrimary = body.isPrimary;
    if (body.settings !== undefined) updateData.settings = body.settings;
    
    // Content settings
    if (body.targetAudience !== undefined) updateData.targetAudience = body.targetAudience;
    if (body.brandVoice !== undefined) updateData.brandVoice = body.brandVoice;
    if (body.niche !== undefined) updateData.niche = body.niche;
    if (body.keywords !== undefined) updateData.keywords = body.keywords;
    if (body.contentPillars !== undefined) updateData.contentPillars = body.contentPillars;
    if (body.writingStyle !== undefined) updateData.writingStyle = body.writingStyle;
    
    // WordPress settings
    if (body.wordpressUrl !== undefined) updateData.wordpressUrl = body.wordpressUrl;
    if (body.wordpressUsername !== undefined) updateData.wordpressUsername = body.wordpressUsername;
    if (body.wordpressPassword !== undefined) updateData.wordpressPassword = body.wordpressPassword;
    if (body.wordpressCategory !== undefined) updateData.wordpressCategory = body.wordpressCategory;
    if (body.wordpressAutoPublish !== undefined) updateData.wordpressAutoPublish = body.wordpressAutoPublish;

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Project succesvol bijgewerkt',
      project: updatedProject
    });
  } catch (error: any) {
    console.error('Failed to update project:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a project
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.id;

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (
      existingProject.clientId !== session.user.id && 
      session.user.role !== 'admin'
    ) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this project' },
        { status: 403 }
      );
    }

    // Prevent deleting primary project if it's the only one
    if (existingProject.isPrimary) {
      const projectCount = await prisma.project.count({
        where: { clientId: existingProject.clientId }
      });

      if (projectCount === 1) {
        return NextResponse.json(
          { error: 'Cannot delete the only project. Create another project first.' },
          { status: 400 }
        );
      }
    }

    // Delete project (CASCADE will handle related content)
    await prisma.project.delete({
      where: { id: projectId }
    });

    return NextResponse.json({
      success: true,
      message: 'Project succesvol verwijderd'
    });
  } catch (error: any) {
    console.error('Failed to delete project:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete project' },
      { status: 500 }
    );
  }
}
