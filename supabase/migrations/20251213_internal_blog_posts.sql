-- ============================================
-- INTERNAL BLOG POSTS TABLE
-- For WritgoAI marketing blog (not client content)
-- ============================================

CREATE TABLE IF NOT EXISTS "blog_posts" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  "featured_image" TEXT,
  "author_id" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  "published_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "meta_title" TEXT,
  "meta_description" TEXT,
  category TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON "blog_posts"(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON "blog_posts"(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON "blog_posts"("published_at");
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON "blog_posts"(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON "blog_posts" USING GIN(tags);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_blog_posts_updated_at ON "blog_posts";
CREATE TRIGGER trigger_update_blog_posts_updated_at
  BEFORE UPDATE ON "blog_posts"
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE "blog_posts" ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "Public can read published blog posts"
  ON "blog_posts"
  FOR SELECT
  USING (status = 'published');

-- Authenticated users can read all posts (for admin)
CREATE POLICY "Authenticated users can read all blog posts"
  ON "blog_posts"
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert posts
CREATE POLICY "Authenticated users can insert blog posts"
  ON "blog_posts"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update posts
CREATE POLICY "Authenticated users can update blog posts"
  ON "blog_posts"
  FOR UPDATE
  TO authenticated
  USING (true);

-- Authenticated users can delete posts
CREATE POLICY "Authenticated users can delete blog posts"
  ON "blog_posts"
  FOR DELETE
  TO authenticated
  USING (true);

-- Add some helpful comments
COMMENT ON TABLE "blog_posts" IS 'Internal blog posts for WritgoAI marketing blog';
COMMENT ON COLUMN "blog_posts".status IS 'Post status: draft or published';
COMMENT ON COLUMN "blog_posts"."author_id" IS 'Reference to the user who created the post';
