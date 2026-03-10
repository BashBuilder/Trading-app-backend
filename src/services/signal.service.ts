import { db } from "../config/firebase";

export const getUserTier = async (email: string) => {
  const subDoc = await db.collection("subscriptions").doc(email).get();
  if (!subDoc.exists) return null;
  const sub = subDoc.data();
  if (sub?.status !== "active") return null;
  if (sub.billingCycle !== "oneTime" && sub.expiresAt) {
    if (new Date() > sub.expiresAt.toDate()) return null;
  }
  return sub.tierId;
};
