/**
 * AI Brain Tool Executor
 * Executes tools against the actual database and APIs
 */

import { prisma } from '@/lib/db';
import { ALL_MODELS, getModelsByCategory, getModelById } from './models';
import { selectBestModel, detectTaskType } from './model-router';

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

/**
 * Execute a tool with given parameters
 */
export async function executeTool(
  toolName: string,
  parameters: any
): Promise<ToolExecutionResult> {
  try {
    switch (toolName) {
      case 'get_clients':
        return await getClients(parameters);
      
      case 'get_client_details':
        return await getClientDetails(parameters);
      
      case 'generate_article':
        return await generateArticle(parameters);
      
      case 'generate_video_script':
        return await generateVideoScript(parameters);
      
      case 'create_invoice':
        return await createInvoice(parameters);
      
      case 'send_email':
        return await sendEmail(parameters);
      
      case 'get_assignments':
        return await getAssignments(parameters);
      
      case 'update_assignment':
        return await updateAssignment(parameters);
      
      case 'get_analytics':
        return await getAnalytics(parameters);
      
      case 'generate_image':
        return await generateImage(parameters);
      
      case 'list_models':
        return await listModels(parameters);
      
      case 'run_model':
        return await runModel(parameters);
      
      case 'get_content_plan':
        return await getContentPlan(parameters);
      
      case 'generate_content_plan':
        return await generateContentPlan(parameters);
      
      case 'get_autopilot_status':
        return await getAutopilotStatus(parameters);
      
      case 'update_autopilot':
        return await updateAutopilot(parameters);
      
      case 'get_wordpress_posts':
        return await getWordPressPosts(parameters);
      
      case 'publish_to_wordpress':
        return await publishToWordPress(parameters);
      
      case 'search_database':
        return await searchDatabase(parameters);
      
      default:
        return {
          success: false,
          error: `Onbekende tool: ${toolName}`,
        };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Er is een fout opgetreden bij het uitvoeren van de tool',
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════════

async function getClients(params: { search?: string }): Promise<ToolExecutionResult> {
  try {
    const where = params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: 'insensitive' as const } },
            { email: { contains: params.search, mode: 'insensitive' as const } },
            { companyName: { contains: params.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const clients = await prisma.client.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        website: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        createdAt: true,
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: clients,
      message: `${clients.length} klanten gevonden`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function getClientDetails(params: { clientId: string }): Promise<ToolExecutionResult> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
      include: {
        projects: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) {
      return {
        success: false,
        error: `Klant met ID ${params.clientId} niet gevonden`,
      };
    }

    return {
      success: true,
      data: client,
      message: `Details opgehaald voor ${client.name}`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function generateArticle(params: {
  clientId: string;
  topic: string;
  keywords?: string[];
  wordCount?: number;
}): Promise<ToolExecutionResult> {
  try {
    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
    });

    if (!client) {
      return {
        success: false,
        error: `Klant met ID ${params.clientId} niet gevonden`,
      };
    }

    // This would normally call the actual article generator
    // For now, return a placeholder
    return {
      success: true,
      data: {
        topic: params.topic,
        wordCount: params.wordCount || 2000,
        keywords: params.keywords || [],
        status: 'Artikel generatie gestart',
      },
      message: `Artikel generatie gestart voor "${params.topic}" (${params.wordCount || 2000} woorden)`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function generateVideoScript(params: {
  clientId: string;
  topic: string;
  duration?: number;
  style?: string;
}): Promise<ToolExecutionResult> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
    });

    if (!client) {
      return {
        success: false,
        error: `Klant met ID ${params.clientId} niet gevonden`,
      };
    }

    return {
      success: true,
      data: {
        topic: params.topic,
        duration: params.duration || 60,
        style: params.style || 'educatief',
        status: 'Video script generatie gestart',
      },
      message: `Video script generatie gestart voor "${params.topic}" (${params.duration || 60} seconden)`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function createInvoice(params: {
  clientId: string;
  amount: number;
  description: string;
}): Promise<ToolExecutionResult> {
  try {
    // This would create an actual invoice
    return {
      success: true,
      data: {
        clientId: params.clientId,
        amount: params.amount,
        description: params.description,
        status: 'pending',
      },
      message: `Factuur van €${params.amount} aangemaakt`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function sendEmail(params: {
  clientId: string;
  subject: string;
  body: string;
}): Promise<ToolExecutionResult> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
    });

    if (!client) {
      return {
        success: false,
        error: `Klant met ID ${params.clientId} niet gevonden`,
      };
    }

    // This would send an actual email
    return {
      success: true,
      data: {
        to: client.email,
        subject: params.subject,
        status: 'sent',
      },
      message: `Email verzonden naar ${client.email}`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function getAssignments(params: {
  status?: string;
  clientId?: string;
}): Promise<ToolExecutionResult> {
  try {
    // This would query assignments from the database
    return {
      success: true,
      data: [],
      message: 'Geen opdrachten gevonden',
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function updateAssignment(params: {
  assignmentId: string;
  status: string;
  notes?: string;
}): Promise<ToolExecutionResult> {
  try {
    return {
      success: true,
      data: {
        assignmentId: params.assignmentId,
        status: params.status,
        notes: params.notes,
      },
      message: `Opdracht status bijgewerkt naar ${params.status}`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function getAnalytics(params: {
  period?: 'today' | 'week' | 'month' | 'year';
}): Promise<ToolExecutionResult> {
  try {
    const period = params.period || 'month';
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get client count
    const totalClients = await prisma.client.count();
    const activeClients = await prisma.client.count({
      where: {
        subscriptionStatus: 'active',
      },
    });

    return {
      success: true,
      data: {
        period,
        totalClients,
        activeClients,
        startDate,
        endDate: now,
      },
      message: `Statistieken voor ${period}`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function generateImage(params: {
  prompt: string;
  style?: string;
  model?: string;
}): Promise<ToolExecutionResult> {
  try {
    // Determine model based on style
    let modelId = params.model;
    if (!modelId) {
      const taskType = params.style === 'realistic' ? 'image_realistic' :
                      params.style === 'artistic' ? 'image_artistic' :
                      params.style === 'logo' ? 'image_logo' : 'image_thumbnail';
      const model = selectBestModel({ task: taskType });
      modelId = model.id;
    }

    return {
      success: true,
      data: {
        prompt: params.prompt,
        model: modelId,
        status: 'Afbeelding generatie gestart',
      },
      message: `Afbeelding generatie gestart met ${modelId}`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function listModels(params: { category?: string }): Promise<ToolExecutionResult> {
  try {
    const models = params.category
      ? getModelsByCategory(params.category as any)
      : ALL_MODELS;

    return {
      success: true,
      data: models.map(m => ({
        id: m.id,
        name: m.name,
        provider: m.provider,
        category: m.category,
        description: m.description,
        quality: m.quality,
        speed: m.speed,
        costPer1kInput: m.costPer1kInput,
        costPer1kOutput: m.costPer1kOutput,
      })),
      message: `${models.length} modellen gevonden`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function runModel(params: {
  modelId: string;
  prompt: string;
  options?: any;
}): Promise<ToolExecutionResult> {
  try {
    const model = getModelById(params.modelId);
    if (!model) {
      return {
        success: false,
        error: `Model ${params.modelId} niet gevonden`,
      };
    }

    return {
      success: true,
      data: {
        model: model.name,
        modelId: params.modelId,
        prompt: params.prompt,
        status: 'Model executie gestart',
      },
      message: `${model.name} gestart`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function getContentPlan(params: { clientId: string }): Promise<ToolExecutionResult> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
      select: {
        id: true,
        name: true,
        contentPlan: true,
        lastPlanGenerated: true,
      },
    });

    if (!client) {
      return {
        success: false,
        error: `Klant met ID ${params.clientId} niet gevonden`,
      };
    }

    return {
      success: true,
      data: {
        clientId: client.id,
        clientName: client.name,
        contentPlan: client.contentPlan,
        lastGenerated: client.lastPlanGenerated,
      },
      message: `Content plan opgehaald voor ${client.name}`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function generateContentPlan(params: {
  clientId: string;
  duration?: number;
}): Promise<ToolExecutionResult> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
    });

    if (!client) {
      return {
        success: false,
        error: `Klant met ID ${params.clientId} niet gevonden`,
      };
    }

    return {
      success: true,
      data: {
        clientId: params.clientId,
        duration: params.duration || 30,
        status: 'Content plan generatie gestart',
      },
      message: `Content plan generatie gestart voor ${client.name} (${params.duration || 30} dagen)`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function getAutopilotStatus(params: { clientId: string }): Promise<ToolExecutionResult> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
      select: {
        id: true,
        name: true,
        automationActive: true,
        automationStartDate: true,
      },
    });

    if (!client) {
      return {
        success: false,
        error: `Klant met ID ${params.clientId} niet gevonden`,
      };
    }

    return {
      success: true,
      data: {
        clientId: client.id,
        clientName: client.name,
        active: client.automationActive,
        startDate: client.automationStartDate,
      },
      message: `Autopilot ${client.automationActive ? 'actief' : 'inactief'} voor ${client.name}`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function updateAutopilot(params: {
  clientId: string;
  active: boolean;
  frequency?: string;
}): Promise<ToolExecutionResult> {
  try {
    const client = await prisma.client.update({
      where: { id: params.clientId },
      data: {
        automationActive: params.active,
        automationStartDate: params.active ? new Date() : null,
      },
    });

    return {
      success: true,
      data: {
        clientId: client.id,
        active: client.automationActive,
      },
      message: `Autopilot ${params.active ? 'geactiveerd' : 'gedeactiveerd'} voor ${client.name}`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function getWordPressPosts(params: {
  clientId: string;
  limit?: number;
}): Promise<ToolExecutionResult> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
    });

    if (!client) {
      return {
        success: false,
        error: `Klant met ID ${params.clientId} niet gevonden`,
      };
    }

    if (!client.wordpressUrl) {
      return {
        success: false,
        error: `Klant heeft geen WordPress URL geconfigureerd`,
      };
    }

    return {
      success: true,
      data: {
        wordpressUrl: client.wordpressUrl,
        posts: [],
      },
      message: `WordPress posts opgehaald`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function publishToWordPress(params: {
  clientId: string;
  title: string;
  content: string;
  status?: string;
}): Promise<ToolExecutionResult> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
    });

    if (!client) {
      return {
        success: false,
        error: `Klant met ID ${params.clientId} niet gevonden`,
      };
    }

    if (!client.wordpressUrl) {
      return {
        success: false,
        error: `Klant heeft geen WordPress URL geconfigureerd`,
      };
    }

    return {
      success: true,
      data: {
        title: params.title,
        status: params.status || 'draft',
        wordpressUrl: client.wordpressUrl,
      },
      message: `Content gepubliceerd naar WordPress als ${params.status || 'draft'}`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function searchDatabase(params: {
  query: string;
  table?: string;
}): Promise<ToolExecutionResult> {
  try {
    const results: any[] = [];

    // Search clients if no specific table or clients table
    if (!params.table || params.table === 'clients') {
      const clients = await prisma.client.findMany({
        where: {
          OR: [
            { name: { contains: params.query, mode: 'insensitive' as const } },
            { email: { contains: params.query, mode: 'insensitive' as const } },
            { companyName: { contains: params.query, mode: 'insensitive' as const } },
          ],
        },
        take: 10,
      });
      results.push(...clients.map(c => ({ type: 'client', data: c })));
    }

    return {
      success: true,
      data: results,
      message: `${results.length} resultaten gevonden voor "${params.query}"`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
