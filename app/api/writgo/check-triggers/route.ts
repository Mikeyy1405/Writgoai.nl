import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const parser = new Parser();

    // Get all active triggers
    const { data: triggers, error: triggersError } = await supabase
      .from('writgo_content_triggers')
      .select('*')
      .eq('is_active', true)
      .eq('trigger_type', 'rss_feed');

    if (triggersError) {
      throw new Error(`Failed to fetch triggers: ${triggersError.message}`);
    }

    const results = {
      checked: 0,
      newOpportunities: 0,
      errors: [] as string[],
      opportunities: [] as any[]
    };

    // Check each RSS feed
    for (const trigger of triggers || []) {
      try {
        results.checked++;

        // Parse RSS feed
        const feed = await parser.parseURL(trigger.source_url);
        
        // Get the latest item
        const latestItem = feed.items[0];
        if (!latestItem) continue;

        // Check if we've already seen this item
        const { data: existing } = await supabase
          .from('writgo_content_opportunities')
          .select('id')
          .eq('source_url', latestItem.link)
          .single();

        if (existing) {
          // Already processed
          continue;
        }

        // Check if published in last 7 days
        const publishedDate = new Date(latestItem.pubDate || latestItem.isoDate || Date.now());
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        if (publishedDate < sevenDaysAgo) {
          // Too old
          continue;
        }

        // Create new opportunity
        const { data: opportunity, error: oppError } = await supabase
          .from('writgo_content_opportunities')
          .insert({
            trigger_id: trigger.id,
            title: latestItem.title,
            source_url: latestItem.link,
            status: 'detected',
            priority: 7, // Default priority
            metadata: {
              description: latestItem.contentSnippet || latestItem.content?.substring(0, 200),
              published: publishedDate.toISOString(),
              author: latestItem.creator || latestItem.author,
              categories: latestItem.categories || []
            }
          })
          .select()
          .single();

        if (oppError) {
          results.errors.push(`Failed to create opportunity for ${latestItem.title}: ${oppError.message}`);
          continue;
        }

        results.newOpportunities++;
        results.opportunities.push(opportunity);

        // Update trigger last_checked_at
        await supabase
          .from('writgo_content_triggers')
          .update({
            last_checked_at: new Date().toISOString(),
            last_success_at: new Date().toISOString()
          })
          .eq('id', trigger.id);

      } catch (error: any) {
        results.errors.push(`Error checking ${trigger.name}: ${error.message}`);
        
        // Update last_checked_at even on error
        await supabase
          .from('writgo_content_triggers')
          .update({ last_checked_at: new Date().toISOString() })
          .eq('id', trigger.id);
      }
    }

    return NextResponse.json({
      success: true,
      ...results
    });

  } catch (error: any) {
    console.error('Check triggers error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Allow manual trigger via GET
export async function GET(request: NextRequest) {
  return POST(request);
}
