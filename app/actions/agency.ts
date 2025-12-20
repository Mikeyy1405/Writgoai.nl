'use server';

/**
 * 🏢 Agency Server Actions
 * 
 * Consolidates all business/agency operations:
 * - Assignment management
 * - Request management
 * - Invoice management
 * - Project management
 * 
 * Replaces 4+ API routes:
 * - /api/client/assignments
 * - /api/client/requests
 * - /api/client/invoices
 * - /api/client/projects
 */

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { auth, getAuthenticatedClient } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

// ═════════════════════════════════════════════════════════════════════
// ASSIGNMENTS
// ═════════════════════════════════════════════════════════════════════

/**
 * ➕ Create Assignment
 */
export async function createAssignment(input: {
  title: string;
  description: string;
  type: string;
  deadline?: Date;
}) {
  try {
    const client = await getAuthenticatedClient();

    const assignment = await prisma.assignment.create({
      data: {
        clientId: client.id,
        title: input.title,
        description: input.description,
        type: input.type,
        deadline: input.deadline,
        status: 'pending',
      },
    });

    revalidatePath('/client-portal/opdrachten');

    return { success: true, assignment };
  } catch (error: any) {
    console.error('❌ Error creating assignment:', error);
    throw new Error('Fout bij aanmaken van opdracht');
  }
}

/**
 * 📋 Get Assignments
 */
export async function getAssignments() {
  try {
    const client = await getAuthenticatedClient();

    const assignments = await prisma.assignment.findMany({
      where: { clientId: client.id },
      orderBy: [
        { status: 'asc' },
        { deadline: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return { success: true, assignments };
  } catch (error: any) {
    console.error('❌ Error fetching assignments:', error);
    throw new Error('Fout bij ophalen van opdrachten');
  }
}

/**
 * ✏️ Update Assignment
 */
export async function updateAssignment(assignmentId: string, updates: any) {
  try {
    const client = await getAuthenticatedClient();

    // Verify ownership
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        clientId: client.id,
      },
    });

    if (!assignment) {
      throw new Error('Opdracht niet gevonden of geen toegang');
    }

    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: updates,
    });

    revalidatePath('/client-portal/opdrachten');

    return { success: true, assignment: updated };
  } catch (error: any) {
    console.error('❌ Error updating assignment:', error);
    throw new Error('Fout bij updaten van opdracht');
  }
}

/**
 * 🗑️ Delete Assignment
 */
export async function deleteAssignment(assignmentId: string) {
  try {
    const client = await getAuthenticatedClient();

    // Verify ownership
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        clientId: client.id,
      },
    });

    if (!assignment) {
      throw new Error('Opdracht niet gevonden of geen toegang');
    }

    await prisma.assignment.delete({
      where: { id: assignmentId },
    });

    revalidatePath('/client-portal/opdrachten');

    return { success: true };
  } catch (error: any) {
    console.error('❌ Error deleting assignment:', error);
    throw new Error('Fout bij verwijderen van opdracht');
  }
}

// ═════════════════════════════════════════════════════════════════════
// REQUESTS
// ═════════════════════════════════════════════════════════════════════

/**
 * ➕ Create Request
 */
export async function createRequest(input: {
  title: string;
  description: string;
  type: string;
  urgency?: 'low' | 'medium' | 'high';
}) {
  try {
    const client = await getAuthenticatedClient();

    const request = await prisma.request.create({
      data: {
        clientId: client.id,
        title: input.title,
        description: input.description,
        type: input.type,
        urgency: input.urgency || 'medium',
        status: 'open',
      },
    });

    // Send email notification to admin
    try {
      await sendEmail(
        'info@WritgoAI.nl',
        `Nieuw verzoek van ${client.name}`,
        `
          <h2>Nieuw verzoek ontvangen</h2>
          <p><strong>Client:</strong> ${client.name} (${client.email})</p>
          <p><strong>Titel:</strong> ${input.title}</p>
          <p><strong>Type:</strong> ${input.type}</p>
          <p><strong>Urgentie:</strong> ${input.urgency || 'medium'}</p>
          <p><strong>Beschrijving:</strong></p>
          <p>${input.description}</p>
        `
      );
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
    }

    revalidatePath('/client-portal/verzoeken');

    return { success: true, request };
  } catch (error: any) {
    console.error('❌ Error creating request:', error);
    throw new Error('Fout bij aanmaken van verzoek');
  }
}

/**
 * 📋 Get Requests
 */
export async function getRequests() {
  try {
    const client = await getAuthenticatedClient();

    const requests = await prisma.request.findMany({
      where: { clientId: client.id },
      orderBy: [
        { status: 'asc' },
        { urgency: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return { success: true, requests };
  } catch (error: any) {
    console.error('❌ Error fetching requests:', error);
    throw new Error('Fout bij ophalen van verzoeken');
  }
}

/**
 * ✏️ Update Request
 */
export async function updateRequest(requestId: string, updates: any) {
  try {
    const client = await getAuthenticatedClient();

    // Verify ownership
    const request = await prisma.request.findFirst({
      where: {
        id: requestId,
        clientId: client.id,
      },
    });

    if (!request) {
      throw new Error('Verzoek niet gevonden of geen toegang');
    }

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: updates,
    });

    revalidatePath('/client-portal/verzoeken');

    return { success: true, request: updated };
  } catch (error: any) {
    console.error('❌ Error updating request:', error);
    throw new Error('Fout bij updaten van verzoek');
  }
}

// ═════════════════════════════════════════════════════════════════════
// INVOICES
// ═════════════════════════════════════════════════════════════════════

/**
 * 📋 Get Invoices
 */
export async function getInvoices() {
  try {
    const client = await getAuthenticatedClient();

    const invoices = await prisma.invoice.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, invoices };
  } catch (error: any) {
    console.error('❌ Error fetching invoices:', error);
    throw new Error('Fout bij ophalen van facturen');
  }
}

/**
 * 📄 Get Invoice
 */
export async function getInvoice(invoiceId: string) {
  try {
    const client = await getAuthenticatedClient();

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        clientId: client.id,
      },
      include: {
        client: {
          select: {
            name: true,
            email: true,
            companyName: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new Error('Factuur niet gevonden of geen toegang');
    }

    return { success: true, invoice };
  } catch (error: any) {
    console.error('❌ Error fetching invoice:', error);
    throw new Error('Fout bij ophalen van factuur');
  }
}

/**
 * 💳 Pay Invoice
 */
export async function payInvoice(invoiceId: string) {
  try {
    const client = await getAuthenticatedClient();

    // Verify ownership
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        clientId: client.id,
      },
    });

    if (!invoice) {
      throw new Error('Factuur niet gevonden of geen toegang');
    }

    if (invoice.status === 'paid') {
      throw new Error('Factuur is al betaald');
    }

    // In production, integrate with Stripe/Mollie here
    // For now, just mark as pending
    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'pending',
      },
    });

    revalidatePath('/client-portal/facturen');

    return { success: true, invoice: updated };
  } catch (error: any) {
    console.error('❌ Error paying invoice:', error);
    throw new Error('Fout bij betalen van factuur');
  }
}

// ═════════════════════════════════════════════════════════════════════
// PROJECTS
// ═════════════════════════════════════════════════════════════════════

/**
 * 📋 Get Projects
 */
export async function getProjects() {
  try {
    const client = await getAuthenticatedClient();

    // Get owned projects
    const ownedProjects = await prisma.project.findMany({
      where: { clientId: client.id },
      include: {
        _count: {
          select: {
            savedContent: true,
            knowledgeBase: true,
          },
        },
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Get collaborator projects
    const collaboratorProjects = await prisma.projectCollaborator.findMany({
      where: {
        email: client.email,
        status: 'active',
        revokedAt: null,
      },
      include: {
        project: {
          include: {
            _count: {
              select: {
                savedContent: true,
                knowledgeBase: true,
              },
            },
          },
        },
      },
    });

    // Transform owned projects
    const owned = ownedProjects.map((project: any) => ({
      ...project,
      knowledgeBaseCount: project._count?.knowledgeBase || 0,
      savedContentCount: project._count?.savedContent || 0,
      isOwner: true,
      isCollaborator: false,
      _count: undefined,
    }));

    // Transform collaborator projects
    const collab = collaboratorProjects.map((c: any) => ({
      ...c.project,
      knowledgeBaseCount: c.project._count?.knowledgeBase || 0,
      savedContentCount: c.project._count?.savedContent || 0,
      isOwner: false,
      isCollaborator: true,
      collaboratorRole: c.role,
      _count: undefined,
    }));

    const allProjects = [...owned, ...collab];

    return {
      success: true,
      projects: allProjects,
      ownedCount: owned.length,
      collaboratorCount: collab.length,
    };
  } catch (error: any) {
    console.error('❌ Error fetching projects:', error);
    throw new Error('Fout bij ophalen van projecten');
  }
}

/**
 * ➕ Create Project
 */
export async function createProject(data: {
  name: string;
  description?: string;
  websiteUrl?: string;
  niche?: string;
  targetAudience?: string;
  isPrimary?: boolean;
}) {
  try {
    const client = await getAuthenticatedClient();

    // If setting as primary, unset other primary projects
    if (data.isPrimary) {
      await prisma.project.updateMany({
        where: { clientId: client.id, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const project = await prisma.project.create({
      data: {
        clientId: client.id,
        name: data.name,
        description: data.description,
        websiteUrl: data.websiteUrl,
        niche: data.niche,
        targetAudience: data.targetAudience,
        isPrimary: data.isPrimary || false,
      },
    });

    revalidatePath('/client-portal/projects');

    return { success: true, project };
  } catch (error: any) {
    console.error('❌ Error creating project:', error);
    throw new Error('Fout bij aanmaken van project');
  }
}

/**
 * ✏️ Update Project
 */
export async function updateProject(projectId: string, updates: any) {
  try {
    const client = await getAuthenticatedClient();

    // Verify ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      throw new Error('Project niet gevonden of geen toegang');
    }

    // If setting as primary, unset other primary projects
    if (updates.isPrimary) {
      await prisma.project.updateMany({
        where: { clientId: client.id, isPrimary: true, id: { not: projectId } },
        data: { isPrimary: false },
      });
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: updates,
    });

    revalidatePath('/client-portal/projects');
    revalidatePath(`/client-portal/projects/${projectId}`);

    return { success: true, project: updated };
  } catch (error: any) {
    console.error('❌ Error updating project:', error);
    throw new Error('Fout bij updaten van project');
  }
}

/**
 * 🗑️ Delete Project
 */
export async function deleteProject(projectId: string) {
  try {
    const client = await getAuthenticatedClient();

    // Verify ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      throw new Error('Project niet gevonden of geen toegang');
    }

    // Don't allow deleting primary project without setting another as primary
    if (project.isPrimary) {
      const otherProjects = await prisma.project.count({
        where: { clientId: client.id, id: { not: projectId } },
      });

      if (otherProjects > 0) {
        throw new Error(
          'Kan primair project niet verwijderen. Stel eerst een ander project in als primair.'
        );
      }
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    revalidatePath('/client-portal/projects');

    return { success: true };
  } catch (error: any) {
    console.error('❌ Error deleting project:', error);
    throw new Error(error.message || 'Fout bij verwijderen van project');
  }
}

/**
 * 📊 Get Project Stats
 */
export async function getProjectStats(projectId: string) {
  try {
    const client = await getAuthenticatedClient();

    // Verify access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      throw new Error('Project niet gevonden of geen toegang');
    }

    const [
      contentCount,
      articleIdeasCount,
      publishedCount,
      knowledgeBaseCount,
    ] = await Promise.all([
      prisma.savedContent.count({
        where: { projectId },
      }),
      prisma.articleIdea.count({
        where: { projectId },
      }),
      prisma.savedContent.count({
        where: { projectId, status: 'published' },
      }),
      prisma.knowledgeBase.count({
        where: { projectId },
      }),
    ]);

    return {
      success: true,
      stats: {
        contentCount,
        articleIdeasCount,
        publishedCount,
        knowledgeBaseCount,
      },
    };
  } catch (error: any) {
    console.error('❌ Error fetching project stats:', error);
    throw new Error('Fout bij ophalen van project statistieken');
  }
}
