-- Saved Jobs Table
-- Allows freelancers to bookmark jobs to apply later

CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- RLS Policies
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own saved jobs
CREATE POLICY "Users can view own saved jobs" ON saved_jobs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own saved jobs
CREATE POLICY "Users can insert own saved jobs" ON saved_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own saved jobs
CREATE POLICY "Users can delete own saved jobs" ON saved_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX idx_saved_jobs_job_id ON saved_jobs(job_id);
CREATE INDEX idx_saved_jobs_created_at ON saved_jobs(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_saved_jobs_updated_at
  BEFORE UPDATE ON saved_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_jobs_updated_at();
