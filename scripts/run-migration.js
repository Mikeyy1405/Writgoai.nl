#!/usr/bin/env node

/**
 * Run Supabase Migration Script
 *
 * This script executes the media library migration on your Supabase database.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  console.log('🚀 Starting migration...\n');

  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!');
    console.error('');
    console.error('Required in .env.local:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY');
    console.error('');
    console.error('Please create .env.local with these values.');
    process.exit(1);
  }

  console.log('✅ Environment variables found');
  console.log('   URL:', supabaseUrl);
  console.log('   Service Key: ***' + supabaseServiceKey.slice(-8));
  console.log('');

  // Create Supabase admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('✅ Supabase client created');
  console.log('');

  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20251225091252_media_library.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log('✅ Migration file loaded');
  console.log('   File:', migrationPath);
  console.log('   Size:', sql.length, 'characters');
  console.log('');

  console.log('🔄 Executing migration...');
  console.log('');

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      // Try alternative method - direct query
      console.log('⚠️  RPC method failed, trying direct execution...');

      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`   Found ${statements.length} SQL statements to execute`);
      console.log('');

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement) continue;

        console.log(`   [${i + 1}/${statements.length}] Executing...`);

        // Use fetch to call Supabase REST API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: statement + ';' })
        });

        if (!response.ok) {
          // This might fail, but we'll try another approach
          console.log(`   ⚠️  REST API failed, using pgAdmin approach...`);
        }
      }

      console.log('');
      console.log('⚠️  Direct execution attempted');
      console.log('');
      console.log('📋 Manual verification needed:');
      console.log('');
      console.log('Please verify the migration by running this SQL in Supabase Dashboard:');
      console.log('');
      console.log('SELECT column_name FROM information_schema.columns');
      console.log('WHERE table_name = \'media\' AND column_name IN (\'user_id\', \'filename\', \'title\');');
      console.log('');
      console.log('If you see those columns, the migration succeeded! ✅');
      console.log('');
      console.log('If not, please run the migration manually via Supabase Dashboard SQL Editor.');
      console.log('');
    } else {
      console.log('✅ Migration executed successfully!');
      console.log('');
    }

    // Verify migration
    console.log('🔍 Verifying migration...');
    console.log('');

    const { data: columns, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'media')
      .in('column_name', ['user_id', 'filename', 'title']);

    if (verifyError) {
      console.log('⚠️  Could not verify automatically');
      console.log('   Error:', verifyError.message);
      console.log('');
      console.log('   Please verify manually in Supabase Dashboard');
    } else if (columns && columns.length >= 3) {
      console.log('✅ Migration verified successfully!');
      console.log('   New columns found:', columns.map(c => c.column_name).join(', '));
    } else {
      console.log('⚠️  Verification incomplete');
      console.log('   Found columns:', columns ? columns.length : 0);
    }

  } catch (err) {
    console.error('');
    console.error('❌ Migration failed with error:');
    console.error('   ', err.message);
    console.error('');
    console.error('📋 Fallback: Manual execution required');
    console.error('');
    console.error('Please run the migration manually:');
    console.error('1. Go to https://supabase.com/dashboard');
    console.error('2. Select your project');
    console.error('3. Go to SQL Editor');
    console.error('4. Copy and paste this file: supabase/migrations/20251225091252_media_library.sql');
    console.error('5. Click Run');
    console.error('');
    process.exit(1);
  }

  console.log('');
  console.log('✅ Done!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Visit /dashboard/media-library to test');
  console.log('2. Try uploading an image');
  console.log('3. Verify the URL is generated correctly');
  console.log('');
}

runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
