import { Request, Response, NextFunction } from "express";
// import { throttle } from "../lib/throttle";
import jwt from "jsonwebtoken";
import { db } from "../config/firebase";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const usersCollection = db.collection("users");

export async function validateUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No token" });
    }
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string,
    );
    const userDoc = await usersCollection.doc(decoded.userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, ...userData } = userDoc.data() as any;
    req.user = {
      ...userData,
      uid: decoded.userId,
    };
    next();
  } catch (err) {
    console.error("validateUser failed:", err);
    return res.status(500).json({
      success: false,
      error: "Authentication failed",
    });
  }
}

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    if (!userDoc.exists || userDoc?.data()?.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required." });
    }
    next();
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error checking admin access",
    });
  }
};
