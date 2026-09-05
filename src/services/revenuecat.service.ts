import { TIERS } from "../data/constants";

const REVENUECAT_API_BASE = "https://api.revenuecat.com/v1";

export type Tier = keyof typeof TIERS; // "explorer" | "strategist" | "mathematician"

const TIER_RANK: Record<Tier, number> = {
  explorer: 0,
  strategist: 1,
  mathematician: 2,
};

type RevenueCatEntitlement = {
  expires_date: string | null;
  product_identifier: string;
};

type RevenueCatSubscriber = {
  entitlements: Record<string, RevenueCatEntitlement>;
};

/**
 * Fetches the canonical subscriber state directly from RevenueCat's REST API.
 * Used as a reconciliation step — e.g. right after a client-side purchase completes,
 * so the app doesn't have to wait on webhook delivery latency to see the new tier.
 *
 * REVENUECAT_SECRET_KEY is server-only — never send this to the client.
 */
export async function fetchRevenueCatSubscriber(
  appUserId: string,
): Promise<RevenueCatSubscriber> {
  const secretKey = process.env.REVENUECAT_SECRET_KEY;
  if (!secretKey) {
    throw new Error("REVENUECAT_SECRET_KEY is not configured");
  }

  const response = await fetch(
    `${REVENUECAT_API_BASE}/subscribers/${encodeURIComponent(appUserId)}`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`RevenueCat API error: ${response.status}`);
  }

  const data = await response.json();
  return data.subscriber as RevenueCatSubscriber;
}

/** Picks the highest-ranked tier among the subscriber's currently-active entitlements. */
export function resolveTierFromSubscriber(subscriber: RevenueCatSubscriber): Tier {
  const now = new Date();
  const activeEntitlementIds = Object.keys(subscriber.entitlements || {}).filter(
    (id) => {
      const ent = subscriber.entitlements[id];
      return !ent.expires_date || new Date(ent.expires_date) > now;
    },
  );

  let best: Tier = "explorer";
  for (const id of activeEntitlementIds) {
    const tier = id as Tier;
    if (TIER_RANK[tier] !== undefined && TIER_RANK[tier] > TIER_RANK[best]) {
      best = tier;
    }
  }
  return best;
}
