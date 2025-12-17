import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { supabaseAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/simplified/stats
 * Haal statistieken op voor de ingelogde gebruiker
 */
export async function GET(request: NextRequest) {
  try {
    // Check session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('[Stats API] No session or email found');
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Je moet ingelogd zijn om statistieken te bekijken' 
      }, { status: 401 });
    }

    console.log('[Stats API] Fetching stats for email:', session.user.email);

    // Haal client op
    let client;
    try {
      const { data, error } = await supabaseAdmin
        .from('Client')
        .select('*')
        .eq('email', session.user.email)
        .single();
      
      if (error) {
        throw error;
      }
      
      client = data;
    } catch (clientError) {
      console.error('[Stats API] Error fetching client:', clientError);
      return NextResponse.json({ 
        error: 'Failed to fetch client',
        message: 'Kan gebruikersgegevens niet ophalen',
        details: clientError instanceof Error ? clientError.message : 'Unknown error'
      }, { status: 500 });
    }

    if (!client) {
      console.error('[Stats API] Client not found for email:', session.user.email);
      return NextResponse.json({ 
        error: 'Client not found',
        message: 'Gebruiker niet gevonden. Neem contact op met support.'
      }, { status: 404 });
    }

    console.log('[Stats API] Client found, ID:', client.id);

    // Tel projecten
    let totalProjects = 0;
    try {
      const { count, error } = await supabaseAdmin
        .from('Project')
        .select('*', { count: 'exact', head: true })
        .eq('clientId', client.id)
        .eq('isActive', true);
      
      if (error) {
        throw error;
      }
      
      totalProjects = count || 0;
      console.log('[Stats API] Total projects:', totalProjects);
    } catch (projectError) {
      console.error('[Stats API] Error counting projects:', projectError);
      // Continue with 0, don't fail the entire request
    }

    // Tel content deze maand
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let contentThisMonth = 0;
    try {
      const { count, error } = await supabaseAdmin
        .from('SavedContent')
        .select('id, project:Project!inner(clientId)', { count: 'exact', head: true })
        .eq('project.clientId', client.id)
        .gte('createdAt', startOfMonth.toISOString());
      
      if (error) {
        throw error;
      }
      
      contentThisMonth = count || 0;
      console.log('[Stats API] Content this month:', contentThisMonth);
    } catch (contentError) {
      console.error('[Stats API] Error counting content this month:', contentError);
      // Continue with 0, don't fail the entire request
    }

    // Tel gepubliceerde artikelen
    let publishedArticles = 0;
    try {
      const { count, error } = await supabaseAdmin
        .from('SavedContent')
        .select('id, project:Project!inner(clientId)', { count: 'exact', head: true })
        .eq('project.clientId', client.id)
        .not('publishedAt', 'is', null);
      
      if (error) {
        throw error;
      }
      
      publishedArticles = count || 0;
      console.log('[Stats API] Published articles:', publishedArticles);
    } catch (publishedError) {
      console.error('[Stats API] Error counting published articles:', publishedError);
      // Continue with 0, don't fail the entire request
    }

    // Haal recente content op
    let recentContent = [];
    try {
      const { data, error } = await supabaseAdmin
        .from('SavedContent')
        .select(`
          id, 
          title, 
          type, 
          publishedAt, 
          createdAt,
          status,
          project:Project!inner(
            id,
            name,
            clientId
          )
        `)
        .eq('project.clientId', client.id)
        .order('createdAt', { ascending: false })
        .limit(5);
      
      if (error) {
        throw error;
      }
      
      recentContent = data || [];
      console.log('[Stats API] Recent content count:', recentContent.length);
    } catch (recentError) {
      console.error('[Stats API] Error fetching recent content:', recentError);
      // Continue with empty array, don't fail the entire request
    }

    console.log('[Stats API] Successfully fetched all stats');
    return NextResponse.json({
      totalProjects,
      contentThisMonth,
      publishedArticles,
      recentContent,
    });
  } catch (error) {
    console.error('[Stats API] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[Stats API] Error details:', {
      message: errorMessage,
      stack: errorStack,
      type: error?.constructor?.name
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch stats',
        message: 'Er is een onverwachte fout opgetreden bij het ophalen van statistieken',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
