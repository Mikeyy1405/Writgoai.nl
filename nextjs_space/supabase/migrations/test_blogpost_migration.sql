-- ============================================================================
-- BLOGPOST MIGRATIE VERIFICATIE QUERIES
-- ============================================================================
-- Gebruik deze queries om te verifiëren dat de BlogPost migratie succesvol is

-- ============================================================================
-- TEST 1: Check of BlogPost tabel bestaat
-- ============================================================================
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'BlogPost'
  ) as "BlogPost_tabel_bestaat";

-- ============================================================================
-- TEST 2: Toon alle kolommen van BlogPost tabel
-- ============================================================================
SELECT 
  column_name as "Kolom Naam", 
  data_type as "Data Type", 
  is_nullable as "Nullable",
  column_default as "Default Waarde"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'BlogPost'
ORDER BY ordinal_position;

-- ============================================================================
-- TEST 3: Check alle indices op BlogPost tabel
-- ============================================================================
SELECT 
  indexname as "Index Naam",
  indexdef as "Index Definitie"
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'BlogPost'
ORDER BY indexname;

-- ============================================================================
-- TEST 4: Check constraints op BlogPost tabel
-- ============================================================================
SELECT 
  conname as "Constraint Naam",
  contype as "Type",
  pg_get_constraintdef(oid) as "Definitie"
FROM pg_constraint
WHERE conrelid = 'public."BlogPost"'::regclass
ORDER BY conname;

-- ============================================================================
-- TEST 5: Check PlannedArticle.blogPostId kolom
-- ============================================================================
SELECT 
  column_name as "Kolom Naam",
  data_type as "Data Type",
  is_nullable as "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'PlannedArticle' 
  AND column_name = 'blogPostId';

-- ============================================================================
-- TEST 6: Check foreign key relatie tussen PlannedArticle en BlogPost
-- ============================================================================
SELECT 
  tc.constraint_name as "Constraint Naam",
  tc.table_name as "Van Tabel",
  kcu.column_name as "Van Kolom",
  ccu.table_name as "Naar Tabel",
  ccu.column_name as "Naar Kolom"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'PlannedArticle'
  AND kcu.column_name = 'blogPostId';

-- ============================================================================
-- TEST 7: Tel aantal records in BlogPost (moet 0 zijn voor nieuwe installatie)
-- ============================================================================
SELECT COUNT(*) as "Aantal BlogPost Records" FROM "BlogPost";

-- ============================================================================
-- TEST 8: Test insert en delete (om te checken of de tabel werkt)
-- ============================================================================
-- Insert test record
INSERT INTO "BlogPost" (slug, title, content, status)
VALUES ('test-post', 'Test Post', 'Dit is een test', 'draft')
RETURNING id, slug, title;

-- Verify het bestaat
SELECT id, slug, title, status, "createdAt"
FROM "BlogPost"
WHERE slug = 'test-post';

-- Clean up test record
DELETE FROM "BlogPost" WHERE slug = 'test-post';

-- Verify het is verwijderd
SELECT COUNT(*) as "Moet_0_zijn" FROM "BlogPost" WHERE slug = 'test-post';

-- ============================================================================
-- VERWACHTE UITKOMST
-- ============================================================================
/*
TEST 1: BlogPost_tabel_bestaat = TRUE

TEST 2: Moet 16 kolommen tonen:
  - id (text)
  - slug (text)
  - title (text)
  - content (text)
  - status (text)
  - createdAt (timestamp)
  - updatedAt (timestamp)
  - excerpt (text)
  - coverImage (text)
  - author (text)
  - category (text)
  - tags (ARRAY)
  - metaTitle (text)
  - metaDescription (text)
  - focusKeyword (text)
  - publishedAt (timestamp)

TEST 3: Moet 4 indices tonen:
  - BlogPost_pkey (PRIMARY KEY)
  - BlogPost_slug_idx
  - BlogPost_status_idx
  - BlogPost_publishedAt_idx
  - BlogPost_category_idx
  - BlogPost_slug_key (UNIQUE)

TEST 4: Moet constraints tonen:
  - BlogPost_pkey (PRIMARY KEY)
  - BlogPost_slug_key (UNIQUE)

TEST 5: Moet blogPostId kolom tonen in PlannedArticle

TEST 6: Moet PlannedArticle_blogPostId_fkey foreign key tonen

TEST 7: Moet 0 records tonen (voor nieuwe installatie)

TEST 8: Insert, select en delete moeten allemaal succesvol zijn
*/
