-- AI chat memory (minimal): store conversations for analytics and continuity

CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  channel TEXT DEFAULT 'live_chat',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'bot')),
  content TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user ON ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session ON ai_chat_messages(session_id, created_at);

ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can manage their own sessions
CREATE POLICY "Users manage their ai chat sessions"
  ON ai_chat_sessions FOR ALL
  USING (user_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users manage their ai chat messages"
  ON ai_chat_messages FOR ALL
  USING (session_id IN (SELECT id FROM ai_chat_sessions WHERE user_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())))
  WITH CHECK (session_id IN (SELECT id FROM ai_chat_sessions WHERE user_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid())));
