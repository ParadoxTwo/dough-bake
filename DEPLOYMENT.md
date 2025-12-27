# Deployment Guide

## Production Admin User Setup

The admin user is automatically created in local development via migration `003_seed_admin_user.sql`. However, **in production, you need to create the admin user manually** because Supabase production has security restrictions that prevent direct inserts into `auth.users`.

### Option 1: Using the Production Script (Recommended)

Run the production seed script with your production credentials:

```bash
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
npm run supabase:seed-admin:prod
```

Or use the Node.js version:

```bash
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
node scripts/seed-admin-user-production.js
```

### Option 2: Manual Creation via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Users**
3. Click **"Add User"** or **"Invite User"**
4. Enter:
   - Email: `winbro2.ej@gmail.com`
   - Password: `Winbro2@admin`
   - Check "Auto Confirm User"
5. Click **"Create User"**
6. Go to **SQL Editor** and run:

```sql
-- Update profile to admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'winbro2.ej@gmail.com';

-- Create customer record
INSERT INTO public.customers (user_id, name)
SELECT id, 'Edwin John'
FROM public.profiles
WHERE email = 'winbro2.ej@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET name = 'Edwin John';
```

### Option 3: Using Supabase CLI (if connected to production)

```bash
supabase db execute "
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'winbro2.ej@gmail.com';

INSERT INTO public.customers (user_id, name)
SELECT id, 'Edwin John'
FROM public.profiles
WHERE email = 'winbro2.ej@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET name = 'Edwin John';
"
```

## Admin User Credentials

- **Email**: `winbro2.ej@gmail.com`
- **Password**: `Winbro2@admin`
- **Name**: `Edwin John`
- **Role**: `admin`

## Theme Settings

Theme settings are stored in the `site_settings` table and will be automatically created by migration `002_site_settings.sql`. The default theme is `dough-bake` with logo filter enabled.

Admins can change the theme from the `/admin` dashboard, and it will apply globally to all users.

