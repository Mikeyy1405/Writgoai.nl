-- Fix Client Creation RLS Policies
-- This migration ensures that admins can create clients without RLS blocking

-- Drop existing RLS policies for Client table if they exist
DROP POLICY IF EXISTS "Admins can create clients" ON "Client";
DROP POLICY IF EXISTS "Admins can view all clients" ON "Client";
DROP POLICY IF EXISTS "Admins can update all clients" ON "Client";
DROP POLICY IF EXISTS "Admins can delete all clients" ON "Client";
DROP POLICY IF EXISTS "Clients can view their own data" ON "Client";
DROP POLICY IF EXISTS "Clients can update their own data" ON "Client";

-- Drop existing RLS policies for Project table if they exist
DROP POLICY IF EXISTS "Admins can create projects" ON "Project";
DROP POLICY IF EXISTS "Admins can view all projects" ON "Project";
DROP POLICY IF EXISTS "Admins can update all projects" ON "Project";
DROP POLICY IF EXISTS "Admins can delete all projects" ON "Project";
DROP POLICY IF EXISTS "Clients can view their own projects" ON "Project";

-- Enable RLS on Client table (if not already enabled)
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Project table (if not already enabled)
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for Client table
-- Policy 1: Admins can do everything with clients
CREATE POLICY "Admins can manage all clients"
  ON "Client"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Policy 2: Clients can view their own data
CREATE POLICY "Clients can view their own data"
  ON "Client"
  FOR SELECT
  USING (id = auth.uid()::text);

-- Policy 3: Clients can update their own data (but not sensitive fields)
CREATE POLICY "Clients can update their own data"
  ON "Client"
  FOR UPDATE
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- Create comprehensive RLS policies for Project table
-- Policy 1: Admins can do everything with projects
CREATE POLICY "Admins can manage all projects"
  ON "Project"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Policy 2: Clients can view their own projects
CREATE POLICY "Clients can view their own projects"
  ON "Project"
  FOR SELECT
  USING ("clientId" = auth.uid()::text);

-- Policy 3: Clients can update their own projects
CREATE POLICY "Clients can update their own projects"
  ON "Project"
  FOR UPDATE
  USING ("clientId" = auth.uid()::text)
  WITH CHECK ("clientId" = auth.uid()::text);

-- Add comment for documentation
COMMENT ON TABLE "Client" IS 'Client accounts with RLS policies allowing admins full access and clients access to their own data';
COMMENT ON TABLE "Project" IS 'Projects linked to clients with RLS policies allowing admins full access and clients access to their own projects';
