-- Content Plans Tables Migration (FIXED)
-- Creates tables for AI Content Plan Generator feature
-- FIXED: Changed UUID to TEXT to match existing Client.id and BlogPost.id datatypes

-- ============================================
-- CLEANUP SCRIPT (Run this first if migration was partially executed)
-- ============================================
-- Uncomment these lines if you need to clean up a failed migration:
-- DROP TABLE IF EXISTS "ContentPlanItem" CASCADE;
-- DROP TABLE IF EXISTS "ContentPlan" CASCADE;

-- ============================================
-- CREATE TABLES
-- ============================================

-- Create ContentPlan table
CREATE TABLE "ContentPlan" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "niche" TEXT NOT NULL,
  "targetAudience" TEXT NOT NULL,
  "language" TEXT NOT NULL DEFAULT 'nl',
  "tone" TEXT NOT NULL DEFAULT 'professioneel',
  "totalPosts" INTEGER NOT NULL,
  "period" TEXT NOT NULL, -- '1 week', '1 maand', etc.
  "keywords" TEXT[], -- Array of keywords
  "status" TEXT NOT NULL DEFAULT 'draft', -- draft, in_progress, completed
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "ContentPlan_clientId_fkey" FOREIGN KEY ("clientId") 
    REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create ContentPlanItem table
CREATE TABLE "ContentPlanItem" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "planId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "scheduledDate" TIMESTAMPTZ,
  "keywords" TEXT[], -- Array of keywords for this blog
  "contentType" TEXT NOT NULL DEFAULT 'Guide', -- How-to, Listicle, Guide, Case Study, etc.
  "estimatedWords" INTEGER DEFAULT 1000,
  "status" TEXT NOT NULL DEFAULT 'pending', -- pending, generating, generated, published, failed
  "blogPostId" TEXT, -- Link to generated BlogPost (TEXT because BlogPost.id is TEXT)
  "order" INTEGER NOT NULL DEFAULT 0, -- Order in the plan
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "ContentPlanItem_planId_fkey" FOREIGN KEY ("planId") 
    REFERENCES "ContentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ContentPlanItem_blogPostId_fkey" FOREIGN KEY ("blogPostId") 
    REFERENCES "BlogPost"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX "ContentPlan_clientId_idx" ON "ContentPlan"("clientId");
CREATE INDEX "ContentPlan_status_idx" ON "ContentPlan"("status");
CREATE INDEX "ContentPlan_createdAt_idx" ON "ContentPlan"("createdAt" DESC);

CREATE INDEX "ContentPlanItem_planId_idx" ON "ContentPlanItem"("planId");
CREATE INDEX "ContentPlanItem_status_idx" ON "ContentPlanItem"("status");
CREATE INDEX "ContentPlanItem_scheduledDate_idx" ON "ContentPlanItem"("scheduledDate");
CREATE INDEX "ContentPlanItem_blogPostId_idx" ON "ContentPlanItem"("blogPostId");

-- ============================================
-- CREATE TRIGGERS
-- ============================================

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for automatic updatedAt updates
CREATE TRIGGER update_content_plan_updated_at BEFORE UPDATE ON "ContentPlan"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_plan_item_updated_at BEFORE UPDATE ON "ContentPlanItem"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE "ContentPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContentPlanItem" ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "ContentPlan admin access" ON "ContentPlan"
  FOR ALL USING (true);

CREATE POLICY "ContentPlanItem admin access" ON "ContentPlanItem"
  FOR ALL USING (true);

-- ============================================
-- TABLE COMMENTS
-- ============================================

COMMENT ON TABLE "ContentPlan" IS 'Stores AI-generated content plans for blog scheduling';
COMMENT ON TABLE "ContentPlanItem" IS 'Individual blog posts within a content plan';
COMMENT ON COLUMN "ContentPlan"."status" IS 'draft: plan created, in_progress: generating blogs, completed: all blogs generated';
COMMENT ON COLUMN "ContentPlanItem"."status" IS 'pending: not started, generating: AI generating, generated: blog created, published: live, failed: generation error';
