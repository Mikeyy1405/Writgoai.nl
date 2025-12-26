import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getUpcomingHolidays,
  getRelevantHolidayForScheduledDate,
  getHolidayContentIdea,
  Holiday,
} from '@/lib/dutch-holidays';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin as any;
}

// POST: Auto-populate the content calendar
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      project_id,
      days_ahead = 14, // Default: plan 2 weeks ahead
      include_holidays = true,
      platforms = ['instagram'],
    } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }

    // Get project and schedule settings
    const { data: schedule, error: scheduleError } = await getSupabaseAdmin()
      .from('social_schedules')
      .select('*, projects(id, name, website_url, niche, language)')
      .eq('project_id', project_id)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json(
        { error: 'Schedule not found. Please configure automation settings first.' },
        { status: 404 }
      );
    }

    // Get project strategy for content ideas
    const { data: strategy } = await getSupabaseAdmin()
      .from('social_strategies')
      .select('*')
      .eq('project_id', project_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const niche = strategy?.niche || schedule.projects?.niche || 'algemeen';
    const contentIdeas = strategy?.content_ideas || [];
    const postTypes = schedule.post_types || ['educational', 'storytelling', 'engagement'];
    const postTimes = schedule.post_times || ['09:00'];

    // Get existing scheduled content to avoid duplicates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days_ahead);

    const { data: existingContent } = await getSupabaseAdmin()
      .from('scheduled_content')
      .select('scheduled_for, title')
      .eq('project_id', project_id)
      .gte('scheduled_for', startDate.toISOString())
      .lte('scheduled_for', endDate.toISOString());

    const existingDates = new Set(
      existingContent?.map((c: any) =>
        new Date(c.scheduled_for).toISOString().split('T')[0]
      ) || []
    );

    // Get upcoming holidays if enabled
    const holidays = include_holidays
      ? getUpcomingHolidays(startDate, endDate)
      : [];
    const holidayDates = new Map<string, Holiday>();
    holidays.forEach((h) => {
      const dateStr = h.date.toISOString().split('T')[0];
      holidayDates.set(dateStr, h);
    });

    // Calculate which days should have posts based on frequency
    const scheduleDays = getScheduleDays(schedule.frequency, schedule.custom_days);
    const itemsToCreate: any[] = [];
    let contentIdeaIndex = 0;

    // Iterate through each day in the range
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();

      // Skip if already has content for this day
      if (existingDates.has(dateStr)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Check if this day should have a post based on frequency
      if (scheduleDays.includes(dayOfWeek)) {
        // Check if there's a holiday coming up (for this day's post)
        const scheduledDateTime = new Date(currentDate);
        const [hours, minutes] = postTimes[0].split(':').map(Number);
        scheduledDateTime.setHours(hours, minutes, 0, 0);

        const relevantHoliday = include_holidays
          ? getRelevantHolidayForScheduledDate(scheduledDateTime)
          : null;

        // Create content for each post time
        for (let timeIndex = 0; timeIndex < getPostsPerDay(schedule.frequency); timeIndex++) {
          const postTime = postTimes[timeIndex % postTimes.length];
          const [h, m] = postTime.split(':').map(Number);
          const scheduledFor = new Date(currentDate);
          scheduledFor.setHours(h, m, 0, 0);

          // Skip if scheduled time is in the past
          if (scheduledFor <= new Date()) {
            continue;
          }

          let title: string;
          let postType: string;
          let pillar: string | null = null;
          let hook: string | null = null;
          let cta: string | null = null;

          // If there's a relevant holiday, create holiday content
          if (relevantHoliday && timeIndex === 0) {
            title = `${relevantHoliday.emoji} ${getHolidayContentIdea(
              relevantHoliday,
              niche,
              currentDate.getFullYear()
            )}`;
            postType = 'engagement'; // Holiday posts work well as engagement
            hook = `${relevantHoliday.name} komt eraan!`;
          } else if (contentIdeas.length > 0) {
            // Use content ideas from strategy
            const idea = contentIdeas[contentIdeaIndex % contentIdeas.length];
            title = idea.title;
            postType = idea.type?.toLowerCase() || postTypes[contentIdeaIndex % postTypes.length];
            pillar = idea.pillar || null;
            hook = idea.hook || null;
            cta = idea.cta || null;
            contentIdeaIndex++;
          } else {
            // Generate generic content based on niche
            postType = postTypes[contentIdeaIndex % postTypes.length];
            title = generateGenericTitle(postType, niche);
            contentIdeaIndex++;
          }

          itemsToCreate.push({
            project_id,
            title,
            type: postType,
            pillar,
            hook,
            cta,
            scheduled_for: scheduledFor.toISOString(),
            platforms: platforms,
            auto_generate: true,
            status: 'scheduled',
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Insert all items
    if (itemsToCreate.length > 0) {
      const { data: created, error: insertError } = await getSupabaseAdmin()
        .from('scheduled_content')
        .insert(itemsToCreate)
        .select();

      if (insertError) {
        console.error('Failed to create scheduled content:', insertError);
        return NextResponse.json(
          { error: 'Failed to create scheduled content: ' + insertError.message },
          { status: 500 }
        );
      }

      // Update schedule's auto_populate_last_run
      await getSupabaseAdmin()
        .from('social_schedules')
        .update({
          auto_populate_last_run: new Date().toISOString(),
        })
        .eq('id', schedule.id);

      return NextResponse.json({
        success: true,
        message: `Created ${created?.length || 0} scheduled content items`,
        items_created: created?.length || 0,
        holidays_included: holidays.length,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Calendar already up to date',
      items_created: 0,
    });
  } catch (error: any) {
    console.error('Auto-populate calendar error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to get which days of week should have posts
function getScheduleDays(
  frequency: string,
  customDays?: number[]
): number[] {
  switch (frequency) {
    case 'daily':
    case 'twice_daily':
    case 'three_times_daily':
      return [0, 1, 2, 3, 4, 5, 6]; // Every day
    case 'weekdays':
      return [1, 2, 3, 4, 5]; // Monday to Friday
    case 'weekly':
      return [1]; // Monday only
    case 'custom':
      return customDays || [1, 3, 5]; // Default: Mon, Wed, Fri
    default:
      return [0, 1, 2, 3, 4, 5, 6];
  }
}

// Helper function to get posts per day based on frequency
function getPostsPerDay(frequency: string): number {
  switch (frequency) {
    case 'twice_daily':
      return 2;
    case 'three_times_daily':
      return 3;
    default:
      return 1;
  }
}

// Helper function to generate generic titles
function generateGenericTitle(postType: string, niche: string): string {
  const templates: Record<string, string[]> = {
    educational: [
      `Tips voor ${niche}`,
      `Wat je moet weten over ${niche}`,
      `${niche} uitgelegd`,
      `Beginnersgids voor ${niche}`,
    ],
    storytelling: [
      `Mijn ervaring met ${niche}`,
      `Het verhaal achter ${niche}`,
      `Waarom ik van ${niche} hou`,
    ],
    engagement: [
      `Wat is jouw mening over ${niche}?`,
      `Poll: ${niche} vraag`,
      `Vertel ons over jouw ${niche} ervaring`,
    ],
    promotional: [
      `Ontdek onze ${niche} aanpak`,
      `Waarom kiezen voor ${niche}?`,
    ],
    behind_the_scenes: [
      `Achter de schermen bij ${niche}`,
      `Hoe wij ${niche} aanpakken`,
    ],
  };

  const typeTemplates = templates[postType] || templates.educational;
  return typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
}
