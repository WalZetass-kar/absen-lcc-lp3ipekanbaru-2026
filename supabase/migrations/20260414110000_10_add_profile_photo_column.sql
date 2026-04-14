-- Migration: Add profile_photo_url column to profiles table
-- Description: Menambahkan kolom untuk menyimpan URL foto profil admin
-- Date: 2026-04-14

-- Add profile_photo_url column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'profile_photo_url'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN profile_photo_url TEXT;
  END IF;
END $$;

-- Create storage bucket for profile photos if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for profile-photos bucket
-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload their own profile photo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own photos
CREATE POLICY "Users can update their own profile photo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own photos
CREATE POLICY "Users can delete their own profile photo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to profile photos
CREATE POLICY "Profile photos are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- Add comment
COMMENT ON COLUMN public.profiles.profile_photo_url IS 'URL foto profil admin yang disimpan di Supabase Storage';
