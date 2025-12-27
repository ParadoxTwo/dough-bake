-- Fix RLS policies for profiles table
-- Add INSERT policy so users can create their own profile if it doesn't exist

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- This policy allows users to create their own profile if the trigger didn't fire
-- or if the profile was somehow deleted

