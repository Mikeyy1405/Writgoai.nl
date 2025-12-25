import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import { scoreOpportunity, checkDailyLimit } from '@/lib/opportunity-scorer';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const parser = new Parser();

    // Get all active triggers
    const { data: triggers, error: triggersError } = await getSupabase()
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

    // Helper function to add delay
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Check each RSS feed
    for (const trigger of triggers || []) {
      try {
        results.checked++;

        // Add delay to avoid rate limiting (1 second between requests)
        if (results.checked > 1) {
          await delay(1000);
        }

        // Parse RSS feed
        const feed = await parser.parseURL(trigger.source_url);
        
        if (!feed.items || feed.items.length === 0) {
          results.errors.push(`${trigger.name}: No items found in feed`);
          continue;
        }

        // Check last 10 items (or all if less than 10)
        const itemsToCheck = feed.items.slice(0, 10);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        let feedNewOpportunities = 0;

        for (const item of itemsToCheck) {
          if (!item.link || !item.title) continue;

          // Check if published in last 7 days
          const publishedDate = new Date(item.pubDate || item.isoDate || Date.now());
          
          if (publishedDate < sevenDaysAgo) {
            // Too old, skip
            continue;
          }

          // Check if we've already created an opportunity for this URL
          const { data: existing } = await getSupabase()
            .from('writgo_content_opportunities')
            .select('id')
            .eq('source_url', item.link)
            .single();

          if (existing) {
            // Already have this opportunity
            continue;
          }

          // Score opportunity for strategic value
          const score = scoreOpportunity({
            title: item.title,
            source_url: item.link,
            metadata: {
              description: item.contentSnippet || item.content?.substring(0, 200),
              published: publishedDate.toISOString(),
              author: item.creator || item.author,
              categories: item.categories || [],
              feedName: trigger.name
            }
          });

          // Skip if score too low or daily limit reached
          if (!score.shouldGenerate) {
            console.log(`Skipped: ${item.title} - ${score.reason}`);
            continue; // Skip low-value content
          }

          const limitReached = await checkDailyLimit(score.topic, supabase);
          if (limitReached) {
            console.log(`Skipped: ${item.title} - Daily limit reached for ${score.topic}`);
            continue; // Daily limit for this topic reached
          }

          // Create new opportunity
          const { data: opportunity, error: oppError } = await getSupabase()
            .from('writgo_content_opportunities')
            .insert({
              trigger_id: trigger.id,
              title: item.title,
              source_url: item.link,
              status: 'detected',
              priority: Math.round(score.total / 100), // Convert score to 1-10 priority
              metadata: {
                description: item.contentSnippet || item.content?.substring(0, 200),
                published: publishedDate.toISOString(),
                author: item.creator || item.author,
                categories: item.categories || [],
                feedName: trigger.name,
                topic: score.topic,
                score: score.total,
                scoreBreakdown: {
                  priority: score.priority,
                  relevance: score.relevance,
                  freshness: score.freshness,
                  authorityPotential: score.authorityPotential
                }
              }
            })
            .select()
            .single();

          if (oppError) {
            results.errors.push(`${trigger.name}: ${oppError.message}`);
            continue;
          }

          results.newOpportunities++;
          feedNewOpportunities++;
          results.opportunities.push(opportunity);
          console.log(`✅ Created opportunity: ${item.title} (score: ${score.total}, topic: ${score.topic})`);
        }

        // Update trigger last_checked_at
        await getSupabase()
          .from('writgo_content_triggers')
          .update({
            last_checked_at: new Date().toISOString(),
            last_success_at: feedNewOpportunities > 0 ? new Date().toISOString() : undefined
          })
          .eq('id', trigger.id);

      } catch (error: any) {
        results.errors.push(`Error checking ${trigger.name}: ${error.message}`);
        
        // Update last_checked_at even on error
        await getSupabase()
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
