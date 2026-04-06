import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { requireAdmin, validateUser } from "../middleware/auth.middleware.js";

const authRoute = Router();

authRoute.post("/login", authController.login);
authRoute.post("/register", authController.register);
authRoute.post("/logout", authController.logout);

authRoute.get("/user", validateUser, authController.getUser);
authRoute.post("/webhook", authController.getWebhook);
authRoute.get("/users", validateUser, requireAdmin, authController.getAllUsers);
export default authRoute;
