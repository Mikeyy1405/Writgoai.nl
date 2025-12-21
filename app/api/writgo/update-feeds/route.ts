import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const premiumFeeds = [
  // BREAKING NEWS - Hoogste prioriteit (check elk uur)
  { name: 'Google Search Central Blog', category: 'seo', url: 'https://developers.google.com/search/blog/feeds/posts/default', priority: 10 },
  { name: 'OpenAI News', category: 'ai', url: 'https://openai.com/news/rss.xml', priority: 10 },
  
  // BREAKING NEWS - Dagelijks
  { name: 'Search Engine Land', category: 'seo', url: 'https://searchengineland.com/feed', priority: 9 },
  { name: 'Search Engine Journal', category: 'seo', url: 'https://www.searchenginejournal.com/feed/', priority: 9 },
  { name: 'Google AI Blog', category: 'ai', url: 'https://blog.google/technology/ai/rss/', priority: 9 },
  { name: 'Anthropic News', category: 'ai', url: 'https://www.anthropic.com/news/rss.xml', priority: 9 },
  { name: 'Search Engine Roundtable', category: 'seo', url: 'https://www.seroundtable.com/feed', priority: 9 },
  
  // TUTORIALS & HOW-TO - SEO
  { name: 'Ahrefs Blog', category: 'seo', url: 'https://ahrefs.com/blog/feed/', priority: 8 },
  { name: 'Moz Blog', category: 'seo', url: 'https://moz.com/blog/feed', priority: 8 },
  { name: 'Backlinko', category: 'seo', url: 'https://backlinko.com/blog/feed/', priority: 8 },
  { name: 'Semrush Blog', category: 'seo', url: 'https://www.semrush.com/blog/feed/', priority: 8 },
  
  // TUTORIALS & HOW-TO - WordPress
  { name: 'Yoast SEO Blog', category: 'wordpress', url: 'https://yoast.com/feed/', priority: 8 },
  { name: 'WPBeginner', category: 'wordpress', url: 'https://www.wpbeginner.com/feed/', priority: 8 },
  { name: 'Kinsta Blog', category: 'wordpress', url: 'https://kinsta.com/blog/feed/', priority: 7 },
  { name: 'WordPress Tavern', category: 'wordpress', url: 'https://wptavern.com/feed', priority: 7 },
  
  // TIPS & BEST PRACTICES
  { name: 'Neil Patel Blog', category: 'seo', url: 'https://neilpatel.com/feed/', priority: 7 },
  { name: 'HubSpot Marketing', category: 'marketing', url: 'https://blog.hubspot.com/marketing/rss.xml', priority: 7 },
  { name: 'Copyblogger', category: 'marketing', url: 'https://copyblogger.com/feed/', priority: 7 },
  { name: 'Content Marketing Institute', category: 'marketing', url: 'https://contentmarketinginstitute.com/feed/', priority: 7 }
];

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Delete old RSS feeds
    const { error: deleteError } = await supabase
      .from('writgo_content_triggers')
      .delete()
      .eq('trigger_type', 'rss_feed');

    if (deleteError) {
      throw new Error(`Failed to delete old feeds: ${deleteError.message}`);
    }

    // Step 2: Insert premium feeds
    const results = {
      added: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const feed of premiumFeeds) {
      const { error: insertError } = await supabase
        .from('writgo_content_triggers')
        .insert({
          name: feed.name,
          trigger_type: 'rss_feed',
          category: feed.category,
          source_url: feed.url,
          check_frequency: feed.priority >= 9 ? 'hourly' : 'daily',
          priority: feed.priority,
          is_active: true
        });

      if (insertError) {
        results.failed++;
        results.errors.push(`${feed.name}: ${insertError.message}`);
      } else {
        results.added++;
      }
    }

    // Step 3: Get updated list
    const { data: feeds, error: fetchError } = await supabase
      .from('writgo_content_triggers')
      .select('name, category, priority, is_active')
      .eq('trigger_type', 'rss_feed')
      .order('priority', { ascending: false })
      .order('name');

    if (fetchError) {
      throw new Error(`Failed to fetch feeds: ${fetchError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${results.added} premium RSS feeds`,
      results,
      feeds
    });

  } catch (error: any) {
    console.error('Update feeds error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
