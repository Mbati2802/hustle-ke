-- Dynamic social links table
CREATE TABLE IF NOT EXISTS social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT NOT NULL, -- Lucide icon name
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_social_links_order ON social_links(order_index);
CREATE INDEX idx_social_links_active ON social_links(is_active);

-- RLS Policies
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

-- Admin bypass policy
CREATE POLICY "Admin full access to social_links" ON social_links
  FOR ALL USING (
    auth.jwt() ->> 'user_role' = 'Admin'
  );

-- Public read access for active links
CREATE POLICY "Public read access to active social_links" ON social_links
  FOR SELECT USING (is_active = true);

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_social_links_updated_at 
  BEFORE UPDATE ON social_links 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default social links
INSERT INTO social_links (name, url, icon, order_index) VALUES
  ('Twitter', 'https://twitter.com/hustleke', 'Twitter', 1),
  ('LinkedIn', 'https://linkedin.com/company/hustleke', 'Linkedin', 2),
  ('Facebook', 'https://facebook.com/hustleke', 'Facebook', 3)
ON CONFLICT DO NOTHING;
