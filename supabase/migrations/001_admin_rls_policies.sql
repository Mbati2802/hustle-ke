-- Admin bypass policies for all tables
-- Admins can read/write everything

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

-- Profiles: admin full access
CREATE POLICY "Admins can do anything with profiles" ON profiles
  USING (is_admin()) WITH CHECK (is_admin());

-- Jobs: admin full access
CREATE POLICY "Admins can do anything with jobs" ON jobs
  USING (is_admin()) WITH CHECK (is_admin());

-- Proposals: admin full access
CREATE POLICY "Admins can do anything with proposals" ON proposals
  USING (is_admin()) WITH CHECK (is_admin());

-- Escrow: admin full access
CREATE POLICY "Admins can do anything with escrow" ON escrow_transactions
  USING (is_admin()) WITH CHECK (is_admin());

-- Wallets: admin read access
CREATE POLICY "Admins can view all wallets" ON wallets
  FOR SELECT USING (is_admin());

-- Wallet transactions: admin read access
CREATE POLICY "Admins can view all wallet transactions" ON wallet_transactions
  FOR SELECT USING (is_admin());

-- Messages: admin read access
CREATE POLICY "Admins can view all messages" ON messages
  FOR SELECT USING (is_admin());

-- Disputes: admin full access
CREATE POLICY "Admins can do anything with disputes" ON disputes
  USING (is_admin()) WITH CHECK (is_admin());

-- Reviews: admin full access
CREATE POLICY "Admins can do anything with reviews" ON reviews
  USING (is_admin()) WITH CHECK (is_admin());

-- Hustle score log: admin read
CREATE POLICY "Admins can view all score logs" ON hustle_score_log
  FOR SELECT USING (is_admin());

-- Missing policies for wallet_transactions
CREATE POLICY "Users can view their own wallet transactions" ON wallet_transactions
  FOR SELECT USING (
    wallet_id IN (
      SELECT w.id FROM wallets w
      JOIN profiles p ON w.user_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Missing policy: escrow parties can view their escrows
CREATE POLICY "Escrow parties can view their transactions" ON escrow_transactions
  FOR SELECT USING (
    client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR freelancer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Missing policy: reviews are publicly readable
CREATE POLICY "Public reviews are viewable by everyone" ON reviews
  FOR SELECT USING (is_public = true);

-- Missing policy: users can create reviews for jobs they participated in
CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (
    reviewer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Disputes: parties can view their own
CREATE POLICY "Dispute parties can view their disputes" ON disputes
  FOR SELECT USING (
    initiator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR respondent_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Disputes: users can create
CREATE POLICY "Users can create disputes" ON disputes
  FOR INSERT WITH CHECK (
    initiator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Hustle score log: users can view their own
ALTER TABLE hustle_score_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own score log" ON hustle_score_log
  FOR SELECT USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );
