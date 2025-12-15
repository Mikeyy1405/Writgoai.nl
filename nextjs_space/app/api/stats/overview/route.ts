import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Count projects
    const { count: projectCount } = await supabaseAdmin
      .from('Project')
      .select('*', { count: 'exact', head: true });

    // Count content this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: contentThisMonth } = await supabaseAdmin
      .from('BlogArticle')
      .select('*', { count: 'exact', head: true })
      .gte('createdAt', startOfMonth.toISOString());

    // Count published articles
    const { count: publishedArticles } = await supabaseAdmin
      .from('BlogArticle')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    return NextResponse.json({
      totalProjects: projectCount || 0,
      contentThisMonth: contentThisMonth || 0,
      publishedArticles: publishedArticles || 0,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({
      totalProjects: 0,
      contentThisMonth: 0,
      publishedArticles: 0,
    });
  }
}
