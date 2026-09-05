import { Request, Response } from "express";
import { db } from "../config/firebase";
import { Tier } from "../services/revenuecat.service";
import { applySubscriptionState } from "../services/subscription-sync.service";

/**
 * Maps App Store product IDs to internal tier names. Only monthly products exist today
 * (Explorer is free / has no product). Add weekly/annual product IDs here as they're
 * created in App Store Connect — same tier, just another duration variant.
 */
const PRODUCT_TIER_MAP: Record<string, Tier> = {
  "com.woteva.elite.strategist.monthly": "strategist",
  "com.woteva.elite.mathematician.monthly": "mathematician",
};

const TIER_RANK: Record<Tier, number> = {
  explorer: 0,
  strategist: 1,
  mathematician: 2,
};

/** RevenueCat sends entitlement identifiers on the event — these match your RC Entitlement ids. */
function resolveTierFromEntitlements(entitlementIds: string[] = []): Tier {
  let best: Tier = "explorer";
  for (const id of entitlementIds) {
    const tier = id as Tier;
    if (TIER_RANK[tier] !== undefined && TIER_RANK[tier] > TIER_RANK[best]) {
      best = tier;
    }
  }
  return best;
}

// Event types where the entitlement(s) on the payload represent the user's current active access.
const ACTIVE_EVENT_TYPES = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "PRODUCT_CHANGE",
  "NON_RENEWING_PURCHASE",
  "SUBSCRIPTION_EXTENDED",
  "TEMPORARY_ENTITLEMENT_GRANT",
]);

export const webhookController = {
  revenuecat: async (req: Request, res: Response) => {
    // RevenueCat sends back exactly the Authorization header value you set when
    // configuring the webhook URL in the dashboard.
    const configuredSecret = process.env.REVENUECAT_WEBHOOK_SECRET;
    if (!configuredSecret || req.headers.authorization !== `Bearer ${configuredSecret}`) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const event = req.body?.event;
      if (!event) {
        return res.status(400).json({ message: "Missing event payload" });
      }

      // Sent when you click "Send test event" in the RevenueCat dashboard — ack and stop.
      if (event.type === "TEST") {
        return res.status(200).json({ received: true });
      }

      const uid: string | undefined = event.app_user_id;
      if (!uid) {
        return res.status(200).json({ received: true });
      }

      let tier: Tier;
      let status: string;

      if (event.type === "EXPIRATION") {
        tier = "explorer";
        status = "expired";
      } else if (event.type === "CANCELLATION") {
        // Auto-renew was turned off, but access continues until the period ends —
        // the later EXPIRATION event is what actually downgrades the tier.
        tier = resolveTierFromEntitlements(event.entitlement_ids);
        status = "cancelled";
      } else if (event.type === "BILLING_ISSUE") {
        // Grace period — Apple is retrying the charge. Leave access as-is, just flag it.
        const userDoc = await db.collection("users").doc(uid).get();
        const currentTier = (userDoc.data()?.tier as Tier) || "explorer";
        tier = resolveTierFromEntitlements(
          event.entitlement_ids?.length ? event.entitlement_ids : [currentTier],
        );
        status = "billing_issue";
      } else if (ACTIVE_EVENT_TYPES.has(event.type)) {
        tier = resolveTierFromEntitlements(event.entitlement_ids);
        status = "active";
      } else {
        // e.g. TRANSFER — no explicit handling yet, log and move on rather than guess.
        console.log(`Unhandled RevenueCat event type: ${event.type}`);
        return res.status(200).json({ received: true });
      }

      const result = await applySubscriptionState({
        uid,
        tier,
        status,
        productId: event.product_id,
        expiresAt: event.expiration_at_ms ? new Date(event.expiration_at_ms) : null,
        source: "webhook",
        historyAction: `revenuecat_${String(event.type).toLowerCase()}`,
      });

      if (!result) {
        console.warn(`RevenueCat webhook for unknown user id: ${uid}`);
      }

      return res.status(200).json({ received: true });
    } catch (error) {
      console.error("RevenueCat webhook error:", error);
      // Non-2xx so RevenueCat retries — a transient DB error shouldn't silently drop the event.
      return res.status(500).json({ message: "Webhook processing error" });
    }
  },
};
