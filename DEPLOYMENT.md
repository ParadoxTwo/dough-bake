# Deployment Guide

## Production Admin User Setup

The admin user is automatically created in local development via migration `003_seed_admin_user.sql`. However, **in production, you need to create the admin user manually** because Supabase production has security restrictions that prevent direct inserts into `auth.users`.

### Option 1: Using the Production Script (Recommended)

**From your local machine or CI/CD:**

```bash
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
node scripts/seed-admin-user-production.js
```

Or use the npm script:

```bash
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
npm run supabase:seed-admin:prod
```

**Custom credentials (optional):**

```bash
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
ADMIN_EMAIL=your-email@example.com \
ADMIN_PASSWORD=YourSecurePassword123! \
ADMIN_NAME="Your Name" \
node scripts/seed-admin-user-production.js
```

**Getting your credentials:**

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **API**
3. Copy the **Project URL** (for `SUPABASE_URL`)
4. Copy the **service_role** key (for `SUPABASE_SERVICE_ROLE_KEY`) - ⚠️ Keep this secret!

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

## Database Migrations

**Important**: Vercel does NOT automatically run database migrations. You must run them manually or set up CI/CD.

### Option 1: Manual Migration via Supabase Dashboard (Quickest)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. For each migration file in `supabase/migrations/` (in order):
   - Click **"New Query"**
   - Copy the contents of the migration file
   - Paste into the SQL Editor
   - Click **"Run"**
   - Verify the migration succeeded

**Migration files to apply (in order):**

- `001_initial_schema.sql`
- `002_site_settings.sql`
- `003_seed_admin_user.sql` (skip in production - use admin user script instead)
- `004_fix_admin_user.sql`
- `005_content_items.sql`
- `006_fix_profiles_rls.sql`
- `007_fix_circular_rls.sql`
- `008_product_variants_and_images.sql`
- `009_create_products_bucket.sql`
- `010_currency_settings.sql`

### Option 2: Using Supabase CLI (Recommended for CI/CD)

**Prerequisites:**

- Supabase CLI installed: `npm install -g supabase`
- Supabase Access Token (get from https://supabase.com/dashboard/account/tokens)
- Your project reference ID (found in project settings)

**Link your project:**

```bash
supabase link --project-ref <your-project-ref-id>
```

**Push migrations:**

```bash
supabase db push
```

**Or use the migration script:**

```bash
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
./scripts/run-migrations-production.sh
```

### Option 3: GitHub Actions (Automated)

A GitHub Actions workflow is included at `.github/workflows/deploy-migrations.yml` that automatically runs migrations when:

- Code is pushed to `main` branch
- Migration files are changed
- Manually triggered via GitHub Actions UI

**Setup:**

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Add the following secrets:

   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key
   - `SUPABASE_ACCESS_TOKEN`: Your Supabase access token (from dashboard)
   - `SUPABASE_PROJECT_ID`: Your project reference ID

4. The workflow will automatically run on pushes to main

### Option 4: Vercel Build Command (Not Recommended)

You can add migrations to your Vercel build, but this is not recommended because:

- Requires Supabase CLI in build environment
- Slower builds
- Harder to debug failures
- Migrations should run once, not on every build

If you still want to do this, add to `package.json`:

```json
{
  "scripts": {
    "vercel-build": "npm run build && npm run migrate:prod"
  }
}
```

## Theme Settings

Theme settings are stored in the `site_settings` table and will be automatically created by migration `002_site_settings.sql`. The default theme is `dough-bake` with logo filter enabled.

Admins can change the theme from the `/admin` dashboard, and it will apply globally to all users.
