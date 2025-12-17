-- GEFIXTE BlogPost Migratie
-- Deze migratie werkt veilig, ongeacht of de tabel al bestaat of niet
-- Elke stap checkt eerst of de resource al bestaat voordat deze wordt aangemaakt

-- ============================================================================
-- STAP 1: Maak BlogPost tabel aan (als deze nog niet bestaat)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "BlogPost" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "status" TEXT DEFAULT 'draft',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- STAP 2: Voeg alle extra kolommen toe (alleen als ze nog niet bestaan)
-- ============================================================================
DO $$ 
BEGIN
  -- excerpt kolom
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'BlogPost' AND column_name = 'excerpt'
  ) THEN
    ALTER TABLE "BlogPost" ADD COLUMN "excerpt" TEXT;
  END IF;
  
  -- coverImage kolom
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'BlogPost' AND column_name = 'coverImage'
  ) THEN
    ALTER TABLE "BlogPost" ADD COLUMN "coverImage" TEXT;
  END IF;
  
  -- author kolom
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'BlogPost' AND column_name = 'author'
  ) THEN
    ALTER TABLE "BlogPost" ADD COLUMN "author" TEXT DEFAULT 'Writgo Team';
  END IF;
  
  -- category kolom
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'BlogPost' AND column_name = 'category'
  ) THEN
    ALTER TABLE "BlogPost" ADD COLUMN "category" TEXT;
  END IF;
  
  -- tags kolom (array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'BlogPost' AND column_name = 'tags'
  ) THEN
    ALTER TABLE "BlogPost" ADD COLUMN "tags" TEXT[];
  END IF;
  
  -- metaTitle kolom
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'BlogPost' AND column_name = 'metaTitle'
  ) THEN
    ALTER TABLE "BlogPost" ADD COLUMN "metaTitle" TEXT;
  END IF;
  
  -- metaDescription kolom
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'BlogPost' AND column_name = 'metaDescription'
  ) THEN
    ALTER TABLE "BlogPost" ADD COLUMN "metaDescription" TEXT;
  END IF;
  
  -- focusKeyword kolom
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'BlogPost' AND column_name = 'focusKeyword'
  ) THEN
    ALTER TABLE "BlogPost" ADD COLUMN "focusKeyword" TEXT;
  END IF;
  
  -- publishedAt kolom
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'BlogPost' AND column_name = 'publishedAt'
  ) THEN
    ALTER TABLE "BlogPost" ADD COLUMN "publishedAt" TIMESTAMP;
  END IF;
END $$;

-- ============================================================================
-- STAP 3: Voeg UNIQUE constraint toe aan slug (als deze nog niet bestaat)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'BlogPost_slug_key' AND conrelid = 'public."BlogPost"'::regclass
  ) THEN
    ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_slug_key" UNIQUE ("slug");
  END IF;
END $$;

-- ============================================================================
-- STAP 4: Maak indices aan (alleen als ze nog niet bestaan)
-- ============================================================================
CREATE INDEX IF NOT EXISTS "BlogPost_slug_idx" ON "BlogPost"("slug");
CREATE INDEX IF NOT EXISTS "BlogPost_status_idx" ON "BlogPost"("status");
CREATE INDEX IF NOT EXISTS "BlogPost_publishedAt_idx" ON "BlogPost"("publishedAt");
CREATE INDEX IF NOT EXISTS "BlogPost_category_idx" ON "BlogPost"("category");

-- ============================================================================
-- STAP 5: Voeg blogPostId kolom toe aan PlannedArticle (als deze nog niet bestaat)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'PlannedArticle' AND column_name = 'blogPostId'
  ) THEN
    ALTER TABLE "PlannedArticle" ADD COLUMN "blogPostId" TEXT;
  END IF;
END $$;

-- ============================================================================
-- STAP 6: Voeg foreign key constraint toe (als deze nog niet bestaat)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'PlannedArticle_blogPostId_fkey' AND conrelid = 'public."PlannedArticle"'::regclass
  ) THEN
    ALTER TABLE "PlannedArticle"
      ADD CONSTRAINT "PlannedArticle_blogPostId_fkey"
      FOREIGN KEY ("blogPostId") 
      REFERENCES "BlogPost"("id") 
      ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- VERIFICATIE: Toon resultaat
-- ============================================================================
DO $$
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'BlogPost';
  
  RAISE NOTICE 'BlogPost tabel heeft % kolommen', column_count;
END $$;
