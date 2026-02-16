-- =============================================
-- Combined migration: Run this in Supabase SQL Editor
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE)
-- =============================================

-- 1. Create is_admin() function (required by RLS policies)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role = 'Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create site_settings table
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

-- 3. Create site_pages table (with nav_category for admin grouping)
CREATE TABLE IF NOT EXISTS site_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  meta_title TEXT,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT true,
  nav_category TEXT NOT NULL DEFAULT 'other',
  sort_order INT DEFAULT 0,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if table already exists (safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_pages' AND column_name = 'nav_category') THEN
    ALTER TABLE site_pages ADD COLUMN nav_category TEXT NOT NULL DEFAULT 'other';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_pages' AND column_name = 'sort_order') THEN
    ALTER TABLE site_pages ADD COLUMN sort_order INT DEFAULT 0;
  END IF;
END $$;

-- 4. Create activity_log table
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

-- 5. Triggers (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_pages_updated_at ON site_pages;
CREATE TRIGGER update_site_pages_updated_at BEFORE UPDATE ON site_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies (drop first to avoid duplicates)
DROP POLICY IF EXISTS "Anyone can read published pages" ON site_pages;
CREATE POLICY "Anyone can read published pages" ON site_pages
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Anyone can read site settings" ON site_settings;
CREATE POLICY "Anyone can read site settings" ON site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage site settings" ON site_settings;
CREATE POLICY "Admins can manage site settings" ON site_settings
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage site pages" ON site_pages;
CREATE POLICY "Admins can manage site pages" ON site_pages
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage activity log" ON activity_log;
CREATE POLICY "Admins can manage activity log" ON activity_log
  USING (is_admin()) WITH CHECK (is_admin());

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);
CREATE INDEX IF NOT EXISTS idx_site_settings_category ON site_settings(category);
CREATE INDEX IF NOT EXISTS idx_site_pages_slug ON site_pages(slug);
CREATE INDEX IF NOT EXISTS idx_site_pages_nav_category ON site_pages(nav_category);
CREATE INDEX IF NOT EXISTS idx_activity_log_admin ON activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);

-- 9. Seed default settings
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

-- 10. Seed pages with ACTUAL frontend content, categorized by nav menu
-- Categories: main, find_work, how_it_works, about, legal

-- Delete old seed if re-running
DELETE FROM site_pages WHERE slug IN ('homepage','about','how-it-works','pricing','contact','privacy','terms','faqs','success-stories','mpesa-tariffs');

-- === MAIN ===
INSERT INTO site_pages (slug, title, nav_category, sort_order, content, meta_title, meta_description) VALUES
('homepage', 'Homepage', 'main', 0,
'{
  "hero_badge": "Kenya''s Leading Freelance Marketplace",
  "hero_title": "The Future of Work is Kenyan",
  "hero_subtitle": "Connect with global clients. Get paid instantly via M-Pesa. Only 6% service fee. Join the revolution of African talent.",
  "hero_cta_primary": "Start Hustling",
  "hero_cta_primary_link": "/signup?type=freelancer",
  "hero_cta_secondary": "Hire Talent",
  "hero_cta_secondary_link": "/signup?type=client",
  "stats": [
    {"value": "10K+", "label": "Freelancers"},
    {"value": "KES 50M+", "label": "Paid Out"},
    {"value": "2K+", "label": "Jobs Completed"}
  ],
  "trust_partners": ["Safaricom", "Standard Bank", "Google Developers", "Techno", "Andela", "iHub Nairobi"],
  "value_props_title": "Why Choose HustleKE?",
  "value_props_subtitle": "Built for Kenyans, by Kenyans. We understand the local hustle.",
  "value_props": [
    {"title": "AI Power", "description": "Our AI polishes your proposals, optimizes your profile, and matches you with perfect jobs automatically.", "features": ["Smart proposal enhancement", "Profile optimization", "Job matching algorithm"]},
    {"title": "Instant M-Pesa", "description": "Get paid directly to your M-Pesa instantly. No waiting 5 days like other platforms. Your money, when you need it.", "features": ["Instant withdrawals", "Secure escrow system", "Only 6% service fee"]},
    {"title": "Verified Talent", "description": "Every freelancer is verified with ID checks and skill tests. Our Hustle Score system ensures quality.", "features": ["ID verification", "Skill testing", "Hustle Score trust system"]}
  ],
  "featured_talent": [
    {"name": "James Kamau", "skill": "Full-Stack Developer", "rating": 4.9, "rate": 3000, "verified": true},
    {"name": "Aisha Mohammed", "skill": "UI/UX Designer", "rating": 5.0, "rate": 2500, "verified": true},
    {"name": "Peter Ochieng", "skill": "Mobile App Dev", "rating": 4.8, "rate": 2800, "verified": true},
    {"name": "Grace Wanjiku", "skill": "Content Writer", "rating": 4.9, "rate": 1500, "verified": true}
  ],
  "cta_title": "Ready to Start Your Hustle?",
  "cta_subtitle": "Join thousands of Kenyans earning through their skills. Connect with clients, get paid instantly, and build your future."
}',
'HustleKE - Kenyan Freelance Marketplace', 'Connect with global clients. Get paid instantly via M-Pesa.');

-- === FIND WORK ===
INSERT INTO site_pages (slug, title, nav_category, sort_order, content, meta_title, meta_description) VALUES
('success-stories', 'Success Stories', 'find_work', 1,
'{
  "hero_title": "Success Stories",
  "hero_subtitle": "Meet the talented Kenyans who transformed their careers through HustleKE",
  "stats": [
    {"value": "50,000+", "label": "Successful Projects"},
    {"value": "KES 500M+", "label": "Paid to Freelancers"},
    {"value": "15,000+", "label": "Active Freelancers"},
    {"value": "98%", "label": "Satisfaction Rate"}
  ],
  "testimonials": [
    {"name": "Wanjiku M.", "role": "Web Developer", "location": "Nairobi", "initials": "WM", "quote": "HustleKE changed my life. I went from struggling to find clients to having a consistent stream of projects. The M-Pesa integration makes getting paid so easy!", "earnings": "KES 450,000+", "jobs_completed": 47, "rating": 5},
    {"name": "Ochieng J.", "role": "Graphic Designer", "location": "Kisumu", "initials": "OJ", "quote": "As a freelancer in Kisumu, I never thought I could compete with Nairobi talent. HustleKE leveled the playing field. My Hustle Score speaks for itself!", "earnings": "KES 280,000+", "jobs_completed": 32, "rating": 5},
    {"name": "Amina H.", "role": "Virtual Assistant", "location": "Mombasa", "initials": "AH", "quote": "The AI matching is incredible. I get job recommendations that perfectly fit my skills. I''ve tripled my income in just 6 months!", "earnings": "KES 320,000+", "jobs_completed": 58, "rating": 5},
    {"name": "Kamau D.", "role": "Mobile App Developer", "location": "Nairobi", "initials": "KD", "quote": "Built my entire freelance career on HustleKE. The escrow protection gives both me and my clients peace of mind. Best platform for Kenyan freelancers!", "earnings": "KES 890,000+", "jobs_completed": 23, "rating": 5},
    {"name": "Njeri K.", "role": "Content Writer", "location": "Nakuru", "initials": "NK", "quote": "From part-time writer to full-time freelancer. HustleKE''s AI Proposal Polisher helped me win clients I never thought I could land.", "earnings": "KES 180,000+", "jobs_completed": 89, "rating": 5},
    {"name": "Otieno M.", "role": "SEO Specialist", "location": "Nairobi", "initials": "OM", "quote": "The verification process and Hustle Score system helped me stand out. Clients trust me more because of my verified profile.", "earnings": "KES 520,000+", "jobs_completed": 41, "rating": 5}
  ],
  "cta_title": "Start Your Success Story",
  "cta_subtitle": "Join thousands of Kenyans who are already building their careers on HustleKE"
}',
'Success Stories - HustleKE', 'How Kenyan freelancers transformed their careers on HustleKE.'),

('pricing', 'Pricing & Plans', 'find_work', 2,
'{
  "hero_title": "Simple, Transparent Pricing",
  "hero_subtitle": "No hidden fees. No surprises. Just straightforward pricing that works for everyone.",
  "plans": [
    {"name": "Free", "price": "KES 0", "period": "forever", "desc": "Perfect for getting started", "color": "green", "popular": false, "features": ["Create your profile", "Browse & apply for jobs", "AI proposal enhancement", "M-Pesa escrow payments", "Hustle Score tracking", "6% service fee per transaction", "Email support"], "cta": "Get Started Free", "href": "/signup"},
    {"name": "Pro", "price": "KES 500", "period": "/month", "desc": "For serious freelancers", "color": "amber", "popular": true, "features": ["Everything in Free", "Reduced 4% service fee", "Priority job matching", "Featured profile badge", "Advanced analytics", "Priority support", "Early access to new features", "Up to 20 proposals per day"], "cta": "Start Pro Trial", "href": "/signup"},
    {"name": "Enterprise", "price": "Custom", "period": "", "desc": "For teams & businesses", "color": "purple", "popular": false, "features": ["Everything in Pro", "Custom service fee rates", "Dedicated account manager", "Team management tools", "Bulk hiring features", "Custom invoicing", "API access", "SLA guarantee"], "cta": "Contact Sales", "href": "/contact"}
  ],
  "pricing_faqs": [
    {"q": "What is the service fee?", "a": "HustleKE charges 6% on the Free plan and 4% on the Pro plan per completed transaction. This is deducted from the project payment when funds are released from escrow."},
    {"q": "Can I cancel Pro anytime?", "a": "Yes! Pro is a monthly subscription with no lock-in. Cancel anytime from your dashboard settings."},
    {"q": "Are there any other hidden fees?", "a": "No. The service fee is the only platform charge. Standard M-Pesa transaction fees from Safaricom may apply."},
    {"q": "What payment methods do you accept?", "a": "All payments on HustleKE are processed through M-Pesa. Pro subscriptions are also paid via M-Pesa."}
  ]
}',
'HustleKE Pricing', 'Simple and transparent pricing for freelancers.');

-- === HOW IT WORKS ===
INSERT INTO site_pages (slug, title, nav_category, sort_order, content, meta_title, meta_description) VALUES
('how-it-works', 'How It Works', 'how_it_works', 0,
'{
  "hero_badge": "Kenya''s #1 Freelancing Platform",
  "hero_title": "How HustleKE Works",
  "hero_subtitle": "Your journey to successful freelancing or hiring starts here. Simple, secure, and built for Kenyans.",
  "stats": [
    {"value": "50,000+", "label": "Freelancers"},
    {"value": "100,000+", "label": "Jobs Completed"},
    {"value": "KES 500M+", "label": "Paid Out"},
    {"value": "98%", "label": "Satisfaction"}
  ],
  "steps": [
    {"title": "Create Your Profile", "description": "Sign up and build your profile. Add your skills, portfolio, and verify your identity to boost your Hustle Score.", "for": "freelancer"},
    {"title": "Find Work or Talent", "description": "Browse thousands of jobs or post your project. Our AI matches you with the perfect opportunities or candidates.", "for": "both"},
    {"title": "Submit Proposals", "description": "Apply to jobs with a polished proposal. Use our AI Proposal Polisher to stand out from the competition.", "for": "freelancer"},
    {"title": "Secure with M-Pesa Escrow", "description": "Funds are held safely in escrow until work is completed. Both parties are protected throughout the process.", "for": "both"},
    {"title": "Get Paid Instantly", "description": "Once work is approved, payment is released instantly to your M-Pesa wallet. No delays, no hassle.", "for": "both"}
  ],
  "features": [
    {"title": "AI-Powered Matching", "description": "Our intelligent system learns your preferences and connects you with the best opportunities or talent.", "stat": "95%", "label": "Match Rate"},
    {"title": "Hustle Score Trust", "description": "Build reputation through verified work history, reviews, and identity verification.", "stat": "50K+", "label": "Verified Users"},
    {"title": "Instant Payments", "description": "Get paid immediately via M-Pesa when work is completed. No waiting for weeks.", "stat": "< 1min", "label": "Payout Time"},
    {"title": "Kenyan Focused", "description": "Built specifically for the Kenyan market with local payment methods and job categories.", "stat": "47", "label": "Counties"}
  ],
  "testimonials": [
    {"name": "James Mwangi", "role": "Web Developer", "location": "Nairobi", "initials": "JM", "quote": "I have earned over KES 2.5M on HustleKE. The instant M-Pesa payouts and low 6% fee changed my life!", "rating": 5, "earnings": "KES 2.5M+"},
    {"name": "Sarah Ochieng", "role": "Business Owner", "location": "Kisumu", "initials": "SO", "quote": "Found amazing talent for my e-commerce site. The escrow protection gave me peace of mind throughout the project.", "rating": 5, "earnings": "Saved 40%"},
    {"name": "Peter Kamau", "role": "Mobile Developer", "location": "Nakuru", "initials": "PK", "quote": "The AI matching is incredible. I get relevant job recommendations daily and my calendar stays booked.", "rating": 5, "earnings": "50+ Jobs"},
    {"name": "Grace Wanjiku", "role": "Marketing Manager", "location": "Mombasa", "initials": "GW", "quote": "HustleKE helped us scale our marketing team quickly. Quality freelancers, fair prices, and seamless process.", "rating": 5, "earnings": "KES 800K+"}
  ],
  "faqs": {
    "freelancers": [
      {"q": "How do I get started as a freelancer?", "a": "Simply create your profile, add your skills and portfolio, verify your identity, and start browsing jobs that match your expertise. Our AI will recommend the best opportunities for you."},
      {"q": "Is HustleKE free to use?", "a": "Yes! Creating an account and browsing jobs is completely free. We only charge a small 6% service fee when you complete a project and get paid."},
      {"q": "What is the Hustle Score?", "a": "Hustle Score is our trust rating system based on your work history, reviews, verification status, and platform activity. Higher scores get priority access to top jobs."}
    ],
    "clients": [
      {"q": "How do I hire talent for my project?", "a": "Post your project with requirements and budget, review proposals from qualified freelancers, interview candidates, and hire the best fit. Fund escrow and your project begins!"},
      {"q": "How do I know the freelancers are qualified?", "a": "All freelancers have a Hustle Score based on their work history, reviews, and verification status. You can also view their portfolios and past work samples."}
    ],
    "payments": [
      {"q": "How does M-Pesa escrow work?", "a": "When a client hires you, they fund the escrow with M-Pesa. The money is held securely until you complete the work. Once approved, funds are released instantly to your M-Pesa wallet."},
      {"q": "What happens if there is a dispute?", "a": "Our dispute resolution team reviews all cases fairly. With escrow protection, your funds are safe while we work to resolve any issues between parties."}
    ]
  },
  "newsletter_title": "Stay Updated with HustleKE",
  "newsletter_subtitle": "Get the latest tips, success stories, and platform updates delivered to your inbox",
  "cta_title": "Ready to Start Your Journey?",
  "cta_subtitle": "Join thousands of Kenyans already using HustleKE to find work and hire talent."
}',
'How HustleKE Works', 'Learn how to get started on HustleKE.');

-- === ABOUT ===
INSERT INTO site_pages (slug, title, nav_category, sort_order, content, meta_title, meta_description) VALUES
('about', 'About Us', 'about', 0,
'{
  "hero_badge": "Built for Kenya",
  "hero_title": "Connecting Talent with Opportunity",
  "hero_subtitle": "HustleKE is Kenya''s premier freelance marketplace — empowering thousands of professionals to build careers, earn fairly, and get paid instantly via M-Pesa.",
  "stats": [
    {"value": "10,000+", "label": "Active Users"},
    {"value": "47", "label": "Counties Covered"},
    {"value": "KES 500M+", "label": "Paid to Freelancers"},
    {"value": "4.8/5", "label": "Average Rating"}
  ],
  "mission_title": "Kenyan Talent Deserves World-Class Opportunities",
  "mission_text": "HustleKE was born from a simple belief: that every skilled Kenyan should have access to meaningful work and fair pay. We are building a platform that breaks down barriers, connects professionals with clients across the globe, and ensures everyone gets paid securely and on time.",
  "mission_text_2": "With just a 6% service fee — the lowest in the industry — we are making sure freelancers keep more of what they earn, while clients get access to verified, top-tier Kenyan talent.",
  "mission_pillars": [
    "Empower freelancers with tools to showcase their skills and win global projects.",
    "Connect clients with verified, talented professionals across all 47 counties.",
    "Ensure fair, instant payments through secure M-Pesa escrow integration.",
    "Drive Kenya''s digital economy forward through accessible remote work."
  ],
  "values": [
    {"title": "Empowerment", "description": "We believe in empowering Kenyans to build sustainable careers and businesses through technology."},
    {"title": "Trust & Safety", "description": "Your security is our priority. Our Hustle Score system and escrow protection keep everyone safe."},
    {"title": "Innovation", "description": "From AI-powered matching to instant M-Pesa payments, we leverage technology to simplify work."},
    {"title": "Local Focus", "description": "Built specifically for Kenya, understanding the unique needs of our market and people."}
  ],
  "why_different": [
    {"title": "M-Pesa First", "desc": "Built around Kenya''s most popular payment system for instant, secure payouts."},
    {"title": "Escrow Protection", "desc": "Every project is protected. Funds are held safely until work is approved."},
    {"title": "Global Reach, Local Heart", "desc": "Connect with international clients while staying rooted in the Kenyan market."},
    {"title": "AI-Powered", "desc": "Smart matching, proposal enhancement, and insights powered by artificial intelligence."}
  ],
  "milestones": [
    {"year": "2023", "quarter": "Q1", "event": "HustleKE founded with a vision to transform freelancing in Kenya", "highlight": true},
    {"year": "2023", "quarter": "Q3", "event": "Launched beta with 100+ freelancers and 50+ clients"},
    {"year": "2024", "quarter": "Q1", "event": "Integrated M-Pesa escrow system for secure payments", "highlight": true},
    {"year": "2024", "quarter": "Q2", "event": "Reached 10,000+ active users milestone"},
    {"year": "2024", "quarter": "Q4", "event": "Introduced AI-powered job matching and proposal polishing", "highlight": true},
    {"year": "2025", "quarter": "Q1", "event": "Expanded to all 47 counties with localized support"}
  ],
  "team": [
    {"name": "Founder & CEO", "role": "Visionary Leader", "image": "FC", "bio": "Passionate about unlocking Kenyan talent through technology and fair work."},
    {"name": "Head of Product", "role": "Product Strategy", "image": "HP", "bio": "Designing seamless experiences that connect talent with opportunity."},
    {"name": "Tech Lead", "role": "Engineering", "image": "TL", "bio": "Building the scalable, secure infrastructure powering HustleKE."},
    {"name": "Community Manager", "role": "User Success", "image": "CM", "bio": "Ensuring every user — freelancer and client — has a great experience."}
  ],
  "cta_title": "Ready to Join the Movement?",
  "cta_subtitle": "Be part of Kenya''s fastest-growing community of freelancers and clients."
}',
'About HustleKE', 'Learn about our mission to empower Kenyan freelancers.'),

('faqs', 'FAQs', 'about', 1,
'{
  "hero_badge": "Help Center",
  "hero_title": "Frequently Asked Questions",
  "hero_subtitle": "Everything you need to know about using HustleKE",
  "categories": [
    {"id": "getting-started", "name": "Getting Started"},
    {"id": "payments", "name": "Payments & Escrow"},
    {"id": "safety", "name": "Safety & Trust"},
    {"id": "account", "name": "Account & Profile"},
    {"id": "jobs", "name": "Jobs & Proposals"}
  ],
  "faqs": {
    "getting-started": [
      {"question": "How do I get started as a freelancer?", "answer": "Simply create your profile, add your skills and portfolio, verify your identity, and start browsing jobs that match your expertise. Our AI will recommend the best opportunities for you."},
      {"question": "Is HustleKE free to use?", "answer": "Yes! Creating an account and browsing jobs is completely free. We only charge a small 6% service fee when you complete a project and get paid."},
      {"question": "What do I need to sign up?", "answer": "You need a valid email address, phone number, and national ID for verification. You will also need an M-Pesa registered phone number for payments."},
      {"question": "How long does verification take?", "answer": "Most verifications are completed within 24 hours. You will receive an SMS and email notification once your account is verified."}
    ],
    "payments": [
      {"question": "How does M-Pesa escrow work?", "answer": "When a client hires you, they fund the escrow with M-Pesa. The money is held securely until you complete the work. Once approved, funds are released instantly to your M-Pesa wallet."},
      {"question": "What are the payment fees?", "answer": "HustleKE charges only 6% per transaction - one of the lowest in the industry. There are no monthly fees, subscription fees, or hidden charges."},
      {"question": "How fast do I get paid?", "answer": "Once the client approves your work, payment is released to your M-Pesa instantly - usually within seconds."},
      {"question": "Can I use other payment methods?", "answer": "Currently, we support M-Pesa for all transactions. We are working on adding bank transfers and other payment options soon."}
    ],
    "safety": [
      {"question": "What is the Hustle Score?", "answer": "Hustle Score is our trust rating system based on your work history, reviews, verification status, and platform activity. Higher scores get priority access to top jobs."},
      {"question": "How do you verify users?", "answer": "We verify identity through government ID, phone number verification, and in some cases, video verification. We also verify skills through portfolio reviews."},
      {"question": "What happens if there is a dispute?", "answer": "Our dispute resolution team reviews all cases fairly. With escrow protection, your funds are safe while we work to resolve any issues between parties."},
      {"question": "Is my data secure?", "answer": "Yes, we use bank-level encryption and security protocols. Your personal information is never shared with third parties without your consent."}
    ],
    "account": [
      {"question": "How do I update my profile?", "answer": "Go to your dashboard, click on Profile, and you can edit all your information including skills, portfolio, rates, and bio."},
      {"question": "Can I change my account type?", "answer": "Yes, you can switch between freelancer and client accounts, or use both. Go to Settings > Account Type to make changes."},
      {"question": "How do I delete my account?", "answer": "Contact our support team to delete your account. Note that you must complete all active contracts and withdraw all funds first."}
    ],
    "jobs": [
      {"question": "How do I hire talent for my project?", "answer": "Post your project with requirements and budget, review proposals from qualified freelancers, interview candidates, and hire the best fit. Fund escrow and your project begins!"},
      {"question": "How do I write a good proposal?", "answer": "Address the client''s specific needs, showcase relevant experience, be clear about your approach, and use our AI Proposal Polisher for optimization."},
      {"question": "Can I work on multiple jobs?", "answer": "Yes, you can work on multiple projects simultaneously as long as you can deliver quality work on time for each."},
      {"question": "What if a client does not respond?", "answer": "Send a follow-up message after 3 days. If no response after 7 days, you can withdraw your proposal and apply to other jobs."}
    ]
  },
  "cta_title": "Still have questions?",
  "cta_subtitle": "Our support team is here to help. Reach out and we will get back to you within 24 hours."
}',
'FAQs - HustleKE', 'Everything you need to know about using HustleKE.'),

('contact', 'Contact Us', 'about', 2,
'{
  "hero_badge": "Email Support",
  "hero_title": "Get in Touch",
  "hero_subtitle": "Have a question or need assistance? Send us a message and our team will respond within 24 hours.",
  "email": "support@hustleke.com",
  "response_time": "24 hours or less",
  "categories": ["General Inquiry", "Payment Issue", "Account Help", "Technical Support", "Dispute Resolution", "Feedback"],
  "success_message": "Thank you for reaching out. We have received your message and will get back to you within 24 hours."
}',
'Contact HustleKE', 'Reach out to the HustleKE team.'),

('mpesa-tariffs', 'M-Pesa Tariffs', 'about', 3,
'{
  "hero_title": "M-Pesa Withdrawal Tariffs",
  "hero_subtitle": "Standard Safaricom M-Pesa charges apply when withdrawing earnings to your mobile wallet.",
  "disclaimer": "HustleKE does not charge withdrawal fees. The tariffs below are standard Safaricom M-Pesa charges.",
  "tariffs": [
    {"range": "1 - 100", "charge": "Free"},
    {"range": "101 - 500", "charge": "KES 7"},
    {"range": "501 - 1,000", "charge": "KES 13"},
    {"range": "1,001 - 1,500", "charge": "KES 23"},
    {"range": "1,501 - 2,500", "charge": "KES 33"},
    {"range": "2,501 - 3,500", "charge": "KES 51"},
    {"range": "3,501 - 5,000", "charge": "KES 55"},
    {"range": "5,001 - 7,500", "charge": "KES 75"},
    {"range": "7,501 - 10,000", "charge": "KES 87"},
    {"range": "10,001 - 15,000", "charge": "KES 97"},
    {"range": "15,001 - 20,000", "charge": "KES 102"},
    {"range": "20,001 - 25,000", "charge": "KES 105"},
    {"range": "25,001 - 30,000", "charge": "KES 105"},
    {"range": "30,001 - 35,000", "charge": "KES 105"},
    {"range": "35,001 - 50,000", "charge": "KES 105"},
    {"range": "50,001 - 150,000", "charge": "KES 108"}
  ],
  "fee_summary": [
    "6% service fee on completed projects (Free plan)",
    "4% service fee on completed projects (Pro plan)",
    "KES 0 withdrawal fees from HustleKE",
    "Standard M-Pesa charges apply as per Safaricom rates above"
  ],
  "last_updated": "February 2026"
}',
'M-Pesa Tariffs - HustleKE', 'M-Pesa withdrawal tariff breakdown for HustleKE.');

-- === LEGAL ===
INSERT INTO site_pages (slug, title, nav_category, sort_order, content, meta_title, meta_description) VALUES
('privacy', 'Privacy Policy', 'legal', 0,
'{
  "title": "Privacy Policy",
  "last_updated": "February 2026",
  "sections": [
    {"heading": "1. Information We Collect", "body": "We collect information you provide directly, including your name, email address, phone number (M-Pesa), county, professional skills, portfolio items, and payment information.\n\nWe also collect usage data such as pages visited, job searches, proposals submitted, and device/browser information to improve our services."},
    {"heading": "2. How We Use Your Information", "body": "To create and manage your account\nTo match you with relevant jobs or freelancers using our AI algorithm\nTo process payments through M-Pesa escrow\nTo verify your identity and maintain platform trust\nTo send notifications about job updates, messages, and platform news\nTo calculate your Hustle Score\nTo improve our platform and develop new features"},
    {"heading": "3. M-Pesa & Payment Data", "body": "Payment transactions are processed through Safaricom''s M-Pesa API. We store transaction records for escrow management but do not store your M-Pesa PIN. All payment data is encrypted using industry-standard protocols."},
    {"heading": "4. Data Sharing", "body": "We do not sell your personal data. We share information only with:\nOther users as necessary for job transactions (e.g., your profile visible to clients)\nSafaricom for M-Pesa payment processing\nService providers who help us operate the platform\nLaw enforcement when required by Kenyan law"},
    {"heading": "5. Data Security", "body": "We implement appropriate security measures including encryption, secure servers, and regular security audits. However, no internet transmission is 100% secure, and we cannot guarantee absolute security."},
    {"heading": "6. Your Rights", "body": "Under Kenyan data protection law, you have the right to:\nAccess your personal data\nCorrect inaccurate data\nDelete your account and associated data\nObject to data processing\nExport your data"},
    {"heading": "7. Cookies", "body": "We use cookies and similar technologies to maintain your session, remember preferences, and analyze platform usage. You can manage cookie preferences in your browser settings."},
    {"heading": "8. Contact Us", "body": "For privacy-related questions, contact us at privacy@hustleke.com or visit our Contact page."}
  ]
}',
'Privacy Policy - HustleKE', 'HustleKE privacy policy.'),

('terms', 'Terms of Service', 'legal', 1,
'{
  "title": "Terms of Service",
  "last_updated": "February 2026",
  "sections": [
    {"heading": "1. Acceptance of Terms", "body": "By accessing or using HustleKE, you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform. HustleKE is operated in Kenya and subject to Kenyan law."},
    {"heading": "2. Account Registration", "body": "You must be at least 18 years old to create an account\nYou must provide accurate and complete information\nYou are responsible for maintaining the security of your account\nOne person may only maintain one account\nIdentity verification via national ID is required for full platform access"},
    {"heading": "3. Service Fees", "body": "HustleKE charges a 6% service fee on all completed transactions. This fee is deducted from the project payment when funds are released from escrow.\nThere are no monthly subscription fees for standard accounts\nPro accounts are available at KES 500/month with reduced fees\nM-Pesa transaction charges may apply as per Safaricom''s tariffs\nAll fees are inclusive of applicable taxes"},
    {"heading": "4. M-Pesa Escrow", "body": "All project payments are held in our M-Pesa escrow system. Clients fund the escrow before work begins. Funds are released to the freelancer upon client approval of delivered work. If a dispute arises, funds remain in escrow until resolution."},
    {"heading": "5. Freelancer Obligations", "body": "Deliver work as described in the project agreement\nCommunicate promptly and professionally with clients\nMeet agreed deadlines or communicate delays in advance\nMaintain the quality standards expected by the platform\nNot solicit clients to transact outside the platform"},
    {"heading": "6. Client Obligations", "body": "Provide clear project requirements and expectations\nFund escrow before work begins\nReview and approve delivered work within 7 days\nCommunicate feedback constructively\nNot request work beyond the agreed scope without additional payment"},
    {"heading": "7. Hustle Score", "body": "Your Hustle Score is calculated based on work history, client reviews, response time, completion rate, and verification status. Manipulating your Hustle Score through fake reviews or fraudulent activity will result in account suspension."},
    {"heading": "8. Dispute Resolution", "body": "Disputes between clients and freelancers are handled through our resolution center. Both parties must submit evidence. HustleKE''s dispute resolution team will make a binding decision within 14 business days. Escrow funds are held until resolution."},
    {"heading": "9. Prohibited Activities", "body": "Fraud, scams, or misrepresentation\nHarassment or abusive behavior\nSharing account credentials\nCircumventing the escrow payment system\nPosting illegal or harmful content\nCreating fake accounts or reviews"},
    {"heading": "10. Termination", "body": "HustleKE may suspend or terminate accounts that violate these terms. You may delete your account at any time. Outstanding escrow payments will be resolved before account closure."},
    {"heading": "11. Contact", "body": "Questions about these terms? Contact us at legal@hustleke.com or visit our Contact page."}
  ]
}',
'Terms of Service - HustleKE', 'HustleKE terms of service.');

-- 11. Admin bypass RLS policies for existing tables (safe to re-run)
DO $$
BEGIN
  -- Profiles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can do anything with profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Admins can do anything with profiles" ON profiles USING (is_admin()) WITH CHECK (is_admin());
  END IF;
  -- Jobs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can do anything with jobs' AND tablename = 'jobs') THEN
    CREATE POLICY "Admins can do anything with jobs" ON jobs USING (is_admin()) WITH CHECK (is_admin());
  END IF;
  -- Proposals
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can do anything with proposals' AND tablename = 'proposals') THEN
    CREATE POLICY "Admins can do anything with proposals" ON proposals USING (is_admin()) WITH CHECK (is_admin());
  END IF;
  -- Escrow
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can do anything with escrow' AND tablename = 'escrow_transactions') THEN
    CREATE POLICY "Admins can do anything with escrow" ON escrow_transactions USING (is_admin()) WITH CHECK (is_admin());
  END IF;
  -- Wallets
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all wallets' AND tablename = 'wallets') THEN
    CREATE POLICY "Admins can view all wallets" ON wallets FOR SELECT USING (is_admin());
  END IF;
  -- Wallet transactions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all wallet transactions' AND tablename = 'wallet_transactions') THEN
    CREATE POLICY "Admins can view all wallet transactions" ON wallet_transactions FOR SELECT USING (is_admin());
  END IF;
  -- Messages
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all messages' AND tablename = 'messages') THEN
    CREATE POLICY "Admins can view all messages" ON messages FOR SELECT USING (is_admin());
  END IF;
  -- Disputes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can do anything with disputes' AND tablename = 'disputes') THEN
    CREATE POLICY "Admins can do anything with disputes" ON disputes USING (is_admin()) WITH CHECK (is_admin());
  END IF;
  -- Reviews
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can do anything with reviews' AND tablename = 'reviews') THEN
    CREATE POLICY "Admins can do anything with reviews" ON reviews USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;
