-- Virus Scanning System
-- Track file uploads and scan results for security

-- Create file_uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT,
  upload_type TEXT NOT NULL, -- 'avatar', 'portfolio', 'job_attachment', 'message_attachment'
  related_id UUID, -- ID of related entity (job, message, etc.)
  scan_status TEXT DEFAULT 'pending', -- 'pending', 'scanning', 'clean', 'infected', 'error'
  scan_result JSONB DEFAULT '{}'::jsonb,
  scanned_at TIMESTAMP WITH TIME ZONE,
  quarantined BOOLEAN DEFAULT false,
  quarantined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create virus_scan_log table
CREATE TABLE IF NOT EXISTS virus_scan_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_upload_id UUID NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
  scanner_name TEXT NOT NULL, -- 'clamav', 'virustotal', 'manual'
  scan_result TEXT NOT NULL, -- 'clean', 'infected', 'suspicious', 'error'
  threat_name TEXT,
  threat_details JSONB DEFAULT '{}'::jsonb,
  scan_duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX idx_file_uploads_profile_id ON file_uploads(profile_id);
CREATE INDEX idx_file_uploads_scan_status ON file_uploads(scan_status);
CREATE INDEX idx_file_uploads_upload_type ON file_uploads(upload_type);
CREATE INDEX idx_file_uploads_quarantined ON file_uploads(quarantined);
CREATE INDEX idx_file_uploads_created_at ON file_uploads(created_at);

CREATE INDEX idx_virus_scan_log_file_upload_id ON virus_scan_log(file_upload_id);
CREATE INDEX idx_virus_scan_log_scan_result ON virus_scan_log(scan_result);
CREATE INDEX idx_virus_scan_log_created_at ON virus_scan_log(created_at);

-- RLS policies for file_uploads
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own file uploads"
  ON file_uploads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert file uploads"
  ON file_uploads
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update file uploads"
  ON file_uploads
  FOR UPDATE
  USING (true);

CREATE POLICY "Admins can view all file uploads"
  ON file_uploads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- RLS policies for virus_scan_log
ALTER TABLE virus_scan_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scan logs"
  ON virus_scan_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM file_uploads
      JOIN profiles ON profiles.id = file_uploads.profile_id
      WHERE file_uploads.id = file_upload_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert scan logs"
  ON virus_scan_log
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all scan logs"
  ON virus_scan_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Function to clean up old scan logs (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_scan_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM virus_scan_log
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Function to get scan statistics
CREATE OR REPLACE FUNCTION get_scan_statistics(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  total_scans BIGINT,
  clean_files BIGINT,
  infected_files BIGINT,
  quarantined_files BIGINT,
  pending_scans BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_scans,
    COUNT(*) FILTER (WHERE scan_status = 'clean')::BIGINT as clean_files,
    COUNT(*) FILTER (WHERE scan_status = 'infected')::BIGINT as infected_files,
    COUNT(*) FILTER (WHERE quarantined = true)::BIGINT as quarantined_files,
    COUNT(*) FILTER (WHERE scan_status = 'pending')::BIGINT as pending_scans
  FROM file_uploads
  WHERE created_at > NOW() - (days_back || ' days')::INTERVAL;
END;
$$;

-- Comments
COMMENT ON TABLE file_uploads IS 'Tracks all file uploads and their virus scan status';
COMMENT ON TABLE virus_scan_log IS 'Detailed log of virus scan results for audit trail';
