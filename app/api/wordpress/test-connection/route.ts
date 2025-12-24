import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createWordPressClient } from '@/lib/wordpress-client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authenticatie
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    // Get project_id
    const body = await request.json();
    const projectId = body.project_id;

    if (!projectId) {
      return NextResponse.json({ error: 'project_id is verplicht' }, { status: 400 });
    }

    // Haal project op met WordPress credentials
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, wp_url, wp_username, wp_password, wp_app_password')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Controleer of WordPress is geconfigureerd
    if (!project.wp_url || !project.wp_username) {
      return NextResponse.json({
        success: false,
        message: 'WordPress is niet geconfigureerd',
        details: {
          siteReachable: false,
          apiAvailable: false,
          authenticated: false,
        },
      });
    }

    const password = project.wp_app_password || project.wp_password;
    if (!password) {
      return NextResponse.json({
        success: false,
        message: 'WordPress password ontbreekt',
        details: {
          siteReachable: false,
          apiAvailable: false,
          authenticated: false,
        },
      });
    }

    // Maak WordPress client
    const wpClient = createWordPressClient({
      url: project.wp_url,
      username: project.wp_username,
      password: password,
    });

    // Test connectie
    const result = await wpClient.testConnection();

    return NextResponse.json({
      success: result.success,
      message: result.message,
      checks: {
        siteReachable: {
          passed: result.details?.siteReachable || false,
          message: result.details?.siteReachable ? 'Site is bereikbaar' : 'Site is niet bereikbaar',
        },
        restApiEnabled: {
          passed: result.details?.apiAvailable || false,
          message: result.details?.apiAvailable ? 'REST API is actief' : 'REST API is niet actief',
        },
        authenticationValid: {
          passed: result.details?.authenticated || false,
          message: result.details?.authenticated ? 'Authenticatie succesvol' : 'Authenticatie mislukt',
        },
      },
      wpUrl: project.wp_url,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('WordPress connection test error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Fout bij testen van WordPress connectie',
      },
      { status: 500 }
    );
  }
}
