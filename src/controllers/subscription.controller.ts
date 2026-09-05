import { db } from "../config/firebase";
import { Request, Response } from "express";
import {
  fetchRevenueCatSubscriber,
  resolveTierFromSubscriber,
} from "../services/revenuecat.service";
import { applySubscriptionState } from "../services/subscription-sync.service";

const TIER_RANK: Record<string, number> = {
  explorer: 0,
  strategist: 1,
  mathematician: 2,
};

export const subscriptionController = {
  // ✅ SYNC WITH REVENUECAT (call right after a client-side purchase/restore completes,
  // instead of waiting for webhook delivery to update the UI)
  syncWithRevenueCat: async (req: Request, res: Response) => {
    try {
      const uid = req.user.uid;
      const subscriber = await fetchRevenueCatSubscriber(uid);
      const tier = resolveTierFromSubscriber(subscriber);
      const activeEntitlement = subscriber.entitlements?.[tier];

      await applySubscriptionState({
        uid,
        tier,
        status: tier === "explorer" ? "inactive" : "active",
        productId: activeEntitlement?.product_identifier ?? null,
        expiresAt: activeEntitlement?.expires_date
          ? new Date(activeEntitlement.expires_date)
          : null,
        source: "manual-sync",
        historyAction: "revenuecat_manual_sync",
      });

      return res.json({ success: true, payload: { tier } });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error?.message || "Error syncing subscription status",
      });
    }
  },

  getTiers: async (req: Request, res: Response) =>
    //   {
    //   try {
    //     return res.json({
    //       success: true,
    //       payload: Object.values(TIERS),
    //     });
    //   } catch (error) {
    //     return res
    //       .status(500)
    //       .json({ success: false, message: "Error getting bank tiers" });
    //   }
    // }
    {
      try {
        const snapshot = await db
          .collection("tiers")
          .orderBy("order", "asc")
          .get();
        const tiers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        return res.json({ success: true, payload: tiers });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }
    },
  getCurrentSubscription: async (req: Request, res: Response) => {
    try {
      const email = req.user.email;
      const subDoc = await db.collection("subscriptions").doc(email).get();
      if (!subDoc.exists) {
        return res.json({
          success: true,
          payload: null, // no active subscription
        });
      }
      const sub = subDoc.data();
      if (sub?.billingCycle !== "oneTime" && sub?.expiresAt) {
        const now = new Date();
        const expiresAt = sub.expiresAt.toDate();
        if (now > expiresAt) {
          await db.collection("subscriptions").doc(email).update({
            status: "expired",
          });
          return res.json({
            success: true,
            payload: { ...sub, status: "expired" },
          });
        }
      }
      return res.json({ success: true, payload: sub });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error?.message || "Error getting current subscription",
      });
    }
  },
  // Disabled: paid tiers are unlocked via Apple/RevenueCat now (see webhook.controller.ts
  // and syncWithRevenueCat above). Letting the client unlock paid app content through a
  // custom endpoint like this — bypassing StoreKit — violates App Store Review Guideline
  // 3.1.1, so this intentionally no-ops instead of granting access.
  subscribe: async (_req: Request, res: Response) => {
    return res.status(410).json({
      success: false,
      message:
        "This endpoint is no longer used. Subscriptions are purchased through the App Store — see the in-app paywall.",
    });
  },
  cancel: async (_req: Request, res: Response) => {
    return res.status(410).json({
      success: false,
      message:
        "This endpoint is no longer used. Cancel a subscription from Apple's subscription management (Settings → your name → Subscriptions), which the app links to.",
    });
  },

  adminGetAllSubscriptions: async (req: Request, res: Response) => {
    try {
      const { status, email } = req.query;

      let query: any = db.collection("subscriptions");

      if (status && status !== "all") {
        query = query.where("status", "==", status);
      }
      const snapshot = await query.get();
      let subscriptions = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        subscribedAt: doc.data().subscribedAt?.toDate().toISOString(),
        expiresAt: doc.data().expiresAt?.toDate?.()?.toISOString() ?? null,
        cancelledAt: doc.data().cancelledAt?.toDate?.()?.toISOString() ?? null,
      }));

      // Filter by email if provided (Firestore doesn't support cross-collection queries)
      if (email) {
        const usersSnapshot = await db
          .collection("users")
          .where("email", "==", email)
          .get();

        const matchingUids = usersSnapshot.docs.map((d) => d.id);
        subscriptions = subscriptions.filter((s: any) =>
          matchingUids.includes(s.uid),
        );
      }

      // Enrich with user info
      const enriched = await Promise.all(
        subscriptions.map(async (sub: any) => {
          try {
            // const userDoc = await db.collection("users").doc(sub.email).get();
            const userDoc = await db
              .collection("users")
              .where("email", "==", sub.email)
              .limit(1)
              .get();
            const userData = userDoc.docs[0]?.data();

            return {
              ...sub,
              user: {
                email: userData?.email ?? "—",
                firstName: userData?.firstName ?? "—",
                lastName: userData?.lastName ?? "—",
              },
            };
          } catch {
            return {
              ...sub,
              user: { email: "—", firstName: "—", lastName: "—" },
            };
          }
        }),
      );
      return res.json({ success: true, payload: enriched });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
  adminGetUserSubscription: async (req: Request, res: Response) => {
    try {
      const snapshot = await db
        .collection("subscription_history")
        .where("uid", "==", req.params.uid as string)
        .orderBy("createdAt", "desc")
        .get();

      const history = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString(),
      }));

      return res.json({ success: true, payload: history });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  adminAddUserSubscription: async (req: Request, res: Response) => {
    try {
      const { uid, tierId, billingCycle, durationDays } = req.body;

      if (!uid || !tierId || !billingCycle) {
        return res.status(400).json({
          success: false,
          message: "uid, tierId and billingCycle are required.",
        });
      }

      // Get tier details from DB
      const tierDoc = await db.collection("tiers").doc(tierId).get();
      if (!tierDoc.exists) {
        return res
          .status(404)
          .json({ success: false, message: "Tier not found." });
      }
      const tier = tierDoc.data()!;

      // Calculate expiry
      const now = new Date();
      let expiresAt: Date | null = null;

      if (billingCycle === "weekly") {
        expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + 7);
      } else if (billingCycle === "monthly") {
        expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else if (billingCycle === "annual") {
        expiresAt = new Date(now);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else if (billingCycle === "custom" && durationDays) {
        expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + Number(durationDays));
      }

      const subscription = {
        uid,
        email: uid,
        tierId,
        tierName: tier.name,
        billingCycle,
        price: tier.price[billingCycle] ?? 0,
        status: "active",
        capabilities: tier.capabilities,
        subscribedAt: now,
        expiresAt,
        addedByAdmin: true,
        addedBy: req.user.uid,
      };

      // Save subscription
      const response = await db
        .collection("subscriptions")
        .doc(uid)
        .set(subscription);

      const userDoc = await db
        .collection("users")
        .where("email", "==", uid)
        .limit(1)
        .get();

      console.log("User doc for tier update:", userDoc);
      if (!userDoc.empty) {
        const userUpdate = await userDoc.docs[0].ref.update({
          tier: tierId,
          tierStatus: "active",
        });
        console.log("User tier updated:", userUpdate);
      }

      // Log to history
      await db.collection("subscription_history").add({
        uid,
        action: "admin_add",
        tierId,
        tierName: tier.name,
        billingCycle,
        performedBy: req.user.uid,
        createdAt: now,
      });

      return res.status(201).json({ success: true, payload: subscription });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
  adminCancelUserSubscription: async (req: Request, res: Response) => {
    try {
      const email = req.params.uid as string;
      // Get subscription
      const subSnapshot = await db
        .collection("subscriptions")
        .where("email", "==", email)
        .limit(1)
        .get();

      if (subSnapshot.empty) {
        throw new Error("Subscription not found");
      }

      const subDoc = subSnapshot.docs[0];
      const sub = subDoc.data();

      // Update subscription
      await subDoc.ref.update({
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledByAdmin: true,
      });

      // Update user
      const userSnapshot = await db
        .collection("users")
        .where("email", "==", email)
        .limit(1)
        .get();

      if (!userSnapshot.empty) {
        await userSnapshot.docs[0].ref.update({
          tierStatus: "cancelled",
        });
      }

      // Log history
      await db.collection("subscription_history").add({
        uid: email,
        email: email,
        action: "admin_cancel",
        tierId: sub.tierId,
        tierName: sub.tierName,
        performedBy: req.user.uid,
        createdAt: new Date(),
      });

      return res.json({ success: true, message: "Subscription cancelled." });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};
