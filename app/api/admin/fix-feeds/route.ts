import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  try {
    const supabase = createClient();

    // Fix Google Search Central Blog RSS URL
    const { error: googleError } = await supabase
      .from('writgo_content_triggers')
      .update({ feed_url: 'https://feeds.feedburner.com/blogspot/amDG' })
      .eq('name', 'Google Search Central Blog');

    if (googleError) {
      console.error('Error fixing Google feed:', googleError);
    }

    // Remove Anthropic News feed (doesn't exist)
    const { error: anthropicError } = await supabase
      .from('writgo_content_triggers')
      .delete()
      .eq('name', 'Anthropic News');

    if (anthropicError) {
      console.error('Error removing Anthropic feed:', anthropicError);
    }

    // Get updated feed list
    const { data: feeds, error: listError } = await supabase
      .from('writgo_content_triggers')
      .select('id, name, feed_url, is_active')
      .order('name');
    
    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Feed URLs fixed!',
      feeds: feeds
    });
  } catch (error: any) {
    console.error('Error fixing feeds:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
