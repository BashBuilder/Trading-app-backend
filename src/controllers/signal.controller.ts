import { Request, Response } from "express";
import { subscriptionController } from "./subscription.controller";
import { getUserTier } from "../services/signal.service";
import { db } from "../config/firebase";

const TIER_RANK = { explorer: 0, strategist: 1, mathematician: 2 };

export const signalController = {
  getSignals: async (req: Request, res: Response) => {
    try {
      const userTier = await getUserTier(req.user.email);

      console.log("User tier:", userTier);

      const userRank = userTier
        ? TIER_RANK[userTier as keyof typeof TIER_RANK]
        : -1;
      console.log("User rank:", userRank);

      const snapshot = await db
        .collection("signals")
        .where("status", "==", "active")
        .orderBy("createdAt", "desc")
        .get();

      console.log("User rank:", userRank);
      const signals = snapshot.docs.map((doc) => {
        const data = doc.data();
        const signalRank = TIER_RANK[data.tier as keyof typeof TIER_RANK] ?? 0;
        const rankDiff = signalRank - userRank;

        console.log(
          `Signal ${doc.id} - Signal rank: ${signalRank}, Rank diff: ${rankDiff}`,
        );
        // rankDiff <= 0: full access
        // rankDiff === 1: card visible, detail locked
        // rankDiff >= 2: card blurred, detail locked
        let accessLevel = "full";
        if (rankDiff === 1) accessLevel = "preview"; // show card, lock detail
        if (rankDiff >= 2) accessLevel = "locked"; // blur card

        return {
          id: doc.id,
          pair: data.pair,
          timeframe: data.timeframe,
          direction: data.direction,
          confidence: data.confidence,
          tier: data.tier,
          summary: data.summary,
          time: data.createdAt?.toDate().toISOString() ?? null,
          // Only expose sensitive fields on full access
          entry: accessLevel === "full" ? data.entry : null,
          stopLoss: accessLevel === "full" ? data.stopLoss : null,
          takeProfit: accessLevel === "full" ? data.takeProfit : null,
          chartImageUrl: accessLevel === "full" ? data.chartImageUrl : null,
          analystNotes: accessLevel === "full" ? data.analystNotes : null,
          accessLevel,
        };
      });

      console.log("Signals fetched:", signals);

      return res.json({ success: true, payload: signals });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || "Error getting signals",
      });
    }
  },
  getSignal: async (req: Request, res: Response) => {
    try {
      const userTier = await getUserTier(req.user.email);
      const userRank = userTier
        ? TIER_RANK[userTier as keyof typeof TIER_RANK]
        : -1;

      const doc = await db
        .collection("signals")
        .doc(req.params.id as string)
        .get();
      if (!doc.exists) {
        return res
          .status(404)
          .json({ success: false, message: "Signal not found." });
      }

      const data = doc.data();
      const signalRank = TIER_RANK[data?.tier as keyof typeof TIER_RANK] ?? 0;

      if (signalRank > userRank) {
        return res.status(403).json({
          success: false,
          message: "Upgrade your subscription to access this signal.",
          requiredTier: data?.tier,
        });
      }

      return res.json({
        success: true,
        payload: {
          id: doc.id,
          ...data,
          createdAt: data?.createdAt?.toDate().toISOString(),
          updatedAt: data?.updatedAt?.toDate().toISOString(),
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || "Error getting signal",
      });
    }
  },
  adminGetAll: async (req: Request, res: Response) => {
    try {
      const snapshot = await db
        .collection("signals")
        .orderBy("createdAt", "desc")
        .get();

      const signals = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate().toISOString(),
      }));

      return res.json({ success: true, payload: signals });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || "Error fetching all signals",
      });
    }
  },
  createSignal: async (req: Request, res: Response) => {
    try {
      console.log("Creating signal with data:", req.body);
      const {
        pair,
        timeframe,
        direction,
        confidence,
        tier,
        summary,
        entry,
        stopLoss,
        takeProfit,
        chartImageUrl,
        analystNotes,
        status,
      } = req.body;

      const required = {
        pair,
        timeframe,
        direction,
        confidence,
        tier,
        summary,
      };
      for (const [key, val] of Object.entries(required)) {
        if (!val && val !== 0) {
          return res
            .status(400)
            .json({ success: false, message: `${key} is required.` });
        }
      }

      const validTiers = ["explorer", "strategist", "mathematician"];
      if (!validTiers.includes(tier)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid tier." });
      }

      const signal = {
        pair: pair.toUpperCase(),
        timeframe,
        direction, // "Long" | "Short"
        confidence: Number(confidence),
        tier,
        summary,
        entry: entry ?? null,
        stopLoss: stopLoss ?? null,
        takeProfit: takeProfit ?? null,
        chartImageUrl: chartImageUrl ?? null,
        analystNotes: analystNotes ?? null,
        status: status ?? "active", // "active" | "draft" | "closed"
        createdBy: req.user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const ref = await db.collection("signals").add(signal);
      return res.status(201).json({
        success: true,
        payload: { id: ref.id, ...signal },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || "Error creating signal",
      });
    }
  },
  updateSignal: async (req: Request, res: Response) => {
    try {
      const doc = await db
        .collection("signals")
        .doc(req.params.id as string)
        .get();
      if (!doc.exists) {
        return res
          .status(404)
          .json({ success: false, message: "Signal not found." });
      }

      const updates = { ...req.body, updatedAt: new Date() };
      // Sanitise — don't allow overwriting system fields
      delete updates.createdAt;
      delete updates.createdBy;

      await db
        .collection("signals")
        .doc(req.params.id as string)
        .update(updates);
      return res.json({ success: true, message: "Signal updated." });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || "Error updating signal",
      });
    }
  },
  deleteSignal: async (req: Request, res: Response) => {
    try {
      const doc = await db
        .collection("signals")
        .doc(req.params.id as string)
        .get();
      if (!doc.exists) {
        return res
          .status(404)
          .json({ success: false, message: "Signal not found." });
      }

      await db
        .collection("signals")
        .doc(req.params.id as string)
        .update({
          status: "closed",
          updatedAt: new Date(),
        });

      return res.json({ success: true, message: "Signal closed." });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || "Error deleting signal",
      });
    }
  },
};
