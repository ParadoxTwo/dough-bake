# Delivery Setup Guide

How to configure last-mile delivery for Dough Bake across **local**, **staging**,
and **production**, including the external accounts you need to sign up for and the
services that must be running.

The delivery layer mirrors the payment layer: a provider abstraction
(`lib/delivery`) with the active provider and its credentials stored in the
database (`site_settings`) and selected at runtime by `DeliveryProviderFactory`.

- **Default provider:** **Borzo** (formerly WeFast) — self-serve Business API with
  a sandbox.
- **Additional provider:** **Porter** — adapter stub, to be completed once a Porter
  business account / API access exists.

---

## 0. What is and isn't built yet

So you know exactly where the boundaries are:

**Implemented**
- `lib/delivery` — interface, factory, `BaseDeliveryProvider`
- Borzo adapter — quote / create / status / cancel + webhook signature verification
- Porter adapter — placeholder with status mapping + `TODO`s
- `lib/actions/delivery.ts` — read/update provider config in `site_settings`
- Migrations `015_delivery.sql` / `016_delivery_dispatch.sql` — `deliveries` table,
  `job_queue` retry columns, and the `delivery_pickup` setting
- Dispatch hook on payment success and checkout (via `job_queue` + `/api/jobs/process`)
- Webhook route `app/api/delivery/webhook/[provider]` (status updates)
- Admin "Delivery" settings UI (provider, credentials, pickup address) + delivery
  status/tracking and cancel on `/admin/orders`

**Pending (wiring — see [Roadmap](#9-roadmap-remaining-wiring))**
- Checkout capture of drop-off lat/lng (text address is geocoded in the interim)

Until the pending items land, you can still configure and exercise the Borzo
adapter directly (quote/create/status), but **automatic dispatch and live status
updates require the dispatch hook and webhook route**.

---

## 1. Accounts to sign up for

### Borzo (required — default provider)
1. Create a business account at <https://borzodelivery.com/in/> → **Business / API**.
2. Open your **Personal Cabinet** and copy the **API auth token**
   (`X-DV-Auth-Token`). You get separate tokens for the **test (sandbox)** and
   **production** environments — keep them distinct.
3. Set a **callback secret** (used to sign status webhooks) in the cabinet, and
   note the **callback URL** you'll point at this app (see [§7](#7-webhooks)).
4. For production: **fund your Borzo wallet** — real orders are charged per
   delivery.

Borzo API hosts (already encoded in the adapter, selected by `testMode`):
- Sandbox: `https://robotapitest-in.borzodelivery.com/api/business/1.6`
- Production: `https://robot-in.borzodelivery.com/api/business/1.6`

### Porter (optional — later)
Porter's intra-city API is **enterprise/contract-gated** (no self-serve portal).
When your friend's Porter account is ready, ask their **account manager** for:
- API credentials (and a sandbox/test environment if available)
- The API reference: create-order, fare/quote, tracking, and the **webhook payload
  + signature** details

Then complete `lib/delivery/providers/porter.ts` (the status mapping is already
wired) and switch `delivery_provider` to `porter`.

### A tunnel (local only)
To receive Borzo webhooks on your machine you need a public URL — sign up for one
of: **ngrok**, **cloudflared** (Cloudflare Tunnel), or **localtunnel**.

---

## 2. What must be running

| Environment | Supabase / DB                  | Next.js app                  | Public webhook URL                          | Borzo                          |
|-------------|--------------------------------|------------------------------|---------------------------------------------|--------------------------------|
| Local       | `supabase start` (local stack) | `npm run dev`                | tunnel (ngrok/cloudflared) → localhost:3000 | **sandbox** token, `testMode:true` |
| Staging     | Staging Supabase project       | Deployed (e.g. Vercel)       | `https://staging.doughandbake.store/...`    | **sandbox** token, `testMode:true` |
| Production  | Production Supabase project     | Deployed (e.g. Vercel)       | `https://doughandbake.store/...`            | **production** token, `testMode:false`, **wallet funded** |

In all cases the migrations (including `015_delivery.sql`) must be applied so the
`deliveries` table and the `delivery_*` settings rows exist.

> No new environment variables are required. Like payments, delivery credentials
> live in the database (`site_settings.delivery_config`), **not** in `.env`.

---

## 3. Configuration model

Three rows in `site_settings` (seeded by migration `015`, defaults shown):

| key                 | default   | meaning                                   |
|---------------------|-----------|-------------------------------------------|
| `delivery_provider` | `borzo`   | active provider (`borzo` \| `porter`)     |
| `delivery_enabled`  | `false`   | master on/off switch                      |
| `delivery_config`   | `{}`      | provider-specific JSON (credentials etc.) |

### Borzo `delivery_config` shape

```json
{
  "authToken": "<your Borzo X-DV-Auth-Token>",
  "testMode": true,
  "callbackSecret": "<your Borzo callback secret>",
  "callbackAlgo": "sha1",
  "vehicleTypeId": 8
}
```

- `authToken` — **required**. Use the sandbox token when `testMode` is `true`.
- `testMode` — `true` → sandbox host; `false` → production host.
- `callbackSecret` — used to verify webhook signatures (`X-DV-Signature`).
- `callbackAlgo` — HMAC algorithm for the signature; defaults to `sha1`.
  **Confirm the exact algorithm against your Borzo callback docs.**
- `vehicleTypeId` — Borzo vehicle type; `8` = motorbike (≤ 20 kg), suitable for a
  bakery.

### How to set it

Use the **Delivery Settings** card on the `/admin` dashboard (provider,
credentials, pickup address, enable toggle) — it calls the admin-only
`updateDeliverySettings()` / `updateDeliveryPickup()` actions. You can also set it
directly with SQL via Supabase Studio (local) or the SQL Editor (hosted):

```sql
update public.site_settings set value = 'borzo'  where key = 'delivery_provider';
update public.site_settings set value = 'true'   where key = 'delivery_enabled';
update public.site_settings
  set value = '{"authToken":"REPLACE_ME","testMode":true,"callbackSecret":"REPLACE_ME","callbackAlgo":"sha1","vehicleTypeId":8}'
  where key = 'delivery_config';
```

---

## 4. Local setup

1. Start the stack and apply migrations:
   ```bash
   npm run supabase:start   # applies migrations, including 015_delivery.sql
   npm run dev
   ```
2. **Sign up / get your Borzo sandbox token** ([§1](#1-accounts-to-sign-up-for)).
3. Set `delivery_config` with the **sandbox** token and `"testMode": true`
   ([§3](#3-configuration-model)), and `delivery_enabled = true`.
4. Set the **pickup (bakery) address** ([§6](#6-pickup-address--geocoding)).
5. To receive webhooks locally, start a tunnel and register its URL in the Borzo
   cabinet ([§7](#7-webhooks)):
   ```bash
   ngrok http 3000
   # → https://<random>.ngrok-free.app/api/delivery/webhook/borzo
   ```
   If you skip the tunnel, you won't get live status pushes locally — you can still
   create deliveries and poll status.

---

## 5. Staging setup

1. Ensure the staging Supabase project has all migrations applied.
2. Deploy the app to staging (`https://staging.doughandbake.store`).
3. Use the **Borzo sandbox** here too (`testMode: true`) so no real couriers are
   dispatched and no charges occur.
4. Register the staging webhook URL in the Borzo cabinet:
   `https://staging.doughandbake.store/api/delivery/webhook/borzo`.
5. Set `delivery_enabled = true` and the pickup address for the staging DB.

---

## 6. Production setup

1. Ensure the production Supabase project has all migrations applied.
2. Switch `delivery_config` to the **production** Borzo token and set
   `"testMode": false`.
3. **Fund the Borzo wallet** — production orders are billed per delivery.
4. Register the production webhook URL in the Borzo cabinet:
   `https://doughandbake.store/api/delivery/webhook/borzo`.
5. Set the real bakery **pickup address** ([§6 below](#6-pickup-address--geocoding))
   and `delivery_enabled = true`.
6. Do a single live smoke test (one real order) before going fully live.

---

## 6. Pickup address & geocoding

Borzo (and Porter) need both a **pickup** and **drop-off** point, ideally with
coordinates.

- **Pickup (the bakery):** will be stored in `site_settings` and read at dispatch
  time. Planned keys (added with the dispatch wiring):
  `delivery_pickup_address`, `delivery_pickup_lat`, `delivery_pickup_lng`,
  `delivery_pickup_contact_name`, `delivery_pickup_contact_phone`.
- **Drop-off (the customer):** your `customers` table stores the address text but
  **not** lat/lng today. Borzo can geocode from the address string, but accuracy is
  much better with coordinates, so the checkout flow should capture/geocode
  drop-off coordinates (planned — see Roadmap).

---

## 7. Webhooks

Borzo pushes order/delivery status changes to a callback URL you register in the
Personal Cabinet. The app endpoint is:

```
POST /api/delivery/webhook/borzo
```

- Borzo signs the request with the **`X-DV-Signature`** header; the adapter
  verifies it using `callbackSecret` + `callbackAlgo` (timing-safe compare).
  Unverified callbacks are rejected (401) whenever a `callbackSecret` is set.
- The route looks up the `deliveries` row by `external_id`, maps the status, and
  updates it — marking the order `completed` when the delivery is delivered.
- `proxy.ts` excludes `/api/*` from the auth middleware, so webhook calls are not
  intercepted.

Register the correct URL per environment (local tunnel / staging / production) as
listed above.

---

## 8. Testing checklist

- [ ] Migrations applied; `deliveries` table and `delivery_*` rows exist.
- [ ] `delivery_provider = borzo`, `delivery_enabled = true`.
- [ ] `delivery_config.authToken` set; `testMode` correct for the environment.
- [ ] Pickup address configured.
- [ ] (Sandbox) Create a test delivery and confirm an `external_id` comes back.
- [ ] Webhook URL registered in Borzo cabinet; a status change updates the
      `deliveries` row.
- [ ] `callbackSecret` set and signature verification passes.
- [ ] (Production) Borzo wallet funded; one live smoke test completed.

---

## 9. Roadmap (remaining wiring)

To make delivery fully automatic, the following still needs to be implemented
(tracked separately):

1. **Dispatch hook** — on payment success (`/api/payment/verify` and the
   no-payment branch in checkout), enqueue a `create_delivery` job in `job_queue`;
   a processor calls `createDelivery()` and writes the `deliveries` row
   (idempotent on `order_id`).
2. **Webhook route** — `app/api/delivery/webhook/[provider]/route.ts` using
   `provider.handleWebhook()`.
3. **Admin UI** — a `DeliveryManager` (like `PaymentManager`) to edit
   `delivery_config`, plus tracking link/status on `/admin/orders`.
4. **Checkout** — capture/geocode drop-off lat/lng; store pickup address keys in
   `site_settings`.
5. **Types** — regenerate `lib/types/database.types.ts` to include `deliveries`.

---

## Related docs

- [SETUP.md](./SETUP.md) — local environment setup
- [DEPLOYMENT.md](./DEPLOYMENT.md) — production deployment
- [README.md](./README.md) — project overview
