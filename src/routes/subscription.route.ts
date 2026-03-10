import { Router } from "express";
import { subscriptionController } from "../controllers/subscription.controller";
import { validateUser } from "../middleware/auth.middleware";

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

export default subscriptionRouter;
