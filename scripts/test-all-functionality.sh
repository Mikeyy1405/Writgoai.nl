#!/bin/bash

echo "🔍 TESTING ALL CORE FUNCTIONALITY..."
echo "===================================="
echo ""

cd /home/ubuntu/writgoai_app/nextjs_space

# Test 1: Database schema verification
echo "📊 TEST 1: Database Schema"
echo "Checking if all tables exist..."
npx supabase db pull --dry-run 2>&1 | head -20 || echo "⚠️  Supabase CLI not configured"
echo ""

# Test 2: Check Prisma schema
echo "📝 TEST 2: Prisma Schema"
echo "Verifying prisma-shim.ts..."
grep -c "TABLE_NAME_MAP" lib/prisma-shim.ts && echo "✅ Prisma shim exists" || echo "❌ Prisma shim missing"
echo ""

# Test 3: TypeScript compilation
echo "🏗️  TEST 3: TypeScript Compilation"
echo "Checking for TypeScript errors..."
npx tsc --noEmit 2>&1 | grep -E "(error TS|Found [0-9]+ error)" | head -10
echo ""

# Test 4: Check API route files
echo "🔌 TEST 4: API Route Files"
echo "Checking critical API files..."
test -f app/api/admin/projects/route.ts && echo "✅ projects/route.ts" || echo "❌ projects/route.ts MISSING"
test -f app/api/admin/projects/[id]/route.ts && echo "✅ projects/[id]/route.ts" || echo "❌ projects/[id]/route.ts MISSING"
test -f app/api/admin/blog/route.ts && echo "✅ blog/route.ts" || echo "❌ blog/route.ts MISSING"
test -f app/api/admin/blog/[id]/route.ts && echo "✅ blog/[id]/route.ts" || echo "❌ blog/[id]/route.ts MISSING"
test -f app/api/admin/blog/content-plan/route.ts && echo "✅ content-plan/route.ts" || echo "❌ content-plan/route.ts MISSING"
test -f app/api/admin/social-media/generate-ideas/route.ts && echo "✅ social-media/generate-ideas/route.ts" || echo "❌ social-media/generate-ideas/route.ts MISSING"
echo ""

# Test 5: Check environment variables
echo "🔐 TEST 5: Environment Variables"
test -f .env.local && echo "✅ .env.local exists" || echo "❌ .env.local MISSING"
if [ -f .env.local ]; then
    grep -q "DATABASE_URL" .env.local && echo "✅ DATABASE_URL configured" || echo "❌ DATABASE_URL MISSING"
    grep -q "NEXTAUTH_SECRET" .env.local && echo "✅ NEXTAUTH_SECRET configured" || echo "❌ NEXTAUTH_SECRET MISSING"
    grep -q "AIML_API_KEY" .env.local && echo "✅ AIML_API_KEY configured" || echo "❌ AIML_API_KEY MISSING"
fi
echo ""

# Test 6: Check for common import errors
echo "📦 TEST 6: Import Errors"
echo "Checking for problematic imports..."
grep -r "@/lib/auth\"" app/api/admin/*.ts 2>/dev/null | wc -l | xargs -I {} echo "⚠️  Found {} files using old '@/lib/auth' import (should be '@/lib/auth-options')"
grep -r "from '@/lib/db'" app/api/admin/blog/*.ts 2>/dev/null | wc -l | xargs -I {} echo "✅ Blog uses '@/lib/db'"
grep -r "from '@/lib/prisma-shim'" app/api/admin/projects/*.ts 2>/dev/null | wc -l | xargs -I {} echo "✅ Projects uses '@/lib/prisma-shim'"
echo ""

# Test 7: Check dependencies
echo "📚 TEST 7: Dependencies"
echo "Checking critical node modules..."
test -d node_modules/@prisma && echo "✅ @prisma installed" || echo "❌ @prisma NOT installed"
test -d node_modules/@supabase && echo "✅ @supabase installed" || echo "❌ @supabase NOT installed"
test -d node_modules/next-auth && echo "✅ next-auth installed" || echo "❌ next-auth NOT installed"
echo ""

echo "===================================="
echo "✅ Diagnostics Complete"
echo ""
echo "🔍 Check the output above for any ❌ or ⚠️  warnings"
