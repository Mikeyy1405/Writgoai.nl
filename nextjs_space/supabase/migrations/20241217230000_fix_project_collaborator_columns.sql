-- Fix ProjectCollaborator table - Add missing columns
-- This migration adds all the columns that the application code expects

-- Add email column (required for invitations and lookups)
ALTER TABLE "ProjectCollaborator" 
ADD COLUMN IF NOT EXISTS "email" TEXT;

-- Add name column (optional display name)
ALTER TABLE "ProjectCollaborator" 
ADD COLUMN IF NOT EXISTS "name" TEXT;

-- Add status column (pending, active, revoked)
ALTER TABLE "ProjectCollaborator" 
ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'pending';

-- Add accessToken column (for secure project access without login)
ALTER TABLE "ProjectCollaborator" 
ADD COLUMN IF NOT EXISTS "accessToken" TEXT;

-- Add timestamp columns for invitation flow
ALTER TABLE "ProjectCollaborator" 
ADD COLUMN IF NOT EXISTS "invitedAt" TIMESTAMP;

ALTER TABLE "ProjectCollaborator" 
ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP;

ALTER TABLE "ProjectCollaborator" 
ADD COLUMN IF NOT EXISTS "lastAccessAt" TIMESTAMP;

ALTER TABLE "ProjectCollaborator" 
ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP;

-- Add notification preference
ALTER TABLE "ProjectCollaborator" 
ADD COLUMN IF NOT EXISTS "notifyOnPublish" BOOLEAN DEFAULT true;

-- Drop the old unique constraint (projectId + userId)
ALTER TABLE "ProjectCollaborator" 
DROP CONSTRAINT IF EXISTS "ProjectCollaborator_projectId_userId_unique";

-- Add new unique constraint (projectId + email)
-- This allows the same email to collaborate on multiple projects
ALTER TABLE "ProjectCollaborator" 
ADD CONSTRAINT "ProjectCollaborator_projectId_email_unique" 
UNIQUE ("projectId", "email");

-- Add unique constraint for accessToken (must be unique across all collaborators)
ALTER TABLE "ProjectCollaborator" 
ADD CONSTRAINT "ProjectCollaborator_accessToken_unique" 
UNIQUE ("accessToken");

-- Add indices for new columns
CREATE INDEX IF NOT EXISTS "ProjectCollaborator_email_idx" ON "ProjectCollaborator"("email");
CREATE INDEX IF NOT EXISTS "ProjectCollaborator_status_idx" ON "ProjectCollaborator"("status");
CREATE INDEX IF NOT EXISTS "ProjectCollaborator_accessToken_idx" ON "ProjectCollaborator"("accessToken");

-- Update comments
COMMENT ON COLUMN "ProjectCollaborator"."email" IS 'Email address of the collaborator (used for invitations)';
COMMENT ON COLUMN "ProjectCollaborator"."status" IS 'Invitation status: pending (invited), active (accepted), revoked (removed)';
COMMENT ON COLUMN "ProjectCollaborator"."accessToken" IS 'Secure token for accessing project without login';
COMMENT ON COLUMN "ProjectCollaborator"."role" IS 'User role: employee (team member), client (external collaborator)';
