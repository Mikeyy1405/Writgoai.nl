import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { supabaseAdmin } from '@/lib/supabase';
import { isUserAdmin } from '@/lib/navigation-config';

/**
 * GET /api/admin/writgo-marketing/status
 * Gets the status of Writgo.nl marketing setup and automation
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isUserAdmin(session.user.email, session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find Writgo.nl client
    const { data: writgoClient, error: clientError } = await supabaseAdmin
      .from('Client')
      .select('*')
      .or('email.eq."marketing@writgo.nl",companyName.eq."Writgo.nl"')
      .limit(1)
      .single();

    if (clientError && clientError.code !== 'PGRST116') {
      console.error('Error fetching Writgo client:', clientError);
      throw clientError;
    }

    if (!writgoClient) {
      return NextResponse.json({
        isSetup: false,
        hasContentPlan: false,
        hasSocialAccounts: false,
        automationActive: false,
        lateDevAccounts: [],
        stats: {
          blogsThisMonth: 0,
          socialPostsThisMonth: 0,
          totalBlogs: 0,
          totalSocialPosts: 0
        }
      });
    }

    // Get blog post count from BlogPost table
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const { count: blogsThisMonth, error: blogsThisMonthError } = await supabaseAdmin
      .from('BlogPost')
      .select('id', { count: 'exact', head: true })
      .eq('authorName', 'Writgo.nl')
      .gte('createdAt', firstDayOfMonth.toISOString());

    if (blogsThisMonthError) {
      console.error('Error counting blogs this month:', blogsThisMonthError);
      throw blogsThisMonthError;
    }

    const { count: totalBlogs, error: totalBlogsError } = await supabaseAdmin
      .from('BlogPost')
      .select('id', { count: 'exact', head: true })
      .eq('authorName', 'Writgo.nl');

    if (totalBlogsError) {
      console.error('Error counting total blogs:', totalBlogsError);
      throw totalBlogsError;
    }

    // Get social posts count from content_deliveries table
    let socialPostsThisMonth = 0;
    let totalSocialPosts = 0;
    
    try {
      const { count: socialThisMonth, error: socialThisMonthError } = await supabaseAdmin
        .from('content_deliveries')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', writgoClient.id)
        .eq('content_type', 'social')
        .gte('created_at', firstDayOfMonth.toISOString());

      if (!socialThisMonthError) {
        socialPostsThisMonth = socialThisMonth || 0;
      }

      const { count: totalSocial, error: totalSocialError } = await supabaseAdmin
        .from('content_deliveries')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', writgoClient.id)
        .eq('content_type', 'social');

      if (!totalSocialError) {
        totalSocialPosts = totalSocial || 0;
      }
    } catch (error) {
      console.log('content_deliveries table not available yet');
    }

    // Get recent content
    const { data: recentBlogs, error: recentBlogsError } = await supabaseAdmin
      .from('BlogPost')
      .select('id, title, status, createdAt, publishedAt')
      .eq('authorName', 'Writgo.nl')
      .order('createdAt', { ascending: false })
      .limit(5);

    if (recentBlogsError) {
      console.error('Error fetching recent blogs:', recentBlogsError);
      throw recentBlogsError;
    }

    interface RecentSocialContent {
      id: string;
      title: string;
      platform_ids?: string[];
      status: string;
      created_at: string;
    }
    
    let recentSocial: RecentSocialContent[] = [];
    try {
      const { data: socialContent, error: socialContentError } = await supabaseAdmin
        .from('content_deliveries')
        .select('id, title, platform_ids, status, created_at')
        .eq('client_id', writgoClient.id)
        .eq('content_type', 'social')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!socialContentError && socialContent) {
        recentSocial = socialContent;
      }
    } catch (error) {
      console.log('content_deliveries table not available yet');
    }

    // Check for social accounts (simplified for now)
    const hasSocialAccounts = !!(
      writgoClient.facebookConnected ||
      writgoClient.instagramConnected ||
      writgoClient.tiktokConnected ||
      writgoClient.youtubeConnected ||
      writgoClient.lateDevProfileId
    );

    return NextResponse.json({
      isSetup: true,
      hasContentPlan: !!writgoClient.contentPlan,
      hasSocialAccounts,
      automationActive: writgoClient.automationActive,
      lastPlanGenerated: writgoClient.lastPlanGenerated,
      lateDevAccounts: [],
      stats: {
        blogsThisMonth: blogsThisMonth || 0,
        socialPostsThisMonth,
        totalBlogs: totalBlogs || 0,
        totalSocialPosts
      },
      recentContent: {
        blogs: recentBlogs || [],
        social: recentSocial
      },
      client: {
        id: writgoClient.id,
        email: writgoClient.email,
        name: writgoClient.name,
        website: writgoClient.website,
        automationActive: writgoClient.automationActive,
        automationStartDate: writgoClient.automationStartDate
      }
    });
  } catch (error) {
    console.error('Error fetching Writgo marketing status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
