-- ============================================
-- SIMPLE CLIENTID FIX - JUST ADD THE COLUMNS
-- ============================================
-- This script simply adds clientId columns to all tables.
-- No errors, no checks, just add what's needed.
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ============================================

-- Stap 1: Zorg dat Client tabel bestaat
CREATE TABLE IF NOT EXISTS "Client" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "email" TEXT UNIQUE,
  "companyName" TEXT,
  "website" TEXT,
  "description" TEXT,
  "status" TEXT DEFAULT 'active',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Stap 2: Voeg clientId kolom toe aan BlogPost
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "clientId" TEXT;

-- Stap 3: Voeg clientId kolom toe aan andere tabellen
ALTER TABLE "ContentPlan" ADD COLUMN IF NOT EXISTS "clientId" TEXT;
ALTER TABLE "TopicalAuthorityMap" ADD COLUMN IF NOT EXISTS "clientId" TEXT;
ALTER TABLE "SocialMediaStrategy" ADD COLUMN IF NOT EXISTS "clientId" TEXT;
ALTER TABLE "WebsiteAnalysis" ADD COLUMN IF NOT EXISTS "clientId" TEXT;
ALTER TABLE "AutopilotConfig" ADD COLUMN IF NOT EXISTS "clientId" TEXT;

-- Stap 4: Voeg foreign keys toe (drop eerst als ze al bestaan)
ALTER TABLE "BlogPost" DROP CONSTRAINT IF EXISTS "BlogPost_clientId_fkey";
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_clientId_fkey" 
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE;

ALTER TABLE "ContentPlan" DROP CONSTRAINT IF EXISTS "ContentPlan_clientId_fkey";
ALTER TABLE "ContentPlan" ADD CONSTRAINT "ContentPlan_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE;

ALTER TABLE "TopicalAuthorityMap" DROP CONSTRAINT IF EXISTS "TopicalAuthorityMap_clientId_fkey";
ALTER TABLE "TopicalAuthorityMap" ADD CONSTRAINT "TopicalAuthorityMap_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE;

ALTER TABLE "SocialMediaStrategy" DROP CONSTRAINT IF EXISTS "SocialMediaStrategy_clientId_fkey";
ALTER TABLE "SocialMediaStrategy" ADD CONSTRAINT "SocialMediaStrategy_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE;

ALTER TABLE "WebsiteAnalysis" DROP CONSTRAINT IF EXISTS "WebsiteAnalysis_clientId_fkey";
ALTER TABLE "WebsiteAnalysis" ADD CONSTRAINT "WebsiteAnalysis_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE;

ALTER TABLE "AutopilotConfig" DROP CONSTRAINT IF EXISTS "AutopilotConfig_clientId_fkey";
ALTER TABLE "AutopilotConfig" ADD CONSTRAINT "AutopilotConfig_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE;

-- Stap 5: Voeg indexes toe voor performance
CREATE INDEX IF NOT EXISTS "BlogPost_clientId_idx" ON "BlogPost"("clientId");
CREATE INDEX IF NOT EXISTS "ContentPlan_clientId_idx" ON "ContentPlan"("clientId");
CREATE INDEX IF NOT EXISTS "TopicalAuthorityMap_clientId_idx" ON "TopicalAuthorityMap"("clientId");
CREATE INDEX IF NOT EXISTS "SocialMediaStrategy_clientId_idx" ON "SocialMediaStrategy"("clientId");
CREATE INDEX IF NOT EXISTS "WebsiteAnalysis_clientId_idx" ON "WebsiteAnalysis"("clientId");
CREATE INDEX IF NOT EXISTS "AutopilotConfig_clientId_idx" ON "AutopilotConfig"("clientId");

-- Stap 6: Verify (geen errors, gewoon info)
SELECT 
  'BlogPost' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'BlogPost' AND column_name = 'clientId'
  ) as has_clientId;

SELECT 
  'ContentPlan' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ContentPlan' AND column_name = 'clientId'
  ) as has_clientId;

SELECT 
  'TopicalAuthorityMap' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'TopicalAuthorityMap' AND column_name = 'clientId'
  ) as has_clientId;

SELECT 
  'SocialMediaStrategy' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'SocialMediaStrategy' AND column_name = 'clientId'
  ) as has_clientId;

SELECT 
  'WebsiteAnalysis' as table_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'WebsiteAnalysis' AND column_name = 'clientId'
  ) as has_clientId;

SELECT '✅ Simple ClientId fix completed!' as status;
