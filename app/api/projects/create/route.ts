import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, website_url, wp_username, wp_password } = body;

    // Auto-generate wp_url from website_url
    let wp_url = website_url.trim();
    // Remove trailing slash
    if (wp_url.endsWith('/')) {
      wp_url = wp_url.slice(0, -1);
    }
    // Add /wp-json/wp/v2 if not already present
    if (!wp_url.includes('/wp-json')) {
      wp_url = `${wp_url}/wp-json/wp/v2`;
    }

    // Validate required fields
    if (!name || !website_url || !wp_username || !wp_password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Test WordPress connection
    try {
      const testResponse = await fetch(`${wp_url}/posts?per_page=1`, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${wp_username}:${wp_password}`).toString('base64'),
        },
      });

      if (!testResponse.ok) {
        return NextResponse.json(
          { error: 'WordPress connection failed. Check your credentials.' },
          { status: 400 }
        );
      }
    } catch (wpError) {
      return NextResponse.json(
        { error: 'Could not connect to WordPress. Check your URL.' },
        { status: 400 }
      );
    }

    // Create project in database
    const { data: project, error: dbError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name,
        website_url,
        wp_url,
        wp_username,
        wp_password,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
