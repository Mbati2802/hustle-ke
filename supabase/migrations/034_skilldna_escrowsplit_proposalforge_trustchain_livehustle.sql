-- ============================================================
-- 034: Five Groundbreaking Features
-- 1. SkillDNA™ — AI Skill Verification
-- 2. EscrowSplit™ — Milestone-Based Smart Payments
-- 3. ProposalForge™ — AI Proposal Writer
-- 4. TrustChain™ — Portable Reputation
-- 5. LiveHustle™ — Real-Time Work Sessions
-- ============================================================

-- ╔══════════════════════════════════════════════════════════╗
-- ║  FEATURE 1: SkillDNA™ — AI Skill Verification           ║
-- ╚══════════════════════════════════════════════════════════╝

-- Skill challenges: AI-generated micro-challenges per skill
CREATE TABLE IF NOT EXISTS skill_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name TEXT NOT NULL,           -- e.g. 'React', 'Graphic Design', 'Copywriting'
  difficulty TEXT NOT NULL DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('code', 'design', 'writing', 'analysis', 'quiz')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prompt TEXT NOT NULL,               -- The actual challenge prompt shown to user
  time_limit_seconds INTEGER NOT NULL DEFAULT 120,
  evaluation_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{criterion, weight, description}]
  sample_solution TEXT,               -- For AI evaluation reference
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_skill_challenges_skill ON skill_challenges(skill_name);
CREATE INDEX idx_skill_challenges_type ON skill_challenges(challenge_type);
CREATE INDEX idx_skill_challenges_difficulty ON skill_challenges(difficulty);

-- Skill verification attempts
CREATE TABLE IF NOT EXISTS skill_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES skill_challenges(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  
  -- Submission
  response TEXT NOT NULL,             -- User's answer/code/text
  time_taken_seconds INTEGER NOT NULL,
  
  -- AI Evaluation
  score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  badge_level TEXT CHECK (badge_level IN ('bronze', 'silver', 'gold', 'diamond')),
  evaluation_details JSONB DEFAULT '{}'::jsonb,  -- {criteria_scores, feedback, strengths, improvements}
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'evaluating', 'completed', 'failed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  evaluated_at TIMESTAMPTZ
);

CREATE INDEX idx_skill_verifications_user ON skill_verifications(user_id);
CREATE INDEX idx_skill_verifications_skill ON skill_verifications(skill_name);
CREATE INDEX idx_skill_verifications_badge ON skill_verifications(badge_level);

-- Verified skills summary (denormalized for fast profile display)
CREATE TABLE IF NOT EXISTS verified_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  badge_level TEXT NOT NULL CHECK (badge_level IN ('bronze', 'silver', 'gold', 'diamond')),
  score NUMERIC(5,2) NOT NULL,
  verification_id UUID REFERENCES skill_verifications(id),
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year'),
  attempts INTEGER DEFAULT 1,
  UNIQUE(user_id, skill_name)
);

CREATE INDEX idx_verified_skills_user ON verified_skills(user_id);
CREATE INDEX idx_verified_skills_badge ON verified_skills(badge_level);

-- RLS for SkillDNA
ALTER TABLE skill_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active challenges" ON skill_challenges
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role manages challenges" ON skill_challenges
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can view own verifications" ON skill_verifications
  FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create verifications" ON skill_verifications
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Service role manages verifications" ON skill_verifications
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view verified skills" ON verified_skills
  FOR SELECT USING (true);

CREATE POLICY "Service role manages verified skills" ON verified_skills
  FOR ALL USING (true) WITH CHECK (true);


-- ╔══════════════════════════════════════════════════════════╗
-- ║  FEATURE 2: EscrowSplit™ — Smart Milestone Payments      ║
-- ╚══════════════════════════════════════════════════════════╝

-- Enhance existing job_milestones table with smart payment features
ALTER TABLE job_milestones ADD COLUMN IF NOT EXISTS percentage NUMERIC(5,2) DEFAULT 0;
ALTER TABLE job_milestones ADD COLUMN IF NOT EXISTS escrow_id UUID REFERENCES escrow_transactions(id);
ALTER TABLE job_milestones ADD COLUMN IF NOT EXISTS auto_release_at TIMESTAMPTZ;
ALTER TABLE job_milestones ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE job_milestones ADD COLUMN IF NOT EXISTS submission_note TEXT;
ALTER TABLE job_milestones ADD COLUMN IF NOT EXISTS submission_files JSONB DEFAULT '[]'::jsonb;
ALTER TABLE job_milestones ADD COLUMN IF NOT EXISTS review_note TEXT;
ALTER TABLE job_milestones ADD COLUMN IF NOT EXISTS partial_approval_pct NUMERIC(5,2);
ALTER TABLE job_milestones ADD COLUMN IF NOT EXISTS revision_requested BOOLEAN DEFAULT false;
ALTER TABLE job_milestones ADD COLUMN IF NOT EXISTS revision_note TEXT;
ALTER TABLE job_milestones ADD COLUMN IF NOT EXISTS auto_release_hours INTEGER DEFAULT 72;

-- Update status check to include new statuses
ALTER TABLE job_milestones DROP CONSTRAINT IF EXISTS job_milestones_status_check;
ALTER TABLE job_milestones ADD CONSTRAINT job_milestones_status_check 
  CHECK (status IN ('Pending', 'In Progress', 'Submitted', 'Revision Requested', 'Approved', 'Partially Approved', 'Completed', 'Paid'));

-- Milestone payment log
CREATE TABLE IF NOT EXISTS milestone_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES job_milestones(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  escrow_id UUID REFERENCES escrow_transactions(id),
  payer_id UUID NOT NULL REFERENCES profiles(id),
  payee_id UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  service_fee DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('milestone_release', 'partial_release', 'auto_release', 'refund')),
  status TEXT NOT NULL DEFAULT 'Completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_milestone_payments_milestone ON milestone_payments(milestone_id);
CREATE INDEX idx_milestone_payments_job ON milestone_payments(job_id);

ALTER TABLE milestone_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own milestone payments" ON milestone_payments
  FOR SELECT USING (
    payer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR payee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role manages milestone payments" ON milestone_payments
  FOR ALL USING (true) WITH CHECK (true);


-- ╔══════════════════════════════════════════════════════════╗
-- ║  FEATURE 3: ProposalForge™ — AI Proposal Writer          ║
-- ╚══════════════════════════════════════════════════════════╝

-- Store generated proposals and their outcomes for learning
CREATE TABLE IF NOT EXISTS proposal_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  
  -- AI Analysis
  job_analysis JSONB DEFAULT '{}'::jsonb,       -- {key_requirements, pain_points, budget_signals, tone}
  client_analysis JSONB DEFAULT '{}'::jsonb,    -- {hiring_history, avg_budget, preferred_skills, review_patterns}
  freelancer_match JSONB DEFAULT '{}'::jsonb,   -- {relevant_skills, matching_experience, strengths}
  strategy JSONB DEFAULT '{}'::jsonb,           -- {recommended_bid, opening_hook, key_points, closing_question}
  
  -- Generated Content
  generated_cover_letter TEXT NOT NULL,
  generated_bid_amount DECIMAL(10,2),
  generated_duration_days INTEGER,
  
  -- User Edits
  final_cover_letter TEXT,
  final_bid_amount DECIMAL(10,2),
  was_edited BOOLEAN DEFAULT false,
  edit_percentage NUMERIC(5,2) DEFAULT 0,       -- How much the user changed the AI draft
  
  -- Outcome Tracking
  proposal_id UUID REFERENCES proposals(id),    -- Linked after submission
  outcome TEXT CHECK (outcome IN ('submitted', 'accepted', 'rejected', 'withdrawn', 'expired')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ
);

CREATE INDEX idx_proposal_drafts_user ON proposal_drafts(user_id);
CREATE INDEX idx_proposal_drafts_job ON proposal_drafts(job_id);
CREATE INDEX idx_proposal_drafts_outcome ON proposal_drafts(outcome);

-- Winning proposal patterns (aggregated learning data)
CREATE TABLE IF NOT EXISTS proposal_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,                       -- Job category
  subcategory TEXT,
  
  -- Pattern data
  avg_accepted_bid_ratio NUMERIC(5,2),          -- Ratio of accepted bid to job budget
  avg_cover_letter_length INTEGER,
  top_opening_phrases TEXT[] DEFAULT '{}',
  top_closing_phrases TEXT[] DEFAULT '{}',
  key_differentiators TEXT[] DEFAULT '{}',
  avg_response_time_hours NUMERIC(8,2),
  
  -- Stats
  sample_size INTEGER DEFAULT 0,
  acceptance_rate NUMERIC(5,2) DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proposal_patterns_category ON proposal_patterns(category);

ALTER TABLE proposal_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own drafts" ON proposal_drafts
  FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create drafts" ON proposal_drafts
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own drafts" ON proposal_drafts
  FOR UPDATE USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Service role manages drafts" ON proposal_drafts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view patterns" ON proposal_patterns
  FOR SELECT USING (true);

CREATE POLICY "Service role manages patterns" ON proposal_patterns
  FOR ALL USING (true) WITH CHECK (true);


-- ╔══════════════════════════════════════════════════════════╗
-- ║  FEATURE 4: TrustChain™ — Portable Reputation            ║
-- ╚══════════════════════════════════════════════════════════╝

-- External platform reputation imports
CREATE TABLE IF NOT EXISTS reputation_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Platform info
  platform TEXT NOT NULL CHECK (platform IN ('upwork', 'fiverr', 'freelancer', 'linkedin', 'github', 'toptal', 'other')),
  platform_username TEXT,
  platform_profile_url TEXT NOT NULL,
  
  -- Imported data
  rating NUMERIC(3,2),                          -- e.g. 4.95
  total_reviews INTEGER DEFAULT 0,
  total_projects INTEGER DEFAULT 0,
  total_earnings_tier TEXT,                      -- 'under_1k', '1k_10k', '10k_50k', '50k_100k', '100k_plus'
  member_since DATE,
  specializations TEXT[] DEFAULT '{}',
  top_skills TEXT[] DEFAULT '{}',
  
  -- Verification
  verification_method TEXT NOT NULL CHECK (verification_method IN ('oauth', 'screenshot', 'api', 'manual')),
  verification_proof JSONB DEFAULT '{}'::jsonb,  -- {screenshot_url, oauth_token_hash, api_response_hash}
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
  verified_at TIMESTAMPTZ,
  verified_by TEXT,                              -- 'ai', 'admin', 'oauth'
  rejection_reason TEXT,
  
  -- TrustChain Score contribution
  trust_score_contribution NUMERIC(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '6 months'),
  
  UNIQUE(user_id, platform)
);

CREATE INDEX idx_reputation_imports_user ON reputation_imports(user_id);
CREATE INDEX idx_reputation_imports_platform ON reputation_imports(platform);
CREATE INDEX idx_reputation_imports_status ON reputation_imports(verification_status);

-- Reputation certificates (exportable, signed)
CREATE TABLE IF NOT EXISTS reputation_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Certificate data
  certificate_data JSONB NOT NULL,              -- Full signed certificate in JSON-LD format
  signature_hash TEXT NOT NULL,                  -- HMAC signature for tamper detection
  
  -- Summary
  total_projects INTEGER DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  on_time_rate NUMERIC(5,2) DEFAULT 0,
  skills_verified INTEGER DEFAULT 0,
  earnings_tier TEXT,
  hustle_score INTEGER DEFAULT 0,
  
  -- Metadata
  version INTEGER DEFAULT 1,
  is_public BOOLEAN DEFAULT true,
  short_code TEXT UNIQUE,                       -- Short shareable code e.g. "HK-A7B3C9"
  views INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year')
);

CREATE INDEX idx_reputation_certs_user ON reputation_certificates(user_id);
CREATE INDEX idx_reputation_certs_code ON reputation_certificates(short_code);

-- TrustChain score (composite of internal + external reputation)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_chain_score NUMERIC(5,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_chain_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reputation_certificate_id UUID;

ALTER TABLE reputation_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own imports" ON reputation_imports
  FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create imports" ON reputation_imports
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own imports" ON reputation_imports
  FOR UPDATE USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Service role manages imports" ON reputation_imports
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view public certificates" ON reputation_certificates
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage own certificates" ON reputation_certificates
  FOR ALL USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Service role manages certificates" ON reputation_certificates
  FOR ALL USING (true) WITH CHECK (true);


-- ╔══════════════════════════════════════════════════════════╗
-- ║  FEATURE 5: LiveHustle™ — Real-Time Work Sessions        ║
-- ╚══════════════════════════════════════════════════════════╝

-- Live session requests (like Uber ride requests)
CREATE TABLE IF NOT EXISTS live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Participants
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES profiles(id),   -- NULL until matched
  
  -- Request details
  title TEXT NOT NULL,
  description TEXT,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  hourly_rate DECIMAL(10,2) NOT NULL,
  estimated_duration_minutes INTEGER NOT NULL DEFAULT 60,
  max_budget DECIMAL(10,2),                     -- Max the client will pay
  
  -- Session state
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open',           -- Waiting for freelancer
    'matched',        -- Freelancer accepted
    'in_progress',    -- Session active
    'paused',         -- Temporarily paused
    'completed',      -- Session ended normally
    'cancelled',      -- Cancelled before start
    'disputed'        -- Under dispute
  )),
  
  -- Timing
  matched_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  actual_duration_minutes INTEGER,
  
  -- Billing
  escrow_id UUID REFERENCES escrow_transactions(id),
  total_billed DECIMAL(10,2) DEFAULT 0,
  service_fee DECIMAL(10,2) DEFAULT 0,
  net_payout DECIMAL(10,2) DEFAULT 0,
  
  -- Session features
  has_screen_share BOOLEAN DEFAULT false,
  has_recording BOOLEAN DEFAULT false,
  recording_url TEXT,
  session_notes TEXT,
  
  -- Ratings (immediate post-session)
  client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
  client_review TEXT,
  freelancer_rating INTEGER CHECK (freelancer_rating >= 1 AND freelancer_rating <= 5),
  freelancer_review TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_live_sessions_client ON live_sessions(client_id);
CREATE INDEX idx_live_sessions_freelancer ON live_sessions(freelancer_id);
CREATE INDEX idx_live_sessions_status ON live_sessions(status);
CREATE INDEX idx_live_sessions_skills ON live_sessions USING GIN(required_skills);
CREATE INDEX idx_live_sessions_created ON live_sessions(created_at DESC);

-- Freelancer availability for LiveHustle
CREATE TABLE IF NOT EXISTS live_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  is_available BOOLEAN DEFAULT false,
  hourly_rate DECIMAL(10,2) NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  bio TEXT,                                     -- Short "available for" description
  max_session_hours INTEGER DEFAULT 4,
  
  -- Stats
  total_sessions INTEGER DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  total_earnings DECIMAL(12,2) DEFAULT 0,
  response_time_seconds INTEGER,                -- Avg time to accept a session
  
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE INDEX idx_live_availability_available ON live_availability(is_available) WHERE is_available = true;
CREATE INDEX idx_live_availability_skills ON live_availability USING GIN(skills);
CREATE INDEX idx_live_availability_rate ON live_availability(hourly_rate);

-- Live session messages (chat during session)
CREATE TABLE IF NOT EXISTS live_session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'code', 'file', 'system')),
  file_url TEXT,
  file_name TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_live_messages_session ON live_session_messages(session_id);
CREATE INDEX idx_live_messages_created ON live_session_messages(created_at);

-- RLS for LiveHustle
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_session_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON live_sessions
  FOR SELECT USING (
    client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR freelancer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Clients can create sessions" ON live_sessions
  FOR INSERT WITH CHECK (client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Participants can update sessions" ON live_sessions
  FOR UPDATE USING (
    client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR freelancer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role manages sessions" ON live_sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view available freelancers" ON live_availability
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own availability" ON live_availability
  FOR ALL USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Service role manages availability" ON live_availability
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Session participants can view messages" ON live_session_messages
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM live_sessions WHERE 
        client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR freelancer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Session participants can send messages" ON live_session_messages
  FOR INSERT WITH CHECK (
    sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    AND session_id IN (
      SELECT id FROM live_sessions WHERE 
        client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR freelancer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Service role manages messages" ON live_session_messages
  FOR ALL USING (true) WITH CHECK (true);

-- Freelancers can view open sessions to accept them
CREATE POLICY "Freelancers can view open sessions" ON live_sessions
  FOR SELECT USING (status = 'open');


-- ╔══════════════════════════════════════════════════════════╗
-- ║  SEED DATA: SkillDNA Challenges                          ║
-- ╚══════════════════════════════════════════════════════════╝

INSERT INTO skill_challenges (skill_name, difficulty, challenge_type, title, description, prompt, time_limit_seconds, evaluation_criteria) VALUES

-- Web Development
('React', 'intermediate', 'code', 'Fix the Counter Bug', 
 'Debug a React component with a state management issue.',
 'The following React component has a bug where the counter doesn''t update correctly when clicking rapidly. Identify the bug and write the corrected code:\n\n```jsx\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  \n  const increment = () => {\n    setCount(count + 1);\n    setCount(count + 1);\n  };\n  \n  return <button onClick={increment}>Count: {count}</button>;\n}\n```\n\nExplain the bug and provide the fix.',
 120,
 '[{"criterion": "Bug identification", "weight": 30, "description": "Correctly identifies the stale closure issue"}, {"criterion": "Correct fix", "weight": 40, "description": "Uses functional updater pattern"}, {"criterion": "Explanation quality", "weight": 30, "description": "Clear explanation of why the bug occurs"}]'),

('JavaScript', 'intermediate', 'code', 'Async Array Processing',
 'Write an efficient async function to process an array.',
 'Write a JavaScript function called `processInBatches` that takes an array of items and an async callback function, and processes them in batches of N items concurrently (not sequentially, not all at once). Return all results in order.\n\nSignature: `async function processInBatches(items, batchSize, callback)`\n\nExample: processInBatches([1,2,3,4,5], 2, async (n) => n * 2) should return [2,4,6,8,10]',
 180,
 '[{"criterion": "Correct batching", "weight": 35, "description": "Processes exactly batchSize items concurrently"}, {"criterion": "Order preservation", "weight": 25, "description": "Results maintain original order"}, {"criterion": "Error handling", "weight": 20, "description": "Handles rejected promises gracefully"}, {"criterion": "Code quality", "weight": 20, "description": "Clean, readable code"}]'),

('Python', 'intermediate', 'code', 'Data Deduplication',
 'Write an efficient deduplication function.',
 'Write a Python function that removes duplicate dictionaries from a list while preserving order. Two dictionaries are considered duplicates if they have the same values for a specified set of keys.\n\nSignature: `def deduplicate(items: list[dict], keys: list[str]) -> list[dict]`\n\nExample:\n```python\ndata = [\n  {"name": "Alice", "age": 30, "city": "Nairobi"},\n  {"name": "Bob", "age": 25, "city": "Mombasa"},\n  {"name": "Alice", "age": 31, "city": "Nairobi"},\n]\ndeduplicate(data, ["name", "city"])  # Returns first and second items only\n```',
 150,
 '[{"criterion": "Correctness", "weight": 40, "description": "Correctly deduplicates based on specified keys"}, {"criterion": "Order preservation", "weight": 20, "description": "Maintains original order"}, {"criterion": "Efficiency", "weight": 20, "description": "O(n) or O(n log n) solution"}, {"criterion": "Edge cases", "weight": 20, "description": "Handles missing keys, empty lists"}]'),

('CSS', 'intermediate', 'code', 'Responsive Card Layout',
 'Create a responsive card grid with pure CSS.',
 'Write CSS to create a responsive card grid that:\n1. Shows 1 card per row on mobile (<640px)\n2. Shows 2 cards per row on tablet (640px-1024px)\n3. Shows 3 cards per row on desktop (>1024px)\n4. Cards have equal height in each row\n5. 16px gap between cards\n6. Cards have a subtle shadow and rounded corners\n\nUse modern CSS (Grid or Flexbox). Write only the CSS, assuming this HTML:\n```html\n<div class="card-grid">\n  <div class="card">...</div>\n  <div class="card">...</div>\n  <div class="card">...</div>\n</div>\n```',
 120,
 '[{"criterion": "Responsive breakpoints", "weight": 30, "description": "Correct column counts at each breakpoint"}, {"criterion": "Equal heights", "weight": 25, "description": "Cards in same row have equal height"}, {"criterion": "Modern CSS", "weight": 25, "description": "Uses Grid or Flexbox properly"}, {"criterion": "Visual polish", "weight": 20, "description": "Shadow, border-radius, spacing"}]'),

-- Copywriting
('Copywriting', 'intermediate', 'writing', 'Product Description Challenge',
 'Write a compelling product description.',
 'Write a product description (50-80 words) for the following item:\n\n**Product:** A solar-powered phone charger designed for outdoor use in Kenya\n**Target audience:** Young professionals who travel between cities\n**Key features:** 10,000mAh battery, waterproof, charges 2 devices simultaneously, folds flat\n**Brand tone:** Modern, practical, proudly Kenyan\n\nYour description should create desire, highlight the key benefit, and include a call to action.',
 180,
 '[{"criterion": "Persuasion", "weight": 30, "description": "Creates desire and urgency"}, {"criterion": "Clarity", "weight": 25, "description": "Key features communicated clearly"}, {"criterion": "Brand voice", "weight": 25, "description": "Matches the specified tone"}, {"criterion": "CTA effectiveness", "weight": 20, "description": "Strong, actionable closing"}]'),

-- Data Analysis
('Data Analysis', 'intermediate', 'analysis', 'Chart Interpretation',
 'Analyze data and identify the key insight.',
 'A Nairobi e-commerce company shares this monthly data:\n\nMonth | Revenue (KES) | Orders | Avg Order Value | Return Rate\nJan   | 2,400,000    | 800    | 3,000          | 5%\nFeb   | 2,100,000    | 750    | 2,800          | 8%\nMar   | 3,200,000    | 900    | 3,556          | 4%\nApr   | 3,000,000    | 1,200  | 2,500          | 12%\nMay   | 2,800,000    | 1,100  | 2,545          | 15%\n\nIn 3-4 sentences:\n1. What is the most concerning trend?\n2. What likely caused it?\n3. What would you recommend?',
 150,
 '[{"criterion": "Insight quality", "weight": 35, "description": "Identifies the return rate spike as orders increased"}, {"criterion": "Root cause analysis", "weight": 30, "description": "Connects volume growth to quality/fulfillment issues"}, {"criterion": "Recommendation", "weight": 25, "description": "Actionable, specific recommendation"}, {"criterion": "Conciseness", "weight": 10, "description": "Within word limit, clear communication"}]'),

-- Graphic Design
('Graphic Design', 'intermediate', 'writing', 'Brand Color Rationale',
 'Explain your design thinking for a brand.',
 'A new fintech startup in Kenya called "PesaPal Junior" is launching a savings app for teenagers (13-18 years old). They want to feel trustworthy but also fun and modern.\n\nIn 60-100 words:\n1. Recommend a primary color and secondary color (with hex codes)\n2. Explain WHY these colors work for this specific audience and product\n3. Suggest one typography pairing (heading + body font)\n\nShow your design thinking, not just preferences.',
 180,
 '[{"criterion": "Color psychology", "weight": 30, "description": "Colors match the dual need: trust + youth appeal"}, {"criterion": "Audience awareness", "weight": 25, "description": "Understands Kenyan teen preferences"}, {"criterion": "Typography choice", "weight": 25, "description": "Font pairing is practical and on-brand"}, {"criterion": "Reasoning depth", "weight": 20, "description": "Explains WHY, not just WHAT"}]'),

-- Mobile Development
('Flutter', 'intermediate', 'code', 'State Management Fix',
 'Fix a Flutter widget with incorrect state handling.',
 'This Flutter widget should show a list of items that can be toggled (selected/unselected). But tapping an item doesn''t update the UI. Find and fix the bug:\n\n```dart\nclass ItemList extends StatefulWidget {\n  @override\n  _ItemListState createState() => _ItemListState();\n}\n\nclass _ItemListState extends State<ItemList> {\n  List<String> items = ["Apples", "Bananas", "Oranges"];\n  List<String> selected = [];\n\n  void toggleItem(String item) {\n    if (selected.contains(item)) {\n      selected.remove(item);\n    } else {\n      selected.add(item);\n    }\n  }\n\n  @override\n  Widget build(BuildContext context) {\n    return ListView.builder(\n      itemCount: items.length,\n      itemBuilder: (ctx, i) => ListTile(\n        title: Text(items[i]),\n        trailing: Icon(\n          selected.contains(items[i]) ? Icons.check_circle : Icons.circle_outlined,\n        ),\n        onTap: () => toggleItem(items[i]),\n      ),\n    );\n  }\n}\n```',
 120,
 '[{"criterion": "Bug identification", "weight": 35, "description": "Identifies missing setState call"}, {"criterion": "Correct fix", "weight": 40, "description": "Wraps mutation in setState"}, {"criterion": "Explanation", "weight": 25, "description": "Explains why setState is needed for rebuild"}]')

ON CONFLICT DO NOTHING;
