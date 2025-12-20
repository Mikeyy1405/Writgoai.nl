
/**
 * Project Members API
 * Handles inviting, listing, updating, and removing project collaborators
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { randomBytes } from 'crypto';
import { sendEmail } from '@/lib/email';

/**
 * GET - List all collaborators for a project
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

    // Get all collaborators
    const collaborators = await prisma.projectCollaborator.findMany({
      where: {
        projectId,
        revokedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ collaborators });
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collaborators' },
      { status: 500 }
    );
  }
}

/**
 * POST - Invite a new collaborator
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

    const body = await req.json();
    const { projectId, email, name, role } = body;

    if (!projectId || !email || !role) {
      return NextResponse.json(
        { error: 'Project ID, email, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['employee', 'client'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be either "employee" or "client"' },
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

    // Check if already invited
    const existing = await prisma.projectCollaborator.findUnique({
      where: {
        projectId_email: {
          projectId,
          email,
        },
      },
    });

    if (existing && !existing.revokedAt) {
      return NextResponse.json(
        { error: 'This email is already invited to this project' },
        { status: 400 }
      );
    }

    // Generate access token
    const accessToken = randomBytes(32).toString('hex');

    // Create or update collaborator
    const collaborator = existing
      ? await prisma.projectCollaborator.update({
          where: { id: existing.id },
          data: {
            name,
            role,
            status: 'pending',
            accessToken,
            invitedAt: new Date(),
            revokedAt: null,
          },
        })
      : await prisma.projectCollaborator.create({
          data: {
            projectId,
            email,
            name,
            role,
            status: 'pending',
            accessToken,
          },
        });

    // Send invitation email
    const inviteUrl = `${process.env.NEXTAUTH_URL}/project-view/${accessToken}`;
    
    try {
      await sendEmail({
        to: email,
        subject: `Uitnodiging voor project: ${project.name}`,
        html: `
          <h2>Je bent uitgenodigd voor een project</h2>
          <p>Hallo ${name || email},</p>
          <p>${client.name || client.email} heeft je uitgenodigd om samen te werken aan het project <strong>${project.name}</strong>.</p>
          <p>Je rol: <strong>${role === 'client' ? 'Klant' : 'Medewerker'}</strong></p>
          <p><a href="${inviteUrl}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">Bekijk Project</a></p>
          <p>Of kopieer deze link: ${inviteUrl}</p>
          <p>Met vriendelijke groet,<br>WritgoAI Team</p>
        `
      });
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      collaborator,
      inviteUrl,
    });
  } catch (error) {
    console.error('Error inviting collaborator:', error);
    return NextResponse.json(
      { error: 'Failed to invite collaborator' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update collaborator role
 */
export async function PATCH(req: NextRequest) {
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

    const body = await req.json();
    const { collaboratorId, role } = body;

    if (!collaboratorId || !role) {
      return NextResponse.json(
        { error: 'Collaborator ID and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['employee', 'client'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be either "employee" or "client"' },
        { status: 400 }
      );
    }

    // Get collaborator with project info
    const collaborator = await prisma.projectCollaborator.findUnique({
      where: { id: collaboratorId },
      include: { project: true },
    });

    if (!collaborator) {
      return NextResponse.json(
        { error: 'Collaborator not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (collaborator.project.clientId !== client.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update role
    const updated = await prisma.projectCollaborator.update({
      where: { id: collaboratorId },
      data: { role },
    });

    return NextResponse.json({
      success: true,
      collaborator: updated,
    });
  } catch (error) {
    console.error('Error updating collaborator:', error);
    return NextResponse.json(
      { error: 'Failed to update collaborator' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove/revoke a collaborator
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

    const collaboratorId = req.nextUrl.searchParams.get('collaboratorId');
    if (!collaboratorId) {
      return NextResponse.json(
        { error: 'Collaborator ID is required' },
        { status: 400 }
      );
    }

    // Get collaborator with project info
    const collaborator = await prisma.projectCollaborator.findUnique({
      where: { id: collaboratorId },
      include: { project: true },
    });

    if (!collaborator) {
      return NextResponse.json(
        { error: 'Collaborator not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (collaborator.project.clientId !== client.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Soft delete by setting revokedAt
    await prisma.projectCollaborator.update({
      where: { id: collaboratorId },
      data: {
        revokedAt: new Date(),
        status: 'revoked',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    return NextResponse.json(
      { error: 'Failed to remove collaborator' },
      { status: 500 }
    );
  }
}
