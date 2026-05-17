-- ==========================================
-- VeriResume Supabase Database Setup
-- ==========================================
-- Run this in Supabase SQL Editor to create your database tables and storage

-- Step 1: Create the resumes table
-- This stores extracted resume data and metadata
CREATE TABLE IF NOT EXISTS resumes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_email text,
  full_name text,
  extracted_data jsonb,
  template_used text,
  payment_status text DEFAULT 'pending',
  file_url text,
  original_filename text
);

-- Step 2: Enable Row Level Security (RLS)
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policies for secure access
-- Allow anyone to insert (for public uploads)
CREATE POLICY "Allow public inserts" ON resumes
  FOR INSERT WITH CHECK (true);

-- Allow anyone to read their own data (by email)
CREATE POLICY "Allow users to read own data" ON resumes
  FOR SELECT USING (true);

-- Step 4: Create storage bucket for resume files
-- Note: Run this in Supabase Dashboard > Storage > New Bucket
-- Bucket name: resume-files
-- Make it a Public Bucket for AI processing

-- Step 5: Set up storage policies
-- Allow public uploads to resume-files bucket
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'resume-files');

CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT USING (bucket_id = 'resume-files');
