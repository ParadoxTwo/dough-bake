# Dough Bake - Bakery E-commerce Platform

A modern bakery e-commerce platform built with Next.js, Supabase, and TailwindCSS.

## Features

- 🛒 Full e-commerce functionality (product listing, cart, checkout)
- 🔐 Authentication with Supabase Auth (customer & admin roles)
- 💳 Payment integration with Razorpay
- 📱 Responsive design with TailwindCSS
- 🐳 Local development with Docker
- 🔒 Row Level Security (RLS) for data protection
- 👨‍💼 Admin dashboard for product and order management

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Payment**: Razorpay
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dough-bake
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Razorpay credentials (Supabase credentials are pre-configured for local development).

4. Start the local Supabase instance:
```bash
docker-compose up -d
```

Wait for all services to start (this may take a minute).

5. Run the database migrations:
```bash
# Access the Postgres container
docker exec -it dough-bake-db psql -U postgres

# In the psql prompt, run:
\i /path/to/supabase/migrations/001_initial_schema.sql
```

Alternatively, you can use Supabase Studio at http://localhost:54323 to run the migration SQL.

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Services

The `docker-compose.yml` sets up a full Supabase stack locally:

- **PostgreSQL**: Port 54322
- **Supabase API**: Port 54321
- **Supabase Studio**: Port 54323 (Database management UI)
- **Supabase Auth**: Port 54324

### Database Setup

The database schema includes:

- `profiles` - User profiles with roles (customer/admin)
- `customers` - Extended customer information (required for checkout)
- `products` - Product catalog
- `orders` - Order records
- `order_items` - Order line items

### Creating an Admin User

1. Sign up normally at `/auth/signup` (creates a customer user)
2. Access Supabase Studio at http://localhost:54323
3. Navigate to the `profiles` table
4. Update your user's `role` from `customer` to `admin`

## Project Structure

```
dough-bake/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth group routes
│   ├── admin/             # Admin dashboard (protected)
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout flow
│   ├── menu/              # Product listing
│   ├── product/           # Product details
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── Navbar.tsx        # Navigation bar
│   └── Footer.tsx        # Footer
├── lib/                   # Utility libraries
│   ├── supabase/         # Supabase client utilities
│   └── types/            # TypeScript types
├── supabase/             # Supabase configuration
│   ├── migrations/       # Database migrations
│   └── kong.yml          # API gateway config
├── docker-compose.yml    # Docker configuration
└── middleware.ts         # Next.js middleware (auth)
```

## Routes

- `/` - Home page
- `/menu` - Browse all products
- `/product/[id]` - Product details
- `/cart` - Shopping cart
- `/checkout` - Checkout (requires customer account)
- `/admin` - Admin dashboard (requires admin role)

## Authentication Flow

1. Users can browse products without authentication
2. Users must sign up/login to add items to cart
3. Users must create a customer profile to complete checkout
4. Admin users have access to the `/admin` dashboard

## Environment Variables

### Local Development

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key>
NEXT_PUBLIC_RAZORPAY_KEY_ID=<your-razorpay-key>
RAZORPAY_KEY_SECRET=<your-razorpay-secret>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production (Vercel)

```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
NEXT_PUBLIC_RAZORPAY_KEY_ID=<your-razorpay-key>
RAZORPAY_KEY_SECRET=<your-razorpay-secret>
NEXT_PUBLIC_APP_URL=<your-vercel-url>
```

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import project to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Supabase Production Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migration SQL from `supabase/migrations/001_initial_schema.sql` in the SQL Editor
3. Update environment variables with production credentials

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Start Docker services
docker-compose up -d

# Stop Docker services
docker-compose down

# View Docker logs
docker-compose logs -f
```

## License

MIT
