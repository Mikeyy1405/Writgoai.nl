
/**
 * Knowledge Base API
 * Handles file uploads, listing, and deletion for project knowledge base
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { uploadFile, deleteFile } from '@/lib/s3';
import { parseFile, isSupportedFileType } from '@/lib/file-parser';
import { getBucketConfig } from '@/lib/aws-config';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * GET - List all knowledge base items for a project
 */
export async function GET(req: NextRequest) {
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

    const projectId = req.nextUrl.searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get all knowledge base items
    const knowledgeItems = await prisma.projectKnowledge.findMany({
      where: {
        projectId,
        isActive: true,
      },
      orderBy: [
        { importance: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ items: knowledgeItems });
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge base' },
      { status: 500 }
    );
  }
}

/**
 * POST - Upload a new file to knowledge base
 */
export async function POST(req: NextRequest) {
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

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const title = formData.get('title') as string;
    const category = formData.get('category') as string | null;
    const importance = (formData.get('importance') as string) || 'normal';
    const tags = formData.get('tags') as string;

    if (!file || !projectId || !title) {
      return NextResponse.json(
        { error: 'File, project ID, and title are required' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Check file type
    if (!isSupportedFileType(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Only PDF, DOCX, and XLSX files are supported.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse file content
    let parsedContent = '';
    try {
      const parsed = await parseFile(buffer, file.type);
      parsedContent = parsed.text;
    } catch (parseError) {
      console.error('Error parsing file:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse file content' },
        { status: 400 }
      );
    }

    // Upload to S3
    const config = getBucketConfig();
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `${config.folderPrefix}knowledge-base/${projectId}/${timestamp}-${sanitizedFileName}`;
    
    const fileUrl = await uploadFile(buffer, s3Key);

    // Save to database
    const knowledgeItem = await prisma.projectKnowledge.create({
      data: {
        projectId,
        title,
        type: 'file',
        content: parsedContent,
        category: category || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        importance,
        fileUrl,
        fileType: file.type,
        fileSize: file.size,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      item: knowledgeItem,
    });
  } catch (error) {
    console.error('Error uploading to knowledge base:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a knowledge base item
 */
export async function DELETE(req: NextRequest) {
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

    const itemId = req.nextUrl.searchParams.get('itemId');
    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    // Get the knowledge item with project info
    const knowledgeItem = await prisma.projectKnowledge.findUnique({
      where: { id: itemId },
      include: { project: true },
    });

    if (!knowledgeItem) {
      return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
    }

    // Verify ownership
    if (knowledgeItem.project.clientId !== client.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete from S3 if file exists
    if (knowledgeItem.fileUrl) {
      try {
        // Extract S3 key from URL
        const url = new URL(knowledgeItem.fileUrl);
        const s3Key = url.pathname.substring(1); // Remove leading slash
        await deleteFile(s3Key);
      } catch (deleteError) {
        console.error('Error deleting S3 file:', deleteError);
        // Continue with database deletion even if S3 deletion fails
      }
    }

    // Delete from database
    await prisma.projectKnowledge.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge base item:', error);
    return NextResponse.json(
      { error: 'Failed to delete knowledge base item' },
      { status: 500 }
    );
  }
}
