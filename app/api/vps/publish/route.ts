import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { publishToWordPress } from '@/lib/vps-client';

export const dynamic = 'force-dynamic';

/**
 * Publish article to WordPress via VPS agent
 *
 * POST /api/vps/publish
 *
 * Body:
 * {
 *   "topic": "Yoga voor beginners - 10 tips",
 *   "site": "yogastartgids.nl",  // or use project_id
 *   "project_id": "uuid",         // optional, gets site from project
 *   "instructions": "Maak het humoristisch", // optional
 *   "category": "Beginners",      // optional
 *   "tags": ["yoga", "tips"],     // optional
 *   "publishImmediately": true    // optional, default true
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const body = await request.json();
    let { topic, site, project_id, instructions, category, tags, publishImmediately } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'topic is required' },
        { status: 400 }
      );
    }

    // If project_id is provided, get site from project
    if (project_id && !site) {
      const { data: project } = await supabase
        .from('projects')
        .select('wp_url')
        .eq('id', project_id)
        .eq('user_id', user.id)
        .single();

      if (project?.wp_url) {
        // Extract domain from URL
        site = new URL(project.wp_url).hostname;
      }
    }

    if (!site) {
      return NextResponse.json(
        { error: 'site or project_id is required' },
        { status: 400 }
      );
    }

    // Send to VPS agent
    const result = await publishToWordPress({
      topic,
      site,
      instructions,
      category,
      tags,
      publishImmediately
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Publishing failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Article queued for publishing on VPS agent',
      jobId: result.jobId,
      estimatedTime: result.estimatedTime,
      site
    });

  } catch (error: any) {
    console.error('VPS publish error:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with VPS agent', details: error.message },
      { status: 500 }
    );
  }
}
