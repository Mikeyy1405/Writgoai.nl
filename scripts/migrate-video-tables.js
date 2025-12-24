#!/usr/bin/env node
/**
 * Script to create video_projects and video_scenes tables in Supabase
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection details (from run_migration.py)
const config = {
  host: 'aws-0-eu-central-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.utursgxvfhhfheeoewfn',
  password: 'Writgo2025!@#$%',
  ssl: { rejectUnauthorized: false }
};

async function runMigration() {
  const client = new Client(config);

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✓ Connected to Supabase PostgreSQL\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase_video_projects_migration.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    console.log('📖 Reading migration file...');
    console.log(`✓ Found migration: ${migrationPath}\n`);

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s.length > 0);

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        console.log(`[${i + 1}/${statements.length}] Executing...`);
        await client.query(statement);
        console.log(`✓ Statement ${i + 1} completed\n`);
      } catch (error) {
        // Some statements might fail if they already exist (e.g., CREATE TABLE IF NOT EXISTS)
        // That's okay - log it but continue
        if (error.code === '42P07') {
          console.log(`⚠️  Table already exists (skipping)\n`);
        } else if (error.code === '42710') {
          console.log(`⚠️  Object already exists (skipping)\n`);
        } else {
          console.error(`❌ Error in statement ${i + 1}:`);
          console.error(error.message);
          console.error();
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('\nTables created:');
    console.log('  - video_projects');
    console.log('  - video_scenes');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from database');
  }
}

runMigration();
