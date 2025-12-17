-- ProjectCollaborator table for multi-user project access
-- Allows multiple users to collaborate on projects

CREATE TABLE IF NOT EXISTS "ProjectCollaborator" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT DEFAULT 'viewer', -- 'owner', 'editor', 'viewer'
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT "ProjectCollaborator_projectId_fkey" 
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE,
  
  -- Unique constraint: one user can only have one role per project
  CONSTRAINT "ProjectCollaborator_projectId_userId_unique" 
    UNIQUE ("projectId", "userId")
);

-- Indices for faster queries
CREATE INDEX IF NOT EXISTS "ProjectCollaborator_projectId_idx" ON "ProjectCollaborator"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectCollaborator_userId_idx" ON "ProjectCollaborator"("userId");
CREATE INDEX IF NOT EXISTS "ProjectCollaborator_role_idx" ON "ProjectCollaborator"("role");

-- Comments
COMMENT ON TABLE "ProjectCollaborator" IS 'Manages project access for multiple users/collaborators';
COMMENT ON COLUMN "ProjectCollaborator"."role" IS 'User role: owner (full access), editor (can edit), viewer (read-only)';
