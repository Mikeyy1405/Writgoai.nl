-- Email Drafts Table
-- Migration for email drafts functionality

-- EmailDraft table for storing draft emails
CREATE TABLE IF NOT EXISTS "EmailDraft" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL, -- The admin user who created the draft
  "mailboxId" TEXT NOT NULL, -- Which mailbox to send from
  
  -- Recipients
  "to" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "cc" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "bcc" TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Content
  "subject" TEXT NOT NULL DEFAULT '',
  "bodyHtml" TEXT NOT NULL DEFAULT '',
  "bodyText" TEXT NOT NULL DEFAULT '',
  
  -- Threading (for replies/forwards)
  "inReplyTo" TEXT, -- Message-ID of the email being replied to
  "references" TEXT[] DEFAULT ARRAY[]::TEXT[], -- Thread references
  "isReply" BOOLEAN NOT NULL DEFAULT false,
  "isForward" BOOLEAN NOT NULL DEFAULT false,
  "originalMessageId" TEXT, -- UID of the original InboxEmail
  
  -- Attachments (future enhancement)
  "attachments" JSONB DEFAULT '[]'::JSONB,
  
  -- Metadata
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "EmailDraft_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "MailboxConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "EmailDraft_userId_idx" ON "EmailDraft"("userId");
CREATE INDEX IF NOT EXISTS "EmailDraft_mailboxId_idx" ON "EmailDraft"("mailboxId");
CREATE INDEX IF NOT EXISTS "EmailDraft_createdAt_idx" ON "EmailDraft"("createdAt");
CREATE INDEX IF NOT EXISTS "EmailDraft_updatedAt_idx" ON "EmailDraft"("updatedAt");

-- Add trigger to update updatedAt automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_draft_updated_at BEFORE UPDATE ON "EmailDraft"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
