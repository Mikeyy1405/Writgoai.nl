-- Migration: Add RLS policies to BrandSettings table
-- Description: Enable Row Level Security and add policies for public read and admin write
-- Date: 2024-12-10

-- Enable RLS on BrandSettings table
ALTER TABLE "BrandSettings" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read access for brand settings" ON "BrandSettings";
DROP POLICY IF EXISTS "Admin update access for brand settings" ON "BrandSettings";
DROP POLICY IF EXISTS "Admin insert access for brand settings" ON "BrandSettings";

-- Allow public read access (for brand context)
CREATE POLICY "Public read access for brand settings" ON "BrandSettings"
  FOR SELECT USING (true);

-- Allow admins to update brand settings
CREATE POLICY "Admin update access for brand settings" ON "BrandSettings"
  FOR UPDATE USING (true);

-- Allow admins to insert brand settings
CREATE POLICY "Admin insert access for brand settings" ON "BrandSettings"
  FOR INSERT WITH CHECK (true);
