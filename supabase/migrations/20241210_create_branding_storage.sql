-- Migration: Create storage bucket for branding assets
-- Description: Creates a Supabase Storage bucket for storing brand logos and assets
-- Date: 2024-12-10

-- Create storage bucket for branding assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'branding',
  'branding',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Allow public read access to branding bucket
CREATE POLICY "Public read access for branding" ON storage.objects
  FOR SELECT USING (bucket_id = 'branding');

-- Allow authenticated admins to upload to branding bucket
CREATE POLICY "Admin upload access for branding" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'branding' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Allow authenticated admins to update branding files
CREATE POLICY "Admin update access for branding" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'branding'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Allow authenticated admins to delete branding files
CREATE POLICY "Admin delete access for branding" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'branding'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND role IN ('admin', 'superadmin')
    )
  );
