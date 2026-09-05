import { Router } from "express";
import { subscriptionController } from "../controllers/subscription.controller";
import { requireAdmin, validateUser } from "../middleware/auth.middleware";

const subscriptionRouter = Router();

subscriptionRouter.get("/tiers", subscriptionController.getTiers);

subscriptionRouter.post(
  "/sync",
  validateUser,
  subscriptionController.syncWithRevenueCat,
);

subscriptionRouter.get(
  "/current",
  validateUser,
  subscriptionController.getCurrentSubscription,
);

subscriptionRouter.post(
  "/subscribe",
  validateUser,
  subscriptionController.subscribe,
);

subscriptionRouter.post("/cancel", validateUser, subscriptionController.cancel);

export default subscriptionRouter;
