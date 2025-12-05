export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Get single admin project
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const project = await prisma.adminProject.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            blogPosts: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const transformedProject = {
      ...project,
      blogPostCount: project._count?.blogPosts || 0,
      _count: undefined
    };

    return NextResponse.json({ project: transformedProject });

  } catch (error: any) {
    console.error('Error fetching admin project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT - Update admin project
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const data = await request.json();
    
    // Check if project exists
    const existingProject = await prisma.adminProject.findUnique({
      where: { id: params.id }
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Validation
    if (data.name !== undefined && !data.name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    const project = await prisma.adminProject.update({
      where: { id: params.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.websiteUrl !== undefined && { websiteUrl: data.websiteUrl || null }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.wordpressUrl !== undefined && { wordpressUrl: data.wordpressUrl || null }),
        ...(data.wordpressUsername !== undefined && { wordpressUsername: data.wordpressUsername || null }),
        ...(data.wordpressPassword !== undefined && { wordpressPassword: data.wordpressPassword || null }),
        ...(data.wordpressCategory !== undefined && { wordpressCategory: data.wordpressCategory || null }),
        ...(data.wordpressAutoPublish !== undefined && { wordpressAutoPublish: data.wordpressAutoPublish }),
        ...(data.language !== undefined && { language: data.language }),
        ...(data.niche !== undefined && { niche: data.niche || null }),
        ...(data.targetAudience !== undefined && { targetAudience: data.targetAudience || null }),
        ...(data.brandVoice !== undefined && { brandVoice: data.brandVoice || null }),
        ...(data.keywords !== undefined && { keywords: data.keywords || [] }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      }
    });

    return NextResponse.json({
      success: true,
      project,
      message: 'Admin project updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating admin project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE - Delete admin project
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    // Check if project exists
    const existingProject = await prisma.adminProject.findUnique({
      where: { id: params.id }
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Delete the project (cascades to blog posts)
    await prisma.adminProject.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Admin project deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting admin project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
