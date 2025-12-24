import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/admin/migrate-video-tables
 *
 * ONE-TIME migration endpoint to create video_projects and video_scenes tables
 *
 * IMPORTANT: This endpoint should be called ONCE after deployment to set up the tables
 * After running successfully, you can delete this file for security
 *
 * Usage:
 * curl -X POST https://your-domain.com/api/admin/migrate-video-tables \
 *   -H "Content-Type: application/json"
 */
export async function POST(req: NextRequest) {
  try {
    // Get Supabase credentials from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      );
    }

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('Starting video tables migration...');

    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'supabase_video_projects_migration.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    // Split into statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s.length > 0);

    console.log(`Executing ${statements.length} SQL statements...`);

    const results = [];
    const errors = [];

    // Execute each statement using Supabase's database connection
    // Note: Supabase REST API doesn't support DDL directly, so we'll need to use
    // the SQL endpoint or manual execution

    return NextResponse.json({
      status: 'migration_file_ready',
      message: 'Please run the migration manually in Supabase SQL Editor',
      instructions: [
        '1. Go to https://supabase.com/dashboard/project/utursgxvfhhfheeoewfn/sql/new',
        '2. Copy the contents of supabase_video_projects_migration.sql',
        '3. Paste into the SQL Editor',
        '4. Click "Run" to execute',
        '5. Verify tables were created: SELECT * FROM video_projects LIMIT 1;'
      ],
      alternative: 'Or run: node scripts/migrate-video-tables.js (requires direct database access)',
      statements_count: statements.length
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/migrate-video-tables
 * Check if tables exist
 */
export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Try to query the tables
    const { data: projects, error: projectsError } = await supabase
      .from('video_projects')
      .select('id')
      .limit(1);

    const { data: scenes, error: scenesError } = await supabase
      .from('video_scenes')
      .select('id')
      .limit(1);

    return NextResponse.json({
      tables: {
        video_projects: {
          exists: !projectsError,
          error: projectsError?.message
        },
        video_scenes: {
          exists: !scenesError,
          error: scenesError?.message
        }
      },
      migration_needed: !!(projectsError || scenesError),
      recommendation: (projectsError || scenesError)
        ? 'Run migration: node scripts/migrate-video-tables.js or use Supabase SQL Editor'
        : 'Tables already exist - migration complete!'
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
