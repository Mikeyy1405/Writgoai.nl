-- AlterTable SocialMediaConfig - Remove gelatenApiKey column
-- API key is now centrally managed via GELATEN_API_KEY environment variable
ALTER TABLE "SocialMediaConfig" DROP COLUMN IF EXISTS "gelatenApiKey";
