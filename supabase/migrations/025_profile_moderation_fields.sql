-- Add moderation fields to profiles table for admin bulk actions

-- Ban fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES profiles(id);

-- Soft delete fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS delete_reason TEXT;

-- Verification fields (if not already present)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned) WHERE is_banned = true;
CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted ON profiles(is_deleted) WHERE is_deleted = true;
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);

-- Add comments
COMMENT ON COLUMN profiles.is_banned IS 'Whether the user is banned from the platform';
COMMENT ON COLUMN profiles.ban_reason IS 'Reason for ban (admin-provided)';
COMMENT ON COLUMN profiles.banned_at IS 'Timestamp when user was banned';
COMMENT ON COLUMN profiles.banned_by IS 'Admin who banned the user';
COMMENT ON COLUMN profiles.is_deleted IS 'Soft delete flag (keeps data for audit)';
COMMENT ON COLUMN profiles.deleted_at IS 'Timestamp when user was deleted';
COMMENT ON COLUMN profiles.deleted_by IS 'Admin who deleted the user';
COMMENT ON COLUMN profiles.delete_reason IS 'Reason for deletion (admin-provided)';
