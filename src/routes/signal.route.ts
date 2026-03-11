import { Router } from "express";
import { signalController } from "../controllers/signal.controller";
import { requireAdmin, validateUser } from "../middleware/auth.middleware";

// routes/signal.routes.js
const signalRoute = Router();

signalRoute.get("/", validateUser, signalController.getSignals);
signalRoute.get("/:id", validateUser, signalController.getSignal);
signalRoute.get(
  "/admin/all",
  validateUser,
  // requireAdmin,
  signalController.adminGetAll,
);
signalRoute.post(
  "/",
  validateUser,
  // requireAdmin,
  signalController.createSignal,
);
signalRoute.put(
  "/:id",
  validateUser,
  // requireAdmin,
  signalController.updateSignal,
);
signalRoute.delete(
  "/:id",
  validateUser,
  // requireAdmin,
  signalController.deleteSignal,
);

export default signalRoute;
