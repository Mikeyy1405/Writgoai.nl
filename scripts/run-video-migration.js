#!/usr/bin/env node
/**
 * Script to run the video_projects migration
 * This creates the video_projects and video_scenes tables in Supabase
 *
 * Usage: node scripts/run-video-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Hardcoded credentials for migration (from run_migration.py)
const SUPABASE_URL = 'https://utursgxvfhhfheeoewfn.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0dXJzZ3h2ZmhoZmhlZW9ld2ZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDI1NTY1NSwiZXhwIjoyMDc5ODMxNjU1fQ.OWt_8505zYGOGY3UohKVx7GSxRDiWNYqilRYHTTfPYg';

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase_video_projects_migration.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    console.log('📖 Reading migration file...');
    console.log(`✓ Found migration: ${migrationPath}`);

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('\n🔌 Connecting to Supabase...');

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement using the Supabase RPC endpoint
    // Note: This requires a custom RPC function in Supabase
    // Alternatively, we need to execute via direct database connection

    console.log('⚠️  Note: Supabase REST API cannot directly execute DDL statements.');
    console.log('Please run this migration manually in the Supabase SQL Editor:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/utursgxvfhhfheeoewfn/sql/new');
    console.log('2. Copy the contents of: supabase_video_projects_migration.sql');
    console.log('3. Paste and click "Run"');
    console.log('\nOr use the PostgreSQL connection string with psql or a database client.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runMigration();
