-- SitePlan table for AI-generated content strategies
-- This table stores the complete content planning structure for each project

CREATE TABLE IF NOT EXISTS "SitePlan" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "clientId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Content Strategy',
    "homepage" JSONB,
    "pillarPages" JSONB,
    "clusterPages" JSONB,
    "blogPosts" JSONB,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetAudience" TEXT,
    "language" TEXT NOT NULL DEFAULT 'nl',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "generatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SitePlan_pkey" PRIMARY KEY ("id")
);

-- Each project can have only one site plan
CREATE UNIQUE INDEX IF NOT EXISTS "SitePlan_projectId_key" ON "SitePlan"("projectId");
CREATE INDEX IF NOT EXISTS "SitePlan_clientId_idx" ON "SitePlan"("clientId");
CREATE INDEX IF NOT EXISTS "SitePlan_status_idx" ON "SitePlan"("status");

-- Foreign key constraints
ALTER TABLE "SitePlan" ADD CONSTRAINT "SitePlan_clientId_fkey" 
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SitePlan" ADD CONSTRAINT "SitePlan_projectId_fkey" 
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Updated at trigger
CREATE TRIGGER update_site_plan_updated_at BEFORE UPDATE ON "SitePlan" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE "SitePlan" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own site plans" ON "SitePlan"
  FOR SELECT USING (
    "clientId" = auth.uid()::text 
    OR auth.jwt() ->> 'role' = 'admin'
    OR auth.jwt() ->> 'role' = 'superadmin'
  );

CREATE POLICY "Users can insert own site plans" ON "SitePlan"
  FOR INSERT WITH CHECK (
    "clientId" = auth.uid()::text
  );

CREATE POLICY "Users can update own site plans" ON "SitePlan"
  FOR UPDATE USING (
    "clientId" = auth.uid()::text 
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can delete own site plans" ON "SitePlan"
  FOR DELETE USING (
    "clientId" = auth.uid()::text
  );
