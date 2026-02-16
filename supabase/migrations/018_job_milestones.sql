-- Job Milestones/Phases Table
-- Allows breaking jobs into milestones with partial escrow releases

CREATE TABLE IF NOT EXISTS job_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Paid')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  UNIQUE(job_id, order_index)
);

-- RLS Policies
ALTER TABLE job_milestones ENABLE ROW LEVEL SECURITY;

-- Users can view milestones for jobs they're involved in
CREATE POLICY "Users can view job milestones" ON job_milestones
  FOR SELECT USING (
    auth.uid() IN (
      SELECT client_id FROM jobs WHERE id = job_id
      UNION
      SELECT freelancer_id FROM proposals WHERE job_id = job_milestones.job_id AND status = 'Accepted'
      UNION
      SELECT user_id FROM organization_members WHERE organization_id = (SELECT organization_id FROM jobs WHERE id = job_milestones.job_id)
    )
  );

-- Clients can manage milestones for their jobs
CREATE POLICY "Clients can manage job milestones" ON job_milestones
  FOR ALL USING (
    auth.uid() IN (
      SELECT client_id FROM jobs WHERE id = job_id
      UNION
      SELECT user_id FROM organization_members WHERE organization_id = (SELECT organization_id FROM jobs WHERE id = job_milestones.job_id)
    )
  );

-- Freelancers can update milestone status (mark as completed)
CREATE POLICY "Freelancers can update milestone status" ON job_milestones
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT freelancer_id FROM proposals WHERE job_id = job_milestones.job_id AND status = 'Accepted'
    )
  );

-- Indexes for performance
CREATE INDEX idx_job_milestones_job_id ON job_milestones(job_id);
CREATE INDEX idx_job_milestones_status ON job_milestones(status);
CREATE INDEX idx_job_milestones_due_date ON job_milestones(due_date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_job_milestones_updated_at
  BEFORE UPDATE ON job_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_job_milestones_updated_at();

-- Add milestones_enabled flag to jobs table
ALTER TABLE jobs ADD COLUMN milestones_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN total_milestones INTEGER DEFAULT 0;

-- Update jobs table to track milestone completion
CREATE OR REPLACE FUNCTION update_job_milestone_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE jobs 
    SET 
      total_milestones = (
        SELECT COUNT(*) FROM job_milestones WHERE job_id = NEW.job_id
      ),
      updated_at = NOW()
    WHERE id = NEW.job_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update job milestone progress
CREATE TRIGGER update_job_milestone_progress_trigger
  AFTER INSERT OR UPDATE OR DELETE ON job_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_job_milestone_progress();
