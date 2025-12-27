-- This migration creates the products storage bucket
-- Note: Storage buckets are typically created via Supabase Dashboard or CLI
-- This SQL file documents the required bucket configuration

-- The bucket should be named 'products' and set to public
-- You can create it using:
-- 1. Supabase Dashboard: Storage > Create Bucket > Name: 'products', Public: true
-- 2. Supabase CLI: supabase storage create products --public

-- Storage policies for the products bucket
-- These policies allow public read access and admin write access

-- Allow public read access
CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'products');

-- Allow authenticated admins to upload images
CREATE POLICY "Admins can upload product images" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'products' AND
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow authenticated admins to update images
CREATE POLICY "Admins can update product images" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'products' AND
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow authenticated admins to delete images
CREATE POLICY "Admins can delete product images" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'products' AND
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

