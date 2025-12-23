import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Fix WordPress URLs in database
 *
 * This endpoint fixes wp_url entries that incorrectly contain /wp-json/wp/v2
 * by removing those paths and keeping only the base URL
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    // Get all projects for this user that have wp_url with /wp-json in it
    const { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('id, name, wp_url')
      .eq('user_id', user.id)
      .not('wp_url', 'is', null);

    if (fetchError) {
      console.error('Error fetching projects:', fetchError);
      return NextResponse.json(
        { error: 'Fout bij ophalen van projecten' },
        { status: 500 }
      );
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Geen projecten gevonden om te updaten',
        updated: 0,
      });
    }

    // Fix URLs that contain /wp-json
    const updates = [];
    for (const project of projects) {
      if (project.wp_url && project.wp_url.includes('/wp-json')) {
        // Remove /wp-json and everything after it
        const fixedUrl = project.wp_url
          .replace(/\/wp-json.*$/, '')
          .replace(/\/$/, ''); // Also remove trailing slash

        console.log(`Fixing project ${project.id} (${project.name}):`);
        console.log(`  Old URL: ${project.wp_url}`);
        console.log(`  New URL: ${fixedUrl}`);

        const { error: updateError } = await supabase
          .from('projects')
          .update({ wp_url: fixedUrl })
          .eq('id', project.id);

        if (updateError) {
          console.error(`Error updating project ${project.id}:`, updateError);
          updates.push({
            project_id: project.id,
            project_name: project.name,
            old_url: project.wp_url,
            new_url: fixedUrl,
            success: false,
            error: updateError.message,
          });
        } else {
          updates.push({
            project_id: project.id,
            project_name: project.name,
            old_url: project.wp_url,
            new_url: fixedUrl,
            success: true,
          });
        }
      }
    }

    const successCount = updates.filter(u => u.success).length;
    const errorCount = updates.filter(u => !u.success).length;

    return NextResponse.json({
      success: true,
      message: `${successCount} project(en) geüpdatet${errorCount > 0 ? `, ${errorCount} fout(en)` : ''}`,
      updated: successCount,
      errors: errorCount,
      details: updates,
    });

  } catch (error: any) {
    console.error('Error fixing WordPress URLs:', error);
    return NextResponse.json(
      {
        error: 'Fout bij updaten van WordPress URLs',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
