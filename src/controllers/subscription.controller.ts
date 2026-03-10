import { get } from "axios";
import { db } from "../config/firebase";
import { Request, Response } from "express";
import { TIERS } from "../data/constants";

export const subscriptionController = {
  getTiers: async (req: Request, res: Response) => {
    try {
      return res.json({
        success: true,
        payload: Object.values(TIERS),
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Error getting bank tiers" });
    }
  },
  getCurrentSubscription: async (req: Request, res: Response) => {
    try {
      const uid = req.user.uid;
      const subDoc = await db.collection("subscriptions").doc(uid).get();

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
          await db.collection("subscriptions").doc(uid).update({
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
  subscribe: async (req: Request, res: Response) => {
    try {
      const uid = req.user.uid;
      const { tierId, billingCycle } = req.body;

      if (!tierId || !billingCycle) {
        return res
          .status(400)
          .json({ success: false, message: "Missing required fields" });
      }

      if (!TIERS[tierId as keyof typeof TIERS]) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid tier." });
      }

      // Validate billing cycle
      const validCycles = ["monthly", "annual", "oneTime"];
      if (!validCycles.includes(billingCycle)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid billing cycle." });
      }

      const tier = TIERS[tierId as keyof typeof TIERS];
      const price = tier.price[billingCycle as keyof typeof tier.price];

      // Calculate expiry
      let expiresAt = null;
      const now = new Date();
      if (billingCycle === "monthly") {
        expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else if (billingCycle === "annual") {
        expiresAt = new Date(now);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }
      // oneTime has no expiry

      const subscription = {
        uid,
        tierId,
        tierName: tier.name,
        billingCycle,
        price,
        status: "active",
        capabilities: tier.capabilities,
        subscribedAt: new Date(),
        expiresAt: expiresAt,
        // In production: add paymentIntentId, receiptUrl etc from Stripe/Paystack
      };

      await db.collection("subscriptions").doc(uid).set(subscription);

      // Also update user doc with current tier for quick access
      await db.collection("users").doc(uid).update({
        tier: tierId,
        tierStatus: "active",
      });

      return res.json({ success: true, payload: subscription });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Error subscribing to tier",
      });
    }
  },
  cancel: async (req: Request, res: Response) => {
    try {
      const uid = req.user.uid;
      const subDoc = await db.collection("subscriptions").doc(uid).get();

      if (!subDoc.exists || subDoc?.data()?.status !== "active") {
        return res.status(400).json({
          success: false,
          message: "No active subscription to cancel.",
        });
      }

      await db.collection("subscriptions").doc(uid).update({
        status: "cancelled",
        cancelledAt: new Date(),
      });

      await db.collection("users").doc(uid).update({
        tierStatus: "cancelled",
      });

      return res.json({
        success: true,
        message:
          "Subscription cancelled. Access remains until the end of the billing period.",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Error cancelling subscription",
      });
    }
  },
};
