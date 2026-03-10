import { Router } from "express";
import { signalController } from "../controllers/signal.controller";
import { requireAdmin, validateUser } from "../middleware/auth.middleware";

// routes/signal.routes.js
const signalRoute = Router();

// ── GET /api/v1/signals ────────────────────────────────────────────────────
signalRoute.get("/", validateUser, signalController.getSignals);

// ── GET /api/v1/signals/:id ────────────────────────────────────────────────
signalRoute.get("/:id", validateUser, signalController.getSignal);

// ── GET /api/v1/signals/admin/all ─────────────────────────────────────────
signalRoute.get(
  "/admin/all",
  validateUser,
  requireAdmin,
  signalController.adminGetAll,
);

// ── POST /api/v1/signals ──────────────────────────────────────────────────
signalRoute.post(
  "/",
  validateUser,
  requireAdmin,
  signalController.createSignal,
);

// ── PUT /api/v1/signals/:id ────────────────────────────────────────────────
signalRoute.put(
  "/:id",
  validateUser,
  requireAdmin,
  signalController.updateSignal,
);

// ── DELETE /api/v1/signals/:id ────────────────────────────────────────────
signalRoute.delete(
  "/:id",
  validateUser,
  requireAdmin,
  signalController.deleteSignal,
);

export default signalRoute;
