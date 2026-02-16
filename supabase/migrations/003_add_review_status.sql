-- Add 'Review' to job_status enum so freelancers can submit work for client review
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'Review' AFTER 'In-Progress';

-- Add submission_details JSONB column to jobs for storing structured work submissions
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS submission_details JSONB;

-- Create storage bucket for work submission files
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to submissions bucket
CREATE POLICY "Authenticated users can upload submissions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'submissions');

-- Allow users to read their own submissions (sender or receiver)
CREATE POLICY "Users can read submissions they are involved in"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'submissions');
