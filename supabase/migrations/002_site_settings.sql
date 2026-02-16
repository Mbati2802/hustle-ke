-- Site settings / page content management for admin panel

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  meta_title TEXT,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_pages_updated_at BEFORE UPDATE ON site_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Public read for published pages
CREATE POLICY "Anyone can read published pages" ON site_pages
  FOR SELECT USING (is_published = true);

-- Public read for site settings
CREATE POLICY "Anyone can read site settings" ON site_settings
  FOR SELECT USING (true);

-- Admin full access
CREATE POLICY "Admins can manage site settings" ON site_settings
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admins can manage site pages" ON site_pages
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admins can manage activity log" ON activity_log
  USING (is_admin()) WITH CHECK (is_admin());

-- Indexes
CREATE INDEX idx_site_settings_key ON site_settings(key);
CREATE INDEX idx_site_settings_category ON site_settings(category);
CREATE INDEX idx_site_pages_slug ON site_pages(slug);
CREATE INDEX idx_activity_log_admin ON activity_log(admin_id);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

-- Seed default settings
INSERT INTO site_settings (key, value, description, category) VALUES
  ('platform_name', '"HustleKE"', 'Platform name', 'general'),
  ('platform_tagline', '"Connect with global clients. Get paid instantly via M-Pesa."', 'Platform tagline', 'general'),
  ('service_fee_percent', '5', 'Service fee percentage', 'fees'),
  ('tax_rate_percent', '16', 'VAT rate on service fees', 'fees'),
  ('min_withdrawal', '50', 'Minimum withdrawal amount (KES)', 'wallet'),
  ('min_escrow', '100', 'Minimum escrow amount (KES)', 'wallet'),
  ('promo_banner_enabled', 'true', 'Show promotional banner', 'ui'),
  ('promo_banner_text', '"Get 50% off service fees — Limited Time"', 'Promotional banner text', 'ui'),
  ('promo_code', '"HUSTLE50"', 'Active promo code', 'ui'),
  ('maintenance_mode', 'false', 'Enable maintenance mode', 'general'),
  ('signup_enabled', 'true', 'Allow new signups', 'general'),
  ('max_proposal_per_job', '50', 'Max proposals per job', 'limits'),
  ('max_jobs_per_user', '20', 'Max active jobs per user', 'limits'),
  ('contact_email', '"support@hustleke.co.ke"', 'Support contact email', 'general'),
  ('social_twitter', '"https://twitter.com/hustleke"', 'Twitter URL', 'social'),
  ('social_linkedin', '"https://linkedin.com/company/hustleke"', 'LinkedIn URL', 'social'),
  ('social_facebook', '"https://facebook.com/hustleke"', 'Facebook URL', 'social')
ON CONFLICT (key) DO NOTHING;

-- Seed default pages
INSERT INTO site_pages (slug, title, content, meta_title, meta_description) VALUES
  ('homepage', 'Homepage', '{"hero_title": "Find Kenyan Talent. Hire with Confidence.", "hero_subtitle": "Connect with verified freelancers, pay securely via M-Pesa escrow, and build your dream project.", "hero_cta_text": "Get Started Free", "hero_cta_link": "/signup", "featured_categories": ["Web Development", "Mobile Apps", "Graphic Design", "Writing", "Virtual Assistant", "Data Entry"]}', 'HustleKE - Kenyan Freelance Marketplace', 'Connect with global clients. Get paid instantly via M-Pesa.'),
  ('about', 'About Us', '{"hero_title": "About HustleKE", "mission": "Empowering Kenyan talent to compete globally", "vision": "Making Kenya the freelance capital of Africa", "story": "HustleKE was founded to bridge the gap between Kenyan talent and global opportunities."}', 'About HustleKE', 'Learn about our mission to empower Kenyan freelancers.'),
  ('how-it-works', 'How It Works', '{"hero_title": "How HustleKE Works", "steps": [{"title": "Create Profile", "description": "Sign up and build your professional profile"}, {"title": "Find Work", "description": "Browse jobs or get matched by AI"}, {"title": "Submit Proposals", "description": "Apply to jobs with compelling proposals"}, {"title": "Get Paid", "description": "Receive payments securely via M-Pesa"}]}', 'How HustleKE Works', 'Learn how to get started on HustleKE.'),
  ('pricing', 'Pricing', '{"hero_title": "Simple, Transparent Pricing", "service_fee": "5%", "description": "We only charge when you get paid"}', 'HustleKE Pricing', 'Simple and transparent pricing for freelancers.'),
  ('contact', 'Contact Us', '{"hero_title": "Get in Touch", "email": "support@hustleke.co.ke", "phone": "+254 700 000 000", "address": "Nairobi, Kenya"}', 'Contact HustleKE', 'Reach out to the HustleKE team.'),
  ('privacy', 'Privacy Policy', '{"hero_title": "Privacy Policy", "last_updated": "2025-01-01"}', 'Privacy Policy - HustleKE', 'HustleKE privacy policy.'),
  ('terms', 'Terms of Service', '{"hero_title": "Terms of Service", "last_updated": "2025-01-01"}', 'Terms of Service - HustleKE', 'HustleKE terms of service.')
ON CONFLICT (slug) DO NOTHING;
