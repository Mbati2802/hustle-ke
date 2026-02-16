-- Add progress tracking columns to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS work_progress INTEGER DEFAULT 0 CHECK (work_progress >= 0 AND work_progress <= 100);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS revision_progress INTEGER DEFAULT 0 CHECK (revision_progress >= 0 AND revision_progress <= 100);

-- Add completed_at timestamp (used when client approves work)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
