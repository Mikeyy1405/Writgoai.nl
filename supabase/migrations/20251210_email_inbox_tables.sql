-- Email Inbox System Tables
-- Migration for InboxEmail and MailboxConnection tables

-- MailboxConnection table
CREATE TABLE IF NOT EXISTS "MailboxConnection" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL,
  "provider" TEXT NOT NULL, -- 'imap', 'gmail', 'outlook'
  "email" TEXT NOT NULL,
  "displayName" TEXT,
  
  -- IMAP/SMTP Settings
  "imapHost" TEXT,
  "imapPort" INTEGER DEFAULT 993,
  "imapTls" BOOLEAN DEFAULT true,
  "smtpHost" TEXT,
  "smtpPort" INTEGER DEFAULT 587,
  "smtpTls" BOOLEAN DEFAULT true,
  
  -- Authentication (encrypted)
  -- WARNING: Base64 is NOT encryption! Use proper encryption (AES-256-GCM) or a secrets management system in production
  "password" TEXT, -- TEMP: Base64 encoded for IMAP - MUST be replaced with proper encryption
  "accessToken" TEXT, -- For OAuth providers
  "refreshToken" TEXT, -- For OAuth providers
  "tokenExpiry" TIMESTAMP(3), -- For OAuth providers
  
  -- Status
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastSyncAt" TIMESTAMP(3),
  "lastError" TEXT,
  
  -- Metadata
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "MailboxConnection_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- InboxEmail table
CREATE TABLE IF NOT EXISTS "InboxEmail" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "mailboxId" TEXT NOT NULL,
  "messageId" TEXT UNIQUE NOT NULL, -- IMAP message ID
  
  -- Email headers
  "from" TEXT NOT NULL,
  "fromName" TEXT,
  "to" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "cc" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "bcc" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "subject" TEXT NOT NULL,
  "inReplyTo" TEXT,
  "references" TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Email content
  "textBody" TEXT,
  "htmlBody" TEXT,
  "snippet" TEXT, -- First 200 chars
  
  -- Email status
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "isStarred" BOOLEAN NOT NULL DEFAULT false,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "folder" TEXT NOT NULL DEFAULT 'inbox',
  "receivedAt" TIMESTAMP(3) NOT NULL,
  
  -- AI Analysis
  "aiSummary" TEXT,
  "aiCategory" TEXT, -- support, sales, invoice, newsletter, spam
  "aiPriority" TEXT, -- high, medium, low
  "aiSentiment" TEXT, -- positive, neutral, negative
  "aiSuggestedReply" TEXT,
  "analyzedAt" TIMESTAMP(3),
  "creditsUsed" INTEGER DEFAULT 0,
  
  -- Invoice detection
  "isInvoice" BOOLEAN NOT NULL DEFAULT false,
  "invoiceAmount" DOUBLE PRECISION,
  "invoiceVendor" TEXT,
  "invoiceDueDate" TIMESTAMP(3),
  "moneybirdId" TEXT, -- Link to Moneybird purchase invoice
  
  -- Metadata
  "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
  "attachments" JSONB, -- Array of attachment info
  "headers" JSONB, -- Raw email headers
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "InboxEmail_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "MailboxConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- EmailThread table for grouping related emails
CREATE TABLE IF NOT EXISTS "EmailThread" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "subject" TEXT NOT NULL,
  "participants" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" TEXT NOT NULL DEFAULT 'open', -- open, closed, archived
  "priority" TEXT NOT NULL DEFAULT 'normal', -- urgent, high, normal, low
  "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- EmailAutoReplyConfig table for auto-reply settings
CREATE TABLE IF NOT EXISTS "EmailAutoReplyConfig" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "clientId" TEXT NOT NULL,
  "mailboxId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "template" TEXT NOT NULL,
  "categories" TEXT[] DEFAULT ARRAY[]::TEXT[], -- Which categories to auto-reply to
  "excludeSenders" TEXT[] DEFAULT ARRAY[]::TEXT[], -- Email addresses to exclude
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "EmailAutoReplyConfig_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EmailAutoReplyConfig_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "MailboxConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add threadId to InboxEmail after EmailThread is created
ALTER TABLE "InboxEmail" ADD COLUMN IF NOT EXISTS "threadId" TEXT;
ALTER TABLE "InboxEmail" ADD CONSTRAINT "InboxEmail_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "EmailThread"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "MailboxConnection_clientId_idx" ON "MailboxConnection"("clientId");
CREATE INDEX IF NOT EXISTS "MailboxConnection_email_idx" ON "MailboxConnection"("email");
CREATE INDEX IF NOT EXISTS "MailboxConnection_isActive_idx" ON "MailboxConnection"("isActive");

CREATE INDEX IF NOT EXISTS "InboxEmail_mailboxId_idx" ON "InboxEmail"("mailboxId");
CREATE INDEX IF NOT EXISTS "InboxEmail_messageId_idx" ON "InboxEmail"("messageId");
CREATE INDEX IF NOT EXISTS "InboxEmail_from_idx" ON "InboxEmail"("from");
CREATE INDEX IF NOT EXISTS "InboxEmail_isRead_idx" ON "InboxEmail"("isRead");
CREATE INDEX IF NOT EXISTS "InboxEmail_isStarred_idx" ON "InboxEmail"("isStarred");
CREATE INDEX IF NOT EXISTS "InboxEmail_folder_idx" ON "InboxEmail"("folder");
CREATE INDEX IF NOT EXISTS "InboxEmail_receivedAt_idx" ON "InboxEmail"("receivedAt");
CREATE INDEX IF NOT EXISTS "InboxEmail_threadId_idx" ON "InboxEmail"("threadId");
CREATE INDEX IF NOT EXISTS "InboxEmail_isInvoice_idx" ON "InboxEmail"("isInvoice");
CREATE INDEX IF NOT EXISTS "InboxEmail_aiCategory_idx" ON "InboxEmail"("aiCategory");

CREATE INDEX IF NOT EXISTS "EmailThread_status_idx" ON "EmailThread"("status");
CREATE INDEX IF NOT EXISTS "EmailThread_priority_idx" ON "EmailThread"("priority");
CREATE INDEX IF NOT EXISTS "EmailThread_lastActivity_idx" ON "EmailThread"("lastActivity");

CREATE INDEX IF NOT EXISTS "EmailAutoReplyConfig_clientId_idx" ON "EmailAutoReplyConfig"("clientId");
CREATE INDEX IF NOT EXISTS "EmailAutoReplyConfig_mailboxId_idx" ON "EmailAutoReplyConfig"("mailboxId");
CREATE INDEX IF NOT EXISTS "EmailAutoReplyConfig_isActive_idx" ON "EmailAutoReplyConfig"("isActive");
