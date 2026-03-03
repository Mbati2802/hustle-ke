-- Migration 037: Feature completion
-- Adds: message attachments, rate_limits table, auto-escrow columns, push subscriptions

-- 1. Message attachments storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('attachments', 'attachments', true, 10485760, -- 10MB
  ARRAY['image/jpeg','image/png','image/gif','image/webp','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/zip','text/plain','text/csv']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for attachments
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "Anyone can view attachments"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'attachments');

CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 2. Message attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments in their messages" ON message_attachments
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM messages WHERE sender_id = auth.uid() OR receiver_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert attachments for their messages" ON message_attachments
  FOR INSERT WITH CHECK (
    message_id IN (
      SELECT id FROM messages WHERE sender_id = auth.uid()
    )
  );

CREATE INDEX idx_message_attachments_message_id ON message_attachments(message_id);

-- 3. Rate limits table (persistent, DB-backed)
CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY, -- composite key: "action:identifier"
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_ms INTEGER NOT NULL,
  max_requests INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-cleanup old rate limit entries (older than 1 hour)
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);

-- 4. Auto-escrow release tracking
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS auto_release_at TIMESTAMPTZ;
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS auto_release_notified BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_escrow_auto_release ON escrow_transactions(auto_release_at) WHERE status = 'Held' AND auto_release_at IS NOT NULL;

-- 5. Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscriptions" ON push_subscriptions
  FOR ALL USING (user_id = auth.uid());

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);

-- 6. Email verification tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- 7. Admin RLS bypass for new tables
CREATE POLICY "Admin bypass message_attachments" ON message_attachments
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'Admin')
  );

CREATE POLICY "Admin bypass push_subscriptions" ON push_subscriptions
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'Admin')
  );

-- 8. Financial reporting view (for admin dashboard)
CREATE OR REPLACE VIEW admin_financial_summary AS
SELECT
  date_trunc('month', et.initiated_at) AS month,
  COUNT(*) AS total_transactions,
  SUM(et.amount) AS total_volume,
  SUM(et.service_fee) AS total_fees,
  SUM(CASE WHEN et.status = 'Released' THEN et.amount ELSE 0 END) AS released_volume,
  SUM(CASE WHEN et.status = 'Refunded' THEN et.amount ELSE 0 END) AS refunded_volume,
  SUM(CASE WHEN et.status = 'Held' THEN et.amount ELSE 0 END) AS held_volume,
  COUNT(DISTINCT et.client_id) AS unique_clients,
  COUNT(DISTINCT et.freelancer_id) AS unique_freelancers
FROM escrow_transactions et
GROUP BY date_trunc('month', et.initiated_at)
ORDER BY month DESC;
