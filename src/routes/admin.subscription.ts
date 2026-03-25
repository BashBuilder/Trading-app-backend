import { Router } from "express";
import { requireAdmin, validateUser } from "../middleware/auth.middleware";
import { subscriptionController } from "../controllers/subscription.controller";

const adminSubscriptionRouter = Router();

adminSubscriptionRouter.get(
  "",
  // validateUser,
  // requireAdmin,
  subscriptionController.adminGetAllSubscriptions,
);
adminSubscriptionRouter.get(
  "/history/:uid",
  validateUser,
  requireAdmin,
  subscriptionController.adminGetUserSubscription,
);
adminSubscriptionRouter.post(
  "",
  validateUser,
  requireAdmin,
  subscriptionController.adminAddUserSubscription,
);
adminSubscriptionRouter.delete(
  "/:uid",
  validateUser,
  requireAdmin,
  subscriptionController.adminCancelUserSubscription,
);

export default adminSubscriptionRouter;
