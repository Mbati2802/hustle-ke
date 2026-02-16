-- ============================================================
-- 015: Organization Wallets + Invite Accept/Decline Flow
-- ============================================================

-- ─── Organization Wallets ───
CREATE TABLE IF NOT EXISTS organization_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0,
  pending_balance INTEGER DEFAULT 0,
  total_deposited INTEGER DEFAULT 0,
  total_withdrawn INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id)
);

CREATE INDEX IF NOT EXISTS idx_org_wallets_org ON organization_wallets(organization_id);

-- ─── Organization Wallet Transactions ───
CREATE TABLE IF NOT EXISTS organization_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES organization_wallets(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Deposit', 'Withdrawal', 'Escrow', 'Release', 'Refund', 'Fee')),
  status TEXT DEFAULT 'Completed' CHECK (status IN ('Pending', 'Completed', 'Failed')),
  performed_by UUID REFERENCES profiles(id),
  escrow_id UUID REFERENCES escrow_transactions(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  mpesa_receipt_number TEXT,
  mpesa_phone TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_wallet_tx_wallet ON organization_wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_org_wallet_tx_time ON organization_wallet_transactions(created_at DESC);

-- ─── Add invite status tracking to organization_invites ───
-- (status column already exists with pending/accepted/expired/cancelled)
-- Add a notification_sent flag so we know the user was notified
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_invites' AND column_name = 'notification_sent') THEN
    ALTER TABLE organization_invites ADD COLUMN notification_sent BOOLEAN DEFAULT false;
  END IF;
END$$;

-- ─── Add organization_id to escrow_transactions for org-paid escrows ───
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'escrow_transactions' AND column_name = 'organization_id') THEN
    ALTER TABLE escrow_transactions ADD COLUMN organization_id UUID REFERENCES organizations(id);
    CREATE INDEX idx_escrow_org ON escrow_transactions(organization_id);
  END IF;
END$$;

-- ─── Add organization_id to jobs for org-posted jobs ───
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'organization_id') THEN
    ALTER TABLE jobs ADD COLUMN organization_id UUID REFERENCES organizations(id);
    CREATE INDEX idx_jobs_org ON jobs(organization_id);
  END IF;
END$$;

-- ─── Add organization_id to messages for org-mode messaging ───
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'organization_id') THEN
    ALTER TABLE messages ADD COLUMN organization_id UUID REFERENCES organizations(id);
    CREATE INDEX idx_messages_org ON messages(organization_id);
  END IF;
END$$;

-- ─── Public read access to organizations (for job card org info) ───
-- Allow anyone (including anonymous/public) to see basic org info via job joins
DROP POLICY IF EXISTS "org_public_select" ON organizations;
CREATE POLICY "org_public_select" ON organizations FOR SELECT USING (
  is_active = true
);

-- ─── RLS for org wallets ───
ALTER TABLE organization_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent re-run)
DROP POLICY IF EXISTS "org_wallet_select" ON organization_wallets;
DROP POLICY IF EXISTS "org_wallet_insert" ON organization_wallets;
DROP POLICY IF EXISTS "org_wallet_update" ON organization_wallets;
DROP POLICY IF EXISTS "org_wallet_tx_select" ON organization_wallet_transactions;
DROP POLICY IF EXISTS "org_wallet_tx_insert" ON organization_wallet_transactions;
DROP POLICY IF EXISTS "admin_full_organization_wallets" ON organization_wallets;
DROP POLICY IF EXISTS "admin_full_organization_wallet_transactions" ON organization_wallet_transactions;

-- All org members can view the wallet balance
CREATE POLICY "org_wallet_select" ON organization_wallets FOR SELECT USING (
  organization_id IN (SELECT user_org_ids(my_profile_id()))
  OR organization_id IN (SELECT owned_org_ids(my_profile_id()))
);

-- Only owner/admin can insert (create wallet)
CREATE POLICY "org_wallet_insert" ON organization_wallets FOR INSERT WITH CHECK (
  organization_id IN (SELECT owned_org_ids(my_profile_id()))
  OR organization_id IN (SELECT user_admin_org_ids(my_profile_id()))
);

-- Only owner/admin can update (balance changes go through API with adminDb)
CREATE POLICY "org_wallet_update" ON organization_wallets FOR UPDATE USING (
  organization_id IN (SELECT owned_org_ids(my_profile_id()))
  OR organization_id IN (SELECT user_admin_org_ids(my_profile_id()))
);

-- All org members can view transactions
CREATE POLICY "org_wallet_tx_select" ON organization_wallet_transactions FOR SELECT USING (
  wallet_id IN (
    SELECT ow.id FROM organization_wallets ow
    WHERE ow.organization_id IN (SELECT user_org_ids(my_profile_id()))
       OR ow.organization_id IN (SELECT owned_org_ids(my_profile_id()))
  )
);

-- Transactions are inserted via adminDb (service role), but allow for owner/admin too
CREATE POLICY "org_wallet_tx_insert" ON organization_wallet_transactions FOR INSERT WITH CHECK (true);

-- Admin bypass for both tables
CREATE POLICY "admin_full_organization_wallets" ON organization_wallets FOR ALL USING (is_admin()) WITH CHECK (true);
CREATE POLICY "admin_full_organization_wallet_transactions" ON organization_wallet_transactions FOR ALL USING (is_admin()) WITH CHECK (true);
