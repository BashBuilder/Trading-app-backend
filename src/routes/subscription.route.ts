import { Router } from "express";
import { subscriptionController } from "../controllers/subscription.controller";
import { requireAdmin, validateUser } from "../middleware/auth.middleware";

const subscriptionRouter = Router();

// Public — returns all available tiers with pricing
subscriptionRouter.get("/tiers", subscriptionController.getTiers);

// ── GET /api/v1/subscriptions/current ──────────────────────────────────────
subscriptionRouter.get(
  "/current",
  validateUser,
  subscriptionController.getCurrentSubscription,
);

// ── POST /api/v1/subscriptions/subscribe ───────────────────────────────────
subscriptionRouter.post(
  "/subscribe",
  validateUser,
  subscriptionController.subscribe,
);

// ── POST /api/v1/subscriptions/cancel ──────────────────────────────────────
subscriptionRouter.post("/cancel", validateUser, subscriptionController.cancel);

subscriptionRouter.get(
  "/admin/subscriptions",
  validateUser,
  requireAdmin,
  subscriptionController.adminGetAllSubscriptions,
);
subscriptionRouter.get(
  "/admin/subscriptions/history/:uid",
  validateUser,
  requireAdmin,
  subscriptionController.adminGetUserSubscription,
);
subscriptionRouter.post(
  "/admin/subscriptions",
  validateUser,
  requireAdmin,
  subscriptionController.adminAddUserSubscription,
);
subscriptionRouter.delete(
  "admin/subscriptions/:uid",
  validateUser,
  requireAdmin,
  subscriptionController.adminCancelUserSubscription,
);
export default subscriptionRouter;
