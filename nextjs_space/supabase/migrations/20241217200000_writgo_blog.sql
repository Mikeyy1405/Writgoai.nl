-- Blog Posts voor Writgo.nl zelf
-- Deze tabel wordt gebruikt om content te publiceren op de publieke Writgo.nl blog

CREATE TABLE IF NOT EXISTS "BlogPost" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "excerpt" TEXT,
  "content" TEXT NOT NULL,
  "coverImage" TEXT,
  "author" TEXT DEFAULT 'Writgo Team',
  "category" TEXT,
  "tags" TEXT[],
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  "focusKeyword" TEXT,
  "status" TEXT DEFAULT 'draft', -- 'draft', 'published'
  "publishedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Indices voor snelle queries
CREATE INDEX IF NOT EXISTS "BlogPost_slug_idx" ON "BlogPost"("slug");
CREATE INDEX IF NOT EXISTS "BlogPost_status_idx" ON "BlogPost"("status");
CREATE INDEX IF NOT EXISTS "BlogPost_publishedAt_idx" ON "BlogPost"("publishedAt");
CREATE INDEX IF NOT EXISTS "BlogPost_category_idx" ON "BlogPost"("category");

-- Relatie tussen PlannedArticle en BlogPost
-- Zodat we kunnen tracken welke gegenereerde artikelen naar de blog zijn gepubliceerd
ALTER TABLE "PlannedArticle" ADD COLUMN IF NOT EXISTS "blogPostId" TEXT;

-- Foreign key constraint (optioneel, handig voor data integriteit)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'PlannedArticle_blogPostId_fkey'
  ) THEN
    ALTER TABLE "PlannedArticle" 
    ADD CONSTRAINT "PlannedArticle_blogPostId_fkey" 
    FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE SET NULL;
  END IF;
END $$;
