import { Request, Response } from "express";
import { db } from "../config/firebase";
import { DEFAULT_TIERS } from "../data/constants";

const seedTiers = async () => {
  const snapshot = await db.collection("tiers").get();
  if (snapshot.empty) {
    const batch = db.batch();
    DEFAULT_TIERS.forEach((tier) => {
      const ref = db.collection("tiers").doc(tier.id);
      batch.set(ref, { ...tier, updatedAt: new Date() });
    });
    await batch.commit();
    console.log("Tiers seeded to Firestore");
  }
};
seedTiers();

export const tierController = {
  getAllTiers: async (req: Request, res: Response) => {
    try {
      const snapshot = await db
        .collection("tiers")
        .orderBy("order", "asc")
        .get();
      const tiers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return res.json({ success: true, payload: tiers });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
  getTierById: async (req: Request, res: Response) => {
    try {
      const doc = await db
        .collection("tiers")
        .doc(req.params.id as string)
        .get();
      if (!doc.exists) {
        return res
          .status(404)
          .json({ success: false, message: "Tier not found." });
      }
      return res.json({
        success: true,
        payload: { id: doc.id, ...doc.data() },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
  updateTier: async (req: Request, res: Response) => {
    try {
      // const { name, description, capabilities, price, order } = req.body;
      const { name, description, capabilities, price } = req.body;

      const doc = await db
        .collection("tiers")
        .doc(req.params.id as string)
        .get();
      if (!doc.exists) {
        return res
          .status(404)
          .json({ success: false, message: "Tier not found." });
      }

      const validCapabilities = [
        "coreSignals",
        "advancedIndicators",
        "analytics",
      ];
      if (capabilities) {
        for (const cap of capabilities) {
          if (!validCapabilities.includes(cap)) {
            return res
              .status(400)
              .json({ success: false, message: `Invalid capability: ${cap}` });
          }
        }
      }

      const updates: any = { updatedAt: new Date() };
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (capabilities !== undefined) updates.capabilities = capabilities;
      if (price !== undefined) updates.price = price;
      // if (order !== undefined) updates.order = order;

      const response = await db
        .collection("tiers")
        .doc(req.params.id as string)
        .update(updates);

      // console.log("Tier updated:", response);

      return res.json({ success: true, message: "Tier updated successfully." });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};
