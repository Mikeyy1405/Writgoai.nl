-- Add contentId column to ContentHubArticle
-- This links content hub articles to the main content library
ALTER TABLE "ContentHubArticle" ADD COLUMN "contentId" TEXT;
