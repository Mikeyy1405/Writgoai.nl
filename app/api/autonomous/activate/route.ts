import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Get project
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await supabase.from('activity_logs').insert({
      project_id,
      action: 'scan',
      message: '🚀 Activating Autonomous SEO System...',
    });

    // Step 1: Detect Niche
    await supabase.from('activity_logs').insert({
      project_id,
      action: 'scan',
      message: '🔍 Step 1/4: Analyzing website and detecting niche...',
    });

    const nicheResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/detect-niche`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify({ project_id }),
    });

    if (!nicheResponse.ok) {
      throw new Error('Niche detection failed');
    }

    const nicheData = await nicheResponse.json();

    // Step 2: Keyword Research
    await supabase.from('activity_logs').insert({
      project_id,
      action: 'scan',
      message: `🎯 Step 2/4: Researching keywords for ${nicheData.analysis.niche}...`,
    });

    const keywordResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/keyword-research`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify({ project_id, count: 30 }),
    });

    if (!keywordResponse.ok) {
      throw new Error('Keyword research failed');
    }

    const keywordData = await keywordResponse.json();

    // Step 3: Create Content Plan
    await supabase.from('activity_logs').insert({
      project_id,
      action: 'plan',
      message: `📋 Step 3/4: Creating 30-day content strategy...`,
    });

    const planResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/create-plan`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify({ project_id, days: 30 }),
    });

    if (!planResponse.ok) {
      throw new Error('Content planning failed');
    }

    const planData = await planResponse.json();

    // Step 4: Enable AutoPilot
    await supabase.from('activity_logs').insert({
      project_id,
      action: 'config',
      message: '⚡ Step 4/4: Activating AutoPilot...',
    });

    const nextRun = new Date();
    nextRun.setHours(nextRun.getHours() + 1); // First run in 1 hour

    await supabase
      .from('autopilot_config')
      .upsert({
        project_id,
        enabled: true,
        frequency: 'daily',
        content_strategy: 'balanced',
        next_run: nextRun.toISOString(),
      }, {
        onConflict: 'project_id',
      });

    // Final success message
    await supabase.from('activity_logs').insert({
      project_id,
      action: 'scan',
      message: `✅ Autonomous SEO System Activated!

📊 Niche: ${nicheData.analysis.niche}
🎯 Keywords Found: ${keywordData.count}
📝 Articles Planned: ${planData.total_articles}
⚡ AutoPilot: Active

Your site will now automatically:
- Generate SEO-optimized content
- Publish articles on schedule
- Optimize existing content
- Track performance
- Adapt strategy based on results

First article will be published within 24 hours!`,
    });

    return NextResponse.json({
      success: true,
      niche: nicheData.analysis.niche,
      keywords_found: keywordData.count,
      articles_planned: planData.total_articles,
      autopilot_enabled: true,
      next_run: nextRun.toISOString(),
    });
  } catch (error: any) {
    console.error('Error activating autonomous system:', error);
    
    // Log error
    try {
      const supabase = createClient();
      const body = await request.json();
      await supabase.from('activity_logs').insert({
        project_id: body.project_id,
        action: 'error',
        message: `❌ Activation failed: ${error.message}`,
      });
    } catch (e) {}

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
