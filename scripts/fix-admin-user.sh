#!/bin/bash

# Script to fix admin user role directly via SQL
# This is a simpler alternative that directly updates the database

echo "🔐 Fixing Admin User Role"
echo "========================"
echo ""

# Check if Supabase is running
if ! supabase status > /dev/null 2>&1; then
    echo "❌ Supabase is not running. Start it with: npm run supabase:start"
    exit 1
fi

echo "📧 Updating admin user: winbro2.ej@gmail.com"
echo ""

# Run the SQL directly
supabase db execute "
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'winbro2.ej@gmail.com'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = profiles.id
    AND auth.users.email = 'winbro2.ej@gmail.com'
  );

INSERT INTO public.customers (user_id, name)
SELECT id, 'Edwin John'
FROM public.profiles
WHERE email = 'winbro2.ej@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET name = 'Edwin John';
"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Admin user role updated successfully!"
    echo ""
    echo "📋 Verify by logging in with:"
    echo "   Email: winbro2.ej@gmail.com"
    echo "   Password: Winbro2@admin"
else
    echo ""
    echo "❌ Failed to update admin user role"
    exit 1
fi

