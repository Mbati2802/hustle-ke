-- Migration 011: Portfolio system + enhanced profile fields
-- Enables freelancers to showcase work samples by category with images

-- ============================================
-- PROFILE ENHANCEMENTS
-- ============================================

-- Avatar URL
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Years of experience
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0;

-- Availability status
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'available' 
  CHECK (availability IN ('available', 'busy', 'unavailable', 'available_from'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS available_from DATE;

-- Education (JSONB array: [{school, degree, field, year}])
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]';

-- Certifications (JSONB array: [{name, issuer, year, url}])
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]';

-- ============================================
-- PORTFOLIO CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS portfolio_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, name)
);

CREATE INDEX idx_portfolio_categories_user ON portfolio_categories(user_id);

-- RLS
ALTER TABLE portfolio_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own categories" ON portfolio_categories
  FOR ALL USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  ) WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Public can view categories" ON portfolio_categories
  FOR SELECT USING (true);

CREATE POLICY "Service role full access categories" ON portfolio_categories
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- PORTFOLIO ITEMS (projects/work samples)
-- ============================================
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES portfolio_categories(id) ON DELETE SET NULL,
  
  -- Project details
  title TEXT NOT NULL,
  description TEXT,
  client_name TEXT,          -- Reference business name
  project_url TEXT,          -- External link to live project
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_portfolio_items_user ON portfolio_items(user_id);
CREATE INDEX idx_portfolio_items_category ON portfolio_items(category_id);

-- RLS
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own items" ON portfolio_items
  FOR ALL USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  ) WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Public can view items" ON portfolio_items
  FOR SELECT USING (true);

CREATE POLICY "Service role full access items" ON portfolio_items
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- PORTFOLIO IMAGES
-- ============================================
CREATE TABLE IF NOT EXISTS portfolio_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Image info
  url TEXT NOT NULL,               -- Supabase Storage URL
  storage_path TEXT NOT NULL,      -- Path in storage bucket
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT false,  -- Cover image for the project
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_portfolio_images_item ON portfolio_images(item_id);
CREATE INDEX idx_portfolio_images_user ON portfolio_images(user_id);

-- RLS
ALTER TABLE portfolio_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own images" ON portfolio_images
  FOR ALL USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  ) WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Public can view images" ON portfolio_images
  FOR SELECT USING (true);

CREATE POLICY "Service role full access images" ON portfolio_images
  FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at on portfolio_items
CREATE TRIGGER update_portfolio_items_updated_at
  BEFORE UPDATE ON portfolio_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE BUCKET for avatars
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- STORAGE BUCKET for portfolio images
-- ============================================
-- Run this in Supabase Dashboard > Storage:
-- 1. Create bucket: "portfolio" (public)
-- 2. Set file size limit: 5MB
-- 3. Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
-- 
-- Or via SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio', 
  'portfolio', 
  true, 
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Anyone can view portfolio images" ON storage.objects
  FOR SELECT USING (bucket_id = 'portfolio');

CREATE POLICY "Users can upload portfolio images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'portfolio' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete own portfolio images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'portfolio'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
