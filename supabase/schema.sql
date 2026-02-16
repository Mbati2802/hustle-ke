-- HustleKE Database Schema
-- Kenyan Freelance Marketplace

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE verification_status AS ENUM ('Unverified', 'ID-Verified', 'Skill-Tested');
CREATE TYPE job_status AS ENUM ('Draft', 'Open', 'In-Progress', 'Completed', 'Disputed', 'Cancelled');
CREATE TYPE payment_type AS ENUM ('Fixed', 'Hourly', 'Milestone');
CREATE TYPE proposal_status AS ENUM ('Pending', 'Accepted', 'Rejected', 'Withdrawn');
CREATE TYPE escrow_status AS ENUM ('Pending', 'Held', 'Released', 'Refunded', 'Disputed');
CREATE TYPE transaction_type AS ENUM ('Deposit', 'Withdrawal', 'Escrow', 'Release', 'Refund', 'Fee');
CREATE TYPE user_role AS ENUM ('Freelancer', 'Client', 'Admin');

-- ============================================
-- PROFILES TABLE
-- ============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    location TEXT,
    county TEXT,
    avatar_url TEXT,
    bio TEXT,
    
    -- Professional info
    skills TEXT[] DEFAULT '{}',
    hourly_rate INTEGER,
    title TEXT,
    
    -- M-Pesa integration
    mpesa_phone TEXT,
    mpesa_verified BOOLEAN DEFAULT FALSE,
    mpesa_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Verification & Trust
    verification_status verification_status DEFAULT 'Unverified',
    id_verified BOOLEAN DEFAULT FALSE,
    id_verified_at TIMESTAMP WITH TIME ZONE,
    skill_tested BOOLEAN DEFAULT FALSE,
    
    -- AI & Scoring
    ai_score INTEGER DEFAULT 0 CHECK (ai_score >= 0 AND ai_score <= 100),
    hustle_score INTEGER DEFAULT 0 CHECK (hustle_score >= 0 AND hustle_score <= 100),
    
    -- Stats
    total_earned INTEGER DEFAULT 0,
    jobs_completed INTEGER DEFAULT 0,
    jobs_posted INTEGER DEFAULT 0,
    response_time_hours INTEGER,
    
    -- Role
    role user_role DEFAULT 'Freelancer',
    
    -- Preferences
    languages TEXT[] DEFAULT '{"English"}',
    swahili_speaking BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_profile UNIQUE (user_id)
);

-- ============================================
-- JOBS TABLE
-- ============================================

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Job details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Budget
    budget_min INTEGER NOT NULL,
    budget_max INTEGER NOT NULL,
    payment_type payment_type DEFAULT 'Fixed',
    
    -- Status & Timeline
    status job_status DEFAULT 'Open',
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Skills & Tags
    skills_required TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    
    -- Location preferences
    location_preference TEXT,
    remote_allowed BOOLEAN DEFAULT TRUE,
    
    -- Verification requirements
    requires_verified_only BOOLEAN DEFAULT FALSE,
    requires_swahili BOOLEAN DEFAULT FALSE,
    min_hustle_score INTEGER DEFAULT 0,
    
    -- AI & Stats
    ai_match_score INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    proposals_count INTEGER DEFAULT 0,
    
    -- Featured/Boosted
    is_boosted BOOLEAN DEFAULT FALSE,
    boosted_until TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- PROPOSALS TABLE
-- ============================================

CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Proposal content
    cover_letter TEXT NOT NULL,
    cover_letter_original TEXT, -- Store original before AI enhancement
    bid_amount INTEGER NOT NULL,
    estimated_duration_days INTEGER,
    
    -- Status
    status proposal_status DEFAULT 'Pending',
    
    -- AI Enhancement
    ai_enhancement_score INTEGER DEFAULT 0,
    ai_suggestions TEXT,
    
    -- Timeline
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT unique_freelancer_job_proposal UNIQUE (job_id, freelancer_id)
);

-- ============================================
-- ESCROW TRANSACTIONS TABLE
-- ============================================

CREATE TABLE escrow_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
    
    -- Parties
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Amount & Status
    amount INTEGER NOT NULL,
    status escrow_status DEFAULT 'Pending',
    
    -- M-Pesa details
    mpesa_receipt_number TEXT,
    mpesa_checkout_request_id TEXT,
    mpesa_merchant_request_id TEXT,
    mpesa_result_code INTEGER,
    mpesa_result_desc TEXT,
    
    -- Transaction details
    transaction_type transaction_type DEFAULT 'Escrow',
    service_fee INTEGER DEFAULT 0,
    tax_amount INTEGER DEFAULT 0,
    
    -- Timestamps
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    held_at TIMESTAMP WITH TIME ZONE,
    released_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    description TEXT,
    failure_reason TEXT
);

-- ============================================
-- WALLETS TABLE
-- ============================================

CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Balance
    balance INTEGER DEFAULT 0,
    pending_balance INTEGER DEFAULT 0, -- Escrowed funds
    
    -- Stats
    total_deposited INTEGER DEFAULT 0,
    total_withdrawn INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    
    -- Withdrawal settings
    auto_withdraw BOOLEAN DEFAULT FALSE,
    auto_withdraw_threshold INTEGER DEFAULT 5000,
    preferred_withdrawal_method TEXT DEFAULT 'mpesa',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_wallet UNIQUE (user_id)
);

-- ============================================
-- WALLET TRANSACTIONS TABLE
-- ============================================

CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
    
    -- Transaction details
    amount INTEGER NOT NULL,
    type transaction_type NOT NULL,
    status TEXT DEFAULT 'Completed',
    
    -- References
    escrow_id UUID REFERENCES escrow_transactions(id) ON DELETE SET NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    
    -- M-Pesa details
    mpesa_receipt_number TEXT,
    mpesa_phone TEXT,
    
    -- Metadata
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MESSAGES TABLE
-- ============================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Content
    content TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DISPUTES TABLE
-- ============================================

CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    escrow_id UUID REFERENCES escrow_transactions(id) ON DELETE CASCADE,
    
    -- Parties
    initiator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    respondent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Details
    reason TEXT NOT NULL,
    description TEXT,
    evidence_urls TEXT[] DEFAULT '{}',
    
    -- Resolution
    status TEXT DEFAULT 'Open',
    resolution TEXT,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Financial
    refund_amount INTEGER,
    release_amount INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- HUSTLE SCORE LOG TABLE
-- ============================================

CREATE TABLE hustle_score_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Change details
    previous_score INTEGER NOT NULL,
    new_score INTEGER NOT NULL,
    change_amount INTEGER NOT NULL,
    
    -- Reason
    reason TEXT NOT NULL,
    category TEXT, -- 'Verification', 'Job', 'Dispute', 'Profile', etc.
    
    -- Reference
    reference_id UUID, -- Can reference job, dispute, etc.
    reference_type TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- REVIEWS TABLE
-- ============================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    escrow_id UUID REFERENCES escrow_transactions(id) ON DELETE SET NULL,
    
    -- Parties
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    -- Categories
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
    
    -- Visibility
    is_public BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_job_review UNIQUE (job_id, reviewer_id, reviewee_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_verification ON profiles(verification_status);
CREATE INDEX idx_profiles_hustle_score ON profiles(hustle_score DESC);
CREATE INDEX idx_profiles_skills ON profiles USING GIN(skills);
CREATE INDEX idx_profiles_location ON profiles(county);

-- Jobs indexes
CREATE INDEX idx_jobs_client ON jobs(client_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);
CREATE INDEX idx_jobs_skills ON jobs USING GIN(skills_required);
CREATE INDEX idx_jobs_budget ON jobs(budget_min, budget_max);

-- Proposals indexes
CREATE INDEX idx_proposals_job ON proposals(job_id);
CREATE INDEX idx_proposals_freelancer ON proposals(freelancer_id);
CREATE INDEX idx_proposals_status ON proposals(status);

-- Escrow indexes
CREATE INDEX idx_escrow_job ON escrow_transactions(job_id);
CREATE INDEX idx_escrow_client ON escrow_transactions(client_id);
CREATE INDEX idx_escrow_freelancer ON escrow_transactions(freelancer_id);
CREATE INDEX idx_escrow_status ON escrow_transactions(status);

-- Messages indexes
CREATE INDEX idx_messages_job ON messages(job_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_unread ON messages(receiver_id, is_read);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate hustle score
CREATE OR REPLACE FUNCTION calculate_hustle_score(
    p_id_verified BOOLEAN,
    p_skill_tested BOOLEAN,
    p_jobs_completed INTEGER,
    p_disputes_count INTEGER,
    p_profile_complete BOOLEAN
)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
BEGIN
    -- Base score
    score := 10;
    
    -- ID Verification (+10)
    IF p_id_verified THEN
        score := score + 10;
    END IF;
    
    -- Profile completion (+5)
    IF p_profile_complete THEN
        score := score + 5;
    END IF;
    
    -- Skill testing (+15)
    IF p_skill_tested THEN
        score := score + 15;
    END IF;
    
    -- Jobs completed (+20 per job, max 40)
    score := score + LEAST(p_jobs_completed * 20, 40);
    
    -- Disputes penalty (-50 per dispute)
    score := score - (p_disputes_count * 50);
    
    -- Ensure score is within bounds
    score := GREATEST(0, LEAST(100, score));
    
    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Function to update job proposals count
CREATE OR REPLACE FUNCTION update_job_proposals_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE jobs SET proposals_count = proposals_count + 1 WHERE id = NEW.job_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE jobs SET proposals_count = proposals_count - 1 WHERE id = OLD.job_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_proposals_count_trigger
    AFTER INSERT OR DELETE ON proposals
    FOR EACH ROW EXECUTE FUNCTION update_job_proposals_count();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Jobs policies
CREATE POLICY "Open jobs are viewable by everyone" ON jobs
    FOR SELECT USING (status = 'Open' OR client_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Clients can create jobs" ON jobs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND (role = 'Client' OR role = 'Admin')
        )
    );

CREATE POLICY "Clients can update their own jobs" ON jobs
    FOR UPDATE USING (
        client_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Proposals policies
CREATE POLICY "Proposals viewable by job client and freelancer" ON proposals
    FOR SELECT USING (
        freelancer_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        ) OR
        job_id IN (
            SELECT id FROM jobs WHERE client_id IN (
                SELECT id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Freelancers can create proposals" ON proposals
    FOR INSERT WITH CHECK (
        freelancer_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Wallets policies
CREATE POLICY "Users can view their own wallet" ON wallets
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Messages policies
CREATE POLICY "Users can view their messages" ON messages
    FOR SELECT USING (
        sender_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        ) OR
        receiver_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (
        sender_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );
