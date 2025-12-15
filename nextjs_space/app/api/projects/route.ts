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

    const { data: projects, error } = await supabaseAdmin
      .from('Project')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json({ projects: [] });
    }

    return NextResponse.json({ projects: projects || [] });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ projects: [] });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, wordpressUrl, wordpressUsername, wordpressPassword, getLateApiKey } = body;

    if (!name || !wordpressUrl || !wordpressUsername || !wordpressPassword) {
      return NextResponse.json(
        { error: 'Name, WordPress URL, username en password zijn verplicht' },
        { status: 400 }
      );
    }

    const { data: project, error } = await supabaseAdmin
      .from('Project')
      .insert([
        {
          name,
          wordpressUrl,
          wordpressUsername,
          wordpressPassword,
          getLateApiKey: getLateApiKey || null,
          status: 'active',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json({ error: 'Project aanmaken mislukt' }, { status: 500 });
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
