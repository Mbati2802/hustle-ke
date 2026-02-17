-- Support ticket enhancements: assignments, notifications, resolution feedback

-- Add assigned_to column to support_tickets (if not exists)
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS satisfaction_rating VARCHAR(10) CHECK (satisfaction_rating IN ('satisfied', 'unsatisfied', NULL)),
ADD COLUMN IF NOT EXISTS satisfaction_comment TEXT,
ADD COLUMN IF NOT EXISTS agent_review_rating INTEGER CHECK (agent_review_rating >= 1 AND agent_review_rating <= 5),
ADD COLUMN IF NOT EXISTS agent_review_comment TEXT,
ADD COLUMN IF NOT EXISTS related_dispute_id UUID REFERENCES disputes(id) ON DELETE SET NULL;

-- Create support_assignments table for notification tracking
CREATE TABLE IF NOT EXISTS support_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ,
  notification_shown_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ticket_id, assigned_to)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_resolved_by ON support_tickets(resolved_by);
CREATE INDEX IF NOT EXISTS idx_support_assignments_assigned_to ON support_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_assignments_viewed_at ON support_assignments(viewed_at);
CREATE INDEX IF NOT EXISTS idx_support_assignments_ticket_id ON support_assignments(ticket_id);

-- RLS policies for support_assignments
ALTER TABLE support_assignments ENABLE ROW LEVEL SECURITY;

-- Admins can view all assignments
CREATE POLICY "Admins can view all assignments"
  ON support_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Assigned users can view their own assignments
CREATE POLICY "Users can view their assignments"
  ON support_assignments FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid());

-- Admins can create assignments
CREATE POLICY "Admins can create assignments"
  ON support_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Admins and assigned users can update assignments (for marking as viewed)
CREATE POLICY "Admins and assigned users can update assignments"
  ON support_assignments FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Create function to get unread assignment count for a user
CREATE OR REPLACE FUNCTION get_unread_assignments_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM support_assignments
    WHERE assigned_to = user_id
    AND viewed_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark assignment as viewed
CREATE OR REPLACE FUNCTION mark_assignment_viewed(assignment_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE support_assignments
  SET viewed_at = NOW()
  WHERE id = assignment_id
  AND assigned_to = auth.uid()
  AND viewed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
