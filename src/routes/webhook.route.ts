import { Router } from "express";
import { webhookController } from "../controllers/webhook.controller";

const webhookRoute = Router();

webhookRoute.post("/revenuecat", webhookController.revenuecat);

export default webhookRoute;
