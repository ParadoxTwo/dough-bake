# CLAUDE.md — Dough Bake Codebase Guide

This file provides AI assistants with the context needed to work effectively in the Dough Bake repository.

---

## Project Overview

**Dough Bake** is a bakery e-commerce platform built on Next.js 15 (App Router) with Supabase as the backend. It includes authentication, a shopping cart, checkout, an admin dashboard, multi-currency support, and a lightweight CMS.

- **Node version**: 24 (see `.nvmrc`)
- **Package manager**: npm
- **Deployment target**: Vercel + Supabase Cloud

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | TailwindCSS 4 + PostCSS |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (email/password, PKCE) |
| Payments | Stripe (integrated), Razorpay (configured) |
| Storage | Supabase Storage Buckets |
| Hosting | Vercel |
| Local DB | Docker + Supabase CLI |
| Build | Next.js with Turbopack |
| Linting | ESLint 9 with Next.js TypeScript config |

---

## Repository Structure

```
/
├── app/                        # Next.js App Router pages & API routes
│   ├── (routes)/               # Public-facing pages
│   │   ├── page.tsx            # Home page
│   │   ├── menu/               # Product listing by category
│   │   ├── product/[id]/       # Dynamic product detail
│   │   ├── cart/               # Shopping cart
│   │   ├── checkout/           # Checkout flow
│   │   ├── about/              # Static informational pages
│   │   ├── contact/
│   │   ├── faq/
│   │   ├── shipping/
│   │   └── profile/            # Authenticated user profile
│   ├── auth/
│   │   ├── signin/
│   │   └── signup/
│   ├── admin/                  # Protected admin dashboard
│   ├── api/                    # Next.js API routes
│   │   ├── currency/
│   │   ├── orders/
│   │   ├── payment/
│   │   ├── products/
│   │   ├── profile/
│   │   └── images/
│   ├── layout.tsx              # Root layout — wraps everything in providers
│   └── globals.css             # Global TailwindCSS + CSS variables
│
├── components/                 # Shared React components
│   ├── Navbar.tsx              # Auth-aware responsive navigation
│   ├── Footer.tsx
│   ├── Logo.tsx
│   ├── ThemeSwitcher.tsx
│   ├── NavigationTracker.tsx
│   ├── admin/                  # Admin-only UI
│   ├── auth/                   # Sign-in / sign-up forms
│   ├── layout/
│   ├── menu/                   # Product grid, category filters
│   ├── nav/
│   ├── payment/
│   ├── product/                # Product cards, detail views
│   ├── profile/
│   └── ui/                     # Generic reusable primitives
│
├── lib/                        # All shared logic, hooks, and configs
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   ├── server.ts           # Server-side Supabase client (uses cookies)
│   │   └── middleware.ts       # Auth helpers for middleware.ts
│   ├── actions/                # Next.js Server Actions ('use server')
│   │   ├── product.ts
│   │   ├── payment.ts
│   │   ├── user.ts
│   │   ├── theme.ts
│   │   └── currency.ts
│   ├── types/
│   │   ├── database.types.ts   # Auto-generated from Supabase schema
│   │   ├── payment.ts
│   │   ├── order.ts
│   │   └── variant.ts
│   ├── theme/
│   │   ├── context.tsx         # ThemeContext provider
│   │   └── types.ts
│   ├── currency/
│   │   ├── context.tsx         # CurrencyContext provider
│   │   ├── utils.ts
│   │   └── types.ts
│   ├── payment/
│   │   ├── stripe/             # Stripe helpers
│   │   └── razorpay/           # Razorpay helpers (not yet wired to UI)
│   ├── utils/
│   │   ├── cart.ts             # localStorage cart logic
│   │   ├── products.ts
│   │   ├── images.ts
│   │   ├── storage.ts
│   │   ├── slug.ts
│   │   ├── navigation.ts
│   │   ├── query-optimization.ts
│   │   ├── order-search.ts
│   │   └── stripe-url.ts
│   └── content.ts              # CMS content fetching with 5-min in-memory cache
│
├── supabase/
│   ├── migrations/             # 14 numbered SQL migration files
│   └── kong.yml                # API gateway config
│
├── scripts/                    # Shell/JS scripts for DB setup and seeding
├── .github/workflows/          # GitHub Actions CI/CD
│   └── deploy-migrations.yml   # Runs migrations on push to main/staging
├── middleware.ts               # Next.js edge middleware (auth guards)
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── postcss.config.mjs
```

---

## Development Workflow

### Initial Setup

```bash
npm install
npm run supabase:start        # Starts local Supabase stack via Docker
```

Copy the environment template and populate it with local credentials:

```bash
cp .env.local.example .env.local
# Fill in values from: npm run supabase:status
```

```bash
npm run dev                   # Starts Next.js with Turbopack on :3000
```

Local Supabase services:

| Service | URL |
|---|---|
| API | http://localhost:54321 |
| Studio | http://localhost:54323 |
| PostgreSQL | localhost:54322 |
| Auth | http://localhost:54324 |

### Common npm Scripts

```bash
npm run dev                       # Dev server (Turbopack)
npm run build                     # Production build (Turbopack)
npm run start                     # Serve production build
npm run lint                      # ESLint check
npm run supabase:start            # Start local Supabase
npm run supabase:stop             # Stop local Supabase
npm run supabase:status           # Print credentials and status
npm run supabase:reset            # Wipe and re-run all migrations
npm run supabase:seed-admin       # Create local admin user
npm run supabase:seed-admin:prod  # Create production admin user
npm run migrate:prod              # Run migrations against production DB
```

### Creating an Admin User

After starting local Supabase:

1. Sign up through the app at `/auth/signup`
2. In Supabase Studio → Table Editor → `profiles` table, set `role` to `admin`

Or run: `npm run supabase:seed-admin`

---

## Environment Variables

| Variable | Context | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Public anon key for browser client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Service role key — never expose client-side |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Client | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | Server only | Razorpay secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client | Stripe public key |
| `STRIPE_SECRET_KEY` | Server only | Stripe secret |
| `NEXT_PUBLIC_APP_URL` | Both | Base URL of the app |

---

## Architecture & Key Conventions

### Server vs. Client Components

- **Server components** (default in App Router): fetch data, render HTML. No `'use client'` directive.
- **Client components**: marked with `'use client'` at top. Used for interactivity, browser APIs, and context consumers.
- **Server Actions**: in `lib/actions/`, always marked with `'use server'`. Used for mutations from forms or client components.

### Supabase Client Usage

| File | When to use |
|---|---|
| `lib/supabase/client.ts` | Inside `'use client'` components |
| `lib/supabase/server.ts` | Server components, API routes, Server Actions |

Never import `lib/supabase/server.ts` from a client component. It uses `cookies()` from `next/headers` which is server-only.

### State Management

Global state is handled with React Context, not a third-party store:

- **Theme**: `lib/theme/context.tsx` — provides active theme, toggling function
- **Currency**: `lib/currency/context.tsx` — provides active currency and formatting helpers

Both contexts are initialized in `app/layout.tsx` using server-loaded values so there is no client-side flash.

### Cart

The cart is stored in `localStorage` (`lib/utils/cart.ts`). It is **not** persisted to the database. Cart operations happen entirely on the client.

### Content (CMS)

`lib/content.ts` fetches editable text content from the `content_items` table. It keeps an in-memory cache with a 5-minute TTL. If the database is unreachable, it falls back to hardcoded default content gracefully.

### Routing & Middleware

`middleware.ts` at the root runs on every request. It:
- Refreshes the Supabase session
- Redirects unauthenticated users away from protected routes (`/admin/*`, `/profile/*`)
- Redirects authenticated users away from auth pages (`/auth/*`)

### Database Migrations

All schema changes go in `supabase/migrations/` as numbered SQL files (`NNN_description.sql`). Always add a new migration file — never edit existing ones.

Run migrations locally: `npm run supabase:reset` (destructive) or apply individual files via Supabase Studio.

Run migrations in production: `npm run migrate:prod` or via the GitHub Actions workflow.

---

## Database Schema

### Key Tables

| Table | Purpose |
|---|---|
| `profiles` | One row per auth user. Fields: `id`, `email`, `username`, `profile_picture_url`, `role` (`customer`\|`admin`) |
| `customers` | Extended address info linked to a profile via `user_id` |
| `products` | Catalog. Fields include `name`, `price`, `category`, `slug`, `available`, `stock_type`, `stock_quantity` |
| `product_variants` | Size/option variants per product with their own price and stock |
| `product_images` | Multiple ordered images per product |
| `orders` | Orders with `payment_status` and `order_status` |
| `order_items` | Line items: `product_id`, `variant_id`, `quantity`, `price` |
| `content_items` | CMS key/value store for editable site text |
| `site_settings` | Generic key/value site configuration |
| `currency_settings` | Multi-currency mode (`fixed`\|`dynamic`) and exchange rates |
| `payment_settings` | Payment gateway configuration |

### Security

- **Row Level Security (RLS)** is enabled on all tables.
- Customers can only read/write their own rows.
- Admins have broader access enforced via `role` checks in RLS policies.
- The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — use it only in server-side code for admin operations.

---

## API Routes

All under `app/api/`:

| Route | Purpose |
|---|---|
| `/api/currency/` | Read and update currency settings |
| `/api/orders/` | CRUD for orders, status updates |
| `/api/payment/` | Payment session creation and webhooks |
| `/api/products/` | Product CRUD |
| `/api/profile/` | Read and update user profiles |
| `/api/images/` | Upload and manage product images |

---

## Styling Conventions

- **TailwindCSS utility classes** are the primary styling mechanism.
- **CSS custom properties** (variables) drive the theming system. Theme values are written to `:root` at runtime.
- Use **inline styles only** for values that must be truly dynamic (e.g., computed hex colours from the theme).
- Follow a **mobile-first** approach: base styles target mobile, use `md:` and `lg:` breakpoints to scale up.
- There is no third-party component library. Custom UI primitives live in `components/ui/`.

---

## TypeScript Conventions

- `lib/types/database.types.ts` is auto-generated from Supabase. **Do not edit it manually.** Regenerate with:
  ```bash
  npx supabase gen types typescript --local > lib/types/database.types.ts
  ```
- Domain-specific types (`payment.ts`, `order.ts`, `variant.ts`) live alongside the generated file.
- Prefer explicit return types on Server Actions and API route handlers.

---

## CI/CD

**`.github/workflows/deploy-migrations.yml`** triggers on pushes to `main` or `staging` when files in `supabase/migrations/` change. It runs pending migrations against the target environment using the Supabase CLI and credentials stored in GitHub Secrets.

Deployment to Vercel is handled automatically by Vercel's GitHub integration on push to `main`.

---

## What Is Not Yet Implemented

The following features are architecturally prepared but not fully wired up:

- **Payment UI**: Stripe and Razorpay server logic exists; the checkout form does not yet call the payment API to complete a transaction.
- **Admin product CRUD**: The admin UI shows products and orders but lacks forms for creating/editing products or uploading images.
- **Email notifications**: No transactional email system is connected.
- **Social auth**: Only email/password is configured in Supabase Auth.
- **Persistent cart**: Cart lives in `localStorage`; no DB-backed cart exists.
- **Customer-facing order history**: Orders are visible in the admin dashboard but not on the customer's profile page.

---

## Key Files to Read First

When exploring unfamiliar parts of the codebase, start here:

1. `app/layout.tsx` — providers, theming, session setup
2. `middleware.ts` — auth guards and session refresh
3. `lib/supabase/server.ts` and `lib/supabase/client.ts` — how Supabase is instantiated
4. `lib/content.ts` — CMS pattern with caching and fallbacks
5. `supabase/migrations/001_initial_schema.sql` — the core DB schema
6. `lib/utils/cart.ts` — cart state management
7. `lib/theme/context.tsx` and `lib/currency/context.tsx` — global context patterns
