-- Add username column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Function to generate a base username from a name
-- Converts "Edwin John" -> "edwinjohn"
CREATE OR REPLACE FUNCTION public.generate_base_username(name_text TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Convert to lowercase, remove spaces and special characters, keep only alphanumeric
    RETURN LOWER(REGEXP_REPLACE(name_text, '[^a-zA-Z0-9]', '', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate a unique username
-- Tries base username, then base + 2, base + 3, etc. until unique
CREATE OR REPLACE FUNCTION public.generate_unique_username(name_text TEXT)
RETURNS TEXT AS $$
DECLARE
    base_username TEXT;
    candidate_username TEXT;
    counter INTEGER := 0;
BEGIN
    -- Generate base username
    base_username := public.generate_base_username(name_text);
    
    -- If base username is empty (e.g., only special characters), use a fallback
    IF base_username = '' OR base_username IS NULL THEN
        base_username := 'user';
    END IF;
    
    -- Try base username first
    candidate_username := base_username;
    
    -- Loop until we find a unique username
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate_username) LOOP
        counter := counter + 1;
        candidate_username := base_username || counter::TEXT;
    END LOOP;
    
    RETURN candidate_username;
END;
$$ LANGUAGE plpgsql;

-- Update handle_new_user function to generate username from user_metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
    generated_username TEXT;
BEGIN
    -- Get name from user_metadata (raw_user_meta_data)
    -- Try 'name' first, then 'full_name', then fallback to email prefix
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        SPLIT_PART(NEW.email, '@', 1)
    );
    
    -- Generate unique username
    generated_username := public.generate_unique_username(user_name);
    
    -- Insert profile with generated username
    INSERT INTO public.profiles (id, email, role, username)
    VALUES (NEW.id, NEW.email, 'customer', generated_username);
    
    -- If name exists in metadata, also create customer record
    IF user_name IS NOT NULL AND user_name != SPLIT_PART(NEW.email, '@', 1) THEN
        INSERT INTO public.customers (user_id, name)
        VALUES (NEW.id, user_name)
        ON CONFLICT (user_id) DO UPDATE SET name = user_name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill existing profiles with usernames based on customer names or email
-- This handles existing users who don't have usernames yet
DO $$
DECLARE
    profile_record RECORD;
    user_name TEXT;
    generated_username TEXT;
BEGIN
    FOR profile_record IN 
        SELECT p.id, p.email, c.name
        FROM public.profiles p
        LEFT JOIN public.customers c ON c.user_id = p.id
        WHERE p.username IS NULL
    LOOP
        -- Use customer name if available, otherwise use email prefix
        user_name := COALESCE(profile_record.name, SPLIT_PART(profile_record.email, '@', 1));
        
        -- Generate unique username
        generated_username := public.generate_unique_username(user_name);
        
        -- Update profile with username
        UPDATE public.profiles
        SET username = generated_username
        WHERE id = profile_record.id;
    END LOOP;
END $$;

-- Update ensure_admin_user_profile function to also generate username if missing
CREATE OR REPLACE FUNCTION public.ensure_admin_user_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_user_id UUID;
    admin_name TEXT := 'Edwin John';
    current_username TEXT;
    generated_username TEXT;
BEGIN
    -- Find user by email
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'winbro2.ej@gmail.com';
    
    IF admin_user_id IS NOT NULL THEN
        -- Ensure profile exists with admin role
        INSERT INTO public.profiles (id, email, role)
        VALUES (admin_user_id, 'winbro2.ej@gmail.com', 'admin')
        ON CONFLICT (id) DO UPDATE SET role = 'admin', email = 'winbro2.ej@gmail.com';
        
        -- Generate username if it doesn't exist
        SELECT username INTO current_username
        FROM public.profiles
        WHERE id = admin_user_id;
        
        IF current_username IS NULL THEN
            generated_username := public.generate_unique_username(admin_name);
            UPDATE public.profiles
            SET username = generated_username
            WHERE id = admin_user_id;
        END IF;
        
        -- Ensure customer record exists with name
        INSERT INTO public.customers (user_id, name)
        VALUES (admin_user_id, admin_name)
        ON CONFLICT (user_id) DO UPDATE SET name = admin_name;
    END IF;
END;
$$;

