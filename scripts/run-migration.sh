#!/bin/bash

# Media Library Migration Runner
# This script helps you run the migration safely

set -e

echo "🚀 Media Library Migration"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ No .env.local file found!"
    echo ""
    echo "📋 To run the migration, you have 2 options:"
    echo ""
    echo "OPTION 1: Manual (Recommended - Most Secure)"
    echo "────────────────────────────────────────────"
    echo "1. Go to https://supabase.com/dashboard"
    echo "2. Select your Writgo project"
    echo "3. Click 'SQL Editor' in the sidebar"
    echo "4. Copy the SQL from: supabase/migrations/20251225091252_media_library.sql"
    echo "5. Paste and click 'Run'"
    echo ""
    echo "OPTION 2: Automated (Requires credentials)"
    echo "────────────────────────────────────────────"
    echo "1. Create a .env.local file with:"
    echo "   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
    echo "   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    echo "2. Run: npm run migrate"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Show the SQL to copy
    echo "📄 SQL to run (copy this):"
    echo ""
    cat supabase/migrations/20251225091252_media_library.sql
    echo ""
    exit 1
fi

echo "✅ Found .env.local"
echo ""

# Try to run with Node.js
if command -v node &> /dev/null; then
    echo "🔄 Running migration with Node.js..."
    echo ""
    node scripts/run-migration.js
else
    echo "❌ Node.js not found!"
    echo ""
    echo "Please install Node.js or run the migration manually via Supabase Dashboard."
    exit 1
fi
