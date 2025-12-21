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
      // Remove extra spaces from password (Application Passwords often have spaces)
      const cleanPassword = wp_password.replace(/\s+/g, '');
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const testResponse = await fetch(`${wp_url}/posts?per_page=1`, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${wp_username}:${cleanPassword}`).toString('base64'),
          'User-Agent': 'WritGo-SEO-Agent/1.0',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.error('WordPress connection failed:', testResponse.status, errorText);
        return NextResponse.json(
          { error: `WordPress connection failed (${testResponse.status}). Check your credentials.` },
          { status: 400 }
        );
      }
    } catch (wpError: any) {
      console.error('WordPress connection error:', wpError.message);
      return NextResponse.json(
        { error: `Could not connect to WordPress: ${wpError.message}` },
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
