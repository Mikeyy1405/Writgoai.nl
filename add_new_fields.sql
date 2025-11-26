-- Add new fields to ClientAIProfile if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ClientAIProfile' AND column_name='lastAIScanAt') THEN
        ALTER TABLE "ClientAIProfile" ADD COLUMN "lastAIScanAt" TIMESTAMP(3);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ClientAIProfile' AND column_name='aiScanCompleted') THEN
        ALTER TABLE "ClientAIProfile" ADD COLUMN "aiScanCompleted" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- Add affiliateLinksUsed to PublishedArticle if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PublishedArticle' AND column_name='affiliateLinksUsed') THEN
        ALTER TABLE "PublishedArticle" ADD COLUMN "affiliateLinksUsed" TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
END $$;

-- Create AffiliateLink table if it doesn't exist
CREATE TABLE IF NOT EXISTS "AffiliateLink" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateLink_pkey" PRIMARY KEY ("id")
);

-- Create indexes for AffiliateLink if they don't exist
CREATE INDEX IF NOT EXISTS "AffiliateLink_clientId_idx" ON "AffiliateLink"("clientId");
CREATE INDEX IF NOT EXISTS "AffiliateLink_isActive_idx" ON "AffiliateLink"("isActive");

-- Add foreign key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AffiliateLink_clientId_fkey'
    ) THEN
        ALTER TABLE "AffiliateLink" ADD CONSTRAINT "AffiliateLink_clientId_fkey" 
        FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
