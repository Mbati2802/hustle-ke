-- Security Alerts System
-- Track login devices and security events for alerting

-- Create login_history table
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_fingerprint TEXT,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}'::jsonb,
  location TEXT,
  is_new_device BOOLEAN DEFAULT false,
  alert_sent BOOLEAN DEFAULT false,
  login_successful BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security_events table
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'new_device', 'password_change', 'email_change', 'suspicious_login'
  event_data JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  alert_sent BOOLEAN DEFAULT false,
  alert_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_profile_id ON login_history(profile_id);
CREATE INDEX idx_login_history_device_fingerprint ON login_history(device_fingerprint);
CREATE INDEX idx_login_history_created_at ON login_history(created_at);
CREATE INDEX idx_login_history_is_new_device ON login_history(is_new_device);

CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_profile_id ON security_events(profile_id);
CREATE INDEX idx_security_events_event_type ON security_events(event_type);
CREATE INDEX idx_security_events_created_at ON security_events(created_at);
CREATE INDEX idx_security_events_alert_sent ON security_events(alert_sent);

-- RLS policies for login_history
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own login history"
  ON login_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert login history"
  ON login_history
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all login history"
  ON login_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- RLS policies for security_events
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own security events"
  ON security_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert security events"
  ON security_events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all security events"
  ON security_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Function to check if device is new
CREATE OR REPLACE FUNCTION is_new_device(user_uuid UUID, device_fp TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM login_history
    WHERE user_id = user_uuid
    AND device_fingerprint = device_fp
    AND created_at > NOW() - INTERVAL '90 days'
  );
END;
$$;

-- Function to clean up old login history (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_login_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM login_history
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Comments
COMMENT ON TABLE login_history IS 'Tracks user login attempts and device information for security monitoring';
COMMENT ON TABLE security_events IS 'Records security-related events for alerting and audit trail';
