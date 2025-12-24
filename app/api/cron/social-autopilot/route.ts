import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Social Media Autopilot Cron Job
 *
 * This endpoint should be called every hour (or more frequently) via a cron service
 * like Vercel Cron, Upstash QStash, or cron-job.org
 *
 * It checks for enabled schedules that are due to run and generates posts automatically.
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🤖 Social Autopilot: Starting...');

    const now = new Date();
    const results = {
      checked: 0,
      generated: 0,
      errors: 0,
      schedules: [] as any[],
    };

    // Get all enabled schedules that are due to run
    const { data: dueSchedules, error: schedulesError } = await supabaseAdmin
      .from('social_schedules')
      .select('*, projects(id, name, website_url, niche, language)')
      .eq('enabled', true)
      .lte('next_run_at', now.toISOString())
      .order('next_run_at', { ascending: true });

    if (schedulesError) {
      console.error('Failed to fetch schedules:', schedulesError);
      throw schedulesError;
    }

    if (!dueSchedules || dueSchedules.length === 0) {
      console.log('✅ No schedules due to run');
      return NextResponse.json({
        success: true,
        message: 'No schedules due',
        results,
      });
    }

    console.log(`📋 Found ${dueSchedules.length} schedule(s) to process`);
    results.checked = dueSchedules.length;

    // Process each schedule
    for (const schedule of dueSchedules) {
      try {
        console.log(`\n📅 Processing schedule for project: ${schedule.projects?.name}`);

        // Get project strategy for better content generation
        const { data: strategy } = await supabaseAdmin
          .from('social_strategies')
          .select('*')
          .eq('project_id', schedule.project_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Determine post type - rotate through configured types
        const postTypes = schedule.post_types || ['educational', 'storytelling', 'engagement'];
        const { data: recentAutoPosts } = await supabaseAdmin
          .from('social_posts')
          .select('post_type')
          .eq('project_id', schedule.project_id)
          .eq('auto_generated', true)
          .order('created_at', { ascending: false })
          .limit(1);

        let postType = postTypes[0];
        if (recentAutoPosts && recentAutoPosts.length > 0) {
          const lastType = recentAutoPosts[0].post_type;
          const lastIndex = postTypes.indexOf(lastType);
          const nextIndex = (lastIndex + 1) % postTypes.length;
          postType = postTypes[nextIndex];
        }

        // Determine topic - use content ideas from strategy if available
        let topic = '';
        let contentIdeaIndex;

        if (schedule.use_content_ideas && strategy?.content_ideas && strategy.content_ideas.length > 0) {
          // Get used content ideas
          const { data: usedIdeas } = await supabaseAdmin
            .from('social_posts')
            .select('variation_seed')
            .eq('project_id', schedule.project_id)
            .eq('auto_generated', true)
            .not('variation_seed', 'is', null);

          const usedSeeds = new Set(usedIdeas?.map(p => p.variation_seed) || []);

          // Find unused content idea
          const unusedIdea = strategy.content_ideas.find((idea: any, index: number) => {
            const seed = `idea-${index}`;
            return !usedSeeds.has(seed);
          });

          if (unusedIdea) {
            topic = unusedIdea.title;
            contentIdeaIndex = strategy.content_ideas.indexOf(unusedIdea);
            console.log(`💡 Using content idea: ${topic}`);
          }
        }

        // If no content idea, generate a generic topic based on niche
        if (!topic) {
          const niche = strategy?.niche || schedule.projects?.niche || 'general topic';
          const topics = [
            `Tips voor beginners in ${niche}`,
            `Veelgemaakte fouten bij ${niche}`,
            `Waarom ${niche} belangrijk is`,
            `Mijn ervaring met ${niche}`,
            `3 dingen die je moet weten over ${niche}`,
          ];
          topic = topics[Math.floor(Math.random() * topics.length)];
          console.log(`🎲 Generated random topic: ${topic}`);
        }

        // Calculate scheduled time (if not auto-publishing)
        let scheduledFor;
        if (schedule.schedule_posts && !schedule.auto_publish) {
          // Schedule for the current time slot from post_times
          const currentHour = now.getHours();
          const currentMinutes = now.getMinutes();

          // Find the next post time
          let nextTime = schedule.post_times[0];
          for (const time of schedule.post_times) {
            const [hours, minutes] = time.split(':').map(Number);
            if (hours > currentHour || (hours === currentHour && minutes > currentMinutes)) {
              nextTime = time;
              break;
            }
          }

          const [hours, minutes] = nextTime.split(':').map(Number);
          scheduledFor = new Date(now);
          scheduledFor.setHours(hours, minutes, 0, 0);

          // If time is in the past, schedule for tomorrow
          if (scheduledFor <= now) {
            scheduledFor.setDate(scheduledFor.getDate() + 1);
          }

          console.log(`📅 Will schedule post for: ${scheduledFor.toISOString()}`);
        }

        // Generate the post
        console.log(`🎨 Generating ${postType} post...`);

        const generateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/generate-post`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: schedule.project_id,
            topic,
            post_type: postType,
            platforms: schedule.target_platforms || ['instagram'],
            language: schedule.projects?.language || 'nl',
            niche: strategy?.niche || schedule.projects?.niche || '',
            website_url: schedule.projects?.website_url || '',
            strategy: strategy ? {
              brand_voice: strategy.brand_voice,
              hashtags: strategy.hashtag_strategy,
              content_pillars: strategy.content_pillars,
            } : undefined,
            content_idea_index: contentIdeaIndex,
            auto_generated: true,
            schedule_id: schedule.id,
          }),
        });

        if (!generateResponse.ok) {
          throw new Error(`Failed to generate post: ${generateResponse.statusText}`);
        }

        const generatedPost = await generateResponse.json();
        console.log(`✅ Post generated: ${generatedPost.post?.id}`);

        // If auto_publish is enabled, publish the post immediately
        if (schedule.auto_publish && generatedPost.post?.id) {
          console.log(`📤 Auto-publishing post...`);

          // Get connected accounts for this project
          const { data: accounts } = await supabaseAdmin
            .from('social_accounts')
            .select('id, platform')
            .eq('project_id', schedule.project_id)
            .eq('connected', true);

          if (accounts && accounts.length > 0) {
            const accountIds = accounts
              .filter(a => schedule.target_platforms.includes(a.platform))
              .map(a => a.id);

            if (accountIds.length > 0) {
              const publishResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  post_id: generatedPost.post.id,
                  account_ids: accountIds,
                  scheduled_for: scheduledFor?.toISOString(),
                  publish_now: !scheduledFor,
                }),
              });

              if (publishResponse.ok) {
                console.log(`✅ Post ${scheduledFor ? 'scheduled' : 'published'} successfully`);
              } else {
                console.error(`❌ Failed to publish post:`, await publishResponse.text());
              }
            } else {
              console.log(`⚠️ No matching connected accounts for platforms: ${schedule.target_platforms.join(', ')}`);
            }
          } else {
            console.log(`⚠️ No connected accounts found for project`);
          }
        } else if (scheduledFor && generatedPost.post?.id) {
          // Update post with scheduled time
          await supabaseAdmin
            .from('social_posts')
            .update({
              scheduled_for: scheduledFor.toISOString(),
              status: 'scheduled',
            })
            .eq('id', generatedPost.post.id);

          console.log(`📅 Post scheduled for ${scheduledFor.toISOString()}`);
        }

        results.generated++;
        results.schedules.push({
          project: schedule.projects?.name,
          post_type: postType,
          topic: topic,
          success: true,
        });

        // Update schedule's last_run_at
        await supabaseAdmin
          .from('social_schedules')
          .update({ last_run_at: now.toISOString() })
          .eq('id', schedule.id);

        console.log(`✅ Schedule processed successfully`);

      } catch (error: any) {
        console.error(`❌ Error processing schedule ${schedule.id}:`, error);
        results.errors++;
        results.schedules.push({
          project: schedule.projects?.name,
          error: error.message,
          success: false,
        });
      }
    }

    console.log('\n📊 Social Autopilot Summary:');
    console.log(`   Checked: ${results.checked}`);
    console.log(`   Generated: ${results.generated}`);
    console.log(`   Errors: ${results.errors}`);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.checked} schedule(s), generated ${results.generated} post(s)`,
      results,
    });

  } catch (error: any) {
    console.error('Social Autopilot error:', error);
    return NextResponse.json({
      error: error.message,
      success: false,
    }, { status: 500 });
  }
}
