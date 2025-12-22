import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Je moet ingelogd zijn om artikelen te verwijderen' }, { status: 401 });
    }

    const body = await request.json();
    const { id, article_id } = body;
    
    const articleId = id || article_id;
    
    console.log('Delete request for article:', articleId, 'by user:', user.id);
    
    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is verplicht' },
        { status: 400 }
      );
    }

    // Get user's projects first
    const { data: userProjects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id);

    if (projectsError) {
      console.error('Projects fetch error:', projectsError);
      return NextResponse.json(
        { error: 'Kon projecten niet ophalen' },
        { status: 500 }
      );
    }

    const userProjectIds = userProjects?.map(p => p.id) || [];
    console.log('User project IDs:', userProjectIds);

    // Fetch the article
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('id, user_id, project_id, title')
      .eq('id', articleId)
      .single();

    if (fetchError) {
      console.error('Article fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Artikel niet gevonden' },
        { status: 404 }
      );
    }

    if (!article) {
      return NextResponse.json(
        { error: 'Artikel niet gevonden' },
        { status: 404 }
      );
    }

    console.log('Found article:', article.title, 'project_id:', article.project_id);

    // Check if user owns this article (either directly or via project)
    const userOwnsArticle = article.user_id === user.id;
    const userOwnsProject = userProjectIds.includes(article.project_id);

    console.log('User owns article:', userOwnsArticle, 'User owns project:', userOwnsProject);

    if (!userOwnsArticle && !userOwnsProject) {
      return NextResponse.json(
        { error: 'Je hebt geen rechten om dit artikel te verwijderen' },
        { status: 403 }
      );
    }

    // Delete the article
    const { error: deleteError } = await supabase
      .from('articles')
      .delete()
      .eq('id', articleId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: `Verwijderen mislukt: ${deleteError.message}` },
        { status: 500 }
      );
    }

    console.log('Article deleted successfully:', articleId);

    return NextResponse.json({ 
      success: true,
      message: 'Artikel succesvol verwijderd'
    });
  } catch (error: any) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}

// Also support DELETE method
export async function DELETE(request: Request) {
  return POST(request);
}
