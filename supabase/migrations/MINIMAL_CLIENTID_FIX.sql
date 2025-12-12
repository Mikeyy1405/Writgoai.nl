-- ============================================
-- MINIMAL FIX - JUST BLOGPOST
-- ============================================
-- Als de SIMPLE fix niet werkt, probeer dit eerst.
-- Dit voegt alleen de clientId kolom toe aan BlogPost.
-- ============================================

-- Alleen BlogPost fixen
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "clientId" TEXT;

-- Verify
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'BlogPost' AND column_name = 'clientId';

SELECT '✅ BlogPost clientId column added!' as status;
