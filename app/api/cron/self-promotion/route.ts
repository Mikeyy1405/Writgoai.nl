import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Cron job for WritGo self-promotion automation
 * Runs hourly to check if blog or social posts need to be generated
 *
 * Schedule: 0 * * * * (every hour)
 */
export async function GET(req: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚀 Starting self-promotion cron job...');

    const now = new Date();
    const results = {
      blog_generated: false,
      social_generated: false,
      errors: [] as string[],
    };

    // Get self-promotion config
    const { data: config, error: configError } = await supabase
      .from('writgo_self_promotion_config')
      .select('*')
      .single();

    if (configError || !config) {
      console.log('⚠️ No self-promotion config found');
      return NextResponse.json({
        success: true,
        message: 'No config found',
      });
    }

    if (!config.enabled) {
      console.log('⏸️ Self-promotion is disabled');
      return NextResponse.json({
        success: true,
        message: 'Self-promotion is disabled',
      });
    }

    console.log('📊 Config:', {
      blog_enabled: config.blog_enabled,
      blog_next_run: config.next_blog_run_at,
      social_enabled: config.social_enabled,
      social_next_run: config.next_social_run_at,
    });

    // Check if blog generation is due
    if (
      config.blog_enabled &&
      config.next_blog_run_at &&
      new Date(config.next_blog_run_at) <= now
    ) {
      console.log('📝 Generating self-promotion blog...');
      try {
        const blogResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/writgo/self-promotion/generate-blog`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              auto_publish: config.blog_publish_immediately,
            }),
          }
        );

        if (!blogResponse.ok) {
          const error = await blogResponse.text();
          throw new Error(`Blog generation failed: ${error}`);
        }

        const blogData = await blogResponse.json();
        console.log('✅ Blog generated:', blogData.article?.title);

        results.blog_generated = true;

        // Update last run time
        await supabase
          .from('writgo_self_promotion_config')
          .update({
            last_blog_generated_at: now.toISOString(),
          })
          .eq('id', config.id);

        console.log('✅ Updated blog last run time');
      } catch (error: any) {
        console.error('❌ Blog generation error:', error);
        results.errors.push(`Blog: ${error.message}`);
      }
    }

    // Check if social post generation is due
    if (
      config.social_enabled &&
      config.next_social_run_at &&
      new Date(config.next_social_run_at) <= now
    ) {
      console.log('📱 Generating self-promotion social post...');
      try {
        // Get or create a default project_id for WritGo self-promotion
        // You might want to create a dedicated project for self-promotion
        const { data: projects } = await supabase
          .from('projects')
          .select('id')
          .limit(1);

        const project_id = projects?.[0]?.id;

        if (!project_id) {
          throw new Error('No project found for social post generation');
        }

        const socialResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/writgo/self-promotion/generate-social`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              project_id: project_id,
              platforms: config.social_platforms || ['instagram', 'linkedin'],
              auto_publish: config.social_publish_immediately,
            }),
          }
        );

        if (!socialResponse.ok) {
          const error = await socialResponse.text();
          throw new Error(`Social generation failed: ${error}`);
        }

        const socialData = await socialResponse.json();
        console.log('✅ Social post generated');

        results.social_generated = true;

        // Update last run time
        await supabase
          .from('writgo_self_promotion_config')
          .update({
            last_social_generated_at: now.toISOString(),
          })
          .eq('id', config.id);

        console.log('✅ Updated social last run time');
      } catch (error: any) {
        console.error('❌ Social generation error:', error);
        results.errors.push(`Social: ${error.message}`);
      }
    }

    console.log('✅ Self-promotion cron job completed');
    console.log('📊 Results:', results);

    return NextResponse.json({
      success: true,
      results: results,
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Self-promotion cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
