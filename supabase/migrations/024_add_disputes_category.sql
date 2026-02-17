-- Add category column to disputes table for support disputes
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS category TEXT;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_disputes_category ON disputes(category);

-- Add comment
COMMENT ON COLUMN disputes.category IS 'Dispute category: Support, Job, Payment, etc.';
