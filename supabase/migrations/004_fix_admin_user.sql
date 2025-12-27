-- Migration to fix admin user role
-- This ensures winbro2.ej@gmail.com has admin role

-- Update profile to admin if user exists
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'winbro2.ej@gmail.com'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = profiles.id
    AND auth.users.email = 'winbro2.ej@gmail.com'
  );

-- Ensure customer record exists
INSERT INTO public.customers (user_id, name)
SELECT id, 'Edwin John'
FROM public.profiles
WHERE email = 'winbro2.ej@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET name = 'Edwin John';

-- Also update the ensure_admin_user_profile function to be more robust
CREATE OR REPLACE FUNCTION public.ensure_admin_user_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_user_id UUID;
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
        
        -- Ensure customer record exists with name
        INSERT INTO public.customers (user_id, name)
        VALUES (admin_user_id, 'Edwin John')
        ON CONFLICT (user_id) DO UPDATE SET name = 'Edwin John';
    END IF;
END;
$$;

