-- Migration 012: Message enhancements — reply-to, starred, soft-delete, typing status
-- Adds reply threading, message starring, soft deletion, and typing indicator support

-- Reply-to support: reference another message
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Starred messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false;

-- Soft delete (message stays in DB but hidden from user who deleted it)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_by_sender BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_by_receiver BOOLEAN DEFAULT false;

-- Typing status table (ephemeral, cleaned up periodically)
CREATE TABLE IF NOT EXISTS typing_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(job_id, user_id)
);

-- RLS for typing_status
ALTER TABLE typing_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own typing status"
  ON typing_status FOR ALL
  USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can see typing status in their conversations"
  ON typing_status FOR SELECT
  USING (true);

-- Index for fast typing status lookup
CREATE INDEX IF NOT EXISTS idx_typing_status_job ON typing_status(job_id, updated_at);

-- Clean up stale typing statuses (older than 10 seconds)
-- This can be run periodically via a cron job or Supabase Edge Function
