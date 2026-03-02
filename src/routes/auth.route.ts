import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
// import { throttleAction, validateUser } from "../services/middleware.js";

const authRoute = Router();

authRoute.post(
  "/login",
  // throttleAction({ action: "login", limit: 5, windowSeconds: 300 }),
  authController.login,
);
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
