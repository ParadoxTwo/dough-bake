-- Function to ensure admin user profile and customer record exist
-- NOTE: The actual user should be created via the seed-admin-user.sh script
-- This function only ensures the profile and customer records are correct
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
        ON CONFLICT (id) DO UPDATE SET role = 'admin';
        
        -- Ensure customer record exists with name
        INSERT INTO public.customers (user_id, name)
        VALUES (admin_user_id, 'Edwin John')
        ON CONFLICT (user_id) DO UPDATE SET name = 'Edwin John';
    END IF;
END;
$$;

-- Note: User creation should be done via seed-admin-user.sh script
-- This ensures proper creation through Supabase Auth API
-- Run: npm run supabase:seed-admin

