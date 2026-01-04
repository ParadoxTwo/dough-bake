-- Add profile_picture_url column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Create profiles storage bucket (note: bucket creation via SQL is limited)
-- The bucket should be created via Supabase Dashboard or CLI:
-- supabase storage create profiles --public

-- Storage policies for the profiles bucket
-- Allow users to view their own profile picture and all public profile pictures
CREATE POLICY "Users can view profile pictures" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'profiles');

-- Allow users to upload their own profile picture
CREATE POLICY "Users can upload their own profile picture" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'profiles' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = (
      SELECT username FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Allow users to update their own profile picture
CREATE POLICY "Users can update their own profile picture" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'profiles' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = (
      SELECT username FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Allow users to delete their own profile picture
CREATE POLICY "Users can delete their own profile picture" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'profiles' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = (
      SELECT username FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Allow admins to manage all profile pictures
CREATE POLICY "Admins can manage all profile pictures" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'profiles' AND
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

