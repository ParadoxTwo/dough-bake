-- Fix circular dependency in profiles RLS policies
-- The "Admins can view all profiles" policy causes a circular dependency
-- because it queries the profiles table to check if user is admin

-- Drop the problematic admin policy that causes circular dependency
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a helper function to check admin status without circular dependency
-- This function uses SECURITY DEFINER to bypass RLS when checking admin status
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role = 'admin'
    );
END;
$$;

-- Now create a proper admin policy that uses the function
-- This avoids circular dependency because the function uses SECURITY DEFINER
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND public.is_admin(auth.uid())
    );

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

