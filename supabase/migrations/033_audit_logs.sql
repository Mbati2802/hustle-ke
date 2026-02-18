-- Migration 033: Audit Logs Table
-- Comprehensive audit logging for compliance and security monitoring

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id UUID,
  amount DECIMAL(12, 2),
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success) WHERE success = false;

-- Index for high-value transactions
CREATE INDEX IF NOT EXISTS idx_audit_logs_high_value ON audit_logs(amount DESC) WHERE amount > 10000;

-- RLS Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Only service role can insert audit logs (via RPC functions)
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Prevent updates and deletes (audit logs are immutable)
CREATE POLICY "Audit logs are immutable"
  ON audit_logs
  FOR UPDATE
  USING (false);

CREATE POLICY "Audit logs cannot be deleted"
  ON audit_logs
  FOR DELETE
  USING (false);

-- Partitioning for performance (optional, for high-volume systems)
-- Partition by month for easier archival
-- CREATE TABLE audit_logs_2026_02 PARTITION OF audit_logs
--   FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Auto-cleanup function (keep logs for 7 years for compliance)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM audit_logs
  WHERE timestamp < NOW() - INTERVAL '7 years';
END;
$$;

-- Grant permissions
GRANT SELECT ON audit_logs TO authenticated;
GRANT INSERT ON audit_logs TO service_role;

-- Comments
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all critical operations (PCI DSS Requirement 10)';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (e.g., wallet_withdraw, escrow_release)';
COMMENT ON COLUMN audit_logs.resource IS 'Type of resource affected (e.g., wallet, escrow, profile)';
COMMENT ON COLUMN audit_logs.amount IS 'Transaction amount in KES (for financial operations)';
COMMENT ON COLUMN audit_logs.success IS 'Whether the operation succeeded';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context (e.g., transaction details, error context)';
