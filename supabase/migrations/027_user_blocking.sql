-- User Blocking System
-- Allow users to block other users to prevent harassment

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- Indexes for performance
CREATE INDEX idx_blocked_users_blocker_id ON blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked_id ON blocked_users(blocked_id);
CREATE INDEX idx_blocked_users_created_at ON blocked_users(created_at);

-- RLS policies
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own blocks (who they blocked)
CREATE POLICY "Users can view own blocks"
  ON blocked_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = blocker_id
      AND profiles.user_id = auth.uid()
    )
  );

-- Users can create blocks
CREATE POLICY "Users can block others"
  ON blocked_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = blocker_id
      AND profiles.user_id = auth.uid()
    )
  );

-- Users can unblock (delete their blocks)
CREATE POLICY "Users can unblock"
  ON blocked_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = blocker_id
      AND profiles.user_id = auth.uid()
    )
  );

-- Admins can view all blocks
CREATE POLICY "Admins can view all blocks"
  ON blocked_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Admins can delete any block
CREATE POLICY "Admins can delete any block"
  ON blocked_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Helper function to check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(blocker_profile_id UUID, blocked_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users
    WHERE blocker_id = blocker_profile_id
    AND blocked_id = blocked_profile_id
  );
END;
$$;

-- Add comment
COMMENT ON TABLE blocked_users IS 'Tracks blocked users to prevent harassment and unwanted interactions';
