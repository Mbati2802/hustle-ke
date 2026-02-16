-- Support tickets + messages (for Live Chat human handoff)

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  sub_category TEXT DEFAULT 'general',
  urgency TEXT DEFAULT 'low' CHECK (urgency IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Pending', 'Resolved', 'Closed')),
  assigned_admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_last_message ON support_tickets(last_message_at DESC);

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin', 'system')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id, created_at);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Users can create their own tickets
CREATE POLICY "Users can create their own support tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM profiles WHERE profiles.user_id = auth.uid()
    )
  );

-- Users can read their own tickets
CREATE POLICY "Users can read their own support tickets"
  ON support_tickets FOR SELECT
  USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Users can update their own tickets (limited by app logic)
CREATE POLICY "Users can update their own support tickets"
  ON support_tickets FOR UPDATE
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Admin full access to tickets
CREATE POLICY "Admins can manage support tickets"
  ON support_tickets FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'Admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'Admin')
  );

-- Users can insert/read messages for their tickets
CREATE POLICY "Users can read messages for their tickets"
  ON support_messages FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM support_tickets
      WHERE user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages to their tickets"
  ON support_messages FOR INSERT
  WITH CHECK (
    sender_type = 'user'
    AND ticket_id IN (
      SELECT id FROM support_tickets
      WHERE user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Admin full access to messages
CREATE POLICY "Admins can manage support messages"
  ON support_messages FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'Admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'Admin')
  );
