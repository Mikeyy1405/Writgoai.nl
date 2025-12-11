/**
 * Project Helper Functions
 * 
 * Helper functions for working with projects in the "Invisible Project Layer" architecture.
 * 
 * In Writgo's business model:
 * - 1 Client = 1 Business = 1 Website = 1 Default Project
 * - The project layer exists in the backend but is hidden from the UI
 * - All content, WordPress integrations, and platforms are tied to the default project
 */

import { prisma } from './db';

/**
 * Get the default (primary) project for a client
 * 
 * This function retrieves the primary project for a client. In Writgo's simplified UX,
 * clients don't see "projects" - they just see their business info. But technically,
 * all their content is tied to a default project.
 * 
 * @param clientId - The client's ID
 * @param createIfNotExists - If true, creates a default project if none exists
 * @returns The default project, or null if not found and createIfNotExists is false
 */
export async function getClientDefaultProject(
  clientId: string,
  createIfNotExists: boolean = true
): Promise<any | null> {
  try {
    // First, try to find an existing primary project
    let project = await prisma.project.findFirst({
      where: {
        clientId,
        isPrimary: true,
        isActive: true
      }
    });

    // If no primary project found, look for any active project
    if (!project) {
      project = await prisma.project.findFirst({
        where: {
          clientId,
          isActive: true
        },
        orderBy: {
          createdAt: 'asc' // Get the oldest/first project
        }
      });

      // If found, mark it as primary
      if (project) {
        project = await prisma.project.update({
          where: { id: project.id },
          data: { isPrimary: true }
        });
        console.log(`[Project Helper] Marked project ${project.id} as primary for client ${clientId}`);
      }
    }

    // If still no project and createIfNotExists is true, create one
    if (!project && createIfNotExists) {
      // Get client info for project details
      const client = await prisma.client.findUnique({
        where: { id: clientId }
      });

      if (!client) {
        console.error(`[Project Helper] Client ${clientId} not found, cannot create default project`);
        return null;
      }

      project = await prisma.project.create({
        data: {
          clientId,
          name: client.companyName || client.name,
          websiteUrl: client.website || 'https://example.com',
          description: `Standaard project voor ${client.companyName || client.name}`,
          isPrimary: true,
          isActive: true,
          targetAudience: null,
          brandVoice: null,
          niche: null,
          keywords: [],
          contentPillars: [],
          writingStyle: null,
          customInstructions: null
        }
      });

      console.log(`[Project Helper] Auto-created default project ${project.id} for client ${clientId}`);
    }

    return project;
  } catch (error) {
    console.error('[Project Helper] Error getting default project:', error);
    return null;
  }
}

/**
 * Get the default project for a client by email
 * 
 * Convenience function to get default project using client email instead of ID
 * 
 * @param clientEmail - The client's email
 * @param createIfNotExists - If true, creates a default project if none exists
 * @returns The default project, or null if client not found
 */
export async function getClientDefaultProjectByEmail(
  clientEmail: string,
  createIfNotExists: boolean = true
): Promise<any | null> {
  try {
    const client = await prisma.client.findUnique({
      where: { email: clientEmail }
    });

    if (!client) {
      console.error(`[Project Helper] Client with email ${clientEmail} not found`);
      return null;
    }

    return getClientDefaultProject(client.id, createIfNotExists);
  } catch (error) {
    console.error('[Project Helper] Error getting default project by email:', error);
    return null;
  }
}

/**
 * Update the default project settings
 * 
 * This is used when a client updates their "business info" in the UI.
 * They don't know they're updating a project - they think they're updating their business details.
 * 
 * @param clientId - The client's ID
 * @param updates - Object with fields to update
 * @returns The updated project, or null if error
 */
export async function updateClientDefaultProject(
  clientId: string,
  updates: {
    name?: string;
    websiteUrl?: string;
    description?: string;
    targetAudience?: string;
    brandVoice?: string;
    niche?: string;
    keywords?: string[];
    contentPillars?: string[];
    writingStyle?: string;
    customInstructions?: string;
  }
): Promise<any | null> {
  try {
    const project = await getClientDefaultProject(clientId, true);

    if (!project) {
      console.error(`[Project Helper] No default project found for client ${clientId}`);
      return null;
    }

    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: updates
    });

    console.log(`[Project Helper] Updated default project ${project.id} for client ${clientId}`);
    return updatedProject;
  } catch (error) {
    console.error('[Project Helper] Error updating default project:', error);
    return null;
  }
}

/**
 * Check if a client has multiple projects (legacy case)
 * 
 * In the new Writgo model, clients should only have 1 project.
 * This function helps identify legacy clients that have multiple projects.
 * 
 * @param clientId - The client's ID
 * @returns True if client has more than 1 active project
 */
export async function hasMultipleProjects(clientId: string): Promise<boolean> {
  try {
    const projectCount = await prisma.project.count({
      where: {
        clientId,
        isActive: true
      }
    });

    return projectCount > 1;
  } catch (error) {
    console.error('[Project Helper] Error checking multiple projects:', error);
    return false;
  }
}
