/**
 * GET /api/client/topical-authority/maps
 * 
 * Get all topical authority maps for a project
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { validateClient, validateProject } from '@/lib/services/content-plan-service';
import { TopicalAuthorityService } from '@/lib/services/topical-authority-service';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await validateClient(session);
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId parameter' },
        { status: 400 }
      );
    }

    // Validate project ownership
    await validateProject(projectId, client.id);

    // Get maps
    const maps = await TopicalAuthorityService.getProjectMaps(projectId);

    return NextResponse.json({
      success: true,
      data: maps,
    });

  } catch (error: any) {
    console.error('[Topical Authority API] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get topical authority maps',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
