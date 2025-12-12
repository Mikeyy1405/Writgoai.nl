-- ============================================
-- CREATE WEBSITEANALYSIS TABLE
-- ============================================
-- Dit script maakt de WebsiteAnalysis tabel aan voor de AI Website Analyzer functionaliteit
-- Het kan veilig meerdere keren worden uitgevoerd (IF NOT EXISTS)

-- Maak WebsiteAnalysis tabel aan
CREATE TABLE IF NOT EXISTS "WebsiteAnalysis" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL,
  "projectId" TEXT,
  
  -- Analyse resultaten
  niche TEXT NOT NULL,
  "nicheConfidence" INTEGER DEFAULT 0,
  "targetAudience" TEXT NOT NULL,
  "audienceConfidence" INTEGER DEFAULT 0,
  tone TEXT NOT NULL,
  "toneConfidence" INTEGER DEFAULT 0,
  keywords TEXT[] DEFAULT '{}',
  themes TEXT[] DEFAULT '{}',
  reasoning TEXT,
  
  -- Metadata over de analyse
  "websiteUrl" TEXT,
  "blogPostsAnalyzed" INTEGER DEFAULT 0,
  "socialPostsAnalyzed" INTEGER DEFAULT 0,
  
  -- Timestamps
  "analyzedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Voeg foreign key toe naar Client (als Client tabel bestaat)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Client') THEN
    -- Drop bestaande constraint eerst (voor idempotentie)
    ALTER TABLE "WebsiteAnalysis" DROP CONSTRAINT IF EXISTS "WebsiteAnalysis_clientId_fkey";
    
    -- Voeg nieuwe constraint toe
    ALTER TABLE "WebsiteAnalysis" ADD CONSTRAINT "WebsiteAnalysis_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"(id) ON DELETE CASCADE;
      
    RAISE NOTICE '✅ Foreign key naar Client toegevoegd';
  ELSE
    RAISE NOTICE '⚠️  Client tabel bestaat niet - foreign key overgeslagen';
  END IF;
END $$;

-- Voeg foreign key toe naar Project (als Project tabel bestaat)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Project') THEN
    -- Drop bestaande constraint eerst (voor idempotentie)
    ALTER TABLE "WebsiteAnalysis" DROP CONSTRAINT IF EXISTS "WebsiteAnalysis_projectId_fkey";
    
    -- Voeg nieuwe constraint toe
    ALTER TABLE "WebsiteAnalysis" ADD CONSTRAINT "WebsiteAnalysis_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE;
      
    RAISE NOTICE '✅ Foreign key naar Project toegevoegd';
  ELSE
    RAISE NOTICE '⚠️  Project tabel bestaat niet - foreign key overgeslagen';
  END IF;
END $$;

-- Voeg indexes toe voor betere query performance
CREATE INDEX IF NOT EXISTS "WebsiteAnalysis_clientId_idx" ON "WebsiteAnalysis"("clientId");
CREATE INDEX IF NOT EXISTS "WebsiteAnalysis_projectId_idx" ON "WebsiteAnalysis"("projectId");
CREATE INDEX IF NOT EXISTS "WebsiteAnalysis_analyzedAt_idx" ON "WebsiteAnalysis"("analyzedAt");

-- Voeg trigger toe voor automatische updatedAt update
CREATE TRIGGER update_websiteanalysis_updated_at
  BEFORE UPDATE ON "WebsiteAnalysis"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATIE
-- ============================================

-- Toon tabel structuur
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'WebsiteAnalysis'
ORDER BY ordinal_position;

-- Toon foreign keys
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as foreign_table
FROM pg_constraint
WHERE conrelid = 'WebsiteAnalysis'::regclass
  AND contype = 'f';

-- Toon indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'WebsiteAnalysis';

-- Succesbericht
SELECT '✅ WebsiteAnalysis tabel succesvol aangemaakt!' as status;
