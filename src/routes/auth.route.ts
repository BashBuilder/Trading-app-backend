import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";

const authRoute = Router();

authRoute.post("/login", authController.login);
authRoute.post(
  "/register",
  // throttleAction({ action: "register", limit: 5, windowSeconds: 300 }),
  authController.register,
);
authRoute.post("/logout", authController.logout);

authRoute.get(
  "/user",
  // validateUser,
  authController.getUser,
);
// authRoute.get("/refresh", authController.refreshToken);

// authRoute.post("send-otp", authController.send);

export default authRoute;
