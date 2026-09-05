import { db } from "../config/firebase";
import { Tier } from "./revenuecat.service";

/**
 * Single place that writes subscription state to Firestore, used by both the RevenueCat
 * webhook and the manual /subscriptions/sync endpoint so the two paths can't drift apart.
 * Mirrors into subscriptions/{email} + subscription_history so the existing admin
 * dashboard shows real purchases the same way it already shows admin-granted ones.
 */
export async function applySubscriptionState(params: {
  uid: string;
  tier: Tier;
  status: string; // "active" | "cancelled" | "expired" | "billing_issue" | "inactive"
  productId?: string | null;
  expiresAt?: Date | null;
  source: "webhook" | "manual-sync";
  historyAction: string;
}) {
  const { uid, tier, status, productId, expiresAt, source, historyAction } = params;

  const userRef = db.collection("users").doc(uid);
  const userDoc = await userRef.get();
  if (!userDoc.exists) return null;
  const user = userDoc.data()!;

  await userRef.update({ tier, tierStatus: status, tierUpdatedAt: new Date() });

  const email: string | undefined = user.email;
  if (email) {
    await db
      .collection("subscriptions")
      .doc(email)
      .set(
        {
          email,
          uid,
          tierId: tier,
          billingCycle: "monthly", // only monthly exists today
          productId: productId ?? null,
          status,
          source,
          expiresAt: expiresAt ?? null,
          updatedAt: new Date(),
        },
        { merge: true },
      );

    await db.collection("subscription_history").add({
      uid,
      email,
      action: historyAction,
      tierId: tier,
      productId: productId ?? null,
      createdAt: new Date(),
    });
  }

  return { tier, status };
}
