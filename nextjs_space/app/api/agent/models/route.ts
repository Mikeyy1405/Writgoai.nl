/**
 * AI Agent Models API Route
 * Returns available AI models with filtering options
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  ALL_MODELS,
  getModelsByCategory,
  getModelsByProvider,
  searchModels,
  ModelCategory,
} from '@/lib/ai-brain/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/agent/models
 * Get list of available AI models
 * 
 * Query parameters:
 * - category: Filter by category (chat, code, image, video, voice, audio, embedding, moderation)
 * - provider: Filter by provider (OpenAI, Anthropic, Google, etc.)
 * - search: Search by name, description, or ID
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = session.user as any;
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Alleen admins hebben toegang tot model informatie' },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get('category');
    const provider = searchParams.get('provider');
    const searchQuery = searchParams.get('search');

    let models = ALL_MODELS;

    // Apply filters
    if (category) {
      models = getModelsByCategory(category as ModelCategory);
    } else if (provider) {
      models = getModelsByProvider(provider);
    } else if (searchQuery) {
      models = searchModels(searchQuery);
    }

    // Return models with summary
    return NextResponse.json({
      count: models.length,
      models: models.map(model => ({
        id: model.id,
        name: model.name,
        provider: model.provider,
        category: model.category,
        description: model.description,
        strengths: model.strengths,
        weaknesses: model.weaknesses,
        contextWindow: model.contextWindow,
        maxOutput: model.maxOutput,
        costPer1kInput: model.costPer1kInput,
        costPer1kOutput: model.costPer1kOutput,
        speed: model.speed,
        quality: model.quality,
        bestFor: model.bestFor,
        languages: model.languages,
        multimodal: model.multimodal,
        streaming: model.streaming,
        reasoning: model.reasoning,
        releaseDate: model.releaseDate,
      })),
    });
  } catch (error: any) {
    console.error('Models API error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
