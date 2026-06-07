# Dough Bake — Project Guide for Claude

Bakery e-commerce platform: Next.js 16 (App Router, Turbopack), React 19,
TypeScript (strict), TailwindCSS 4, Supabase (Postgres + Auth + Storage).

See also: [README.md](./README.md), [SETUP.md](./SETUP.md),
[DEPLOYMENT.md](./DEPLOYMENT.md), [DELIVERY_SETUP.md](./DELIVERY_SETUP.md).

---

## How we work: a three-person team (MANDATORY)

Every implementation task is delivered by three specialist roles working together,
defined as subagents in `.claude/agents/`. Run the **full flow** — do not skip a
stage to save time.

1. **Staff Software Engineer** — `staff-swe`
   Runs **at the start of every task**. Analyzes the codebase and the request and
   produces an implementation plan (approach, files to touch, data/RLS impact,
   risks, test strategy). **Plans, does not write code.**

2. **Senior UI/UX Designer** — `senior-ui-ux`
   Runs **whenever the change involves UI/UX or any frontend work**. Produces a
   UI/UX implementation plan (component breakdown, states, responsiveness, theme &
   currency awareness, accessibility, reuse of existing components). Skipped only
   for purely backend/non-visual tasks. **Plans, does not write code.**

3. **Senior QA Reviewer** — `qa-reviewer`
   Runs **after implementation is complete**. Verifies tests exist and pass, the
   typecheck and lint gates are clean, RLS/security is sound, and the code is
   solid. Returns a pass/fail verdict with required fixes; loop until it passes.

**Orchestration:** dispatch each role with the Agent tool (`subagent_type:
staff-swe` / `senior-ui-ux` / `qa-reviewer`). Synthesize each plan before moving
on, implement against the plans yourself, then hand off to QA.

### Definition of Done (the QA gate)

A change is done only when **all** of these hold:

- `npm run typecheck` is clean.
- `npm run test` passes; new/changed logic has unit/component tests, and
  user-facing flows get an e2e test where feasible.
- `npx eslint <changed files>` reports **no errors** (warnings are acceptable).
- Any new DB table has **RLS policies** (mirror `orders` / `deliveries`).
- No secrets added to env/client; provider credentials stay **DB-driven**.
- UI changes are responsive, theme-aware, currency-aware, and accessible.

---

## Conventions (shared ground truth)

- **Config is database-driven.** Payment and delivery providers read credentials
  from `site_settings` (JSON config), managed in the admin dashboard — **never**
  from env. Public env is `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, and the optional
  `NEXT_PUBLIC_MAPBOX_TOKEN` (URL-restricted public token for the checkout map).
  Server-only secrets `SUPABASE_SERVICE_ROLE_KEY` and `JOBS_PROCESS_SECRET` power
  delivery dispatch/webhooks and the queue drainer.
- **Provider pattern.** New third-party integrations follow `lib/payment` and
  `lib/delivery`: a normalized interface + `Base*Provider` + a `*Factory` +
  settings in `site_settings` + an admin manager component.
- **Server logic** lives in server actions under `lib/actions/*`; Supabase clients
  are in `lib/supabase/*` (`client`, `server`, `middleware`).
- **RLS is mandatory** on every new table. Model policies on the existing
  `orders` / `order_items` / `deliveries` (customer-owns-via-`customers`, admin
  full access).
- **Migrations** are numbered SQL files in `supabase/migrations/NNN_name.sql`,
  applied by `npm run supabase:start` / `supabase:reset`. After schema changes,
  regenerate `lib/types/database.types.ts`.
- **Code style:** match the file/dir you are editing. `lib/` omits semicolons;
  `app/` pages use semicolons. 2-space indent, single quotes.
- **UI:** reuse `components/ui/*`; respect the theme (`lib/theme`) and currency
  (`lib/currency`) contexts; render prices via `CurrencyText`.
- **Middleware** is `proxy.ts` (auth session + CORS), not `middleware.ts`.

---

## Commands

```bash
npm run dev          # dev server (Turbopack)
npm run build        # production build
npm run lint         # ESLint (lint:fix to autofix)
npm run typecheck    # tsc --noEmit
npm run test         # Vitest (unit/component); test:watch for watch mode
npm run test:e2e     # Playwright e2e (run `npx playwright install` once first)

npm run supabase:start    # local Supabase + migrations
npm run supabase:reset    # rebuild DB from migrations
npm run supabase:status   # local credentials
```

## Testing

- **Unit/component:** Vitest + React Testing Library. Name files `*.test.ts(x)`
  next to the source (see `lib/delivery/factory.test.ts`,
  `components/ui/Badge.test.tsx`). Global setup: `vitest.setup.ts`.
- **E2E:** Playwright specs in `e2e/*.spec.ts` (config starts `npm run dev`).

---

## Known constraints & lint debt

- The repo has **pre-existing lint errors** (unescaped JSX entities,
  `setState`-in-effect, a conditional hook, one `prefer-const`). New code must not
  add errors; clearing the existing ones is a tracked backlog item, so the QA gate
  checks **changed files**, not the whole repo.
- `@typescript-eslint/no-explicit-any` and `no-unused-vars` are **warnings** (the
  provider-config pattern uses `Record<string, any>`); prefer precise types in new
  code anyway.
- `lib/types/database.types.ts` does **not yet** include the `deliveries` table —
  regenerate it before writing typed queries against it.
