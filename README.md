# Dough Bake - Bakery E-commerce Platform

A modern bakery e-commerce platform built with Next.js, Supabase, and TailwindCSS.

## Features

- 🛒 Full e-commerce functionality (product catalog, cart, checkout)
- 🔐 Authentication with Supabase Auth (customer & admin roles)
- 💳 Pluggable payments — Stripe, Razorpay, PayU & PayTM, switchable from the admin dashboard
- 🧁 Product variants and multi-image galleries
- 💱 Multi-currency support with configurable exchange rates
- 🎨 Light/dark theme switching
- 👤 User profiles with usernames and profile pictures
- 📝 Editable site content & static pages (About, Contact, FAQ, Shipping)
- 📱 Responsive design with TailwindCSS
- 🔒 Row Level Security (RLS) for data protection
- 👨‍💼 Admin dashboard for product, order, currency and payment management

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: React 19
- **Styling**: TailwindCSS 4
- **Language**: TypeScript
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (product & profile images)
- **Payments**: Stripe, Razorpay, PayU, PayTM (provider abstraction in `lib/payment`)
- **Deployment**: Vercel

## Getting Started

> For a more detailed walkthrough, see [SETUP.md](./SETUP.md).

### Prerequisites

- Node.js 24 (see `.nvmrc`)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (manages its own local Docker containers)
- Docker (required by the Supabase CLI)
- npm

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

3. Start the local Supabase stack (this also applies the migrations in `supabase/migrations`):
   ```bash
   npm run supabase:start
   ```

   First start can take 1–2 minutes while images are pulled.

4. Grab your local Supabase credentials:
   ```bash
   npm run supabase:status
   # or the helper script:
   npm run supabase:credentials
   ```

5. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

   Fill in the Supabase URL and anon key printed by the command above. See
   [Environment Variables](#environment-variables) below.

6. Start the development server:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Local Supabase Services

`npm run supabase:start` runs the full Supabase stack via the CLI:

- **Supabase API**: http://localhost:54321
- **Supabase Studio** (database UI): http://localhost:54323
- **PostgreSQL**: localhost:54322 (direct connection)

> `docker-compose.yml` is kept only for reference — local development is driven
> by the Supabase CLI, not Docker Compose.

### Database Setup

Migrations live in `supabase/migrations/` and are applied automatically by
`npm run supabase:start` / `npm run supabase:reset`. The schema includes:

- `profiles` — user profiles with roles (customer/admin), usernames & avatars
- `customers` — extended customer information (required for checkout)
- `products` — product catalog
- `product_variants` — per-product variants and pricing
- `product_images` — product image galleries
- `orders` / `order_items` — order records and line items
- `site_settings` — global site configuration
- `content_items` — editable site content
- `job_queue` — background job records

All tables have Row Level Security (RLS) enabled.

### Creating an Admin User

The quickest way is the seed script:

```bash
npm run supabase:seed-admin
```

Or do it manually:

1. Sign up at `/auth/signup` (creates a customer user)
2. Open Supabase Studio at http://localhost:54323
3. Open the `profiles` table and change your user's `role` from `customer` to `admin`

## Project Structure

```
dough-bake/
├── app/                      # Next.js App Router
│   ├── about/                # Static content pages
│   ├── contact/
│   ├── faq/
│   ├── shipping/
│   ├── admin/                # Admin dashboard (protected) + orders
│   ├── auth/                 # Sign in / sign up
│   ├── api/                  # Route handlers (payment, currency, images, orders, profile)
│   ├── cart/                 # Shopping cart
│   ├── checkout/             # Checkout flow
│   ├── menu/                 # Product listing
│   ├── product/[id]/         # Product details
│   ├── profile/              # User profile + public profile pages
│   └── layout.tsx            # Root layout
├── components/               # React components (admin, ui, product, payment, nav, …)
├── lib/                      # Application logic
│   ├── actions/              # Server actions
│   ├── currency/             # Currency context & helpers
│   ├── payment/              # Payment provider abstraction & implementations
│   ├── theme/                # Theme context
│   ├── supabase/             # Supabase client utilities
│   ├── types/                # TypeScript types
│   └── utils/                # Shared utilities
├── supabase/                 # Supabase config & migrations
│   ├── migrations/
│   └── config.toml
├── scripts/                  # Setup, seed & migration helper scripts
├── proxy.ts                  # Next.js middleware (auth session + CORS)
└── docker-compose.yml        # Reference only (Supabase CLI manages containers)
```

## Routes

- `/` — Home page
- `/menu` — Browse all products
- `/product/[id]` — Product details
- `/cart` — Shopping cart
- `/checkout` — Checkout (requires customer account)
- `/profile` — Account / profile management
- `/profile/[username]` — Public profile page
- `/about`, `/contact`, `/faq`, `/shipping` — Static content pages
- `/admin` — Admin dashboard (requires admin role)
- `/admin/orders` — Order management

## Authentication Flow

1. Users can browse products without authentication
2. Users must sign up/login to add items to cart
3. Users must create a customer profile to complete checkout
4. Admin users have access to the `/admin` dashboard

## Payments

Payment providers are abstracted behind `lib/payment` (`PaymentProviderFactory`),
with implementations for Stripe, Razorpay, PayU and PayTM. The active provider
and its credentials are stored in the database (`payment_settings`) and managed
from the admin dashboard rather than via environment variables, so you can switch
gateways without redeploying.

Currently **Stripe** is the active provider — production uses live Stripe keys and
local development uses Stripe test keys, both configured through the admin dashboard.

## Environment Variables

The application reads the following variables (see `.env.local.example` and
`.env.production.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For production, point `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
at your hosted Supabase project and set `NEXT_PUBLIC_SITE_URL` to your deployed
URL. Payment gateway keys are configured through the admin dashboard.

## Development Commands

```bash
# Development
npm run dev            # Start dev server (Turbopack)
npm run build          # Build for production
npm start              # Start production server
npm run lint           # Run ESLint

# Local Supabase
npm run supabase:start     # Start the local Supabase stack
npm run supabase:stop      # Stop it
npm run supabase:status    # Show status & credentials
npm run supabase:reset     # Drop & recreate the DB with migrations
npm run supabase:credentials  # Print local credentials

# Admin & migrations
npm run supabase:seed-admin       # Seed a local admin user
npm run supabase:seed-admin:prod  # Seed an admin user in production
npm run migrate:prod              # Run migrations against production
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full guide. In short:

1. Push your code to GitHub
2. Import the project into Vercel
3. Create a Supabase project and run the migrations from `supabase/migrations/`
4. Set the environment variables in the Vercel dashboard
5. Deploy

## Further Documentation

- [SETUP.md](./SETUP.md) — local setup and troubleshooting
- [DEPLOYMENT.md](./DEPLOYMENT.md) — production deployment
- [DELIVERY_SETUP.md](./DELIVERY_SETUP.md) — delivery integration (Borzo/Porter) setup
- [DB_OPTIMIZATION.md](./DB_OPTIMIZATION.md) — database performance notes
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) — project overview

## License

MIT
