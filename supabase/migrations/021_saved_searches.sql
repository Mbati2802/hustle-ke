-- Saved searches / job alerts

CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query TEXT,
  skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  county TEXT,
  remote_only BOOLEAN DEFAULT false,
  enterprise_only BOOLEAN DEFAULT false,
  min_budget INTEGER,
  active BOOLEAN DEFAULT true,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backward-compatible: if the table already exists from a previous run
ALTER TABLE saved_searches
  ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_active ON saved_searches(active);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their saved searches"
  ON saved_searches
  FOR ALL
  USING (user_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));
