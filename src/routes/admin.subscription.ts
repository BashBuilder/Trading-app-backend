import { Router } from "express";
import subscriptionRouter from "./subscription.route";
import { requireAdmin, validateUser } from "../middleware/auth.middleware";
import { subscriptionController } from "../controllers/subscription.controller";

const adminSubscriptionRouter = Router();

subscriptionRouter.get(
  "",
  validateUser,
  requireAdmin,
  subscriptionController.adminGetAllSubscriptions,
);
subscriptionRouter.get(
  "/history/:uid",
  validateUser,
  requireAdmin,
  subscriptionController.adminGetUserSubscription,
);
subscriptionRouter.post(
  "",
  validateUser,
  requireAdmin,
  subscriptionController.adminAddUserSubscription,
);
subscriptionRouter.delete(
  "/:uid",
  validateUser,
  requireAdmin,
  subscriptionController.adminCancelUserSubscription,
);

export default adminSubscriptionRouter;
