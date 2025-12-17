/**
 * Script om de SavedContent status migration uit te voeren
 * 
 * Run met: npx tsx scripts/run-migration.ts
 */

import { supabaseAdmin } from '../lib/supabase';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  console.log('🚀 Starting migration: Add status column to SavedContent');
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20241217150000_add_savedcontent_status.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Migration SQL loaded');
    console.log('⏳ Executing migration...');
    
    // Execute the migration
    // Note: Supabase client doesn't support raw SQL execution directly
    // We need to use the REST API or run this via Supabase CLI
    
    console.log('⚠️  WARNING: This script needs to be run via Supabase CLI or dashboard');
    console.log('');
    console.log('To run this migration:');
    console.log('1. Copy the SQL from: supabase/migrations/20241217150000_add_savedcontent_status.sql');
    console.log('2. Go to Supabase Dashboard > SQL Editor');
    console.log('3. Paste and execute the SQL');
    console.log('');
    console.log('Or use Supabase CLI:');
    console.log('  supabase db push');
    console.log('');
    
    // For now, let's just check if the column already exists
    const { data, error } = await supabaseAdmin
      .from('SavedContent')
      .select('status')
      .limit(1);
    
    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('❌ Status column does NOT exist yet - migration needs to be run');
        console.log('');
        console.log('SQL to execute:');
        console.log('---');
        console.log(migrationSql);
        console.log('---');
      } else {
        console.error('❌ Error checking status column:', error);
      }
    } else {
      console.log('✅ Status column already exists!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
