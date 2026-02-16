-- Add 'Subscription' to transaction_type enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'Subscription'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_type')
  ) THEN
    ALTER TYPE transaction_type ADD VALUE 'Subscription';
  END IF;
END$$;

-- Promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_percent INTEGER NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_amount INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  applicable_plan TEXT DEFAULT 'pro' CHECK (applicable_plan IN ('pro', 'enterprise', 'all')),
  max_uses INTEGER DEFAULT NULL, -- NULL = unlimited
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);

-- RLS for promo_codes
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active promo codes (to validate)
CREATE POLICY "Authenticated users can validate promo codes" ON promo_codes
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = TRUE);

-- Admin full access
CREATE POLICY "Admin full access to promo_codes" ON promo_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Add promo_code_id to subscriptions
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS discount_applied INTEGER DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS original_price INTEGER DEFAULT 0;

-- Fix RLS on subscriptions: user_id references profiles(id), 
-- but we store profile.id which may differ from auth.uid().
-- Use adminDb (service role) for all subscription ops, so RLS is bypassed.
-- But fix the policy for safety:
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Seed some promo codes
INSERT INTO promo_codes (code, description, discount_percent, discount_amount, applicable_plan, max_uses)
VALUES
  ('HUSTLEKE50', '50% off first month of Pro', 50, 0, 'pro', 100),
  ('WELCOME100', 'KES 100 off Pro plan', 0, 100, 'pro', 50),
  ('EARLYBIRD', 'Early adopter - free first month', 100, 0, 'pro', 20),
  ('REFER2025', 'Referral discount 30% off', 30, 0, 'pro', NULL)
ON CONFLICT (code) DO NOTHING;
