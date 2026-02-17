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
// authRoute.post(
//   "/verify-otp",
//   // throttleAction({ action: "verify-otp", limit: 5, windowSeconds: 300 }),
//   authController.verifyOtp,
// );
// authRoute.post(
//   "/resend-otp",
//   // throttleAction({ action: "resend-otp", limit: 5, windowSeconds: 300 }),
//   authController.resendOtp,
// );
// authRoute.post("/get-otp", authController.getOtp);
authRoute.get(
  "/user",
  // validateUser,
  authController.getUser,
);
// authRoute.get("/refresh", authController.refreshToken);

// authRoute.post("send-otp", authController.send);

export default authRoute;
