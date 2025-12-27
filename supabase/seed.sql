-- Seed data for testing
-- Note: Run this after the initial migration

-- Ensure admin user profile exists (user should be created via seed-admin-user.sh script)
-- Run: npm run supabase:seed-admin after migrations
SELECT public.ensure_admin_user_profile();

-- Additional sample products
INSERT INTO public.products (name, description, price, category, available) VALUES
    ('Whole Wheat Bread', 'Hearty whole wheat bread', 7.99, 'Bread', true),
    ('Danish Pastry', 'Sweet Danish pastry with fruit filling', 4.25, 'Pastry', true),
    ('Macaron Box', 'Box of 6 assorted French macarons', 12.99, 'Cookies', true),
    ('Apple Pie', 'Classic homemade apple pie', 18.99, 'Pies', true),
    ('Banana Bread', 'Moist banana bread loaf', 6.99, 'Bread', true)
ON CONFLICT DO NOTHING;

