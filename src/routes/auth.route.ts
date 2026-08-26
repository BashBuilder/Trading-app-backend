import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { requireAdmin, validateUser } from "../middleware/auth.middleware.js";

const authRoute = Router();

// Core auth
authRoute.post("/login", authController.login);
authRoute.post("/register", authController.register);
authRoute.post("/logout", authController.logout);
authRoute.post("/refresh", authController.refreshToken);

// Email verification & password reset (OTP-based)
authRoute.post("/verify-otp", authController.verifyOtp);
authRoute.post("/resend-otp", authController.resendOtp);
authRoute.post("/forgot-password", authController.forgotPassword);
authRoute.post("/reset-password", authController.resetPassword);
authRoute.post("/reactivate", authController.reactivateAccount);

authRoute.post("/deactivate", validateUser, authController.deactivateAccount);

authRoute.get("/user", validateUser, authController.getUser);
authRoute.post("/webhook", authController.getWebhook);
authRoute.get("/users", validateUser, requireAdmin, authController.getAllUsers);

export default authRoute;
