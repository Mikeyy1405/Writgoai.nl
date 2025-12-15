import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Basic stats
    const { count: totalArticles } = await supabaseAdmin
      .from('BlogArticle')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const { count: thisMonth } = await supabaseAdmin
      .from('BlogArticle')
      .select('*', { count: 'exact', head: true })
      .gte('createdAt', startOfMonth.toISOString());

    // Recent articles
    const { data: recentArticles } = await supabaseAdmin
      .from('BlogArticle')
      .select('title, createdAt')
      .eq('status', 'published')
      .order('createdAt', { ascending: false })
      .limit(5);

    return NextResponse.json({
      totalArticles: totalArticles || 0,
      totalViews: 0, // Placeholder
      thisMonth: thisMonth || 0,
      topProject: { name: 'Geen data', articles: 0 },
      recentArticles: (recentArticles || []).map(a => ({
        title: a.title,
        date: a.createdAt,
        views: 0,
      })),
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      totalArticles: 0,
      totalViews: 0,
      thisMonth: 0,
      topProject: { name: 'Geen data', articles: 0 },
      recentArticles: [],
    });
  }
}
