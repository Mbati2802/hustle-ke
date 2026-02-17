-- MFA/TOTP (Two-Factor Authentication) System
-- Store TOTP secrets and backup codes for users

-- Create mfa_settings table
CREATE TABLE IF NOT EXISTS mfa_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  totp_secret TEXT NOT NULL, -- Encrypted TOTP secret
  is_enabled BOOLEAN DEFAULT false,
  backup_codes TEXT[], -- Array of hashed backup codes
  backup_codes_used INTEGER DEFAULT 0,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mfa_verification_log table
CREATE TABLE IF NOT EXISTS mfa_verification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verification_method TEXT NOT NULL, -- 'totp' or 'backup_code'
  success BOOLEAN DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_mfa_settings_user_id ON mfa_settings(user_id);
CREATE INDEX idx_mfa_settings_profile_id ON mfa_settings(profile_id);
CREATE INDEX idx_mfa_settings_is_enabled ON mfa_settings(is_enabled);

CREATE INDEX idx_mfa_verification_log_user_id ON mfa_verification_log(user_id);
CREATE INDEX idx_mfa_verification_log_profile_id ON mfa_verification_log(profile_id);
CREATE INDEX idx_mfa_verification_log_created_at ON mfa_verification_log(created_at);

-- RLS policies for mfa_settings
ALTER TABLE mfa_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own MFA settings"
  ON mfa_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own MFA settings"
  ON mfa_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_id
      AND profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own MFA settings"
  ON mfa_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own MFA settings"
  ON mfa_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all MFA settings"
  ON mfa_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- RLS policies for mfa_verification_log
ALTER TABLE mfa_verification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own MFA verification log"
  ON mfa_verification_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert MFA verification log"
  ON mfa_verification_log
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all MFA verification logs"
  ON mfa_verification_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Function to clean up old verification logs (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_mfa_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM mfa_verification_log
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Comments
COMMENT ON TABLE mfa_settings IS 'Stores TOTP secrets and backup codes for two-factor authentication';
COMMENT ON TABLE mfa_verification_log IS 'Logs MFA verification attempts for security monitoring';
