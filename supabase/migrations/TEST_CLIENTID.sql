-- ============================================
-- TEST CLIENTID - Check of het werkt
-- ============================================
-- Run dit script om te zien welke tabellen al
-- een clientId kolom hebben.
-- ============================================

-- Test of clientId kolom bestaat in alle tabellen
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'clientId'
ORDER BY table_name;

-- Als je geen resultaten ziet, dan moet je de fix runnen
-- Als je wel resultaten ziet, dan werkt het al! ✅
