-- Google Search Console Data Tables

-- GSC Performance per URL
CREATE TABLE IF NOT EXISTS "GSCPerformance" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "url" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "impressions" INTEGER DEFAULT 0,
  "clicks" INTEGER DEFAULT 0,
  "ctr" DECIMAL(5,4) DEFAULT 0,
  "position" DECIMAL(5,2) DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("projectId", "url", "date")
);

CREATE INDEX "GSCPerformance_projectId_idx" ON "GSCPerformance"("projectId");
CREATE INDEX "GSCPerformance_url_idx" ON "GSCPerformance"("url");
CREATE INDEX "GSCPerformance_date_idx" ON "GSCPerformance"("date");

-- GSC Queries per URL
CREATE TABLE IF NOT EXISTS "GSCQuery" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "url" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "impressions" INTEGER DEFAULT 0,
  "clicks" INTEGER DEFAULT 0,
  "ctr" DECIMAL(5,4) DEFAULT 0,
  "position" DECIMAL(5,2) DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("projectId", "url", "query", "date")
);

CREATE INDEX "GSCQuery_projectId_idx" ON "GSCQuery"("projectId");
CREATE INDEX "GSCQuery_url_idx" ON "GSCQuery"("url");
CREATE INDEX "GSCQuery_query_idx" ON "GSCQuery"("query");

-- Performance Alerts
CREATE TABLE IF NOT EXISTS "PerformanceAlert" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "url" TEXT NOT NULL,
  "alertType" TEXT NOT NULL, -- 'clicks_drop', 'position_drop', 'ctr_drop', 'impressions_drop'
  "severity" TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  "message" TEXT NOT NULL,
  "oldValue" DECIMAL(10,2),
  "newValue" DECIMAL(10,2),
  "percentageChange" DECIMAL(5,2),
  "isRead" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "PerformanceAlert_projectId_idx" ON "PerformanceAlert"("projectId");
CREATE INDEX "PerformanceAlert_isRead_idx" ON "PerformanceAlert"("isRead");
CREATE INDEX "PerformanceAlert_createdAt_idx" ON "PerformanceAlert"("createdAt");

-- AI Improvement Tips
CREATE TABLE IF NOT EXISTS "ImprovementTip" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "url" TEXT NOT NULL,
  "tipType" TEXT NOT NULL, -- 'content_update', 'keyword_optimization', 'internal_links', 'meta_description'
  "priority" TEXT NOT NULL, -- 'low', 'medium', 'high', 'urgent'
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "actionItems" JSONB DEFAULT '[]',
  "isCompleted" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "completedAt" TIMESTAMP
);

CREATE INDEX "ImprovementTip_projectId_idx" ON "ImprovementTip"("projectId");
CREATE INDEX "ImprovementTip_priority_idx" ON "ImprovementTip"("priority");
CREATE INDEX "ImprovementTip_isCompleted_idx" ON "ImprovementTip"("isCompleted");

-- Google Algorithm Updates
CREATE TABLE IF NOT EXISTS "GoogleUpdate" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "type" TEXT NOT NULL, -- 'core', 'spam', 'helpful_content', 'product_reviews', 'other'
  "description" TEXT,
  "impactLevel" TEXT, -- 'minor', 'moderate', 'major'
  "officialUrl" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("name", "date")
);

CREATE INDEX "GoogleUpdate_date_idx" ON "GoogleUpdate"("date");

-- Impact van Google Updates op projecten
CREATE TABLE IF NOT EXISTS "UpdateImpact" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "updateId" TEXT NOT NULL REFERENCES "GoogleUpdate"("id") ON DELETE CASCADE,
  "impactScore" DECIMAL(5,2), -- -100 to +100
  "clicksChange" DECIMAL(5,2),
  "impressionsChange" DECIMAL(5,2),
  "positionChange" DECIMAL(5,2),
  "affectedUrls" JSONB DEFAULT '[]',
  "analysis" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("projectId", "updateId")
);

CREATE INDEX "UpdateImpact_projectId_idx" ON "UpdateImpact"("projectId");
CREATE INDEX "UpdateImpact_updateId_idx" ON "UpdateImpact"("updateId");

-- GSC Sync Status
CREATE TABLE IF NOT EXISTS "GSCSyncStatus" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "lastSyncAt" TIMESTAMP,
  "lastSyncStatus" TEXT, -- 'success', 'error', 'in_progress'
  "lastSyncError" TEXT,
  "nextSyncAt" TIMESTAMP,
  "totalUrls" INTEGER DEFAULT 0,
  "totalQueries" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("projectId")
);

CREATE INDEX "GSCSyncStatus_projectId_idx" ON "GSCSyncStatus"("projectId");
