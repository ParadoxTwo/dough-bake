# Delivery Implementation Plan

Roadmap to make delivery fully automatic, building on the `lib/delivery` provider
abstraction (Borzo default, Porter placeholder). Covers the five follow-up items
from [DELIVERY_SETUP.md](./DELIVERY_SETUP.md) §9.

> **How this plan was produced.** Stage 1 (Staff SWE persona) analyzed the
> codebase for items 1–2; Stage 2 (Senior UI/UX) is required for items 3–4 and is
> noted inline. The analysis surfaced two blockers not in the original roadmap —
> there is **no service-role Supabase client** in the repo, and the `job_queue`
> `job_type` CHECK constraint **excludes `create_delivery`** and has no retry
> columns. These become Phase 0.

---

## Key decisions (recommendations — confirm before building)

1. **Privileged writes need a service-role client + 2 new env vars.** Job
   processing and webhooks have no user session, so they cannot write to the
   RLS-protected `deliveries` / `orders` / `job_queue` tables via the normal
   client. **Recommend** adding `lib/supabase/admin.ts` (`createAdminClient()`)
   plus `SUPABASE_SERVICE_ROLE_KEY` (server-only) and `JOBS_PROCESS_SECRET` (to
   guard the queue drainer). This is a deliberate, documented exception to the
   "app reads only 3 public env vars" rule — these are **server-only** and never
   shipped to the client. (The `015` migration comment already assumed this client
   exists; it was never built.)
2. **Queue draining: Vercel Cron + inline kick.** `job_queue` is currently drained
   nowhere. **Recommend** a secret-guarded `POST /api/jobs/process` route called by
   Vercel Cron every minute (reliability backstop) plus a fire-and-forget kick
   right after enqueue (low-latency happy path). No long-running worker — fits
   Vercel's serverless model.
3. **Interim drop-off addressing: text only.** `customers` has no coordinates;
   Borzo geocodes from the text address. **Recommend** shipping the backend with
   the concatenated text address now, and treating precise lat/lng capture as the
   frontend half of Item 4 (UI/UX).
4. **Order status coupling.** On a `delivered` webhook, also set
   `orders.status = 'completed'`; on `cancelled`/`failed`, leave the order for an
   admin to decide.
5. **Unverified webhooks are rejected** (HTTP 401, no DB write) whenever a
   `callbackSecret` is configured.

---

## Sequencing (dependency order)

| Phase | Work | Persona(s) | Depends on |
|-------|------|-----------|------------|
| 0 | Prerequisites: service-role client, migration 016, types regen (Item 5) | Staff SWE | — |
| 1 | Item 1 — Dispatch hook (enqueue + drain + create delivery) | Staff SWE | Phase 0 |
| 2 | Item 2 — Webhook route (status updates) | Staff SWE | Phase 0 |
| 3 | Item 4a — Pickup address config (backend) | Staff SWE | Phase 0 |
| 4 | Item 3 — Admin Delivery UI + order tracking | UI/UX + Staff SWE | Phases 1–3 |
| 5 | Item 4b — Drop-off coordinate capture at checkout | UI/UX + Staff SWE | Phase 1 |

Each phase ends at the **Definition of Done** gate (typecheck, tests, lint on
changed files) and a QA review.

---

## Phase 0 — Prerequisites (also covers Item 5)

**Goal:** unblock privileged writes and typed queries.

- **`lib/supabase/admin.ts`** (new) — `createAdminClient()` via
  `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY`,
  `auth: { persistSession: false }`, `Database`-typed. Throws if the key is absent.
  Server-only module; never imported by client components.
- **`supabase/migrations/016_delivery_dispatch.sql`** (new):
  - Extend `job_queue.job_type` CHECK to include `'create_delivery'`.
  - Add `attempts INT NOT NULL DEFAULT 0` and `max_attempts INT NOT NULL DEFAULT 5`
    to `job_queue`.
  - Seed `site_settings('delivery_pickup', '{}')`.
- **Item 5 — regenerate `lib/types/database.types.ts`** (`supabase gen types`) so
  `deliveries`, the updated `job_queue`, and `site_settings` are typed. Until regen
  lands, new code uses the repo's existing `as unknown as { ... }` cast pattern.
- **Docs:** add `SUPABASE_SERVICE_ROLE_KEY` + `JOBS_PROCESS_SECRET` to
  `DELIVERY_SETUP.md` / `DEPLOYMENT.md`.
- **Tests:** migration applies cleanly; a `create_delivery` enqueue insert
  succeeds (proves the CHECK fix).
- **Effort:** S–M.

---

## Phase 1 — Item 1: Dispatch hook

**Goal:** on payment success, reliably create a courier task, idempotently.

- **`lib/actions/delivery-dispatch.ts`** (new):
  - `getPickupAddress()` — reads `site_settings.delivery_pickup`; null/empty →
    job fails cleanly (no broken dispatch).
  - `enqueueCreateDelivery(orderId)` — inserts a `create_delivery` job **only if**
    no active job and no `deliveries` row exist for the order (idempotency #1).
  - `enqueueDeliveryForOrder(orderId)` — `'use server'` wrapper for the client
    checkout path.
  - `processCreateDelivery(job)` — loads order+customer, builds
    `DeliveryCreateRequest`, calls `provider.createDelivery()`, **upserts**
    `deliveries` on `order_id` (idempotency #2; backed by the existing UNIQUE
    index). Re-checks for an existing `external_id` before the provider call
    (idempotency #3).
- **`app/api/jobs/process/route.ts`** (new) — secret-guarded drainer: claim
  `pending` jobs (`attempts < max_attempts`) → `processing` → success `completed` /
  failure increments `attempts`, re-queues or marks `failed` with `error_message`.
  `runtime = 'nodejs'`. Uses the admin client.
- **`app/api/payment/verify/route.ts`** (edit) — in the success branch, after the
  order update, best-effort `enqueueCreateDelivery()` (try/catch — never affects
  the payment response) + fire-and-forget job kick.
- **`app/checkout/page.tsx`** (edit) — in the no-payment auto-complete branch, call
  `enqueueDeliveryForOrder(order.id)` before redirect (keep `app/` semicolon style).
- **`vercel.json`** (new) — cron `*/1 * * * *` → `/api/jobs/process`.
- **Tests:** `delivery-dispatch.test.ts` (enqueue idempotency, upsert mapping,
  pickup-missing → failed); `jobs/process/route.test.ts` (secret guard, retry,
  exhaustion); extend a checkout e2e to assert a delivery/job is created in the
  no-payment path.
- **Effort:** L.

---

## Phase 2 — Item 2: Webhook route

**Goal:** keep delivery status live from provider callbacks.

- **`app/api/delivery/webhook/[provider]/route.ts`** (new) — `POST`: read
  `await request.text()` (raw body, required for HMAC), lowercase headers into a
  `Record<string,string>`, validate `params.provider` against
  `DeliveryProviderFactory.getSupportedProviders()`, load settings, call the
  provider's `handleWebhook()`, update the `deliveries` row by `external_id`, and
  (on `delivered`) set `orders.status='completed'`. 401 unverified, 400 bad body,
  200 ok. `runtime='nodejs'`. (`proxy.ts` already excludes `/api/*` from auth.)
- **`lib/actions/delivery-dispatch.ts`** (edit) — add `handleDeliveryWebhook()`.
- **Tests:** `borzo.test.ts` webhook cases (valid HMAC, tampered, missing secret,
  bad JSON); `webhook/[provider]/route.test.ts` (unknown provider 400, unverified
  401 + no write, verified 200 + update).
- **Effort:** M.

---

## Phase 3 — Item 4a: Pickup address config (backend)

**Goal:** the bakery's pickup point is configurable.

- Store `delivery_pickup` JSON in `site_settings`
  (`{ address, lat, lng, contactName, contactPhone, note }`), seeded in migration
  016. Read via `getPickupAddress()` (Phase 1). Admin editing of this value lands
  with the Delivery UI (Phase 4).
- **Effort:** S (mostly done as part of Phase 0/1).

---

## Phase 4 — Item 3: Admin Delivery UI + order tracking

**Goal:** admins configure the provider and see/track deliveries.
**Requires the Senior UI/UX persona** (frontend) before implementation.

- **`components/admin/DeliveryManager.tsx`** (new) — mirror
  `components/admin/PaymentManager.tsx`: select provider (`borzo`/`porter`), edit
  `delivery_config` (Borzo: `authToken`, `testMode`, `callbackSecret`,
  `vehicleTypeId`) and the pickup address, toggle `delivery_enabled`. Saves via
  `updateDeliverySettings()` + a new pickup-address action.
- **Order tracking** — extend `components/admin/AdminOrdersList.tsx` /
  `OrderCard.tsx` to show delivery status (`StatusBadge`), tracking link, and rider
  info; add a "Cancel delivery" action wired to `provider.cancelDelivery()`.
- **UI/UX considerations** (the persona's plan): reuse `components/ui/*`
  (`Card`, `Input`, `Select`, `ToggleSwitch`, `StatusBadge`, `Button`); all states
  (loading/empty/error/success); theme + currency aware (`CurrencyText` for fees);
  responsive admin layout; accessible forms.
- **Tests:** component tests for `DeliveryManager` (renders, validates, submits);
  e2e: admin configures provider and sees status on an order.
- **Effort:** M–L.

---

## Phase 5 — Item 4b: Drop-off coordinate capture (checkout)

**Goal:** better courier accuracy than text-only geocoding.
**Requires the Senior UI/UX persona** (frontend) before implementation.

- Capture/geocode drop-off `lat`/`lng` at checkout (e.g., map picker or
  address-autocomplete geocode), persist on `customers` (new nullable
  `lat`/`lng` columns → migration) and pass through `DeliveryCreateRequest`.
- **UI/UX considerations:** the address step UX, validation, mobile behavior,
  graceful fallback to text address when geocoding is unavailable.
- **Tests:** geocode helper unit tests; checkout e2e includes coordinates in the
  created delivery.
- **Effort:** M (plus a provider/geocoding choice decision).

---

## Cross-cutting Definition of Done

Every phase must pass before merge:
- `npm run typecheck` clean; `npm run test` passing with new unit/route tests;
  `npx eslint <changed files>` no errors.
- RLS respected (privileged writes via the admin client only; no policy relaxed).
- No secrets in client/`NEXT_PUBLIC_*`; provider config stays DB-driven.
- UI phases: responsive, theme/currency-aware, accessible.
- QA persona review returns PASS.
