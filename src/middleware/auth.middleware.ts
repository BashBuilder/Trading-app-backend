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
// export function throttleAction(options: {
//   action: string;
//   limit: number;
//   windowSeconds: number;
//   identifier?: (req: Request) => string;
// }) {
//   return async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const id =
//         options.identifier?.(req) || req.user?.email || req.ip || "unknown";

//       const result = await throttle({
//         action: options.action,
//         identifier: String(id),
//         limit: options.limit,
//         windowSeconds: options.windowSeconds,
//       });

//       if (!result.allowed) {
//         return res.status(429).json({
//           success: false,
//           error: "Too many requests",
//           retryAfter: result.retryAfter,
//         });
//       }
//       next();
//     } catch (err) {
//       console.error("Throttle middleware failed:", err);
//       next();
//     }
//   };
// }

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

    req.user = userData;
    next();
  } catch (err) {
    console.error("validateUser failed:", err);
    return res.status(500).json({
      success: false,
      error: "Authentication failed",
    });
  }
}

export const requireRole =
  (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Forbidden", message: "Access denied", success: false });
    }
    next();
  };
