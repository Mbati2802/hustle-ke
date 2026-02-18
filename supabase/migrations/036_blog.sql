-- Blog system
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL DEFAULT '',
  cover_image TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  views INTEGER DEFAULT 0,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);

-- RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published blog posts"
  ON blog_posts FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admin full access blog posts"
  ON blog_posts FOR ALL
  USING ((SELECT role FROM profiles WHERE user_id = auth.uid()) = 'Admin');

-- Seed some initial blog posts
INSERT INTO blog_posts (slug, title, excerpt, content, category, tags, is_published, published_at) VALUES
('getting-started-freelancing-kenya', 'Getting Started with Freelancing in Kenya', 'A comprehensive guide to launching your freelance career in Kenya using HustleKE.', E'## Why Freelancing in Kenya?\n\nKenya''s digital economy is booming. With over 30 million internet users and a rapidly growing tech ecosystem, there has never been a better time to start freelancing.\n\n### Step 1: Create Your Profile\n\nYour HustleKE profile is your digital CV. Make it count:\n- Use a professional headshot\n- Write a compelling bio\n- List your top skills\n- Set a competitive hourly rate\n\n### Step 2: Build Your Portfolio\n\nClients want to see your work. Upload your best projects to your portfolio section.\n\n### Step 3: Start Bidding\n\nBrowse jobs that match your skills and submit thoughtful proposals. Quality over quantity wins every time.\n\n### Step 4: Get Paid via M-Pesa\n\nHustleKE''s secure escrow system protects both you and your client. Once work is approved, funds are released directly to your M-Pesa wallet.', 'guides', ARRAY['freelancing', 'kenya', 'getting-started', 'mpesa'], true, now() - interval '7 days'),

('mpesa-escrow-explained', 'How M-Pesa Escrow Protection Works on HustleKE', 'Understanding the secure payment system that protects freelancers and clients.', E'## What is Escrow?\n\nEscrow is a financial arrangement where a third party holds funds until both sides of a transaction are satisfied.\n\n### How It Works on HustleKE\n\n1. **Client deposits** — When a client accepts your proposal, they deposit the agreed amount into escrow via M-Pesa\n2. **Funds are held securely** — The money is held safely while you work on the project\n3. **You deliver work** — Submit your completed work for client review\n4. **Client approves** — Once satisfied, the client approves the deliverable\n5. **Instant payout** — Funds are released to your M-Pesa wallet immediately\n\n### Fee Structure\n\n- **Free plan**: 6% service fee\n- **Pro plan**: 4% service fee (save 33%!)\n- **Enterprise**: 2% service fee\n\nAll fees include 16% VAT as required by Kenyan law.', 'payments', ARRAY['mpesa', 'escrow', 'payments', 'security'], true, now() - interval '5 days'),

('top-freelance-skills-2026', 'Top 10 In-Demand Freelance Skills in Kenya for 2026', 'Discover which skills are most sought after by clients on HustleKE this year.', E'## The Kenyan Freelance Landscape in 2026\n\nThe freelance market in Kenya continues to evolve. Here are the most in-demand skills:\n\n### 1. Full-Stack Web Development\nReact, Next.js, and Node.js dominate. Average rate: KES 3,000-8,000/hr.\n\n### 2. Mobile App Development\nFlutter and React Native are the top frameworks. Kenya''s mobile-first economy drives demand.\n\n### 3. UI/UX Design\nFigma expertise is essential. Good designers command premium rates.\n\n### 4. Content Writing & Copywriting\nSEO-optimized content is in high demand, especially for East African markets.\n\n### 5. Digital Marketing\nSocial media management, Google Ads, and email marketing.\n\n### 6. Data Analysis\nPython, SQL, and business intelligence tools.\n\n### 7. Virtual Assistance\nRemote administrative support for international clients.\n\n### 8. Video Editing\nShort-form content creation for social media.\n\n### 9. Graphic Design\nBrand identity, marketing materials, and social media graphics.\n\n### 10. AI & Machine Learning\nThe fastest-growing skill category with the highest rates.', 'industry', ARRAY['skills', 'trends', 'career', '2026'], true, now() - interval '3 days'),

('pro-plan-worth-it', 'Is the HustleKE Pro Plan Worth It? A Complete Breakdown', 'We break down the numbers to help you decide if upgrading to Pro makes financial sense.', E'## Pro Plan at a Glance\n\n**Cost**: KES 500/month\n\n### What You Get\n\n| Feature | Free | Pro |\n|---------|------|-----|\n| Service Fee | 6% | 4% |\n| Daily Proposals | 10 | 20 |\n| Priority Matching | No | Yes |\n| Pro Badge | No | Yes |\n| Analytics | Basic | Advanced |\n\n### When Pro Pays for Itself\n\nIf you earn more than KES 25,000/month, the 2% fee reduction alone saves you more than the KES 500 subscription cost.\n\n**Example**: Earn KES 50,000 → Save KES 1,000 in fees → Net savings of KES 500/month.\n\nPlus, Pro freelancers appear first in search results, getting 3x more job views on average.', 'platform', ARRAY['pro-plan', 'pricing', 'subscription', 'tips'], true, now() - interval '1 day')

ON CONFLICT (slug) DO NOTHING;
