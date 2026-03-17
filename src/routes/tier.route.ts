// routes/tier.routes.ts
import express, { Request, Response } from "express";
import { requireAdmin, validateUser } from "../middleware/auth.middleware";
import { tierController } from "../controllers/tier.controller";

const tierRoute = express.Router();

tierRoute.get("/", tierController.getAllTiers);
tierRoute.get("/:id", tierController.getTierById);
tierRoute.put("/:id", validateUser, requireAdmin, tierController.updateTier);

export default tierRoute;
