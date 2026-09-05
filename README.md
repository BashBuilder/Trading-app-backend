# Trading-app-backend

## Setup

```bash
pnpm install
cp .env.example .env   # fill in Firebase, Resend, and RevenueCat values
pnpm dev
```

## Subscriptions & RevenueCat

Real purchases go through Apple/RevenueCat — this backend never charges anyone directly.
Two paths keep Firestore in sync with what Apple says is true:

- `POST /webhooks/revenuecat` — RevenueCat calls this on every entitlement change
  (purchase, renewal, cancellation, expiration, billing issue). Protected by
  `REVENUECAT_WEBHOOK_SECRET`, which must match the Authorization header value configured
  in RevenueCat → Project Settings → Integrations → Webhooks.
- `POST /subscriptions/sync` — called by the app right after a purchase/restore completes,
  so the UI doesn't have to wait on webhook delivery latency. Reads live subscriber state
  straight from RevenueCat's API using `REVENUECAT_SECRET_KEY` (server-only).

`POST /subscriptions/subscribe` and `/subscriptions/cancel` are **disabled** (they return
410). They were the original custom, non-Apple purchase flow — leaving them live and
capable of unlocking paid content would violate App Store Review Guideline 3.1.1, which
requires digital subscription content to be sold through StoreKit, not a side channel.

### Tier metadata vs. price

`GET /tiers` / `GET /subscriptions/tiers` returns tier metadata (name, description,
capabilities, and a `price` field) from Firestore, seeded once from `DEFAULT_TIERS` in
`src/data/constants.ts`. Explorer's price is `0` — it's the free default tier and has no
App Store product. Strategist and Mathematician's `price` values are **display fallbacks
only**, shown in the app while the live App Store price is still loading; they are never
what a subscriber is actually charged (that's whatever's configured on the product in App
Store Connect). Keep them roughly in sync via the admin app's Tiers screen (`PUT
/tiers/:id`) so the fallback is never far off, but don't treat drift here as a billing bug.
