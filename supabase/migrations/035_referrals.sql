-- Referral system
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL UNIQUE,
  referred_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'converted', 'rewarded')),
  reward_amount NUMERIC(12,2) DEFAULT 0,
  reward_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  converted_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ
);

-- Each user gets one unique referral code
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_referrer_code ON referrals(referrer_id, referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);

-- RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (referrer_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (referrer_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admin full access referrals"
  ON referrals FOR ALL
  USING ((SELECT role FROM profiles WHERE user_id = auth.uid()) = 'Admin');

-- Add referral_code column to profiles if not exists
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Add referred_by column to profiles if not exists
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);
EXCEPTION WHEN others THEN NULL;
END $$;
