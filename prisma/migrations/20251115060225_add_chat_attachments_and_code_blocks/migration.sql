
-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "attachments" JSONB;
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "codeBlocks" JSONB;
