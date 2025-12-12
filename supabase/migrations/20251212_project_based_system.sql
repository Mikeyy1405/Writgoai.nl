-- =====================================================
-- PROJECT-BASED SYSTEM
-- Affiliate Links, Knowledge Base, Project Settings
-- =====================================================

-- 1. AFFILIATE LINKS TABLE
CREATE TABLE IF NOT EXISTS "AffiliateLink" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT, -- bijv. "product", "service", "tool"
  "keywords" TEXT[], -- Keywords waar deze link relevant voor is
  "isActive" BOOLEAN DEFAULT true,
  "clickCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "AffiliateLink_projectId_idx" ON "AffiliateLink"("projectId");
CREATE INDEX IF NOT EXISTS "AffiliateLink_isActive_idx" ON "AffiliateLink"("isActive");

-- 2. KNOWLEDGE BASE TABLE
CREATE TABLE IF NOT EXISTS "KnowledgeBase" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "type" TEXT DEFAULT 'document', -- "document", "faq", "guideline", "brand_voice"
  "tags" TEXT[],
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "KnowledgeBase_projectId_idx" ON "KnowledgeBase"("projectId");
CREATE INDEX IF NOT EXISTS "KnowledgeBase_type_idx" ON "KnowledgeBase"("type");
CREATE INDEX IF NOT EXISTS "KnowledgeBase_isActive_idx" ON "KnowledgeBase"("isActive");

-- 3. PROJECT SETTINGS TABLE (Extended)
CREATE TABLE IF NOT EXISTS "ProjectSettings" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId" TEXT NOT NULL UNIQUE REFERENCES "Project"("id") ON DELETE CASCADE,
  
  -- Brand Settings
  "brandVoice" TEXT,
  "targetAudience" TEXT,
  "contentGuidelines" TEXT,
  
  -- SEO Settings
  "defaultSeoTitle" TEXT,
  "defaultSeoDescription" TEXT,
  "defaultKeywords" TEXT[],
  
  -- Content Settings
  "autoIncludeAffiliateLinks" BOOLEAN DEFAULT true,
  "useKnowledgeBase" BOOLEAN DEFAULT true,
  "contentTone" TEXT DEFAULT 'professional', -- "professional", "casual", "friendly", "authoritative"
  
  -- Publishing Settings
  "autoPublishBlogs" BOOLEAN DEFAULT false,
  "autoPublishSocial" BOOLEAN DEFAULT false,
  
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "ProjectSettings_projectId_idx" ON "ProjectSettings"("projectId");

-- 4. UPDATE PROJECT TABLE (Add metadata column if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Project' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE "Project" ADD COLUMN "metadata" JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- 5. RLS POLICIES

-- AffiliateLink policies
ALTER TABLE "AffiliateLink" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "AffiliateLink_select_policy" ON "AffiliateLink";
CREATE POLICY "AffiliateLink_select_policy" ON "AffiliateLink"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "AffiliateLink_insert_policy" ON "AffiliateLink";
CREATE POLICY "AffiliateLink_insert_policy" ON "AffiliateLink"
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "AffiliateLink_update_policy" ON "AffiliateLink";
CREATE POLICY "AffiliateLink_update_policy" ON "AffiliateLink"
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "AffiliateLink_delete_policy" ON "AffiliateLink";
CREATE POLICY "AffiliateLink_delete_policy" ON "AffiliateLink"
  FOR DELETE USING (true);

-- KnowledgeBase policies
ALTER TABLE "KnowledgeBase" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "KnowledgeBase_select_policy" ON "KnowledgeBase";
CREATE POLICY "KnowledgeBase_select_policy" ON "KnowledgeBase"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "KnowledgeBase_insert_policy" ON "KnowledgeBase";
CREATE POLICY "KnowledgeBase_insert_policy" ON "KnowledgeBase"
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "KnowledgeBase_update_policy" ON "KnowledgeBase";
CREATE POLICY "KnowledgeBase_update_policy" ON "KnowledgeBase"
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "KnowledgeBase_delete_policy" ON "KnowledgeBase";
CREATE POLICY "KnowledgeBase_delete_policy" ON "KnowledgeBase"
  FOR DELETE USING (true);

-- ProjectSettings policies
ALTER TABLE "ProjectSettings" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ProjectSettings_select_policy" ON "ProjectSettings";
CREATE POLICY "ProjectSettings_select_policy" ON "ProjectSettings"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "ProjectSettings_insert_policy" ON "ProjectSettings";
CREATE POLICY "ProjectSettings_insert_policy" ON "ProjectSettings"
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "ProjectSettings_update_policy" ON "ProjectSettings";
CREATE POLICY "ProjectSettings_update_policy" ON "ProjectSettings"
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "ProjectSettings_delete_policy" ON "ProjectSettings";
CREATE POLICY "ProjectSettings_delete_policy" ON "ProjectSettings"
  FOR DELETE USING (true);

-- 6. TRIGGERS FOR UPDATED_AT

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_affiliatelink_updated_at ON "AffiliateLink";
CREATE TRIGGER update_affiliatelink_updated_at
  BEFORE UPDATE ON "AffiliateLink"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledgebase_updated_at ON "KnowledgeBase";
CREATE TRIGGER update_knowledgebase_updated_at
  BEFORE UPDATE ON "KnowledgeBase"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projectsettings_updated_at ON "ProjectSettings";
CREATE TRIGGER update_projectsettings_updated_at
  BEFORE UPDATE ON "ProjectSettings"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Project-based system tables created successfully!';
END $$;
