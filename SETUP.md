# Setup Guide for Dough Bake

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Supabase CLI (if not already installed)

```bash
# macOS
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase
```

### 3. Start Local Supabase

```bash
npm run supabase:start
```

This will start all Supabase services locally in Docker containers. Wait for it to complete (about 1-2 minutes on first run).

### 4. Get Local Supabase Credentials

After starting Supabase, get your local credentials:

```bash
npm run supabase:status
```

This will show you:

- **API URL**: `http://localhost:54321`
- **anon key**: (a JWT token)
- **service_role key**: (a JWT token)

### 5. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Local Supabase (Development)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key-from-status

# Production Supabase (Optional - for production builds)
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key

# Razorpay (Optional - for payment testing)
NEXT_PUBLIC_RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

**Quick way to get credentials:**

```bash
# Get just the API URL and anon key
supabase status | grep -E "(API URL|anon key)" | head -2
```

### 6. Run Database Migrations

The migration file is already in `supabase/migrations/001_initial_schema.sql`. Supabase CLI will automatically run migrations when you start it, or you can run them manually:

```bash
# Reset and apply all migrations
npm run supabase:reset

# Or apply migrations manually
supabase db reset
```

### 7. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Available Services

When Supabase is running locally, you have access to:

- **Next.js App**: http://localhost:3000
- **Supabase API**: http://localhost:54321
- **Supabase Studio** (Database UI): http://localhost:54323
- **PostgreSQL**: localhost:54322 (direct connection)

## Creating an Admin User

1. Sign up for an account at http://localhost:3000/auth/signup
2. Open Supabase Studio at http://localhost:54323
3. Navigate to Authentication > Users to find your user ID
4. Go to Table Editor > profiles
5. Find your profile and change the `role` from `customer` to `admin`
6. Refresh the app - you should now see the "Admin" link in the navbar

## Testing the Flow

### Customer Flow:

1. Browse products at `/menu`
2. Click on a product to view details
3. Add products to cart
4. Sign up/Sign in
5. Go to checkout
6. Fill in customer information
7. Place order

### Admin Flow:

1. Sign in as admin user
2. Go to `/admin`
3. View dashboard with stats
4. See products and recent orders

## Supabase CLI Commands

```bash
# Start Supabase (starts all services)
npm run supabase:start

# Stop Supabase (stops all services)
npm run supabase:stop

# Check status and get credentials
npm run supabase:status

# Reset database (drops and recreates with migrations)
npm run supabase:reset

# View logs
supabase logs

# Access database directly
supabase db psql
```

## Database Schema

The database includes the following tables:

- `profiles` - User profiles with roles (customer/admin)
- `customers` - Extended customer information (address, phone, etc.)
- `products` - Product catalog
- `orders` - Order records
- `order_items` - Order line items

All tables have Row Level Security (RLS) enabled for data protection.

## Sample Data

The migration includes 6 sample products to get you started:

- Sourdough Bread
- Croissant
- Chocolate Chip Cookie
- Baguette
- Blueberry Muffin
- Cinnamon Roll

## Troubleshooting

### Supabase Services Not Starting

If services fail to start:

```bash
# Check Docker is running
docker ps

# Stop and restart Supabase
npm run supabase:stop
npm run supabase:start

# Check logs for errors
supabase logs
```

### Port Conflicts

If you get port conflicts, you can modify ports in `supabase/config.toml`:

```toml
[api]
port = 54321  # Change if needed

[studio]
port = 54323  # Change if needed
```

### Database Connection Issues

1. Make sure Supabase is running: `npm run supabase:status`
2. Verify your `.env.local` has the correct URL and keys
3. Check that migrations ran successfully in Supabase Studio

### Authentication Issues

1. Check that the database migration ran successfully
2. Verify the `profiles` table exists and has the trigger
3. Check browser console for errors
4. Verify your Supabase URL and keys are correct in `.env.local`

## Production Deployment

For production:

1. Create a Supabase project at https://app.supabase.com
2. Run the migration in your Supabase project SQL Editor
3. Set environment variables in your deployment platform (Vercel, etc.):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
   ```

## Switching Between Local and Production

You can easily switch between local and production by updating `.env.local`:

**Local Development:**

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
```

**Production:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard>
```
