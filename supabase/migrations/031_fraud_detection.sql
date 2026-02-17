-- Fraud Detection System
-- Monitor transactions and detect suspicious activity

-- Create fraud_alerts table
CREATE TABLE IF NOT EXISTS fraud_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'suspicious_transaction', 'velocity_check', 'amount_anomaly', 'pattern_match', 'manual_review'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  description TEXT NOT NULL,
  related_transaction_id UUID,
  related_data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending', -- 'pending', 'investigating', 'resolved', 'false_positive'
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transaction_risk_scores table
CREATE TABLE IF NOT EXISTS transaction_risk_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL,
  transaction_type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'escrow', 'release'
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  risk_score INTEGER NOT NULL, -- 0-100 (0=safe, 100=very risky)
  risk_factors JSONB DEFAULT '{}'::jsonb,
  flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_behavior_patterns table
CREATE TABLE IF NOT EXISTS user_behavior_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  avg_transaction_amount DECIMAL(10, 2) DEFAULT 0,
  max_transaction_amount DECIMAL(10, 2) DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  avg_daily_transactions DECIMAL(5, 2) DEFAULT 0,
  typical_transaction_hours INTEGER[], -- Array of hours (0-23)
  typical_transaction_days INTEGER[], -- Array of days (0-6, 0=Sunday)
  last_transaction_at TIMESTAMP WITH TIME ZONE,
  account_age_days INTEGER DEFAULT 0,
  trust_score INTEGER DEFAULT 50, -- 0-100 (higher = more trusted)
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_fraud_alerts_user_id ON fraud_alerts(user_id);
CREATE INDEX idx_fraud_alerts_profile_id ON fraud_alerts(profile_id);
CREATE INDEX idx_fraud_alerts_alert_type ON fraud_alerts(alert_type);
CREATE INDEX idx_fraud_alerts_severity ON fraud_alerts(severity);
CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_created_at ON fraud_alerts(created_at);

CREATE INDEX idx_transaction_risk_scores_transaction_id ON transaction_risk_scores(transaction_id);
CREATE INDEX idx_transaction_risk_scores_user_id ON transaction_risk_scores(user_id);
CREATE INDEX idx_transaction_risk_scores_profile_id ON transaction_risk_scores(profile_id);
CREATE INDEX idx_transaction_risk_scores_risk_score ON transaction_risk_scores(risk_score);
CREATE INDEX idx_transaction_risk_scores_flagged ON transaction_risk_scores(flagged);
CREATE INDEX idx_transaction_risk_scores_created_at ON transaction_risk_scores(created_at);

CREATE INDEX idx_user_behavior_patterns_user_id ON user_behavior_patterns(user_id);
CREATE INDEX idx_user_behavior_patterns_profile_id ON user_behavior_patterns(profile_id);
CREATE INDEX idx_user_behavior_patterns_trust_score ON user_behavior_patterns(trust_score);

-- RLS policies for fraud_alerts
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fraud alerts"
  ON fraud_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert fraud alerts"
  ON fraud_alerts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all fraud alerts"
  ON fraud_alerts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- RLS policies for transaction_risk_scores
ALTER TABLE transaction_risk_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own risk scores"
  ON transaction_risk_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert risk scores"
  ON transaction_risk_scores
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all risk scores"
  ON transaction_risk_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- RLS policies for user_behavior_patterns
ALTER TABLE user_behavior_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own behavior patterns"
  ON user_behavior_patterns
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage behavior patterns"
  ON user_behavior_patterns
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view all behavior patterns"
  ON user_behavior_patterns
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Function to update user behavior patterns
CREATE OR REPLACE FUNCTION update_user_behavior_pattern(
  p_user_id UUID,
  p_profile_id UUID,
  p_transaction_amount DECIMAL,
  p_transaction_hour INTEGER,
  p_transaction_day INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pattern RECORD;
BEGIN
  -- Get or create pattern
  SELECT * INTO v_pattern
  FROM user_behavior_patterns
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    -- Create new pattern
    INSERT INTO user_behavior_patterns (
      user_id,
      profile_id,
      avg_transaction_amount,
      max_transaction_amount,
      transaction_count,
      typical_transaction_hours,
      typical_transaction_days,
      last_transaction_at,
      account_age_days
    ) VALUES (
      p_user_id,
      p_profile_id,
      p_transaction_amount,
      p_transaction_amount,
      1,
      ARRAY[p_transaction_hour],
      ARRAY[p_transaction_day],
      NOW(),
      0
    );
  ELSE
    -- Update existing pattern
    UPDATE user_behavior_patterns
    SET
      avg_transaction_amount = (avg_transaction_amount * transaction_count + p_transaction_amount) / (transaction_count + 1),
      max_transaction_amount = GREATEST(max_transaction_amount, p_transaction_amount),
      transaction_count = transaction_count + 1,
      typical_transaction_hours = array_append(typical_transaction_hours, p_transaction_hour),
      typical_transaction_days = array_append(typical_transaction_days, p_transaction_day),
      last_transaction_at = NOW(),
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- Function to get fraud statistics
CREATE OR REPLACE FUNCTION get_fraud_statistics(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  total_alerts BIGINT,
  pending_alerts BIGINT,
  high_severity_alerts BIGINT,
  resolved_alerts BIGINT,
  false_positives BIGINT,
  avg_risk_score DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::BIGINT FROM fraud_alerts WHERE created_at > NOW() - (days_back || ' days')::INTERVAL) as total_alerts,
    (SELECT COUNT(*)::BIGINT FROM fraud_alerts WHERE status = 'pending' AND created_at > NOW() - (days_back || ' days')::INTERVAL) as pending_alerts,
    (SELECT COUNT(*)::BIGINT FROM fraud_alerts WHERE severity IN ('high', 'critical') AND created_at > NOW() - (days_back || ' days')::INTERVAL) as high_severity_alerts,
    (SELECT COUNT(*)::BIGINT FROM fraud_alerts WHERE status = 'resolved' AND created_at > NOW() - (days_back || ' days')::INTERVAL) as resolved_alerts,
    (SELECT COUNT(*)::BIGINT FROM fraud_alerts WHERE status = 'false_positive' AND created_at > NOW() - (days_back || ' days')::INTERVAL) as false_positives,
    (SELECT COALESCE(AVG(risk_score), 0)::DECIMAL FROM transaction_risk_scores WHERE created_at > NOW() - (days_back || ' days')::INTERVAL) as avg_risk_score;
END;
$$;

-- Comments
COMMENT ON TABLE fraud_alerts IS 'Tracks fraud alerts and suspicious activity for investigation';
COMMENT ON TABLE transaction_risk_scores IS 'Risk scores for individual transactions';
COMMENT ON TABLE user_behavior_patterns IS 'User behavior patterns for anomaly detection';
