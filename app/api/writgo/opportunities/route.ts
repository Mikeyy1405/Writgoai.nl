import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = createClient();
    
    const { data: opportunities, error } = await supabase
      .from('writgo_content_opportunities')
      .select(`
        *,
        writgo_content_triggers (
          name,
          category
        )
      `)
      .in('status', ['detected', 'generating'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching opportunities:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ opportunities: opportunities || [] });
  } catch (error: any) {
    console.error('Error in opportunities endpoint:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
